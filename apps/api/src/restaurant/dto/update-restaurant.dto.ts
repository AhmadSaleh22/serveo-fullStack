import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  IsUrl,
  Matches,
  IsObject,
} from 'class-validator';

export class UpdateRestaurantDto {
  @ApiPropertyOptional({ example: 'My Restaurant' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'مطعمي' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({ example: 'my-restaurant' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: '01012345678' })
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Invalid Egyptian phone number',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  whatsappEnabled?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsUrl({ require_tld: false }, { message: 'logoUrl must be a valid URL' })
  @IsOptional()
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'Cairo, Egypt' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'القاهرة، مصر' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  addressAr?: string;

  @ApiPropertyOptional({
    example: {
      sunday: { open: '10:00', close: '22:00', isOpen: true },
      monday: { open: '10:00', close: '22:00', isOpen: true },
    },
  })
  @IsObject()
  @IsOptional()
  hoursJson?: Record<string, { open: string; close: string; isOpen: boolean }>;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrder?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsString()
  @IsOptional()
  currency?: string;

  // ============== SEO FIELDS ==============

  @ApiPropertyOptional({ example: 'Best Restaurant in Cairo | Delicious Food' })
  @IsString()
  @MaxLength(70)
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'أفضل مطعم في القاهرة | طعام لذيذ' })
  @IsString()
  @MaxLength(70)
  @IsOptional()
  metaTitleAr?: string;

  @ApiPropertyOptional({
    example: 'Order delicious food from our restaurant. Fast delivery in Cairo.',
  })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional({
    example: 'اطلب طعامًا لذيذًا من مطعمنا. توصيل سريع في القاهرة.',
  })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  metaDescriptionAr?: string;

  @ApiPropertyOptional({ example: 'restaurant, food, delivery, cairo, egypt' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({ example: 'مطعم، طعام، توصيل، القاهرة، مصر' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  keywordsAr?: string;
}
