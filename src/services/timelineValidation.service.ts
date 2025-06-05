/**
 * Timeline Validation Service
 * 
 * This service provides comprehensive validation and conflict detection
 * for the Dual Timeline System in RPG Scribe.
 */

import { 
  TimelineConflict,
  TimelineValidationResult,
  TimelineContext
} from '../types/timeline';
import { TimelineEntry } from '../models/Timeline';
import { 
  TimelineConflictType, 
  TimelineValidationSeverity 
} from '../constants/timelineConstants';
import { 
  timeGapToMinutes, 
  calculateTimeGapBetweenDates, 
  validateTimeGap,
  compareTimelinePositions 
} from '../utils/timelineUtils';

/**
 * Timeline Validation Service
 * Provides validation and conflict detection for timeline operations
 */
export class TimelineValidationService {
  private static instance: TimelineValidationService;

  /**
   * Get singleton instance
   */
  public static getInstance(): TimelineValidationService {
    if (!TimelineValidationService.instance) {
      TimelineValidationService.instance = new TimelineValidationService();
    }
    return TimelineValidationService.instance;
  }

  /**
   * Validate a complete timeline
   * @param entries Timeline entries to validate
   * @param context Timeline context for validation
   * @returns Validation result
   */
  async validateTimeline(
    entries: TimelineEntry[], 
    context: TimelineContext
  ): Promise<TimelineValidationResult> {
    const conflicts: TimelineConflict[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Sort entries by timeline position
      const sortedEntries = [...entries].sort((a, b) => 
        compareTimelinePositions(a.position, b.position)
      );

      // Check for various types of conflicts
      conflicts.push(...await this.detectChronologicalConflicts(sortedEntries));
      conflicts.push(...await this.detectOverlappingEvents(sortedEntries));
      conflicts.push(...await this.detectImpossibleTravelTimes(sortedEntries, context));
      conflicts.push(...await this.detectCharacterLocationConflicts(sortedEntries));
      conflicts.push(...await this.detectMissingTimeGaps(sortedEntries));
      conflicts.push(...await this.detectNegativeDurations(sortedEntries));

      // Generate warnings and suggestions
      warnings.push(...this.generateWarnings(sortedEntries));
      suggestions.push(...this.generateSuggestions(sortedEntries, conflicts));

      return {
        isValid: conflicts.filter(c => c.severity === TimelineValidationSeverity.ERROR || 
                                     c.severity === TimelineValidationSeverity.CRITICAL).length === 0,
        conflicts,
        warnings,
        suggestions,
        validatedAt: new Date()
      };
    } catch (error) {
      console.error('Error during timeline validation:', error);
      
      return {
        isValid: false,
        conflicts: [{
          id: `validation_error_${Date.now()}`,
          type: TimelineConflictType.CHRONOLOGICAL_INCONSISTENCY,
          severity: TimelineValidationSeverity.CRITICAL,
          message: 'Timeline validation failed due to an internal error',
          affectedEntityIds: entries.map(e => e.associatedEntityId),
          createdAt: new Date()
        }],
        warnings: ['Timeline validation encountered an error'],
        suggestions: ['Please review the timeline manually for inconsistencies'],
        validatedAt: new Date()
      };
    }
  }

  /**
   * Detect chronological inconsistencies
   */
  private async detectChronologicalConflicts(entries: TimelineEntry[]): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i];
      const next = entries[i + 1];

      // Check if in-game timestamps are in correct order
      if (current.position.inGameTimestamp && next.position.inGameTimestamp) {
        if (current.position.inGameTimestamp > next.position.inGameTimestamp) {
          conflicts.push({
            id: `chronological_${current.id}_${next.id}`,
            type: TimelineConflictType.CHRONOLOGICAL_INCONSISTENCY,
            severity: TimelineValidationSeverity.ERROR,
            message: `Event "${current.title}" occurs after "${next.title}" but has an earlier in-game timestamp`,
            affectedEntityIds: [current.associatedEntityId, next.associatedEntityId],
            suggestedResolution: 'Adjust the timeline positions or in-game timestamps to maintain chronological order',
            autoResolvable: false,
            createdAt: new Date()
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect overlapping events
   */
  private async detectOverlappingEvents(entries: TimelineEntry[]): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i];
        const entry2 = entries[j];

        // Check if events overlap in time
        if (this.eventsOverlap(entry1, entry2)) {
          conflicts.push({
            id: `overlap_${entry1.id}_${entry2.id}`,
            type: TimelineConflictType.OVERLAPPING_EVENTS,
            severity: TimelineValidationSeverity.WARNING,
            message: `Events "${entry1.title}" and "${entry2.title}" appear to overlap in time`,
            affectedEntityIds: [entry1.associatedEntityId, entry2.associatedEntityId],
            suggestedResolution: 'Adjust event durations or timing to prevent overlap',
            autoResolvable: true,
            createdAt: new Date()
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect impossible travel times
   */
  private async detectImpossibleTravelTimes(
    entries: TimelineEntry[], 
    context: TimelineContext
  ): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i];
      const next = entries[i + 1];

      // Check if locations are different and travel time is insufficient
      if (current.locationId && next.locationId && current.locationId !== next.locationId) {
        const timeGap = next.position.timeGapBefore;
        if (timeGap && timeGapToMinutes(timeGap) < 10) { // Minimum 10 minutes for any travel
          conflicts.push({
            id: `travel_time_${current.id}_${next.id}`,
            type: TimelineConflictType.IMPOSSIBLE_TRAVEL_TIME,
            severity: TimelineValidationSeverity.WARNING,
            message: `Insufficient travel time between locations in events "${current.title}" and "${next.title}"`,
            affectedEntityIds: [current.associatedEntityId, next.associatedEntityId],
            suggestedResolution: 'Increase the time gap to allow for realistic travel time',
            autoResolvable: true,
            createdAt: new Date()
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect character location conflicts
   */
  private async detectCharacterLocationConflicts(entries: TimelineEntry[]): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    // Group entries by participants to check for location conflicts
    const participantEntries = new Map<string, TimelineEntry[]>();
    
    entries.forEach(entry => {
      if (entry.participants) {
        entry.participants.forEach((participantId: string) => {
          if (!participantEntries.has(participantId)) {
            participantEntries.set(participantId, []);
          }
          participantEntries.get(participantId)!.push(entry);
        });
      }
    });

    // Check each participant for location conflicts
    participantEntries.forEach((participantEvents, participantId) => {
      const sortedEvents = participantEvents.sort((a, b) => 
        compareTimelinePositions(a.position, b.position)
      );

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];

        if (current.locationId && next.locationId && 
            current.locationId !== next.locationId) {
          // Check if there's enough time for travel
          const timeGap = next.position.timeGapBefore;
          if (!timeGap || timeGapToMinutes(timeGap) < 5) {
            conflicts.push({
              id: `character_location_${participantId}_${current.id}_${next.id}`,
              type: TimelineConflictType.CHARACTER_IN_MULTIPLE_LOCATIONS,
              severity: TimelineValidationSeverity.ERROR,
              message: `Character appears in multiple locations without sufficient travel time`,
              affectedEntityIds: [current.associatedEntityId, next.associatedEntityId],
              suggestedResolution: 'Add travel time or adjust character participation',
              autoResolvable: false,
              createdAt: new Date()
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect missing time gaps
   */
  private async detectMissingTimeGaps(entries: TimelineEntry[]): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      
      if (!entry.position.timeGapBefore) {
        conflicts.push({
          id: `missing_gap_${entry.id}`,
          type: TimelineConflictType.MISSING_TIME_GAP,
          severity: TimelineValidationSeverity.INFO,
          message: `Event "${entry.title}" is missing a time gap specification`,
          affectedEntityIds: [entry.associatedEntityId],
          suggestedResolution: 'Add a time gap to specify how much time passed before this event',
          autoResolvable: true,
          createdAt: new Date()
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect negative durations
   */
  private async detectNegativeDurations(entries: TimelineEntry[]): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    entries.forEach(entry => {
      if (entry.duration && timeGapToMinutes(entry.duration) <= 0) {
        conflicts.push({
          id: `negative_duration_${entry.id}`,
          type: TimelineConflictType.NEGATIVE_TIME_DURATION,
          severity: TimelineValidationSeverity.ERROR,
          message: `Event "${entry.title}" has a negative or zero duration`,
          affectedEntityIds: [entry.associatedEntityId],
          suggestedResolution: 'Set a positive duration for this event',
          autoResolvable: true,
          createdAt: new Date()
        });
      }

      if (entry.position.timeGapBefore && !validateTimeGap(entry.position.timeGapBefore)) {
        conflicts.push({
          id: `invalid_gap_${entry.id}`,
          type: TimelineConflictType.NEGATIVE_TIME_DURATION,
          severity: TimelineValidationSeverity.ERROR,
          message: `Event "${entry.title}" has an invalid time gap`,
          affectedEntityIds: [entry.associatedEntityId],
          suggestedResolution: 'Correct the time gap to use valid values',
          autoResolvable: true,
          createdAt: new Date()
        });
      }
    });

    return conflicts;
  }

  /**
   * Check if two events overlap in time
   */
  private eventsOverlap(entry1: TimelineEntry, entry2: TimelineEntry): boolean {
    // Simple overlap detection - can be enhanced with more sophisticated logic
    if (!entry1.duration || !entry2.duration) return false;
    
    const duration1 = timeGapToMinutes(entry1.duration);
    const duration2 = timeGapToMinutes(entry2.duration);
    
    // If events are very close in sequence and have significant durations, they might overlap
    const sequenceDiff = Math.abs(entry1.position.sequence - entry2.position.sequence);
    return sequenceDiff <= 1 && (duration1 > 30 || duration2 > 30);
  }

  /**
   * Generate warnings for timeline issues
   */
  private generateWarnings(entries: TimelineEntry[]): string[] {
    const warnings: string[] = [];

    // Check for very long time gaps
    entries.forEach(entry => {
      if (entry.position.timeGapBefore) {
        const minutes = timeGapToMinutes(entry.position.timeGapBefore);
        if (minutes > 43200) { // More than 30 days
          warnings.push(`Event "${entry.title}" has a very long time gap (${Math.round(minutes / 1440)} days)`);
        }
      }
    });

    return warnings;
  }

  /**
   * Generate suggestions for timeline improvements
   */
  private generateSuggestions(entries: TimelineEntry[], conflicts: TimelineConflict[]): string[] {
    const suggestions: string[] = [];

    if (conflicts.length === 0) {
      suggestions.push('Timeline appears to be well-structured with no major conflicts');
    } else {
      suggestions.push(`Consider resolving ${conflicts.length} detected conflicts to improve timeline accuracy`);
    }

    return suggestions;
  }
}
