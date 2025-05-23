/**
 * Degraded Mode Manager
 * 
 * This file contains the degraded mode manager implementation for Vertex AI operations,
 * providing graceful degradation of service quality during disruptions.
 */

import { Logger } from '../../../utils/logger';
import { EventEmitter } from 'events';

/**
 * Degraded mode levels
 */
export enum DegradedModeLevel {
  /** Normal operation */
  NORMAL = 'NORMAL',
  /** Slightly degraded operation */
  MINOR = 'MINOR',
  /** Moderately degraded operation */
  MODERATE = 'MODERATE',
  /** Severely degraded operation */
  SEVERE = 'SEVERE',
  /** Critical degradation, minimal functionality */
  CRITICAL = 'CRITICAL'
}

/**
 * Degraded mode feature priority
 */
export enum FeaturePriority {
  /** Critical feature that must be preserved */
  CRITICAL = 'CRITICAL',
  /** High priority feature */
  HIGH = 'HIGH',
  /** Medium priority feature */
  MEDIUM = 'MEDIUM',
  /** Low priority feature */
  LOW = 'LOW',
  /** Optional feature that can be disabled */
  OPTIONAL = 'OPTIONAL'
}

/**
 * Feature configuration
 */
export interface FeatureConfig {
  /** Feature ID */
  id: string;
  /** Feature name */
  name: string;
  /** Feature description */
  description: string;
  /** Feature priority */
  priority: FeaturePriority;
  /** Minimum degraded mode level at which the feature is enabled */
  minimumLevel: DegradedModeLevel;
  /** Whether the feature is currently enabled */
  enabled: boolean;
  /** Whether the feature is in degraded mode */
  degraded: boolean;
  /** Fallback strategy for the feature */
  fallbackStrategy?: string;
}

/**
 * Degraded mode options
 */
export interface DegradedModeOptions {
  /** Initial degraded mode level */
  initialLevel: DegradedModeLevel;
  /** Automatic recovery enabled */
  autoRecovery: boolean;
  /** Recovery check interval in milliseconds */
  recoveryCheckIntervalMs: number;
  /** Recovery threshold (number of successful operations) */
  recoveryThreshold: number;
  /** Degradation threshold (number of failed operations) */
  degradationThreshold: number;
  /** Feature configurations */
  features: FeatureConfig[];
}

/**
 * Default degraded mode options
 */
export const DEFAULT_DEGRADED_MODE_OPTIONS: DegradedModeOptions = {
  initialLevel: DegradedModeLevel.NORMAL,
  autoRecovery: true,
  recoveryCheckIntervalMs: 60000, // 1 minute
  recoveryThreshold: 5,
  degradationThreshold: 3,
  features: []
};

/**
 * Degraded mode status
 */
export interface DegradedModeStatus {
  /** Current degraded mode level */
  level: DegradedModeLevel;
  /** Time spent in current level (milliseconds) */
  timeInCurrentLevelMs: number;
  /** Start time of current level */
  levelStartTime: number;
  /** Whether auto recovery is enabled */
  autoRecoveryEnabled: boolean;
  /** Number of successful operations since level change */
  successfulOperations: number;
  /** Number of failed operations since level change */
  failedOperations: number;
  /** Enabled features */
  enabledFeatures: string[];
  /** Disabled features */
  disabledFeatures: string[];
  /** Degraded features */
  degradedFeatures: string[];
}

/**
 * Degraded Mode Manager
 */
export class DegradedModeManager extends EventEmitter {
  private options: DegradedModeOptions;
  private logger: Logger;
  private level: DegradedModeLevel;
  private levelStartTime: number;
  private successfulOperations: number;
  private failedOperations: number;
  private features: Map<string, FeatureConfig>;
  private recoveryCheckInterval: NodeJS.Timeout | null;

  /**
   * Create a new Degraded Mode Manager
   * @param options Degraded mode options
   * @param logger Logger instance
   */
  constructor(options?: Partial<DegradedModeOptions>, logger?: Logger) {
    super();
    this.options = { ...DEFAULT_DEGRADED_MODE_OPTIONS, ...options };
    this.logger = logger || new Logger('DegradedModeManager');
    this.level = this.options.initialLevel;
    this.levelStartTime = Date.now();
    this.successfulOperations = 0;
    this.failedOperations = 0;
    this.features = new Map();
    this.recoveryCheckInterval = null;

    // Initialize features
    this.initializeFeatures();

    // Start recovery check if auto recovery is enabled
    if (this.options.autoRecovery) {
      this.startRecoveryCheck();
    }

    this.logger.info("DegradedModeManager initialized", {
      initialLevel: this.level,
      autoRecovery: this.options.autoRecovery,
      featuresCount: this.features.size
    });
  }

  /**
   * Initialize features
   */
  private initializeFeatures(): void {
    for (const feature of this.options.features) {
      // Set initial enabled state based on feature priority and current level
      const enabled = this.isFeatureEnabledAtLevel(feature.priority, this.level);
      
      this.features.set(feature.id, {
        ...feature,
        enabled,
        degraded: this.level !== DegradedModeLevel.NORMAL && enabled
      });
    }
  }

  /**
   * Start recovery check interval
   */
  private startRecoveryCheck(): void {
    if (this.recoveryCheckInterval) {
      clearInterval(this.recoveryCheckInterval);
    }

    this.recoveryCheckInterval = setInterval(() => {
      this.checkRecovery();
    }, this.options.recoveryCheckIntervalMs);
  }

  /**
   * Stop recovery check interval
   */
  private stopRecoveryCheck(): void {
    if (this.recoveryCheckInterval) {
      clearInterval(this.recoveryCheckInterval);
      this.recoveryCheckInterval = null;
    }
  }

  /**
   * Check if recovery is possible
   */
  private checkRecovery(): void {
    if (this.level === DegradedModeLevel.NORMAL) {
      return;
    }

    if (this.successfulOperations >= this.options.recoveryThreshold) {
      // Improve the degraded mode level
      const newLevel = this.getImprovedLevel(this.level);
      
      if (newLevel !== this.level) {
        this.setLevel(newLevel);
        this.logger.info("Automatic recovery improved degraded mode level", {
          previousLevel: this.level,
          newLevel,
          successfulOperations: this.successfulOperations
        });
      }
    }
  }

  /**
   * Get improved degraded mode level
   * @param currentLevel Current degraded mode level
   * @returns Improved degraded mode level
   */
  private getImprovedLevel(currentLevel: DegradedModeLevel): DegradedModeLevel {
    switch (currentLevel) {
      case DegradedModeLevel.CRITICAL:
        return DegradedModeLevel.SEVERE;
      case DegradedModeLevel.SEVERE:
        return DegradedModeLevel.MODERATE;
      case DegradedModeLevel.MODERATE:
        return DegradedModeLevel.MINOR;
      case DegradedModeLevel.MINOR:
        return DegradedModeLevel.NORMAL;
      default:
        return currentLevel;
    }
  }

  /**
   * Get degraded degraded mode level
   * @param currentLevel Current degraded mode level
   * @returns Degraded degraded mode level
   */
  private getDegradedLevel(currentLevel: DegradedModeLevel): DegradedModeLevel {
    switch (currentLevel) {
      case DegradedModeLevel.NORMAL:
        return DegradedModeLevel.MINOR;
      case DegradedModeLevel.MINOR:
        return DegradedModeLevel.MODERATE;
      case DegradedModeLevel.MODERATE:
        return DegradedModeLevel.SEVERE;
      case DegradedModeLevel.SEVERE:
        return DegradedModeLevel.CRITICAL;
      default:
        return currentLevel;
    }
  }

  /**
   * Check if a feature is enabled at a specific degraded mode level
   * @param priority Feature priority
   * @param level Degraded mode level
   * @returns True if the feature is enabled at the level
   */
  private isFeatureEnabledAtLevel(priority: FeaturePriority, level: DegradedModeLevel): boolean {
    switch (level) {
      case DegradedModeLevel.NORMAL:
        // All features are enabled in normal mode
        return true;
      case DegradedModeLevel.MINOR:
        // All features except optional are enabled in minor degraded mode
        return priority !== FeaturePriority.OPTIONAL;
      case DegradedModeLevel.MODERATE:
        // Only critical, high, and medium priority features are enabled in moderate degraded mode
        return priority === FeaturePriority.CRITICAL || 
               priority === FeaturePriority.HIGH || 
               priority === FeaturePriority.MEDIUM;
      case DegradedModeLevel.SEVERE:
        // Only critical and high priority features are enabled in severe degraded mode
        return priority === FeaturePriority.CRITICAL || 
               priority === FeaturePriority.HIGH;
      case DegradedModeLevel.CRITICAL:
        // Only critical features are enabled in critical degraded mode
        return priority === FeaturePriority.CRITICAL;
      default:
        return false;
    }
  }

  /**
   * Set degraded mode level
   * @param level New degraded mode level
   */
  setLevel(level: DegradedModeLevel): void {
    const previousLevel = this.level;
    this.level = level;
    this.levelStartTime = Date.now();
    this.successfulOperations = 0;
    this.failedOperations = 0;

    // Update feature enabled states
    for (const [id, feature] of this.features.entries()) {
      const enabled = this.isFeatureEnabledAtLevel(feature.priority, level);
      
      this.features.set(id, {
        ...feature,
        enabled,
        degraded: level !== DegradedModeLevel.NORMAL && enabled
      });
    }

    this.logger.info("Degraded mode level changed", {
      previousLevel,
      newLevel: level,
      enabledFeatures: Array.from(this.features.values())
        .filter(f => f.enabled)
        .map(f => f.id)
    });

    // Emit level change event
    this.emit('levelChange', {
      previousLevel,
      newLevel: level,
      enabledFeatures: Array.from(this.features.values())
        .filter(f => f.enabled)
        .map(f => f.id),
      disabledFeatures: Array.from(this.features.values())
        .filter(f => !f.enabled)
        .map(f => f.id)
    });
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successfulOperations++;
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failedOperations++;

    // Check if we need to degrade the service
    if (this.failedOperations >= this.options.degradationThreshold) {
      // Degrade the service level
      const newLevel = this.getDegradedLevel(this.level);
      
      if (newLevel !== this.level) {
        this.setLevel(newLevel);
        this.logger.warn("Service degraded due to failures", {
          previousLevel: this.level,
          newLevel,
          failedOperations: this.failedOperations
        });
      }
    }
  }

  /**
   * Check if a feature is enabled
   * @param featureId Feature ID
   * @returns True if the feature is enabled
   */
  isFeatureEnabled(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature ? feature.enabled : false;
  }

  /**
   * Check if a feature is in degraded mode
   * @param featureId Feature ID
   * @returns True if the feature is in degraded mode
   */
  isFeatureDegraded(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature ? feature.degraded : false;
  }

  /**
   * Get the fallback strategy for a feature
   * @param featureId Feature ID
   * @returns Fallback strategy or undefined
   */
  getFeatureFallbackStrategy(featureId: string): string | undefined {
    const feature = this.features.get(featureId);
    return feature ? feature.fallbackStrategy : undefined;
  }

  /**
   * Register a new feature
   * @param feature Feature configuration
   */
  registerFeature(feature: FeatureConfig): void {
    // Set initial enabled state based on feature priority and current level
    const enabled = this.isFeatureEnabledAtLevel(feature.priority, this.level);
    
    this.features.set(feature.id, {
      ...feature,
      enabled,
      degraded: this.level !== DegradedModeLevel.NORMAL && enabled
    });

    this.logger.info("Feature registered", {
      featureId: feature.id,
      name: feature.name,
      priority: feature.priority,
      enabled
    });
  }

  /**
   * Unregister a feature
   * @param featureId Feature ID
   */
  unregisterFeature(featureId: string): void {
    if (this.features.has(featureId)) {
      this.features.delete(featureId);
      this.logger.info("Feature unregistered", { featureId });
    }
  }

  /**
   * Get degraded mode status
   * @returns Degraded mode status
   */
  getStatus(): DegradedModeStatus {
    return {
      level: this.level,
      timeInCurrentLevelMs: Date.now() - this.levelStartTime,
      levelStartTime: this.levelStartTime,
      autoRecoveryEnabled: this.options.autoRecovery,
      successfulOperations: this.successfulOperations,
      failedOperations: this.failedOperations,
      enabledFeatures: Array.from(this.features.values())
        .filter(f => f.enabled)
        .map(f => f.id),
      disabledFeatures: Array.from(this.features.values())
        .filter(f => !f.enabled)
        .map(f => f.id),
      degradedFeatures: Array.from(this.features.values())
        .filter(f => f.degraded)
        .map(f => f.id)
    };
  }

  /**
   * Get all features
   * @returns Array of feature configurations
   */
  getFeatures(): FeatureConfig[] {
    return Array.from(this.features.values());
  }

  /**
   * Enable auto recovery
   */
  enableAutoRecovery(): void {
    if (!this.options.autoRecovery) {
      this.options.autoRecovery = true;
      this.startRecoveryCheck();
      this.logger.info("Auto recovery enabled");
    }
  }

  /**
   * Disable auto recovery
   */
  disableAutoRecovery(): void {
    if (this.options.autoRecovery) {
      this.options.autoRecovery = false;
      this.stopRecoveryCheck();
      this.logger.info("Auto recovery disabled");
    }
  }

  /**
   * Reset to normal mode
   */
  resetToNormal(): void {
    this.setLevel(DegradedModeLevel.NORMAL);
    this.logger.info("Degraded mode reset to normal");
  }

  /**
   * Update degraded mode options
   * @param options New degraded mode options
   */
  updateOptions(options: Partial<DegradedModeOptions>): void {
    const previousOptions = { ...this.options };
    this.options = { ...this.options, ...options };

    // Restart recovery check if interval changed
    if (this.options.autoRecovery && 
        this.options.recoveryCheckIntervalMs !== previousOptions.recoveryCheckIntervalMs) {
      this.startRecoveryCheck();
    }

    // Start or stop recovery check if auto recovery changed
    if (this.options.autoRecovery !== previousOptions.autoRecovery) {
      if (this.options.autoRecovery) {
        this.startRecoveryCheck();
      } else {
        this.stopRecoveryCheck();
      }
    }

    this.logger.info("Degraded mode options updated", {
      previousOptions,
      newOptions: this.options
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopRecoveryCheck();
    this.removeAllListeners();
    this.logger.info("DegradedModeManager cleaned up");
  }
}