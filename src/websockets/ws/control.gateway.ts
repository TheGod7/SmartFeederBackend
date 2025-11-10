import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, WebSocket } from 'ws';
import { WebsocketType, WsService } from './ws.service';
import { ExecutionContext, Req } from '@nestjs/common';
import { wsJWTGuard } from 'src/devices/guard/WsJWT.guard';

@WebSocketGateway(8080, {
  type: 'ws',
  path: '/control',
})
export class ControllerGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly wsService: WsService,
    private readonly wsJwtGuard: wsJWTGuard,
  ) {}

  async handleConnection(client: WebSocket, @Req() req) {
    try {
      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => ({}),
        }),
        switchToWs: () => ({
          getClient: () => client,
          getData: () => ({}),
        }),
        getType: () => 'ws',
      } as ExecutionContext;

      const canActivate = await this.wsJwtGuard.canActivate(context);

      if (!canActivate) {
        throw new Error('Unauthorized');
      }

      await this.wsService.setWebsocket(
        req.user.id,
        client,
        WebsocketType.CONTROL,
      );
    } catch {
      client.close();
    }
  }
}
