import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Server } from 'ws';

@WebSocketGateway(8080, {
  type: 'ws',
  path: '/control',
})
export class ControllerGateway {
  @WebSocketServer()
  server: Server;
}
