import { Controller, Get, Post, HttpStatus, HttpException } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { StructuredLoggingService } from '../logging/logging.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@Controller('api/monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly logger: StructuredLoggingService
  ) {}

  /**
   * Get monitoring system status and statistics
   * GET /api/monitoring/status
   */
  @Get('status')
  async getMonitoringStatus(): Promise<ApiResponse<any>> {
    this.logger.log('📊 Monitoring status requested', {
      operation: 'monitoring-status'
    });

    try {
      const stats = this.monitoringService.getMonitoringStats();
      
      return {
        success: true,
        message: 'Monitoring status retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Error retrieving monitoring status', error, {
        operation: 'monitoring-status'
      });
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve monitoring status',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Trigger manual health check
   * POST /api/monitoring/health-check
   */
  @Post('health-check')
  async triggerHealthCheck(): Promise<ApiResponse<any>> {
    this.logger.log('🔍 Manual health check triggered', {
      operation: 'manual-health-check'
    });

    try {
      const healthData = await this.monitoringService.triggerManualHealthCheck();
      
      return {
        success: true,
        message: 'Health check completed successfully',
        data: healthData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Manual health check failed', error, {
        operation: 'manual-health-check'
      });
      
      throw new HttpException(
        {
          success: false,
          message: 'Health check failed',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Test alert system
   * POST /api/monitoring/test-alert
   */
  @Post('test-alert')
  async testAlertSystem(): Promise<ApiResponse<any>> {
    this.logger.log('🧪 Alert system test triggered', {
      operation: 'test-alert-system'
    });

    try {
      await this.monitoringService.testAlertSystem();
      
      return {
        success: true,
        message: 'Test alert sent successfully',
        data: {
          message: 'Check your configured alert channels for the test message'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Alert system test failed', error, {
        operation: 'test-alert-system'
      });
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send test alert',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
