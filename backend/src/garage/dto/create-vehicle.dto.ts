import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { REQUEST_CATEGORIES } from '../seed.js';

const CATEGORIES = [...REQUEST_CATEGORIES];

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @IsString()
  @IsIn(CATEGORIES)
  category: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  plate: string;

  @IsString()
  @MinLength(1)
  branchId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  capacity?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  driverId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  driverName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  fuel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999_999)
  hours?: number;
}
