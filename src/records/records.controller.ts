import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { DeviceIdGuard } from 'src/devices/guard/device.guard';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @UseGuards(DeviceIdGuard)
  @Get('/diary')
  async diary(@Query('deviceId') deviceId: string) {
    return await this.recordsService.findByFeederAndDate(
      deviceId,
      new Date().toISOString(),
    );
  }
}
