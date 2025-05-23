/**
 * Mock data for the usage dashboard
 */

import { ApiCallType } from '../../../functions/src/monitoring/cost-tracker';

/**
 * Mock usage summary
 */
export const mockUsageSummary = {
  totalCost: 85.75,
  costByType: {
    [ApiCallType.TEXT_EMBEDDING]: 45.20,
    [ApiCallType.VECTOR_SEARCH]: 25.30,
    [ApiCallType.RELATIONSHIP_INFERENCE]: 8.15,
    [ApiCallType.CONTENT_GENERATION]: 5.10,
    [ApiCallType.SESSION_ANALYSIS]: 2.00
  },
  costByUser: {
    'user1@example.com': 35.25,
    'user2@example.com': 25.50,
    'user3@example.com': 15.00,
    'user4@example.com': 10.00
  },
  costByWorld: {
    'world1': 40.25,
    'world2': 30.50,
    'world3': 15.00
  },
  callCount: 12500,
  callCountByType: {
    [ApiCallType.TEXT_EMBEDDING]: 8000,
    [ApiCallType.VECTOR_SEARCH]: 3500,
    [ApiCallType.RELATIONSHIP_INFERENCE]: 500,
    [ApiCallType.CONTENT_GENERATION]: 300,
    [ApiCallType.SESSION_ANALYSIS]: 200
  },
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date()
};/**
 * Mock budget allocations
 */
export const mockBudgetAllocations = [
  {
    featureId: 'embedding',
    featureName: 'Text Embedding',
    budgetAmount: 50.00,
    alertThresholdPercent: 80,
    enforceHardLimit: true,
    currentUsage: 45.20,
    percentageUsed: 90.4,
    isExceeded: false
  },
  {
    featureId: 'vectorSearch',
    featureName: 'Vector Search',
    budgetAmount: 30.00,
    alertThresholdPercent: 70,
    enforceHardLimit: false,
    currentUsage: 25.30,
    percentageUsed: 84.3,
    isExceeded: false
  },
  {
    featureId: 'relationshipInference',
    featureName: 'Relationship Inference',
    budgetAmount: 15.00,
    alertThresholdPercent: 75,
    enforceHardLimit: true,
    currentUsage: 8.15,
    percentageUsed: 54.3,
    isExceeded: false
  },
  {
    featureId: 'contentGeneration',
    featureName: 'Content Generation',
    budgetAmount: 10.00,
    alertThresholdPercent: 85,
    enforceHardLimit: true,
    currentUsage: 5.10,
    percentageUsed: 51.0,
    isExceeded: false
  },
  {
    featureId: 'sessionAnalysis',
    featureName: 'Session Analysis',
    budgetAmount: 5.00,
    alertThresholdPercent: 90,
    enforceHardLimit: false,
    currentUsage: 2.00,
    percentageUsed: 40.0,
    isExceeded: false
  }
];/**
 * Mock optimization recommendations
 */
export const mockOptimizationRecommendations = [
  {
    id: 'rec-1',
    type: 'DIMENSION_REDUCTION',
    title: 'Reduce Embedding Dimensions',
    description: 'Consider reducing the dimension of your embeddings to save costs. Current usage is increasing rapidly.',
    estimatedSavings: 15.00,
    confidenceLevel: 0.8,
    implementationDifficulty: 3,
    implemented: false,
    timestamp: new Date()
  },
  {
    id: 'rec-2',
    type: 'CACHING',
    title: 'Implement Vector Search Caching',
    description: 'Implement caching for vector search results to reduce API calls. Current usage is high.',
    estimatedSavings: 12.50,
    confidenceLevel: 0.9,
    implementationDifficulty: 2,
    implemented: false,
    timestamp: new Date()
  },
  {
    id: 'rec-3',
    type: 'BATCHING',
    title: 'Batch API Calls',
    description: 'Implement batching for API calls to reduce costs. There are opportunities for batching during peak usage times.',
    estimatedSavings: 8.75,
    confidenceLevel: 0.7,
    implementationDifficulty: 2,
    implemented: true,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 5))
  },
  {
    id: 'rec-4',
    type: 'QUERY_OPTIMIZATION',
    title: 'Optimize Vector Queries',
    description: 'Optimize vector queries to reduce costs. Consider using more specific filters and limiting result sets.',
    estimatedSavings: 6.25,
    confidenceLevel: 0.6,
    implementationDifficulty: 4,
    implemented: false,
    timestamp: new Date()
  }
];