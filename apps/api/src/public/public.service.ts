import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isRestaurantOpen } from '@repo/shared';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getRestaurantBySlug(slug: string) {
    const now = new Date();

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
              include: {
                images: {
                  orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                },
              },
            },
          },
        },
        offers: {
          where: {
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
        },
        tables: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          select: { id: true, number: true, name: true },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Add computed isOpen field
    const hoursJson = restaurant.hoursJson as Record<
      string,
      { open: string; close: string; isOpen: boolean }
    >;
    const isOpen = isRestaurantOpen(hoursJson);

    return {
      ...restaurant,
      isOpen,
    };
  }

  async getRestaurantIdBySlug(slug: string): Promise<string> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant.id;
  }

  async getAllRestaurantSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.prisma.restaurant.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
