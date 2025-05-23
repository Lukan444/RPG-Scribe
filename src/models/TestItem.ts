/**
 * Test Item model for testing FirestoreService
 */
import { BaseEntity } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Test item priority enum
 */
export enum TestItemPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

/**
 * Test item status enum
 */
export enum TestItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Test item interface
 * Extends BaseEntity with test-specific properties
 */
export interface TestItem extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.CHARACTER; // Using CHARACTER as a placeholder
  
  // Test-specific properties
  title: string;
  content: string;
  priority: TestItemPriority;
  status: TestItemStatus;
  dueDate?: Date;
  isActive: boolean;
  counter: number;
  tags: string[];
}

/**
 * Test item creation parameters
 * Extends BaseEntityCreationParams with test-specific properties
 */
export interface TestItemCreationParams {
  name: string;
  description?: string;
  title: string;
  content: string;
  priority?: TestItemPriority;
  status?: TestItemStatus;
  dueDate?: Date;
  isActive?: boolean;
  counter?: number;
  tags?: string[];
}

/**
 * Test item update parameters
 */
export interface TestItemUpdateParams {
  name?: string;
  description?: string;
  title?: string;
  content?: string;
  priority?: TestItemPriority;
  status?: TestItemStatus;
  dueDate?: Date;
  isActive?: boolean;
  counter?: number;
  tags?: string[];
}
