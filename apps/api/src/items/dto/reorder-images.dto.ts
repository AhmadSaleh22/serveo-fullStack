import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderImagesDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    description: 'Array of image IDs in the new order',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  imageIds: string[];
}
