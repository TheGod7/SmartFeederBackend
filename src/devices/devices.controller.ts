import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DevicesJWTGuard } from './guard/jwt.guard';
import { JWTGuard } from 'src/auth/guard/jwt/jwt.guard';
import { DeviceIdGuard } from './guard/device.guard';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('create')
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return await this.devicesService.create(createDeviceDto);
  }

  @UseGuards(DevicesJWTGuard)
  @Post('add-user')
  async addUser(
    @Req() req,
    @Body('userId') userId: string,
    @Body('password') password: string,
  ) {
    return await this.devicesService.addUserToDeviceWithPassword(
      userId,
      req.user.id,
      password,
    );
  }

  @UseGuards(DevicesJWTGuard)
  @Post('remove-user')
  async removeUser(@Req() req, @Body('userId') userId: string) {
    return await this.devicesService.removeUserFromDevice(req.user.id, userId);
  }

  @UseGuards(JWTGuard)
  @Get('list')
  async list(@Req() req) {
    return await this.devicesService.list(req.user.id);
  }

  @UseGuards(DeviceIdGuard)
  @Get('feeder')
  async feeder(@Query('deviceId') deviceId: string) {
    return await this.devicesService.info(deviceId);
  }
}
