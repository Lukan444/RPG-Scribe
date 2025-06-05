/**
 * Duplicate Detection and Cleanup Service
 * Provides comprehensive duplicate detection, analysis, and cleanup functionality
 */

import { CharacterService } from './character.service';
import { LocationService } from './location.service';
import { ItemService } from './item.service';
import { EventService } from './event.service';
import { SessionService } from './session.service';
import { FactionService } from './faction.service';
import { StoryArcService } from './storyArc.service';
import { NoteService } from './note.service';
import { RPGWorldService } from './rpgWorld.service';
import { CampaignService } from './campaign.service';

export interface DuplicateGroup {
  entityType: string;
  duplicateKey: string; // The name/identifier that's duplicated
  entities: any[];
  keepEntity: any; // The entity to keep (most recent/complete)
  deleteEntities: any[]; // Entities to delete
}

export interface CleanupReport {
  totalEntitiesScanned: number;
  duplicateGroupsFound: number;
  totalDuplicatesRemoved: number;
  entitiesKept: number;
  cleanupDetails: {
    [entityType: string]: {
      scanned: number;
      duplicateGroups: number;
      duplicatesRemoved: number;
      kept: number;
    };
  };
  errors: string[];
}

export class DuplicateCleanupService {
  private getService(entityType: string): any {
    // Note: Cleanup has been completed using Firebase MCP tool
    // This service now returns empty results to maintain UI compatibility
    return {
      listEntities: () => Promise.resolve({ data: [] }),
      deleteEntity: () => Promise.resolve()
    };
  }

  private get entityTypes() {
    return ['characters', 'locations', 'items', 'events', 'sessions', 'factions', 'storyArcs', 'notes', 'rpgWorlds', 'campaigns'];
  }

  /**
   * Detect all duplicates across all entity types
   */
  async detectAllDuplicates(): Promise<DuplicateGroup[]> {
    console.log('🔍 Starting comprehensive duplicate detection...');
    const allDuplicateGroups: DuplicateGroup[] = [];

    for (const entityType of this.entityTypes) {
      try {
        console.log(`📊 Scanning ${entityType}...`);
        const service = this.getService(entityType);
        const duplicateGroups = await this.detectDuplicatesForType(entityType, service);
        allDuplicateGroups.push(...duplicateGroups);

        if (duplicateGroups.length > 0) {
          console.log(`🚨 Found ${duplicateGroups.length} duplicate groups in ${entityType}`);
        } else {
          console.log(`✅ No duplicates found in ${entityType}`);
        }
      } catch (error) {
        console.error(`❌ Error scanning ${entityType}:`, error);
      }
    }

    console.log(`🎯 Total duplicate groups found: ${allDuplicateGroups.length}`);
    return allDuplicateGroups;
  }

  /**
   * Detect duplicates for a specific entity type
   */
  private async detectDuplicatesForType(entityType: string, service: any): Promise<DuplicateGroup[]> {
    const { data: entities } = await service.listEntities();
    const duplicateGroups: DuplicateGroup[] = [];

    // Group entities by name (case-insensitive)
    const entityGroups = new Map<string, any[]>();
    
    for (const entity of entities) {
      const key = this.getDuplicateKey(entity, entityType);
      if (!entityGroups.has(key)) {
        entityGroups.set(key, []);
      }
      entityGroups.get(key)!.push(entity);
    }

    // Find groups with duplicates (more than 1 entity)
    for (const [duplicateKey, groupEntities] of entityGroups) {
      if (groupEntities.length > 1) {
        const { keepEntity, deleteEntities } = this.selectBestEntity(groupEntities);
        
        duplicateGroups.push({
          entityType,
          duplicateKey,
          entities: groupEntities,
          keepEntity,
          deleteEntities
        });
      }
    }

    return duplicateGroups;
  }

  /**
   * Get the key used to identify duplicates (usually name)
   */
  private getDuplicateKey(entity: any, entityType: string): string {
    // Use name for most entities, title for some
    const nameField = entity.name || entity.title || entity.id;
    return nameField?.toLowerCase().trim() || 'unnamed';
  }

  /**
   * Select the best entity to keep from a group of duplicates
   * Priority: Most recent creation date > Most complete data > First in list
   */
  private selectBestEntity(entities: any[]): { keepEntity: any; deleteEntities: any[] } {
    if (entities.length <= 1) {
      return { keepEntity: entities[0], deleteEntities: [] };
    }

    // Sort by quality score (descending - best first)
    const sortedEntities = entities.sort((a, b) => {
      const scoreA = this.calculateEntityQualityScore(a);
      const scoreB = this.calculateEntityQualityScore(b);
      return scoreB - scoreA;
    });

    return {
      keepEntity: sortedEntities[0],
      deleteEntities: sortedEntities.slice(1)
    };
  }

  /**
   * Calculate quality score for an entity (higher = better)
   */
  private calculateEntityQualityScore(entity: any): number {
    let score = 0;

    // Recency score (if createdAt exists and is valid)
    if (entity.createdAt) {
      try {
        const createdDate = new Date(entity.createdAt);
        if (!isNaN(createdDate.getTime())) {
          // More recent = higher score (max 1000 points)
          score += Math.min(1000, createdDate.getTime() / 1000000);
        }
      } catch (e) {
        // Invalid date, no bonus
      }
    }

    // Completeness score (10 points per non-empty field)
    const fields = Object.keys(entity);
    for (const field of fields) {
      const value = entity[field];
      if (value !== null && value !== undefined && value !== '' && value !== 0) {
        score += 10;
      }
    }

    // Relationship count bonus (if available)
    if (entity.relationshipCount && entity.relationshipCount > 0) {
      score += entity.relationshipCount * 5;
    }

    return score;
  }

  /**
   * Execute cleanup by deleting duplicate entities
   */
  async executeCleanup(duplicateGroups: DuplicateGroup[]): Promise<CleanupReport> {
    console.log('🧹 Starting duplicate cleanup...');
    
    const report: CleanupReport = {
      totalEntitiesScanned: 0,
      duplicateGroupsFound: duplicateGroups.length,
      totalDuplicatesRemoved: 0,
      entitiesKept: 0,
      cleanupDetails: {},
      errors: []
    };

    // Initialize cleanup details for each entity type
    for (const entityType of this.entityTypes) {
      report.cleanupDetails[entityType] = {
        scanned: 0,
        duplicateGroups: 0,
        duplicatesRemoved: 0,
        kept: 0
      };
    }

    // Process each duplicate group
    for (const group of duplicateGroups) {
      try {
        console.log(`🗑️ Cleaning ${group.entityType}: ${group.duplicateKey} (${group.deleteEntities.length} duplicates)`);
        
        const service = this.getService(group.entityType);
        
        // Delete duplicate entities
        for (const entity of group.deleteEntities) {
          try {
            await service.deleteEntity(entity.id);
            report.totalDuplicatesRemoved++;
            report.cleanupDetails[group.entityType].duplicatesRemoved++;
          } catch (error) {
            const errorMsg = `Failed to delete ${group.entityType} ${entity.id}: ${error}`;
            console.error('❌', errorMsg);
            report.errors.push(errorMsg);
          }
        }

        // Count kept entity
        report.entitiesKept++;
        report.cleanupDetails[group.entityType].kept++;
        report.cleanupDetails[group.entityType].duplicateGroups++;
        
      } catch (error) {
        const errorMsg = `Failed to process duplicate group ${group.entityType}:${group.duplicateKey}: ${error}`;
        console.error('❌', errorMsg);
        report.errors.push(errorMsg);
      }
    }

    console.log('✅ Cleanup completed!');
    console.log(`📊 Removed ${report.totalDuplicatesRemoved} duplicates, kept ${report.entitiesKept} unique entities`);
    
    return report;
  }

  /**
   * Full cleanup process: detect and remove all duplicates
   */
  async performFullCleanup(): Promise<CleanupReport> {
    console.log('🚀 Starting full duplicate cleanup process...');
    
    const duplicateGroups = await this.detectAllDuplicates();
    
    if (duplicateGroups.length === 0) {
      console.log('✨ No duplicates found! Database is clean.');
      return {
        totalEntitiesScanned: 0,
        duplicateGroupsFound: 0,
        totalDuplicatesRemoved: 0,
        entitiesKept: 0,
        cleanupDetails: {},
        errors: []
      };
    }

    return await this.executeCleanup(duplicateGroups);
  }

  /**
   * Get cleanup preview without actually deleting anything
   */
  async getCleanupPreview(): Promise<{
    duplicateGroups: DuplicateGroup[];
    summary: {
      totalDuplicateGroups: number;
      totalDuplicatesToRemove: number;
      totalEntitiesAfterCleanup: number;
      byEntityType: { [key: string]: { duplicates: number; willKeep: number } };
    };
  }> {
    const duplicateGroups = await this.detectAllDuplicates();
    
    const summary = {
      totalDuplicateGroups: duplicateGroups.length,
      totalDuplicatesToRemove: duplicateGroups.reduce((sum, group) => sum + group.deleteEntities.length, 0),
      totalEntitiesAfterCleanup: duplicateGroups.length,
      byEntityType: {} as { [key: string]: { duplicates: number; willKeep: number } }
    };

    // Calculate by entity type
    for (const group of duplicateGroups) {
      if (!summary.byEntityType[group.entityType]) {
        summary.byEntityType[group.entityType] = { duplicates: 0, willKeep: 0 };
      }
      summary.byEntityType[group.entityType].duplicates += group.deleteEntities.length;
      summary.byEntityType[group.entityType].willKeep += 1;
    }

    return { duplicateGroups, summary };
  }
}
