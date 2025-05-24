/**
 * Timeline Utilities
 * 
 * This file contains utility functions for timeline calculations,
 * conversions, and operations used throughout the Dual Timeline System.
 */

import { 
  TimeUnit, 
  TIME_CONVERSION_TO_MINUTES, 
  DEFAULT_ACTIVITY_DURATIONS,
  MAX_TIME_GAPS 
} from '../constants/timelineConstants';
import { TimeGap, DualTimestamp, TimelinePosition } from '../types/timeline';

/**
 * Convert a time gap to minutes
 * @param timeGap Time gap to convert
 * @returns Duration in minutes
 */
export function timeGapToMinutes(timeGap: TimeGap): number {
  const conversionFactor = TIME_CONVERSION_TO_MINUTES[timeGap.unit];
  return timeGap.duration * conversionFactor;
}

/**
 * Convert minutes to a time gap with the most appropriate unit
 * @param minutes Duration in minutes
 * @returns Time gap with appropriate unit
 */
export function minutesToTimeGap(minutes: number): TimeGap {
  // Find the most appropriate unit (largest unit that results in a reasonable number)
  if (minutes >= TIME_CONVERSION_TO_MINUTES[TimeUnit.YEARS] && minutes % TIME_CONVERSION_TO_MINUTES[TimeUnit.YEARS] === 0) {
    return { duration: minutes / TIME_CONVERSION_TO_MINUTES[TimeUnit.YEARS], unit: TimeUnit.YEARS };
  }
  if (minutes >= TIME_CONVERSION_TO_MINUTES[TimeUnit.MONTHS] && minutes % TIME_CONVERSION_TO_MINUTES[TimeUnit.MONTHS] === 0) {
    return { duration: minutes / TIME_CONVERSION_TO_MINUTES[TimeUnit.MONTHS], unit: TimeUnit.MONTHS };
  }
  if (minutes >= TIME_CONVERSION_TO_MINUTES[TimeUnit.WEEKS] && minutes % TIME_CONVERSION_TO_MINUTES[TimeUnit.WEEKS] === 0) {
    return { duration: minutes / TIME_CONVERSION_TO_MINUTES[TimeUnit.WEEKS], unit: TimeUnit.WEEKS };
  }
  if (minutes >= TIME_CONVERSION_TO_MINUTES[TimeUnit.DAYS] && minutes % TIME_CONVERSION_TO_MINUTES[TimeUnit.DAYS] === 0) {
    return { duration: minutes / TIME_CONVERSION_TO_MINUTES[TimeUnit.DAYS], unit: TimeUnit.DAYS };
  }
  if (minutes >= TIME_CONVERSION_TO_MINUTES[TimeUnit.HOURS] && minutes % TIME_CONVERSION_TO_MINUTES[TimeUnit.HOURS] === 0) {
    return { duration: minutes / TIME_CONVERSION_TO_MINUTES[TimeUnit.HOURS], unit: TimeUnit.HOURS };
  }
  
  return { duration: minutes, unit: TimeUnit.MINUTES };
}

/**
 * Add a time gap to a date
 * @param date Base date
 * @param timeGap Time gap to add
 * @returns New date with time gap added
 */
export function addTimeGapToDate(date: Date, timeGap: TimeGap): Date {
  const minutes = timeGapToMinutes(timeGap);
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
}

/**
 * Calculate the time gap between two dates
 * @param startDate Start date
 * @param endDate End date
 * @returns Time gap between the dates
 */
export function calculateTimeGapBetweenDates(startDate: Date, endDate: Date): TimeGap {
  const diffInMs = endDate.getTime() - startDate.getTime();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));
  return minutesToTimeGap(Math.abs(diffInMinutes));
}

/**
 * Validate a time gap against maximum allowed values
 * @param timeGap Time gap to validate
 * @returns True if valid, false otherwise
 */
export function validateTimeGap(timeGap: TimeGap): boolean {
  const maxAllowed = MAX_TIME_GAPS[timeGap.unit];
  return timeGap.duration > 0 && timeGap.duration <= maxAllowed;
}

/**
 * Get suggested duration for an activity type
 * @param activityType Type of activity (e.g., 'COMBAT_ROUND', 'LONG_REST')
 * @returns Suggested duration in minutes, or null if not found
 */
export function getSuggestedDuration(activityType: keyof typeof DEFAULT_ACTIVITY_DURATIONS): number | null {
  return DEFAULT_ACTIVITY_DURATIONS[activityType] || null;
}

/**
 * Format a time gap for display
 * @param timeGap Time gap to format
 * @param includeDescription Whether to include the description
 * @returns Formatted string
 */
export function formatTimeGap(timeGap: TimeGap, includeDescription: boolean = false): string {
  const unitLabel = timeGap.duration === 1 ? timeGap.unit.slice(0, -1) : timeGap.unit;
  let formatted = `${timeGap.duration} ${unitLabel}`;
  
  if (includeDescription && timeGap.description) {
    formatted += ` (${timeGap.description})`;
  }
  
  return formatted;
}

/**
 * Compare two timeline positions for sorting
 * @param a First timeline position
 * @param b Second timeline position
 * @returns Comparison result (-1, 0, 1)
 */
export function compareTimelinePositions(a: TimelinePosition, b: TimelinePosition): number {
  // First compare by sequence number
  if (a.sequence !== b.sequence) {
    return a.sequence - b.sequence;
  }
  
  // If sequences are equal, compare by in-game timestamp
  if (a.inGameTimestamp && b.inGameTimestamp) {
    return a.inGameTimestamp.getTime() - b.inGameTimestamp.getTime();
  }
  
  // If one has in-game timestamp and other doesn't, prioritize the one with timestamp
  if (a.inGameTimestamp && !b.inGameTimestamp) return -1;
  if (!a.inGameTimestamp && b.inGameTimestamp) return 1;
  
  // If neither has in-game timestamp, compare by real-world timestamp
  if (a.realWorldTimestamp && b.realWorldTimestamp) {
    return a.realWorldTimestamp.getTime() - b.realWorldTimestamp.getTime();
  }
  
  // Default to equal
  return 0;
}

/**
 * Create a dual timestamp with current real-world time
 * @param inGameTime Optional in-game time
 * @returns Dual timestamp
 */
export function createDualTimestamp(inGameTime?: Date): DualTimestamp {
  return {
    inGameTime: inGameTime || null,
    realWorldTime: new Date()
  };
}

/**
 * Check if two time gaps overlap (useful for conflict detection)
 * @param gap1 First time gap
 * @param gap2 Second time gap
 * @param tolerance Tolerance in minutes for overlap detection
 * @returns True if gaps overlap within tolerance
 */
export function timeGapsOverlap(gap1: TimeGap, gap2: TimeGap, tolerance: number = 0): boolean {
  const minutes1 = timeGapToMinutes(gap1);
  const minutes2 = timeGapToMinutes(gap2);
  
  return Math.abs(minutes1 - minutes2) <= tolerance;
}

/**
 * Generate a unique timeline position sequence number
 * @param existingPositions Array of existing timeline positions
 * @returns New unique sequence number
 */
export function generateTimelineSequence(existingPositions: TimelinePosition[]): number {
  if (existingPositions.length === 0) {
    return 0;
  }
  
  const maxSequence = Math.max(...existingPositions.map(pos => pos.sequence));
  return maxSequence + 1;
}

/**
 * Normalize timeline positions to ensure proper sequential ordering
 * @param positions Array of timeline positions to normalize
 * @returns Normalized timeline positions with sequential numbering
 */
export function normalizeTimelinePositions(positions: TimelinePosition[]): TimelinePosition[] {
  // Sort positions by their current sequence and timestamps
  const sorted = [...positions].sort(compareTimelinePositions);
  
  // Reassign sequence numbers to ensure they're sequential
  return sorted.map((position, index) => ({
    ...position,
    sequence: index
  }));
}
