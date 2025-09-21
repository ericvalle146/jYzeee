import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'JYZE.AI Backend',
      version: '1.0.0'
    };
  }

  @Get()
  getRoot() {
    return {
      message: 'JYZE.AI Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        messages: '/api/messages',
        customers: '/api/customers',
        orders: '/orders',
        n8n: '/n8n'
      }
    };
  }
}
