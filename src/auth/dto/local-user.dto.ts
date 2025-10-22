import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { OmitType } from '@nestjs/swagger';

export class RegisterDtoBase extends OmitType(CreateUserDto, [
  'password',
  'hashedRefreshToken',
]) {}

export class RegisterDto extends RegisterDtoBase {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  password: string;
}
