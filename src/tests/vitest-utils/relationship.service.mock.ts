/**
 * Mock RelationshipService for testing
 */
import { EntityType, Relationship } from '../../services/relationship.service';

/**
 * Mock RelationshipService for testing
 */
export class MockRelationshipService {
  private static instance: MockRelationshipService;
  private relationships: Map<string, Relationship> = new Map();
  private nextId = 1;

  /**
   * Get singleton instance
   */
  public static getInstance(worldId?: string, campaignId?: string): MockRelationshipService {
    if (!MockRelationshipService.instance) {
      MockRelationshipService.instance = new MockRelationshipService();
    }
    return MockRelationshipService.instance;
  }

  /**
   * Create a relationship
   */
  public async createRelationship(relationship: Relationship): Promise<string> {
    const id = `rel-${this.nextId++}`;
    this.relationships.set(id, { ...relationship, id });
    return id;
  }

  /**
   * Get a relationship by ID
   */
  public async getRelationshipById(id: string): Promise<Relationship | null> {
    const relationship = this.relationships.get(id);
    return relationship ? { ...relationship } : null;
  }

  /**
   * Update a relationship
   */
  public async updateRelationship(id: string, relationship: Partial<Relationship>): Promise<boolean> {
    if (!this.relationships.has(id)) {
      return false;
    }
    
    const existingRelationship = this.relationships.get(id)!;
    this.relationships.set(id, { ...existingRelationship, ...relationship });
    return true;
  }

  /**
   * Delete a relationship
   */
  public async deleteRelationship(id: string): Promise<boolean> {
    if (!this.relationships.has(id)) {
      return false;
    }
    
    this.relationships.delete(id);
    return true;
  }

  /**
   * Get relationships by source
   */
  public async getRelationshipsBySource(
    sourceId: string,
    sourceType: EntityType
  ): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      (rel) => rel.sourceId === sourceId && rel.sourceType === sourceType
    );
  }

  /**
   * Get relationships by target
   */
  public async getRelationshipsByTarget(
    targetId: string,
    targetType: EntityType
  ): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      (rel) => rel.targetId === targetId && rel.targetType === targetType
    );
  }

  /**
   * Get relationships by entity
   */
  public async getRelationshipsByEntity(
    entityId: string,
    entityType: EntityType
  ): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      (rel) =>
        (rel.sourceId === entityId && rel.sourceType === entityType) ||
        (rel.targetId === entityId && rel.targetType === entityType)
    );
  }

  /**
   * Get relationships between entities
   */
  public async getRelationshipsBetweenEntities(
    entity1Id: string,
    entity1Type: EntityType,
    entity2Id: string,
    entity2Type: EntityType
  ): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      (rel) =>
        (rel.sourceId === entity1Id && rel.sourceType === entity1Type && rel.targetId === entity2Id && rel.targetType === entity2Type) ||
        (rel.sourceId === entity2Id && rel.sourceType === entity2Type && rel.targetId === entity1Id && rel.targetType === entity1Type)
    );
  }

  /**
   * Clear all relationships (for testing)
   */
  public clearRelationships(): void {
    this.relationships.clear();
    this.nextId = 1;
  }
}
