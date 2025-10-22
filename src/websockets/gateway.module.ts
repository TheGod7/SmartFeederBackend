import { Module } from '@nestjs/common';

import { SocketIOGateway } from './socket/socketIO.gateway';
import { VideoGateway } from './ws/video.gateway';
import { AudioGateway } from './ws/audio.gateway';
import { ControllerGateway } from './ws/control.gateway';

import { SocketController } from './socket/socket.controller';
import { WsController } from './ws/ws.controller';

@Module({
  providers: [VideoGateway, AudioGateway, ControllerGateway, SocketIOGateway],
  controllers: [SocketController, WsController],
})
export class GatewayModule {}
