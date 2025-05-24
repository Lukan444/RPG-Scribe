/**
 * Timeline Utilities Tests
 * 
 * Comprehensive tests for timeline utility functions including
 * time calculations, conversions, and timeline operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimeUnit } from '../../constants/timelineConstants';
import { TimeGap, TimelinePosition, DualTimestamp } from '../../types/timeline';
import {
  timeGapToMinutes,
  minutesToTimeGap,
  addTimeGapToDate,
  calculateTimeGapBetweenDates,
  validateTimeGap,
  getSuggestedDuration,
  formatTimeGap,
  compareTimelinePositions,
  createDualTimestamp,
  timeGapsOverlap,
  generateTimelineSequence,
  normalizeTimelinePositions
} from '../../utils/timelineUtils';

describe('Time Conversion Functions', () => {
  describe('timeGapToMinutes', () => {
    it('should convert minutes correctly', () => {
      const timeGap: TimeGap = { duration: 30, unit: TimeUnit.MINUTES };
      expect(timeGapToMinutes(timeGap)).toBe(30);
    });

    it('should convert hours correctly', () => {
      const timeGap: TimeGap = { duration: 2, unit: TimeUnit.HOURS };
      expect(timeGapToMinutes(timeGap)).toBe(120);
    });

    it('should convert days correctly', () => {
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.DAYS };
      expect(timeGapToMinutes(timeGap)).toBe(1440); // 24 * 60
    });

    it('should convert weeks correctly', () => {
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.WEEKS };
      expect(timeGapToMinutes(timeGap)).toBe(10080); // 7 * 24 * 60
    });

    it('should convert months correctly', () => {
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.MONTHS };
      expect(timeGapToMinutes(timeGap)).toBe(43200); // 30 * 24 * 60
    });

    it('should convert years correctly', () => {
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.YEARS };
      expect(timeGapToMinutes(timeGap)).toBe(525600); // 365 * 24 * 60
    });

    it('should handle fractional durations', () => {
      const timeGap: TimeGap = { duration: 0.5, unit: TimeUnit.HOURS };
      expect(timeGapToMinutes(timeGap)).toBe(30);
    });

    it('should handle zero duration', () => {
      const timeGap: TimeGap = { duration: 0, unit: TimeUnit.MINUTES };
      expect(timeGapToMinutes(timeGap)).toBe(0);
    });
  });

  describe('minutesToTimeGap', () => {
    it('should convert to minutes for small values', () => {
      const result = minutesToTimeGap(45);
      expect(result.duration).toBe(45);
      expect(result.unit).toBe(TimeUnit.MINUTES);
    });

    it('should convert to hours for hour-divisible values', () => {
      const result = minutesToTimeGap(120);
      expect(result.duration).toBe(2);
      expect(result.unit).toBe(TimeUnit.HOURS);
    });

    it('should convert to days for day-divisible values', () => {
      const result = minutesToTimeGap(1440);
      expect(result.duration).toBe(1);
      expect(result.unit).toBe(TimeUnit.DAYS);
    });

    it('should convert to weeks for week-divisible values', () => {
      const result = minutesToTimeGap(10080);
      expect(result.duration).toBe(1);
      expect(result.unit).toBe(TimeUnit.WEEKS);
    });

    it('should convert to months for month-divisible values', () => {
      const result = minutesToTimeGap(43200);
      expect(result.duration).toBe(1);
      expect(result.unit).toBe(TimeUnit.MONTHS);
    });

    it('should convert to years for year-divisible values', () => {
      const result = minutesToTimeGap(525600);
      expect(result.duration).toBe(1);
      expect(result.unit).toBe(TimeUnit.YEARS);
    });

    it('should prefer larger units when possible', () => {
      const result = minutesToTimeGap(2880); // 2 days
      expect(result.duration).toBe(2);
      expect(result.unit).toBe(TimeUnit.DAYS);
    });

    it('should handle zero minutes', () => {
      const result = minutesToTimeGap(0);
      expect(result.duration).toBe(0);
      expect(result.unit).toBe(TimeUnit.MINUTES);
    });
  });
});

describe('Date Manipulation Functions', () => {
  describe('addTimeGapToDate', () => {
    it('should add minutes correctly', () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const timeGap: TimeGap = { duration: 30, unit: TimeUnit.MINUTES };
      const result = addTimeGapToDate(baseDate, timeGap);
      
      expect(result.getTime()).toBe(baseDate.getTime() + (30 * 60 * 1000));
    });

    it('should add hours correctly', () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const timeGap: TimeGap = { duration: 2, unit: TimeUnit.HOURS };
      const result = addTimeGapToDate(baseDate, timeGap);
      
      expect(result.getTime()).toBe(baseDate.getTime() + (2 * 60 * 60 * 1000));
    });

    it('should add days correctly', () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.DAYS };
      const result = addTimeGapToDate(baseDate, timeGap);
      
      expect(result.getTime()).toBe(baseDate.getTime() + (24 * 60 * 60 * 1000));
    });

    it('should not modify the original date', () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const originalTime = baseDate.getTime();
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.HOURS };
      
      addTimeGapToDate(baseDate, timeGap);
      
      expect(baseDate.getTime()).toBe(originalTime);
    });

    it('should handle zero duration', () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const timeGap: TimeGap = { duration: 0, unit: TimeUnit.MINUTES };
      const result = addTimeGapToDate(baseDate, timeGap);
      
      expect(result.getTime()).toBe(baseDate.getTime());
    });
  });

  describe('calculateTimeGapBetweenDates', () => {
    it('should calculate gap in minutes for short durations', () => {
      const startDate = new Date('2024-01-01T10:00:00Z');
      const endDate = new Date('2024-01-01T10:30:00Z');
      const result = calculateTimeGapBetweenDates(startDate, endDate);
      
      expect(result.duration).toBe(30);
      expect(result.unit).toBe(TimeUnit.MINUTES);
    });

    it('should calculate gap in hours for hour-long durations', () => {
      const startDate = new Date('2024-01-01T10:00:00Z');
      const endDate = new Date('2024-01-01T12:00:00Z');
      const result = calculateTimeGapBetweenDates(startDate, endDate);
      
      expect(result.duration).toBe(2);
      expect(result.unit).toBe(TimeUnit.HOURS);
    });

    it('should calculate gap in days for day-long durations', () => {
      const startDate = new Date('2024-01-01T10:00:00Z');
      const endDate = new Date('2024-01-02T10:00:00Z');
      const result = calculateTimeGapBetweenDates(startDate, endDate);
      
      expect(result.duration).toBe(1);
      expect(result.unit).toBe(TimeUnit.DAYS);
    });

    it('should handle negative time differences (absolute value)', () => {
      const startDate = new Date('2024-01-01T12:00:00Z');
      const endDate = new Date('2024-01-01T10:00:00Z');
      const result = calculateTimeGapBetweenDates(startDate, endDate);
      
      expect(result.duration).toBe(2);
      expect(result.unit).toBe(TimeUnit.HOURS);
    });

    it('should handle same dates', () => {
      const date = new Date('2024-01-01T10:00:00Z');
      const result = calculateTimeGapBetweenDates(date, date);
      
      expect(result.duration).toBe(0);
      expect(result.unit).toBe(TimeUnit.MINUTES);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateTimeGap', () => {
    it('should validate positive durations', () => {
      const timeGap: TimeGap = { duration: 5, unit: TimeUnit.HOURS };
      expect(validateTimeGap(timeGap)).toBe(true);
    });

    it('should reject zero duration', () => {
      const timeGap: TimeGap = { duration: 0, unit: TimeUnit.MINUTES };
      expect(validateTimeGap(timeGap)).toBe(false);
    });

    it('should reject negative duration', () => {
      const timeGap: TimeGap = { duration: -1, unit: TimeUnit.HOURS };
      expect(validateTimeGap(timeGap)).toBe(false);
    });

    it('should reject durations exceeding maximum limits', () => {
      const timeGap: TimeGap = { duration: 2000, unit: TimeUnit.DAYS }; // > 365 days
      expect(validateTimeGap(timeGap)).toBe(false);
    });

    it('should accept durations within maximum limits', () => {
      const timeGap: TimeGap = { duration: 300, unit: TimeUnit.DAYS }; // < 365 days
      expect(validateTimeGap(timeGap)).toBe(true);
    });
  });

  describe('getSuggestedDuration', () => {
    it('should return correct duration for known activities', () => {
      expect(getSuggestedDuration('SHORT_COMBAT')).toBe(5);
      expect(getSuggestedDuration('LONG_REST')).toBe(480);
      expect(getSuggestedDuration('BRIEF_CONVERSATION')).toBe(5);
    });

    it('should return null for unknown activities', () => {
      expect(getSuggestedDuration('UNKNOWN_ACTIVITY' as any)).toBeNull();
    });
  });
});

describe('Formatting Functions', () => {
  describe('formatTimeGap', () => {
    it('should format singular units correctly', () => {
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.HOURS };
      expect(formatTimeGap(timeGap)).toBe('1 hour');
    });

    it('should format plural units correctly', () => {
      const timeGap: TimeGap = { duration: 2, unit: TimeUnit.HOURS };
      expect(formatTimeGap(timeGap)).toBe('2 hours');
    });

    it('should include description when requested', () => {
      const timeGap: TimeGap = { 
        duration: 2, 
        unit: TimeUnit.HOURS, 
        description: 'Travel time' 
      };
      expect(formatTimeGap(timeGap, true)).toBe('2 hours (Travel time)');
    });

    it('should exclude description when not requested', () => {
      const timeGap: TimeGap = { 
        duration: 2, 
        unit: TimeUnit.HOURS, 
        description: 'Travel time' 
      };
      expect(formatTimeGap(timeGap, false)).toBe('2 hours');
    });

    it('should handle minutes correctly', () => {
      const timeGap: TimeGap = { duration: 1, unit: TimeUnit.MINUTES };
      expect(formatTimeGap(timeGap)).toBe('1 minute');
    });
  });
});

describe('Timeline Position Functions', () => {
  describe('compareTimelinePositions', () => {
    it('should compare by sequence number first', () => {
      const pos1: TimelinePosition = { sequence: 1 };
      const pos2: TimelinePosition = { sequence: 2 };
      
      expect(compareTimelinePositions(pos1, pos2)).toBeLessThan(0);
      expect(compareTimelinePositions(pos2, pos1)).toBeGreaterThan(0);
    });

    it('should compare by in-game timestamp when sequences are equal', () => {
      const date1 = new Date('2024-01-01T10:00:00Z');
      const date2 = new Date('2024-01-01T11:00:00Z');
      
      const pos1: TimelinePosition = { sequence: 1, inGameTimestamp: date1 };
      const pos2: TimelinePosition = { sequence: 1, inGameTimestamp: date2 };
      
      expect(compareTimelinePositions(pos1, pos2)).toBeLessThan(0);
    });

    it('should compare by real-world timestamp when in-game timestamps are missing', () => {
      const date1 = new Date('2024-01-01T10:00:00Z');
      const date2 = new Date('2024-01-01T11:00:00Z');
      
      const pos1: TimelinePosition = { sequence: 1, realWorldTimestamp: date1 };
      const pos2: TimelinePosition = { sequence: 1, realWorldTimestamp: date2 };
      
      expect(compareTimelinePositions(pos1, pos2)).toBeLessThan(0);
    });

    it('should return 0 for identical positions', () => {
      const pos1: TimelinePosition = { sequence: 1 };
      const pos2: TimelinePosition = { sequence: 1 };
      
      expect(compareTimelinePositions(pos1, pos2)).toBe(0);
    });
  });

  describe('generateTimelineSequence', () => {
    it('should return 0 for empty array', () => {
      expect(generateTimelineSequence([])).toBe(0);
    });

    it('should return next sequence number', () => {
      const positions: TimelinePosition[] = [
        { sequence: 0 },
        { sequence: 1 },
        { sequence: 2 }
      ];
      expect(generateTimelineSequence(positions)).toBe(3);
    });

    it('should handle non-sequential positions', () => {
      const positions: TimelinePosition[] = [
        { sequence: 0 },
        { sequence: 5 },
        { sequence: 2 }
      ];
      expect(generateTimelineSequence(positions)).toBe(6);
    });
  });

  describe('normalizeTimelinePositions', () => {
    it('should normalize sequential positions', () => {
      const positions: TimelinePosition[] = [
        { sequence: 5, inGameTimestamp: new Date('2024-01-01T10:00:00Z') },
        { sequence: 2, inGameTimestamp: new Date('2024-01-01T09:00:00Z') },
        { sequence: 8, inGameTimestamp: new Date('2024-01-01T11:00:00Z') }
      ];

      const normalized = normalizeTimelinePositions(positions);
      
      expect(normalized[0].sequence).toBe(0);
      expect(normalized[1].sequence).toBe(1);
      expect(normalized[2].sequence).toBe(2);
    });

    it('should maintain chronological order', () => {
      const date1 = new Date('2024-01-01T09:00:00Z');
      const date2 = new Date('2024-01-01T10:00:00Z');
      const date3 = new Date('2024-01-01T11:00:00Z');

      const positions: TimelinePosition[] = [
        { sequence: 10, inGameTimestamp: date2 },
        { sequence: 5, inGameTimestamp: date1 },
        { sequence: 15, inGameTimestamp: date3 }
      ];

      const normalized = normalizeTimelinePositions(positions);
      
      expect(normalized[0].inGameTimestamp).toEqual(date1);
      expect(normalized[1].inGameTimestamp).toEqual(date2);
      expect(normalized[2].inGameTimestamp).toEqual(date3);
    });

    it('should handle empty array', () => {
      const normalized = normalizeTimelinePositions([]);
      expect(normalized).toEqual([]);
    });
  });
});

describe('Utility Functions', () => {
  describe('createDualTimestamp', () => {
    it('should create dual timestamp with provided in-game time', () => {
      const inGameTime = new Date('2024-01-01T10:00:00Z');
      const result = createDualTimestamp(inGameTime);
      
      expect(result.inGameTime).toBe(inGameTime);
      expect(result.realWorldTime).toBeInstanceOf(Date);
    });

    it('should create dual timestamp with null in-game time', () => {
      const result = createDualTimestamp();
      
      expect(result.inGameTime).toBeNull();
      expect(result.realWorldTime).toBeInstanceOf(Date);
    });
  });

  describe('timeGapsOverlap', () => {
    it('should detect overlapping time gaps', () => {
      const gap1: TimeGap = { duration: 60, unit: TimeUnit.MINUTES };
      const gap2: TimeGap = { duration: 1, unit: TimeUnit.HOURS };
      
      expect(timeGapsOverlap(gap1, gap2)).toBe(true);
    });

    it('should detect non-overlapping time gaps', () => {
      const gap1: TimeGap = { duration: 30, unit: TimeUnit.MINUTES };
      const gap2: TimeGap = { duration: 2, unit: TimeUnit.HOURS };
      
      expect(timeGapsOverlap(gap1, gap2)).toBe(false);
    });

    it('should respect tolerance parameter', () => {
      const gap1: TimeGap = { duration: 58, unit: TimeUnit.MINUTES };
      const gap2: TimeGap = { duration: 1, unit: TimeUnit.HOURS };
      
      expect(timeGapsOverlap(gap1, gap2, 5)).toBe(true); // Within 5-minute tolerance
      expect(timeGapsOverlap(gap1, gap2, 1)).toBe(false); // Outside 1-minute tolerance
    });
  });
});
