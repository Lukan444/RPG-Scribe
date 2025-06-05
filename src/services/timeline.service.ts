/**
 * Timeline Service
 *
 * This service provides core timeline management functionality for the
 * Dual Timeline System in RPG Scribe, including time calculations,
 * chronological ordering, and timeline operations.
 */

import { DocumentData, QueryConstraint, where, orderBy, limit } from 'firebase/firestore';
import { EnhancedFirestoreService } from './enhanced-firestore.service';
import { TimelineValidationService } from './timelineValidation.service';
import {
  TimelineEntry,
  TimelineEntryCreationParams,
  TimelineEntryUpdateParams
} from '../models/Timeline';
import {
  TimeGap,
  DualTimestamp,
  TimelinePosition,
  TimelineQueryOptions,
  TimelineStatistics,
  TimelineValidationResult,
  TimelineContext
} from '../types/timeline';
import { TimelineEntryType } from '../constants/timelineConstants';
import {
  timeGapToMinutes,
  addTimeGapToDate,
  calculateTimeGapBetweenDates,
  createDualTimestamp,
  generateTimelineSequence,
  normalizeTimelinePositions,
  compareTimelinePositions,
  formatTimeGap
} from '../utils/timelineUtils';
import { DEFAULT_WORLD_ID, DEFAULT_CAMPAIGN_ID } from '../constants/appConstants';

export interface EntityEventFilter {
  worldId?: string;
  campaignId?: string;
  sessionId?: string;
  timeFrame?: 'last-week' | 'last-month' | 'last-3-months' | 'all-time' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Timeline Service
 * Manages timeline entries and provides timeline operations
 */
export class TimelineService extends EnhancedFirestoreService<TimelineEntry> {
  private validationService: TimelineValidationService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new TimelineService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId?: string, campaignId?: string) {
    const effectiveWorldId = worldId || DEFAULT_WORLD_ID;
    const effectiveCampaignId = campaignId || DEFAULT_CAMPAIGN_ID;

    // Use timeline_entries collection
    super('timeline_entries', {
      defaultCountCacheTTL: 10 * 60 * 1000, // 10 minutes
      countThreshold: 5 // Recalculate after 5 changes
    });

    this.worldId = effectiveWorldId;
    this.campaignId = effectiveCampaignId;
    this.validationService = TimelineValidationService.getInstance();
  }

  /**
   * Create a new timeline entry
   * @param params Timeline entry creation parameters
   * @returns Timeline entry ID
   */
  async createTimelineEntry(params: TimelineEntryCreationParams): Promise<string> {
    try {
      // Get existing timeline entries to determine position
      const existingEntries = await this.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      // Create timeline position
      const position: TimelinePosition = {
        sequence: params.position?.sequence ?? generateTimelineSequence(
          existingEntries.map(e => e.position)
        ),
        inGameTimestamp: params.position?.inGameTimestamp,
        realWorldTimestamp: new Date(),
        timeGapBefore: params.position?.timeGapBefore,
        timeGapAfter: params.position?.timeGapAfter
      };

      // Create dual timestamp
      const dualTimestamp: DualTimestamp = params.dualTimestamp || createDualTimestamp(
        params.position?.inGameTimestamp
      );

      // Build timeline entry
      const timelineEntry: TimelineEntry = {
        ...params,
        entityType: 'EVENT' as any, // Timeline entries are stored as events
        entryType: params.entryType,
        position,
        dualTimestamp,
        title: params.title,
        worldId: this.worldId,
        campaignId: this.campaignId,
        createdBy: 'current-user', // TODO: Get from auth context
        createdAt: new Date(),
        updatedAt: new Date(),
        lastValidated: new Date(),
        validationStatus: 'valid'
      };

      // Create the entry
      const entryId = await this.create(timelineEntry);

      // Recalculate timeline positions if needed
      await this.recalculateTimelinePositions();

      return entryId;
    } catch (error) {
      console.error('Error creating timeline entry:', error);
      throw error;
    }
  }

  /**
   * Update a timeline entry
   * @param id Timeline entry ID
   * @param params Update parameters
   * @returns Success status
   */
  async updateTimelineEntry(id: string, params: TimelineEntryUpdateParams): Promise<boolean> {
    try {
      // Get the current entry to merge position data properly
      const currentEntry = await this.getById(id);
      if (!currentEntry) {
        throw new Error('Timeline entry not found');
      }

      const updateData: Partial<TimelineEntry> = {
        ...params,
        updatedAt: new Date(),
        validationStatus: 'valid', // Will be revalidated
        // Merge position data properly
        position: params.position ? {
          ...currentEntry.position,
          ...params.position
        } : currentEntry.position
      };

      const success = await this.update(id, updateData);

      if (success && params.position) {
        // Recalculate timeline positions if position was changed
        await this.recalculateTimelinePositions();
      }

      return success;
    } catch (error) {
      console.error('Error updating timeline entry:', error);
      throw error;
    }
  }

  /**
   * Get timeline entries with filtering and sorting
   * @param options Query options
   * @returns Array of timeline entries
   */
  async getTimelineEntries(options: TimelineQueryOptions = {}): Promise<TimelineEntry[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Add world and campaign filters
      constraints.push(where('worldId', '==', this.worldId));
      constraints.push(where('campaignId', '==', this.campaignId));

      // Add date filters
      if (options.startDate) {
        constraints.push(where('dualTimestamp.inGameTime', '>=', options.startDate));
      }
      if (options.endDate) {
        constraints.push(where('dualTimestamp.inGameTime', '<=', options.endDate));
      }

      // Add entity type filters
      if (options.entityTypes && options.entityTypes.length > 0) {
        constraints.push(where('associatedEntityType', 'in', options.entityTypes));
      }

      // Add entity ID filters
      if (options.entityIds && options.entityIds.length > 0) {
        constraints.push(where('associatedEntityId', 'in', options.entityIds));
      }

      // Add entry type filters
      if (options.entryTypes && options.entryTypes.length > 0) {
        constraints.push(where('entryType', 'in', options.entryTypes));
      }

      // Add secret filter
      if (options.includeSecret === false) {
        constraints.push(where('isSecret', '!=', true));
      }

      // Add sorting
      const sortBy = options.sortBy || 'sequence';
      const sortDirection = options.sortDirection || 'asc';

      if (sortBy === 'sequence') {
        constraints.push(orderBy('position.sequence', sortDirection));
      } else if (sortBy === 'inGameTime') {
        constraints.push(orderBy('dualTimestamp.inGameTime', sortDirection));
      } else if (sortBy === 'realWorldTime') {
        constraints.push(orderBy('dualTimestamp.realWorldTime', sortDirection));
      } else if (sortBy === 'createdAt') {
        constraints.push(orderBy('createdAt', sortDirection));
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      const result = await this.query(constraints);
      const entries = result.data;

      // Apply client-side sorting if needed
      return entries.sort((a: TimelineEntry, b: TimelineEntry) => compareTimelinePositions(a.position, b.position));
    } catch (error) {
      console.error('Error getting timeline entries:', error);
      throw error;
    }
  }

  /**
   * Calculate in-game timestamps for all timeline entries
   * @param baseTimestamp Base in-game timestamp to start from
   * @returns Updated timeline entries
   */
  async calculateInGameTimestamps(baseTimestamp: Date): Promise<TimelineEntry[]> {
    try {
      const entries = await this.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      let currentTimestamp = new Date(baseTimestamp);
      const updatedEntries: TimelineEntry[] = [];

      for (const entry of entries) {
        // Add time gap before this entry
        if (entry.position.timeGapBefore) {
          currentTimestamp = addTimeGapToDate(currentTimestamp, entry.position.timeGapBefore);
        }

        // Update entry with calculated timestamp
        const updatedEntry: TimelineEntry = {
          ...entry,
          position: {
            ...entry.position,
            inGameTimestamp: new Date(currentTimestamp)
          },
          dualTimestamp: {
            ...entry.dualTimestamp,
            inGameTime: new Date(currentTimestamp)
          }
        };

        // Update in database
        await this.update(entry.id!, {
          position: updatedEntry.position,
          dualTimestamp: updatedEntry.dualTimestamp
        } as Partial<TimelineEntry>);

        updatedEntries.push(updatedEntry);

        // Add duration of this entry
        if (entry.duration) {
          currentTimestamp = addTimeGapToDate(currentTimestamp, entry.duration);
        }
      }

      return updatedEntries;
    } catch (error) {
      console.error('Error calculating in-game timestamps:', error);
      throw error;
    }
  }

  /**
   * Validate the entire timeline
   * @param context Timeline context
   * @returns Validation result
   */
  async validateTimeline(context?: TimelineContext): Promise<TimelineValidationResult> {
    try {
      const entries = await this.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      const timelineContext: TimelineContext = context || {
        campaignId: this.campaignId,
        worldId: this.worldId,
        recentEntries: entries.slice(-10), // Last 10 entries
        activeCharacters: [], // TODO: Get from character service
        sessionInProgress: false
      };

      return await this.validationService.validateTimeline(entries, timelineContext);
    } catch (error) {
      console.error('Error validating timeline:', error);
      throw error;
    }
  }

  /**
   * Get timeline statistics
   * @returns Timeline statistics
   */
  async getTimelineStatistics(): Promise<TimelineStatistics> {
    try {
      const entries = await this.getTimelineEntries();

      if (entries.length === 0) {
        return {
          totalEntries: 0,
          totalDuration: { duration: 0, unit: 'minutes' as any },
          averageSessionDuration: { duration: 0, unit: 'minutes' as any },
          longestTimeGap: { duration: 0, unit: 'minutes' as any },
          shortestTimeGap: { duration: 0, unit: 'minutes' as any },
          conflictCount: 0,
          entryTypeBreakdown: {} as any,
          entityTypeBreakdown: {}
        };
      }

      // Calculate total duration
      const totalMinutes = entries.reduce((total, entry) => {
        return total + (entry.duration ? timeGapToMinutes(entry.duration) : 0);
      }, 0);

      // Calculate time gaps
      const timeGaps = entries
        .map(e => e.position.timeGapBefore)
        .filter(gap => gap !== undefined)
        .map(gap => timeGapToMinutes(gap!));

      const longestGap = timeGaps.length > 0 ? Math.max(...timeGaps) : 0;
      const shortestGap = timeGaps.length > 0 ? Math.min(...timeGaps) : 0;

      // Calculate breakdowns
      const entryTypeBreakdown = entries.reduce((breakdown, entry) => {
        breakdown[entry.entryType] = (breakdown[entry.entryType] || 0) + 1;
        return breakdown;
      }, {} as Record<TimelineEntryType, number>);

      const entityTypeBreakdown = entries.reduce((breakdown, entry) => {
        breakdown[entry.associatedEntityType] = (breakdown[entry.associatedEntityType] || 0) + 1;
        return breakdown;
      }, {} as Record<string, number>);

      // Get conflict count
      const validation = await this.validateTimeline();
      const conflictCount = validation.conflicts.length;

      return {
        totalEntries: entries.length,
        totalDuration: { duration: totalMinutes, unit: 'minutes' as any },
        averageSessionDuration: { duration: Math.round(totalMinutes / entries.length), unit: 'minutes' as any },
        longestTimeGap: { duration: longestGap, unit: 'minutes' as any },
        shortestTimeGap: { duration: shortestGap, unit: 'minutes' as any },
        conflictCount,
        entryTypeBreakdown,
        entityTypeBreakdown
      };
    } catch (error) {
      console.error('Error getting timeline statistics:', error);
      throw error;
    }
  }

  /**
   * Insert a timeline entry at a specific position
   * @param params Timeline entry creation parameters
   * @param insertAfterSequence Sequence number to insert after
   * @returns Timeline entry ID
   */
  async insertTimelineEntryAt(
    params: TimelineEntryCreationParams,
    insertAfterSequence: number
  ): Promise<string> {
    try {
      // Get all entries after the insertion point
      const entriesAfter = await this.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      // Shift sequence numbers for entries after insertion point
      for (const entry of entriesAfter) {
        if (entry.position.sequence > insertAfterSequence) {
          await this.update(entry.id!, {
            position: {
              ...entry.position,
              sequence: entry.position.sequence + 1
            }
          } as Partial<TimelineEntry>);
        }
      }

      // Create the new entry with the correct sequence
      const newParams = {
        ...params,
        position: {
          ...params.position,
          sequence: insertAfterSequence + 1
        }
      };

      return await this.createTimelineEntry(newParams);
    } catch (error) {
      console.error('Error inserting timeline entry:', error);
      throw error;
    }
  }

  /**
   * Move a timeline entry to a new position
   * @param entryId Timeline entry ID
   * @param newSequence New sequence position
   * @returns Success status
   */
  async moveTimelineEntry(entryId: string, newSequence: number): Promise<boolean> {
    try {
      const entry = await this.getById(entryId);
      if (!entry) {
        throw new Error('Timeline entry not found');
      }

      const oldSequence = entry.position.sequence;

      if (oldSequence === newSequence) {
        return true; // No change needed
      }

      // Get all entries to reorder
      const allEntries = await this.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      // Remove the entry from its current position
      const otherEntries = allEntries.filter(e => e.id !== entryId);

      // Insert at new position
      otherEntries.splice(newSequence, 0, entry);

      // Update sequence numbers for all affected entries
      for (let i = 0; i < otherEntries.length; i++) {
        const currentEntry = otherEntries[i];
        if (currentEntry.position.sequence !== i) {
          await this.update(currentEntry.id!, {
            position: {
              ...currentEntry.position,
              sequence: i
            }
          } as Partial<TimelineEntry>);
        }
      }

      return true;
    } catch (error) {
      console.error('Error moving timeline entry:', error);
      throw error;
    }
  }

  /**
   * Delete a timeline entry and reorder remaining entries
   * @param entryId Timeline entry ID
   * @returns Success status
   */
  async deleteTimelineEntry(entryId: string): Promise<boolean> {
    try {
      const entry = await this.getById(entryId);
      if (!entry) {
        return false;
      }

      const deletedSequence = entry.position.sequence;

      // Delete the entry
      const success = await this.delete(entryId);

      if (success) {
        // Shift down all entries after the deleted one
        const entriesAfter = await this.getTimelineEntries({
          sortBy: 'sequence',
          sortDirection: 'asc'
        });

        for (const remainingEntry of entriesAfter) {
          if (remainingEntry.position.sequence > deletedSequence) {
            await this.update(remainingEntry.id!, {
              position: {
                ...remainingEntry.position,
                sequence: remainingEntry.position.sequence - 1
              }
            } as Partial<TimelineEntry>);
          }
        }
      }

      return success;
    } catch (error) {
      console.error('Error deleting timeline entry:', error);
      throw error;
    }
  }

  /**
   * Get timeline entries for a specific entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Array of timeline entries
   */
  async getTimelineEntriesForEntity(entityId: string, entityType?: string): Promise<TimelineEntry[]> {
    try {
      const options: TimelineQueryOptions = {
        entityIds: [entityId],
        sortBy: 'sequence',
        sortDirection: 'asc'
      };

      if (entityType) {
        options.entityTypes = [entityType];
      }

      return await this.getTimelineEntries(options);
    } catch (error) {
      console.error('Error getting timeline entries for entity:', error);
      throw error;
    }
  }

  /**
   * Calculate time gap between two timeline entries
   * @param fromEntryId First timeline entry ID
   * @param toEntryId Second timeline entry ID
   * @returns Time gap between entries
   */
  async calculateTimeGapBetweenEntries(fromEntryId: string, toEntryId: string): Promise<TimeGap | null> {
    try {
      const fromEntry = await this.getById(fromEntryId);
      const toEntry = await this.getById(toEntryId);

      if (!fromEntry || !toEntry) {
        return null;
      }

      const fromTime = fromEntry.position.inGameTimestamp || fromEntry.dualTimestamp.realWorldTime;
      const toTime = toEntry.position.inGameTimestamp || toEntry.dualTimestamp.realWorldTime;

      if (!fromTime || !toTime) {
        return null;
      }

      return calculateTimeGapBetweenDates(fromTime, toTime);
    } catch (error) {
      console.error('Error calculating time gap between entries:', error);
      return null;
    }
  }

  /**
   * Recalculate and normalize timeline positions
   */
  private async recalculateTimelinePositions(): Promise<void> {
    try {
      const entries = await this.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      const normalizedPositions = normalizeTimelinePositions(entries.map(e => e.position));

      // Update each entry with normalized position
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const normalizedPosition = normalizedPositions[i];

        if (entry.position.sequence !== normalizedPosition.sequence) {
          await this.update(entry.id!, {
            position: normalizedPosition
          } as Partial<TimelineEntry>);
        }
      }
    } catch (error) {
      console.error('Error recalculating timeline positions:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get events related to a specific entity
   * @param entityType Type of entity
   * @param entityId ID of entity
   * @param filter Additional filters
   * @returns Array of timeline entries
   */
  async getEntityEvents(
    entityType: string,
    entityId: string,
    filter: EntityEventFilter = {}
  ): Promise<TimelineEntry[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Add world and campaign filters
      const worldId = filter.worldId || this.worldId;
      const campaignId = filter.campaignId || this.campaignId;

      constraints.push(where('worldId', '==', worldId));
      constraints.push(where('campaignId', '==', campaignId));

      // Add entity filters
      constraints.push(where('associatedEntityType', '==', entityType));
      constraints.push(where('associatedEntityId', '==', entityId));

      // Add session filter if provided
      if (filter.sessionId) {
        constraints.push(where('sessionId', '==', filter.sessionId));
      }

      // Add time frame filters
      if (filter.timeFrame && filter.timeFrame !== 'all-time') {
        const now = new Date();
        let startDate: Date;

        switch (filter.timeFrame) {
          case 'last-week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last-month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last-3-months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'custom':
            startDate = filter.startDate || new Date(0);
            break;
          default:
            startDate = new Date(0);
        }

        constraints.push(where('dualTimestamp.realWorldTime', '>=', startDate));

        if (filter.timeFrame === 'custom' && filter.endDate) {
          constraints.push(where('dualTimestamp.realWorldTime', '<=', filter.endDate));
        }
      }

      // Add sorting
      constraints.push(orderBy('position.sequence', 'asc'));

      const result = await this.query(constraints);
      return result.data;
    } catch (error) {
      console.error('Error getting entity events:', error);
      throw error;
    }
  }

  /**
   * Get events for a campaign with optional entity filtering
   * @param campaignId Campaign ID
   * @param filter Additional filters
   * @returns Array of timeline entries
   */
  async getCampaignEvents(
    campaignId: string,
    filter: EntityEventFilter = {}
  ): Promise<TimelineEntry[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Add world and campaign filters
      const worldId = filter.worldId || this.worldId;

      constraints.push(where('worldId', '==', worldId));
      constraints.push(where('campaignId', '==', campaignId));

      // Add session filter if provided
      if (filter.sessionId) {
        constraints.push(where('sessionId', '==', filter.sessionId));
      }

      // Add time frame filters
      if (filter.timeFrame && filter.timeFrame !== 'all-time') {
        const now = new Date();
        let startDate: Date;

        switch (filter.timeFrame) {
          case 'last-week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last-month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last-3-months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'custom':
            startDate = filter.startDate || new Date(0);
            break;
          default:
            startDate = new Date(0);
        }

        constraints.push(where('dualTimestamp.realWorldTime', '>=', startDate));

        if (filter.timeFrame === 'custom' && filter.endDate) {
          constraints.push(where('dualTimestamp.realWorldTime', '<=', filter.endDate));
        }
      }

      // Add sorting
      constraints.push(orderBy('position.sequence', 'asc'));

      const result = await this.query(constraints);
      return result.data;
    } catch (error) {
      console.error('Error getting campaign events:', error);
      throw error;
    }
  }
}
