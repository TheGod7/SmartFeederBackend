import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealEntryDto } from './meal-entry.dto';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDailyRecordDto {
  @IsMongoId()
  @IsNotEmpty()
  feeder: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealEntryDto)
  meals: MealEntryDto[];
}

export class UpdateDailyRecordDto extends PartialType(CreateDailyRecordDto) {}
