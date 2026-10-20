import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  location: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  start: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  end: string;

  @IsBoolean()
  urgent: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  creatorId?: string;

  /** Обязателен для диспетчера ГУП: в какой филиал класть заявку */
  @IsOptional()
  @IsString()
  @MinLength(1)
  branchId?: string;

  /** Конкретная машина по борту/госномеру */
  @IsOptional()
  @IsString()
  @MinLength(1)
  preferredVehicleId?: string;
}
