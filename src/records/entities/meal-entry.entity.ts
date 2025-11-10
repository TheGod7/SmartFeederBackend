import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MealStatus } from '../dto/meal-entry.dto';
import { Schedule } from 'src/devices/entities/device.entity';

export type MealDocument = Meal & Document;

@Schema()
export class Meal {
  @Prop({ type: Types.ObjectId, required: true, ref: Schedule.name })
  scheduleId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({ type: Date, default: null })
  dispensedAt?: Date | null;

  @Prop({ type: Date, default: null })
  finishedAt?: Date | null;

  @Prop({ type: Number, default: null, min: 0 })
  consumptionDurationMs?: number | null;

  @Prop({ type: Number, required: true, min: 0 })
  caloriesPlanned: number;

  @Prop({ type: Number, default: 0, min: 0 })
  caloriesConsumed?: number;

  @Prop({
    type: String,
    enum: Object.values(MealStatus),
    default: MealStatus.SCHEDULED,
  })
  status: MealStatus;

  @Prop({ type: String, default: null })
  skipReason?: string | null;

  @Prop({ type: String, default: '' })
  notes?: string;
}

export const MealSchema = SchemaFactory.createForClass(Meal);

MealSchema.pre<MealDocument>('save', function (next) {
  try {
    if (
      this.dispensedAt &&
      this.finishedAt &&
      (this.consumptionDurationMs === null ||
        this.consumptionDurationMs === undefined)
    ) {
      const dur =
        (this.finishedAt.getTime
          ? this.finishedAt.getTime()
          : new Date(this.finishedAt).getTime()) -
        (this.dispensedAt.getTime
          ? this.dispensedAt.getTime()
          : new Date(this.dispensedAt).getTime());
      this.consumptionDurationMs = dur >= 0 ? dur : 0;
    }
    next();
  } catch (err) {
    next(err);
  }
});

MealSchema.methods.markDispensed = function (dispensedAt?: Date) {
  this.dispensedAt = dispensedAt || new Date();
  this.status = MealStatus.DISPENSED;
};

MealSchema.methods.markFinished = function (
  finishedAt?: Date,
  caloriesConsumed?: number | null,
) {
  this.finishedAt = finishedAt || new Date();

  if (typeof caloriesConsumed === 'number')
    this.caloriesConsumed = caloriesConsumed;

  if (this.dispensedAt && this.finishedAt) {
    const dur = this.finishedAt.getTime() - this.dispensedAt.getTime();
    this.consumptionDurationMs = dur >= 0 ? dur : 0;
  }
  this.status = MealStatus.FINISHED;
};
