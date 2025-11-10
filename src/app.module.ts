import { Module } from '@nestjs/common';
import { GatewayModule } from './websockets/gateway.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { RecordsModule } from './records/records.module';

import dbConfig from './config/db.config';
import jwtConfig from './config/jwt.config';
import googleConfig from './config/googleAuth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [dbConfig, jwtConfig, googleConfig],
    }),
    MongooseModule.forRootAsync(dbConfig.asProvider()),
    GatewayModule,
    UsersModule,
    AuthModule,
    DevicesModule,
    RecordsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
