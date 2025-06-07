/**
 * System Logger Hook
 * 
 * React hook for integrating with the centralized system logger
 * Provides easy access to logging functionality with React context
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  SystemLoggerService, 
  SystemModule, 
  SystemLogEntry,
  systemLogger 
} from '../services/systemLogger.service';
import { 
  LiveTranscriptionLogLevel, 
  LogCategory 
} from '../utils/liveTranscriptionLogger';

/**
 * Hook options
 */
interface UseSystemLoggerOptions {
  module: SystemModule;
  sessionId?: string;
  autoContext?: boolean; // Automatically include user context
  entityContext?: {
    worldId?: string;
    campaignId?: string;
    entityType?: string;
    entityId?: string;
  };
}

/**
 * Logger context information
 */
interface LoggerContext {
  userId?: string;
  userName?: string;
  worldId?: string;
  campaignId?: string;
  sessionId?: string;
}

/**
 * System logger hook return type
 */
interface UseSystemLoggerReturn {
  // Logging methods
  debug: (category: LogCategory, message: string, metadata?: Record<string, any>) => void;
  info: (category: LogCategory, message: string, metadata?: Record<string, any>) => void;
  warn: (category: LogCategory, message: string, metadata?: Record<string, any>) => void;
  error: (category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>) => void;
  
  // Context management
  setSessionId: (sessionId: string) => void;
  clearSessionId: () => void;
  updateContext: (context: Partial<LoggerContext>) => void;
  
  // Log retrieval
  getLogs: (filters?: any) => SystemLogEntry[];
  getModuleLogs: () => SystemLogEntry[];
  
  // Utilities
  logUserAction: (action: string, metadata?: Record<string, any>) => void;
  logError: (error: Error, context?: string, metadata?: Record<string, any>) => void;
  logPerformance: (operation: string, duration: number, metadata?: Record<string, any>) => void;
}

/**
 * System Logger Hook
 */
export function useSystemLogger(options: UseSystemLoggerOptions): UseSystemLoggerReturn {
  const { user } = useAuth();
  
  // Build context from current state
  const context = useMemo((): LoggerContext => {
    const baseContext: LoggerContext = {
      sessionId: options.sessionId
    };

    if (options.autoContext !== false) {
      if (user) {
        baseContext.userId = user.id;
        baseContext.userName = user.name || user.email;
      }

      // Use explicit entity context if provided
      if (options.entityContext) {
        if (options.entityContext.worldId) {
          baseContext.worldId = options.entityContext.worldId;
        }
        if (options.entityContext.campaignId) {
          baseContext.campaignId = options.entityContext.campaignId;
        }
      }
    }

    return baseContext;
  }, [user, options.sessionId, options.autoContext, options.entityContext]);

  /**
   * Log debug message
   */
  const debug = useCallback((
    category: LogCategory, 
    message: string, 
    metadata?: Record<string, any>
  ) => {
    systemLogger.log(
      options.module,
      LiveTranscriptionLogLevel.DEBUG,
      category,
      message,
      metadata,
      undefined,
      context
    );
  }, [options.module, context]);

  /**
   * Log info message
   */
  const info = useCallback((
    category: LogCategory, 
    message: string, 
    metadata?: Record<string, any>
  ) => {
    systemLogger.log(
      options.module,
      LiveTranscriptionLogLevel.INFO,
      category,
      message,
      metadata,
      undefined,
      context
    );
  }, [options.module, context]);

  /**
   * Log warning message
   */
  const warn = useCallback((
    category: LogCategory, 
    message: string, 
    metadata?: Record<string, any>
  ) => {
    systemLogger.log(
      options.module,
      LiveTranscriptionLogLevel.WARN,
      category,
      message,
      metadata,
      undefined,
      context
    );
  }, [options.module, context]);

  /**
   * Log error message
   */
  const error = useCallback((
    category: LogCategory, 
    message: string, 
    error?: Error, 
    metadata?: Record<string, any>
  ) => {
    systemLogger.log(
      options.module,
      LiveTranscriptionLogLevel.ERROR,
      category,
      message,
      metadata,
      error,
      context
    );
  }, [options.module, context]);

  /**
   * Set session ID
   */
  const setSessionId = useCallback((sessionId: string) => {
    // This would update the context for future logs
    // Implementation depends on how you want to manage session state
  }, []);

  /**
   * Clear session ID
   */
  const clearSessionId = useCallback(() => {
    // Clear session ID from context
  }, []);

  /**
   * Update context
   */
  const updateContext = useCallback((newContext: Partial<LoggerContext>) => {
    // Update context for future logs
    // Implementation depends on how you want to manage context state
  }, []);

  /**
   * Get all logs
   */
  const getLogs = useCallback((filters?: any) => {
    return systemLogger.getLogs(filters);
  }, []);

  /**
   * Get logs for this module only
   */
  const getModuleLogs = useCallback(() => {
    return systemLogger.getLogs({ modules: [options.module] });
  }, [options.module]);

  /**
   * Log user action
   */
  const logUserAction = useCallback((
    action: string, 
    metadata?: Record<string, any>
  ) => {
    info(LogCategory.UI, `User action: ${action}`, {
      action,
      ...metadata
    });
  }, [info]);

  /**
   * Log error with context
   */
  const logError = useCallback((
    err: Error, 
    errorContext?: string, 
    metadata?: Record<string, any>
  ) => {
    error(
      LogCategory.SERVICE,
      errorContext ? `${errorContext}: ${err.message}` : err.message,
      err,
      metadata
    );
  }, [error]);

  /**
   * Log performance metrics
   */
  const logPerformance = useCallback((
    operation: string, 
    duration: number, 
    metadata?: Record<string, any>
  ) => {
    info(LogCategory.PERFORMANCE, `Performance: ${operation}`, {
      operation,
      duration,
      durationMs: `${duration.toFixed(2)}ms`,
      ...metadata
    });
  }, [info]);

  // Log hook initialization
  useEffect(() => {
    debug(LogCategory.UI, `${options.module} logger hook initialized`, {
      module: options.module,
      hasUser: !!user,
      hasEntityContext: !!options.entityContext,
      sessionId: options.sessionId,
      entityContext: options.entityContext
    });
  }, [debug, options.module, options.sessionId, user, options.entityContext]);

  return {
    debug,
    info,
    warn,
    error,
    setSessionId,
    clearSessionId,
    updateContext,
    getLogs,
    getModuleLogs,
    logUserAction,
    logError,
    logPerformance
  };
}

/**
 * Convenience hooks for specific modules
 */

export function useUILogger(sessionId?: string) {
  return useSystemLogger({ 
    module: SystemModule.UI_COMPONENTS, 
    sessionId,
    autoContext: true 
  });
}

export function useAuthLogger(sessionId?: string) {
  return useSystemLogger({ 
    module: SystemModule.AUTHENTICATION, 
    sessionId,
    autoContext: true 
  });
}

export function useDatabaseLogger(sessionId?: string) {
  return useSystemLogger({ 
    module: SystemModule.DATABASE, 
    sessionId,
    autoContext: true 
  });
}

export function useAdminLogger(sessionId?: string) {
  return useSystemLogger({ 
    module: SystemModule.ADMIN_PANEL, 
    sessionId,
    autoContext: true 
  });
}

export function useTranscriptionLogger(sessionId?: string) {
  return useSystemLogger({
    module: SystemModule.LIVE_TRANSCRIPTION,
    sessionId,
    autoContext: true
  });
}

/**
 * Enhanced System Logger Hook with RPGWorld Context Integration
 *
 * This hook attempts to use RPGWorld context when available,
 * but gracefully falls back when not available (e.g., in admin pages)
 */
export function useEnhancedSystemLogger(options: UseSystemLoggerOptions): UseSystemLoggerReturn {
  const { user } = useAuth();

  // Try to get RPGWorld context, but handle gracefully if not available
  let worldContext = null;
  let campaignContext = null;

  try {
    // This will only work if the component is wrapped in RPGWorldProvider
    const { useRPGWorld } = require('../contexts/RPGWorldContext');
    const { currentWorld, currentCampaign } = useRPGWorld();
    worldContext = currentWorld;
    campaignContext = currentCampaign;
  } catch (error) {
    // RPGWorld context not available - this is fine for admin pages
    // We'll use explicit entity context if provided
  }

  // Enhanced context building with RPGWorld integration
  const enhancedContext = useMemo((): LoggerContext => {
    const baseContext: LoggerContext = {
      sessionId: options.sessionId
    };

    if (options.autoContext !== false) {
      if (user) {
        baseContext.userId = user.id;
        baseContext.userName = user.name || user.email;
      }

      // Prefer RPGWorld context if available, otherwise use explicit context
      if (worldContext) {
        baseContext.worldId = worldContext.id;
      } else if (options.entityContext?.worldId) {
        baseContext.worldId = options.entityContext.worldId;
      }

      if (campaignContext) {
        baseContext.campaignId = campaignContext.id;
      } else if (options.entityContext?.campaignId) {
        baseContext.campaignId = options.entityContext.campaignId;
      }
    }

    return baseContext;
  }, [user, worldContext, campaignContext, options.sessionId, options.autoContext, options.entityContext]);

  // Use the same logging methods as the base hook
  const baseLogger = useSystemLogger({
    ...options,
    entityContext: {
      worldId: enhancedContext.worldId,
      campaignId: enhancedContext.campaignId,
      ...options.entityContext
    }
  });

  return baseLogger;
}

/**
 * Convenience hook for entity-aware logging
 * Automatically captures entity context when available
 */
export function useEntityLogger(
  module: SystemModule,
  entityContext?: {
    entityType?: string;
    entityId?: string;
    worldId?: string;
    campaignId?: string;
  },
  sessionId?: string
) {
  return useEnhancedSystemLogger({
    module,
    sessionId,
    autoContext: true,
    entityContext
  });
}
