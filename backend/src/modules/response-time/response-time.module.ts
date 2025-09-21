import { Module } from '@nestjs/common';
import { ResponseTimeController } from './response-time.controller';
import { ResponseTimeService } from './response-time.service';

@Module({
  controllers: [ResponseTimeController],
  providers: [ResponseTimeService],
  exports: [ResponseTimeService]
})
export class ResponseTimeModule {}
