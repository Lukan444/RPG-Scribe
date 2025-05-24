/**
 * TimelineService Tests
 * 
 * Comprehensive tests for the TimelineService including CRUD operations,
 * chronological ordering, timeline calculations, and statistics.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupFirestoreMocks, createMockDatabase } from '../utils/firestore-test-utils-vitest';
import { TimelineService } from '../../services/timeline.service';
import { TimelineValidationService } from '../../services/timelineValidation.service';
import { TimelineEntryType, TimeUnit } from '../../constants/timelineConstants';
import { TimelineEntryCreationParams, TimelineEntryUpdateParams } from '../../models/Timeline';
import { TimelineQueryOptions, TimeGap } from '../../types/timeline';

// Mock the validation service
vi.mock('../../services/timelineValidation.service');

describe('TimelineService', () => {
  let timelineService: TimelineService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock database with test data
    mockDb = createMockDatabase('test-user-id');
    setupFirestoreMocks(mockDb);
    
    // Initialize timeline service
    timelineService = new TimelineService('test-world-id', 'test-campaign-id');
    
    // Mock validation service
    const mockValidationService = {
      validateTimeline: vi.fn().mockResolvedValue({
        isValid: true,
        conflicts: [],
        warnings: [],
        suggestions: [],
        validatedAt: new Date()
      })
    };
    
    vi.mocked(TimelineValidationService.getInstance).mockReturnValue(mockValidationService as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Timeline Entry CRUD Operations', () => {
    describe('createTimelineEntry', () => {
      it('should create a timeline entry with valid parameters', async () => {
        const params: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-123',
          associatedEntityType: 'EVENT',
          title: 'Test Event',
          position: {
            sequence: 0,
            timeGapBefore: {
              duration: 1,
              unit: TimeUnit.HOURS
            }
          },
          duration: {
            duration: 30,
            unit: TimeUnit.MINUTES
          },
          participants: ['char-1', 'char-2'],
          locationId: 'location-1',
          importance: 7
        };

        const entryId = await timelineService.createTimelineEntry(params);
        
        expect(entryId).toBeTruthy();
        expect(typeof entryId).toBe('string');
      });

      it('should auto-generate sequence number when not provided', async () => {
        const params: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.SESSION,
          associatedEntityId: 'session-456',
          associatedEntityType: 'SESSION',
          title: 'Test Session'
        };

        const entryId = await timelineService.createTimelineEntry(params);
        expect(entryId).toBeTruthy();
      });

      it('should create dual timestamp automatically', async () => {
        const params: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-789',
          associatedEntityType: 'EVENT',
          title: 'Auto Timestamp Event'
        };

        const entryId = await timelineService.createTimelineEntry(params);
        expect(entryId).toBeTruthy();
      });

      it('should handle creation with minimal parameters', async () => {
        const params: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.MILESTONE,
          associatedEntityId: 'milestone-1',
          associatedEntityType: 'STORY_ARC',
          title: 'Campaign Milestone'
        };

        const entryId = await timelineService.createTimelineEntry(params);
        expect(entryId).toBeTruthy();
      });
    });

    describe('updateTimelineEntry', () => {
      it('should update timeline entry with valid parameters', async () => {
        // First create an entry
        const createParams: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-update-test',
          associatedEntityType: 'EVENT',
          title: 'Original Title'
        };

        const entryId = await timelineService.createTimelineEntry(createParams);

        // Then update it
        const updateParams: TimelineEntryUpdateParams = {
          title: 'Updated Title',
          position: {
            sequence: 5,
            timeGapBefore: {
              duration: 2,
              unit: TimeUnit.HOURS
            }
          },
          validationStatus: 'warning'
        };

        const success = await timelineService.updateTimelineEntry(entryId, updateParams);
        expect(success).toBe(true);
      });

      it('should handle partial updates', async () => {
        const createParams: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-partial-update',
          associatedEntityType: 'EVENT',
          title: 'Partial Update Test'
        };

        const entryId = await timelineService.createTimelineEntry(createParams);

        const updateParams: TimelineEntryUpdateParams = {
          title: 'Only Title Updated'
        };

        const success = await timelineService.updateTimelineEntry(entryId, updateParams);
        expect(success).toBe(true);
      });

      it('should return false for non-existent entry', async () => {
        const updateParams: TimelineEntryUpdateParams = {
          title: 'Non-existent Entry'
        };

        const success = await timelineService.updateTimelineEntry('non-existent-id', updateParams);
        expect(success).toBe(false);
      });
    });

    describe('getTimelineEntries', () => {
      beforeEach(async () => {
        // Create test entries
        const entries = [
          {
            entryType: TimelineEntryType.EVENT,
            associatedEntityId: 'event-1',
            associatedEntityType: 'EVENT',
            title: 'First Event',
            position: { sequence: 0 }
          },
          {
            entryType: TimelineEntryType.SESSION,
            associatedEntityId: 'session-1',
            associatedEntityType: 'SESSION',
            title: 'First Session',
            position: { sequence: 1 }
          },
          {
            entryType: TimelineEntryType.EVENT,
            associatedEntityId: 'event-2',
            associatedEntityType: 'EVENT',
            title: 'Second Event',
            position: { sequence: 2 }
          }
        ];

        for (const entry of entries) {
          await timelineService.createTimelineEntry(entry);
        }
      });

      it('should retrieve all timeline entries', async () => {
        const entries = await timelineService.getTimelineEntries();
        expect(entries.length).toBeGreaterThanOrEqual(3);
      });

      it('should filter by entity type', async () => {
        const options: TimelineQueryOptions = {
          entityTypes: ['EVENT']
        };

        const entries = await timelineService.getTimelineEntries(options);
        entries.forEach(entry => {
          expect(entry.associatedEntityType).toBe('EVENT');
        });
      });

      it('should filter by entry type', async () => {
        const options: TimelineQueryOptions = {
          entryTypes: [TimelineEntryType.SESSION]
        };

        const entries = await timelineService.getTimelineEntries(options);
        entries.forEach(entry => {
          expect(entry.entryType).toBe(TimelineEntryType.SESSION);
        });
      });

      it('should sort by sequence', async () => {
        const options: TimelineQueryOptions = {
          sortBy: 'sequence',
          sortDirection: 'asc'
        };

        const entries = await timelineService.getTimelineEntries(options);
        
        for (let i = 1; i < entries.length; i++) {
          expect(entries[i].position.sequence).toBeGreaterThanOrEqual(entries[i - 1].position.sequence);
        }
      });

      it('should limit results', async () => {
        const options: TimelineQueryOptions = {
          limit: 2
        };

        const entries = await timelineService.getTimelineEntries(options);
        expect(entries.length).toBeLessThanOrEqual(2);
      });

      it('should filter by date range', async () => {
        const startDate = new Date('2024-01-01T00:00:00Z');
        const endDate = new Date('2024-12-31T23:59:59Z');

        const options: TimelineQueryOptions = {
          startDate,
          endDate
        };

        const entries = await timelineService.getTimelineEntries(options);
        expect(Array.isArray(entries)).toBe(true);
      });
    });
  });

  describe('Timeline Position Management', () => {
    describe('insertTimelineEntryAt', () => {
      it('should insert entry at specific position', async () => {
        // Create initial entries
        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-before',
          associatedEntityType: 'EVENT',
          title: 'Before Event',
          position: { sequence: 0 }
        });

        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-after',
          associatedEntityType: 'EVENT',
          title: 'After Event',
          position: { sequence: 1 }
        });

        // Insert between them
        const insertParams: TimelineEntryCreationParams = {
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'event-middle',
          associatedEntityType: 'EVENT',
          title: 'Middle Event'
        };

        const entryId = await timelineService.insertTimelineEntryAt(insertParams, 0);
        expect(entryId).toBeTruthy();
      });
    });

    describe('moveTimelineEntry', () => {
      it('should move entry to new position', async () => {
        const entryId = await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'moveable-event',
          associatedEntityType: 'EVENT',
          title: 'Moveable Event',
          position: { sequence: 0 }
        });

        const success = await timelineService.moveTimelineEntry(entryId, 5);
        expect(success).toBe(true);
      });

      it('should handle moving to same position', async () => {
        const entryId = await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'same-position-event',
          associatedEntityType: 'EVENT',
          title: 'Same Position Event',
          position: { sequence: 3 }
        });

        const success = await timelineService.moveTimelineEntry(entryId, 3);
        expect(success).toBe(true);
      });

      it('should return false for non-existent entry', async () => {
        const success = await timelineService.moveTimelineEntry('non-existent-id', 1);
        expect(success).toBe(false);
      });
    });

    describe('deleteTimelineEntry', () => {
      it('should delete entry and reorder remaining entries', async () => {
        const entryId = await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'deletable-event',
          associatedEntityType: 'EVENT',
          title: 'Deletable Event'
        });

        const success = await timelineService.deleteTimelineEntry(entryId);
        expect(success).toBe(true);
      });

      it('should return false for non-existent entry', async () => {
        const success = await timelineService.deleteTimelineEntry('non-existent-id');
        expect(success).toBe(false);
      });
    });
  });

  describe('Timeline Calculations', () => {
    describe('calculateInGameTimestamps', () => {
      it('should calculate timestamps from base time', async () => {
        // Create entries with time gaps
        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'calc-event-1',
          associatedEntityType: 'EVENT',
          title: 'First Calc Event',
          position: {
            sequence: 0,
            timeGapBefore: {
              duration: 1,
              unit: TimeUnit.HOURS
            }
          }
        });

        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'calc-event-2',
          associatedEntityType: 'EVENT',
          title: 'Second Calc Event',
          position: {
            sequence: 1,
            timeGapBefore: {
              duration: 30,
              unit: TimeUnit.MINUTES
            }
          }
        });

        const baseTime = new Date('2024-01-01T10:00:00Z');
        const updatedEntries = await timelineService.calculateInGameTimestamps(baseTime);
        
        expect(updatedEntries.length).toBeGreaterThanOrEqual(2);
        updatedEntries.forEach(entry => {
          expect(entry.position.inGameTimestamp).toBeInstanceOf(Date);
        });
      });
    });

    describe('calculateTimeGapBetweenEntries', () => {
      it('should calculate time gap between two entries', async () => {
        const entry1Id = await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'gap-event-1',
          associatedEntityType: 'EVENT',
          title: 'Gap Event 1',
          position: {
            sequence: 0,
            inGameTimestamp: new Date('2024-01-01T10:00:00Z')
          }
        });

        const entry2Id = await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'gap-event-2',
          associatedEntityType: 'EVENT',
          title: 'Gap Event 2',
          position: {
            sequence: 1,
            inGameTimestamp: new Date('2024-01-01T12:00:00Z')
          }
        });

        const timeGap = await timelineService.calculateTimeGapBetweenEntries(entry1Id, entry2Id);
        
        expect(timeGap).toBeTruthy();
        if (timeGap) {
          expect(timeGap.duration).toBe(2);
          expect(timeGap.unit).toBe(TimeUnit.HOURS);
        }
      });

      it('should return null for non-existent entries', async () => {
        const timeGap = await timelineService.calculateTimeGapBetweenEntries('non-existent-1', 'non-existent-2');
        expect(timeGap).toBeNull();
      });
    });
  });

  describe('Timeline Statistics', () => {
    describe('getTimelineStatistics', () => {
      beforeEach(async () => {
        // Create test entries with durations
        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'stats-event-1',
          associatedEntityType: 'EVENT',
          title: 'Stats Event 1',
          duration: {
            duration: 30,
            unit: TimeUnit.MINUTES
          }
        });

        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.SESSION,
          associatedEntityId: 'stats-session-1',
          associatedEntityType: 'SESSION',
          title: 'Stats Session 1',
          duration: {
            duration: 4,
            unit: TimeUnit.HOURS
          }
        });
      });

      it('should calculate timeline statistics', async () => {
        const stats = await timelineService.getTimelineStatistics();
        
        expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
        expect(stats.totalDuration).toBeTruthy();
        expect(stats.averageSessionDuration).toBeTruthy();
        expect(stats.entryTypeBreakdown).toBeTruthy();
        expect(stats.entityTypeBreakdown).toBeTruthy();
        expect(typeof stats.conflictCount).toBe('number');
      });

      it('should handle empty timeline', async () => {
        // Create a new service instance with no data
        const emptyService = new TimelineService('empty-world', 'empty-campaign');
        const stats = await emptyService.getTimelineStatistics();
        
        expect(stats.totalEntries).toBe(0);
        expect(stats.totalDuration.duration).toBe(0);
        expect(stats.averageSessionDuration.duration).toBe(0);
      });
    });
  });

  describe('Timeline Validation Integration', () => {
    describe('validateTimeline', () => {
      it('should validate timeline using validation service', async () => {
        const result = await timelineService.validateTimeline();
        
        expect(result).toBeTruthy();
        expect(result.isValid).toBe(true);
        expect(Array.isArray(result.conflicts)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(Array.isArray(result.suggestions)).toBe(true);
        expect(result.validatedAt).toBeInstanceOf(Date);
      });

      it('should pass context to validation service', async () => {
        const context = {
          campaignId: 'test-campaign',
          worldId: 'test-world',
          recentEntries: [],
          activeCharacters: ['char-1', 'char-2'],
          sessionInProgress: true
        };

        const result = await timelineService.validateTimeline(context);
        expect(result).toBeTruthy();
      });
    });
  });

  describe('Entity-Specific Queries', () => {
    describe('getTimelineEntriesForEntity', () => {
      beforeEach(async () => {
        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'target-entity',
          associatedEntityType: 'CHARACTER',
          title: 'Target Entity Event'
        });

        await timelineService.createTimelineEntry({
          entryType: TimelineEntryType.EVENT,
          associatedEntityId: 'other-entity',
          associatedEntityType: 'CHARACTER',
          title: 'Other Entity Event'
        });
      });

      it('should retrieve entries for specific entity', async () => {
        const entries = await timelineService.getTimelineEntriesForEntity('target-entity');
        
        entries.forEach(entry => {
          expect(entry.associatedEntityId).toBe('target-entity');
        });
      });

      it('should filter by entity type when provided', async () => {
        const entries = await timelineService.getTimelineEntriesForEntity('target-entity', 'CHARACTER');
        
        entries.forEach(entry => {
          expect(entry.associatedEntityId).toBe('target-entity');
          expect(entry.associatedEntityType).toBe('CHARACTER');
        });
      });
    });
  });
});
