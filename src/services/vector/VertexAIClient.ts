/**
 * Vertex AI Client
 *
 * This class handles the communication with Google's Vertex AI API
 * for generating and storing vector embeddings.
 */

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
 * Client for interacting with Vertex AI
 */
export class VertexAIClient {
  private config: VertexAIConfig;
  private authToken: string | null = null;
  private authTokenExpiry: number = 0;

  /**
   * Create a new Vertex AI client
   * @param config Vertex AI configuration
   */
  constructor(config: VertexAIConfig) {
    this.config = config;
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
      // In a real implementation, this would use Google Auth Library
      // For now, we'll use a placeholder that would be replaced with actual auth

      // This is a placeholder for the actual implementation
      // In a production environment, you would use Google Auth Library
      // to get a token from the metadata server or service account key

      // For development purposes, you might use Application Default Credentials
      // or a service account key file

      // For example:
      // const auth = new GoogleAuth();
      // const client = await auth.getClient();
      // const token = await client.getAccessToken();

      // For now, we'll just return a placeholder
      this.authToken = "PLACEHOLDER_TOKEN";
      this.authTokenExpiry = Date.now() + 3600000; // 1 hour

      return this.authToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get auth token: ${errorMessage}`);
    }
  }
}
