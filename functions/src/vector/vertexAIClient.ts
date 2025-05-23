/**
 * Vertex AI Client for Cloud Functions
 *
 * This class handles the communication with Google's Vertex AI API
 * for generating and storing vector embeddings.
 */

import { PredictionServiceClient } from "@google-cloud/aiplatform";
import { EmbeddingResponse } from "./types";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { ServiceAccountManager } from "../auth/service-account-manager";
import { CircuitBreaker } from "../utils/circuit-breaker";
import { SecurityUtils, SecurityConfig } from "../auth/security-utils";
import * as functions from "firebase-functions";
import {
  getEnvironmentConfig,
  VertexAIConfig
} from "../config/environment-config";
import { CostTracker, ApiCallType } from "../monitoring/cost-tracker";

/**
 * Client for interacting with Vertex AI
 */
export class VertexAIClient {
  private config: VertexAIConfig;
  private predictionClient: PredictionServiceClient;
  private logger: Logger;
  private serviceAccountManager: ServiceAccountManager;
  private circuitBreaker: CircuitBreaker;
  private securityUtils: SecurityUtils;
  private costTracker: CostTracker;

  /**
   * Create a new Vertex AI client
   * @param config Optional Vertex AI configuration (if not provided, will use environment config)
   * @param logger Logger instance
   * @param securityConfig Optional security configuration (if not provided, will use environment config)
   */
  constructor(config?: VertexAIConfig, logger?: Logger, securityConfig?: SecurityConfig) {
    // Get environment config if not provided
    const envConfig = getEnvironmentConfig();

    // Use provided config or environment config
    this.config = config || envConfig.vertexAI;
    this.logger = (logger || new Logger("VertexAI")).child("VertexAIClient");

    // Initialize service account manager
    this.serviceAccountManager = new ServiceAccountManager(this.logger);

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      logger: this.logger
    });

    // Initialize security utils
    this.securityUtils = new SecurityUtils(
      securityConfig || envConfig.security,
      this.logger
    );

    // Initialize cost tracker
    this.costTracker = new CostTracker(this.logger);

    // Initialize prediction client
    this.predictionClient = new PredictionServiceClient({
      projectId: this.config.projectId
    });

    this.logger.info("VertexAIClient initialized", {
      environment: this.config.environment,
      projectId: this.config.projectId,
      location: this.config.location,
      embeddingModel: this.config.embeddingModel,
      featureFlags: envConfig.featureFlags
    });
  }

  /**
   * Validate request security
   * @param context Functions context
   * @param userId Optional user ID for rate limiting
   * @returns Whether the request is valid
   */
  validateRequest(context: functions.https.CallableContext, userId?: string): boolean {
    return this.securityUtils.validateRequest(context, userId);
  }

  /**
   * Generate an embedding vector from text
   * @param text Text to generate embedding for
   * @param model Model to use for embedding generation
   * @param context Optional Functions context for security validation
   * @param userId Optional user ID for rate limiting
   * @returns Embedding response
   */
  async generateEmbedding(
    text: string,
    model: string,
    context?: functions.https.CallableContext,
    userId?: string
  ): Promise<EmbeddingResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        // Validate request if context is provided
        if (context && !this.validateRequest(context, userId)) {
          throw new AppError(
            "Request validation failed",
            ErrorType.AUTHENTICATION,
            403
          );
        }

        this.logger.debug("Generating embedding", { textLength: text.length, model });

        const formattedParent = this.predictionClient.modelPath(
          this.config.projectId,
          this.config.location,
          model
        );

        // Get authentication token
        const authToken = await this.serviceAccountManager.getAccessToken();

        // Create a simplified request for testing purposes
        // In a real implementation, this would use the proper types from @google-cloud/aiplatform
        const request = {
          endpoint: formattedParent,
          instances: [
            { content: text }
          ],
          parameters: {
            contentType: "text/plain"
          }
        } as any;

        // Add authentication to the request options
        const options = {
          otherArgs: {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        };

        const [response] = await this.predictionClient.predict(request, options);

        if (!response.predictions || response.predictions.length === 0) {
          throw new AppError(
            "No predictions returned from Vertex AI",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
        }

        // Extract embedding from response
        const prediction = response.predictions[0] as any;
        const embedding = prediction.embeddings.values;
        const dimension = embedding.length;

        this.logger.debug("Embedding generated successfully", { dimension });

        // Track API call for cost monitoring
        await this.costTracker.trackApiCall(
          ApiCallType.TEXT_EMBEDDING,
          text.length, // Use text length as the unit for cost calculation
          userId,
          undefined, // worldId is not available in this context
          {
            model: model,
            dimension: dimension
          }
        );

        return {
          embedding,
          dimension
        };
      } catch (error) {
        this.logger.error("Failed to generate embedding", error as Error);
        throw error instanceof Error
          ? new AppError(
              `Failed to generate embedding: ${error.message}`,
              ErrorType.EXTERNAL_SERVICE,
              500,
              error
            )
          : new AppError(
              "Failed to generate embedding: Unknown error",
              ErrorType.EXTERNAL_SERVICE,
              500
            );
      }
    });
  }

  /**
   * Generate multiple embeddings in batch
   * @param texts Array of texts to generate embeddings for
   * @param model Model to use for embedding generation
   * @param context Optional Functions context for security validation
   * @param userId Optional user ID for rate limiting
   * @returns Array of embedding responses
   */
  async generateEmbeddingsBatch(
    texts: string[],
    model: string,
    context?: functions.https.CallableContext,
    userId?: string
  ): Promise<EmbeddingResponse[]> {
    return this.circuitBreaker.execute(async () => {
      try {
        // Validate request if context is provided
        if (context && !this.validateRequest(context, userId)) {
          throw new AppError(
            "Request validation failed",
            ErrorType.AUTHENTICATION,
            403
          );
        }

        this.logger.debug("Generating embeddings batch", {
          count: texts.length,
          model,
          averageTextLength: texts.reduce((sum, text) => sum + text.length, 0) / texts.length
        });

        const formattedParent = this.predictionClient.modelPath(
          this.config.projectId,
          this.config.location,
          model
        );

        // Get authentication token
        const authToken = await this.serviceAccountManager.getAccessToken();

        // Create a simplified request for testing purposes
        // In a real implementation, this would use the proper types from @google-cloud/aiplatform
        const request = {
          endpoint: formattedParent,
          instances: texts.map(text => ({ content: text })),
          parameters: {
            contentType: "text/plain"
          }
        } as any;

        // Add authentication to the request options
        const options = {
          otherArgs: {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        };

        const [response] = await this.predictionClient.predict(request, options);

        if (!response.predictions || response.predictions.length === 0) {
          throw new AppError(
            "No predictions returned from Vertex AI",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
        }

        // Extract embeddings from response
        // Cast predictions to any to handle the embeddings property
        const predictions = response.predictions as any[];
        const embeddings = predictions.map(prediction => ({
          embedding: prediction.embeddings.values,
          dimension: prediction.embeddings.values.length
        }));

        this.logger.debug("Embeddings batch generated successfully", {
          count: embeddings.length,
          dimension: embeddings[0].dimension
        });

        // Track API call for cost monitoring
        // Calculate total text length for cost calculation
        const totalTextLength = texts.reduce((sum, text) => sum + text.length, 0);

        await this.costTracker.trackApiCall(
          ApiCallType.TEXT_EMBEDDING,
          totalTextLength,
          userId,
          undefined, // worldId is not available in this context
          {
            model: model,
            batchSize: texts.length,
            averageTextLength: totalTextLength / texts.length
          }
        );

        return embeddings;
      } catch (error) {
        this.logger.error("Failed to generate embeddings batch", error as Error);
        throw error instanceof Error
          ? new AppError(
              `Failed to generate embeddings batch: ${error.message}`,
              ErrorType.EXTERNAL_SERVICE,
              500,
              error
            )
          : new AppError(
              "Failed to generate embeddings batch: Unknown error",
              ErrorType.EXTERNAL_SERVICE,
              500
            );
      }
    });
  }


}
