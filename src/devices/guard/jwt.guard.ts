import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DevicesJWTGuard extends AuthGuard('DevicesJwtStrategy') {}
