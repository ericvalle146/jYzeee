import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { ChartPeriod } from '../../types/supabase.types';

@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('upsert')
  async upsertCustomer(@Body() customerData: any) {
    return this.customersService.upsertCustomer(customerData);
  }

  @Get('stats')
  async getCustomerStats(@Query('period') period?: ChartPeriod) {
    const validPeriod = period === 'month' ? 'month' : 'day';
    return this.customersService.getCustomerStats(validPeriod);
  }

  @Get(':phoneNumber')
  async getCustomerByPhone(@Param('phoneNumber') phoneNumber: string) {
    return this.customersService.getCustomerByPhone(phoneNumber);
  }
}
