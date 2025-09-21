import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

export interface LogContext {
  instanceName?: string;
  clientId?: string;
  operation?: string;
  endpoint?: string;
  [key: string]: any;
}

@Injectable()
export class StructuredLoggingService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          service: 'WhatsApp-Integration',
          message,
          context,
          ...meta
        };

        if (stack) {
          (logEntry as any).stack = stack;
        }

        return JSON.stringify(logEntry);
      })
    );

    // Configure transports based on environment
    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            const ctx = context ? ` [${(context as any).instanceName || (context as any).clientId || 'SYSTEM'}]` : '';
            return `${timestamp} ${level}${ctx} ${message}`;
          })
        )
      })
    ];

    // File transport for production
    if (process.env.NODE_ENV === 'production') {
      const logsDir = path.join(process.cwd(), 'logs');
      
      transports.push(
        // Error logs
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          format: logFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
        // WhatsApp specific logs
        new winston.transports.File({
          filename: path.join(logsDir, 'whatsapp.log'),
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports,
      // Don't exit on handled exceptions
      exitOnError: false,
    });

    this.log('🚀 Structured Logging Service initialized', { service: 'StructuredLoggingService' });
  }

  /**
   * Log with DEBUG level
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { context });
  }

  /**
   * Log with INFO level
   */
  log(message: string, context?: LogContext): void {
    this.logger.info(message, { context });
  }

  /**
   * Log with WARN level
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { context });
  }

  /**
   * Log with ERROR level
   */
  error(message: string, error?: Error | string, context?: LogContext): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        context,
        error: error.message,
        stack: error.stack,
      });
    } else if (typeof error === 'string') {
      this.logger.error(message, {
        context,
        error,
      });
    } else {
      this.logger.error(message, { context });
    }
  }

  /**
   * Log WhatsApp specific operations
   */
  logWhatsAppOperation(
    operation: string,
    instanceName: string,
    clientId: string,
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    additionalData?: any
  ): void {
    const context: LogContext = {
      instanceName,
      clientId,
      operation,
      ...additionalData,
    };

    switch (level) {
      case 'debug':
        this.debug(message, context);
        break;
      case 'info':
        this.log(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'error':
        this.error(message, undefined, context);
        break;
    }
  }

  /**
   * Log API requests/responses
   */
  logApiCall(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ): void {
    const logContext: LogContext = {
      ...context,
      endpoint,
      method,
      statusCode,
      responseTime,
    };

    const message = `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`;

    if (statusCode >= 400) {
      this.error(message, undefined, logContext);
    } else if (statusCode >= 300) {
      this.warn(message, logContext);
    } else {
      this.log(message, logContext);
    }
  }

  /**
   * Log health check results
   */
  logHealthCheck(
    totalInstances: number,
    connectedInstances: number,
    disconnectedInstances: number,
    details?: any
  ): void {
    const context: LogContext = {
      operation: 'health-check',
      totalInstances,
      connectedInstances,
      disconnectedInstances,
      ...details,
    };

    const message = `Health Check: ${connectedInstances}/${totalInstances} instances connected`;
    
    if (disconnectedInstances > 0) {
      this.warn(message, context);
    } else {
      this.log(message, context);
    }
  }

  /**
   * Create child logger with persistent context
   */
  createChildLogger(persistentContext: LogContext): StructuredLoggingService {
    const childLogger = new StructuredLoggingService();
    
    // Override methods to include persistent context
    const originalMethods = ['debug', 'log', 'warn', 'error'];
    
    originalMethods.forEach(method => {
      const originalMethod = childLogger[method];
      childLogger[method] = (message: string, context?: LogContext, error?: Error | string) => {
        const mergedContext = { ...persistentContext, ...context };
        if (method === 'error' && error) {
          originalMethod.call(childLogger, message, error, mergedContext);
        } else {
          originalMethod.call(childLogger, message, mergedContext);
        }
      };
    });

    return childLogger;
  }

  /**
   * Get Winston logger instance for advanced usage
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
