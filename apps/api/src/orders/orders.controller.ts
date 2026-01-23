import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders (last 30 days)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of orders' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.ordersService.findAll(user.restaurantId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.ordersService.findOne(id, user.restaurantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.ordersService.updateStatus(id, user.restaurantId, dto);
  }

  @Get(':id/whatsapp')
  @ApiOperation({ summary: 'Get WhatsApp message for an order' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ar', 'en'] })
  @ApiResponse({ status: 200, description: 'WhatsApp message and URL' })
  async getWhatsAppMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('lang') lang: 'ar' | 'en' = 'en',
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.ordersService.getWhatsAppMessage(id, user.restaurantId, lang);
  }
}
