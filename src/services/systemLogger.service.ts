/**
 * System Logger Service
 * 
 * Centralized logging service for the entire RPG Scribe application
 * Extends the Live Transcription logger to support all modules
 */

import {
  LiveTranscriptionLogger,
  LiveTranscriptionLogEntry,
  LiveTranscriptionLogLevel,
  LogCategory,
  createLiveTranscriptionLogger
} from '../utils/liveTranscriptionLogger';
import { ActivityAction } from '../models/ActivityLog';

/**
 * System modules that can generate logs
 */
export enum SystemModule {
  LIVE_TRANSCRIPTION = 'LiveTranscription',
  AI_SEARCH = 'AISearch',
  DUAL_TIMELINE = 'DualTimeline',
  AUTHENTICATION = 'Authentication',
  DATABASE = 'Database',
  UI_COMPONENTS = 'UIComponents',
  WEBSOCKET = 'WebSocket',
  FILE_MANAGEMENT = 'FileManagement',
  USER_MANAGEMENT = 'UserManagement',
  ADMIN_PANEL = 'AdminPanel',
  CAMPAIGN_MANAGEMENT = 'CampaignManagement',
  CHARACTER_MANAGEMENT = 'CharacterManagement',
  WORLD_MANAGEMENT = 'WorldManagement',
  SYSTEM = 'System'
}

/**
 * Extended log entry with module information
 */
export interface SystemLogEntry extends LiveTranscriptionLogEntry {
  module: SystemModule;
  userId?: string;
  userName?: string;
  worldId?: string;
  campaignId?: string;
}

/**
 * Log filter options
 */
export interface LogFilterOptions {
  modules?: SystemModule[];
  levels?: LiveTranscriptionLogLevel[];
  categories?: LogCategory[];
  actions?: ActivityAction[];
  sessionIds?: string[];
  userIds?: string[];
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
}

/**
 * Log export format
 */
export enum LogExportFormat {
  JSON = 'json',
  CSV = 'csv',
  TXT = 'txt'
}

/**
 * System Logger Service Class
 */
export class SystemLoggerService {
  private static instance: SystemLoggerService;
  private loggers: Map<SystemModule, LiveTranscriptionLogger> = new Map();
  private allLogs: SystemLogEntry[] = [];
  private maxLogEntries = 5000;
  private subscribers: Set<(logs: SystemLogEntry[]) => void> = new Set();

  private constructor() {
    // Initialize loggers for each module
    Object.values(SystemModule).forEach(module => {
      const logger = createLiveTranscriptionLogger(module);
      this.loggers.set(module, logger);
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SystemLoggerService {
    if (!SystemLoggerService.instance) {
      SystemLoggerService.instance = new SystemLoggerService();
    }
    return SystemLoggerService.instance;
  }

  /**
   * Get logger for specific module
   */
  getLogger(module: SystemModule): LiveTranscriptionLogger {
    const logger = this.loggers.get(module);
    if (!logger) {
      throw new Error(`Logger not found for module: ${module}`);
    }
    return logger;
  }

  /**
   * Log entry with system context
   */
  log(
    module: SystemModule,
    level: LiveTranscriptionLogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error,
    context?: {
      userId?: string;
      userName?: string;
      worldId?: string;
      campaignId?: string;
      sessionId?: string;
    }
  ): void {
    const logger = this.getLogger(module);
    
    // Log using the module's logger
    switch (level) {
      case LiveTranscriptionLogLevel.DEBUG:
        logger.debug(category, message, metadata);
        break;
      case LiveTranscriptionLogLevel.INFO:
        logger.info(category, message, metadata);
        break;
      case LiveTranscriptionLogLevel.WARN:
        logger.warn(category, message, metadata);
        break;
      case LiveTranscriptionLogLevel.ERROR:
        logger.error(category, message, error, metadata);
        break;
    }

    // Create system log entry
    const systemLogEntry: SystemLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component: module,
      module,
      sessionId: context?.sessionId,
      message,
      metadata,
      error,
      userId: context?.userId,
      userName: context?.userName,
      worldId: context?.worldId,
      campaignId: context?.campaignId
    };

    // Add to centralized log storage
    this.allLogs.push(systemLogEntry);

    // Trim logs if exceeding max
    if (this.allLogs.length > this.maxLogEntries) {
      this.allLogs = this.allLogs.slice(-this.maxLogEntries);
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Get all logs with optional filtering
   */
  getLogs(filters?: LogFilterOptions): SystemLogEntry[] {
    let filteredLogs = [...this.allLogs];

    if (filters) {
      if (filters.modules && filters.modules.length > 0) {
        filteredLogs = filteredLogs.filter(log => filters.modules!.includes(log.module));
      }

      if (filters.levels && filters.levels.length > 0) {
        filteredLogs = filteredLogs.filter(log => filters.levels!.includes(log.level));
      }

      if (filters.categories && filters.categories.length > 0) {
        filteredLogs = filteredLogs.filter(log => filters.categories!.includes(log.category));
      }

      if (filters.sessionIds && filters.sessionIds.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.sessionId && filters.sessionIds!.includes(log.sessionId)
        );
      }

      if (filters.userIds && filters.userIds.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.userId && filters.userIds!.includes(log.userId)
        );
      }

      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= filters.startDate!
        );
      }

      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= filters.endDate!
        );
      }

      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          log.component.toLowerCase().includes(searchLower) ||
          (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchLower))
        );
      }
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.allLogs = [];
    
    // Clear individual logger entries
    this.loggers.forEach(logger => {
      logger.clearLogs();
    });

    this.notifySubscribers();
  }

  /**
   * Export logs in specified format
   */
  exportLogs(format: LogExportFormat, filters?: LogFilterOptions): string {
    const logs = this.getLogs(filters);

    switch (format) {
      case LogExportFormat.JSON:
        return JSON.stringify(logs, null, 2);

      case LogExportFormat.CSV:
        return this.exportToCSV(logs);

      case LogExportFormat.TXT:
        return this.exportToTXT(logs);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Subscribe to log updates
   */
  subscribe(callback: (logs: SystemLogEntry[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get log statistics
   */
  getLogStatistics(filters?: LogFilterOptions): {
    total: number;
    byLevel: Record<LiveTranscriptionLogLevel, number>;
    byModule: Partial<Record<SystemModule, number>>;
    byCategory: Partial<Record<LogCategory, number>>;
    errorRate: number;
    recentErrors: SystemLogEntry[];
  } {
    const logs = this.getLogs(filters);
    
    const byLevel = {
      [LiveTranscriptionLogLevel.DEBUG]: 0,
      [LiveTranscriptionLogLevel.INFO]: 0,
      [LiveTranscriptionLogLevel.WARN]: 0,
      [LiveTranscriptionLogLevel.ERROR]: 0
    };

    const byModule: Partial<Record<SystemModule, number>> = {};
    const byCategory: Partial<Record<LogCategory, number>> = {};

    logs.forEach(log => {
      byLevel[log.level]++;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });

    const errorRate = logs.length > 0 ? (byLevel[LiveTranscriptionLogLevel.ERROR] / logs.length) * 100 : 0;
    const recentErrors = logs
      .filter(log => log.level === LiveTranscriptionLogLevel.ERROR)
      .slice(0, 10);

    return {
      total: logs.length,
      byLevel,
      byModule,
      byCategory,
      errorRate,
      recentErrors
    };
  }

  /**
   * Notify subscribers of log updates
   */
  private notifySubscribers(): void {
    const logs = this.getLogs();
    this.subscribers.forEach(callback => {
      try {
        callback(logs);
      } catch (error) {
        console.error('Error notifying log subscriber:', error);
      }
    });
  }

  /**
   * Export logs to CSV format
   */
  private exportToCSV(logs: SystemLogEntry[]): string {
    const headers = [
      'Timestamp',
      'Level',
      'Module',
      'Category',
      'Component',
      'Message',
      'Session ID',
      'User ID',
      'User Name',
      'World ID',
      'Campaign ID',
      'Metadata',
      'Error'
    ];

    const rows = logs.map(log => [
      log.timestamp,
      LiveTranscriptionLogLevel[log.level],
      log.module,
      log.category,
      log.component,
      `"${log.message.replace(/"/g, '""')}"`,
      log.sessionId || '',
      log.userId || '',
      log.userName || '',
      log.worldId || '',
      log.campaignId || '',
      log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
      log.error ? `"${log.error.message?.replace(/"/g, '""') || ''}"` : ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export logs to TXT format
   */
  private exportToTXT(logs: SystemLogEntry[]): string {
    return logs.map(log => {
      const level = LiveTranscriptionLogLevel[log.level];
      const timestamp = new Date(log.timestamp).toLocaleString();
      let entry = `[${timestamp}] [${level}] [${log.module}] [${log.category}] ${log.message}`;
      
      if (log.sessionId) entry += `\n  Session: ${log.sessionId}`;
      if (log.userId) entry += `\n  User: ${log.userName || log.userId}`;
      if (log.worldId) entry += `\n  World: ${log.worldId}`;
      if (log.campaignId) entry += `\n  Campaign: ${log.campaignId}`;
      if (log.metadata) entry += `\n  Metadata: ${JSON.stringify(log.metadata, null, 2)}`;
      if (log.error) entry += `\n  Error: ${log.error.message}\n  Stack: ${log.error.stack}`;
      
      return entry;
    }).join('\n\n');
  }
}

/**
 * Global system logger instance
 */
export const systemLogger = SystemLoggerService.getInstance();
