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
   * Detect conflicts in timeline events
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
      includeLowSeverity = true
    } = options;

    // Sort events by time for efficient processing
    const sortedEvents = [...events].sort((a, b) => 
      a.realWorldTime.getTime() - b.realWorldTime.getTime()
    );

    if (checkOverlaps) {
      conflicts.push(...this.detectTemporalOverlaps(sortedEvents, overlapThreshold));
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
    thresholdMinutes: number
  ): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds

    for (let i = 0; i < events.length - 1; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        // Check real-world time overlap
        const realWorldOverlap = this.checkTimeOverlap(
          event1.realWorldTime,
          event1.realWorldTime, // Assuming point events for now
          event2.realWorldTime,
          event2.realWorldTime,
          threshold
        );

        // Check in-game time overlap
        const inGameOverlap = this.checkTimeOverlap(
          event1.inGameTime,
          event1.inGameTime,
          event2.inGameTime,
          event2.inGameTime,
          threshold
        );

        if (realWorldOverlap || inGameOverlap) {
          conflicts.push({
            id: `overlap-${event1.id}-${event2.id}`,
            type: 'overlap',
            severity: this.calculateOverlapSeverity(event1, event2, threshold),
            title: 'Timeline Overlap Detected',
            description: `Events "${event1.title}" and "${event2.title}" occur at overlapping times`,
            events: [event1.id, event2.id],
            suggestions: [
              'Adjust event timing to avoid overlap',
              'Verify if events can occur simultaneously',
              'Split overlapping event into multiple parts'
            ],
            autoResolvable: false,
            metadata: {
              realWorldOverlap,
              inGameOverlap,
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
   * Check if two time ranges overlap
   */
  private checkTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
    threshold: number
  ): boolean {
    const s1 = start1.getTime();
    const e1 = end1.getTime();
    const s2 = start2.getTime();
    const e2 = end2.getTime();

    // Check for overlap with threshold
    return (s1 <= e2 + threshold) && (s2 <= e1 + threshold);
  }

  /**
   * Calculate overlap severity
   */
  private calculateOverlapSeverity(
    event1: TimelineEventData,
    event2: TimelineEventData,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const timeDiff = Math.abs(event2.realWorldTime.getTime() - event1.realWorldTime.getTime());
    
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
