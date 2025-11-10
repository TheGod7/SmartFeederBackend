import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: false, default: null })
  hashedRefreshToken?: string;

  @Prop({ type: [String], default: [] })
  deviceId: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function (next) {
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
