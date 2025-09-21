import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { SupabaseService } from '../../config/supabase.service';

@Module({
  controllers: [DebugController],
  providers: [SupabaseService],
})
export class DebugModule {}
