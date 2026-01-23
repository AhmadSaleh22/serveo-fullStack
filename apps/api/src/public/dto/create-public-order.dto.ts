import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderAddressDto {
  @ApiProperty({ example: 'Maadi' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  area: string;

  @ApiProperty({ example: 'Street 9' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street: string;

  @ApiProperty({ example: '15' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  building: string;

  @ApiPropertyOptional({ example: '3' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional({ example: '5' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  apartment?: string;
}

class OrderItemDto {
  @ApiProperty({ example: 'uuid-of-item' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  DINE_IN = 'DINE_IN',
}

export class CreatePublicOrderDto {
  @ApiProperty({ example: 'Ahmed Mohamed' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ example: '01012345678' })
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Invalid Egyptian phone number (must start with 01)',
  })
  customerPhone: string;

  @ApiPropertyOptional({ type: OrderAddressDto })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  @IsOptional()
  address?: OrderAddressDto;

  @ApiPropertyOptional({ example: 'No onions please' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string | null;

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ enum: OrderType, example: 'DELIVERY', default: 'DELIVERY' })
  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType = OrderType.DELIVERY;

  @ApiPropertyOptional({ example: 5, description: 'Table number for dine-in orders' })
  @IsInt()
  @Min(1)
  @IsOptional()
  tableNumber?: number;
}
