import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderType, DiscountType, OfferTarget } from '@prisma/client';
import {
  generateOrderNumber,
  calculateOrderTotals,
  formatOrderMessage,
  generateWhatsAppUrl,
} from '@repo/shared';
import type { OrderWithItems, Restaurant } from '@repo/shared';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          items: true,
          appliedOffers: true,
          table: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, restaurantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        restaurant: true,
        appliedOffers: true,
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateStatus(id: string, restaurantId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: true,
      },
    });
  }

  async getWhatsAppMessage(id: string, restaurantId: string, lang: 'ar' | 'en' = 'en') {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        restaurant: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    const messages = formatOrderMessage(
      order as unknown as OrderWithItems,
      order.restaurant as unknown as Restaurant,
    );
    const message = lang === 'ar' ? messages.ar : messages.en;
    const whatsappUrl = generateWhatsAppUrl(order.restaurant.phone, message);

    return {
      message,
      whatsappUrl,
    };
  }

  // Public method for creating orders (used by public module)
  async createPublicOrder(
    restaurantId: string,
    dto: {
      customerName: string;
      customerPhone: string;
      address?: {
        area: string;
        street: string;
        building: string;
        floor?: string;
        apartment?: string;
      };
      notes?: string | null;
      paymentMethod: 'CASH';
      items: { itemId: string; quantity: number }[];
      orderType?: 'DELIVERY' | 'DINE_IN';
      tableNumber?: number;
    },
  ) {
    const orderType = dto.orderType || 'DELIVERY';
    const isDineIn = orderType === 'DINE_IN';

    // Validate based on order type
    if (isDineIn && !dto.tableNumber) {
      throw new BadRequestException('Table number is required for dine-in orders');
    }

    if (!isDineIn && !dto.address) {
      throw new BadRequestException('Address is required for delivery orders');
    }

    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // For dine-in, verify table exists
    let table = null;
    if (isDineIn && dto.tableNumber) {
      table = await this.prisma.table.findUnique({
        where: {
          restaurantId_number: {
            restaurantId,
            number: dto.tableNumber,
          },
        },
      });

      if (!table) {
        throw new BadRequestException(`Table ${dto.tableNumber} not found`);
      }

      if (!table.isActive) {
        throw new BadRequestException(`Table ${dto.tableNumber} is not active`);
      }
    }

    // Fetch all items
    const itemIds = dto.items.map((i) => i.itemId);
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        restaurantId,
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('Some items are not available');
    }

    // Build item map for quick lookup
    const itemMap = new Map(items.map((item) => [item.id, item]));

    // Calculate subtotal
    let subtotal = 0;
    dto.items.forEach((orderItem) => {
      const item = itemMap.get(orderItem.itemId)!;
      subtotal += item.price * orderItem.quantity;
    });

    // Delivery fee is 0 for dine-in orders
    const deliveryFee = isDineIn ? 0 : restaurant.deliveryFee;

    // Calculate applicable offers
    const now = new Date();
    const activeOffers = await this.prisma.offer.findMany({
      where: {
        restaurantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Apply offers and calculate discounts
    let discountTotal = 0;
    const appliedOffers: { offerId: string; offerTitle: string; discountAmount: number }[] = [];

    for (const offer of activeOffers) {
      let applicableAmount = 0;

      if (offer.targetType === OfferTarget.GLOBAL) {
        // Global offer applies to subtotal
        applicableAmount = subtotal;
      } else if (offer.targetType === OfferTarget.CATEGORY && offer.targetCategoryId) {
        // Category offer applies to items in that category
        dto.items.forEach((orderItem) => {
          const item = itemMap.get(orderItem.itemId)!;
          if (item.categoryId === offer.targetCategoryId) {
            applicableAmount += item.price * orderItem.quantity;
          }
        });
      } else if (offer.targetType === OfferTarget.ITEM && offer.targetItemId) {
        // Item offer applies to specific item
        dto.items.forEach((orderItem) => {
          if (orderItem.itemId === offer.targetItemId) {
            const item = itemMap.get(orderItem.itemId)!;
            applicableAmount += item.price * orderItem.quantity;
          }
        });
      }

      if (applicableAmount > 0) {
        let discount = 0;

        if (offer.discountType === DiscountType.PERCENTAGE) {
          discount = (applicableAmount * offer.discountValue) / 100;
        } else if (offer.discountType === DiscountType.FIXED) {
          discount = Math.min(offer.discountValue, applicableAmount);
        }
        // BUNDLE type would require more complex logic

        if (discount > 0) {
          discountTotal += discount;
          appliedOffers.push({
            offerId: offer.id,
            offerTitle: offer.title,
            discountAmount: discount,
          });
        }
      }
    }

    // Calculate final total
    const total = Math.max(0, subtotal + deliveryFee - discountTotal);

    // Check minimum order for delivery only
    if (!isDineIn && subtotal < restaurant.minOrder) {
      throw new BadRequestException(
        `Minimum order amount is ${restaurant.minOrder} ${restaurant.currency}`,
      );
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order with items and applied offers
    const order = await this.prisma.order.create({
      data: {
        restaurantId,
        orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        addressJson: dto.address || {},
        notes: dto.notes || null,
        paymentMethod: dto.paymentMethod,
        subtotal,
        deliveryFee,
        discountTotal,
        total,
        status: 'NEW',
        orderType: orderType as OrderType,
        tableId: table?.id || null,
        tableNumber: dto.tableNumber || null,
        items: {
          create: dto.items.map((orderItem) => {
            const item = itemMap.get(orderItem.itemId)!;
            return {
              itemId: item.id,
              nameSnapshot: item.name,
              nameSnapshotAr: item.nameAr,
              priceSnapshot: item.price,
              quantity: orderItem.quantity,
            };
          }),
        },
        appliedOffers: {
          create: appliedOffers.map((ao) => ({
            offerId: ao.offerId,
            offerTitle: ao.offerTitle,
            discountAmount: ao.discountAmount,
          })),
        },
      },
      include: {
        items: true,
        appliedOffers: true,
        table: true,
      },
    });

    // Generate WhatsApp message
    const messages = formatOrderMessage(
      { ...order, restaurant } as unknown as OrderWithItems,
      restaurant as unknown as Restaurant,
    );

    const whatsappUrl = restaurant.whatsappEnabled
      ? generateWhatsAppUrl(restaurant.phone, messages.en)
      : null;

    return {
      order,
      restaurant,
      messages,
      whatsappUrl,
    };
  }
}
