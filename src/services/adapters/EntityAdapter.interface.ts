/**
 * Entity Adapter Interface
 * 
 * This interface defines the contract for entity adapters in the system.
 * Entity adapters are responsible for transforming data between the application
 * and the database, as well as validating data before it is stored.
 */

import { DocumentData } from 'firebase/firestore';

/**
 * Interface for entity adapters
 * @template T Entity type
 * @template D Database type (extends DocumentData)
 */
export interface IEntityAdapter<T, D extends DocumentData> {
  /**
   * Transform entity data to database format
   * @param entity Entity data
   * @returns Database data
   */
  toDatabase(entity: T): D;

  /**
   * Transform database data to entity format
   * @param data Database data
   * @returns Entity data
   */
  fromDatabase(data: D): T;

  /**
   * Validate entity data
   * @param entity Entity data
   * @returns True if valid, error message if invalid
   */
  validate(entity: T): boolean | string;

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
  ): T;

  /**
   * Prepare entity data for update
   * @param entity Entity data
   * @param existingEntity Existing entity data
   * @returns Prepared entity data
   */
  prepareForUpdate(
    entity: Partial<T>,
    existingEntity: T
  ): Partial<T>;

  /**
   * Normalize entity data
   * @param entity Entity data
   * @returns Normalized entity data
   */
  normalize(entity: Partial<T>): Partial<T>;
}
