/**
 * Logging levels for the entity-management framework
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
  includeTimestamp?: boolean;
  includeContext?: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_OPTIONS: LoggerOptions = {
  enabled: process.env.NODE_ENV !== 'production',
  level: LogLevel.INFO,
  prefix: '[EntityMgmt]',
  includeTimestamp: true,
  includeContext: true
};

/**
 * Logger class for entity-management framework
 * Provides structured logging with different levels, context, and formatting
 */
export class Logger {
  private options: LoggerOptions;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Helper to format log messages
   */
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const parts: string[] = [];

    if (this.options.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.options.prefix) {
      parts.push(this.options.prefix);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (this.options.includeContext && context) {
      parts.push(`[${context}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Check if this log level should be shown based on configuration
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.options.enabled) {
      return false;
    }

    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.options.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context), ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context), ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context), ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string | Error, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMessage = message instanceof Error ? message.message : message;
      console.error(this.formatMessage(LogLevel.ERROR, errorMessage, context), ...args);
      
      if (message instanceof Error) {
        console.error(message.stack);
      }
    }
  }

  /**
   * Create a child logger with a specific context
   */
  createContext(context: string): Logger {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix ? `${this.options.prefix}:${context}` : context
    });
  }

  /**
   * Create a logger instance configured for a specific feature
   */
  static forFeature(featureName: string): Logger {
    return new Logger({
      prefix: `[EntityMgmt:${featureName}]`
    });
  }

  /**
   * Create a logger instance configured for a specific component
   */
  static forComponent(componentName: string): Logger {
    return new Logger({
      prefix: `[EntityMgmt:Component:${componentName}]`
    });
  }
}

// Export a default logger instance
export const logger = new Logger();

export default logger;