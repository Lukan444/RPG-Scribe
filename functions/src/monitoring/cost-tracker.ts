/**
 * Cost Tracker for Vertex AI Integration
 * 
 * This file provides cost tracking functionality for Vertex AI integration,
 * including usage tracking, budget monitoring, and anomaly detection.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { getEnvironmentConfig, CostConfig } from "../config/environment-config";

/**
 * API call type
 */
export enum ApiCallType {
  /** Text embedding generation */
  TEXT_EMBEDDING = "TEXT_EMBEDDING",
  /** Vector search */
  VECTOR_SEARCH = "VECTOR_SEARCH",
  /** Relationship inference */
  RELATIONSHIP_INFERENCE = "RELATIONSHIP_INFERENCE",
  /** Content generation */
  CONTENT_GENERATION = "CONTENT_GENERATION",
  /** Session analysis */
  SESSION_ANALYSIS = "SESSION_ANALYSIS"
}

/**
 * Cost per API call type in USD
 * These are approximate costs and should be updated as pricing changes
 */
export const COST_PER_API_CALL: Record<ApiCallType, number> = {
  [ApiCallType.TEXT_EMBEDDING]: 0.0001, // $0.0001 per 1K characters
  [ApiCallType.VECTOR_SEARCH]: 0.00001, // $0.00001 per search
  [ApiCallType.RELATIONSHIP_INFERENCE]: 0.0002, // $0.0002 per inference
  [ApiCallType.CONTENT_GENERATION]: 0.001, // $0.001 per generation
  [ApiCallType.SESSION_ANALYSIS]: 0.0005 // $0.0005 per analysis
};

/**
 * API call record
 */
export interface ApiCallRecord {
  /** API call type */
  type: ApiCallType;
  /** Timestamp of the call */
  timestamp: admin.firestore.Timestamp;
  /** User ID (if available) */
  userId?: string;
  /** World ID (if available) */
  worldId?: string;
  /** Cost in USD */
  cost: number;
  /** Number of tokens or characters processed */
  units: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Usage summary
 */
export interface UsageSummary {
  /** Total cost in USD */
  totalCost: number;
  /** Cost by API call type */
  costByType: Record<ApiCallType, number>;
  /** Cost by user */
  costByUser: Record<string, number>;
  /** Cost by world */
  costByWorld: Record<string, number>;
  /** Number of API calls */
  callCount: number;
  /** Number of API calls by type */
  callCountByType: Record<ApiCallType, number>;
  /** Start date of the summary period */
  startDate: Date;
  /** End date of the summary period */
  endDate: Date;
}

/**
 * Budget alert
 */
export interface BudgetAlert {
  /** Alert ID */
  id: string;
  /** Alert timestamp */
  timestamp: admin.firestore.Timestamp;
  /** Current cost in USD */
  currentCost: number;
  /** Budget in USD */
  budget: number;
  /** Percentage of budget used */
  percentageUsed: number;
  /** Alert threshold percentage */
  thresholdPercentage: number;
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  /** Whether an anomaly was detected */
  anomalyDetected: boolean;
  /** Anomaly score (0-1, higher means more anomalous) */
  anomalyScore: number;
  /** Expected value */
  expectedValue: number;
  /** Actual value */
  actualValue: number;
  /** Percentage deviation from expected value */
  percentageDeviation: number;
  /** Anomaly type */
  anomalyType: string;
  /** Anomaly description */
  description: string;
}

/**
 * Cost tracker for Vertex AI integration
 */
export class CostTracker {
  private logger: Logger;
  private db: FirebaseFirestore.Firestore;
  private config: CostConfig;
  private dailyUsageCache: Map<string, number> = new Map();
  private lastCacheRefresh: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Create a new cost tracker
   * @param logger Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger.child("CostTracker");
    this.db = admin.firestore();
    
    // Get cost configuration from environment
    const envConfig = getEnvironmentConfig();
    this.config = envConfig.cost;
    
    this.logger.info("Cost tracker initialized", {
      dailyBudget: this.config.dailyBudget,
      alertThresholdPercent: this.config.alertThresholdPercent,
      enableUsageTracking: this.config.enableUsageTracking,
      enableCostAllocationByUser: this.config.enableCostAllocationByUser,
      enableCostAllocationByWorld: this.config.enableCostAllocationByWorld
    });
  }
  
  /**
   * Track an API call
   * @param type API call type
   * @param units Number of tokens or characters processed
   * @param userId Optional user ID
   * @param worldId Optional world ID
   * @param metadata Optional additional metadata
   * @returns API call record
   */
  async trackApiCall(
    type: ApiCallType,
    units: number,
    userId?: string,
    worldId?: string,
    metadata?: Record<string, any>
  ): Promise<ApiCallRecord> {
    // Skip tracking if usage tracking is disabled
    if (!this.config.enableUsageTracking) {
      return {
        type,
        timestamp: admin.firestore.Timestamp.now(),
        userId,
        worldId,
        cost: 0,
        units,
        metadata
      };
    }
    
    try {
      // Calculate cost
      const cost = this.calculateCost(type, units);
      
      // Create API call record
      const record: ApiCallRecord = {
        type,
        timestamp: admin.firestore.Timestamp.now(),
        userId,
        worldId,
        cost,
        units,
        metadata
      };
      
      // Save record to Firestore
      await this.db.collection('apiCalls').add(record);
      
      // Update daily usage cache
      const today = this.getDateString(new Date());
      const currentDailyUsage = await this.getDailyUsage(today);
      this.dailyUsageCache.set(today, currentDailyUsage + cost);
      
      // Check budget
      await this.checkBudget();
      
      // Check for anomalies
      await this.detectAnomalies(type, units, cost);
      
      this.logger.debug("API call tracked", {
        type,
        units,
        cost,
        userId,
        worldId
      });
      
      return record;
    } catch (error) {
      this.logger.error("Failed to track API call", error as Error);
      
      // Return a record even if tracking fails
      return {
        type,
        timestamp: admin.firestore.Timestamp.now(),
        userId,
        worldId,
        cost: this.calculateCost(type, units),
        units,
        metadata
      };
    }
  }
  
  /**
   * Calculate cost for an API call
   * @param type API call type
   * @param units Number of tokens or characters processed
   * @returns Cost in USD
   */
  calculateCost(type: ApiCallType, units: number): number {
    const costPerUnit = COST_PER_API_CALL[type];
    return costPerUnit * units;
  }
  
  /**
   * Get daily usage for a specific date
   * @param dateString Date string in YYYY-MM-DD format
   * @returns Daily usage in USD
   */
  async getDailyUsage(dateString: string): Promise<number> {
    // Check cache first
    if (this.dailyUsageCache.has(dateString) && Date.now() - this.lastCacheRefresh < this.CACHE_TTL_MS) {
      return this.dailyUsageCache.get(dateString) || 0;
    }
    
    try {
      // Get start and end timestamps for the day
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);
      endDate.setDate(endDate.getDate() + 1);
      
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);
      
      // Query Firestore for API calls on the specified date
      const snapshot = await this.db.collection('apiCalls')
        .where('timestamp', '>=', startTimestamp)
        .where('timestamp', '<', endTimestamp)
        .get();
      
      // Calculate total cost
      let totalCost = 0;
      snapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        totalCost += data.cost;
      });
      
      // Update cache
      this.dailyUsageCache.set(dateString, totalCost);
      this.lastCacheRefresh = Date.now();
      
      return totalCost;
    } catch (error) {
      this.logger.error(`Failed to get daily usage for ${dateString}`, error as Error);
      return 0;
    }
  }
  
  /**
   * Check if budget has been exceeded and create alerts if necessary
   */
  async checkBudget(): Promise<void> {
    try {
      // Get today's usage
      const today = this.getDateString(new Date());
      const dailyUsage = await this.getDailyUsage(today);
      
      // Calculate percentage of budget used
      const percentageUsed = (dailyUsage / this.config.dailyBudget) * 100;
      
      // Check if we need to create an alert
      if (percentageUsed >= this.config.alertThresholdPercent) {
        // Check if an alert already exists for today
        const alertsSnapshot = await this.db.collection('budgetAlerts')
          .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(today)))
          .where('timestamp', '<', admin.firestore.Timestamp.fromDate(new Date(new Date(today).setDate(new Date(today).getDate() + 1))))
          .get();
        
        // If no alerts exist for today, create one
        if (alertsSnapshot.empty) {
          const alert: BudgetAlert = {
            id: `alert-${today}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: admin.firestore.Timestamp.now(),
            currentCost: dailyUsage,
            budget: this.config.dailyBudget,
            percentageUsed,
            thresholdPercentage: this.config.alertThresholdPercent,
            acknowledged: false
          };
          
          await this.db.collection('budgetAlerts').doc(alert.id).set(alert);
          
          this.logger.warn("Budget alert created", {
            currentCost: dailyUsage,
            budget: this.config.dailyBudget,
            percentageUsed,
            thresholdPercentage: this.config.alertThresholdPercent
          });
        }
      }
    } catch (error) {
      this.logger.error("Failed to check budget", error as Error);
    }
  }
  
  /**
   * Detect anomalies in API usage
   * @param type API call type
   * @param units Number of tokens or characters processed
   * @param cost Cost in USD
   */
  async detectAnomalies(type: ApiCallType, units: number, cost: number): Promise<void> {
    try {
      // Get historical data for this API call type
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const snapshot = await this.db.collection('apiCalls')
        .where('type', '==', type)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      
      // Calculate average units and cost
      let totalUnits = 0;
      let totalCost = 0;
      let count = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        totalUnits += data.units;
        totalCost += data.cost;
        count++;
      });
      
      // If we don't have enough historical data, skip anomaly detection
      if (count < 10) {
        return;
      }
      
      const avgUnits = totalUnits / count;
      const avgCost = totalCost / count;
      
      // Calculate standard deviation
      let sumSquaredDiffUnits = 0;
      let sumSquaredDiffCost = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        sumSquaredDiffUnits += Math.pow(data.units - avgUnits, 2);
        sumSquaredDiffCost += Math.pow(data.cost - avgCost, 2);
      });
      
      const stdDevUnits = Math.sqrt(sumSquaredDiffUnits / count);
      const stdDevCost = Math.sqrt(sumSquaredDiffCost / count);
      
      // Check for anomalies (more than 3 standard deviations from the mean)
      const unitsZScore = Math.abs(units - avgUnits) / stdDevUnits;
      const costZScore = Math.abs(cost - avgCost) / stdDevCost;
      
      const anomalyThreshold = 3.0; // 3 standard deviations
      
      if (unitsZScore > anomalyThreshold || costZScore > anomalyThreshold) {
        // Create anomaly record
        const anomaly: AnomalyDetectionResult = {
          anomalyDetected: true,
          anomalyScore: Math.max(unitsZScore, costZScore) / anomalyThreshold,
          expectedValue: unitsZScore > costZScore ? avgUnits : avgCost,
          actualValue: unitsZScore > costZScore ? units : cost,
          percentageDeviation: unitsZScore > costZScore 
            ? ((units - avgUnits) / avgUnits) * 100 
            : ((cost - avgCost) / avgCost) * 100,
          anomalyType: unitsZScore > costZScore ? 'units' : 'cost',
          description: `Unusual ${unitsZScore > costZScore ? 'units' : 'cost'} for ${type} API call`
        };
        
        await this.db.collection('anomalies').add({
          timestamp: admin.firestore.Timestamp.now(),
          apiCallType: type,
          units,
          cost,
          ...anomaly
        });
        
        this.logger.warn("Anomaly detected", {
          type,
          units,
          cost,
          anomalyScore: anomaly.anomalyScore,
          expectedValue: anomaly.expectedValue,
          actualValue: anomaly.actualValue,
          percentageDeviation: anomaly.percentageDeviation
        });
      }
    } catch (error) {
      this.logger.error("Failed to detect anomalies", error as Error);
    }
  }
  
  /**
   * Get usage summary for a specific period
   * @param startDate Start date
   * @param endDate End date
   * @returns Usage summary
   */
  async getUsageSummary(startDate: Date, endDate: Date): Promise<UsageSummary> {
    try {
      // Get API calls for the specified period
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);
      
      const snapshot = await this.db.collection('apiCalls')
        .where('timestamp', '>=', startTimestamp)
        .where('timestamp', '<=', endTimestamp)
        .get();
      
      // Initialize summary
      const summary: UsageSummary = {
        totalCost: 0,
        costByType: {
          [ApiCallType.TEXT_EMBEDDING]: 0,
          [ApiCallType.VECTOR_SEARCH]: 0,
          [ApiCallType.RELATIONSHIP_INFERENCE]: 0,
          [ApiCallType.CONTENT_GENERATION]: 0,
          [ApiCallType.SESSION_ANALYSIS]: 0
        },
        costByUser: {},
        costByWorld: {},
        callCount: 0,
        callCountByType: {
          [ApiCallType.TEXT_EMBEDDING]: 0,
          [ApiCallType.VECTOR_SEARCH]: 0,
          [ApiCallType.RELATIONSHIP_INFERENCE]: 0,
          [ApiCallType.CONTENT_GENERATION]: 0,
          [ApiCallType.SESSION_ANALYSIS]: 0
        },
        startDate,
        endDate
      };
      
      // Process API calls
      snapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        
        // Update total cost
        summary.totalCost += data.cost;
        
        // Update cost by type
        summary.costByType[data.type] += data.cost;
        
        // Update cost by user
        if (data.userId && this.config.enableCostAllocationByUser) {
          summary.costByUser[data.userId] = (summary.costByUser[data.userId] || 0) + data.cost;
        }
        
        // Update cost by world
        if (data.worldId && this.config.enableCostAllocationByWorld) {
          summary.costByWorld[data.worldId] = (summary.costByWorld[data.worldId] || 0) + data.cost;
        }
        
        // Update call count
        summary.callCount++;
        
        // Update call count by type
        summary.callCountByType[data.type]++;
      });
      
      return summary;
    } catch (error) {
      this.logger.error("Failed to get usage summary", error as Error);
      throw new AppError(
        "Failed to get usage summary",
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Get date string in YYYY-MM-DD format
   * @param date Date
   * @returns Date string
   */
  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
