import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferTarget, Prisma } from '@prisma/client';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateOfferDto) {
    // Validate target references
    await this.validateTargetReferences(restaurantId, dto);

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.offer.create({
      data: {
        restaurantId,
        title: dto.title,
        titleAr: dto.titleAr,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        bundleConfig: dto.bundleConfig
          ? (dto.bundleConfig as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        targetType: dto.targetType,
        targetCategoryId: dto.targetCategoryId || null,
        targetItemId: dto.targetItemId || null,
        startDate,
        endDate,
        isActive: dto.isActive ?? true,
      },
      include: {
        targetCategory: {
          select: { id: true, name: true, nameAr: true },
        },
        targetItem: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });
  }

  async findAll(restaurantId: string, activeOnly?: boolean) {
    const where: any = { restaurantId };

    if (activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    return this.prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        targetCategory: {
          select: { id: true, name: true, nameAr: true },
        },
        targetItem: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        targetCategory: {
          select: { id: true, name: true, nameAr: true },
        },
        targetItem: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return offer;
  }

  async update(id: string, restaurantId: string, dto: UpdateOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // Validate target references if they are being updated
    if (dto.targetType || dto.targetCategoryId || dto.targetItemId) {
      await this.validateTargetReferences(restaurantId, {
        targetType: dto.targetType || offer.targetType,
        targetCategoryId: dto.targetCategoryId,
        targetItemId: dto.targetItemId,
      });
    }

    // Validate dates if being updated
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : offer.startDate;
      const endDate = dto.endDate ? new Date(dto.endDate) : offer.endDate;
      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const updateData: Prisma.OfferUpdateInput = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.titleAr !== undefined) updateData.titleAr = dto.titleAr;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.descriptionAr !== undefined) updateData.descriptionAr = dto.descriptionAr;
    if (dto.discountType) updateData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discountValue = dto.discountValue;
    if (dto.bundleConfig !== undefined) {
      updateData.bundleConfig = dto.bundleConfig
        ? (dto.bundleConfig as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (dto.targetType) updateData.targetType = dto.targetType;
    if (dto.targetCategoryId !== undefined) {
      updateData.targetCategory = dto.targetCategoryId
        ? { connect: { id: dto.targetCategoryId } }
        : { disconnect: true };
    }
    if (dto.targetItemId !== undefined) {
      updateData.targetItem = dto.targetItemId
        ? { connect: { id: dto.targetItemId } }
        : { disconnect: true };
    }
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        targetCategory: {
          select: { id: true, name: true, nameAr: true },
        },
        targetItem: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });
  }

  async remove(id: string, restaurantId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.offer.delete({
      where: { id },
    });

    return { message: 'Offer deleted successfully' };
  }

  async toggleActive(id: string, restaurantId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.offer.update({
      where: { id },
      data: { isActive: !offer.isActive },
      include: {
        targetCategory: {
          select: { id: true, name: true, nameAr: true },
        },
        targetItem: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });
  }

  async getActiveOffers(restaurantId: string) {
    const now = new Date();
    return this.prisma.offer.findMany({
      where: {
        restaurantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { discountValue: 'desc' },
      include: {
        targetCategory: {
          select: { id: true, name: true, nameAr: true },
        },
        targetItem: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });
  }

  private async validateTargetReferences(
    restaurantId: string,
    dto: { targetType: OfferTarget; targetCategoryId?: string; targetItemId?: string },
  ) {
    if (dto.targetType === OfferTarget.CATEGORY && dto.targetCategoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.targetCategoryId },
      });
      if (!category || category.restaurantId !== restaurantId) {
        throw new ForbiddenException('Category not found or access denied');
      }
    }

    if (dto.targetType === OfferTarget.ITEM && dto.targetItemId) {
      const item = await this.prisma.item.findUnique({
        where: { id: dto.targetItemId },
      });
      if (!item || item.restaurantId !== restaurantId) {
        throw new ForbiddenException('Item not found or access denied');
      }
    }
  }
}
