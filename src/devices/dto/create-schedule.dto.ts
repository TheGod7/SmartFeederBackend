import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Matches,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'timeOfDay debe tener formato HH:mm (24h)',
  })
  timeOfDay: string;

  @IsNumber()
  @Min(0)
  caloriesPerPlate: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;

  @IsString()
  @IsOptional()
  brand?: string;
}

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
