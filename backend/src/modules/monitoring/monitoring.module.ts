import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WhatsAppModule
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
