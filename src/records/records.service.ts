import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DailyRecord,
  DailyRecordDocument,
} from './entities/daily-record.entity';
import { Model, Types } from 'mongoose';
import { MealStatus } from './dto/meal-entry.dto';
import { DevicesService } from 'src/devices/devices.service';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(DailyRecord.name)
    private readonly dailyRecordModel: Model<DailyRecordDocument>,
    private readonly deviceService: DevicesService,
  ) {}

  private getDateFromTimeOfDay(timeOfDay: string) {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0,
    );
    if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);
    return date;
  }

  async findByFeederAndDate(feeder: string, date: string) {
    const now = new Date();
    const normalizedDate = (this.dailyRecordModel as any).normalizeDate(
      date || now,
    );

    const device = await this.deviceService.findByDeviceId(feeder);
    if (!device) throw new Error('Device not found');

    let dailyRecord = await this.dailyRecordModel.findOne({
      feeder,
      date: normalizedDate,
    });

    if (!dailyRecord) {
      dailyRecord = new this.dailyRecordModel({
        feeder,
        date: date || now.toISOString(),
        meals: [],
      });

      const schedules = device.configuration.schedules || [];

      dailyRecord.meals = schedules.map((schedule) => ({
        scheduleId: schedule._id as Types.ObjectId,
        caloriesPlanned: schedule.caloriesPerPlate,
        scheduledAt: this.getDateFromTimeOfDay(schedule.timeOfDay),
        status: MealStatus.SCHEDULED,
      }));

      await dailyRecord.save();
    }

    const validMeals = (dailyRecord.meals || [])
      .map((meal) => ({
        ...meal,
        scheduledAt:
          meal.scheduledAt instanceof Date
            ? meal.scheduledAt
            : new Date(meal.scheduledAt),
      }))
      .filter(
        (meal) =>
          meal.status !== MealStatus.SKIPPED &&
          meal.status !== MealStatus.FINISHED &&
          meal.scheduledAt.getTime() > now.getTime(),
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    const nextMeal = validMeals.length > 0 ? validMeals[0] : null;

    return {
      record: {
        date: dailyRecord.date,
        meals: dailyRecord.meals,
        totalCalories: dailyRecord.totalCalories,
        lastUpdate: dailyRecord.updatedAt,
        nextMeal,
      },
    };
  }
}
