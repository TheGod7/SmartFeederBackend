import { forwardRef, Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './entities/device.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { DevicesJwtStrategy } from './strategy/DeviceJWT.strategy';
import { UsersModule } from 'src/users/users.module';
import { wsJWTGuard } from './guard/WsJWT.guard';
import { GatewayModule } from 'src/websockets/gateway.module';
import { RecordsModule } from 'src/records/records.module';

@Module({
  imports: [
    forwardRef(() => GatewayModule),
    forwardRef(() => RecordsModule),
    UsersModule,
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesJwtStrategy, wsJWTGuard],
  exports: [DevicesService, wsJWTGuard],
})
export class DevicesModule {}
