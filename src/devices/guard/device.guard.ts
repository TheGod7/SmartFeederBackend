import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { DevicesService } from '../devices.service';
import { JWTGuard } from 'src/auth/guard/jwt/jwt.guard';

@Injectable()
export class DeviceIdGuard extends JWTGuard {
  constructor(private readonly deviceService: DevicesService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const canActivate = await super.canActivate(context);
    if (!canActivate) return false;

    const request = context.switchToHttp().getRequest();
    const deviceId =
      request.body?.deviceId ||
      request.query?.deviceId ||
      request.params?.deviceId;

    const userId = request.user?.id;

    if (!deviceId) throw new UnauthorizedException('Device ID is required');
    if (!userId) throw new UnauthorizedException('User not found in token');

    const validLink = await this.deviceService.verifyUserDeviceLink(
      userId,
      deviceId,
    );

    if (!validLink) {
      throw new UnauthorizedException('User not linked to this device');
    }

    return true;
  }
}
