import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

export type JwtPayload = {
  id: string;
};

@Injectable()
export class RefreshJWTStrategy extends PassportStrategy(
  Strategy,
  'refreshJwt',
) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private RefreshJWTConfig: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: RefreshJWTConfig.secret as string,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.headers['authorization']
      ?.replace('Bearer', '')
      .trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.authService.ValidateRefreshToken(payload.id, refreshToken);
  }
}
