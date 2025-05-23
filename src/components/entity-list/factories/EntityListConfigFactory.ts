/**
 * Entity List Config Factory
 *
 * This factory provides standardized configurations for entity lists.
 * It generates configurations for different entity types.
 */

import { ReactNode } from 'react';
import { DocumentData } from 'firebase/firestore';
import { EntityType } from '../../../models/EntityType';
import { IEntityListConfig } from '../interfaces/EntityListConfig.interface';
import { Character } from '../../../models/Character';
import { Location } from '../../../models/Location';
import { getEntityColor } from '../../../constants/iconConfig';

/**
 * Entity list config factory class
 */
export class EntityListConfigFactory {
  /**
   * Create a character list configuration
   * @returns Character list configuration
   */
  static createCharacterConfig(): IEntityListConfig<Character> {
    return {
      entityType: EntityType.CHARACTER,
      displayName: 'Character',
      icon: null, // Will be set in the component
      color: getEntityColor(EntityType.CHARACTER),
      defaultView: 'grid',
      availableViews: ['table', 'grid', 'article', 'organize'],
      columns: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'race', title: 'Race', sortable: true },
        { key: 'class', title: 'Class', sortable: true },
        { key: 'level', title: 'Level', sortable: true },
        { key: 'type', title: 'Type', sortable: true }
      ],
      filterOptions: [
        {
          key: 'type',
          label: 'Type',
          options: [
            { value: 'PC', label: 'Player Character' },
            { value: 'NPC', label: 'Non-Player Character' },
            { value: 'Other', label: 'Other' }
          ]
        },
        {
          key: 'race',
          label: 'Race',
          options: [
            { value: 'Human', label: 'Human' },
            { value: 'Elf', label: 'Elf' },
            { value: 'Dwarf', label: 'Dwarf' },
            { value: 'Halfling', label: 'Halfling' },
            { value: 'Other', label: 'Other' }
          ]
        }
      ],
      sortOptions: [
        { key: 'name', label: 'Name', direction: 'asc', default: true },
        { key: 'level', label: 'Level', direction: 'desc' },
        { key: 'createdAt', label: 'Date Created', direction: 'desc' },
        { key: 'updatedAt', label: 'Date Updated', direction: 'desc' }
      ],
      idField: 'id',
      nameField: 'name',
      descriptionField: 'description',
      imageField: 'imageURL',
      renderBadge: null, // Will be set in the component
      getViewRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/characters/${id}`;
        }
        return `/characters/${id}`;
      },
      getEditRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/characters/${id}/edit`;
        }
        return `/characters/${id}/edit`;
      },
      getCreateRoute: (worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/characters/new`;
        }
        return `/characters/new`;
      },
      showRelationshipCounts: true,
      emptyStateMessage: 'No characters found',
      emptyStateActionText: 'Create New Character',
      itemsPerPage: 12,
      showAddButton: true,
      showFilterPanel: true,
      showSortPanel: true,
      showSearchBox: true,
      showPagination: true,
      useVirtualScrolling: false,
      persistViewPreferences: true,
      persistFiltersInURL: true,
      persistSortingInURL: true,
      persistPaginationInURL: true,
      useAnimations: true,
      useServerSideSorting: false,
      useServerSideFiltering: false,
      useServerSidePagination: false,
      useServerSideSearch: false
    };
  }

  /**
   * Create a location list configuration
   * @returns Location list configuration
   */
  static createLocationConfig(): IEntityListConfig<Location> {
    return {
      entityType: EntityType.LOCATION,
      displayName: 'Location',
      icon: null, // Will be set in the component
      color: getEntityColor(EntityType.LOCATION),
      defaultView: 'grid',
      availableViews: ['table', 'grid', 'article', 'organize'],
      columns: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'locationType', title: 'Type', sortable: true },
        { key: 'region', title: 'Region', sortable: true },
        { key: 'population', title: 'Population', sortable: true }
      ],
      filterOptions: [
        {
          key: 'locationType',
          label: 'Type',
          options: [
            { value: 'City', label: 'City' },
            { value: 'Town', label: 'Town' },
            { value: 'Village', label: 'Village' },
            { value: 'Dungeon', label: 'Dungeon' },
            { value: 'Wilderness', label: 'Wilderness' },
            { value: 'Other', label: 'Other' }
          ]
        }
      ],
      sortOptions: [
        { key: 'name', label: 'Name', direction: 'asc', default: true },
        { key: 'population', label: 'Population', direction: 'desc' },
        { key: 'createdAt', label: 'Date Created', direction: 'desc' },
        { key: 'updatedAt', label: 'Date Updated', direction: 'desc' }
      ],
      idField: 'id',
      nameField: 'name',
      descriptionField: 'description',
      imageField: 'imageURL',
      renderBadge: null, // Will be set in the component
      getViewRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/locations/${id}`;
        }
        return `/locations/${id}`;
      },
      getEditRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/locations/${id}/edit`;
        }
        return `/locations/${id}/edit`;
      },
      getCreateRoute: (worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/locations/new`;
        }
        return `/locations/new`;
      },
      showRelationshipCounts: true,
      emptyStateMessage: 'No locations found',
      emptyStateActionText: 'Create New Location',
      itemsPerPage: 12,
      showAddButton: true,
      showFilterPanel: true,
      showSortPanel: true,
      showSearchBox: true,
      showPagination: true,
      useVirtualScrolling: false,
      persistViewPreferences: true,
      persistFiltersInURL: true,
      persistSortingInURL: true,
      persistPaginationInURL: true,
      useAnimations: true,
      useServerSideSorting: false,
      useServerSideFiltering: false,
      useServerSidePagination: false,
      useServerSideSearch: false
    };
  }

  /**
   * Create a faction list configuration
   * @returns Faction list configuration
   */
  static createFactionConfig(): IEntityListConfig<any> {
    return {
      entityType: EntityType.FACTION,
      displayName: 'Faction',
      icon: null, // Will be set in the component
      color: getEntityColor(EntityType.FACTION),
      defaultView: 'grid',
      availableViews: ['table', 'grid', 'article', 'organize'],
      columns: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'factionType', title: 'Type', sortable: true },
        { key: 'scope', title: 'Scope', sortable: true },
        { key: 'leaderTitle', title: 'Leader', sortable: true },
        { key: 'headquartersId', title: 'Headquarters', sortable: true }
      ],
      filterOptions: [
        {
          key: 'factionType',
          label: 'Type',
          options: []
        }
      ],
      sortOptions: [
        { key: 'name', label: 'Name', direction: 'asc', default: true },
        { key: 'factionType', label: 'Type', direction: 'asc' },
        { key: 'createdAt', label: 'Date Created', direction: 'desc' },
        { key: 'updatedAt', label: 'Date Updated', direction: 'desc' }
      ],
      idField: 'id',
      nameField: 'name',
      descriptionField: 'description',
      imageField: 'imageURL',
      renderBadge: null, // Will be set in the component
      getViewRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/factions/${id}`;
        }
        return `/factions/${id}`;
      },
      getEditRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/factions/${id}/edit`;
        }
        return `/factions/${id}/edit`;
      },
      getCreateRoute: (worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/factions/new`;
        }
        return `/factions/new`;
      },
      showRelationshipCounts: true,
      emptyStateMessage: 'No factions found',
      emptyStateActionText: 'Create New Faction',
      itemsPerPage: 12,
      showAddButton: true,
      showFilterPanel: true,
      showSortPanel: true,
      showSearchBox: true,
      showPagination: true,
      useVirtualScrolling: false,
      persistViewPreferences: true,
      persistFiltersInURL: true,
      persistSortingInURL: true,
      persistPaginationInURL: true,
      useAnimations: true,
      useServerSideSorting: false,
      useServerSideFiltering: false,
      useServerSidePagination: false,
      useServerSideSearch: false
    };
  }

  /**
   * Create a session list configuration
   * @returns Session list configuration
   */
  static createSessionConfig(): IEntityListConfig<any> {
    return {
      entityType: EntityType.SESSION,
      displayName: 'Session',
      icon: null, // Will be set in the component
      color: getEntityColor(EntityType.SESSION),
      defaultView: 'grid',
      availableViews: ['table', 'grid', 'article', 'organize'],
      columns: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'sessionNumber', title: 'Session #', sortable: true },
        { key: 'date', title: 'Date', sortable: true },
        { key: 'status', title: 'Status', sortable: true },
        { key: 'duration', title: 'Duration', sortable: true }
      ],
      filterOptions: [
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'PLANNED', label: 'Planned' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
            { value: 'IN_PROGRESS', label: 'In Progress' }
          ]
        }
      ],
      sortOptions: [
        { key: 'sessionNumber', label: 'Session #', direction: 'asc' as 'asc', default: true },
        { key: 'date', label: 'Date', direction: 'desc' as 'desc' },
        { key: 'name', label: 'Name', direction: 'asc' as 'asc' },
        { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
        { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
      ],
      idField: 'id',
      nameField: 'name',
      descriptionField: 'summary',
      imageField: 'imageURL',
      renderBadge: null, // Will be set in the component
      getViewRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/sessions/${id}`;
        }
        return `/sessions/${id}`;
      },
      getEditRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/sessions/${id}/edit`;
        }
        return `/sessions/${id}/edit`;
      },
      getCreateRoute: (worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/sessions/new`;
        }
        return `/sessions/new`;
      },
      showRelationshipCounts: true,
      emptyStateMessage: 'No sessions found',
      emptyStateActionText: 'Create New Session',
      itemsPerPage: 12,
      showAddButton: true,
      showFilterPanel: true,
      showSortPanel: true,
      showSearchBox: true,
      showPagination: true,
      useVirtualScrolling: false,
      persistViewPreferences: true,
      persistFiltersInURL: true,
      persistSortingInURL: true,
      persistPaginationInURL: true,
      useAnimations: true,
      useServerSideSorting: false,
      useServerSideFiltering: false,
      useServerSidePagination: false,
      useServerSideSearch: false
    };
  }

  /**
   * Create a story arc list configuration
   * @returns Story Arc list configuration
   */
  static createStoryArcConfig(): IEntityListConfig<any> {
    return {
      entityType: EntityType.STORY_ARC,
      displayName: 'Story Arc',
      icon: null, // Will be set in the component
      color: getEntityColor(EntityType.STORY_ARC),
      defaultView: 'grid',
      availableViews: ['table', 'grid', 'article', 'organize'],
      columns: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'arcType', title: 'Type', sortable: true },
        { key: 'status', title: 'Status', sortable: true },
        { key: 'importance', title: 'Importance', sortable: true },
        { key: 'parentArcId', title: 'Parent Arc', sortable: true }
      ],
      filterOptions: [
        {
          key: 'arcType',
          label: 'Type',
          options: [
            { value: 'MAIN_PLOT', label: 'Main Plot' },
            { value: 'SIDE_QUEST', label: 'Side Quest' },
            { value: 'CHARACTER_ARC', label: 'Character Arc' },
            { value: 'BACKGROUND_PLOT', label: 'Background Plot' },
            { value: 'FACTION_ARC', label: 'Faction Arc' },
            { value: 'LOCATION_ARC', label: 'Location Arc' },
            { value: 'ITEM_ARC', label: 'Item Arc' },
            { value: 'OTHER', label: 'Other' }
          ]
        },
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'UPCOMING', label: 'Upcoming' },
            { value: 'ONGOING', label: 'Ongoing' },
            { value: 'PAUSED', label: 'Paused' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'ABANDONED', label: 'Abandoned' }
          ]
        }
      ],
      sortOptions: [
        { key: 'name', label: 'Name', direction: 'asc' as 'asc', default: true },
        { key: 'arcType', label: 'Type', direction: 'asc' as 'asc' },
        { key: 'status', label: 'Status', direction: 'asc' as 'asc' },
        { key: 'importance', label: 'Importance', direction: 'desc' as 'desc' },
        { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
        { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
      ],
      idField: 'id',
      nameField: 'name',
      descriptionField: 'description',
      imageField: 'imageURL',
      renderBadge: null, // Will be set in the component
      getViewRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/story-arcs/${id}`;
        }
        return `/story-arcs/${id}`;
      },
      getEditRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/story-arcs/${id}/edit`;
        }
        return `/story-arcs/${id}/edit`;
      },
      getCreateRoute: (worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/story-arcs/new`;
        }
        return `/story-arcs/new`;
      },
      showRelationshipCounts: true,
      emptyStateMessage: 'No story arcs found',
      emptyStateActionText: 'Create New Story Arc',
      itemsPerPage: 12,
      showAddButton: true,
      showFilterPanel: true,
      showSortPanel: true,
      showSearchBox: true,
      showPagination: true,
      useVirtualScrolling: false,
      persistViewPreferences: true,
      persistFiltersInURL: true,
      persistSortingInURL: true,
      persistPaginationInURL: true,
      useAnimations: true,
      useServerSideSorting: false,
      useServerSideFiltering: false,
      useServerSidePagination: false,
      useServerSideSearch: false
    };
  }

  /**
   * Create a note list configuration
   * @returns Note list configuration
   */
  static createNoteConfig(): IEntityListConfig<any> {
    return {
      entityType: EntityType.NOTE,
      displayName: 'Note',
      icon: null, // Will be set in the component
      color: getEntityColor(EntityType.NOTE),
      defaultView: 'grid',
      availableViews: ['table', 'grid', 'article', 'organize'],
      columns: [
        { key: 'title', title: 'Title', sortable: true },
        { key: 'noteType', title: 'Type', sortable: true },
        { key: 'isPrivate', title: 'Privacy', sortable: true },
        { key: 'updatedAt', title: 'Last Updated', sortable: true },
        { key: 'createdBy', title: 'Author', sortable: true }
      ],
      filterOptions: [
        {
          key: 'noteType',
          label: 'Type',
          options: [
            { value: 'GENERAL', label: 'General' },
            { value: 'LORE', label: 'Lore' },
            { value: 'QUEST', label: 'Quest' },
            { value: 'PLAYER', label: 'Player' },
            { value: 'DM', label: 'DM' },
            { value: 'SESSION', label: 'Session' }
          ]
        },
        {
          key: 'isPrivate',
          label: 'Privacy',
          options: [
            { value: 'true', label: 'Private' },
            { value: 'false', label: 'Public' }
          ]
        }
      ],
      sortOptions: [
        { key: 'title', label: 'Title', direction: 'asc' as 'asc', default: true },
        { key: 'noteType', label: 'Type', direction: 'asc' as 'asc' },
        { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
        { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
      ],
      idField: 'id',
      nameField: 'title',
      descriptionField: 'content',
      imageField: null,
      renderBadge: null, // Will be set in the component
      getViewRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/notes/${id}`;
        }
        return `/notes/${id}`;
      },
      getEditRoute: (id, worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/notes/${id}/edit`;
        }
        return `/notes/${id}/edit`;
      },
      getCreateRoute: (worldId, campaignId) => {
        if (worldId) {
          return `/rpg-worlds/${worldId}/notes/new`;
        }
        return `/notes/new`;
      },
      showRelationshipCounts: true,
      emptyStateMessage: 'No notes found',
      emptyStateActionText: 'Create New Note',
      itemsPerPage: 12,
      showAddButton: true,
      showFilterPanel: true,
      showSortPanel: true,
      showSearchBox: true,
      showPagination: true,
      useVirtualScrolling: false,
      persistViewPreferences: true,
      persistFiltersInURL: true,
      persistSortingInURL: true,
      persistPaginationInURL: true,
      useAnimations: true,
      useServerSideSorting: false,
      useServerSideFiltering: false,
      useServerSidePagination: false,
      useServerSideSearch: false
    };
  }

  /**
   * Create a configuration for a specific entity type
   * @param entityType Entity type
   * @returns Entity list configuration
   */
  static createConfig<T extends DocumentData>(entityType: EntityType): IEntityListConfig<T> {
    switch (entityType) {
      case EntityType.CHARACTER:
        return this.createCharacterConfig() as unknown as IEntityListConfig<T>;
      case EntityType.LOCATION:
        return this.createLocationConfig() as unknown as IEntityListConfig<T>;
      case EntityType.FACTION:
        return this.createFactionConfig() as unknown as IEntityListConfig<T>;
      case EntityType.SESSION:
        return this.createSessionConfig() as unknown as IEntityListConfig<T>;
      case EntityType.STORY_ARC:
        return this.createStoryArcConfig() as unknown as IEntityListConfig<T>;
      case EntityType.NOTE:
        return this.createNoteConfig() as unknown as IEntityListConfig<T>;
      // Add more entity types as needed
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }
}
