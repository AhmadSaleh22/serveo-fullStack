import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.categoriesService.create(user.restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.categoriesService.findAll(user.restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.categoriesService.findOne(id, user.restaurantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCategoryDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.categoriesService.update(id, user.restaurantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.categoriesService.remove(id, user.restaurantId);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  @ApiResponse({ status: 200, description: 'Categories reordered' })
  async reorder(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReorderCategoriesDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.categoriesService.reorder(user.restaurantId, dto.orders);
  }
}
