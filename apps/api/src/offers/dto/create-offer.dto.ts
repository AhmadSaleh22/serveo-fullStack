import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { DiscountType, OfferTarget } from '@prisma/client';

export class BundleConfigDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  buyQty: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  getQty: number;

  @ApiPropertyOptional({ example: 'uuid-of-item' })
  @IsUUID()
  @IsOptional()
  itemId?: string;
}

export class CreateOfferDto {
  @ApiProperty({ example: 'Summer Sale - 20% Off!' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'تخفيضات الصيف - خصم 20%!' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  titleAr?: string;

  @ApiPropertyOptional({ example: 'Get 20% off on all items this summer!' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'احصل على خصم 20% على جميع الأصناف هذا الصيف!' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({ enum: DiscountType, example: 'PERCENTAGE' })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 20, description: 'Percentage (0-100) or fixed amount' })
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discountType === 'PERCENTAGE')
  @Max(100)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Bundle configuration for BUNDLE discount type' })
  @IsObject()
  @IsOptional()
  bundleConfig?: BundleConfigDto;

  @ApiProperty({ enum: OfferTarget, example: 'GLOBAL' })
  @IsEnum(OfferTarget)
  targetType: OfferTarget;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.targetType === 'CATEGORY')
  targetCategoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-item' })
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.targetType === 'ITEM')
  targetItemId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
