import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { DevicesService } from '../devices.service';

@Injectable()
export class wsJWTGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const token = req.headers['authorization']
      ? req.headers['authorization'].split(' ')[1]
      : null;

    if (!token) new WsException("You don't have a token");

    const { id } = await this.devicesService.verifyJWT(token);

    if (!id) new WsException('Invalid token');

    const device = await this.devicesService.ValidateJWT(id);

    if (!device) new WsException("You don't have a device");
    req.user = device;

    return true;
  }
}
