import { CreateUserDto } from '../../users/dto/create-user.dto';
import { OmitType } from '@nestjs/swagger';

export class RegisterDtoBase extends OmitType(CreateUserDto, [
  'hashedRefreshToken',
]) {}

export class RegisterDto extends RegisterDtoBase {}
