/**
 * Vector Service Interface
 * 
 * This interface defines the contract for vector operations in RPG Scribe.
 * It abstracts away the details of the underlying vector database implementation,
 * allowing for flexibility and potential future changes to the vector database provider.
 */

import { EntityType } from '../../models/EntityType';
import { 
  EmbeddingOptions, 
  SimilaritySearchOptions, 
  SimilaritySearchResult, 
  EmbeddingStorageRequest, 
  ServiceStatus 
} from './types';

/**
 * Vector Service Interface
 * 
 * Provides methods for generating, storing, and searching vector embeddings.
 */
export interface VectorService {
  /**
   * Generate an embedding vector from text
   * @param text Text to generate embedding for
   * @param options Embedding generation options
   * @returns Embedding vector as array of numbers
   */
  generateEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]>;
  
  /**
   * Store an embedding vector
   * @param entityId ID of the entity
   * @param entityType Type of the entity
   * @param embedding Embedding vector
   * @param metadata Additional metadata
   * @returns ID of the stored embedding
   */
  storeEmbedding(
    entityId: string, 
    entityType: EntityType, 
    embedding: number[], 
    metadata?: Record<string, any>
  ): Promise<string>;
  
  /**
   * Find similar entities using an embedding vector
   * @param embedding Embedding vector to compare against
   * @param options Search options
   * @returns Array of similarity search results
   */
  findSimilar(
    embedding: number[], 
    options?: SimilaritySearchOptions
  ): Promise<SimilaritySearchResult[]>;
  
  /**
   * Find similar entities using text
   * @param text Text to find similar entities for
   * @param options Search options
   * @returns Array of similarity search results
   */
  findSimilarByText(
    text: string, 
    options?: SimilaritySearchOptions
  ): Promise<SimilaritySearchResult[]>;
  
  /**
   * Delete an embedding
   * @param embeddingId ID of the embedding to delete
   * @returns True if successful
   */
  deleteEmbedding(embeddingId: string): Promise<boolean>;
  
  /**
   * Generate multiple embeddings in batch
   * @param texts Array of texts to generate embeddings for
   * @param options Embedding generation options
   * @returns Array of embedding vectors
   */
  generateEmbeddingsBatch(
    texts: string[], 
    options?: EmbeddingOptions
  ): Promise<number[][]>;
  
  /**
   * Store multiple embeddings in batch
   * @param embeddings Array of embedding storage requests
   * @returns Array of stored embedding IDs
   */
  storeEmbeddingsBatch(
    embeddings: EmbeddingStorageRequest[]
  ): Promise<string[]>;
  
  /**
   * Get the status of the vector service
   * @returns Service status
   */
  getServiceStatus(): Promise<ServiceStatus>;
}
