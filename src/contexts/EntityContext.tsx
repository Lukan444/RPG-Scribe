import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { EntityType } from '../models/Relationship';

/**
 * Entity interface
 */
interface Entity {
  id: string;
  type: EntityType;
  name: string;
  [key: string]: any;
}

/**
 * Entity Context Type
 */
interface EntityContextType {
  selectedEntityId: string | null;
  selectedEntityType: EntityType | null;
  selectedEntity: Entity | null;
  isLoading: boolean;
  error: Error | null;
  setSelectedEntity: (entity: Entity | null) => void;
  setSelectedEntityById: (id: string, type: EntityType) => void;
  clearSelectedEntity: () => void;
}

// Create context with default values
const EntityContext = createContext<EntityContextType>({
  selectedEntityId: null,
  selectedEntityType: null,
  selectedEntity: null,
  isLoading: false,
  error: null,
  setSelectedEntity: () => {},
  setSelectedEntityById: () => {},
  clearSelectedEntity: () => {},
});

// Props for the EntityProvider component
interface EntityProviderProps {
  children: ReactNode;
}

/**
 * Entity Provider Component
 */
export const EntityProvider = ({ children }: EntityProviderProps) => {
  // State for selected entity
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get location for route-based entity selection
  const location = useLocation();
  
  // Handle setting selected entity
  const handleSetSelectedEntity = (entity: Entity | null) => {
    if (entity) {
      setSelectedEntityId(entity.id);
      setSelectedEntityType(entity.type);
      setSelectedEntity(entity);
    } else {
      clearSelectedEntity();
    }
  };
  
  // Handle setting selected entity by ID and type
  const handleSetSelectedEntityById = (id: string, type: EntityType) => {
    setSelectedEntityId(id);
    setSelectedEntityType(type);
    setSelectedEntity(null); // Clear the entity object until it's loaded
    
    // In a real implementation, we would fetch the entity data here
    // For now, we'll just set a loading state
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockEntity: Entity = {
        id,
        type,
        name: `${type.charAt(0) + type.slice(1).toLowerCase()} ${id.substring(0, 8)}`,
        description: `This is a mock ${type.toLowerCase()} entity.`
      };
      
      setSelectedEntity(mockEntity);
      setIsLoading(false);
    }, 500);
  };
  
  // Clear selected entity
  const clearSelectedEntity = () => {
    setSelectedEntityId(null);
    setSelectedEntityType(null);
    setSelectedEntity(null);
    setError(null);
  };
  
  // Extract entity from URL path
  useEffect(() => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(Boolean);
    
    // If we're on a detail page, try to extract entity info
    if (pathSegments.length >= 2) {
      const potentialEntityType = pathSegments[0];
      const potentialEntityId = pathSegments[1];
      
      // Map URL paths to entity types
      const entityTypeMapping: Record<string, EntityType> = {
        'campaigns': EntityType.CAMPAIGN,
        'characters': EntityType.CHARACTER,
        'locations': EntityType.LOCATION,
        'items': EntityType.ITEM,
        'events': EntityType.EVENT,
        'sessions': EntityType.SESSION,
        'notes': EntityType.NOTE
      };
      
      const entityType = entityTypeMapping[potentialEntityType];
      
      if (entityType && potentialEntityId) {
        // Only set if different from current selection
        if (selectedEntityId !== potentialEntityId || selectedEntityType !== entityType) {
          handleSetSelectedEntityById(potentialEntityId, entityType);
        }
        return;
      }
    }
    
    // If we're not on a detail page, clear the selection
    if (selectedEntityId !== null || selectedEntityType !== null) {
      clearSelectedEntity();
    }
  }, [location.pathname]);
  
  // Context value
  const value: EntityContextType = {
    selectedEntityId,
    selectedEntityType,
    selectedEntity,
    isLoading,
    error,
    setSelectedEntity: handleSetSelectedEntity,
    setSelectedEntityById: handleSetSelectedEntityById,
    clearSelectedEntity,
  };
  
  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
};

/**
 * Custom hook to use the entity context
 */
export const useEntity = (): EntityContextType => {
  const context = useContext(EntityContext);
  
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  
  return context;
};
