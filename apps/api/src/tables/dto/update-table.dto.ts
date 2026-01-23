import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTableDto } from './create-table.dto';

// Exclude 'number' from update - table number shouldn't change
export class UpdateTableDto extends PartialType(
  OmitType(CreateTableDto, ['number'] as const),
) {}
