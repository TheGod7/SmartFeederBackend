import { forwardRef, Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyRecord, DailyRecordSchema } from './entities/daily-record.entity';
import { DevicesModule } from 'src/devices/devices.module';

@Module({
  imports: [
    forwardRef(() => DevicesModule),
    MongooseModule.forFeature([
      { name: DailyRecord.name, schema: DailyRecordSchema },
    ]),
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
