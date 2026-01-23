import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlanType } from '@prisma/client';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AddImageDto } from './dto/add-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@ApiTags('items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiResponse({ status: 201, description: 'Item created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateItemDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.create(user.restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiResponse({ status: 200, description: 'List of items' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('categoryId') categoryId?: string,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.findAll(user.restaurantId, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiResponse({ status: 200, description: 'Item details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.findOne(id, user.restaurantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateItemDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.update(id, user.restaurantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.remove(id, user.restaurantId);
  }

  @Patch(':id/toggle-availability')
  @ApiOperation({ summary: 'Toggle item availability' })
  @ApiResponse({ status: 200, description: 'Availability toggled' })
  async toggleAvailability(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.toggleAvailability(id, user.restaurantId);
  }

  // ============== IMAGE MANAGEMENT (PRO FEATURE) ==============

  @Get(':id/images')
  @UseGuards(FeatureGuard)
  @RequiresPlan(PlanType.PRO)
  @ApiOperation({ summary: 'Get all images for an item' })
  @ApiResponse({ status: 200, description: 'List of images' })
  async getImages(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.getItemImages(itemId, user.restaurantId);
  }

  @Post(':id/images')
  @UseGuards(FeatureGuard)
  @RequiresPlan(PlanType.PRO)
  @ApiOperation({ summary: 'Add an image to an item' })
  @ApiResponse({ status: 201, description: 'Image added' })
  async addImage(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddImageDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.addImage(
      itemId,
      user.restaurantId,
      dto.url,
      dto.isPrimary,
    );
  }

  @Delete('images/:imageId')
  @UseGuards(FeatureGuard)
  @RequiresPlan(PlanType.PRO)
  @ApiOperation({ summary: 'Delete an image' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  async removeImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.removeImage(imageId, user.restaurantId);
  }

  @Patch('images/:imageId/primary')
  @UseGuards(FeatureGuard)
  @RequiresPlan(PlanType.PRO)
  @ApiOperation({ summary: 'Set an image as primary' })
  @ApiResponse({ status: 200, description: 'Primary image set' })
  async setPrimaryImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.setPrimaryImage(imageId, user.restaurantId);
  }

  @Patch(':id/images/reorder')
  @UseGuards(FeatureGuard)
  @RequiresPlan(PlanType.PRO)
  @ApiOperation({ summary: 'Reorder images for an item' })
  @ApiResponse({ status: 200, description: 'Images reordered' })
  async reorderImages(
    @Param('id') itemId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReorderImagesDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.itemsService.reorderImages(
      itemId,
      user.restaurantId,
      dto.imageIds,
    );
  }
}
