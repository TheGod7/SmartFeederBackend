import { Module } from '@nestjs/common';
import { GatewayModule } from './websockets/gateway.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
