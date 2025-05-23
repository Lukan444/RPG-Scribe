/**
 * Base Entity Adapter
 * 
 * This class provides a base implementation of the EntityAdapter interface
 * for all entity types in the system. It handles common transformation and
 * validation logic.
 */

import { DocumentData, Timestamp } from 'firebase/firestore';
import { IEntityAdapter } from './EntityAdapter.interface';
import { BaseEntity } from '../../models/BaseEntity';

/**
 * Base entity adapter class
 * @template T Entity type extending BaseEntity
 * @template D Database type extending DocumentData
 */
export abstract class BaseEntityAdapter<T extends BaseEntity, D extends DocumentData>
  implements IEntityAdapter<T, D> {

  /**
   * Transform entity data to database format
   * @param entity Entity data
   * @returns Database data
   */
  toDatabase(entity: T): D {
    // Create a copy of the entity to avoid modifying the original
    const dbEntity = { ...entity } as any;

    // Convert Date objects to Firestore Timestamps
    if (dbEntity.createdAt instanceof Date) {
      dbEntity.createdAt = Timestamp.fromDate(dbEntity.createdAt);
    }

    if (dbEntity.updatedAt instanceof Date) {
      dbEntity.updatedAt = Timestamp.fromDate(dbEntity.updatedAt);
    }

    // Perform entity-specific transformations
    this.transformToDatabase(dbEntity);

    return dbEntity as D;
  }

  /**
   * Transform database data to entity format
   * @param data Database data
   * @returns Entity data
   */
  fromDatabase(data: D): T {
    // Create a copy of the data to avoid modifying the original
    const entity = { ...data } as any;

    // Convert Firestore Timestamps to Date objects
    if (entity.createdAt && typeof entity.createdAt.toDate === 'function') {
      entity.createdAt = entity.createdAt.toDate();
    }

    if (entity.updatedAt && typeof entity.updatedAt.toDate === 'function') {
      entity.updatedAt = entity.updatedAt.toDate();
    }

    // Perform entity-specific transformations
    this.transformFromDatabase(entity);

    return entity as T;
  }

  /**
   * Validate entity data
   * @param entity Entity data
   * @returns True if valid, error message if invalid
   */
  validate(entity: T): boolean | string {
    // Validate required fields
    if (!entity.name || entity.name.trim() === '') {
      return 'Name is required';
    }

    // Perform entity-specific validation
    return this.validateEntity(entity);
  }

  /**
   * Prepare entity data for creation
   * @param entity Entity data
   * @param userId User ID of the creator
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Prepared entity data
   */
  prepareForCreation(
    entity: Partial<T>,
    userId: string,
    worldId: string,
    campaignId: string
  ): T {
    const now = new Date();

    // Create a new entity with default values
    const newEntity = {
      ...entity,
      createdBy: userId,
      worldId,
      campaignId,
      createdAt: now,
      updatedAt: now
    } as T;

    // Normalize the entity data
    this.normalize(newEntity);

    // Perform entity-specific preparation
    this.prepareEntityForCreation(newEntity, userId, worldId, campaignId);

    return newEntity;
  }

  /**
   * Prepare entity data for update
   * @param entity Entity data
   * @param existingEntity Existing entity data
   * @returns Prepared entity data
   */
  prepareForUpdate(
    entity: Partial<T>,
    existingEntity: T
  ): Partial<T> {
    // Create a copy of the entity to avoid modifying the original
    const updatedEntity = { ...entity } as Partial<T>;

    // Set the updated timestamp
    updatedEntity.updatedAt = new Date();

    // Normalize the entity data
    this.normalize(updatedEntity);

    // Perform entity-specific preparation
    this.prepareEntityForUpdate(updatedEntity, existingEntity);

    return updatedEntity;
  }

  /**
   * Normalize entity data
   * @param entity Entity data
   * @returns Normalized entity data
   */
  normalize(entity: Partial<T>): Partial<T> {
    // Trim string fields
    if (entity.name) {
      entity.name = entity.name.trim();
    }

    if (entity.description) {
      entity.description = entity.description.trim();
    }

    // Ensure tags are unique and trimmed
    if (entity.tags && Array.isArray(entity.tags)) {
      entity.tags = [...new Set(entity.tags.map(tag => tag.trim()))];
    }

    // Perform entity-specific normalization
    this.normalizeEntity(entity);

    return entity;
  }

  /**
   * Transform entity data to database format (entity-specific)
   * @param entity Entity data
   */
  protected abstract transformToDatabase(entity: any): void;

  /**
   * Transform database data to entity format (entity-specific)
   * @param data Database data
   */
  protected abstract transformFromDatabase(data: any): void;

  /**
   * Validate entity data (entity-specific)
   * @param entity Entity data
   * @returns True if valid, error message if invalid
   */
  protected abstract validateEntity(entity: T): boolean | string;

  /**
   * Prepare entity data for creation (entity-specific)
   * @param entity Entity data
   * @param userId User ID of the creator
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  protected abstract prepareEntityForCreation(
    entity: T,
    userId: string,
    worldId: string,
    campaignId: string
  ): void;

  /**
   * Prepare entity data for update (entity-specific)
   * @param entity Entity data
   * @param existingEntity Existing entity data
   */
  protected abstract prepareEntityForUpdate(
    entity: Partial<T>,
    existingEntity: T
  ): void;

  /**
   * Normalize entity data (entity-specific)
   * @param entity Entity data
   */
  protected abstract normalizeEntity(entity: Partial<T>): void;
}
