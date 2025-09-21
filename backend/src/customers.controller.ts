import { Controller, Get, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('stats')
  async getStats(@Query('period') period: string = 'day') {
    try {
      const stats = await this.customersService.getCustomerStats(period);
      
      return {
        status: 'success',
        data: stats
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: {
          totalCustomers: 0,
          newCustomers: 0,
          activeCustomers: 0,
          period: period,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @Get()
  async getCustomers() {
    try {
      const result = await this.customersService.getAllCustomers();
      
      return {
        status: 'success',
        ...result
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: [],
        total: 0
      };
    }
  }

  @Get('test')
  async testConnection() {
    const isConnected = await this.customersService.testConnection();
    
    return {
      status: isConnected ? 'success' : 'error',
      connected: isConnected,
      message: isConnected ? 'Conexão com Supabase OK' : 'Falha na conexão com Supabase',
      timestamp: new Date().toISOString()
    };
  }

  @Get('chart')
  async getChartData() {
    try {
      const chartData = await this.customersService.getChartData();
      
      return {
        status: 'success',
        message: 'Dados do gráfico obtidos com sucesso',
        data: chartData
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: {
          data: [],
          summary: {
            totalDays: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            totalOrders: 0
          }
        }
      };
    }
  }

  @Get('debug')
  async debugData() {
    try {
      const rawData = await this.customersService.getDebugInfo();
      
      return {
        status: 'success',
        message: 'Dados de debug obtidos com sucesso',
        data: rawData
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }
}
