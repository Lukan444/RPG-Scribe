/**
 * AI Search Service
 * 
 * Provides AI-powered semantic search functionality for the global search bar.
 * Integrates with VertexAI Index Management System and provides fallback options.
 */

import { EntityType } from '../../models/EntityType';
import { FirestoreService } from '../firestore.service';

/**
 * Search result interface
 */
export interface AISearchResult {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  worldId?: string;
  campaignId?: string;
  similarity?: number;
  isExactMatch: boolean;
  isSemanticMatch: boolean;
  relationshipCount?: number;
  relationshipContext?: string[];
  confidence: number;
  matchReason?: string;
}

/**
 * Search options interface
 */
export interface AISearchOptions {
  entityTypes?: EntityType[];
  worldId?: string;
  campaignId?: string;
  limit?: number;
  minConfidence?: number;
  includeRelationships?: boolean;
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
}

/**
 * Search suggestion interface
 */
export interface SearchSuggestion {
  query: string;
  type: 'entity' | 'relationship' | 'natural_language';
  description: string;
  icon: string;
}

/**
 * AI Search Service class - Firebase-integrated version
 */
export class AISearchService {
  private initialized = false;
  private firestoreServices: Map<string, FirestoreService<any>> = new Map();

  constructor() {
    // Initialize Firestore services for each entity type
    this.initializeFirestoreServices();
  }

  /**
   * Initialize Firestore services for each entity type
   */
  private initializeFirestoreServices(): void {
    const entityCollections = {
      [EntityType.CHARACTER]: 'characters',
      [EntityType.LOCATION]: 'locations',
      [EntityType.ITEM]: 'items',
      [EntityType.EVENT]: 'events',
      [EntityType.SESSION]: 'sessions',
      [EntityType.FACTION]: 'factions',
      [EntityType.STORY_ARC]: 'storyArcs',
      [EntityType.NOTE]: 'notes',
      [EntityType.CAMPAIGN]: 'campaigns',
      [EntityType.RPG_WORLD]: 'rpgworlds'
    };

    Object.entries(entityCollections).forEach(([entityType, collection]) => {
      this.firestoreServices.set(entityType, new FirestoreService(collection));
    });
  }

  /**
   * Initialize the AI search service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔍 Initializing AI Search Service (Firebase Mode)...');

      // Test Firebase connectivity
      const testService = this.firestoreServices.get(EntityType.CHARACTER);
      if (testService) {
        await testService.query([], 1);
        console.log('✅ Firebase connectivity verified');
      }

      this.initialized = true;
      console.log('✅ AI Search Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Search Service:', error);
      // Continue with limited functionality
      this.initialized = true;
    }
  }

  /**
   * Perform AI-powered search with Firebase data
   */
  async search(
    query: string,
    options: AISearchOptions = {}
  ): Promise<AISearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      entityTypes = Object.values(EntityType),
      limit = 10,
      minConfidence = 0.3,
      searchMode = 'hybrid'
    } = options;

    try {
      console.log(`🔍 Searching for: "${query}" with mode: ${searchMode}`);
      const startTime = Date.now();

      let results: AISearchResult[] = [];

      if (!query || query.trim().length === 0) {
        return results;
      }

      const queryLower = query.toLowerCase();

      // Search across all requested entity types
      const searchPromises = entityTypes.map(entityType =>
        this.searchEntityType(entityType, queryLower, limit)
      );

      const entityResults = await Promise.all(searchPromises);

      // Flatten and combine results
      results = entityResults.flat();

      // Add semantic matches for common RPG terms
      const semanticMatches = await this.getSemanticMatches(queryLower, entityTypes);
      results = [...results, ...semanticMatches];

      // Remove duplicates and sort by confidence
      results = this.deduplicateAndSort(results);

      // Filter by minimum confidence
      results = results.filter(result => result.confidence >= minConfidence);

      // Limit results
      results = results.slice(0, limit);

      const searchTime = Date.now() - startTime;
      console.log(`✅ Found ${results.length} search results in ${searchTime}ms`);

      return results;
    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  }

  /**
   * Search a specific entity type in Firebase
   */
  private async searchEntityType(entityType: EntityType, query: string, limit: number): Promise<AISearchResult[]> {
    const service = this.firestoreServices.get(entityType);
    if (!service) return [];

    try {
      // Get all entities of this type (we'll implement more sophisticated filtering later)
      const queryResult = await service.query([], 50);
      const entities = queryResult.data;

      const results: AISearchResult[] = [];

      entities.forEach((entity: any) => {
        const name = entity.name || entity.title || 'Unnamed';
        const description = entity.description || '';

        // Check for exact matches
        const nameMatch = name.toLowerCase().includes(query);
        const descriptionMatch = description.toLowerCase().includes(query);

        if (nameMatch || descriptionMatch) {
          const confidence = nameMatch ? 1.0 : 0.7;
          const isExactMatch = nameMatch && name.toLowerCase() === query;

          results.push({
            id: entity.id,
            name,
            type: entityType,
            description,
            worldId: entity.worldId,
            campaignId: entity.campaignId,
            similarity: confidence,
            isExactMatch,
            isSemanticMatch: !isExactMatch,
            confidence,
            relationshipCount: this.getRelationshipCount(entity),
            relationshipContext: this.getRelationshipContext(entity),
            matchReason: isExactMatch ? 'Exact match' : nameMatch ? 'Name contains query' : 'Description contains query'
          });
        }
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error(`❌ Failed to search ${entityType}:`, error);
      return [];
    }
  }

  /**
   * Get relationship count from entity data
   */
  private getRelationshipCount(entity: any): number {
    // Count various relationship fields
    let count = 0;

    if (entity.characterIds?.length) count += entity.characterIds.length;
    if (entity.locationIds?.length) count += entity.locationIds.length;
    if (entity.itemIds?.length) count += entity.itemIds.length;
    if (entity.eventIds?.length) count += entity.eventIds.length;
    if (entity.factionIds?.length) count += entity.factionIds.length;
    if (entity.relatedEntityIds?.length) count += entity.relatedEntityIds.length;

    return count;
  }

  /**
   * Get relationship context from entity data
   */
  private getRelationshipContext(entity: any): string[] {
    const context: string[] = [];

    if (entity.characterIds?.length) {
      context.push(`Connected to ${entity.characterIds.length} characters`);
    }
    if (entity.locationIds?.length) {
      context.push(`Related to ${entity.locationIds.length} locations`);
    }
    if (entity.itemIds?.length) {
      context.push(`Associated with ${entity.itemIds.length} items`);
    }
    if (entity.eventIds?.length) {
      context.push(`Involved in ${entity.eventIds.length} events`);
    }
    if (entity.factionIds?.length) {
      context.push(`Connected to ${entity.factionIds.length} factions`);
    }

    return context.slice(0, 3); // Limit to 3 context items
  }

  /**
   * Get semantic matches for common RPG terms using Firebase data
   */
  private async getSemanticMatches(query: string, entityTypes: EntityType[]): Promise<AISearchResult[]> {
    const results: AISearchResult[] = [];

    // Define semantic term mappings
    const semanticTerms: Record<string, { entityType: EntityType; searchTerms: string[] }[]> = {
      'tavern': [
        { entityType: EntityType.LOCATION, searchTerms: ['inn', 'tavern', 'pub', 'bar'] }
      ],
      'inn': [
        { entityType: EntityType.LOCATION, searchTerms: ['inn', 'tavern', 'pub', 'bar'] }
      ],
      'sword': [
        { entityType: EntityType.ITEM, searchTerms: ['sword', 'blade', 'weapon'] }
      ],
      'weapon': [
        { entityType: EntityType.ITEM, searchTerms: ['sword', 'blade', 'weapon', 'mace', 'bow'] }
      ],
      'magic': [
        { entityType: EntityType.ITEM, searchTerms: ['magic', 'magical', 'enchanted'] },
        { entityType: EntityType.CHARACTER, searchTerms: ['wizard', 'mage', 'sorcerer', 'magic'] }
      ],
      'dragon': [
        { entityType: EntityType.CHARACTER, searchTerms: ['dragon'] },
        { entityType: EntityType.EVENT, searchTerms: ['dragon'] }
      ],
      'goblin': [
        { entityType: EntityType.CHARACTER, searchTerms: ['goblin'] },
        { entityType: EntityType.FACTION, searchTerms: ['goblin'] }
      ],
      'cave': [
        { entityType: EntityType.LOCATION, searchTerms: ['cave', 'cavern', 'underground'] }
      ]
    };

    // Check for natural language patterns first
    const naturalLanguagePatterns = [
      { pattern: /show\s+me\s+all\s+characters?/i, entityType: EntityType.CHARACTER },
      { pattern: /all\s+characters?/i, entityType: EntityType.CHARACTER },
      { pattern: /show\s+me\s+all\s+locations?/i, entityType: EntityType.LOCATION },
      { pattern: /all\s+locations?/i, entityType: EntityType.LOCATION },
      { pattern: /show\s+me\s+all\s+items?/i, entityType: EntityType.ITEM },
      { pattern: /all\s+items?/i, entityType: EntityType.ITEM },
      { pattern: /show\s+me\s+all\s+events?/i, entityType: EntityType.EVENT },
      { pattern: /all\s+events?/i, entityType: EntityType.EVENT },
      { pattern: /recent\s+campaign\s+events?/i, entityType: EntityType.EVENT },
      { pattern: /recent\s+events?/i, entityType: EntityType.EVENT },
      { pattern: /campaign\s+events?/i, entityType: EntityType.EVENT },
      { pattern: /show\s+me\s+all\s+sessions?/i, entityType: EntityType.SESSION },
      { pattern: /all\s+sessions?/i, entityType: EntityType.SESSION },
      { pattern: /show\s+me\s+all\s+factions?/i, entityType: EntityType.FACTION },
      { pattern: /all\s+factions?/i, entityType: EntityType.FACTION }
    ];

    // Check for natural language patterns
    for (const { pattern, entityType } of naturalLanguagePatterns) {
      if (pattern.test(query)) {
        if (entityTypes.includes(entityType)) {
          const allEntities = await this.getAllEntitiesOfType(entityType);
          results.push(...allEntities);
        }
      }
    }

    // Check if query matches any semantic terms
    for (const [term, mappings] of Object.entries(semanticTerms)) {
      if (query.includes(term)) {
        for (const mapping of mappings) {
          if (entityTypes.includes(mapping.entityType)) {
            const semanticResults = await this.searchSemanticTerm(mapping.entityType, mapping.searchTerms);
            results.push(...semanticResults);
          }
        }
      }
    }

    return results;
  }

  /**
   * Search for entities that match semantic terms
   */
  private async searchSemanticTerm(entityType: EntityType, searchTerms: string[]): Promise<AISearchResult[]> {
    const service = this.firestoreServices.get(entityType);
    if (!service) return [];

    try {
      const queryResult = await service.query([], 20);
      const entities = queryResult.data;
      const results: AISearchResult[] = [];

      entities.forEach((entity: any) => {
        const name = entity.name || entity.title || 'Unnamed';
        const description = entity.description || '';
        const combinedText = `${name} ${description}`.toLowerCase();

        // Check if any search terms match
        const matchingTerms = searchTerms.filter(term =>
          combinedText.includes(term.toLowerCase())
        );

        if (matchingTerms.length > 0) {
          const confidence = 0.6 + (matchingTerms.length * 0.1); // Higher confidence for more matches

          results.push({
            id: entity.id,
            name,
            type: entityType,
            description,
            worldId: entity.worldId,
            campaignId: entity.campaignId,
            similarity: confidence,
            isExactMatch: false,
            isSemanticMatch: true,
            confidence,
            relationshipCount: this.getRelationshipCount(entity),
            relationshipContext: this.getRelationshipContext(entity),
            matchReason: `Semantic match for: ${matchingTerms.join(', ')}`
          });
        }
      });

      return results.slice(0, 3); // Limit semantic matches
    } catch (error) {
      console.error(`❌ Failed to search semantic terms for ${entityType}:`, error);
      return [];
    }
  }

  /**
   * Get all entities of a specific type for "show all" queries
   */
  private async getAllEntitiesOfType(entityType: EntityType): Promise<AISearchResult[]> {
    const service = this.firestoreServices.get(entityType);
    if (!service) return [];

    try {
      const queryResult = await service.query([], 20);
      const entities = queryResult.data;
      const results: AISearchResult[] = [];

      entities.forEach((entity: any) => {
        const name = entity.name || entity.title || 'Unnamed';
        const description = entity.description || '';

        // For "show all" queries, give high confidence
        const confidence = 0.8;
        let matchReason = `All ${entityType.toLowerCase()} entities`;

        // For recent queries, prioritize newer entities
        if (entity.createdAt || entity.updatedAt) {
          const entityDate = new Date(entity.createdAt || entity.updatedAt);
          const daysSinceCreated = (Date.now() - entityDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceCreated <= 30) {
            matchReason = `Recent ${entityType.toLowerCase()} entity`;
          }
        }

        results.push({
          id: entity.id,
          name,
          type: entityType,
          description,
          worldId: entity.worldId,
          campaignId: entity.campaignId,
          similarity: confidence,
          isExactMatch: false,
          isSemanticMatch: true,
          confidence,
          relationshipCount: this.getRelationshipCount(entity),
          relationshipContext: this.getRelationshipContext(entity),
          matchReason
        });
      });

      // Sort by confidence (recent items first for "recent" queries)
      results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      return results.slice(0, 5); // Limit to 5 results for "show all" queries
    } catch (error) {
      console.error(`❌ Failed to get all entities for ${entityType}:`, error);
      return [];
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    if (!partialQuery || partialQuery.length < 2) {
      return this.getDefaultSuggestions();
    }

    const suggestions: SearchSuggestion[] = [];

    try {
      // Get actual entity suggestions from Firebase
      const entitySuggestions = await this.getEntitySuggestions(partialQuery);
      suggestions.push(...entitySuggestions);

      // Add entity type suggestions
      const entityTypes = Object.values(EntityType);
      entityTypes.forEach(type => {
        if (type.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.push({
            query: `Show me all ${type.toLowerCase()}s`,
            type: 'entity',
            description: `Search for all ${type.toLowerCase()} entities`,
            icon: 'IconDatabase'
          });
        }
      });

      // Add semantic suggestions based on query
      const semanticSuggestions = this.getSemanticSuggestions(partialQuery);
      suggestions.push(...semanticSuggestions);

    } catch (error) {
      console.error('❌ Failed to get suggestions:', error);
    }

    return suggestions.slice(0, 6);
  }

  /**
   * Get entity suggestions from Firebase
   */
  private async getEntitySuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = partialQuery.toLowerCase();

    // Search a few entity types for quick suggestions
    const priorityTypes = [EntityType.CHARACTER, EntityType.LOCATION, EntityType.ITEM];

    for (const entityType of priorityTypes) {
      const service = this.firestoreServices.get(entityType);
      if (!service) continue;

      try {
        const queryResult = await service.query([], 10);
        const entities = queryResult.data;

        entities.forEach((entity: any) => {
          const name = entity.name || entity.title || 'Unnamed';
          if (name.toLowerCase().includes(queryLower)) {
            suggestions.push({
              query: name,
              type: 'entity',
              description: `${entityType}: ${entity.description || 'No description'}`,
              icon: this.getEntityIcon(entityType)
            });
          }
        });
      } catch (error) {
        console.error(`❌ Failed to get suggestions for ${entityType}:`, error);
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get semantic suggestions based on query
   */
  private getSemanticSuggestions(partialQuery: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = partialQuery.toLowerCase();

    const semanticMap: Record<string, SearchSuggestion> = {
      'tavern': {
        query: 'Find taverns and inns',
        type: 'natural_language',
        description: 'Search for taverns, inns, and drinking establishments',
        icon: 'IconMapPin'
      },
      'magic': {
        query: 'Magical items and spells',
        type: 'natural_language',
        description: 'Find magical items, spells, and enchanted objects',
        icon: 'IconSword'
      },
      'dragon': {
        query: 'Dragon encounters and lore',
        type: 'natural_language',
        description: 'Find dragons, dragon-related events and items',
        icon: 'IconCalendar'
      },
      'goblin': {
        query: 'Goblin factions and encounters',
        type: 'natural_language',
        description: 'Find goblin tribes, characters, and related events',
        icon: 'IconUsers'
      }
    };

    Object.entries(semanticMap).forEach(([term, suggestion]) => {
      if (term.includes(queryLower) || queryLower.includes(term)) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  /**
   * Get icon name for entity type
   */
  private getEntityIcon(entityType: EntityType): string {
    const iconMap: Record<EntityType, string> = {
      [EntityType.CHARACTER]: 'IconUsers',
      [EntityType.LOCATION]: 'IconMapPin',
      [EntityType.ITEM]: 'IconSword',
      [EntityType.EVENT]: 'IconCalendar',
      [EntityType.SESSION]: 'IconClock',
      [EntityType.FACTION]: 'IconShield',
      [EntityType.STORY_ARC]: 'IconBook',
      [EntityType.NOTE]: 'IconNote',
      [EntityType.CAMPAIGN]: 'IconFlag',
      [EntityType.RPG_WORLD]: 'IconWorld'
    };

    return iconMap[entityType] || 'IconDatabase';
  }



  /**
   * Remove duplicates and sort by confidence
   */
  private deduplicateAndSort(results: AISearchResult[]): AISearchResult[] {
    const seen = new Set<string>();
    const unique = results.filter(result => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });

    return unique.sort((a, b) => {
      // Prioritize exact matches
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      
      // Then sort by confidence
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }

  /**
   * Add relationship context to search results (already included in mock data)
   */
  private async addRelationshipContext(results: AISearchResult[]): Promise<AISearchResult[]> {
    // Relationship context is already included in mock data
    return results;
  }

  /**
   * Get default search suggestions
   */
  private getDefaultSuggestions(): SearchSuggestion[] {
    return [
      {
        query: 'Show me all characters',
        type: 'entity',
        description: 'Browse all character entities',
        icon: 'IconUsers'
      },
      {
        query: 'Find tavern locations',
        type: 'natural_language',
        description: 'Search for tavern and inn locations',
        icon: 'IconMapPin'
      },
      {
        query: 'Magical items and artifacts',
        type: 'natural_language',
        description: 'Find magical items and artifacts',
        icon: 'IconSword'
      },
      {
        query: 'Recent campaign events',
        type: 'natural_language',
        description: 'Show recent events and plot points',
        icon: 'IconCalendar'
      }
    ];
  }
}

// Export singleton instance
export const aiSearchService = new AISearchService();
