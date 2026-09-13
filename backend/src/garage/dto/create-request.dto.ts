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
  @Matches(/^\d{2}:\d{2}$/)
  start: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end: string;

  @IsBoolean()
  urgent: boolean;
}
