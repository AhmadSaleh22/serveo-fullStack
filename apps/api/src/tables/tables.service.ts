import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateTableDto) {
    // Check if table number already exists for this restaurant
    const existing = await this.prisma.table.findUnique({
      where: {
        restaurantId_number: {
          restaurantId,
          number: dto.number,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Table number ${dto.number} already exists for this restaurant`,
      );
    }

    return this.prisma.table.create({
      data: {
        restaurantId,
        number: dto.number,
        name: dto.name,
        capacity: dto.capacity ?? 4,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(restaurantId: string, activeOnly?: boolean) {
    const where: any = { restaurantId };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.prisma.table.findMany({
      where,
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return table;
  }

  async update(id: string, restaurantId: string, dto: UpdateTableDto) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.table.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, restaurantId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.table.delete({
      where: { id },
    });

    return { message: 'Table deleted successfully' };
  }

  async toggleActive(id: string, restaurantId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.table.update({
      where: { id },
      data: { isActive: !table.isActive },
    });
  }

  async getQrCodeUrl(id: string, restaurantId: string, frontendUrl: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { slug: true },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    // Generate the URL for the menu with table parameter
    const menuUrl = `${frontendUrl}/r/${table.restaurant.slug}?table=${table.number}`;

    // Use a QR code API (Google Charts API or similar)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;

    // Optionally save the QR code URL if not already saved
    if (!table.qrCodeUrl) {
      await this.prisma.table.update({
        where: { id },
        data: { qrCodeUrl },
      });
    }

    return {
      tableNumber: table.number,
      menuUrl,
      qrCodeUrl,
    };
  }

  async bulkCreate(
    restaurantId: string,
    startNumber: number,
    count: number,
    capacity: number = 4,
  ) {
    const tables = [];

    for (let i = 0; i < count; i++) {
      const tableNumber = startNumber + i;

      // Check if table already exists
      const existing = await this.prisma.table.findUnique({
        where: {
          restaurantId_number: {
            restaurantId,
            number: tableNumber,
          },
        },
      });

      if (!existing) {
        tables.push({
          restaurantId,
          number: tableNumber,
          capacity,
          isActive: true,
        });
      }
    }

    if (tables.length === 0) {
      return { created: 0, message: 'All table numbers already exist' };
    }

    await this.prisma.table.createMany({
      data: tables,
    });

    return {
      created: tables.length,
      message: `Created ${tables.length} tables`,
    };
  }
}
