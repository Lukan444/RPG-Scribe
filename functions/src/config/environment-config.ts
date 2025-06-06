/**
 * Environment Configuration for RPG Scribe
 * 
 * This file provides environment-specific configuration for the RPG Scribe application.
 * It supports different configurations for development, staging, and production environments.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";

// Initialize logger
const logger = new Logger("EnvironmentConfig");

/**
 * Vertex AI configuration
 */
export interface VertexAIConfig {
  /** Environment name */
  environment: string;
  /** Google Cloud project ID */
  projectId: string;
  /** Google Cloud region */
  location: string;
  /** Vertex AI index endpoint */
  indexEndpoint: string;
  /** Embedding model name */
  embeddingModel: string;
  /** Namespace for vector index */
  namespace: string;
  /** API endpoint */
  apiEndpoint: string;
  /** Maximum number of retries for API calls */
  maxRetries: number;
  /** Timeout in milliseconds for API calls */
  timeoutMs: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** List of allowed IP addresses or CIDR ranges */
  allowedIPs: string[];
  /** List of allowed origins */
  allowedOrigins: string[];
  /** Whether to enable rate limiting */
  enableRateLimiting: boolean;
  /** Maximum number of requests per minute */
  maxRequestsPerMinute: number;
  /** Whether to log security events */
  enableSecurityLogging: boolean;
}

/**
 * Cost management configuration
 */
export interface CostConfig {
  /** Daily budget in USD */
  dailyBudget: number;
  /** Alert threshold as percentage of budget */
  alertThresholdPercent: number;
  /** Whether to enable usage tracking */
  enableUsageTracking: boolean;
  /** Whether to enable cost allocation by user */
  enableCostAllocationByUser: boolean;
  /** Whether to enable cost allocation by world */
  enableCostAllocationByWorld: boolean;
}

/**
 * Feature flags configuration
 */
export interface FeatureFlagsConfig {
  /** Whether to enable Vertex AI integration */
  enableVertexAI: boolean;
  /** Whether to enable vector search */
  enableVectorSearch: boolean;
  /** Whether to enable AI-powered relationship inference */
  enableRelationshipInference: boolean;
  /** Whether to enable AI-powered content generation */
  enableContentGeneration: boolean;
  /** Whether to enable AI-powered session analysis */
  enableSessionAnalysis: boolean;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  /** Environment name */
  name: string;
  /** Vertex AI configuration */
  vertexAI: VertexAIConfig;
  /** Security configuration */
  security: SecurityConfig;
  /** Cost management configuration */
  cost: CostConfig;
  /** Feature flags configuration */
  featureFlags: FeatureFlagsConfig;
}

/**
 * Default configurations for different environments
 */
const defaultConfigs: Record<string, EnvironmentConfig> = {
  test: {
    name: "test",
    vertexAI: {
      environment: "test",
      projectId: "test-project",
      location: "test-location",
      indexEndpoint: "test-endpoint",
      embeddingModel: "test-model",
      namespace: "test",
      apiEndpoint: "test-api-endpoint",
      maxRetries: 1,
      timeoutMs: 5000
    },
    security: {
      allowedIPs: [],
      allowedOrigins: ["https://test.com", "https://test2.com"],
      enableRateLimiting: true,
      maxRequestsPerMinute: 42,
      enableSecurityLogging: false
    },
    cost: {
      dailyBudget: 1,
      alertThresholdPercent: 90,
      enableUsageTracking: false,
      enableCostAllocationByUser: false,
      enableCostAllocationByWorld: false
    },
    featureFlags: {
      enableVertexAI: true,
      enableVectorSearch: false,
      enableRelationshipInference: false,
      enableContentGeneration: false,
      enableSessionAnalysis: false
    }
  },
  development: {
    name: "development",
    vertexAI: {
      environment: "development",
      projectId: "rpg-scribe-dev",
      location: "us-central1",
      indexEndpoint: "dev-endpoint",
      embeddingModel: "textembedding-gecko@latest",
      namespace: "dev",
      apiEndpoint: "us-central1-aiplatform.googleapis.com",
      maxRetries: 3,
      timeoutMs: 10000
    },
    security: {
      allowedIPs: [],
      allowedOrigins: ["http://localhost:*", "https://*.rpgscribe-dev.web.app"],
      enableRateLimiting: true,
      maxRequestsPerMinute: 100,
      enableSecurityLogging: true
    },
    cost: {
      dailyBudget: 10,
      alertThresholdPercent: 80,
      enableUsageTracking: true,
      enableCostAllocationByUser: true,
      enableCostAllocationByWorld: true
    },
    featureFlags: {
      enableVertexAI: true,
      enableVectorSearch: true,
      enableRelationshipInference: true,
      enableContentGeneration: true,
      enableSessionAnalysis: true
    }
  },
  staging: {
    name: "staging",
    vertexAI: {
      environment: "staging",
      projectId: "rpg-scribe-staging",
      location: "us-central1",
      indexEndpoint: "staging-endpoint",
      embeddingModel: "textembedding-gecko@latest",
      namespace: "staging",
      apiEndpoint: "us-central1-aiplatform.googleapis.com",
      maxRetries: 3,
      timeoutMs: 10000
    },
    security: {
      allowedIPs: [],
      allowedOrigins: ["https://*.rpgscribe-staging.web.app"],
      enableRateLimiting: true,
      maxRequestsPerMinute: 50,
      enableSecurityLogging: true
    },
    cost: {
      dailyBudget: 50,
      alertThresholdPercent: 70,
      enableUsageTracking: true,
      enableCostAllocationByUser: true,
      enableCostAllocationByWorld: true
    },
    featureFlags: {
      enableVertexAI: true,
      enableVectorSearch: true,
      enableRelationshipInference: true,
      enableContentGeneration: true,
      enableSessionAnalysis: true
    }
  },
  production: {
    name: "production",
    vertexAI: {
      environment: "production",
      projectId: "rpg-scribe-prod",
      location: "us-central1",
      indexEndpoint: "prod-endpoint",
      embeddingModel: "textembedding-gecko@latest",
      namespace: "prod",
      apiEndpoint: "us-central1-aiplatform.googleapis.com",
      maxRetries: 5,
      timeoutMs: 15000
    },
    security: {
      allowedIPs: [],
      allowedOrigins: ["https://app.rpgscribe.com", "https://*.rpgscribe.com"],
      enableRateLimiting: true,
      maxRequestsPerMinute: 30,
      enableSecurityLogging: true
    },
    cost: {
      dailyBudget: 100,
      alertThresholdPercent: 60,
      enableUsageTracking: true,
      enableCostAllocationByUser: true,
      enableCostAllocationByWorld: true
    },
    featureFlags: {
      enableVertexAI: true,
      enableVectorSearch: true,
      enableRelationshipInference: true,
      enableContentGeneration: true,
      enableSessionAnalysis: true
    }
  }
};

// Cache for environment config
let cachedConfig: EnvironmentConfig | null = null;
let cachedConfigTimestamp: number = 0;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the current environment name
 * @returns Current environment name
 */
export function getCurrentEnvironment(): string {
  return process.env.NODE_ENV || functions.config().environment?.name || "development";
}

/**
 * Get the configuration for the current environment
 * @param forceRefresh Whether to force a refresh of the cached config
 * @returns Environment configuration
 */
export function getEnvironmentConfig(forceRefresh: boolean = false): EnvironmentConfig {
  const now = Date.now();
  
  // Return cached config if it's still valid
  if (!forceRefresh && cachedConfig && now - cachedConfigTimestamp < CONFIG_CACHE_TTL_MS) {
    return cachedConfig;
  }
  
  // Get environment name
  const environment = getCurrentEnvironment();
  logger.debug(`Getting configuration for environment: ${environment}`);
  
  // Get default config for environment
  const defaultConfig = defaultConfigs[environment] || defaultConfigs.development;
  
  // Create a deep copy of the default config
  const config = JSON.parse(JSON.stringify(defaultConfig)) as EnvironmentConfig;
  
  try {
    // Override with values from Firebase Functions config
    const functionsConfig = functions.config();
    
    // Override Vertex AI config
    if (functionsConfig.vertex_ai) {
      config.vertexAI = {
        ...config.vertexAI,
        projectId: functionsConfig.vertex_ai.project_id || config.vertexAI.projectId,
        location: functionsConfig.vertex_ai.location || config.vertexAI.location,
        indexEndpoint: functionsConfig.vertex_ai.index_endpoint || config.vertexAI.indexEndpoint,
        embeddingModel: functionsConfig.vertex_ai.embedding_model || config.vertexAI.embeddingModel,
        namespace: functionsConfig.vertex_ai.namespace || config.vertexAI.namespace,
        apiEndpoint: functionsConfig.vertex_ai.api_endpoint || config.vertexAI.apiEndpoint,
        maxRetries: parseInt(functionsConfig.vertex_ai.max_retries) || config.vertexAI.maxRetries,
        timeoutMs: parseInt(functionsConfig.vertex_ai.timeout_ms) || config.vertexAI.timeoutMs
      };
    }
    
    // Override security config
    if (functionsConfig.security) {
      config.security = {
        ...config.security,
        allowedIPs: functionsConfig.security.allowed_ips?.split(',') || config.security.allowedIPs,
        allowedOrigins: functionsConfig.security.allowed_origins?.split(',') || config.security.allowedOrigins,
        enableRateLimiting: functionsConfig.security.enable_rate_limiting === 'true' || config.security.enableRateLimiting,
        maxRequestsPerMinute: parseInt(functionsConfig.security.max_requests_per_minute) || config.security.maxRequestsPerMinute,
        enableSecurityLogging: functionsConfig.security.enable_security_logging === 'true' || config.security.enableSecurityLogging
      };
    }
    
    // Override cost config
    if (functionsConfig.cost) {
      config.cost = {
        ...config.cost,
        dailyBudget: parseFloat(functionsConfig.cost.daily_budget) || config.cost.dailyBudget,
        alertThresholdPercent: parseInt(functionsConfig.cost.alert_threshold_percent) || config.cost.alertThresholdPercent,
        enableUsageTracking: functionsConfig.cost.enable_usage_tracking === 'true' || config.cost.enableUsageTracking,
        enableCostAllocationByUser: functionsConfig.cost.enable_cost_allocation_by_user === 'true' || config.cost.enableCostAllocationByUser,
        enableCostAllocationByWorld: functionsConfig.cost.enable_cost_allocation_by_world === 'true' || config.cost.enableCostAllocationByWorld
      };
    }
    
    // Override feature flags
    if (functionsConfig.feature_flags) {
      config.featureFlags = {
        ...config.featureFlags,
        enableVertexAI: functionsConfig.feature_flags.enable_vertex_ai === 'true' || config.featureFlags.enableVertexAI,
        enableVectorSearch: functionsConfig.feature_flags.enable_vector_search === 'true' || config.featureFlags.enableVectorSearch,
        enableRelationshipInference: functionsConfig.feature_flags.enable_relationship_inference === 'true' || config.featureFlags.enableRelationshipInference,
        enableContentGeneration: functionsConfig.feature_flags.enable_content_generation === 'true' || config.featureFlags.enableContentGeneration,
        enableSessionAnalysis: functionsConfig.feature_flags.enable_session_analysis === 'true' || config.featureFlags.enableSessionAnalysis
      };
    }
    
    // Validate config
    validateConfig(config);
    
    // Cache config
    cachedConfig = config;
    cachedConfigTimestamp = now;
    
    return config;
  } catch (error) {
    logger.error("Failed to get environment config", error as Error);
    
    // Return default config if there's an error
    return defaultConfig;
  }
}

/**
 * Validate environment configuration
 * @param config Environment configuration to validate
 * @throws AppError if configuration is invalid
 */
function validateConfig(config: EnvironmentConfig): void {
  // Validate Vertex AI config
  if (!config.vertexAI.projectId) {
    throw new AppError(
      "Missing Vertex AI project ID",
      ErrorType.CONFIGURATION,
      500
    );
  }
  
  if (!config.vertexAI.location) {
    throw new AppError(
      "Missing Vertex AI location",
      ErrorType.CONFIGURATION,
      500
    );
  }
  
  if (!config.vertexAI.embeddingModel) {
    throw new AppError(
      "Missing Vertex AI embedding model",
      ErrorType.CONFIGURATION,
      500
    );
  }
  
  // Validate cost config
  if (config.cost.dailyBudget <= 0) {
    throw new AppError(
      "Daily budget must be greater than 0",
      ErrorType.CONFIGURATION,
      500
    );
  }
  
  if (config.cost.alertThresholdPercent <= 0 || config.cost.alertThresholdPercent > 100) {
    throw new AppError(
      "Alert threshold percent must be between 1 and 100",
      ErrorType.CONFIGURATION,
      500
    );
  }
}

/**
 * Get secure credentials from Firestore
 * @param credentialKey Key for the credential to retrieve
 * @returns Credential value
 */
export async function getSecureCredential(credentialKey: string): Promise<string> {
  try {
    // Get environment
    const environment = getCurrentEnvironment();
    
    // Get credential from Firestore
    const db = admin.firestore();
    const docRef = db.collection('secureCredentials').doc(environment);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new AppError(
        `No secure credentials found for environment: ${environment}`,
        ErrorType.CONFIGURATION,
        500
      );
    }
    
    const data = doc.data();
    if (!data || !data[credentialKey]) {
      throw new AppError(
        `Credential not found: ${credentialKey}`,
        ErrorType.CONFIGURATION,
        500
      );
    }
    
    return data[credentialKey];
  } catch (error) {
    logger.error(`Failed to get secure credential: ${credentialKey}`, error as Error);
    throw new AppError(
      `Failed to get secure credential: ${credentialKey}`,
      ErrorType.CONFIGURATION,
      500,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Set secure credential in Firestore
 * @param credentialKey Key for the credential to set
 * @param credentialValue Value for the credential
 */
export async function setSecureCredential(credentialKey: string, credentialValue: string): Promise<void> {
  try {
    // Get environment
    const environment = getCurrentEnvironment();
    
    // Set credential in Firestore
    const db = admin.firestore();
    const docRef = db.collection('secureCredentials').doc(environment);
    
    await docRef.set({
      [credentialKey]: credentialValue
    }, { merge: true });
    
    logger.info(`Secure credential set: ${credentialKey}`);
  } catch (error) {
    logger.error(`Failed to set secure credential: ${credentialKey}`, error as Error);
    throw new AppError(
      `Failed to set secure credential: ${credentialKey}`,
      ErrorType.CONFIGURATION,
      500,
      error instanceof Error ? error : undefined
    );
  }
}
