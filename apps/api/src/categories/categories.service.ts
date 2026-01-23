import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return category;
  }

  async update(id: string, restaurantId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, restaurantId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  async reorder(restaurantId: string, categoryOrders: { id: string; sortOrder: number }[]) {
    const updates = categoryOrders.map(({ id, sortOrder }) =>
      this.prisma.category.updateMany({
        where: { id, restaurantId },
        data: { sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll(restaurantId);
  }
}
