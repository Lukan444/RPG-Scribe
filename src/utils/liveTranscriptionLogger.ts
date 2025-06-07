/**
 * Live Transcription Logger
 * 
 * Comprehensive logging utility specifically designed for the Live Transcription module
 * Provides structured logging with session context, performance metrics, and debugging capabilities
 */

import { Logger } from './logger';

/**
 * Log levels for Live Transcription
 */
export enum LiveTranscriptionLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log categories for filtering and organization
 */
export enum LogCategory {
  SERVICE = 'SERVICE',
  AUDIO = 'AUDIO',
  TRANSCRIPTION = 'TRANSCRIPTION',
  DATABASE = 'DATABASE',
  UI = 'UI',
  WEBSOCKET = 'WEBSOCKET',
  PERFORMANCE = 'PERFORMANCE'
}

/**
 * Performance timing interface
 */
export interface PerformanceTiming {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Log entry interface
 */
export interface LiveTranscriptionLogEntry {
  timestamp: string;
  level: LiveTranscriptionLogLevel;
  category: LogCategory;
  component: string;
  sessionId?: string;
  operationId?: string;
  message: string;
  metadata?: Record<string, any>;
  error?: Error;
  timing?: PerformanceTiming;
}

/**
 * Logger configuration
 */
export interface LiveTranscriptionLoggerConfig {
  enabled: boolean;
  level: LiveTranscriptionLogLevel;
  includeStackTrace: boolean;
  includePerformanceMetrics: boolean;
  maxLogEntries: number;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LiveTranscriptionLoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: LiveTranscriptionLogLevel.DEBUG,
  includeStackTrace: true,
  includePerformanceMetrics: true,
  maxLogEntries: 1000
};

/**
 * Live Transcription Logger Class
 */
export class LiveTranscriptionLogger {
  private baseLogger: Logger;
  private config: LiveTranscriptionLoggerConfig;
  private logEntries: LiveTranscriptionLogEntry[] = [];
  private performanceTimings: Map<string, PerformanceTiming> = new Map();
  private sessionId?: string;
  private componentName: string;

  constructor(component: string, config: Partial<LiveTranscriptionLoggerConfig> = {}) {
    this.componentName = `LiveTranscription:${component}`;
    this.baseLogger = new Logger(this.componentName);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the current session ID for context
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Clear the current session ID
   */
  clearSessionId(): void {
    this.sessionId = undefined;
  }

  /**
   * Create a child logger for a specific sub-component
   */
  child(subComponent: string): LiveTranscriptionLogger {
    const childLogger = new LiveTranscriptionLogger(`${this.componentName}:${subComponent}`, this.config);
    childLogger.sessionId = this.sessionId;
    return childLogger;
  }

  /**
   * Log a debug message
   */
  debug(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LiveTranscriptionLogLevel.DEBUG, category, message, metadata);
  }

  /**
   * Log an info message
   */
  info(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LiveTranscriptionLogLevel.INFO, category, message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LiveTranscriptionLogLevel.WARN, category, message, metadata);
  }

  /**
   * Log an error message
   */
  error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LiveTranscriptionLogLevel.ERROR, category, message, metadata, error);
  }

  /**
   * Start performance timing for an operation
   */
  startTiming(operationId: string, operation: string, metadata?: Record<string, any>): void {
    if (!this.config.includePerformanceMetrics) return;

    const timing: PerformanceTiming = {
      operation,
      startTime: performance.now(),
      metadata
    };

    this.performanceTimings.set(operationId, timing);
    this.debug(LogCategory.PERFORMANCE, `Started timing: ${operation}`, { operationId, ...metadata });
  }

  /**
   * End performance timing for an operation
   */
  endTiming(operationId: string, metadata?: Record<string, any>): PerformanceTiming | null {
    if (!this.config.includePerformanceMetrics) return null;

    const timing = this.performanceTimings.get(operationId);
    if (!timing) {
      this.warn(LogCategory.PERFORMANCE, `No timing found for operation: ${operationId}`);
      return null;
    }

    timing.endTime = performance.now();
    timing.duration = timing.endTime - timing.startTime;
    
    if (metadata) {
      timing.metadata = { ...timing.metadata, ...metadata };
    }

    this.performanceTimings.delete(operationId);
    
    this.info(LogCategory.PERFORMANCE, `Completed timing: ${timing.operation}`, {
      operationId,
      duration: `${timing.duration.toFixed(2)}ms`,
      ...timing.metadata
    });

    return timing;
  }

  /**
   * Log audio processing metrics
   */
  logAudioMetrics(metrics: {
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
    duration?: number;
    bufferSize?: number;
    audioLevel?: number;
    deviceId?: string;
  }): void {
    this.info(LogCategory.AUDIO, 'Audio metrics captured', {
      sessionId: this.sessionId,
      ...metrics
    });
  }

  /**
   * Log transcription segment processing
   */
  logTranscriptionSegment(segment: {
    id: string;
    text: string;
    confidence: number;
    startTime: number;
    endTime: number;
    provider: string;
  }): void {
    this.info(LogCategory.TRANSCRIPTION, 'Transcription segment processed', {
      sessionId: this.sessionId,
      segmentId: segment.id,
      textLength: segment.text.length,
      confidence: segment.confidence,
      duration: segment.endTime - segment.startTime,
      provider: segment.provider
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation: string, collection: string, documentId?: string, metadata?: Record<string, any>): void {
    this.info(LogCategory.DATABASE, `Database operation: ${operation}`, {
      sessionId: this.sessionId,
      collection,
      documentId,
      ...metadata
    });
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(event: string, connectionState?: string, metadata?: Record<string, any>): void {
    this.info(LogCategory.WEBSOCKET, `WebSocket event: ${event}`, {
      sessionId: this.sessionId,
      connectionState,
      ...metadata
    });
  }

  /**
   * Log UI component events
   */
  logUIEvent(component: string, event: string, metadata?: Record<string, any>): void {
    this.debug(LogCategory.UI, `UI event: ${component}.${event}`, {
      sessionId: this.sessionId,
      ...metadata
    });
  }

  /**
   * Get all log entries for debugging
   */
  getLogEntries(): LiveTranscriptionLogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Get log entries by category
   */
  getLogEntriesByCategory(category: LogCategory): LiveTranscriptionLogEntry[] {
    return this.logEntries.filter(entry => entry.category === category);
  }

  /**
   * Clear all log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  /**
   * Core logging method
   */
  private log(
    level: LiveTranscriptionLogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.config.enabled || level < this.config.level) {
      return;
    }

    const entry: LiveTranscriptionLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component: this.componentName,
      sessionId: this.sessionId,
      message,
      metadata,
      error: error && this.config.includeStackTrace ? error : undefined
    };

    // Add to internal log storage
    this.logEntries.push(entry);
    
    // Trim log entries if exceeding max
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
    }

    // Log to console with appropriate level
    const logMessage = `[${category}] ${message}`;
    const logData = {
      sessionId: this.sessionId,
      ...metadata,
      ...(error && { error: error.message, stack: error.stack })
    };

    switch (level) {
      case LiveTranscriptionLogLevel.DEBUG:
        this.baseLogger.debug(logMessage, logData);
        break;
      case LiveTranscriptionLogLevel.INFO:
        this.baseLogger.info(logMessage, logData);
        break;
      case LiveTranscriptionLogLevel.WARN:
        this.baseLogger.warn(logMessage, logData);
        break;
      case LiveTranscriptionLogLevel.ERROR:
        this.baseLogger.error(logMessage, error || logData);
        break;
    }
  }
}

/**
 * Create a logger instance for Live Transcription components
 */
export function createLiveTranscriptionLogger(component: string, config?: Partial<LiveTranscriptionLoggerConfig>): LiveTranscriptionLogger {
  return new LiveTranscriptionLogger(component, config);
}

/**
 * Global logger instance for shared use
 */
export const liveTranscriptionLogger = createLiveTranscriptionLogger('Global');
