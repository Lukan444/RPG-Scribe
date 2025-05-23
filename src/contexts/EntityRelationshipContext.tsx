import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EntityRelationshipsService, EntityReference } from '../services/api/entityRelationships.service';
import { Relationship, EntityType, RelationshipType } from '../models/Relationship';
import { useEntity } from './EntityContext';

/**
 * Entity Relationship Context Type
 */
interface EntityRelationshipContextType {
  relationships: Relationship[];
  relatedEntities: EntityReference[];
  isLoading: boolean;
  error: Error | null;
  addRelationship: (
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType,
    relationshipType: RelationshipType,
    description?: string
  ) => Promise<Relationship>;
  updateRelationship: (
    id: string,
    relationshipType: RelationshipType,
    description?: string
  ) => Promise<Relationship>;
  deleteRelationship: (id: string) => Promise<void>;
  refreshRelationships: () => Promise<void>;
}

// Create context with default values
const EntityRelationshipContext = createContext<EntityRelationshipContextType>({
  relationships: [],
  relatedEntities: [],
  isLoading: false,
  error: null,
  addRelationship: async () => ({ id: '', sourceEntityId: '', sourceEntityType: EntityType.CHARACTER, targetEntityId: '', targetEntityType: EntityType.CHARACTER, relationshipType: RelationshipType.RELATED_TO, isDirectional: true, campaignId: '', createdAt: new Date(), createdBy: '' }),
  updateRelationship: async () => ({ id: '', sourceEntityId: '', sourceEntityType: EntityType.CHARACTER, targetEntityId: '', targetEntityType: EntityType.CHARACTER, relationshipType: RelationshipType.RELATED_TO, isDirectional: true, campaignId: '', createdAt: new Date(), createdBy: '' }),
  deleteRelationship: async () => {},
  refreshRelationships: async () => {},
});

// Props for the EntityRelationshipProvider component
interface EntityRelationshipProviderProps {
  children: ReactNode;
  campaignId: string;
}

/**
 * Entity Relationship Provider Component
 */
export const EntityRelationshipProvider = ({ children, campaignId }: EntityRelationshipProviderProps) => {
  // State for relationships
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relatedEntities, setRelatedEntities] = useState<EntityReference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get selected entity from EntityContext
  const { selectedEntityId, selectedEntityType } = useEntity();

  // Create service instance
  const relationshipService = new EntityRelationshipsService(campaignId);

  // Load relationships for selected entity
  useEffect(() => {
    if (selectedEntityId && selectedEntityType) {
      loadRelationshipsForEntity(selectedEntityId, selectedEntityType);
    } else {
      setRelationships([]);
      setRelatedEntities([]);
    }
  }, [selectedEntityId, selectedEntityType]);

  // Store unsubscribe function for real-time listener
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Load relationships for an entity
  const loadRelationshipsForEntity = async (entityId: string, entityType: EntityType) => {
    try {
      setIsLoading(true);
      setError(null);

      // Clean up previous listener if exists
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }

      // Set up real-time listener for relationships
      const newUnsubscribe = relationshipService.listenToEntityRelationships(
        entityId,
        entityType,
        (relationships) => {
          setRelationships(relationships);

          // In a real implementation, we would fetch the related entities here
          // For now, we'll just create mock entities
          const mockEntities: EntityReference[] = relationships.map(rel => {
            const isSource = rel.sourceEntityId === entityId;
            const relatedEntityId = isSource ? rel.targetEntityId : rel.sourceEntityId;
            const relatedEntityType = isSource ? rel.targetEntityType : rel.sourceEntityType;

            return {
              id: relatedEntityId,
              type: relatedEntityType,
              name: `${relatedEntityType.charAt(0) + relatedEntityType.slice(1).toLowerCase()} ${relatedEntityId.substring(0, 8)}`,
              subtype: 'Mock'
            };
          });

          setRelatedEntities(mockEntities);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error in relationship listener:', error);
          setError(error);
          setIsLoading(false);
        }
      );

      setUnsubscribe(() => newUnsubscribe);
    } catch (err) {
      console.error('Error setting up relationship listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  // Add a new relationship
  const addRelationship = async (
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType,
    relationshipType: RelationshipType,
    description?: string
  ): Promise<Relationship> => {
    try {
      setIsLoading(true);
      setError(null);

      const newRelationship = await relationshipService.createRelationship({
        campaignId,
        sourceEntityId: sourceId,
        sourceEntityType: sourceType,
        targetEntityId: targetId,
        targetEntityType: targetType,
        relationshipType,
        description,
        isDirectional: true
      });

      // Update state with new relationship
      setRelationships(prev => [...prev, newRelationship]);

      // In a real implementation, we would fetch the related entity
      // For now, we'll just create a mock entity
      const mockEntity: EntityReference = {
        id: targetId,
        type: targetType,
        name: `${targetType.charAt(0) + targetType.slice(1).toLowerCase()} ${targetId.substring(0, 8)}`,
        subtype: 'Mock'
      };

      setRelatedEntities(prev => [...prev, mockEntity]);

      return newRelationship;
    } catch (err) {
      console.error('Error adding relationship:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a relationship
  const updateRelationship = async (
    id: string,
    relationshipType: RelationshipType,
    description?: string
  ): Promise<Relationship> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedRelationship = await relationshipService.updateRelationship(id, {
        relationshipType,
        description
      });

      // Update state with updated relationship
      setRelationships(prev =>
        prev.map(rel => rel.id === id ? updatedRelationship : rel)
      );

      return updatedRelationship;
    } catch (err) {
      console.error('Error updating relationship:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a relationship
  const deleteRelationship = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await relationshipService.deleteRelationship(id);

      // Update state by removing the deleted relationship
      const deletedRelationship = relationships.find(rel => rel.id === id);
      setRelationships(prev => prev.filter(rel => rel.id !== id));

      if (deletedRelationship) {
        // Remove the related entity if it's not related through other relationships
        const isSource = deletedRelationship.sourceEntityId === selectedEntityId;
        const relatedEntityId = isSource ? deletedRelationship.targetEntityId : deletedRelationship.sourceEntityId;

        const hasOtherRelationships = relationships.some(rel =>
          rel.id !== id &&
          (rel.sourceEntityId === relatedEntityId || rel.targetEntityId === relatedEntityId)
        );

        if (!hasOtherRelationships) {
          setRelatedEntities(prev => prev.filter(entity => entity.id !== relatedEntityId));
        }
      }
    } catch (err) {
      console.error('Error deleting relationship:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh relationships
  const refreshRelationships = async (): Promise<void> => {
    if (selectedEntityId && selectedEntityType) {
      await loadRelationshipsForEntity(selectedEntityId, selectedEntityType);
    }
  };

  // Context value
  const value: EntityRelationshipContextType = {
    relationships,
    relatedEntities,
    isLoading,
    error,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    refreshRelationships
  };

  return <EntityRelationshipContext.Provider value={value}>{children}</EntityRelationshipContext.Provider>;
};

/**
 * Custom hook to use the entity relationship context
 */
export const useEntityRelationship = (): EntityRelationshipContextType => {
  const context = useContext(EntityRelationshipContext);

  if (context === undefined) {
    throw new Error('useEntityRelationship must be used within an EntityRelationshipProvider');
  }

  return context;
};
