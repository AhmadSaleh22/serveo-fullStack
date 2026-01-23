import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Main Dishes' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'الأطباق الرئيسية' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
