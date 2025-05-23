/**
 * Logging Utilities for Cloud Functions
 * 
 * This file contains utilities for logging in Cloud Functions.
 */

import * as functions from "firebase-functions";

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR"
}

/**
 * Log entry
 */
interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Message */
  message: string;
  /** Additional data */
  data?: any;
  /** Timestamp */
  timestamp: string;
  /** Function name */
  functionName?: string;
  /** Operation ID */
  operationId?: string;
}

/**
 * Logger class
 */
export class Logger {
  private functionName: string;
  private operationId: string;

  /**
   * Create a new logger
   * @param functionName Name of the function
   * @param operationId ID of the operation
   */
  constructor(functionName: string, operationId?: string) {
    this.functionName = functionName;
    this.operationId = operationId || `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param data Additional data
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param data Additional data
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param data Additional data
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Error object
   * @param data Additional data
   */
  error(message: string, error?: Error, data?: any): void {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...data
    } : data;
    
    this.log(LogLevel.ERROR, message, errorData);
  }

  /**
   * Log a message
   * @param level Log level
   * @param message Message to log
   * @param data Additional data
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      functionName: this.functionName,
      operationId: this.operationId
    };

    // Log to Cloud Functions logger
    switch (level) {
      case LogLevel.DEBUG:
        functions.logger.debug(message, entry);
        break;
      case LogLevel.INFO:
        functions.logger.info(message, entry);
        break;
      case LogLevel.WARN:
        functions.logger.warn(message, entry);
        break;
      case LogLevel.ERROR:
        functions.logger.error(message, entry);
        break;
    }
  }

  /**
   * Create a child logger with the same function name and operation ID
   * @param childName Name of the child logger
   * @returns Child logger
   */
  child(childName: string): Logger {
    return new Logger(`${this.functionName}:${childName}`, this.operationId);
  }

  /**
   * Get the operation ID
   * @returns Operation ID
   */
  getOperationId(): string {
    return this.operationId;
  }
}
