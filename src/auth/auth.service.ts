import {
  BadRequestException,
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

import googleConfig from '../config/googleAuth';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class AuthService {
  private client: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private RefreshJwtConfig: ConfigType<typeof refreshJwtConfig>,
    @Inject(googleConfig.KEY)
    private GoogleConfig: ConfigType<typeof googleConfig>,
  ) {
    this.client = new OAuth2Client();
  }

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

    await this.usersService.update(userID, {
      hashedRefreshToken,
    });

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

  async googleAuth(AuthToken: { idToken: string }) {
    try {
      const ClientsId = [
        this.GoogleConfig.Web_Client_ID,
        this.GoogleConfig.Android_Client_ID,
        this.GoogleConfig.iOS_Client_ID,
      ].filter(Boolean);

      const ticket = await this.client.verifyIdToken({
        idToken: AuthToken.idToken,
        audience: ClientsId,
      });

      const payload: TokenPayload | undefined = ticket.getPayload();

      if (
        !payload ||
        !payload.sub ||
        !payload.email ||
        !payload.email_verified ||
        !ClientsId.includes(payload.aud) ||
        !['accounts.google.com', 'https://accounts.google.com'].includes(
          payload.iss,
        )
      ) {
        throw new UnauthorizedException('Invalid Google ID Token');
      }

      const userEmail = payload.email;
      let user = await this.usersService.findByEmail(userEmail);

      if (!user) {
        user = await this.usersService.create({ email: userEmail });
      }

      const { token, refreshToken } = await this.refresh(user.id);

      return {
        id: user.id,
        token,
        refreshToken,
        hasPassword: Boolean(user.password),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google ID Token');
    }
  }

  async changePassword(userID: string, newPassword: string) {
    if (!newPassword) {
      throw new BadRequestException('Password is required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    const user = await this.usersService.findById(userID);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.password = newPassword;
    await user.save();

    return {
      id: userID,
      message: 'Password updated successfully',
    };
  }
}
