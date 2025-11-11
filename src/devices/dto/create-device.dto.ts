import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScheduleDto } from './create-schedule.dto';
import { PartialType } from '@nestjs/mapped-types';

export class DeviceConfigurationDto {
  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gramsPerCalorie?: number = 3.3;

  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  @IsArray()
  @IsOptional()
  schedules?: CreateScheduleDto[];
}

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  usersId: string[];

  @ValidateNested()
  @Type(() => DeviceConfigurationDto)
  @IsOptional()
  configuration?: DeviceConfigurationDto;
}

export class UpdateDeviceConfigurationDto extends PartialType(
  DeviceConfigurationDto,
) {}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
  @ValidateNested()
  @Type(() => UpdateDeviceConfigurationDto)
  @IsOptional()
  configuration?: UpdateDeviceConfigurationDto;
}
