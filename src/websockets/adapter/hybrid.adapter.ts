import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { WsAdapter } from '@nestjs/platform-ws';
import { ServerOptions } from 'socket.io';

export class HybridAdapter extends IoAdapter {
  readonly wsAdapter: WsAdapter;

  constructor(app: INestApplication) {
    super(app);
    this.wsAdapter = new WsAdapter(app);
  }
  create(port: number, _options: Record<string, any> = {}): any {
    if (_options.type === 'ws') {
      return this.wsAdapter.create(port, _options);
    }

    return super.create(port, _options as ServerOptions);
  }
}
