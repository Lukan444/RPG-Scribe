/**
 * Logger utility for consistent logging across the application
 */
export class Logger {
  private name: string;

  /**
   * Create a new logger
   * @param name Logger name
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Create a child logger with a new name
   * @param name Child logger name
   * @returns Child logger
   */
  child(name: string): Logger {
    return new Logger(`${this.name}:${name}`);
  }

  /**
   * Log debug message
   * @param message Message to log
   * @param meta Additional metadata
   */
  debug(message: string, meta?: any): void {
    console.debug(`[${this.name}] ${message}`, meta);
  }

  /**
   * Log info message
   * @param message Message to log
   * @param meta Additional metadata
   */
  info(message: string, meta?: any): void {
    console.info(`[${this.name}] ${message}`, meta);
  }

  /**
   * Log warning message
   * @param message Message to log
   * @param meta Additional metadata
   */
  warn(message: string, meta?: any): void {
    console.warn(`[${this.name}] ${message}`, meta);
  }

  /**
   * Log error message
   * @param message Message to log
   * @param error Error object
   */
  error(message: string, error?: any): void {
    console.error(`[${this.name}] ${message}`, error);
  }
}