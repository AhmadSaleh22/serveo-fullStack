import { Controller, Get, Post, Body, Param, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PublicService } from './public.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private publicService: PublicService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
  ) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: 'Get sitemap XML' })
  async getSitemap(@Res() res: Response) {
    const restaurants = await this.publicService.getAllRestaurantSlugs();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${restaurants
  .map(
    (r) => `  <url>
    <loc>${baseUrl}/r/${r.slug}</loc>
    <lastmod>${r.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    res.send(sitemap);
  }

  @Get('restaurants/:slug')
  @ApiOperation({ summary: 'Get restaurant by slug (public)' })
  @ApiResponse({ status: 200, description: 'Restaurant with menu' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getRestaurant(@Param('slug') slug: string) {
    return this.publicService.getRestaurantBySlug(slug);
  }

  @Post('restaurants/:slug/orders')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 orders per minute per IP
  @ApiOperation({ summary: 'Create a new order (public)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async createOrder(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicOrderDto,
  ) {
    const restaurantId = await this.publicService.getRestaurantIdBySlug(slug);
    const result = await this.ordersService.createPublicOrder(restaurantId, {
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      address: dto.address,
      notes: dto.notes,
      paymentMethod: dto.paymentMethod,
      items: dto.items,
      orderType: dto.orderType,
      tableNumber: dto.tableNumber,
    });

    // Send SMS notification to restaurant owner (non-blocking)
    this.notificationsService.sendOrderNotification(
      result.restaurant.phone,
      {
        orderNumber: result.order.orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        total: result.order.total,
        currency: result.restaurant.currency,
        itemsCount: dto.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      'ar', // Default to Arabic for Egyptian restaurants
    ).catch(err => console.error('SMS notification failed:', err));

    return result;
  }
}
