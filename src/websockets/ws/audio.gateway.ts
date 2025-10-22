import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Server } from 'ws';

@WebSocketGateway(8080, {
  type: 'ws',
  path: '/audio',
})
export class AudioGateway {
  @WebSocketServer()
  server: Server;
}
