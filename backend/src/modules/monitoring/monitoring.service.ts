import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { StructuredLoggingService } from '../logging/logging.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

export interface AlertChannel {
  type: 'slack' | 'discord' | 'email' | 'webhook';
  url: string;
  enabled: boolean;
}

export interface MonitoringAlert {
  instanceName: string;
  clientId: string;
  alertType: 'disconnection' | 'connection_failure' | 'health_check_failure';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly alertChannels: AlertChannel[] = [];
  private readonly instanceHealthHistory = new Map<string, boolean[]>();
  private readonly MAX_HEALTH_HISTORY = 10;
  private isMonitoringActive = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappService: WhatsAppService,
    private readonly logger: StructuredLoggingService
  ) {}

  onModuleInit() {
    this.initializeAlertChannels();
    this.logger.log('🔔 Monitoring Service initialized', {
      operation: 'monitoring-init',
      alertChannelsCount: this.alertChannels.length
    });
  }

  /**
   * Initialize alert channels from environment variables
   */
  private initializeAlertChannels(): void {
    // Slack webhook
    const slackWebhook = this.configService.get<string>('SLACK_WEBHOOK_URL');
    if (slackWebhook) {
      this.alertChannels.push({
        type: 'slack',
        url: slackWebhook,
        enabled: true
      });
    }

    // Discord webhook
    const discordWebhook = this.configService.get<string>('DISCORD_WEBHOOK_URL');
    if (discordWebhook) {
      this.alertChannels.push({
        type: 'discord',
        url: discordWebhook,
        enabled: true
      });
    }

    // Generic webhook
    const genericWebhook = this.configService.get<string>('ALERT_WEBHOOK_URL');
    if (genericWebhook) {
      this.alertChannels.push({
        type: 'webhook',
        url: genericWebhook,
        enabled: true
      });
    }

    this.logger.log('🔗 Alert channels configured', {
      operation: 'alert-channels-init',
      channels: this.alertChannels.map(c => ({ type: c.type, enabled: c.enabled }))
    });
  }

  /**
   * INIT-04: Periodic health check (every 2 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performPeriodicHealthCheck(): Promise<void> {
    if (!this.isMonitoringActive) {
      this.isMonitoringActive = true;
      this.logger.log('🏥 Starting periodic health check', {
        operation: 'health-check-periodic'
      });
    }

    try {
      const healthData = await this.whatsappService.performHealthCheck();
      
      this.logger.logHealthCheck(
        healthData.totalInstances,
        healthData.connectedInstances,
        healthData.disconnectedInstances,
        {
          checkType: 'periodic'
        }
      );

      // Check for disconnected instances and send alerts
      await this.checkForDisconnectedInstances(healthData.instances);

    } catch (error) {
      this.logger.error('❌ Periodic health check failed', error, {
        operation: 'health-check-periodic'
      });
    }
  }

  /**
   * Check for disconnected instances and trigger alerts
   */
  private async checkForDisconnectedInstances(instances: any[]): Promise<void> {
    for (const instance of instances) {
      const { instanceName, status, clientId } = instance;
      
      // Track health history
      this.updateHealthHistory(instanceName, status === 'open');
      
      // If instance is disconnected, check if it was previously connected
      if (status !== 'open') {
        const wasConnected = this.wasInstancePreviouslyConnected(instanceName);
        
        if (wasConnected) {
          const alert: MonitoringAlert = {
            instanceName,
            clientId: clientId || 'unknown',
            alertType: 'disconnection',
            message: `WhatsApp instance ${instanceName} has disconnected unexpectedly`,
            timestamp: new Date(),
            severity: 'high'
          };

          await this.sendAlert(alert);
        }
      }
    }
  }

  /**
   * Update health history for an instance
   */
  private updateHealthHistory(instanceName: string, isHealthy: boolean): void {
    if (!this.instanceHealthHistory.has(instanceName)) {
      this.instanceHealthHistory.set(instanceName, []);
    }

    const history = this.instanceHealthHistory.get(instanceName)!;
    history.push(isHealthy);

    // Keep only the last MAX_HEALTH_HISTORY entries
    if (history.length > this.MAX_HEALTH_HISTORY) {
      history.shift();
    }
  }

  /**
   * Check if instance was previously connected based on health history
   */
  private wasInstancePreviouslyConnected(instanceName: string): boolean {
    const history = this.instanceHealthHistory.get(instanceName);
    if (!history || history.length < 2) {
      return false;
    }

    // Check if the last 2-3 entries show a transition from healthy to unhealthy
    const recentHistory = history.slice(-3);
    const hasBeenHealthy = recentHistory.some(status => status === true);
    const currentlyUnhealthy = recentHistory[recentHistory.length - 1] === false;

    return hasBeenHealthy && currentlyUnhealthy;
  }

  /**
   * Send alert to configured channels
   */
  async sendAlert(alert: MonitoringAlert): Promise<void> {
    this.logger.warn('🚨 Sending alert', {
      operation: 'send-alert',
      alertType: alert.alertType,
      instanceName: alert.instanceName,
      clientId: alert.clientId,
      severity: alert.severity
    });

    const enabledChannels = this.alertChannels.filter(channel => channel.enabled);
    
    if (enabledChannels.length === 0) {
      this.logger.warn('⚠️ No alert channels configured', {
        operation: 'send-alert'
      });
      return;
    }

    const alertPromises = enabledChannels.map(channel => 
      this.sendAlertToChannel(alert, channel)
    );

    try {
      await Promise.allSettled(alertPromises);
    } catch (error) {
      this.logger.error('❌ Failed to send alerts', error, {
        operation: 'send-alert'
      });
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(alert: MonitoringAlert, channel: AlertChannel): Promise<void> {
    try {
      let payload: any;

      switch (channel.type) {
        case 'slack':
          payload = {
            text: `🚨 *WhatsApp Integration Alert*`,
            attachments: [
              {
                color: this.getSeverityColor(alert.severity),
                fields: [
                  {
                    title: 'Alert Type',
                    value: alert.alertType,
                    short: true
                  },
                  {
                    title: 'Instance',
                    value: alert.instanceName,
                    short: true
                  },
                  {
                    title: 'Client ID',
                    value: alert.clientId,
                    short: true
                  },
                  {
                    title: 'Severity',
                    value: alert.severity.toUpperCase(),
                    short: true
                  },
                  {
                    title: 'Message',
                    value: alert.message,
                    short: false
                  },
                  {
                    title: 'Timestamp',
                    value: alert.timestamp.toISOString(),
                    short: true
                  }
                ]
              }
            ]
          };
          break;

        case 'discord':
          payload = {
            content: '🚨 **WhatsApp Integration Alert**',
            embeds: [
              {
                title: alert.alertType.replace('_', ' ').toUpperCase(),
                description: alert.message,
                color: this.getSeverityColorDiscord(alert.severity),
                fields: [
                  {
                    name: 'Instance',
                    value: alert.instanceName,
                    inline: true
                  },
                  {
                    name: 'Client ID',
                    value: alert.clientId,
                    inline: true
                  },
                  {
                    name: 'Severity',
                    value: alert.severity.toUpperCase(),
                    inline: true
                  }
                ],
                timestamp: alert.timestamp.toISOString()
              }
            ]
          };
          break;

        default:
          payload = {
            alert: alert,
            service: 'whatsapp-integration',
            timestamp: alert.timestamp.toISOString()
          };
      }

      await axios.post(channel.url, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.logger.log(`✅ Alert sent to ${channel.type}`, {
        operation: 'send-alert-channel',
        channel: channel.type,
        alertType: alert.alertType
      });

    } catch (error) {
      this.logger.error(`❌ Failed to send alert to ${channel.type}`, error, {
        operation: 'send-alert-channel',
        channel: channel.type
      });
    }
  }

  /**
   * Get color for Slack attachments based on severity
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffaa00';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  /**
   * Get color for Discord embeds based on severity
   */
  private getSeverityColorDiscord(severity: string): number {
    switch (severity) {
      case 'critical': return 0xff0000; // Red
      case 'high': return 0xff6600;     // Orange
      case 'medium': return 0xffaa00;   // Yellow
      case 'low': return 0x00ff00;      // Green
      default: return 0xcccccc;         // Gray
    }
  }

  /**
   * Manual health check trigger
   */
  async triggerManualHealthCheck(): Promise<any> {
    this.logger.log('🔍 Manual health check triggered', {
      operation: 'health-check-manual'
    });

    return await this.whatsappService.performHealthCheck();
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isActive: boolean;
    alertChannelsCount: number;
    trackedInstances: number;
    healthHistorySize: number;
  } {
    return {
      isActive: this.isMonitoringActive,
      alertChannelsCount: this.alertChannels.length,
      trackedInstances: this.instanceHealthHistory.size,
      healthHistorySize: this.MAX_HEALTH_HISTORY
    };
  }

  /**
   * Test alert system
   */
  async testAlertSystem(): Promise<void> {
    const testAlert: MonitoringAlert = {
      instanceName: 'test_instance',
      clientId: 'test_client',
      alertType: 'connection_failure',
      message: 'This is a test alert to verify the monitoring system is working properly',
      timestamp: new Date(),
      severity: 'low'
    };

    await this.sendAlert(testAlert);
  }
}
