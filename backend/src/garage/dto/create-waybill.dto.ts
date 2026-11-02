import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateWaybillDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestId: number;

  @IsString()
  @Matches(DATE_RE)
  validFrom: string;

  @IsString()
  @Matches(DATE_RE)
  validTo: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99_999_999)
  odometerStart: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99_999_999)
  odometerEnd?: number | null;

  @IsOptional()
  @IsIn(['городское', 'пригородное', 'междугородное'])
  messageKind?: 'городское' | 'пригородное' | 'междугородное';
}
