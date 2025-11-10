import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meal, MealSchema } from './meal-entry.entity';
import { Device } from 'src/devices/entities/device.entity';

export type DailyRecordDocument = DailyRecord & Document;

@Schema({ timestamps: true })
export class DailyRecord {
  @Prop({ type: Types.ObjectId, ref: Device.name, required: true, index: true })
  feeder: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({ type: [MealSchema], default: [] })
  meals: Meal[];

  @Prop({ type: Number, default: 0, min: 0 })
  totalCalories: number;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const DailyRecordSchema = SchemaFactory.createForClass(DailyRecord);

DailyRecordSchema.index({ feeder: 1, date: 1 }, { unique: true });

DailyRecordSchema.statics.normalizeDate = function (d: Date | string) {
  const date = d instanceof Date ? new Date(d) : new Date(d);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
};

DailyRecordSchema.pre<DailyRecordDocument>('save', function (next) {
  try {
    const d = this.date;
    if (d) {
      const normalized = (this.constructor as any).normalizeDate(d);
      this.date = normalized;
    }

    const total = (this.meals || []).reduce((acc: number, meal: Meal) => {
      const c =
        typeof meal.caloriesConsumed === 'number' ? meal.caloriesConsumed : 0;
      return acc + (isFinite(c) && c > 0 ? c : 0);
    }, 0);
    this.totalCalories = total;

    next();
  } catch (err) {
    next(err);
  }
});
