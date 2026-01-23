import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateItemDto) {
    // Verify category belongs to restaurant
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Category not found or access denied');
    }

    return this.prisma.item.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async findAll(restaurantId: string, categoryId?: string) {
    const where: any = { restaurantId };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.prisma.item.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return item;
  }

  async update(id: string, restaurantId: string, dto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // If updating category, verify it belongs to restaurant
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category || category.restaurantId !== restaurantId) {
        throw new ForbiddenException('Category not found or access denied');
      }
    }

    return this.prisma.item.update({
      where: { id },
      data: dto,
      include: {
        category: {
          select: { id: true, name: true, nameAr: true },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });
  }

  async remove(id: string, restaurantId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.item.delete({
      where: { id },
    });

    return { message: 'Item deleted successfully' };
  }

  async toggleAvailability(id: string, restaurantId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.item.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
  }

  // ============== IMAGE MANAGEMENT ==============

  async addImage(
    itemId: string,
    restaurantId: string,
    url: string,
    isPrimary: boolean = false,
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // Get the max sort order for this item
    const maxSortOrder = await this.prisma.itemImage.aggregate({
      where: { itemId },
      _max: { sortOrder: true },
    });

    const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    // If this is the first image or is marked as primary, set it as primary
    const existingImages = await this.prisma.itemImage.count({
      where: { itemId },
    });

    if (isPrimary || existingImages === 0) {
      // Unset any existing primary image
      await this.prisma.itemImage.updateMany({
        where: { itemId, isPrimary: true },
        data: { isPrimary: false },
      });
      isPrimary = true;
    }

    return this.prisma.itemImage.create({
      data: {
        itemId,
        url,
        isPrimary,
        sortOrder,
      },
    });
  }

  async removeImage(imageId: string, restaurantId: string) {
    const image = await this.prisma.itemImage.findUnique({
      where: { id: imageId },
      include: { item: true },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.itemImage.delete({
      where: { id: imageId },
    });

    // If this was the primary image, set the first remaining image as primary
    if (image.isPrimary) {
      const firstImage = await this.prisma.itemImage.findFirst({
        where: { itemId: image.itemId },
        orderBy: { sortOrder: 'asc' },
      });

      if (firstImage) {
        await this.prisma.itemImage.update({
          where: { id: firstImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { message: 'Image deleted successfully' };
  }

  async setPrimaryImage(imageId: string, restaurantId: string) {
    const image = await this.prisma.itemImage.findUnique({
      where: { id: imageId },
      include: { item: true },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // Unset any existing primary image
    await this.prisma.itemImage.updateMany({
      where: { itemId: image.itemId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set the new primary image
    return this.prisma.itemImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  async reorderImages(
    itemId: string,
    restaurantId: string,
    imageIds: string[],
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // Update sort order for each image
    const updates = imageIds.map((imageId, index) =>
      this.prisma.itemImage.update({
        where: { id: imageId },
        data: { sortOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.prisma.itemImage.findMany({
      where: { itemId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async getItemImages(itemId: string, restaurantId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.itemImage.findMany({
      where: { itemId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }
}
