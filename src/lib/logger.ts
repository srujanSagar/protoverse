// Centralized logging utility for the application
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
}

class Logger {
  private config: LogConfig;

  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN,
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.config.enableConsole) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO) && this.config.enableConsole) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN) && this.config.enableConsole) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (this.config.enableConsole) {
        console.error(this.formatMessage('ERROR', message, error));
      }
      
      // In production, send to error tracking service
      if (this.config.enableRemote && error) {
        this.sendToErrorTracking(message, error);
      }
    }
  }

  private sendToErrorTracking(message: string, error: any): void {
    // TODO: Implement error tracking service integration
    // Example: Sentry, LogRocket, etc.
  }
}

export const logger = new Logger(); 