import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DevicesService } from 'src/devices/devices.service';
import { DeviceConfiguration } from 'src/devices/entities/device.entity';
import { MealStatus } from 'src/records/dto/meal-entry.dto';
import { WebSocket } from 'ws';

export enum ServerToClientCommand {
  SCHEDULE = 'schedule',
  CHANGE_SCHEDULE = 'change_schedule',
}

export enum ClientToServerCommand {
  SET_SCHEDULE_STATUS = 'set_schedule_status',
  SET_DEPOSIT = 'set_deposit_status',
  SET_CAT_PRESENCE = 'set_cat_presence',
  NEW_DAILY_RECORD = 'new_daily_record',
}

export enum WebsocketType {
  CONTROL = 'control',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export type WSCommandDataMap = {
  [ServerToClientCommand.SCHEDULE]: DeviceConfiguration;
  [ServerToClientCommand.CHANGE_SCHEDULE]: DeviceConfiguration;
  [ClientToServerCommand.SET_SCHEDULE_STATUS]: {
    id: string;
    status: MealStatus;
  };
  [ClientToServerCommand.SET_DEPOSIT]: number;
  [ClientToServerCommand.SET_CAT_PRESENCE]: boolean;
  [ClientToServerCommand.NEW_DAILY_RECORD]: boolean;
};

export type WSCommand<
  C extends keyof WSCommandDataMap = keyof WSCommandDataMap,
> = {
  command: C;
  data: WSCommandDataMap[C];
};

export interface AliveWebSocket extends WebSocket {
  isAlive: boolean;
}

export interface DeviceWebsocket {
  controller?: AliveWebSocket;
  video?: AliveWebSocket;
  audio?: AliveWebSocket;
}

@Injectable()
export class WsService implements OnModuleInit, OnModuleDestroy {
  private sockets = new Map<string, DeviceWebsocket>();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(private readonly devicesService: DevicesService) {}

  onModuleInit() {
    this.startHeartbeat();
  }

  onModuleDestroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  async setWebsocket(deviceId: string, ws: WebSocket, type: WebsocketType) {
    let deviceWs = this.sockets.get(deviceId);
    if (!deviceWs) {
      deviceWs = {};
    }

    const aliveSocket = ws as AliveWebSocket;
    aliveSocket.isAlive = true;

    aliveSocket.on('pong', () => {
      aliveSocket.isAlive = true;
    });

    aliveSocket.on('close', () => {
      this.deleteWebsocket(deviceId, type);
    });

    switch (type) {
      case WebsocketType.CONTROL:
        deviceWs.controller = aliveSocket;
        break;
      case WebsocketType.VIDEO:
        deviceWs.video = aliveSocket;
        break;
      case WebsocketType.AUDIO:
        deviceWs.audio = aliveSocket;
        break;
    }

    this.sockets.set(deviceId, deviceWs);

    console.log(`🔺 WebSocket conectado (${type}) → ${deviceId}`);

    const config = await this.devicesService.info(deviceId);

    const data: WSCommandDataMap[ServerToClientCommand.SCHEDULE] = {
      ...config.device.configuration,
    };

    ws.send(
      JSON.stringify({
        command: ServerToClientCommand.SCHEDULE,
        data,
      } as WSCommand<ServerToClientCommand.SCHEDULE>),
    );
  }

  deleteWebsocket(deviceId: string, type: WebsocketType) {
    const deviceWs = this.sockets.get(deviceId);
    if (!deviceWs) return;

    switch (type) {
      case WebsocketType.CONTROL:
        deviceWs.controller = undefined;
        break;
      case WebsocketType.VIDEO:
        deviceWs.video = undefined;
        break;
      case WebsocketType.AUDIO:
        deviceWs.audio = undefined;
        break;
    }

    if (!deviceWs.controller && !deviceWs.video && !deviceWs.audio) {
      this.sockets.delete(deviceId);
    } else {
      this.sockets.set(deviceId, deviceWs);
    }

    console.log(`🔻 WebSocket eliminado (${type}) → ${deviceId}`);
  }

  getWebsocket(
    deviceId: string,
    type: WebsocketType,
  ): AliveWebSocket | undefined {
    const deviceWs = this.sockets.get(deviceId);
    if (!deviceWs) return undefined;

    switch (type) {
      case WebsocketType.CONTROL:
        return deviceWs.controller;
      case WebsocketType.VIDEO:
        return deviceWs.video;
      case WebsocketType.AUDIO:
        return deviceWs.audio;
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sockets.forEach((deviceWs, deviceId) => {
        Object.entries(deviceWs).forEach(([key, ws]) => {
          if (!ws) return;

          const typeMap: Record<string, WebsocketType> = {
            controller: WebsocketType.CONTROL,
            video: WebsocketType.VIDEO,
            audio: WebsocketType.AUDIO,
          };

          const type = typeMap[key];
          if (!type) return;

          if (!ws.isAlive) {
            ws.terminate();
            this.deleteWebsocket(deviceId, type);
            return;
          }

          ws.isAlive = false;
          try {
            ws.ping();
          } catch {
            ws.terminate();
            this.deleteWebsocket(deviceId, type);
          }
        });
      });
    }, 10000);
  }
}
