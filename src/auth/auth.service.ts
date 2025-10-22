import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/local-user.dto';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { JwtPayload } from './strategy/JWT.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private RefreshJwtConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async LocalRegister(user: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(user.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const newUser = await this.usersService.create(user);

    return await this.refresh(newUser.id);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Incorrect password');
    }

    return { id: user._id };
  }

  async generateTokens(userID: string) {
    const payload: JwtPayload = { id: userID };
    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.RefreshJwtConfig),
    ]);

    return {
      token,
      refreshToken,
    };
  }

  async login(userID: string) {
    const { token, refreshToken } = await this.generateTokens(userID);
    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.usersService.update(userID, { hashedRefreshToken });

    return {
      id: userID,
      token,
      refreshToken,
    };
  }

  async refresh(userID: string) {
    const { token, refreshToken } = await this.generateTokens(userID);
    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.usersService.update(userID, { hashedRefreshToken });

    return {
      id: userID,
      token,
      refreshToken,
    };
  }

  async ValidateRefreshToken(userID: string, refreshToken: string) {
    const user = await this.usersService.findById(userID);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('INvalid refresh token');
    }

    const isValid = await argon2.verify(user.hashedRefreshToken, refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { id: userID };
  }

  async singOut(userID: string) {
    await this.usersService.update(userID, { hashedRefreshToken: undefined });
  }
}
