/**
 * Timeline Models and Types Tests
 * 
 * Comprehensive tests for timeline models, types, and interfaces
 * to validate the foundation of the Dual Timeline System.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TimeUnit, 
  TimelineConflictType, 
  TimelineValidationSeverity, 
  TimelineEntryType,
  DEFAULT_ACTIVITY_DURATIONS,
  TIME_CONVERSION_TO_MINUTES,
  MAX_TIME_GAPS
} from '../../constants/timelineConstants';
import { 
  DualTimestamp, 
  TimeGap, 
  TimelinePosition, 
  TimelineConflict, 
  TimelineValidationResult,
  TimelineEntry as ITimelineEntry,
  TimelineAISuggestion,
  TimelineContext,
  TimelineQueryOptions,
  TimelineStatistics
} from '../../types/timeline';
import { 
  TimelineEntry, 
  TimelineEntryCreationParams, 
  TimelineEntryUpdateParams 
} from '../../models/Timeline';

describe('Timeline Constants', () => {
  describe('TimeUnit enum', () => {
    it('should have all required time units', () => {
      expect(TimeUnit.MINUTES).toBe('minutes');
      expect(TimeUnit.HOURS).toBe('hours');
      expect(TimeUnit.DAYS).toBe('days');
      expect(TimeUnit.WEEKS).toBe('weeks');
      expect(TimeUnit.MONTHS).toBe('months');
      expect(TimeUnit.YEARS).toBe('years');
    });

    it('should have consistent enum values', () => {
      const units = Object.values(TimeUnit);
      expect(units).toHaveLength(6);
      expect(units.every(unit => typeof unit === 'string')).toBe(true);
    });
  });

  describe('TimelineConflictType enum', () => {
    it('should have all required conflict types', () => {
      expect(TimelineConflictType.OVERLAPPING_EVENTS).toBe('overlapping_events');
      expect(TimelineConflictType.IMPOSSIBLE_TRAVEL_TIME).toBe('impossible_travel_time');
      expect(TimelineConflictType.CHARACTER_IN_MULTIPLE_LOCATIONS).toBe('character_in_multiple_locations');
      expect(TimelineConflictType.CHRONOLOGICAL_INCONSISTENCY).toBe('chronological_inconsistency');
      expect(TimelineConflictType.MISSING_TIME_GAP).toBe('missing_time_gap');
      expect(TimelineConflictType.NEGATIVE_TIME_DURATION).toBe('negative_time_duration');
    });
  });

  describe('TimelineValidationSeverity enum', () => {
    it('should have all severity levels', () => {
      expect(TimelineValidationSeverity.INFO).toBe('info');
      expect(TimelineValidationSeverity.WARNING).toBe('warning');
      expect(TimelineValidationSeverity.ERROR).toBe('error');
      expect(TimelineValidationSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('DEFAULT_ACTIVITY_DURATIONS', () => {
    it('should have realistic duration values', () => {
      expect(DEFAULT_ACTIVITY_DURATIONS.COMBAT_ROUND).toBe(6);
      expect(DEFAULT_ACTIVITY_DURATIONS.SHORT_COMBAT).toBe(5);
      expect(DEFAULT_ACTIVITY_DURATIONS.LONG_REST).toBe(480); // 8 hours
      expect(DEFAULT_ACTIVITY_DURATIONS.WALKING_PER_MILE).toBe(20);
    });

    it('should have all required activity types', () => {
      const requiredActivities = [
        'COMBAT_ROUND', 'SHORT_COMBAT', 'MEDIUM_COMBAT', 'LONG_COMBAT',
        'BRIEF_CONVERSATION', 'NORMAL_CONVERSATION', 'LONG_CONVERSATION',
        'SHORT_REST', 'LONG_REST', 'EXTENDED_REST',
        'WALKING_PER_MILE', 'RIDING_PER_MILE', 'FLYING_PER_MILE'
      ];

      requiredActivities.forEach(activity => {
        expect(DEFAULT_ACTIVITY_DURATIONS).toHaveProperty(activity);
        expect(typeof DEFAULT_ACTIVITY_DURATIONS[activity as keyof typeof DEFAULT_ACTIVITY_DURATIONS]).toBe('number');
      });
    });
  });

  describe('TIME_CONVERSION_TO_MINUTES', () => {
    it('should have correct conversion factors', () => {
      expect(TIME_CONVERSION_TO_MINUTES[TimeUnit.MINUTES]).toBe(1);
      expect(TIME_CONVERSION_TO_MINUTES[TimeUnit.HOURS]).toBe(60);
      expect(TIME_CONVERSION_TO_MINUTES[TimeUnit.DAYS]).toBe(1440); // 24 * 60
      expect(TIME_CONVERSION_TO_MINUTES[TimeUnit.WEEKS]).toBe(10080); // 7 * 24 * 60
      expect(TIME_CONVERSION_TO_MINUTES[TimeUnit.MONTHS]).toBe(43200); // 30 * 24 * 60
      expect(TIME_CONVERSION_TO_MINUTES[TimeUnit.YEARS]).toBe(525600); // 365 * 24 * 60
    });

    it('should have all time units represented', () => {
      Object.values(TimeUnit).forEach(unit => {
        expect(TIME_CONVERSION_TO_MINUTES).toHaveProperty(unit);
        expect(TIME_CONVERSION_TO_MINUTES[unit]).toBeGreaterThan(0);
      });
    });
  });

  describe('MAX_TIME_GAPS', () => {
    it('should have reasonable maximum values', () => {
      expect(MAX_TIME_GAPS[TimeUnit.MINUTES]).toBe(1440); // Max 24 hours
      expect(MAX_TIME_GAPS[TimeUnit.HOURS]).toBe(168); // Max 1 week
      expect(MAX_TIME_GAPS[TimeUnit.DAYS]).toBe(365); // Max 1 year
      expect(MAX_TIME_GAPS[TimeUnit.YEARS]).toBe(100); // Max 100 years
    });

    it('should prevent unrealistic time gaps', () => {
      Object.values(TimeUnit).forEach(unit => {
        expect(MAX_TIME_GAPS[unit]).toBeGreaterThan(0);
        expect(MAX_TIME_GAPS[unit]).toBeLessThan(1000000); // Reasonable upper bound
      });
    });
  });
});

describe('Timeline Types', () => {
  describe('DualTimestamp interface', () => {
    it('should accept valid dual timestamp data', () => {
      const now = new Date();
      const inGameTime = new Date('2024-01-01T10:00:00Z');
      
      const dualTimestamp: DualTimestamp = {
        inGameTime,
        realWorldTime: now
      };

      expect(dualTimestamp.inGameTime).toBe(inGameTime);
      expect(dualTimestamp.realWorldTime).toBe(now);
    });

    it('should allow null values', () => {
      const dualTimestamp: DualTimestamp = {
        inGameTime: null,
        realWorldTime: null
      };

      expect(dualTimestamp.inGameTime).toBeNull();
      expect(dualTimestamp.realWorldTime).toBeNull();
    });

    it('should allow partial data', () => {
      const dualTimestamp: DualTimestamp = {
        inGameTime: new Date(),
        realWorldTime: undefined
      };

      expect(dualTimestamp.inGameTime).toBeInstanceOf(Date);
      expect(dualTimestamp.realWorldTime).toBeUndefined();
    });
  });

  describe('TimeGap interface', () => {
    it('should accept valid time gap data', () => {
      const timeGap: TimeGap = {
        duration: 2,
        unit: TimeUnit.HOURS,
        description: 'Travel time between cities',
        isAutoCalculated: false
      };

      expect(timeGap.duration).toBe(2);
      expect(timeGap.unit).toBe(TimeUnit.HOURS);
      expect(timeGap.description).toBe('Travel time between cities');
      expect(timeGap.isAutoCalculated).toBe(false);
    });

    it('should require duration and unit', () => {
      const timeGap: TimeGap = {
        duration: 30,
        unit: TimeUnit.MINUTES
      };

      expect(timeGap.duration).toBe(30);
      expect(timeGap.unit).toBe(TimeUnit.MINUTES);
    });

    it('should accept all time units', () => {
      Object.values(TimeUnit).forEach(unit => {
        const timeGap: TimeGap = {
          duration: 1,
          unit
        };
        expect(timeGap.unit).toBe(unit);
      });
    });
  });

  describe('TimelinePosition interface', () => {
    it('should accept valid timeline position data', () => {
      const position: TimelinePosition = {
        sequence: 5,
        inGameTimestamp: new Date('2024-01-01T10:00:00Z'),
        realWorldTimestamp: new Date(),
        timeGapBefore: {
          duration: 1,
          unit: TimeUnit.HOURS
        },
        timeGapAfter: {
          duration: 30,
          unit: TimeUnit.MINUTES
        }
      };

      expect(position.sequence).toBe(5);
      expect(position.inGameTimestamp).toBeInstanceOf(Date);
      expect(position.realWorldTimestamp).toBeInstanceOf(Date);
      expect(position.timeGapBefore?.duration).toBe(1);
      expect(position.timeGapAfter?.duration).toBe(30);
    });

    it('should require sequence number', () => {
      const position: TimelinePosition = {
        sequence: 0
      };

      expect(position.sequence).toBe(0);
    });
  });

  describe('TimelineConflict interface', () => {
    it('should accept valid conflict data', () => {
      const conflict: TimelineConflict = {
        id: 'conflict-123',
        type: TimelineConflictType.OVERLAPPING_EVENTS,
        severity: TimelineValidationSeverity.WARNING,
        message: 'Events overlap in time',
        affectedEntityIds: ['entity-1', 'entity-2'],
        suggestedResolution: 'Adjust event timing',
        autoResolvable: true,
        createdAt: new Date()
      };

      expect(conflict.id).toBe('conflict-123');
      expect(conflict.type).toBe(TimelineConflictType.OVERLAPPING_EVENTS);
      expect(conflict.severity).toBe(TimelineValidationSeverity.WARNING);
      expect(conflict.affectedEntityIds).toHaveLength(2);
      expect(conflict.autoResolvable).toBe(true);
    });

    it('should require essential fields', () => {
      const conflict: TimelineConflict = {
        id: 'test-conflict',
        type: TimelineConflictType.CHRONOLOGICAL_INCONSISTENCY,
        severity: TimelineValidationSeverity.ERROR,
        message: 'Timeline inconsistency detected',
        affectedEntityIds: ['entity-1'],
        createdAt: new Date()
      };

      expect(conflict.id).toBeTruthy();
      expect(conflict.type).toBeTruthy();
      expect(conflict.severity).toBeTruthy();
      expect(conflict.message).toBeTruthy();
      expect(conflict.affectedEntityIds).toBeTruthy();
      expect(conflict.createdAt).toBeInstanceOf(Date);
    });
  });
});

describe('Timeline Models', () => {
  describe('TimelineEntry interface', () => {
    it('should extend BaseEntity correctly', () => {
      const entry: TimelineEntry = {
        entityType: 'EVENT' as any,
        entryType: TimelineEntryType.EVENT,
        position: {
          sequence: 1,
          inGameTimestamp: new Date(),
          realWorldTimestamp: new Date()
        },
        dualTimestamp: {
          inGameTime: new Date(),
          realWorldTime: new Date()
        },
        associatedEntityId: 'entity-123',
        associatedEntityType: 'CHARACTER',
        title: 'Test Timeline Entry',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(entry.entityType).toBe('EVENT');
      expect(entry.entryType).toBe(TimelineEntryType.EVENT);
      expect(entry.position.sequence).toBe(1);
      expect(entry.associatedEntityId).toBe('entity-123');
      expect(entry.title).toBe('Test Timeline Entry');
    });

    it('should support optional fields', () => {
      const entry: TimelineEntry = {
        entityType: 'EVENT' as any,
        entryType: TimelineEntryType.SESSION,
        position: { sequence: 0 },
        dualTimestamp: {},
        associatedEntityId: 'session-456',
        associatedEntityType: 'SESSION',
        title: 'Session Entry',
        duration: {
          duration: 4,
          unit: TimeUnit.HOURS
        },
        participants: ['char-1', 'char-2'],
        locationId: 'location-789',
        isSecret: true,
        importance: 8,
        createdBy: 'gm-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(entry.duration?.duration).toBe(4);
      expect(entry.participants).toHaveLength(2);
      expect(entry.locationId).toBe('location-789');
      expect(entry.isSecret).toBe(true);
      expect(entry.importance).toBe(8);
    });
  });

  describe('TimelineEntryCreationParams interface', () => {
    it('should accept valid creation parameters', () => {
      const params: TimelineEntryCreationParams = {
        entryType: TimelineEntryType.EVENT,
        associatedEntityId: 'event-123',
        associatedEntityType: 'EVENT',
        title: 'New Timeline Entry',
        position: {
          sequence: 5,
          timeGapBefore: {
            duration: 2,
            unit: TimeUnit.HOURS
          }
        },
        duration: {
          duration: 30,
          unit: TimeUnit.MINUTES
        },
        participants: ['char-1'],
        locationId: 'location-1',
        importance: 7
      };

      expect(params.entryType).toBe(TimelineEntryType.EVENT);
      expect(params.title).toBe('New Timeline Entry');
      expect(params.position?.sequence).toBe(5);
      expect(params.duration?.duration).toBe(30);
      expect(params.importance).toBe(7);
    });
  });

  describe('TimelineEntryUpdateParams interface', () => {
    it('should accept valid update parameters', () => {
      const params: TimelineEntryUpdateParams = {
        title: 'Updated Timeline Entry',
        position: {
          sequence: 10,
          timeGapBefore: {
            duration: 1,
            unit: TimeUnit.HOURS
          }
        },
        validationStatus: 'valid'
      };

      expect(params.title).toBe('Updated Timeline Entry');
      expect(params.position?.sequence).toBe(10);
      expect(params.validationStatus).toBe('valid');
    });
  });
});
