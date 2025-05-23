/**
 * Firestore Test Utilities for Vitest
 *
 * This file provides utilities for setting up Firestore mocks in Vitest tests.
 */

import { vi } from 'vitest';
import { DocumentData } from 'firebase/firestore';
import { EntityType } from '../../models/EntityType';

// Import the mock factory from the vitest-utils directory
import { createFirestoreMock, createMockCollection, createMockDocument } from '../vitest-utils/firestore-mock-factory';

/**
 * Setup Firestore mocks for testing
 * @param initialData Initial data to populate the mock Firestore
 */
export function setupFirestoreMocks(initialData: any = {}) {
  const mockFirestore = createFirestoreMock(initialData);
  return mockFirestore;
}

/**
 * Create a mock database with initial test data
 * @param userId User ID for the mock data
 * @returns Mock database with test data
 */
export function createMockDatabase(userId: string = 'test-user-id') {
  // Create mock RPG Worlds
  const worlds = createMockRPGWorlds(userId, 2);
  
  // Create mock Characters
  const characters = createMockCharacters(userId, worlds[0].id);
  
  // Create mock Locations
  const locations = createMockLocations(userId, worlds[0].id);
  
  // Create mock Items
  const items = createMockItems(userId, worlds[0].id);
  
  // Create mock database structure
  const mockDb: Record<string, Record<string, any>> = {
    'rpg-worlds': {
      [worlds[0].id]: worlds[0],
      [worlds[1].id]: worlds[1],
    },
    'characters': {
      [characters[0].id]: characters[0],
      [characters[1].id]: characters[1],
    },
    'locations': {
      [locations[0].id]: locations[0],
      [locations[1].id]: locations[1],
    },
    'items': {
      [items[0].id]: items[0],
      [items[1].id]: items[1],
    },
  };
  
  return mockDb;
}/**
 * Create mock RPG World data
 * @param userId User ID
 * @param count Number of worlds to create
 * @returns Mock RPG World data
 */
export function createMockRPGWorlds(userId: string, count: number = 3) {
  const worlds = [];
  
  for (let i = 0; i < count; i++) {
    worlds.push({
      id: `world-${i + 1}`,
      name: `Test World ${i + 1}`,
      description: `Description for Test World ${i + 1}`,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl: '',
      entityType: EntityType.RPG_WORLD,
    });
  }
  
  return worlds;
}

/**
 * Create mock Character data
 * @param userId User ID
 * @param worldId World ID
 * @param count Number of characters to create
 * @returns Mock Character data
 */
export function createMockCharacters(userId: string, worldId: string, count: number = 2) {
  const characters = [];
  
  for (let i = 0; i < count; i++) {
    characters.push({
      id: `char-${i + 1}`,
      name: `Test Character ${i + 1}`,
      description: `Description for Test Character ${i + 1}`,
      race: 'Human',
      class: 'Warrior',
      type: i === 0 ? 'NPC' : 'PC',
      status: 'alive',
      worldId,
      campaignId: 'campaign-1',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entityType: EntityType.CHARACTER,
      characterType: i === 0 ? 'NPC' : 'PC',
      isPlayerCharacter: i !== 0,
    });
  }
  
  return characters;
}/**
 * Create mock Location data
 * @param userId User ID
 * @param worldId World ID
 * @param count Number of locations to create
 * @returns Mock Location data
 */
export function createMockLocations(userId: string, worldId: string, count: number = 2) {
  const locations = [];
  
  for (let i = 0; i < count; i++) {
    locations.push({
      id: `loc-${i + 1}`,
      name: `Test Location ${i + 1}`,
      description: `Description for Test Location ${i + 1}`,
      type: 'City',
      worldId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entityType: EntityType.LOCATION,
    });
  }
  
  return locations;
}

/**
 * Create mock Item data
 * @param userId User ID
 * @param worldId World ID
 * @param count Number of items to create
 * @returns Mock Item data
 */
export function createMockItems(userId: string, worldId: string, count: number = 2) {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${i + 1}`,
      name: `Test Item ${i + 1}`,
      description: `Description for Test Item ${i + 1}`,
      type: 'Weapon',
      worldId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entityType: EntityType.ITEM,
    });
  }
  
  return items;
}