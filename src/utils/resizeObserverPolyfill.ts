/**
 * ResizeObserver Polyfill for React 18+ Strict Mode
 * 
 * This polyfill replaces the native ResizeObserver with a debounced version
 * that prevents the "ResizeObserver loop completed with undelivered notifications" errors
 * that commonly occur in React 18+ applications with Strict Mode enabled.
 */

interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize?: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize?: ReadonlyArray<ResizeObserverSize>;
  devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>;
}

interface ResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

class SafeResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements = new Map<Element, { lastRect: DOMRect | null; debounceTimer: number | null }>();
  private isObserving = false;
  private debounceDelay = 16; // ~60fps
  private maxRetries = 3;
  private retryCount = 0;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    if (!target || !(target instanceof Element)) {
      return;
    }

    // Initialize tracking for this element
    this.observedElements.set(target, {
      lastRect: null,
      debounceTimer: null
    });

    // Start observing if not already
    if (!this.isObserving) {
      this.startObserving();
    }

    // Get initial rect
    this.checkElement(target);
  }

  unobserve(target: Element): void {
    const elementData = this.observedElements.get(target);
    if (elementData?.debounceTimer) {
      clearTimeout(elementData.debounceTimer);
    }
    this.observedElements.delete(target);

    // Stop observing if no elements left
    if (this.observedElements.size === 0) {
      this.stopObserving();
    }
  }

  disconnect(): void {
    // Clear all timers
    this.observedElements.forEach(elementData => {
      if (elementData.debounceTimer) {
        clearTimeout(elementData.debounceTimer);
      }
    });
    this.observedElements.clear();
    this.stopObserving();
  }

  private startObserving(): void {
    if (this.isObserving) return;
    this.isObserving = true;
    this.scheduleCheck();
  }

  private stopObserving(): void {
    this.isObserving = false;
  }

  private scheduleCheck(): void {
    if (!this.isObserving) return;

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      if (!this.isObserving) return;

      try {
        this.checkAllElements();
        this.scheduleCheck(); // Continue checking
      } catch (error) {
        // Handle errors gracefully
        this.retryCount++;
        if (this.retryCount < this.maxRetries) {
          setTimeout(() => this.scheduleCheck(), this.debounceDelay * 2);
        } else {
          console.warn('[SafeResizeObserver] Max retries reached, stopping observation');
          this.stopObserving();
        }
      }
    });
  }

  private checkAllElements(): void {
    const entries: ResizeObserverEntry[] = [];

    this.observedElements.forEach((elementData, target) => {
      const entry = this.checkElement(target);
      if (entry) {
        entries.push(entry);
      }
    });

    if (entries.length > 0) {
      this.debouncedCallback(entries);
    }
  }

  private checkElement(target: Element): ResizeObserverEntry | null {
    const elementData = this.observedElements.get(target);
    if (!elementData) return null;

    try {
      const rect = target.getBoundingClientRect();
      const lastRect = elementData.lastRect;

      // Check if size actually changed
      if (lastRect && 
          Math.abs(rect.width - lastRect.width) < 1 && 
          Math.abs(rect.height - lastRect.height) < 1) {
        return null; // No significant change
      }

      // Update last rect
      elementData.lastRect = rect;

      // Create ResizeObserver entry
      const entry: ResizeObserverEntry = {
        target,
        contentRect: rect,
        borderBoxSize: [{
          inlineSize: rect.width,
          blockSize: rect.height
        }],
        contentBoxSize: [{
          inlineSize: rect.width,
          blockSize: rect.height
        }]
      };

      return entry;
    } catch (error) {
      // Element might be detached from DOM
      this.unobserve(target);
      return null;
    }
  }

  private debouncedCallback(entries: ResizeObserverEntry[]): void {
    // Debounce the callback to prevent loops
    setTimeout(() => {
      try {
        this.callback(entries, this as any);
        this.retryCount = 0; // Reset retry count on successful callback
      } catch (error) {
        // Suppress callback errors to prevent loops
        console.warn('[SafeResizeObserver] Callback error suppressed:', error);
      }
    }, this.debounceDelay);
  }
}

// Install the polyfill immediately when this module loads
(function installResizeObserverPolyfill() {
  if (typeof window === 'undefined') return;

  // Store the original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;

  // Replace with our safe version
  window.ResizeObserver = SafeResizeObserver as any;

  // Also suppress any existing ResizeObserver errors
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('ResizeObserver') ||
        message.includes('undelivered notifications') ||
        message.includes('loop completed') ||
        message.includes('ResizeObserver loop limit exceeded')) {
      // Log to console in development for debugging, but don't show error to user
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ResizeObserver Error Suppressed]:', message);
      }
      return; // Suppress ResizeObserver errors
    }
    originalConsoleError.apply(console, args);
  };

  // Store cleanup function
  (window as any).__resizeObserverPolyfillCleanup = () => {
    window.ResizeObserver = OriginalResizeObserver;
    console.error = originalConsoleError;
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[ResizeObserver Polyfill] Installed safe ResizeObserver implementation');
  }
})();

export { SafeResizeObserver };
