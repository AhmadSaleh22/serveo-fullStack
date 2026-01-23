import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateItemDto {
  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Chicken Shawarma' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'شاورما دجاج' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({ example: 'Delicious grilled chicken shawarma' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ example: 'شاورما دجاج مشوية لذيذة' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  descriptionAr?: string | null;

  @ApiPropertyOptional({ example: 75.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'https://example.com/item.jpg' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
