/**
 * Firestore Logger
 * 
 * This class provides a standardized logging interface for Firestore operations.
 * It supports different log levels, context-aware logging, and can be enabled/disabled.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeContext: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: true,
  level: LogLevel.INFO,
  includeTimestamp: true,
  includeContext: true
};

/**
 * Firestore logger class
 */
export class FirestoreLogger {
  private context: string;
  private config: LoggerConfig;

  /**
   * Create a new FirestoreLogger
   * @param context Logger context (e.g., service name)
   * @param enabled Whether logging is enabled
   * @param config Logger configuration
   */
  constructor(
    context: string,
    enabled: boolean = true,
    config: Partial<LoggerConfig> = {}
  ) {
    this.context = context;
    this.config = {
      ...DEFAULT_CONFIG,
      enabled,
      ...config
    };
  }

  /**
   * Set the logger configuration
   * @param config Logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Enable or disable logging
   * @param enabled Whether logging is enabled
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set the log level
   * @param level Log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Format a log message
   * @param level Log level
   * @param message Log message
   * @returns Formatted log message
   */
  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level}]`);

    if (this.config.includeContext) {
      parts.push(`[${this.context}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log a debug message
   * @param message Log message
   * @param data Additional data to log
   */
  debug(message: string, ...data: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.DEBUG) {
      return;
    }

    console.debug(this.formatMessage('DEBUG', message), ...data);
  }

  /**
   * Log an info message
   * @param message Log message
   * @param data Additional data to log
   */
  info(message: string, ...data: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.INFO) {
      return;
    }

    console.info(this.formatMessage('INFO', message), ...data);
  }

  /**
   * Log a warning message
   * @param message Log message
   * @param data Additional data to log
   */
  warn(message: string, ...data: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.WARN) {
      return;
    }

    console.warn(this.formatMessage('WARN', message), ...data);
  }

  /**
   * Log an error message
   * @param message Log message
   * @param data Additional data to log
   */
  error(message: string, ...data: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.ERROR) {
      return;
    }

    console.error(this.formatMessage('ERROR', message), ...data);
  }

  /**
   * Log a performance metric
   * @param operation Operation name
   * @param startTime Start time
   * @param success Whether the operation was successful
   */
  performance(operation: string, startTime: number, success: boolean): void {
    if (!this.config.enabled || this.config.level > LogLevel.DEBUG) {
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const status = success ? 'SUCCESS' : 'FAILURE';
    const message = `${operation} completed in ${Math.round(duration)}ms [${status}]`;

    if (duration > 1000) {
      this.warn(message);
    } else {
      this.debug(message);
    }
  }
}
