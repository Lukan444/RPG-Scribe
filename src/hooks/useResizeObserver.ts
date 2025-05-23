import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Safe ResizeObserver hook that prevents loop errors
 *
 * This hook provides a safe way to use ResizeObserver with automatic
 * error handling and debouncing to prevent infinite loops.
 */

interface UseResizeObserverOptions {
  /**
   * Debounce delay in milliseconds to prevent rapid callbacks
   * @default 16
   */
  debounceMs?: number;

  /**
   * Whether to enable the observer
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to log errors for debugging
   * @default false
   */
  enableLogging?: boolean;
}

interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize?: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize?: ReadonlyArray<ResizeObserverSize>;
  devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>;
}

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

/**
 * Hook for safely using ResizeObserver with error handling and debouncing
 */
export function useResizeObserver<T extends Element = Element>(
  callback: ResizeCallback,
  options: UseResizeObserverOptions = {}
) {
  const {
    debounceMs = 16,
    enabled = true,
    enableLogging = false
  } = options;

  const elementRef = useRef<T>(null);
  const observerRef = useRef<ResizeObserver>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>(0);

  // Debounced callback to prevent rapid firing
  const debouncedCallback = useCallback((entries: ResizeObserverEntry[]) => {
    const now = Date.now();

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate delay based on last call time
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const delay = Math.max(0, debounceMs - timeSinceLastCall);

    timeoutRef.current = setTimeout(() => {
      try {
        lastCallTimeRef.current = Date.now();
        callback(entries);
      } catch (error) {
        if (enableLogging) {
          console.warn('[useResizeObserver] Callback error:', error);
        }
      }
    }, delay);
  }, [callback, debounceMs, enableLogging]);

  // Safe ResizeObserver creation with error handling
  const createObserver = useCallback(() => {
    if (!enabled || !window.ResizeObserver) {
      return null;
    }

    try {
      return new ResizeObserver((entries) => {
        // Wrap in requestAnimationFrame to avoid blocking the main thread
        requestAnimationFrame(() => {
          try {
            debouncedCallback(entries);
          } catch (error) {
            if (enableLogging) {
              console.warn('[useResizeObserver] ResizeObserver callback error:', error);
            }
          }
        });
      });
    } catch (error) {
      if (enableLogging) {
        console.warn('[useResizeObserver] Failed to create ResizeObserver:', error);
      }
      return null;
    }
  }, [enabled, debouncedCallback, enableLogging]);

  // Effect to manage the ResizeObserver
  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    const observer = createObserver();
    if (!observer) {
      return;
    }

    observerRef.current = observer;

    try {
      observer.observe(elementRef.current);

      if (enableLogging) {
        console.log('[useResizeObserver] Started observing element');
      }
    } catch (error) {
      if (enableLogging) {
        console.warn('[useResizeObserver] Failed to observe element:', error);
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (observer) {
        try {
          observer.disconnect();
          if (enableLogging) {
            console.log('[useResizeObserver] Disconnected observer');
          }
        } catch (error) {
          if (enableLogging) {
            console.warn('[useResizeObserver] Error disconnecting observer:', error);
          }
        }
      }
    };
  }, [enabled, createObserver, enableLogging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        try {
          observerRef.current.disconnect();
        } catch (error) {
          // Silently handle cleanup errors
        }
      }
    };
  }, []);

  return elementRef;
}

/**
 * Hook for observing element size changes with a callback
 */
export function useElementSize<T extends Element = Element>(
  callback: (size: { width: number; height: number }) => void,
  options: UseResizeObserverOptions = {}
) {
  const resizeCallback = useCallback((entries: ResizeObserverEntry[]) => {
    if (entries.length > 0) {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      callback({ width, height });
    }
  }, [callback]);

  return useResizeObserver<T>(resizeCallback, options);
}

/**
 * Hook for getting element dimensions that updates on resize
 */
export function useElementDimensions<T extends Element = Element>(
  options: UseResizeObserverOptions = {}
) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });

  const elementRef = useElementSize<T>((size) => {
    setDimensions(size);
  }, options);

  return { elementRef, dimensions };
}
