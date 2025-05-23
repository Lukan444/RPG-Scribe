/**
 * Health Monitor
 * 
 * This file contains the health monitoring implementation for Vertex AI operations,
 * providing proactive monitoring and alerting for service health.
 */

import { Logger } from '../../../utils/logger';
import { EventEmitter } from 'events';

/**
 * Health status
 */
export enum HealthStatus {
  /** Service is healthy */
  HEALTHY = 'HEALTHY',
  /** Service is degraded */
  DEGRADED = 'DEGRADED',
  /** Service is unhealthy */
  UNHEALTHY = 'UNHEALTHY',
  /** Service status is unknown */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Health check ID */
  id: string;
  /** Health check name */
  name: string;
  /** Health status */
  status: HealthStatus;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Error message if any */
  error?: string;
  /** Timestamp of the health check */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Health check function
 */
export type HealthCheckFn = () => Promise<HealthCheckResult>;

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Health check ID */
  id: string;
  /** Health check name */
  name: string;
  /** Health check function */
  checkFn: HealthCheckFn;
  /** Health check interval in milliseconds */
  intervalMs: number;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Whether the health check is critical */
  critical: boolean;
  /** Whether the health check is enabled */
  enabled: boolean;
}

/**
 * Health monitor options
 */
export interface HealthMonitorOptions {
  /** Health check interval in milliseconds */
  checkIntervalMs: number;
  /** Health check timeout in milliseconds */
  checkTimeoutMs: number;
  /** Maximum history size */
  maxHistorySize: number;
  /** Whether to auto-start monitoring */
  autoStart: boolean;
  /** Health checks */
  healthChecks: HealthCheckConfig[];
}

/**
 * Default health monitor options
 */
export const DEFAULT_HEALTH_MONITOR_OPTIONS: HealthMonitorOptions = {
  checkIntervalMs: 60000, // 1 minute
  checkTimeoutMs: 10000, // 10 seconds
  maxHistorySize: 100,
  autoStart: true,
  healthChecks: []
};

/**
 * Health monitor status
 */
export interface HealthMonitorStatus {
  /** Overall health status */
  status: HealthStatus;
  /** Individual health check results */
  checks: HealthCheckResult[];
  /** Whether monitoring is running */
  isRunning: boolean;
  /** Last check timestamp */
  lastCheckTimestamp: number;
  /** Uptime in milliseconds */
  uptimeMs: number;
  /** Start timestamp */
  startTimestamp: number;
}

/**
 * Health alert
 */
export interface HealthAlert {
  /** Alert ID */
  id: string;
  /** Alert timestamp */
  timestamp: number;
  /** Health check ID */
  checkId: string;
  /** Health check name */
  checkName: string;
  /** Previous status */
  previousStatus: HealthStatus;
  /** Current status */
  currentStatus: HealthStatus;
  /** Error message if any */
  error?: string;
  /** Whether the alert is resolved */
  resolved: boolean;
  /** Resolution timestamp */
  resolutionTimestamp?: number;
}

/**
 * Health Monitor
 */
export class HealthMonitor extends EventEmitter {
  private options: HealthMonitorOptions;
  private logger: Logger;
  private healthChecks: Map<string, HealthCheckConfig>;
  private healthCheckResults: Map<string, HealthCheckResult>;
  private healthCheckIntervals: Map<string, NodeJS.Timeout>;
  private healthCheckHistory: Map<string, HealthCheckResult[]>;
  private alerts: Map<string, HealthAlert>;
  private isRunning: boolean;
  private startTimestamp: number;

  /**
   * Create a new Health Monitor
   * @param options Health monitor options
   * @param logger Logger instance
   */
  constructor(options?: Partial<HealthMonitorOptions>, logger?: Logger) {
    super();
    this.options = { ...DEFAULT_HEALTH_MONITOR_OPTIONS, ...options };
    this.logger = logger || new Logger('HealthMonitor');
    this.healthChecks = new Map();
    this.healthCheckResults = new Map();
    this.healthCheckIntervals = new Map();
    this.healthCheckHistory = new Map();
    this.alerts = new Map();
    this.isRunning = false;
    this.startTimestamp = Date.now();

    // Initialize health checks
    this.initializeHealthChecks();

    // Start monitoring if auto-start is enabled
    if (this.options.autoStart) {
      this.start();
    }

    this.logger.info("HealthMonitor initialized", {
      autoStart: this.options.autoStart,
      healthChecksCount: this.healthChecks.size
    });
  }

  /**
   * Initialize health checks
   */
  private initializeHealthChecks(): void {
    for (const check of this.options.healthChecks) {
      this.registerHealthCheck(check);
    }
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTimestamp = Date.now();

    // Start all health checks
    for (const [id, check] of this.healthChecks.entries()) {
      if (check.enabled) {
        this.startHealthCheck(id);
      }
    }

    this.logger.info("Health monitoring started");
    this.emit('start');
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop all health checks
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    this.logger.info("Health monitoring stopped");
    this.emit('stop');
  }

  /**
   * Start a specific health check
   * @param id Health check ID
   */
  private startHealthCheck(id: string): void {
    const check = this.healthChecks.get(id);
    if (!check || !check.enabled) {
      return;
    }

    // Clear existing interval if any
    if (this.healthCheckIntervals.has(id)) {
      clearInterval(this.healthCheckIntervals.get(id));
    }

    // Run the health check immediately
    this.runHealthCheck(id);

    // Set up interval for future checks
    const interval = setInterval(() => {
      this.runHealthCheck(id);
    }, check.intervalMs);

    this.healthCheckIntervals.set(id, interval);
  }

  /**
   * Run a specific health check
   * @param id Health check ID
   */
  private async runHealthCheck(id: string): Promise<void> {
    const check = this.healthChecks.get(id);
    if (!check) {
      return;
    }

    try {
      // Execute the health check with timeout
      const result = await this.executeWithTimeout(
        check.checkFn,
        check.timeoutMs
      );

      // Get previous result if any
      const previousResult = this.healthCheckResults.get(id);

      // Store the result
      this.healthCheckResults.set(id, result);

      // Add to history
      this.addToHistory(id, result);

      // Check for status change and create alert if needed
      if (previousResult && previousResult.status !== result.status) {
        this.createAlert(id, previousResult.status, result.status, result.error);
      }

      // Emit result event
      this.emit('checkResult', result);

      // Log result
      this.logger.debug(`Health check ${check.name} completed`, {
        id,
        status: result.status,
        latencyMs: result.latencyMs
      });
    } catch (error) {
      // Get previous result if any
      const previousResult = this.healthCheckResults.get(id);
      const previousStatus = previousResult?.status || HealthStatus.UNKNOWN;

      // Create unhealthy result
      const result: HealthCheckResult = {
        id,
        name: check.name,
        status: HealthStatus.UNHEALTHY,
        latencyMs: check.timeoutMs,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };

      // Store the result
      this.healthCheckResults.set(id, result);

      // Add to history
      this.addToHistory(id, result);

      // Create alert if status changed
      if (previousStatus !== HealthStatus.UNHEALTHY) {
        this.createAlert(id, previousStatus, HealthStatus.UNHEALTHY, result.error);
      }

      // Emit result event
      this.emit('checkResult', result);

      // Log error
      this.logger.error(`Health check ${check.name} failed`, {
        id,
        error: result.error
      });
    }
  }

  /**
   * Execute an operation with timeout
   * @param operation Operation to execute
   * @param timeoutMs Timeout in milliseconds
   * @returns Result of the operation
   * @throws Error if the operation times out
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Add a health check result to history
   * @param id Health check ID
   * @param result Health check result
   */
  private addToHistory(id: string, result: HealthCheckResult): void {
    if (!this.healthCheckHistory.has(id)) {
      this.healthCheckHistory.set(id, []);
    }

    const history = this.healthCheckHistory.get(id)!;
    history.push(result);

    // Trim history if it exceeds max size
    if (history.length > this.options.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Create a health alert
   * @param checkId Health check ID
   * @param previousStatus Previous status
   * @param currentStatus Current status
   * @param error Error message
   */
  private createAlert(
    checkId: string,
    previousStatus: HealthStatus,
    currentStatus: HealthStatus,
    error?: string
  ): void {
    const check = this.healthChecks.get(checkId);
    if (!check) {
      return;
    }

    const alertId = `${checkId}-${Date.now()}`;
    const alert: HealthAlert = {
      id: alertId,
      timestamp: Date.now(),
      checkId,
      checkName: check.name,
      previousStatus,
      currentStatus,
      error,
      resolved: currentStatus === HealthStatus.HEALTHY
    };

    // If the alert is resolved immediately, set resolution timestamp
    if (alert.resolved) {
      alert.resolutionTimestamp = Date.now();
    }

    // Store the alert
    this.alerts.set(alertId, alert);

    // Emit alert event
    this.emit('alert', alert);

    // Log alert
    if (currentStatus === HealthStatus.UNHEALTHY || currentStatus === HealthStatus.DEGRADED) {
      this.logger.warn(`Health alert: ${check.name} changed from ${previousStatus} to ${currentStatus}`, {
        alertId,
        checkId,
        previousStatus,
        currentStatus,
        error
      });
    } else {
      this.logger.info(`Health recovery: ${check.name} changed from ${previousStatus} to ${currentStatus}`, {
        alertId,
        checkId,
        previousStatus,
        currentStatus
      });
    }
  }

  /**
   * Resolve a health alert
   * @param alertId Alert ID
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return;
    }

    // Update alert
    alert.resolved = true;
    alert.resolutionTimestamp = Date.now();

    // Emit alert resolved event
    this.emit('alertResolved', alert);

    // Log resolution
    this.logger.info(`Health alert resolved: ${alert.checkName}`, {
      alertId,
      checkId: alert.checkId,
      durationMs: alert.resolutionTimestamp! - alert.timestamp
    });
  }

  /**
   * Register a new health check
   * @param check Health check configuration
   */
  registerHealthCheck(check: HealthCheckConfig): void {
    this.healthChecks.set(check.id, check);
    this.healthCheckHistory.set(check.id, []);

    // Start the health check if monitoring is running and check is enabled
    if (this.isRunning && check.enabled) {
      this.startHealthCheck(check.id);
    }

    this.logger.info("Health check registered", {
      id: check.id,
      name: check.name,
      intervalMs: check.intervalMs,
      critical: check.critical,
      enabled: check.enabled
    });
  }

  /**
   * Unregister a health check
   * @param id Health check ID
   */
  unregisterHealthCheck(id: string): void {
    // Stop the health check if it's running
    if (this.healthCheckIntervals.has(id)) {
      clearInterval(this.healthCheckIntervals.get(id));
      this.healthCheckIntervals.delete(id);
    }

    // Remove the health check
    this.healthChecks.delete(id);
    this.healthCheckResults.delete(id);
    this.healthCheckHistory.delete(id);

    this.logger.info("Health check unregistered", { id });
  }

  /**
   * Enable a health check
   * @param id Health check ID
   */
  enableHealthCheck(id: string): void {
    const check = this.healthChecks.get(id);
    if (!check || check.enabled) {
      return;
    }

    // Update check
    check.enabled = true;
    this.healthChecks.set(id, check);

    // Start the health check if monitoring is running
    if (this.isRunning) {
      this.startHealthCheck(id);
    }

    this.logger.info("Health check enabled", { id, name: check.name });
  }

  /**
   * Disable a health check
   * @param id Health check ID
   */
  disableHealthCheck(id: string): void {
    const check = this.healthChecks.get(id);
    if (!check || !check.enabled) {
      return;
    }

    // Update check
    check.enabled = false;
    this.healthChecks.set(id, check);

    // Stop the health check if it's running
    if (this.healthCheckIntervals.has(id)) {
      clearInterval(this.healthCheckIntervals.get(id));
      this.healthCheckIntervals.delete(id);
    }

    this.logger.info("Health check disabled", { id, name: check.name });
  }

  /**
   * Run a health check immediately
   * @param id Health check ID
   * @returns Health check result
   */
  async runHealthCheckNow(id: string): Promise<HealthCheckResult | null> {
    const check = this.healthChecks.get(id);
    if (!check) {
      return null;
    }

    await this.runHealthCheck(id);
    return this.healthCheckResults.get(id) || null;
  }

  /**
   * Run all health checks immediately
   * @returns Map of health check results
   */
  async runAllHealthChecksNow(): Promise<Map<string, HealthCheckResult>> {
    const promises: Promise<void>[] = [];

    for (const id of this.healthChecks.keys()) {
      promises.push(this.runHealthCheck(id));
    }

    await Promise.all(promises);
    return new Map(this.healthCheckResults);
  }

  /**
   * Get health check result
   * @param id Health check ID
   * @returns Health check result or null if not found
   */
  getHealthCheckResult(id: string): HealthCheckResult | null {
    return this.healthCheckResults.get(id) || null;
  }

  /**
   * Get all health check results
   * @returns Map of health check results
   */
  getAllHealthCheckResults(): Map<string, HealthCheckResult> {
    return new Map(this.healthCheckResults);
  }

  /**
   * Get health check history
   * @param id Health check ID
   * @returns Health check history or empty array if not found
   */
  getHealthCheckHistory(id: string): HealthCheckResult[] {
    return this.healthCheckHistory.get(id) || [];
  }

  /**
   * Get all alerts
   * @param onlyUnresolved Whether to return only unresolved alerts
   * @returns Array of health alerts
   */
  getAlerts(onlyUnresolved: boolean = false): HealthAlert[] {
    const alerts = Array.from(this.alerts.values());
    return onlyUnresolved ? alerts.filter(a => !a.resolved) : alerts;
  }

  /**
   * Get overall health status
   * @returns Overall health status
   */
  getOverallStatus(): HealthStatus {
    // If there are no results, return UNKNOWN
    if (this.healthCheckResults.size === 0) {
      return HealthStatus.UNKNOWN;
    }

    // Check if any critical health check is UNHEALTHY
    for (const [id, result] of this.healthCheckResults.entries()) {
      const check = this.healthChecks.get(id);
      if (check && check.critical && result.status === HealthStatus.UNHEALTHY) {
        return HealthStatus.UNHEALTHY;
      }
    }

    // Check if any health check is UNHEALTHY or DEGRADED
    let hasUnhealthy = false;
    let hasDegraded = false;

    for (const result of this.healthCheckResults.values()) {
      if (result.status === HealthStatus.UNHEALTHY) {
        hasUnhealthy = true;
      } else if (result.status === HealthStatus.DEGRADED) {
        hasDegraded = true;
      }
    }

    if (hasUnhealthy) {
      return HealthStatus.DEGRADED;
    } else if (hasDegraded) {
      return HealthStatus.DEGRADED;
    } else {
      return HealthStatus.HEALTHY;
    }
  }

  /**
   * Get health monitor status
   * @returns Health monitor status
   */
  getStatus(): HealthMonitorStatus {
    return {
      status: this.getOverallStatus(),
      checks: Array.from(this.healthCheckResults.values()),
      isRunning: this.isRunning,
      lastCheckTimestamp: Math.max(
        ...Array.from(this.healthCheckResults.values()).map(r => r.timestamp),
        0
      ),
      uptimeMs: Date.now() - this.startTimestamp,
      startTimestamp: this.startTimestamp
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
    this.removeAllListeners();
    this.logger.info("HealthMonitor cleaned up");
  }
}