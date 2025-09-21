import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { SupabaseService } from '../../config/supabase.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, SupabaseService],
  exports: [CustomersService],
})
export class CustomersModule {}
