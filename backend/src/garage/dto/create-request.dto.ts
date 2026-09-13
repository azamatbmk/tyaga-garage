import {
  IsBoolean,
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
}
