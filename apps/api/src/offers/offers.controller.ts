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
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@ApiTags('offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureGuard)
@RequiresPlan(PlanType.PRO)
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiResponse({ status: 201, description: 'Offer created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOfferDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.offersService.create(user.restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offers' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of offers' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.offersService.findAll(
      user.restaurantId,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an offer by ID' })
  @ApiResponse({ status: 200, description: 'Offer details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.offersService.findOne(id, user.restaurantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an offer' })
  @ApiResponse({ status: 200, description: 'Offer updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateOfferDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.offersService.update(id, user.restaurantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an offer' })
  @ApiResponse({ status: 200, description: 'Offer deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.offersService.remove(id, user.restaurantId);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle offer active status' })
  @ApiResponse({ status: 200, description: 'Offer status toggled' })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.offersService.toggleActive(id, user.restaurantId);
  }
}
