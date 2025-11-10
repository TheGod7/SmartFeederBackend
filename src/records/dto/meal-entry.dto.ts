import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum MealStatus {
  SCHEDULED = 'scheduled',
  DISPENSED = 'dispensed',
  FINISHED = 'finished',
  SKIPPED = 'skipped',
}

export class MealEntryDto {
  @IsMongoId()
  scheduleId: string;

  @IsDateString()
  scheduledAt: string;

  @IsNumber()
  @Min(0)
  caloriesPlanned: number;
}

export class UpdateMealEntryDto extends PartialType(MealEntryDto) {
  @IsDateString()
  @IsOptional()
  dispensedAt?: string | null;

  @IsDateString()
  @IsOptional()
  finishedAt?: string | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  consumptionDurationMs?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  caloriesConsumed?: number | null;

  @IsEnum(MealStatus)
  @IsOptional()
  status?: MealStatus;

  @IsString()
  @IsOptional()
  skipReason?: string;
}
