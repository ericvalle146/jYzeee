import { Module, Global } from '@nestjs/common';
import { StructuredLoggingService } from './logging.service';

@Global()
@Module({
  providers: [StructuredLoggingService],
  exports: [StructuredLoggingService],
})
export class LoggingModule {}
