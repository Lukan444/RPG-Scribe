/**
 * Usage Analytics for Vertex AI Integration
 * 
 * This file provides usage analytics functionality for Vertex AI integration,
 * including detailed usage tracking, trend analysis, and optimization recommendations.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { ApiCallType, ApiCallRecord } from "./cost-tracker";
import { getEnvironmentConfig } from "../config/environment-config";

/**
 * Usage trend
 */
export enum TrendDirection {
  /** Usage is increasing */
  INCREASING = "INCREASING",
  /** Usage is decreasing */
  DECREASING = "DECREASING",
  /** Usage is stable */
  STABLE = "STABLE",
  /** Not enough data to determine trend */
  UNKNOWN = "UNKNOWN"
}

/**
 * Usage trend analysis result
 */
export interface UsageTrendAnalysis {
  /** API call type */
  apiCallType: ApiCallType;
  /** Current daily average */
  currentDailyAverage: number;
  /** Previous period daily average */
  previousDailyAverage: number;
  /** Percentage change */
  percentageChange: number;
  /** Trend direction */
  trend: TrendDirection;
  /** Projected usage for next period */
  projectedUsage: number;
  /** Confidence level (0-1) */
  confidenceLevel: number;
}/**
 * Usage pattern
 */
export interface UsagePattern {
  /** Hour of day (0-23) */
  hourOfDay: number;
  /** Day of week (0-6, 0 = Sunday) */
  dayOfWeek: number;
  /** Average usage during this time */
  averageUsage: number;
  /** Peak usage during this time */
  peakUsage: number;
  /** Number of samples */
  sampleCount: number;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  /** Recommendation ID */
  id: string;
  /** Recommendation type */
  type: "CACHING" | "BATCHING" | "DIMENSION_REDUCTION" | "QUERY_OPTIMIZATION" | "SCHEDULING" | "FEATURE_THROTTLING";
  /** Recommendation title */
  title: string;
  /** Recommendation description */
  description: string;
  /** Estimated cost savings (USD) */
  estimatedSavings: number;
  /** Confidence level (0-1) */
  confidenceLevel: number;
  /** Implementation difficulty (1-5) */
  implementationDifficulty: number;
  /** Whether the recommendation has been implemented */
  implemented: boolean;
  /** Timestamp when the recommendation was created */
  timestamp: admin.firestore.Timestamp;
}/**
 * Usage analytics for Vertex AI integration
 */
export class UsageAnalytics {
  private logger: Logger;
  private db: FirebaseFirestore.Firestore;
  
  /**
   * Create a new usage analytics instance
   * @param logger Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger.child("UsageAnalytics");
    this.db = admin.firestore();
    
    this.logger.info("Usage analytics initialized");
  }
  
  /**
   * Analyze usage trends
   * @param apiCallType API call type to analyze (optional, analyzes all types if not specified)
   * @param days Number of days to analyze
   * @returns Usage trend analysis results
   */
  async analyzeUsageTrends(
    apiCallType?: ApiCallType,
    days: number = 30
  ): Promise<UsageTrendAnalysis[]> {
    try {
      // Calculate date ranges
      const now = new Date();
      const currentPeriodEnd = new Date(now);
      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
      
      const previousPeriodEnd = new Date(currentPeriodStart);
      const previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - days);      
      // Create timestamps
      const currentPeriodStartTimestamp = admin.firestore.Timestamp.fromDate(currentPeriodStart);
      const currentPeriodEndTimestamp = admin.firestore.Timestamp.fromDate(currentPeriodEnd);
      const previousPeriodStartTimestamp = admin.firestore.Timestamp.fromDate(previousPeriodStart);
      const previousPeriodEndTimestamp = admin.firestore.Timestamp.fromDate(previousPeriodEnd);
      
      // Query Firestore for API calls
      let currentPeriodQuery = this.db.collection('apiCalls')
        .where('timestamp', '>=', currentPeriodStartTimestamp)
        .where('timestamp', '<=', currentPeriodEndTimestamp);
      
      let previousPeriodQuery = this.db.collection('apiCalls')
        .where('timestamp', '>=', previousPeriodStartTimestamp)
        .where('timestamp', '<=', previousPeriodEndTimestamp);
      
      // Filter by API call type if specified
      if (apiCallType) {
        currentPeriodQuery = currentPeriodQuery.where('type', '==', apiCallType);
        previousPeriodQuery = previousPeriodQuery.where('type', '==', apiCallType);
      }
      
      // Execute queries
      const [currentPeriodSnapshot, previousPeriodSnapshot] = await Promise.all([
        currentPeriodQuery.get(),
        previousPeriodQuery.get()
      ]);
      
      // Group API calls by type
      const currentPeriodByType: Record<ApiCallType, ApiCallRecord[]> = {} as Record<ApiCallType, ApiCallRecord[]>;
      const previousPeriodByType: Record<ApiCallType, ApiCallRecord[]> = {} as Record<ApiCallType, ApiCallRecord[]>;      
      // Initialize with all API call types
      Object.values(ApiCallType).forEach(type => {
        currentPeriodByType[type] = [];
        previousPeriodByType[type] = [];
      });
      
      // Process current period
      currentPeriodSnapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        currentPeriodByType[data.type].push(data);
      });
      
      // Process previous period
      previousPeriodSnapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        previousPeriodByType[data.type].push(data);
      });
      
      // Calculate trends for each API call type
      const results: UsageTrendAnalysis[] = [];
      
      for (const type of Object.values(ApiCallType)) {
        // Skip if we're analyzing a specific type and this isn't it
        if (apiCallType && type !== apiCallType) {
          continue;
        }
        
        const currentPeriodCalls = currentPeriodByType[type];
        const previousPeriodCalls = previousPeriodByType[type];
        
        // Calculate daily averages
        const currentDailyAverage = this.calculateDailyAverage(currentPeriodCalls, days);
        const previousDailyAverage = this.calculateDailyAverage(previousPeriodCalls, days);        
        // Calculate percentage change
        const percentageChange = previousDailyAverage > 0
          ? ((currentDailyAverage - previousDailyAverage) / previousDailyAverage) * 100
          : currentDailyAverage > 0 ? 100 : 0;
        
        // Determine trend direction
        let trend: TrendDirection;
        if (currentPeriodCalls.length < 5 || previousPeriodCalls.length < 5) {
          trend = TrendDirection.UNKNOWN;
        } else if (percentageChange > 10) {
          trend = TrendDirection.INCREASING;
        } else if (percentageChange < -10) {
          trend = TrendDirection.DECREASING;
        } else {
          trend = TrendDirection.STABLE;
        }
        
        // Calculate projected usage
        const projectedUsage = this.calculateProjectedUsage(
          currentPeriodCalls,
          previousPeriodCalls,
          days
        );
        
        // Calculate confidence level
        const confidenceLevel = this.calculateConfidenceLevel(
          currentPeriodCalls,
          previousPeriodCalls
        );
        
        results.push({
          apiCallType: type,
          currentDailyAverage,
          previousDailyAverage,
          percentageChange,
          trend,
          projectedUsage,
          confidenceLevel
        });
      }      
      return results;
    } catch (error) {
      this.logger.error("Failed to analyze usage trends", error as Error);
      throw new AppError(
        "Failed to analyze usage trends",
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Analyze usage patterns
   * @param apiCallType API call type to analyze (optional, analyzes all types if not specified)
   * @param days Number of days to analyze
   * @returns Usage patterns
   */
  async analyzeUsagePatterns(
    apiCallType?: ApiCallType,
    days: number = 30
  ): Promise<UsagePattern[]> {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      
      // Create timestamp
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      
      // Query Firestore for API calls
      let query = this.db.collection('apiCalls')
        .where('timestamp', '>=', startTimestamp);
      
      // Filter by API call type if specified
      if (apiCallType) {
        query = query.where('type', '==', apiCallType);
      }      
      // Execute query
      const snapshot = await query.get();
      
      // Initialize patterns
      const patternMap: Record<string, {
        totalCost: number;
        peakCost: number;
        count: number;
      }> = {};
      
      // Process API calls
      snapshot.forEach(doc => {
        const data = doc.data() as ApiCallRecord;
        const timestamp = data.timestamp.toDate();
        const hourOfDay = timestamp.getHours();
        const dayOfWeek = timestamp.getDay();
        const key = `${dayOfWeek}-${hourOfDay}`;
        
        if (!patternMap[key]) {
          patternMap[key] = {
            totalCost: 0,
            peakCost: 0,
            count: 0
          };
        }
        
        patternMap[key].totalCost += data.cost;
        patternMap[key].peakCost = Math.max(patternMap[key].peakCost, data.cost);
        patternMap[key].count++;
      });
      
      // Convert to usage patterns
      const patterns: UsagePattern[] = [];
      
      for (const [key, value] of Object.entries(patternMap)) {
        const [dayOfWeek, hourOfDay] = key.split('-').map(Number);        
        patterns.push({
          hourOfDay,
          dayOfWeek,
          averageUsage: value.totalCost / value.count,
          peakUsage: value.peakCost,
          sampleCount: value.count
        });
      }
      
      // Sort by average usage (descending)
      patterns.sort((a, b) => b.averageUsage - a.averageUsage);
      
      return patterns;
    } catch (error) {
      this.logger.error("Failed to analyze usage patterns", error as Error);
      throw new AppError(
        "Failed to analyze usage patterns",
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Generate optimization recommendations
   * @returns Optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      // Get usage trends
      const trends = await this.analyzeUsageTrends();
      
      // Get usage patterns
      const patterns = await this.analyzeUsagePatterns();
      
      // Generate recommendations
      const recommendations: OptimizationRecommendation[] = [];      
      // Check for high embedding usage
      const embeddingTrend = trends.find(t => t.apiCallType === ApiCallType.TEXT_EMBEDDING);
      if (embeddingTrend && embeddingTrend.trend === TrendDirection.INCREASING && embeddingTrend.percentageChange > 20) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "DIMENSION_REDUCTION",
          title: "Reduce Embedding Dimensions",
          description: "Consider reducing the dimension of your embeddings to save costs. Current usage is increasing rapidly.",
          estimatedSavings: this.estimateSavings("DIMENSION_REDUCTION", embeddingTrend),
          confidenceLevel: 0.8,
          implementationDifficulty: 3,
          implemented: false,
          timestamp: admin.firestore.Timestamp.now()
        });
      }
      
      // Check for high vector search usage
      const searchTrend = trends.find(t => t.apiCallType === ApiCallType.VECTOR_SEARCH);
      if (searchTrend && searchTrend.currentDailyAverage > 1000) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "CACHING",
          title: "Implement Vector Search Caching",
          description: "Implement caching for vector search results to reduce API calls. Current usage is high.",
          estimatedSavings: this.estimateSavings("CACHING", searchTrend),
          confidenceLevel: 0.9,
          implementationDifficulty: 2,
          implemented: false,
          timestamp: admin.firestore.Timestamp.now()
        });
      }      
      // Check for inefficient batching
      const batchingOpportunity = this.detectBatchingOpportunity(patterns);
      if (batchingOpportunity) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "BATCHING",
          title: "Batch API Calls",
          description: "Implement batching for API calls to reduce costs. There are opportunities for batching during peak usage times.",
          estimatedSavings: this.estimateSavings("BATCHING", null),
          confidenceLevel: 0.7,
          implementationDifficulty: 2,
          implemented: false,
          timestamp: admin.firestore.Timestamp.now()
        });
      }
      
      // Check for query optimization opportunities
      const queryOptimizationOpportunity = this.detectQueryOptimizationOpportunity(trends);
      if (queryOptimizationOpportunity) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "QUERY_OPTIMIZATION",
          title: "Optimize Vector Queries",
          description: "Optimize vector queries to reduce costs. Consider using more specific filters and limiting result sets.",
          estimatedSavings: this.estimateSavings("QUERY_OPTIMIZATION", null),
          confidenceLevel: 0.6,
          implementationDifficulty: 4,
          implemented: false,
          timestamp: admin.firestore.Timestamp.now()
        });
      }      
      // Check for scheduling opportunities
      const schedulingOpportunity = this.detectSchedulingOpportunity(patterns);
      if (schedulingOpportunity) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "SCHEDULING",
          title: "Schedule Batch Operations",
          description: "Schedule batch operations during off-peak hours to optimize resource usage and reduce costs.",
          estimatedSavings: this.estimateSavings("SCHEDULING", null),
          confidenceLevel: 0.8,
          implementationDifficulty: 2,
          implemented: false,
          timestamp: admin.firestore.Timestamp.now()
        });
      }
      
      // Check for feature throttling opportunities
      const featureThrottlingOpportunity = this.detectFeatureThrottlingOpportunity(trends);
      if (featureThrottlingOpportunity) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "FEATURE_THROTTLING",
          title: "Implement Feature Throttling",
          description: "Implement throttling for expensive features to control costs. Consider limiting usage based on user tiers.",
          estimatedSavings: this.estimateSavings("FEATURE_THROTTLING", null),
          confidenceLevel: 0.7,
          implementationDifficulty: 3,
          implemented: false,
          timestamp: admin.firestore.Timestamp.now()
        });
      }      
      // Save recommendations to Firestore
      const batch = this.db.batch();
      
      for (const recommendation of recommendations) {
        const docRef = this.db.collection('optimizationRecommendations').doc(recommendation.id);
        batch.set(docRef, recommendation);
      }
      
      await batch.commit();
      
      return recommendations;
    } catch (error) {
      this.logger.error("Failed to generate optimization recommendations", error as Error);
      throw new AppError(
        "Failed to generate optimization recommendations",
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Get optimization recommendations
   * @param implemented Whether to include implemented recommendations
   * @returns Optimization recommendations
   */
  async getOptimizationRecommendations(
    implemented: boolean = false
  ): Promise<OptimizationRecommendation[]> {
    try {
      // Query Firestore for recommendations
      let query = this.db.collection('optimizationRecommendations');
      
      if (!implemented) {
        query = query.where('implemented', '==', false);
      }      
      // Sort by estimated savings (descending)
      query = query.orderBy('estimatedSavings', 'desc');
      
      // Execute query
      const snapshot = await query.get();
      
      // Convert to recommendations
      const recommendations: OptimizationRecommendation[] = [];
      
      snapshot.forEach(doc => {
        recommendations.push(doc.data() as OptimizationRecommendation);
      });
      
      return recommendations;
    } catch (error) {
      this.logger.error("Failed to get optimization recommendations", error as Error);
      throw new AppError(
        "Failed to get optimization recommendations",
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Mark optimization recommendation as implemented
   * @param recommendationId Recommendation ID
   * @returns Updated recommendation
   */
  async markRecommendationImplemented(
    recommendationId: string
  ): Promise<OptimizationRecommendation> {
    try {
      // Get recommendation
      const docRef = this.db.collection('optimizationRecommendations').doc(recommendationId);
      const doc = await docRef.get();      
      if (!doc.exists) {
        throw new AppError(
          `Recommendation not found: ${recommendationId}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Update recommendation
      await docRef.update({
        implemented: true
      });
      
      // Get updated recommendation
      const updatedDoc = await docRef.get();
      
      return updatedDoc.data() as OptimizationRecommendation;
    } catch (error) {
      this.logger.error(`Failed to mark recommendation as implemented: ${recommendationId}`, error as Error);
      throw new AppError(
        `Failed to mark recommendation as implemented: ${recommendationId}`,
        ErrorType.INTERNAL,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Calculate daily average cost
   * @param calls API calls
   * @param days Number of days
   * @returns Daily average cost
   */
  private calculateDailyAverage(calls: ApiCallRecord[], days: number): number {
    if (calls.length === 0) {
      return 0;
    }
    
    const totalCost = calls.reduce((sum, call) => sum + call.cost, 0);
    return totalCost / days;
  }  
  /**
   * Calculate projected usage
   * @param currentCalls Current period API calls
   * @param previousCalls Previous period API calls
   * @param days Number of days
   * @returns Projected usage
   */
  private calculateProjectedUsage(
    currentCalls: ApiCallRecord[],
    previousCalls: ApiCallRecord[],
    days: number
  ): number {
    if (currentCalls.length === 0) {
      return 0;
    }
    
    const currentDailyAverage = this.calculateDailyAverage(currentCalls, days);
    const previousDailyAverage = this.calculateDailyAverage(previousCalls, days);
    
    // If we have enough data, use linear regression
    if (currentCalls.length >= 10 && previousCalls.length >= 10) {
      // Calculate growth rate
      const growthRate = previousDailyAverage > 0
        ? currentDailyAverage / previousDailyAverage
        : 1;
      
      // Apply growth rate to current average
      return currentDailyAverage * growthRate;
    }
    
    // Otherwise, just return current average
    return currentDailyAverage;
  }
  
  /**
   * Calculate confidence level
   * @param currentCalls Current period API calls
   * @param previousCalls Previous period API calls
   * @returns Confidence level (0-1)
   */  private calculateConfidenceLevel(
    currentCalls: ApiCallRecord[],
    previousCalls: ApiCallRecord[]
  ): number {
    // More data = higher confidence
    const dataPoints = currentCalls.length + previousCalls.length;
    
    if (dataPoints < 10) {
      return 0.3; // Low confidence
    } else if (dataPoints < 50) {
      return 0.6; // Medium confidence
    } else {
      return 0.9; // High confidence
    }
  }
  
  /**
   * Detect batching opportunity
   * @param patterns Usage patterns
   * @returns Whether there's a batching opportunity
   */
  private detectBatchingOpportunity(patterns: UsagePattern[]): boolean {
    // Look for patterns with high sample count and high average usage
    return patterns.some(p => p.sampleCount > 100 && p.averageUsage > 0.1);
  }
  
  /**
   * Detect query optimization opportunity
   * @param trends Usage trends
   * @returns Whether there's a query optimization opportunity
   */
  private detectQueryOptimizationOpportunity(trends: UsageTrendAnalysis[]): boolean {
    // Look for increasing vector search usage
    const searchTrend = trends.find(t => t.apiCallType === ApiCallType.VECTOR_SEARCH);
    return searchTrend !== undefined && 
           searchTrend.trend === TrendDirection.INCREASING && 
           searchTrend.percentageChange > 15;
  }  
  /**
   * Detect scheduling opportunity
   * @param patterns Usage patterns
   * @returns Whether there's a scheduling opportunity
   */
  private detectSchedulingOpportunity(patterns: UsagePattern[]): boolean {
    // Look for patterns with high peak usage
    const highPeakPatterns = patterns.filter(p => p.peakUsage > 0.5);
    const lowUsagePatterns = patterns.filter(p => p.averageUsage < 0.05 && p.sampleCount > 10);
    
    return highPeakPatterns.length > 0 && lowUsagePatterns.length > 0;
  }
  
  /**
   * Detect feature throttling opportunity
   * @param trends Usage trends
   * @returns Whether there's a feature throttling opportunity
   */
  private detectFeatureThrottlingOpportunity(trends: UsageTrendAnalysis[]): boolean {
    // Look for rapidly increasing usage in any API call type
    return trends.some(t => t.trend === TrendDirection.INCREASING && t.percentageChange > 30);
  }
  
  /**
   * Estimate savings for a recommendation
   * @param recommendationType Recommendation type
   * @param trend Usage trend (if applicable)
   * @returns Estimated savings in USD
   */
  private estimateSavings(
    recommendationType: string,
    trend: UsageTrendAnalysis | null
  ): number {
    // Get daily budget
    const config = getEnvironmentConfig();
    const dailyBudget = config.cost.dailyBudget;    
    // Calculate base savings as percentage of daily budget
    let savingsPercentage = 0;
    
    switch (recommendationType) {
      case "DIMENSION_REDUCTION":
        savingsPercentage = 0.3; // 30% savings
        break;
      case "CACHING":
        savingsPercentage = 0.4; // 40% savings
        break;
      case "BATCHING":
        savingsPercentage = 0.25; // 25% savings
        break;
      case "QUERY_OPTIMIZATION":
        savingsPercentage = 0.2; // 20% savings
        break;
      case "SCHEDULING":
        savingsPercentage = 0.15; // 15% savings
        break;
      case "FEATURE_THROTTLING":
        savingsPercentage = 0.35; // 35% savings
        break;
      default:
        savingsPercentage = 0.1; // 10% savings
    }
    
    // Adjust based on trend if available
    if (trend) {
      if (trend.trend === TrendDirection.INCREASING) {
        savingsPercentage *= 1.5; // 50% more savings for increasing trends
      } else if (trend.trend === TrendDirection.DECREASING) {
        savingsPercentage *= 0.7; // 30% less savings for decreasing trends
      }
    }
    
    // Calculate savings
    return dailyBudget * savingsPercentage * 30; // Monthly savings
  }
}