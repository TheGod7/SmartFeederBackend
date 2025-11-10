import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Device, DeviceDocument } from './entities/device.entity';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,

    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const alreadyExists = await this.deviceModel.findOne({
      deviceId: createDeviceDto.deviceId,
    });

    if (alreadyExists) {
      throw new ConflictException('Device already exists');
    }

    const usersId = createDeviceDto.usersId;

    if (usersId) {
      for (const userId of usersId) {
        await this.addDeviceToUser(userId, createDeviceDto.deviceId);
      }
    }

    const defaultConfiguration = {
      schedules: [
        { timeOfDay: '08:00', caloriesPerPlate: 100, enabled: true },
        { timeOfDay: '14:00', caloriesPerPlate: 100, enabled: true },
        { timeOfDay: '20:00', caloriesPerPlate: 100, enabled: true },
      ],
    };

    if (!createDeviceDto['configuration']) {
      (createDeviceDto as any).configuration = defaultConfiguration;
    }

    const newDevice = await this.deviceModel.create(createDeviceDto);

    const token = await this.jwtService.signAsync({ id: newDevice._id });

    return {
      id: newDevice._id,
      token,
    };
  }

  async ValidateJWT(id: string) {
    const device = await this.deviceModel.findById(id);

    if (!device) {
      throw new UnauthorizedException('Invalid device');
    }

    return { id: device.deviceId };
  }

  async verifyJWT(token: string) {
    return await this.jwtService.verify(token);
  }

  async validateDevice(deviceId: string, password: string) {
    const device = await this.deviceModel.findOne({ deviceId });

    if (!device) {
      throw new UnauthorizedException('Invalid device');
    }

    const isPasswordCorrect = await bcrypt.compare(password, device.password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid device');
    }

    return { id: device._id };
  }

  async findByDeviceId(deviceId: string) {
    const device = await this.deviceModel.findOne({ deviceId });

    return device;
  }

  async addUserToDeviceWithPassword(
    userId: string,
    deviceId: string,
    password: string,
  ) {
    const device = await this.findByDeviceId(deviceId);
    if (!device) throw new NotFoundException('Device not found');

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordCorrect = await bcrypt.compare(password, device.password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid device password');
    }

    if (user.deviceId.includes(deviceId)) {
      return { message: 'User already added to device' };
    }

    user.deviceId.push(deviceId);

    if (!device.usersId.some((u) => u.toString() === userId)) {
      device.usersId.push(user._id as Types.ObjectId);
    }

    await user.save();
    await device.save();

    return { message: 'User added to device' };
  }

  async removeUserFromDevice(userId: string, deviceId: string) {
    const device = await this.findByDeviceId(deviceId);
    if (!device) throw new NotFoundException('Device not found');

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.deviceId = user.deviceId.filter((d) => d !== deviceId);
    device.usersId = device.usersId.filter((u) => u.toString() !== userId);

    await user.save();
    await device.save();

    return { message: 'User removed from device' };
  }

  async addDeviceToUser(userId: string, deviceId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.deviceId.includes(deviceId)) return;
    user.deviceId.push(deviceId);

    await user.save();
  }

  async list(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const devices = await this.deviceModel.find({
      deviceId: { $in: user.deviceId },
    });

    const filteredDevices = devices.filter((d) =>
      d.usersId.some((uId) => String(uId) === String(user._id)),
    );

    const validDeviceIds = filteredDevices.map((d) => d.deviceId);
    const invalidDeviceIds = user.deviceId.filter(
      (id) => !validDeviceIds.includes(id),
    );

    if (invalidDeviceIds.length > 0) {
      user.deviceId = validDeviceIds;
      await user.save();
    }
    const finalResponse: string[] = [];

    for (const device of filteredDevices) {
      finalResponse.push(device.deviceId);
    }

    return finalResponse;
  }

  async verifyUserDeviceLink(userId: string, deviceId: string) {
    const device = await this.findByDeviceId(deviceId);
    if (!device) throw new NotFoundException('Device not found');

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const userHasDevice = user.deviceId.includes(deviceId);
    const deviceHasUser = device.usersId.some(
      (u) => u.toString() === (user._id as Types.ObjectId).toString(),
    );

    if (!userHasDevice || !deviceHasUser) {
      return false;
    }

    return true;
  }

  async info(deviceId: string) {
    const device = (await this.findByDeviceId(deviceId))?.toObject();
    if (!device) throw new NotFoundException('Device not found');

    return {
      device: {
        deviceId: device.deviceId,
        deviceName: device.name,
        configuration: device.configuration,
      },
    };
  }
}
