import { forwardRef, Module } from '@nestjs/common';

import { SocketIOGateway } from './socket/socketIO.gateway';
import { VideoGateway } from './ws/video.gateway';
import { AudioGateway } from './ws/audio.gateway';
import { ControllerGateway } from './ws/control.gateway';

import { SocketService } from './socket/socket.service';
import { WsService } from './ws/ws.service';
import { DevicesModule } from 'src/devices/devices.module';

@Module({
  imports: [forwardRef(() => DevicesModule)],
  exports: [WsService],
  providers: [
    VideoGateway,
    AudioGateway,
    ControllerGateway,
    SocketIOGateway,
    WsService,
    SocketService,
  ],
})
export class GatewayModule {}
