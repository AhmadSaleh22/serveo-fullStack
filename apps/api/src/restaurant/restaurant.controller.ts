import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('restaurant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('restaurant')
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant details' })
  async getMyRestaurant(@CurrentUser() user: CurrentUserPayload) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated with this account');
    }
    return this.restaurantService.getMyRestaurant(user.restaurantId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant updated' })
  async updateRestaurant(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateRestaurantDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated with this account');
    }
    return this.restaurantService.updateRestaurant(user.restaurantId, dto);
  }

  @Get('check-slug')
  @ApiOperation({ summary: 'Check if slug is available' })
  @ApiResponse({ status: 200, description: 'Slug availability status' })
  async checkSlug(
    @Query('slug') slug: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.restaurantService.checkSlugAvailability(slug, user.restaurantId || undefined);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get restaurant analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@CurrentUser() user: CurrentUserPayload) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated with this account');
    }
    return this.restaurantService.getAnalytics(user.restaurantId);
  }
}
