import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  isConnected(): boolean {
    return !!this.supabase;
  }

  // Health check
  async testConnection(): Promise<boolean> {
    try {
      if (!this.supabase) return false;
      
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('count(*)')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }
}
