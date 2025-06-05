/**
 * Timeline Conflict Detection Service
 * Advanced conflict detection algorithms for timeline events
 */

import { TimelineEventData } from './timelineDataIntegration.service';

export interface TimelineConflict {
  id: string;
  type: 'overlap' | 'logical' | 'temporal' | 'character' | 'location';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  events: string[]; // Event IDs involved in the conflict
  suggestions: string[];
  autoResolvable: boolean;
  metadata?: Record<string, any>;
}

export interface ConflictDetectionOptions {
  /** Check for temporal overlaps */
  checkOverlaps?: boolean;
  /** Check for logical inconsistencies */
  checkLogical?: boolean;
  /** Check for character conflicts */
  checkCharacters?: boolean;
  /** Check for location conflicts */
  checkLocations?: boolean;
  /** Minimum time gap to consider as overlap (in minutes) */
  overlapThreshold?: number;
  /** Include low severity conflicts */
  includeLowSeverity?: boolean;
  /** Only check real-world timeline conflicts (sessions/campaigns) */
  realWorldConflictsOnly?: boolean;
  /** Enable hierarchical timeline logic - separate real-world from in-game */
  enableHierarchicalDetection?: boolean;
}

/**
 * Timeline Conflict Detection Service
 * Provides advanced conflict detection algorithms for timeline events
 */
export class TimelineConflictDetectionService {
  private static instance: TimelineConflictDetectionService;

  private constructor() {}

  public static getInstance(): TimelineConflictDetectionService {
    if (!TimelineConflictDetectionService.instance) {
      TimelineConflictDetectionService.instance = new TimelineConflictDetectionService();
    }
    return TimelineConflictDetectionService.instance;
  }

  /**
   * Detect conflicts in timeline events with hierarchical logic
   */
  public detectConflicts(
    events: TimelineEventData[],
    options: ConflictDetectionOptions = {}
  ): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    const {
      checkOverlaps = true,
      checkLogical = true,
      checkCharacters = true,
      checkLocations = true,
      overlapThreshold = 30, // 30 minutes
      includeLowSeverity = true,
      realWorldConflictsOnly = false,
      enableHierarchicalDetection = true
    } = options;

    // Sort events by time for efficient processing
    const sortedEvents = [...events].sort((a, b) =>
      a.realWorldTime.getTime() - b.realWorldTime.getTime()
    );

    // Separate real-world and in-game events for hierarchical detection
    const realWorldEvents = sortedEvents.filter(event =>
      event.timeline === 'real-world' || event.entityType === 'session'
    );
    const inGameEvents = sortedEvents.filter(event =>
      event.timeline === 'in-game' || event.entityType !== 'session'
    );

    if (checkOverlaps) {
      if (enableHierarchicalDetection) {
        // Only check real-world overlaps (sessions/campaigns should not overlap)
        conflicts.push(...this.detectTemporalOverlaps(realWorldEvents, overlapThreshold, 'real-world'));

        // For in-game events, only check if explicitly requested
        if (!realWorldConflictsOnly) {
          // In-game events can overlap, so use more lenient detection
          conflicts.push(...this.detectTemporalOverlaps(inGameEvents, overlapThreshold * 2, 'in-game'));
        }
      } else {
        // Traditional overlap detection for all events
        conflicts.push(...this.detectTemporalOverlaps(sortedEvents, overlapThreshold));
      }
    }

    if (checkLogical) {
      conflicts.push(...this.detectLogicalInconsistencies(sortedEvents));
    }

    if (checkCharacters) {
      conflicts.push(...this.detectCharacterConflicts(sortedEvents));
    }

    if (checkLocations) {
      conflicts.push(...this.detectLocationConflicts(sortedEvents));
    }

    // Filter by severity if needed
    const filteredConflicts = includeLowSeverity
      ? conflicts
      : conflicts.filter(c => c.severity !== 'low');

    return this.deduplicateConflicts(filteredConflicts);
  }

  /**
   * Detect temporal overlaps between events
   */
  private detectTemporalOverlaps(
    events: TimelineEventData[],
    thresholdMinutes: number,
    timelineType?: 'real-world' | 'in-game'
  ): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds

    for (let i = 0; i < events.length - 1; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        // Check real-world time overlap
        const realWorldOverlap: boolean = this.checkTimeOverlap(
          event1.realWorldTime,
          event1.realWorldTime, // Assuming point events for now
          event2.realWorldTime,
          event2.realWorldTime,
          threshold
        );

        // Check in-game time overlap
        const inGameOverlap: boolean = this.checkTimeOverlap(
          event1.inGameTime,
          event1.inGameTime,
          event2.inGameTime,
          event2.inGameTime,
          threshold
        );

        // Determine if this is a valid conflict based on timeline type
        const shouldReportConflict = this.shouldReportOverlapConflict(
          event1, event2, realWorldOverlap, inGameOverlap, timelineType
        );

        if (shouldReportConflict) {
          const conflictType = timelineType === 'real-world' ? 'Real-World Timeline' :
                              timelineType === 'in-game' ? 'In-Game Timeline' : 'Timeline';

          conflicts.push({
            id: `overlap-${event1.id}-${event2.id}`,
            type: 'overlap',
            severity: this.calculateOverlapSeverity(event1, event2, threshold, timelineType),
            title: `${conflictType} Overlap Detected`,
            description: `Events "${event1.title}" and "${event2.title}" occur at overlapping times`,
            events: [event1.id, event2.id],
            suggestions: this.getOverlapSuggestions(event1, event2, timelineType),
            autoResolvable: false,
            metadata: {
              realWorldOverlap,
              inGameOverlap,
              timelineType,
              timeDifference: Math.abs(event2.realWorldTime.getTime() - event1.realWorldTime.getTime())
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect logical inconsistencies in timeline
   */
  private detectLogicalInconsistencies(events: TimelineEventData[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Check for events that reference non-existent entities
    const entityIds = new Set(events.map(e => e.entityId).filter(Boolean));
    
    for (const event of events) {
      // Check participants
      if (event.participants) {
        for (const participantId of event.participants) {
          if (!entityIds.has(participantId)) {
            conflicts.push({
              id: `missing-participant-${event.id}-${participantId}`,
              type: 'logical',
              severity: 'medium',
              title: 'Missing Participant Reference',
              description: `Event "${event.title}" references participant "${participantId}" that doesn't exist in timeline`,
              events: [event.id],
              suggestions: [
                'Add the missing participant to the timeline',
                'Remove the invalid participant reference',
                'Verify participant ID is correct'
              ],
              autoResolvable: false,
              metadata: { missingParticipant: participantId }
            });
          }
        }
      }

      // Check locations
      if (event.locations) {
        for (const locationId of event.locations) {
          if (!entityIds.has(locationId)) {
            conflicts.push({
              id: `missing-location-${event.id}-${locationId}`,
              type: 'logical',
              severity: 'medium',
              title: 'Missing Location Reference',
              description: `Event "${event.title}" references location "${locationId}" that doesn't exist in timeline`,
              events: [event.id],
              suggestions: [
                'Add the missing location to the timeline',
                'Remove the invalid location reference',
                'Verify location ID is correct'
              ],
              autoResolvable: false,
              metadata: { missingLocation: locationId }
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect character-specific conflicts
   */
  private detectCharacterConflicts(events: TimelineEventData[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Group events by character
    const characterEvents = new Map<string, TimelineEventData[]>();
    
    for (const event of events) {
      if (event.participants) {
        for (const participantId of event.participants) {
          if (!characterEvents.has(participantId)) {
            characterEvents.set(participantId, []);
          }
          characterEvents.get(participantId)!.push(event);
        }
      }
    }

    // Check for character being in multiple places at once
    for (const [characterId, charEvents] of characterEvents) {
      const sortedCharEvents = charEvents.sort((a, b) => 
        a.realWorldTime.getTime() - b.realWorldTime.getTime()
      );

      for (let i = 0; i < sortedCharEvents.length - 1; i++) {
        const event1 = sortedCharEvents[i];
        const event2 = sortedCharEvents[i + 1];

        // Check if character is in different locations at overlapping times
        if (event1.locations && event2.locations) {
          const hasCommonLocation = event1.locations.some(loc => 
            event2.locations!.includes(loc)
          );

          if (!hasCommonLocation) {
            const timeDiff = event2.realWorldTime.getTime() - event1.realWorldTime.getTime();
            const minTravelTime = 30 * 60 * 1000; // 30 minutes minimum travel time

            if (timeDiff < minTravelTime) {
              conflicts.push({
                id: `character-location-${characterId}-${event1.id}-${event2.id}`,
                type: 'character',
                severity: 'high',
                title: 'Character Location Conflict',
                description: `Character cannot be in different locations within ${timeDiff / 60000} minutes`,
                events: [event1.id, event2.id],
                suggestions: [
                  'Adjust event timing to allow travel time',
                  'Verify character participation in events',
                  'Add travel event between locations'
                ],
                autoResolvable: false,
                metadata: {
                  characterId,
                  timeDifference: timeDiff,
                  locations1: event1.locations,
                  locations2: event2.locations
                }
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect location-specific conflicts
   */
  private detectLocationConflicts(events: TimelineEventData[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Group events by location
    const locationEvents = new Map<string, TimelineEventData[]>();
    
    for (const event of events) {
      if (event.locations) {
        for (const locationId of event.locations) {
          if (!locationEvents.has(locationId)) {
            locationEvents.set(locationId, []);
          }
          locationEvents.get(locationId)!.push(event);
        }
      }
    }

    // Check for location capacity conflicts (simplified)
    for (const [locationId, locEvents] of locationEvents) {
      const simultaneousEvents = this.findSimultaneousEvents(locEvents);
      
      if (simultaneousEvents.length > 1) {
        // Check if events might conflict (e.g., too many people in small location)
        const totalParticipants = simultaneousEvents.reduce((total, event) => 
          total + (event.participants?.length || 0), 0
        );

        if (totalParticipants > 10) { // Arbitrary threshold
          conflicts.push({
            id: `location-capacity-${locationId}-${Date.now()}`,
            type: 'location',
            severity: 'medium',
            title: 'Location Capacity Conflict',
            description: `Location may be overcrowded with ${totalParticipants} participants`,
            events: simultaneousEvents.map(e => e.id),
            suggestions: [
              'Verify location can accommodate all participants',
              'Split events across multiple locations',
              'Stagger event timing'
            ],
            autoResolvable: false,
            metadata: {
              locationId,
              participantCount: totalParticipants,
              eventCount: simultaneousEvents.length
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Convert any date-like value to a proper Date object
   */
  private ensureDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    // Already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Firestore Timestamp object
    if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    // Firestore Timestamp with toDate method
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }

    // String or number
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      return new Date(dateValue);
    }

    // Fallback to current date
    console.warn('Unable to convert date value:', dateValue);
    return new Date();
  }

  /**
   * Check if two time ranges overlap
   */
  private checkTimeOverlap(
    start1: any,
    end1: any,
    start2: any,
    end2: any,
    threshold: number
  ): boolean {
    try {
      // Ensure all values are proper Date objects
      const s1Date = this.ensureDate(start1);
      const e1Date = this.ensureDate(end1);
      const s2Date = this.ensureDate(start2);
      const e2Date = this.ensureDate(end2);

      const s1 = s1Date.getTime();
      const e1 = e1Date.getTime();
      const s2 = s2Date.getTime();
      const e2 = e2Date.getTime();

      // Check for overlap with threshold
      return (s1 <= e2 + threshold) && (s2 <= e1 + threshold);
    } catch (error) {
      console.error('Error in checkTimeOverlap:', error, { start1, end1, start2, end2 });
      return false;
    }
  }

  /**
   * Determine if overlap should be reported as conflict based on timeline type
   */
  private shouldReportOverlapConflict(
    event1: TimelineEventData,
    event2: TimelineEventData,
    realWorldOverlap: boolean,
    inGameOverlap: boolean,
    timelineType?: 'real-world' | 'in-game'
  ): boolean {
    // For real-world timeline (sessions/campaigns), overlaps are always conflicts
    if (timelineType === 'real-world') {
      return realWorldOverlap;
    }

    // For in-game timeline, be more lenient - only report severe overlaps
    if (timelineType === 'in-game') {
      // Allow parallel in-game events unless they involve the same characters/locations
      const hasSharedParticipants = event1.participants?.some(p =>
        event2.participants?.includes(p)
      );
      const hasSharedLocations = event1.locations?.some(l =>
        event2.locations?.includes(l)
      );

      // Only report conflict if events share participants or locations
      return Boolean(inGameOverlap && (hasSharedParticipants || hasSharedLocations));
    }

    // Default behavior for mixed timelines
    return Boolean(realWorldOverlap) || Boolean(inGameOverlap);
  }

  /**
   * Get appropriate suggestions based on timeline type
   */
  private getOverlapSuggestions(
    event1: TimelineEventData,
    event2: TimelineEventData,
    timelineType?: 'real-world' | 'in-game'
  ): string[] {
    if (timelineType === 'real-world') {
      return [
        'Adjust session timing to avoid overlap',
        'Verify session scheduling is correct',
        'Consider splitting long sessions'
      ];
    }

    if (timelineType === 'in-game') {
      return [
        'Verify if events can occur simultaneously',
        'Check if characters can be in multiple places',
        'Consider parallel storylines',
        'Adjust event timing if needed'
      ];
    }

    return [
      'Adjust event timing to avoid overlap',
      'Verify if events can occur simultaneously',
      'Split overlapping event into multiple parts'
    ];
  }

  /**
   * Calculate overlap severity with timeline context
   */
  private calculateOverlapSeverity(
    event1: TimelineEventData,
    event2: TimelineEventData,
    threshold: number,
    timelineType?: 'real-world' | 'in-game'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const timeDiff = Math.abs(event2.realWorldTime.getTime() - event1.realWorldTime.getTime());

    // Real-world overlaps are more severe
    if (timelineType === 'real-world') {
      if (timeDiff === 0) return 'critical';
      if (timeDiff < threshold / 4) return 'high';
      if (timeDiff < threshold / 2) return 'medium';
      return 'low';
    }

    // In-game overlaps are less severe (parallel events are common)
    if (timelineType === 'in-game') {
      if (timeDiff === 0) return 'high'; // Not critical for in-game
      if (timeDiff < threshold / 2) return 'medium';
      if (timeDiff < threshold) return 'low';
      return 'low';
    }

    // Default severity calculation
    if (timeDiff === 0) return 'critical';
    if (timeDiff < threshold / 2) return 'high';
    if (timeDiff < threshold) return 'medium';
    return 'low';
  }

  /**
   * Find events that occur simultaneously
   */
  private findSimultaneousEvents(events: TimelineEventData[]): TimelineEventData[] {
    const simultaneousGroups: TimelineEventData[][] = [];
    
    for (const event of events) {
      let addedToGroup = false;
      
      for (const group of simultaneousGroups) {
        if (group.some(groupEvent => 
          Math.abs(groupEvent.realWorldTime.getTime() - event.realWorldTime.getTime()) < 60000 // 1 minute
        )) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        simultaneousGroups.push([event]);
      }
    }
    
    // Return the largest group of simultaneous events
    return simultaneousGroups.reduce((largest, current) => 
      current.length > largest.length ? current : largest, []
    );
  }

  /**
   * Remove duplicate conflicts
   */
  private deduplicateConflicts(conflicts: TimelineConflict[]): TimelineConflict[] {
    const seen = new Set<string>();
    return conflicts.filter(conflict => {
      const key = `${conflict.type}-${conflict.events.sort().join('-')}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance
export const timelineConflictDetection = TimelineConflictDetectionService.getInstance();
