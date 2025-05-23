import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  or,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Relationship,
  RelationshipCreationParams,
  RelationshipUpdateParams,
  EntityType,
  RelationshipType
} from '../../models/Relationship';

/**
 * Entity reference interface
 */
export interface EntityReference {
  id: string;
  type: EntityType;
  name: string;
  subtype?: string;
  imageURL?: string;
}

/**
 * Entity relationship service for API operations
 */
export class EntityRelationshipsService {
  private campaignId: string;

  /**
   * Create a new EntityRelationshipsService
   * @param campaignId Campaign ID
   */
  constructor(campaignId: string) {
    this.campaignId = campaignId;
  }

  /**
   * Get all relationships for a campaign
   * @returns Promise with array of relationships
   */
  async getAllRelationships(): Promise<Relationship[]> {
    try {
      const relationshipsRef = collection(db, `campaigns/${this.campaignId}/relationships`);
      const q = query(relationshipsRef);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatRelationship({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting relationships:', error);
      throw error;
    }
  }

  /**
   * Get relationship by ID
   * @param id Relationship ID
   * @returns Promise with relationship or null
   */
  async getRelationshipById(id: string): Promise<Relationship | null> {
    try {
      const relationshipRef = doc(db, `campaigns/${this.campaignId}/relationships`, id);
      const relationshipSnap = await getDoc(relationshipRef);

      if (relationshipSnap.exists()) {
        const data = relationshipSnap.data();
        return this.formatRelationship({ id: relationshipSnap.id, ...data });
      }

      return null;
    } catch (error) {
      console.error('Error getting relationship:', error);
      throw error;
    }
  }

  /**
   * Get relationships for an entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Promise with array of relationships
   */
  async getRelationshipsForEntity(entityId: string, entityType: EntityType): Promise<Relationship[]> {
    try {
      const relationshipsRef = collection(db, `campaigns/${this.campaignId}/relationships`);
      const q = query(
        relationshipsRef,
        or(
          where('sourceEntityId', '==', entityId),
          where('targetEntityId', '==', entityId)
        )
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatRelationship({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting entity relationships:', error);
      throw error;
    }
  }

  /**
   * Get relationships between two entities
   * @param entity1Id First entity ID
   * @param entity1Type First entity type
   * @param entity2Id Second entity ID
   * @param entity2Type Second entity type
   * @returns Promise with array of relationships
   */
  async getRelationshipsBetweenEntities(
    entity1Id: string,
    entity1Type: EntityType,
    entity2Id: string,
    entity2Type: EntityType
  ): Promise<Relationship[]> {
    try {
      const relationshipsRef = collection(db, `campaigns/${this.campaignId}/relationships`);
      const q1 = query(
        relationshipsRef,
        where('sourceEntityId', '==', entity1Id),
        where('targetEntityId', '==', entity2Id)
      );
      const q2 = query(
        relationshipsRef,
        where('sourceEntityId', '==', entity2Id),
        where('targetEntityId', '==', entity1Id)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const relationships: Relationship[] = [];

      snapshot1.docs.forEach(doc => {
        const data = doc.data();
        relationships.push(this.formatRelationship({ id: doc.id, ...data }));
      });

      snapshot2.docs.forEach(doc => {
        const data = doc.data();
        relationships.push(this.formatRelationship({ id: doc.id, ...data }));
      });

      return relationships;
    } catch (error) {
      console.error('Error getting relationships between entities:', error);
      throw error;
    }
  }

  /**
   * Create a new relationship
   * @param relationship Relationship creation parameters
   * @returns Promise with created relationship
   */
  async createRelationship(relationship: RelationshipCreationParams): Promise<Relationship> {
    try {
      const relationshipsRef = collection(db, `campaigns/${this.campaignId}/relationships`);

      const newRelationship = {
        ...relationship,
        campaignId: this.campaignId,
        isDirectional: relationship.isDirectional ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(relationshipsRef, newRelationship);

      return {
        id: docRef.id,
        ...newRelationship,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Relationship;
    } catch (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }
  }

  /**
   * Update a relationship
   * @param id Relationship ID
   * @param updates Relationship update parameters
   * @returns Promise with updated relationship
   */
  async updateRelationship(id: string, updates: RelationshipUpdateParams): Promise<Relationship> {
    try {
      const relationshipRef = doc(db, `campaigns/${this.campaignId}/relationships`, id);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(relationshipRef, updateData);

      const updatedRelationship = await this.getRelationshipById(id);
      if (!updatedRelationship) {
        throw new Error('Relationship not found after update');
      }

      return updatedRelationship;
    } catch (error) {
      console.error('Error updating relationship:', error);
      throw error;
    }
  }

  /**
   * Delete a relationship
   * @param id Relationship ID
   * @returns Promise<void>
   */
  async deleteRelationship(id: string): Promise<void> {
    try {
      const relationshipRef = doc(db, `campaigns/${this.campaignId}/relationships`, id);
      await deleteDoc(relationshipRef);
    } catch (error) {
      console.error('Error deleting relationship:', error);
      throw error;
    }
  }

  /**
   * Set up a real-time listener for entity relationships
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param onUpdate Callback function for updates
   * @param onError Callback function for errors
   * @returns Unsubscribe function
   */
  listenToEntityRelationships(
    entityId: string,
    entityType: EntityType,
    onUpdate: (relationships: Relationship[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const relationshipsRef = collection(db, `campaigns/${this.campaignId}/relationships`);
      const q = query(
        relationshipsRef,
        or(
          where('sourceEntityId', '==', entityId),
          where('targetEntityId', '==', entityId)
        )
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          const relationships: Relationship[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            relationships.push(this.formatRelationship({ id: doc.id, ...data }));
          });
          onUpdate(relationships);
        },
        (error) => {
          console.error('Error in relationship listener:', error);
          if (onError) {
            onError(error);
          }
        }
      );
    } catch (error) {
      console.error('Error setting up relationship listener:', error);
      if (onError) {
        onError(error as Error);
      }
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Format relationship data from Firestore
   * @param data Firestore data
   * @returns Formatted relationship
   */
  private formatRelationship(data: any): Relationship {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
    };
  }
}
