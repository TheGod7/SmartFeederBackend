import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import {
  CreateDeviceDto,
  UpdateDeviceConfigurationDto,
} from './dto/create-device.dto';
import { DevicesJWTGuard } from './guard/jwt.guard';
import { JWTGuard } from 'src/auth/guard/jwt/jwt.guard';
import { DeviceIdGuard } from './guard/device.guard';
import { CreateScheduleDto } from './dto/create-schedule.dto';

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

  @Get('brands')
  brands() {
    return this.devicesService.AllBrands();
  }

  @Get('brands/:id')
  brand(@Param('id') id: string) {
    return this.devicesService.getFoodById(id);
  }

  @UseGuards(DeviceIdGuard)
  @Post('change/config')
  changeConfig(
    @Body() changeConfigDto: UpdateDeviceConfigurationDto,
    @Query('deviceId') deviceId: string,
  ) {
    return this.devicesService.changeConfig(changeConfigDto, deviceId);
  }

  @UseGuards(DeviceIdGuard)
  @Post('add/schedule')
  async addSchedule(
    @Body() scheduleDto: CreateScheduleDto,
    @Query('deviceId') deviceId: string,
  ) {
    return await this.devicesService.addSchedule(deviceId, scheduleDto);
  }
  @UseGuards(DeviceIdGuard)
  @Delete('remove/schedule/:indentifier')
  async removeSchedule(
    @Param('indentifier') schedule: string,
    @Query('deviceId') deviceId: string,
  ) {
    return await this.devicesService.removeSchedule(deviceId, schedule);
  }
}
