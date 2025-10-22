import {
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsString,
  MinLength,
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
}
