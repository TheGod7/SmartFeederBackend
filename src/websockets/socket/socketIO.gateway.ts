import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  type: 'socketIO',
  namespace: 'hola',
})
export class SocketIOGateway {
  @WebSocketServer()
  server: Server;
}
