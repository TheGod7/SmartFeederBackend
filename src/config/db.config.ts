import { registerAs } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export default registerAs(
  'db',
  (): MongooseModuleFactoryOptions => ({
    uri: process.env.MONGODB_URI,
  }),
);
