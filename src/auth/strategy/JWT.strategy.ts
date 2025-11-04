import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Inject } from '@nestjs/common';
import jwtConfig from 'src/config/jwt.config';
import { AuthService } from '../auth.service';

export type JwtPayload = {
  id: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY) private JWTConfig: ConfigType<typeof jwtConfig>,
    private AuthService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWTConfig.secret as string,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    return this.AuthService.validateJWT(payload.id);
  }
}
