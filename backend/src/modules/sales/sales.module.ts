import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SupabaseService } from '../../config/supabase.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService, SupabaseService],
  exports: [SalesService],
})
export class SalesModule {}
