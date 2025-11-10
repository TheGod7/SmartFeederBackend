import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Inject } from '@nestjs/common';
import jwtConfig from 'src/config/jwt.config';
import { DevicesService } from '../devices.service';

export type JwtPayload = {
  id: string;
};

@Injectable()
export class DevicesJwtStrategy extends PassportStrategy(
  Strategy,
  'DevicesJwtStrategy',
) {
  constructor(
    @Inject(jwtConfig.KEY) private JWTConfig: ConfigType<typeof jwtConfig>,
    private deviceService: DevicesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWTConfig.secret as string,
    });
  }

  validate(payload: JwtPayload) {
    return this.deviceService.ValidateJWT(payload.id);
  }
}
