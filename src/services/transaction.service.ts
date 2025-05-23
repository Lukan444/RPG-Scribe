import { db } from '../firebase/config';
import { runTransaction, Transaction, DocumentReference, doc, collection, serverTimestamp } from 'firebase/firestore';
import { RelationshipService, Relationship, EntityType } from './relationship.service';
import { EntityType as ModelEntityType } from '../models/EntityType';

/**
 * Service for handling Firebase transactions
 * Transactions are used to ensure that multiple operations are performed atomically
 * If any operation fails, all operations are rolled back
 */
export class TransactionService {
  private static instance: TransactionService;

  /**
   * Get the singleton instance of TransactionService
   * @returns TransactionService instance
   */
  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Create a relationship with transaction support
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @param relationship Relationship data
   * @returns Relationship ID
   */
  async createRelationshipWithTransaction(
    worldId: string,
    campaignId: string,
    relationship: Relationship
  ): Promise<string> {
    try {
      // Validate inputs
      if (!worldId || !campaignId) {
        throw new Error('Invalid worldId or campaignId');
      }

      if (!relationship.sourceId || !relationship.targetId) {
        throw new Error('Source ID and Target ID are required');
      }

      // Generate a new document ID
      const relationshipId = doc(collection(db, 'temp')).id;

      // Run the transaction
      await runTransaction(db, async (transaction) => {
        // Get the document reference
        const docRef = doc(db, `rpgworlds/${worldId}/campaigns/${campaignId}/relationships`, relationshipId);

        // Add timestamps
        const relationshipWithTimestamps = {
          ...relationship,
          id: relationshipId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Set the document in the transaction
        transaction.set(docRef, relationshipWithTimestamps);
      });

      return relationshipId;
    } catch (error) {
      console.error('Error in createRelationshipWithTransaction:', error);
      throw error;
    }
  }

  /**
   * Delete a relationship with transaction support
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @param relationshipId Relationship ID
   * @returns True if successful
   */
  async deleteRelationshipWithTransaction(
    worldId: string,
    campaignId: string,
    relationshipId: string
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!worldId || !campaignId || !relationshipId) {
        throw new Error('Invalid worldId, campaignId, or relationshipId');
      }

      // Run the transaction
      await runTransaction(db, async (transaction) => {
        // Get the document reference
        const docRef = doc(db, `rpgworlds/${worldId}/campaigns/${campaignId}/relationships`, relationshipId);

        // Delete the document in the transaction
        transaction.delete(docRef);
      });

      return true;
    } catch (error) {
      console.error('Error in deleteRelationshipWithTransaction:', error);
      return false;
    }
  }

  /**
   * Update a relationship with transaction support
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @param relationshipId Relationship ID
   * @param data Data to update
   * @returns True if successful
   */
  async updateRelationshipWithTransaction(
    worldId: string,
    campaignId: string,
    relationshipId: string,
    data: Partial<Relationship>
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!worldId || !campaignId || !relationshipId) {
        throw new Error('Invalid worldId, campaignId, or relationshipId');
      }

      // Run the transaction
      await runTransaction(db, async (transaction) => {
        // Get the document reference
        const docRef = doc(db, `rpgworlds/${worldId}/campaigns/${campaignId}/relationships`, relationshipId);

        // Add updated timestamp
        const dataWithTimestamp = {
          ...data,
          updatedAt: serverTimestamp()
        };

        // Update the document in the transaction
        transaction.update(docRef, dataWithTimestamp);
      });

      return true;
    } catch (error) {
      console.error('Error in updateRelationshipWithTransaction:', error);
      return false;
    }
  }

  /**
   * Create or update a relationship with transaction support
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @param relationship Relationship data
   * @returns Relationship ID
   */
  async createOrUpdateRelationshipWithTransaction(
    worldId: string,
    campaignId: string,
    relationship: Partial<Relationship>
  ): Promise<string> {
    try {
      // Get the relationship service
      const relationshipService = RelationshipService.getInstance(worldId, campaignId);

      // Check if relationship already exists
      const constraints = [
        { field: 'sourceId', operator: '==' as const, value: relationship.sourceId },
        { field: 'sourceType', operator: '==' as const, value: relationship.sourceType },
        { field: 'targetId', operator: '==' as const, value: relationship.targetId },
        { field: 'targetType', operator: '==' as const, value: relationship.targetType },
        { field: 'relationshipType', operator: '==' as const, value: relationship.relationshipType }
      ];

      const { data } = await relationshipService.queryCompound(constraints);

      if (data.length > 0) {
        // Update existing relationship
        const existingRelationship = data[0];
        await this.updateRelationshipWithTransaction(worldId, campaignId, existingRelationship.id!, relationship);
        return existingRelationship.id!;
      } else {
        // Create new relationship
        return await this.createRelationshipWithTransaction(worldId, campaignId, relationship as Relationship);
      }
    } catch (error) {
      console.error('Error in createOrUpdateRelationshipWithTransaction:', error);
      throw error;
    }
  }
}
