import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Server } from 'ws';

@WebSocketGateway(8080, {
  type: 'ws',
  path: '/video',
})
export class VideoGateway {
  @WebSocketServer()
  server: Server;
}
