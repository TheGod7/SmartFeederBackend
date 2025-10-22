import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

export default registerAs(
  'refreshJwt',
  (): JwtSignOptions => ({
    secret: process.env.REFRESH_JWT_SECRET as string,
    expiresIn: (process.env.REFRESH_JWT_EXPIRES_IN || '1d') as any,
  }),
);
