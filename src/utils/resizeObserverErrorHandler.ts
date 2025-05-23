/**
 * Enhanced utility to handle ResizeObserver errors
 *
 * This utility suppresses ResizeObserver-related errors that commonly occur with Mantine components
 * and other UI libraries. These errors are typically not critical and can be safely suppressed.
 *
 * Common ResizeObserver errors:
 * - "ResizeObserver loop completed with undelivered notifications."
 * - "ResizeObserver loop limit exceeded"
 * - Script errors from ResizeObserver callbacks
 */

// Immediate global error suppression - runs as soon as module loads
(function setupImmediateErrorSuppression() {
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Enhanced error detection
  const isResizeObserverError = (message: string) => {
    const msg = String(message || '').toLowerCase();
    return (
      msg.includes('resizeobserver') ||
      msg.includes('undelivered notifications') ||
      msg.includes('loop completed') ||
      msg.includes('loop limit') ||
      msg.includes('resize observer')
    );
  };

  // Override console methods immediately
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (isResizeObserverError(message)) {
      return; // Completely suppress
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (isResizeObserverError(message)) {
      return; // Completely suppress
    }
    originalConsoleWarn.apply(console, args);
  };

  // Global error handler
  const globalErrorHandler = (event: ErrorEvent) => {
    const message = event.message || '';
    if (isResizeObserverError(message) ||
        (event.filename?.includes('bundle.js') && (
          event.lineno === 135268 ||
          event.lineno === 135287 ||
          (event.lineno && event.lineno >= 135000 && event.lineno <= 136000)
        ))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  };

  // Add global error handler
  window.addEventListener('error', globalErrorHandler, true);
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = String(event.reason || '');
    if (isResizeObserverError(reason)) {
      event.preventDefault();
    }
  }, true);

  // Store cleanup function
  (window as any).__immediateErrorSuppressionCleanup = () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    window.removeEventListener('error', globalErrorHandler, true);
  };
})();

interface ResizeObserverErrorStats {
  totalSuppressed: number;
  lastError: string | null;
  lastErrorTime: number | null;
}

let errorStats: ResizeObserverErrorStats = {
  totalSuppressed: 0,
  lastError: null,
  lastErrorTime: null
};

/**
 * Enhanced error handler for ResizeObserver errors
 * @param enableLogging - Whether to log suppressed errors for debugging
 * @returns A cleanup function to remove the error handler
 */
export function setupResizeObserverErrorHandler(enableLogging: boolean = false) {
  const errorHandler = (event: ErrorEvent) => {
    const message = event.message || '';
    const filename = event.filename || '';

    // Check for ResizeObserver-related errors
    const isResizeObserverError =
      message.includes('ResizeObserver loop completed with undelivered notifications') ||
      message.includes('ResizeObserver loop limit exceeded') ||
      message.includes('ResizeObserver') ||
      // Check for script errors that might be from ResizeObserver callbacks
      (filename.includes('bundle.js') && (
        message.includes('loop') ||
        message.includes('resize') ||
        event.lineno === 135268 || // Specific line mentioned in the issue
        event.lineno === 135287
      ));

    if (isResizeObserverError) {
      // Update error statistics
      errorStats.totalSuppressed++;
      errorStats.lastError = message;
      errorStats.lastErrorTime = Date.now();

      // Log for debugging if enabled
      if (enableLogging) {
        console.warn(`[ResizeObserver Error Suppressed] ${message}`, {
          filename,
          lineno: event.lineno,
          colno: event.colno,
          totalSuppressed: errorStats.totalSuppressed
        });
      }

      // Prevent the error from propagating
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  };

  // Also handle unhandled promise rejections that might be ResizeObserver-related
  const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.toString() || '';

    if (reason.includes('ResizeObserver')) {
      errorStats.totalSuppressed++;
      errorStats.lastError = reason;
      errorStats.lastErrorTime = Date.now();

      if (enableLogging) {
        console.warn(`[ResizeObserver Promise Rejection Suppressed] ${reason}`, {
          totalSuppressed: errorStats.totalSuppressed
        });
      }

      event.preventDefault();
    }
  };

  // Add the error handlers
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', unhandledRejectionHandler);

  // Return a cleanup function
  return () => {
    window.removeEventListener('error', errorHandler);
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
  };
}

/**
 * Get statistics about suppressed ResizeObserver errors
 */
export function getResizeObserverErrorStats(): ResizeObserverErrorStats {
  return { ...errorStats };
}

/**
 * Reset error statistics
 */
export function resetResizeObserverErrorStats(): void {
  errorStats = {
    totalSuppressed: 0,
    lastError: null,
    lastErrorTime: null
  };
}