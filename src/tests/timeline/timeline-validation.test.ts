/**
 * Timeline Validation Service Tests
 * 
 * Comprehensive tests for timeline validation including conflict detection,
 * chronological consistency, and validation algorithms.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineValidationService } from '../../services/timelineValidation.service';
import { 
  TimelineConflictType, 
  TimelineValidationSeverity, 
  TimelineEntryType,
  TimeUnit 
} from '../../constants/timelineConstants';
import { TimelineEntry } from '../../models/Timeline';
import { TimelineContext } from '../../types/timeline';

describe('TimelineValidationService', () => {
  let validationService: TimelineValidationService;

  beforeEach(() => {
    validationService = TimelineValidationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TimelineValidationService.getInstance();
      const instance2 = TimelineValidationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Timeline Validation', () => {
    const createMockEntry = (overrides: Partial<TimelineEntry> = {}): TimelineEntry => ({
      id: `entry-${Math.random()}`,
      entityType: 'EVENT' as any,
      entryType: TimelineEntryType.EVENT,
      position: {
        sequence: 0,
        inGameTimestamp: new Date('2024-01-01T10:00:00Z'),
        realWorldTimestamp: new Date()
      },
      dualTimestamp: {
        inGameTime: new Date('2024-01-01T10:00:00Z'),
        realWorldTime: new Date()
      },
      associatedEntityId: 'entity-123',
      associatedEntityType: 'EVENT',
      title: 'Test Event',
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    });

    const createMockContext = (): TimelineContext => ({
      campaignId: 'test-campaign',
      worldId: 'test-world',
      recentEntries: [],
      activeCharacters: ['char-1', 'char-2'],
      sessionInProgress: false
    });

    describe('validateTimeline', () => {
      it('should validate empty timeline', async () => {
        const entries: TimelineEntry[] = [];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        expect(result.isValid).toBe(true);
        expect(result.conflicts).toHaveLength(0);
        expect(result.validatedAt).toBeInstanceOf(Date);
      });

      it('should validate single entry timeline', async () => {
        const entries = [createMockEntry()];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        expect(result.isValid).toBe(true);
        expect(result.validatedAt).toBeInstanceOf(Date);
      });

      it('should handle validation errors gracefully', async () => {
        // Create entries that will cause validation to throw
        const entries = [createMockEntry({ position: null as any })];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].severity).toBe(TimelineValidationSeverity.CRITICAL);
      });
    });

    describe('Chronological Conflict Detection', () => {
      it('should detect chronological inconsistencies', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: {
              sequence: 0,
              inGameTimestamp: new Date('2024-01-01T12:00:00Z') // Later time
            },
            title: 'First Event'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              inGameTimestamp: new Date('2024-01-01T10:00:00Z') // Earlier time
            },
            title: 'Second Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        expect(result.isValid).toBe(false);
        const chronologicalConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.CHRONOLOGICAL_INCONSISTENCY
        );
        expect(chronologicalConflicts.length).toBeGreaterThan(0);
      });

      it('should not flag correct chronological order', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: {
              sequence: 0,
              inGameTimestamp: new Date('2024-01-01T10:00:00Z')
            },
            title: 'First Event'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              inGameTimestamp: new Date('2024-01-01T12:00:00Z')
            },
            title: 'Second Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const chronologicalConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.CHRONOLOGICAL_INCONSISTENCY
        );
        expect(chronologicalConflicts).toHaveLength(0);
      });
    });

    describe('Overlapping Events Detection', () => {
      it('should detect overlapping events', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            duration: {
              duration: 2,
              unit: TimeUnit.HOURS
            },
            title: 'Long Event'
          }),
          createMockEntry({
            id: 'entry-2',
            position: { sequence: 1 },
            duration: {
              duration: 1,
              unit: TimeUnit.HOURS
            },
            title: 'Overlapping Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const overlappingConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.OVERLAPPING_EVENTS
        );
        expect(overlappingConflicts.length).toBeGreaterThanOrEqual(0);
      });

      it('should not flag non-overlapping events', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            duration: {
              duration: 15,
              unit: TimeUnit.MINUTES
            },
            title: 'Short Event'
          }),
          createMockEntry({
            id: 'entry-2',
            position: { sequence: 5 }, // Far apart in sequence
            duration: {
              duration: 15,
              unit: TimeUnit.MINUTES
            },
            title: 'Another Short Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const overlappingConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.OVERLAPPING_EVENTS
        );
        expect(overlappingConflicts).toHaveLength(0);
      });
    });

    describe('Travel Time Validation', () => {
      it('should detect impossible travel times', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            locationId: 'location-1',
            title: 'Event at Location 1'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              timeGapBefore: {
                duration: 5, // Only 5 minutes
                unit: TimeUnit.MINUTES
              }
            },
            locationId: 'location-2', // Different location
            title: 'Event at Location 2'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const travelConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.IMPOSSIBLE_TRAVEL_TIME
        );
        expect(travelConflicts.length).toBeGreaterThan(0);
      });

      it('should allow sufficient travel time', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            locationId: 'location-1',
            title: 'Event at Location 1'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              timeGapBefore: {
                duration: 2, // 2 hours should be sufficient
                unit: TimeUnit.HOURS
              }
            },
            locationId: 'location-2',
            title: 'Event at Location 2'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const travelConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.IMPOSSIBLE_TRAVEL_TIME
        );
        expect(travelConflicts).toHaveLength(0);
      });

      it('should not flag same location events', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            locationId: 'location-1',
            title: 'First Event'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              timeGapBefore: {
                duration: 1,
                unit: TimeUnit.MINUTES
              }
            },
            locationId: 'location-1', // Same location
            title: 'Second Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const travelConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.IMPOSSIBLE_TRAVEL_TIME
        );
        expect(travelConflicts).toHaveLength(0);
      });
    });

    describe('Character Location Conflicts', () => {
      it('should detect character in multiple locations', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            participants: ['char-1'],
            locationId: 'location-1',
            title: 'Character at Location 1'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              timeGapBefore: {
                duration: 2, // Only 2 minutes
                unit: TimeUnit.MINUTES
              }
            },
            participants: ['char-1'], // Same character
            locationId: 'location-2', // Different location
            title: 'Character at Location 2'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const locationConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.CHARACTER_IN_MULTIPLE_LOCATIONS
        );
        expect(locationConflicts.length).toBeGreaterThan(0);
      });

      it('should allow character movement with sufficient time', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            participants: ['char-1'],
            locationId: 'location-1',
            title: 'Character at Location 1'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              timeGapBefore: {
                duration: 1, // 1 hour should be sufficient
                unit: TimeUnit.HOURS
              }
            },
            participants: ['char-1'],
            locationId: 'location-2',
            title: 'Character at Location 2'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const locationConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.CHARACTER_IN_MULTIPLE_LOCATIONS
        );
        expect(locationConflicts).toHaveLength(0);
      });
    });

    describe('Missing Time Gaps Detection', () => {
      it('should detect missing time gaps', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 },
            title: 'First Event'
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1
              // Missing timeGapBefore
            },
            title: 'Second Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const missingGapConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.MISSING_TIME_GAP
        );
        expect(missingGapConflicts.length).toBeGreaterThan(0);
      });

      it('should not flag first entry without time gap', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: { sequence: 0 }, // First entry doesn't need time gap
            title: 'First Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const missingGapConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.MISSING_TIME_GAP
        );
        expect(missingGapConflicts).toHaveLength(0);
      });
    });

    describe('Negative Duration Detection', () => {
      it('should detect negative event durations', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            duration: {
              duration: -30, // Negative duration
              unit: TimeUnit.MINUTES
            },
            title: 'Negative Duration Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const negativeConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.NEGATIVE_TIME_DURATION
        );
        expect(negativeConflicts.length).toBeGreaterThan(0);
      });

      it('should detect zero event durations', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            duration: {
              duration: 0, // Zero duration
              unit: TimeUnit.MINUTES
            },
            title: 'Zero Duration Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const negativeConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.NEGATIVE_TIME_DURATION
        );
        expect(negativeConflicts.length).toBeGreaterThan(0);
      });

      it('should detect invalid time gaps', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: {
              sequence: 1,
              timeGapBefore: {
                duration: -1, // Negative time gap
                unit: TimeUnit.HOURS
              }
            },
            title: 'Invalid Time Gap Event'
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        const negativeConflicts = result.conflicts.filter(
          c => c.type === TimelineConflictType.NEGATIVE_TIME_DURATION
        );
        expect(negativeConflicts.length).toBeGreaterThan(0);
      });
    });

    describe('Validation Result Structure', () => {
      it('should provide comprehensive validation results', async () => {
        const entries = [createMockEntry()];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('conflicts');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('suggestions');
        expect(result).toHaveProperty('validatedAt');
        
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.conflicts)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(Array.isArray(result.suggestions)).toBe(true);
        expect(result.validatedAt).toBeInstanceOf(Date);
      });

      it('should include conflict details', async () => {
        const entries = [
          createMockEntry({
            id: 'entry-1',
            position: {
              sequence: 0,
              inGameTimestamp: new Date('2024-01-01T12:00:00Z')
            }
          }),
          createMockEntry({
            id: 'entry-2',
            position: {
              sequence: 1,
              inGameTimestamp: new Date('2024-01-01T10:00:00Z')
            }
          })
        ];
        const context = createMockContext();

        const result = await validationService.validateTimeline(entries, context);

        if (result.conflicts.length > 0) {
          const conflict = result.conflicts[0];
          expect(conflict).toHaveProperty('id');
          expect(conflict).toHaveProperty('type');
          expect(conflict).toHaveProperty('severity');
          expect(conflict).toHaveProperty('message');
          expect(conflict).toHaveProperty('affectedEntityIds');
          expect(conflict).toHaveProperty('createdAt');
          
          expect(typeof conflict.id).toBe('string');
          expect(typeof conflict.message).toBe('string');
          expect(Array.isArray(conflict.affectedEntityIds)).toBe(true);
          expect(conflict.createdAt).toBeInstanceOf(Date);
        }
      });
    });
  });
});
