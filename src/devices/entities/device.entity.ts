import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

export type DeviceDocument = Device & Document;

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

@Schema({ _id: true })
export class Schedule {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  timeOfDay: string;

  @Prop({ required: true, min: 0 })
  caloriesPerPlate: number;

  @Prop({ required: false, default: true })
  enabled?: boolean;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

@Schema()
export class DeviceConfiguration {
  @Prop({ required: false })
  brand?: string;

  @Prop({ type: [ScheduleSchema], default: [] })
  schedules: Schedule[];
}

export const DeviceConfigurationSchema =
  SchemaFactory.createForClass(DeviceConfiguration);

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true, ref: User.name, type: [Types.ObjectId] })
  usersId: Types.ObjectId[];

  @Prop({ type: DeviceConfigurationSchema, default: () => ({ schedules: [] }) })
  configuration: DeviceConfiguration;
}
export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.pre<DeviceDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (!this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
