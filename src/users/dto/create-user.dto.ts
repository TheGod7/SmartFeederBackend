import {
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hashedRefreshToken?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deviceId?: string[];
}
