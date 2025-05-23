/**
 * Firestore Test Utilities for Vitest
 *
 * This file provides utilities for setting up Firestore mocks in Vitest tests.
 */

import { vi } from 'vitest';
import { createFirestoreMock, createMockCollection, createMockDocument } from './firestore-mock-factory';
import { DocumentData } from 'firebase/firestore';
import { EntityType } from '../../models/EntityType';

/**
 * Setup Firestore mocks for testing
 * @param initialData Initial data to populate the mock Firestore
 */
export function setupFirestoreMocks(initialData: any = {}) {
  const mockFirestore = createFirestoreMock(initialData);

  // We don't need to mock modules here since they're already mocked in setupVitest.ts
  // Just return the mock Firestore instance
  return mockFirestore;
}

/**
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
      data: {
        name: `Test World ${i + 1}`,
        description: `Description for Test World ${i + 1}`,
        imageURL: `https://example.com/world-${i + 1}.jpg`,
        createdBy: userId,
        createdAt: new Date(2023, 0, i + 1).toISOString(),
        updatedAt: new Date(2023, 0, i + 1).toISOString(),
        isPublic: i % 2 === 0,
        tags: [`tag-${i + 1}`, 'fantasy', 'rpg'],
        system: i % 2 === 0 ? 'D&D 5e' : 'Pathfinder',
        genre: i % 3 === 0 ? 'Fantasy' : i % 3 === 1 ? 'Sci-Fi' : 'Horror'
      }
    });
  }

  return createMockCollection('rpgworlds', worlds);
}

/**
 * Create mock campaign data for a world
 * @param worldId World ID
 * @param userId User ID
 * @param count Number of campaigns to create
 * @returns Mock campaign data
 */
export function createMockCampaigns(worldId: string, userId: string, count: number = 2) {
  const campaigns = [];

  for (let i = 0; i < count; i++) {
    campaigns.push({
      id: `campaign-${worldId}-${i + 1}`,
      data: {
        name: `Campaign ${i + 1} for ${worldId}`,
        description: `Description for Campaign ${i + 1}`,
        worldId: worldId,
        createdBy: userId,
        createdAt: new Date(2023, 1, i + 1).toISOString(),
        updatedAt: new Date(2023, 1, i + 1).toISOString(),
        status: i % 2 === 0 ? 'active' : 'completed',
        startDate: new Date(2023, 1, i + 1).toISOString(),
        endDate: i % 2 === 0 ? null : new Date(2023, 2, i + 1).toISOString()
      }
    });
  }

  return createMockCollection('campaigns', campaigns);
}

/**
 * Create mock character data
 * @param worldId World ID
 * @param campaignId Campaign ID
 * @param userId User ID
 * @param count Number of characters to create
 * @returns Mock character data
 */
export function createMockCharacters(worldId: string, campaignId: string | null, userId: string, count: number = 5) {
  const characters = [];

  for (let i = 0; i < count; i++) {
    characters.push({
      id: `char-${worldId}-${i + 1}`,
      data: {
        name: `Character ${i + 1}`,
        description: `Description for Character ${i + 1}`,
        race: i % 3 === 0 ? 'Human' : i % 3 === 1 ? 'Elf' : 'Dwarf',
        class: i % 4 === 0 ? 'Fighter' : i % 4 === 1 ? 'Wizard' : i % 4 === 2 ? 'Rogue' : 'Cleric',
        type: i % 2 === 0 ? 'PC' : 'NPC',
        status: 'alive',
        worldId: worldId,
        campaignId: campaignId,
        createdBy: userId,
        createdAt: new Date(2023, 2, i + 1).toISOString(),
        updatedAt: new Date(2023, 2, i + 1).toISOString(),
        imageURL: i % 2 === 0 ? `https://example.com/character-${i + 1}.jpg` : null,
        level: Math.floor(Math.random() * 10) + 1,
        entityType: EntityType.CHARACTER
      }
    });
  }

  return createMockCollection('characters', characters);
}

/**
 * Create mock location data
 * @param worldId World ID
 * @param userId User ID
 * @param count Number of locations to create
 * @returns Mock location data
 */
export function createMockLocations(worldId: string, userId: string, count: number = 4) {
  const locations = [];

  for (let i = 0; i < count; i++) {
    locations.push({
      id: `loc-${worldId}-${i + 1}`,
      data: {
        name: `Location ${i + 1}`,
        description: `Description for Location ${i + 1}`,
        type: i % 3 === 0 ? 'City' : i % 3 === 1 ? 'Dungeon' : 'Wilderness',
        worldId: worldId,
        createdBy: userId,
        createdAt: new Date(2023, 3, i + 1).toISOString(),
        updatedAt: new Date(2023, 3, i + 1).toISOString(),
        imageURL: i % 2 === 0 ? `https://example.com/location-${i + 1}.jpg` : null,
        entityType: EntityType.LOCATION
      }
    });
  }

  return createMockCollection('locations', locations);
}

/**
 * Create mock item data
 * @param worldId World ID
 * @param userId User ID
 * @param count Number of items to create
 * @returns Mock item data
 */
export function createMockItems(worldId: string, userId: string, count: number = 3) {
  const items = [];

  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${worldId}-${i + 1}`,
      data: {
        name: `Item ${i + 1}`,
        description: `Description for Item ${i + 1}`,
        type: i % 3 === 0 ? 'Weapon' : i % 3 === 1 ? 'Armor' : 'Potion',
        rarity: i % 4 === 0 ? 'Common' : i % 4 === 1 ? 'Uncommon' : i % 4 === 2 ? 'Rare' : 'Legendary',
        worldId: worldId,
        createdBy: userId,
        createdAt: new Date(2023, 4, i + 1).toISOString(),
        updatedAt: new Date(2023, 4, i + 1).toISOString(),
        imageURL: i % 2 === 0 ? `https://example.com/item-${i + 1}.jpg` : null,
        entityType: EntityType.ITEM
      }
    });
  }

  return createMockCollection('items', items);
}

/**
 * Create a complete mock database with all entity types
 * @param userId User ID
 * @returns Complete mock database
 */
export function createMockDatabase(userId: string = 'test-user-id') {
  // Create worlds
  const worldsData = createMockRPGWorlds(userId, 3);

  // Create campaigns for each world
  const campaignsData = {};
  Object.keys(worldsData.rpgworlds).forEach(worldId => {
    Object.assign(campaignsData, createMockCampaigns(worldId, userId, 2));
  });

  // Create characters for each world
  const charactersData = {};
  Object.keys(worldsData.rpgworlds).forEach(worldId => {
    Object.assign(charactersData, createMockCharacters(worldId, null, userId, 5));
  });

  // Create locations for each world
  const locationsData = {};
  Object.keys(worldsData.rpgworlds).forEach(worldId => {
    Object.assign(locationsData, createMockLocations(worldId, userId, 4));
  });

  // Create items for each world
  const itemsData = {};
  Object.keys(worldsData.rpgworlds).forEach(worldId => {
    Object.assign(itemsData, createMockItems(worldId, userId, 3));
  });

  // Combine all data
  return {
    ...worldsData,
    ...campaignsData,
    ...charactersData,
    ...locationsData,
    ...itemsData
  };
}
