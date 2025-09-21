import { Controller, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { ChartPeriod } from '../../types/supabase.types';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('stats')
  async getSalesStats(@Query('period') period?: ChartPeriod) {
    // Validar período - aceitar day, week, month, year
    const validPeriods: ChartPeriod[] = ['day', 'week', 'month', 'year'];
    const validPeriod = validPeriods.includes(period as ChartPeriod) ? period as ChartPeriod : 'day';
    
    return this.salesService.getSalesStats(validPeriod);
  }
}
