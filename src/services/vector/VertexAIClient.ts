/**
 * Vertex AI Client
 *
 * This class handles the communication with Google's Vertex AI API
 * for generating and storing vector embeddings and managing vector indices.
 */

import { GoogleAuth } from 'google-auth-library';
import { VertexAIConfig } from './types';
import { DEFAULT_EMBEDDING_DIMENSION } from './config';

/**
 * Response from the Vertex AI Embedding API
 */
interface EmbeddingResponse {
  embedding: number[];
  dimension: number;
}

/**
 * Vector index configuration
 */
interface IndexConfig {
  displayName: string;
  description?: string;
  metadata: {
    config: {
      dimensions: number;
      approximateNeighborsCount?: number;
      distanceMeasureType?: 'DOT_PRODUCT_DISTANCE' | 'COSINE_DISTANCE' | 'SQUARED_L2_DISTANCE';
      algorithmConfig?: {
        treeAhConfig?: {
          leafNodeEmbeddingCount?: number;
          leafNodesToSearchPercent?: number;
        };
        bruteForceConfig?: {};
      };
    };
  };
}

/**
 * Vector data point for index operations
 */
interface VectorDataPoint {
  datapoint_id: string;
  feature_vector: number[];
  restricts?: Array<{
    namespace: string;
    allow_list: string[];
  }>;
}

/**
 * Client for interacting with Vertex AI
 */
export class VertexAIClient {
  private config: VertexAIConfig;
  private auth: GoogleAuth;
  private authToken: string | null = null;
  private authTokenExpiry: number = 0;

  /**
   * Create a new Vertex AI client
   * @param config Vertex AI configuration
   */
  constructor(config: VertexAIConfig) {
    this.config = config;
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: config.projectId
    });
  }

  /**
   * Generate an embedding vector from text
   * @param text Text to generate embedding for
   * @param model Model to use for embedding generation
   * @returns Embedding response
   */
  async generateEmbedding(text: string, model: string): Promise<EmbeddingResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/${model}:predict`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instances: [
              { content: text }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Extract embedding from response
      const embedding = data.predictions[0].embeddings.values;
      const dimension = embedding.length;

      return {
        embedding,
        dimension
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Generate multiple embeddings in batch
   * @param texts Array of texts to generate embeddings for
   * @param model Model to use for embedding generation
   * @returns Array of embedding responses
   */
  async generateEmbeddingsBatch(texts: string[], model: string): Promise<EmbeddingResponse[]> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/${model}:predict`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instances: texts.map(text => ({ content: text }))
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Extract embeddings from response
      return data.predictions.map((prediction: any) => ({
        embedding: prediction.embeddings.values,
        dimension: prediction.embeddings.values.length
      }));
    } catch (error) {
      console.error('Error generating embeddings batch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate embeddings batch: ${errorMessage}`);
    }
  }

  /**
   * Get an authentication token for Vertex AI
   * @returns Authentication token
   */
  private async getAuthToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.authToken && Date.now() < this.authTokenExpiry) {
      return this.authToken;
    }

    try {
      // Use Google Auth Library to get access token
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new Error('Failed to obtain access token');
      }

      this.authToken = tokenResponse.token;
      // Set expiry to 50 minutes (tokens typically last 1 hour)
      this.authTokenExpiry = Date.now() + 3000000; // 50 minutes

      return this.authToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get auth token: ${errorMessage}`);
    }
  }

  /**
   * Create a vector index
   * @param indexConfig Configuration for the index
   * @returns Index ID
   */
  async createIndex(indexConfig: IndexConfig): Promise<string> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/indexes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(indexConfig)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Index creation error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Extract index ID from the operation name
      // Format: projects/{project}/locations/{location}/operations/{operation}
      const operationName = data.name;
      const indexId = operationName.split('/').pop();

      return indexId;
    } catch (error) {
      console.error('Error creating index:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create index: ${errorMessage}`);
    }
  }

  /**
   * Get index status
   * @param indexId Index ID
   * @returns Index status information
   */
  async getIndexStatus(indexId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/indexes/${indexId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Index status error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting index status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get index status: ${errorMessage}`);
    }
  }

  /**
   * Add vectors to an index
   * @param indexId Index ID
   * @param datapoints Vector data points to add
   * @returns Operation ID
   */
  async addVectorsToIndex(indexId: string, datapoints: VectorDataPoint[]): Promise<string> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/indexes/${indexId}:upsertDatapoints`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            datapoints
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Vector upsert error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.name; // Operation name
    } catch (error) {
      console.error('Error adding vectors to index:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add vectors to index: ${errorMessage}`);
    }
  }

  /**
   * Search for similar vectors in an index
   * @param indexId Index ID
   * @param queryVector Query vector
   * @param neighborCount Number of neighbors to return
   * @param filters Optional filters
   * @returns Search results
   */
  async searchVectors(
    indexId: string,
    queryVector: number[],
    neighborCount: number = 10,
    filters?: any
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const requestBody: any = {
        deployed_index_id: this.config.indexEndpoint,
        queries: [{
          datapoint: {
            feature_vector: queryVector
          },
          neighbor_count: neighborCount
        }]
      };

      if (filters) {
        requestBody.queries[0].datapoint.restricts = filters;
      }

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/indexEndpoints/${this.config.indexEndpoint}:findNeighbors`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Vector search error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching vectors:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to search vectors: ${errorMessage}`);
    }
  }

  /**
   * Remove vectors from an index
   * @param indexId Index ID
   * @param datapointIds IDs of datapoints to remove
   * @returns Operation ID
   */
  async removeVectorsFromIndex(indexId: string, datapointIds: string[]): Promise<string> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/indexes/${indexId}:removeDatapoints`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            datapoint_ids: datapointIds
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Vector removal error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.name; // Operation name
    } catch (error) {
      console.error('Error removing vectors from index:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to remove vectors from index: ${errorMessage}`);
    }
  }
}
