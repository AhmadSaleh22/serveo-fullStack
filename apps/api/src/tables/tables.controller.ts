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
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlanType } from '@prisma/client';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureGuard)
@RequiresPlan(PlanType.PREMIUM)
@Controller('tables')
export class TablesController {
  constructor(
    private tablesService: TablesService,
    private configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({ status: 201, description: 'Table created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTableDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.create(user.restaurantId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple tables at once' })
  @ApiResponse({ status: 201, description: 'Tables created' })
  async bulkCreate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { startNumber: number; count: number; capacity?: number },
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.bulkCreate(
      user.restaurantId,
      body.startNumber,
      body.count,
      body.capacity,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all tables' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of tables' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.findAll(
      user.restaurantId,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a table by ID' })
  @ApiResponse({ status: 200, description: 'Table details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.findOne(id, user.restaurantId);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for a table' })
  @ApiResponse({ status: 200, description: 'QR code URL and menu link' })
  async getQrCode(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return this.tablesService.getQrCodeUrl(id, user.restaurantId, frontendUrl);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a table' })
  @ApiResponse({ status: 200, description: 'Table updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateTableDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.update(id, user.restaurantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a table' })
  @ApiResponse({ status: 200, description: 'Table deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.remove(id, user.restaurantId);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle table active status' })
  @ApiResponse({ status: 200, description: 'Table status toggled' })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant associated');
    }
    return this.tablesService.toggleActive(id, user.restaurantId);
  }
}
