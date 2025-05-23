/**
 * Budget Manager for Vertex AI Integration
 * 
 * This file provides budget management functionality for Vertex AI integration,
 * including budget allocation, alerts, and automated cost control.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { ApiCallType } from "./cost-tracker";
import { getEnvironmentConfig } from "../config/environment-config";

/**
 * Budget allocation
 */
export interface BudgetAllocation {
  /** Feature ID */
  featureId: string;
  /** Feature name */
  featureName: string;
  /** Budget amount in USD */
  budgetAmount: number;
  /** Alert threshold percentage */
  alertThresholdPercent: number;
  /** Whether to enforce hard limit */
  enforceHardLimit: boolean;
  /** Current usage in USD */
  currentUsage: number;
  /** Percentage of budget used */
  percentageUsed: number;
  /** Whether the budget is exceeded */
  isExceeded: boolean;
}/**
 * Budget alert
 */
export interface BudgetAlert {
  /** Alert ID */
  id: string;
  /** Feature ID */
  featureId: string;
  /** Feature name */
  featureName: string;
  /** Alert timestamp */
  timestamp: admin.firestore.Timestamp;
  /** Current usage in USD */
  currentUsage: number;
  /** Budget amount in USD */
  budgetAmount: number;
  /** Percentage of budget used */
  percentageUsed: number;
  /** Alert threshold percentage */
  thresholdPercentage: number;
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
  /** Whether automatic action was taken */
  automaticActionTaken: boolean;
  /** Description of automatic action */
  automaticActionDescription?: string;
}

/**
 * Cost control action
 */
export enum CostControlAction {
  /** No action */
  NONE = "NONE",
  /** Throttle usage */
  THROTTLE = "THROTTLE",
  /** Disable feature */
  DISABLE = "DISABLE",
  /** Send alert */
  ALERT = "ALERT"
}/**
 * Feature budget configuration
 */
export interface FeatureBudgetConfig {
  /** Feature ID */
  featureId: string;
  /** Feature name */
  featureName: string;
  /** Budget amount in USD */
  budgetAmount: number;
  /** Alert threshold percentage */
  alertThresholdPercent: number;
  /** Whether to enforce hard limit */
  enforceHardLimit: boolean;
  /** Action to take when budget is exceeded */
  budgetExceededAction: CostControlAction;
  /** Action to take when budget is approaching threshold */
  budgetApproachingAction: CostControlAction;
  /** API call types associated with this feature */
  apiCallTypes: ApiCallType[];
}

/**
 * Budget manager for Vertex AI integration
 */
export class BudgetManager {
  private logger: Logger;
  private db: FirebaseFirestore.Firestore;
  private featureBudgets: Map<string, FeatureBudgetConfig> = new Map();
  private dailyUsageCache: Map<string, number> = new Map();
  private lastCacheRefresh: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes  
  /**
   * Create a new budget manager
   * @param logger Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger.child("BudgetManager");
    this.db = admin.firestore();
    
    // Initialize feature budgets
    this.initializeFeatureBudgets();
    
    this.logger.info("Budget manager initialized");
  }
  
  /**
   * Initialize feature budgets
   */
  private async initializeFeatureBudgets(): Promise<void> {
    try {
      // Get environment config
      const config = getEnvironmentConfig();
      const totalBudget = config.cost.dailyBudget;
      
      // Default feature budgets
      const defaultFeatureBudgets: FeatureBudgetConfig[] = [
        {
          featureId: "embedding",
          featureName: "Text Embedding",
          budgetAmount: totalBudget * 0.4, // 40% of total budget
          alertThresholdPercent: 80,
          enforceHardLimit: true,
          budgetExceededAction: CostControlAction.THROTTLE,
          budgetApproachingAction: CostControlAction.ALERT,
          apiCallTypes: [ApiCallType.TEXT_EMBEDDING]
        },        {
          featureId: "vectorSearch",
          featureName: "Vector Search",
          budgetAmount: totalBudget * 0.3, // 30% of total budget
          alertThresholdPercent: 70,
          enforceHardLimit: false,
          budgetExceededAction: CostControlAction.ALERT,
          budgetApproachingAction: CostControlAction.ALERT,
          apiCallTypes: [ApiCallType.VECTOR_SEARCH]
        },
        {
          featureId: "relationshipInference",
          featureName: "Relationship Inference",
          budgetAmount: totalBudget * 0.15, // 15% of total budget
          alertThresholdPercent: 75,
          enforceHardLimit: true,
          budgetExceededAction: CostControlAction.DISABLE,
          budgetApproachingAction: CostControlAction.THROTTLE,
          apiCallTypes: [ApiCallType.RELATIONSHIP_INFERENCE]
        },
        {
          featureId: "contentGeneration",
          featureName: "Content Generation",
          budgetAmount: totalBudget * 0.1, // 10% of total budget
          alertThresholdPercent: 85,
          enforceHardLimit: true,
          budgetExceededAction: CostControlAction.DISABLE,
          budgetApproachingAction: CostControlAction.THROTTLE,
          apiCallTypes: [ApiCallType.CONTENT_GENERATION]
        },        {
          featureId: "sessionAnalysis",
          featureName: "Session Analysis",
          budgetAmount: totalBudget * 0.05, // 5% of total budget
          alertThresholdPercent: 90,
          enforceHardLimit: false,
          budgetExceededAction: CostControlAction.ALERT,
          budgetApproachingAction: CostControlAction.ALERT,
          apiCallTypes: [ApiCallType.SESSION_ANALYSIS]
        }
      ];
      
      // Get custom feature budgets from Firestore
      const snapshot = await this.db.collection('featureBudgets').get();
      
      // Initialize with default budgets
      for (const budget of defaultFeatureBudgets) {
        this.featureBudgets.set(budget.featureId, budget);
      }
      
      // Override with custom budgets from Firestore
      snapshot.forEach(doc => {
        const customBudget = doc.data() as FeatureBudgetConfig;
        this.featureBudgets.set(customBudget.featureId, customBudget);
      });
      
      this.logger.info("Feature budgets initialized", {
        featureBudgetCount: this.featureBudgets.size
      });
    } catch (error) {
      this.logger.error("Failed to initialize feature budgets", error as Error);
    }
  }  
  /**
   * Check budget for an API call
   * @param type API call type
   * @param cost Cost in USD
   * @returns Cost control action to take
   */
  async checkBudget(type: ApiCallType, cost: number): Promise<CostControlAction> {
    try {
      // Find feature budget for this API call type
      const featureBudget = this.findFeatureBudgetForApiCallType(type);
      
      if (!featureBudget) {
        // No budget configured for this API call type
        return CostControlAction.NONE;
      }
      
      // Get current usage
      const today = this.getDateString(new Date());
      const currentUsage = await this.getFeatureUsage(featureBudget.featureId, today);
      
      // Calculate new usage
      const newUsage = currentUsage + cost;
      
      // Calculate percentage of budget used
      const percentageUsed = (newUsage / featureBudget.budgetAmount) * 100;
      
      // Update cache
      this.dailyUsageCache.set(`${featureBudget.featureId}-${today}`, newUsage);
      
      // Check if budget is exceeded
      if (percentageUsed >= 100) {
        // Create budget alert
        await this.createBudgetAlert(
          featureBudget,
          newUsage,
          percentageUsed,
          true
        );        
        // Take action based on configuration
        if (featureBudget.enforceHardLimit) {
          this.logger.warn(`Budget exceeded for feature: ${featureBudget.featureName}`, {
            featureId: featureBudget.featureId,
            budgetAmount: featureBudget.budgetAmount,
            currentUsage: newUsage,
            percentageUsed,
            action: featureBudget.budgetExceededAction
          });
          
          return featureBudget.budgetExceededAction;
        }
      }
      // Check if budget is approaching threshold
      else if (percentageUsed >= featureBudget.alertThresholdPercent) {
        // Create budget alert
        await this.createBudgetAlert(
          featureBudget,
          newUsage,
          percentageUsed,
          false
        );
        
        this.logger.warn(`Budget approaching threshold for feature: ${featureBudget.featureName}`, {
          featureId: featureBudget.featureId,
          budgetAmount: featureBudget.budgetAmount,
          currentUsage: newUsage,
          percentageUsed,
          threshold: featureBudget.alertThresholdPercent,
          action: featureBudget.budgetApproachingAction
        });
        
        return featureBudget.budgetApproachingAction;
      }
      
      return CostControlAction.NONE;    } catch (error) {
      this.logger.error("Failed to check budget", error as Error);
      return CostControlAction.NONE;
    }
  }
  
  /**
   * Get feature usage for a specific date
   * @param featureId Feature ID
   * @param dateString Date string in YYYY-MM-DD format
   * @returns Feature usage in USD
   */
  async getFeatureUsage(featureId: string, dateString: string): Promise<number> {
    // Check cache first
    const cacheKey = `${featureId}-${dateString}`;
    if (this.dailyUsageCache.has(cacheKey) && Date.now() - this.lastCacheRefresh < this.CACHE_TTL_MS) {
      return this.dailyUsageCache.get(cacheKey) || 0;
    }
    
    try {
      // Get feature budget
      const featureBudget = this.featureBudgets.get(featureId);
      
      if (!featureBudget) {
        return 0;
      }
      
      // Get start and end timestamps for the day
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);
      endDate.setDate(endDate.getDate() + 1);
      
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);      
      // Query Firestore for API calls on the specified date
      let totalCost = 0;
      
      // Query for each API call type associated with this feature
      for (const apiCallType of featureBudget.apiCallTypes) {
        const snapshot = await this.db.collection('apiCalls')
          .where('timestamp', '>=', startTimestamp)
          .where('timestamp', '<', endTimestamp)
          .where('type', '==', apiCallType)
          .get();
        
        // Calculate total cost
        snapshot.forEach(doc => {
          const data = doc.data();
          totalCost += data.cost;
        });
      }
      
      // Update cache
      this.dailyUsageCache.set(cacheKey, totalCost);
      this.lastCacheRefresh = Date.now();
      
      return totalCost;
    } catch (error) {
      this.logger.error(`Failed to get feature usage for ${featureId} on ${dateString}`, error as Error);
      return 0;
    }
  }
  
  /**
   * Create a budget alert
   * @param featureBudget Feature budget
   * @param currentUsage Current usage in USD
   * @param percentageUsed Percentage of budget used
   * @param isExceeded Whether the budget is exceeded
   */  private async createBudgetAlert(
    featureBudget: FeatureBudgetConfig,
    currentUsage: number,
    percentageUsed: number,
    isExceeded: boolean
  ): Promise<void> {
    try {
      // Check if an alert already exists for today
      const today = this.getDateString(new Date());
      const startDate = new Date(today);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
      
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);
      
      const alertsSnapshot = await this.db.collection('budgetAlerts')
        .where('featureId', '==', featureBudget.featureId)
        .where('timestamp', '>=', startTimestamp)
        .where('timestamp', '<', endTimestamp)
        .get();
      
      // If no alerts exist for today, create one
      if (alertsSnapshot.empty) {
        const action = isExceeded
          ? featureBudget.budgetExceededAction
          : featureBudget.budgetApproachingAction;
        
        const alert: BudgetAlert = {
          id: `alert-${featureBudget.featureId}-${today}-${Math.random().toString(36).substring(2, 9)}`,
          featureId: featureBudget.featureId,
          featureName: featureBudget.featureName,
          timestamp: admin.firestore.Timestamp.now(),
          currentUsage,
          budgetAmount: featureBudget.budgetAmount,
          percentageUsed,
          thresholdPercentage: featureBudget.alertThresholdPercent,
          acknowledged: false,
          automaticActionTaken: action !== CostControlAction.NONE,
          automaticActionDescription: this.getActionDescription(action)
        };        
        await this.db.collection('budgetAlerts').doc(alert.id).set(alert);
        
        this.logger.warn("Budget alert created", {
          featureId: featureBudget.featureId,
          featureName: featureBudget.featureName,
          currentUsage,
          budgetAmount: featureBudget.budgetAmount,
          percentageUsed,
          isExceeded,
          action
        });
      }
    } catch (error) {
      this.logger.error("Failed to create budget alert", error as Error);
    }
  }
  
  /**
   * Get action description
   * @param action Cost control action
   * @returns Action description
   */
  private getActionDescription(action: CostControlAction): string | undefined {
    switch (action) {
      case CostControlAction.THROTTLE:
        return "Usage throttled to reduce costs";
      case CostControlAction.DISABLE:
        return "Feature temporarily disabled due to budget constraints";
      case CostControlAction.ALERT:
        return "Alert sent to administrators";
      case CostControlAction.NONE:
      default:
        return undefined;
    }
  }  
  /**
   * Find feature budget for an API call type
   * @param type API call type
   * @returns Feature budget or undefined if not found
   */
  private findFeatureBudgetForApiCallType(type: ApiCallType): FeatureBudgetConfig | undefined {
    for (const budget of this.featureBudgets.values()) {
      if (budget.apiCallTypes.includes(type)) {
        return budget;
      }
    }
    return undefined;
  }
  
  /**
   * Get all budget allocations
   * @returns Budget allocations
   */
  async getAllBudgetAllocations(): Promise<BudgetAllocation[]> {
    try {
      const today = this.getDateString(new Date());
      const allocations: BudgetAllocation[] = [];
      
      // Get usage for each feature
      for (const budget of this.featureBudgets.values()) {
        const currentUsage = await this.getFeatureUsage(budget.featureId, today);
        const percentageUsed = (currentUsage / budget.budgetAmount) * 100;
        
        allocations.push({
          featureId: budget.featureId,
          featureName: budget.featureName,
          budgetAmount: budget.budgetAmount,
          alertThresholdPercent: budget.alertThresholdPercent,
          enforceHardLimit: budget.enforceHardLimit,
          currentUsage,
          percentageUsed,
          isExceeded: percentageUsed >= 100
        });
      }      
      return allocations;
    } catch (error) {
      this.logger.error("Failed to get budget allocations", error as Error);
      throw new AppError(
        "Failed to get budget allocations",
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Get active budget alerts
   * @param acknowledged Whether to include acknowledged alerts
   * @returns Budget alerts
   */
  async getActiveBudgetAlerts(acknowledged: boolean = false): Promise<BudgetAlert[]> {
    try {
      // Query Firestore for alerts
      let query = this.db.collection('budgetAlerts');
      
      if (!acknowledged) {
        query = query.where('acknowledged', '==', false);
      }
      
      // Sort by timestamp (descending)
      query = query.orderBy('timestamp', 'desc');
      
      // Execute query
      const snapshot = await query.get();
      
      // Convert to alerts
      const alerts: BudgetAlert[] = [];
      
      snapshot.forEach(doc => {
        alerts.push(doc.data() as BudgetAlert);
      });
      
      return alerts;
    } catch (error) {
      this.logger.error("Failed to get active budget alerts", error as Error);
      throw new AppError(
        "Failed to get active budget alerts",
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