import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 1, description: 'Table number (unique per restaurant)' })
  @IsNumber()
  @Min(1)
  @Max(999)
  number: number;

  @ApiPropertyOptional({ example: 'Window Table', description: 'Optional table name/label' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 4, description: 'Seating capacity' })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  capacity?: number = 4;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
