import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { slugSchema } from '@repo/shared';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async getMyRestaurant(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async updateRestaurant(restaurantId: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Check slug uniqueness if updating
    if (dto.slug && dto.slug !== restaurant.slug) {
      // Validate slug format
      const slugResult = slugSchema.safeParse(dto.slug);
      if (!slugResult.success) {
        throw new ConflictException('Invalid slug format');
      }

      const existingSlug = await this.prisma.restaurant.findUnique({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('Slug already taken');
      }
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
    });
  }

  async checkSlugAvailability(slug: string, excludeId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      return { available: true };
    }

    if (excludeId && restaurant.id === excludeId) {
      return { available: true };
    }

    return { available: false };
  }

  async getAnalytics(restaurantId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalOrders, totalRevenue, todayOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELED' },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELED' },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: startOfDay },
          status: { not: 'CANCELED' },
        },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayOrders,
    };
  }
}
