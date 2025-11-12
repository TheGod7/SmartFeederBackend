import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
    @Inject(forwardRef(() => DevicesService))
    private readonly deviceService: DevicesService,
  ) {}

  private normalizeDateToServerLocal(date: Date | string): Date {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private getServerLocalDateFromTimeOfDay(
    timeOfDay: string,
    baseDate: Date,
  ): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      0,
      0,
    );
  }

  async findByFeederAndDate(feeder: string, date?: string) {
    const nowLocal = new Date();

    const normalizedDateLocal = this.normalizeDateToServerLocal(
      date || nowLocal,
    );

    const device = await this.deviceService.findByDeviceId(feeder);
    if (!device) throw new Error('Device not found');

    let dailyRecord = await this.dailyRecordModel.findOne({
      feeder,
      date: new Date(normalizedDateLocal),
    });

    if (!dailyRecord) {
      const schedules = device.configuration.schedules || [];

      const meals = schedules.map((schedule) => ({
        scheduleId: schedule._id as Types.ObjectId,
        caloriesPlanned: schedule.caloriesPerPlate,
        scheduledAt: this.getServerLocalDateFromTimeOfDay(
          schedule.timeOfDay,
          normalizedDateLocal,
        ),
        status: MealStatus.SCHEDULED,
      }));

      dailyRecord = new this.dailyRecordModel({
        feeder,
        date: normalizedDateLocal,
        meals,
      });

      await dailyRecord.save();
    }

    const meals = (dailyRecord.meals || []).map((meal) => ({
      ...meal,
      scheduledAt:
        meal.scheduledAt instanceof Date
          ? meal.scheduledAt
          : new Date(meal.scheduledAt),
    }));

    const validMeals = meals
      .filter(
        (meal) =>
          meal.status !== MealStatus.SKIPPED &&
          meal.status !== MealStatus.FINISHED &&
          meal.scheduledAt.getTime() > nowLocal.getTime(),
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    const nextMeal = validMeals.length > 0 ? validMeals[0] : null;

    return {
      record: {
        date: dailyRecord.date,
        meals: meals,
        totalCalories: dailyRecord.totalCalories,
        lastUpdate: dailyRecord.updatedAt,
        nextMeal,
      },
    };
  }

  async updateDailyRecordsForDevice(deviceId: string) {
    const device = await this.deviceService.findByDeviceId(deviceId);
    if (!device) throw new Error('Device not found');

    const nowLocal = new Date();
    const todayLocal = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      nowLocal.getDate(),
    );

    const records = await this.dailyRecordModel.find({
      feeder: deviceId,
      date: { $gte: todayLocal },
    });

    for (const record of records) {
      const updatedMeals: typeof record.meals = [];

      for (const schedule of device.configuration.schedules) {
        const scheduledAt = this.getServerLocalDateFromTimeOfDay(
          schedule.timeOfDay,
          record.date,
        );

        const existingMeal = record.meals.find(
          (meal) => meal.scheduleId.toString() === String(schedule._id),
        );

        if (existingMeal) {
          if (existingMeal.status === MealStatus.SCHEDULED) {
            existingMeal.caloriesPlanned = schedule.caloriesPerPlate;
            existingMeal.scheduledAt = scheduledAt;
          }

          updatedMeals.push(existingMeal as any);
        } else {
          updatedMeals.push({
            scheduleId: schedule._id,
            caloriesPlanned: schedule.caloriesPerPlate,
            scheduledAt,
            status: MealStatus.SCHEDULED,
          } as any);
        }
      }

      record.meals = updatedMeals;
      await record.save();
    }
  }
}
