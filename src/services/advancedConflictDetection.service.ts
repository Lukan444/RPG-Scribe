/**
 * Advanced Conflict Detection Service
 * 
 * Enhanced conflict detection system for RPG Scribe timeline with
 * AI-ready framework and real-time monitoring capabilities.
 */

import {
  TimelineConflict,
  ConflictType,
  ConflictSeverity,
  ConflictDetectionConfig,
  ConflictDetectionResult,
  EventRelationship,
  RelationshipType,
  ConflictNotification,
  ConflictDetectionMetrics
} from '../types/timelineConflict.types';
import { RPGTimelineEvent, TimelineEventType } from '../types/timeline.types';
import { EntityType } from '../models/EntityType';

/**
 * Advanced Conflict Detection Service
 */
export class AdvancedConflictDetectionService {
  private config: ConflictDetectionConfig;
  private detectionCache: Map<string, ConflictDetectionResult> = new Map();
  private notificationCallbacks: ((notification: ConflictNotification) => void)[] = [];
  private metrics: ConflictDetectionMetrics;

  constructor(config?: Partial<ConflictDetectionConfig>) {
    this.config = {
      enabled: true,
      realTimeDetection: true,
      severityThreshold: ConflictSeverity.LOW,
      enabledConflictTypes: Object.values(ConflictType),
      autoResolveEnabled: false,
      autoResolvableTypes: [ConflictType.TIME_OVERLAP],
      notificationSettings: {
        showCritical: true,
        showHigh: true,
        showMedium: true,
        showLow: false,
        soundEnabled: true,
        persistentAlerts: true
      },
      performanceSettings: {
        maxEventsToAnalyze: 1000,
        detectionInterval: 5000,
        batchSize: 50
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
  }

  /**
   * Detect conflicts in timeline events
   */
  async detectConflicts(events: RPGTimelineEvent[]): Promise<ConflictDetectionResult> {
    const startTime = performance.now();
    
    if (!this.config.enabled) {
      return this.createEmptyResult(startTime, events.length);
    }

    // Limit events for performance
    const eventsToAnalyze = events.slice(0, this.config.performanceSettings.maxEventsToAnalyze);
    
    const conflicts: TimelineConflict[] = [];
    const relationships: EventRelationship[] = [];

    // Process events in batches for better performance
    const batchSize = this.config.performanceSettings.batchSize;
    for (let i = 0; i < eventsToAnalyze.length; i += batchSize) {
      const batch = eventsToAnalyze.slice(i, i + batchSize);
      
      // Detect conflicts within this batch
      const batchConflicts = await this.detectBatchConflicts(batch, eventsToAnalyze);
      conflicts.push(...batchConflicts);

      // Detect relationships within this batch
      const batchRelationships = await this.detectBatchRelationships(batch, eventsToAnalyze);
      relationships.push(...batchRelationships);
    }

    const endTime = performance.now();
    const detectionTime = endTime - startTime;

    const result: ConflictDetectionResult = {
      conflicts: this.filterConflictsBySeverity(conflicts),
      relationships,
      performance: {
        detectionTime,
        eventsAnalyzed: eventsToAnalyze.length,
        conflictsFound: conflicts.length,
        relationshipsFound: relationships.length
      },
      metadata: {
        detectedAt: new Date(),
        configUsed: { ...this.config },
        dataVersion: '1.0.0'
      }
    };

    // Update metrics
    this.updateMetrics(result);

    // Send notifications for new conflicts
    this.sendConflictNotifications(conflicts);

    return result;
  }

  /**
   * Detect conflicts within a batch of events
   */
  private async detectBatchConflicts(
    batch: RPGTimelineEvent[], 
    allEvents: RPGTimelineEvent[]
  ): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];

    for (const event of batch) {
      // Check for time overlap conflicts
      if (this.config.enabledConflictTypes.includes(ConflictType.TIME_OVERLAP)) {
        const timeConflicts = this.detectTimeOverlapConflicts(event, allEvents);
        conflicts.push(...timeConflicts);
      }

      // Check for character availability conflicts
      if (this.config.enabledConflictTypes.includes(ConflictType.CHARACTER_AVAILABILITY)) {
        const characterConflicts = this.detectCharacterAvailabilityConflicts(event, allEvents);
        conflicts.push(...characterConflicts);
      }

      // Check for location capacity conflicts
      if (this.config.enabledConflictTypes.includes(ConflictType.LOCATION_CAPACITY)) {
        const locationConflicts = this.detectLocationCapacityConflicts(event, allEvents);
        conflicts.push(...locationConflicts);
      }

      // Check for logical inconsistencies
      if (this.config.enabledConflictTypes.includes(ConflictType.LOGICAL_INCONSISTENCY)) {
        const logicalConflicts = this.detectLogicalInconsistencies(event, allEvents);
        conflicts.push(...logicalConflicts);
      }

      // Check for prerequisite missing conflicts
      if (this.config.enabledConflictTypes.includes(ConflictType.PREREQUISITE_MISSING)) {
        const prerequisiteConflicts = this.detectPrerequisiteConflicts(event, allEvents);
        conflicts.push(...prerequisiteConflicts);
      }
    }

    return this.deduplicateConflicts(conflicts);
  }

  /**
   * Detect time overlap conflicts
   */
  private detectTimeOverlapConflicts(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    const eventStart = event.startDate;
    const eventEnd = event.endDate || event.startDate;

    for (const otherEvent of allEvents) {
      if (otherEvent.id === event.id) continue;

      const otherStart = otherEvent.startDate;
      const otherEnd = otherEvent.endDate || otherEvent.startDate;

      // Check for time overlap
      if (this.hasTimeOverlap(eventStart, eventEnd, otherStart, otherEnd)) {
        // Check if they share participants or location
        const hasSharedParticipants = this.hasSharedParticipants(event, otherEvent);
        const hasSharedLocation = event.location && event.location === otherEvent.location;

        if (hasSharedParticipants || hasSharedLocation) {
          const severity = this.calculateOverlapSeverity(event, otherEvent, hasSharedParticipants, Boolean(hasSharedLocation));
          
          conflicts.push({
            id: `overlap-${event.id}-${otherEvent.id}`,
            type: ConflictType.TIME_OVERLAP,
            severity,
            title: `Time Overlap Conflict`,
            description: `Events "${event.title}" and "${otherEvent.title}" overlap in time and share ${hasSharedParticipants ? 'participants' : 'location'}`,
            affectedEvents: [event.id, otherEvent.id],
            affectedEntities: this.getAffectedEntities(event, otherEvent),
            timelineContext: {
              realWorldTimeRange: {
                start: new Date(Math.min(eventStart.getTime(), otherStart.getTime())),
                end: new Date(Math.max(eventEnd.getTime(), otherEnd.getTime()))
              },
              inGameTimeRange: {
                start: new Date(Math.min(eventStart.getTime(), otherStart.getTime())),
                end: new Date(Math.max(eventEnd.getTime(), otherEnd.getTime()))
              },
              affectedRows: this.getAffectedRows(event, otherEvent)
            },
            metadata: {
              detectedAt: new Date(),
              detectedBy: 'system',
              autoResolvable: true,
              requiresGMApproval: severity === ConflictSeverity.CRITICAL,
              tags: ['time-overlap', hasSharedParticipants ? 'character-conflict' : 'location-conflict']
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect character availability conflicts
   */
  private detectCharacterAvailabilityConflicts(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    
    if (!event.participants || event.participants.length === 0) {
      return conflicts;
    }

    for (const participant of event.participants) {
      const conflictingEvents = allEvents.filter(otherEvent => 
        otherEvent.id !== event.id &&
        otherEvent.participants?.includes(participant) &&
        this.hasTimeOverlap(event.startDate, event.endDate || event.startDate, 
                           otherEvent.startDate, otherEvent.endDate || otherEvent.startDate)
      );

      if (conflictingEvents.length > 0) {
        conflicts.push({
          id: `character-availability-${event.id}-${participant}`,
          type: ConflictType.CHARACTER_AVAILABILITY,
          severity: ConflictSeverity.HIGH,
          title: `Character Availability Conflict`,
          description: `Character ${participant} is involved in multiple overlapping events`,
          affectedEvents: [event.id, ...conflictingEvents.map(e => e.id)],
          affectedEntities: [{
            entityType: EntityType.CHARACTER,
            entityId: participant,
            entityName: participant
          }],
          timelineContext: {
            realWorldTimeRange: {
              start: event.startDate,
              end: event.endDate || event.startDate
            },
            affectedRows: [`character-${participant}`]
          },
          metadata: {
            detectedAt: new Date(),
            detectedBy: 'system',
            autoResolvable: false,
            requiresGMApproval: true,
            tags: ['character-availability', 'scheduling-conflict']
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect location capacity conflicts
   */
  private detectLocationCapacityConflicts(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    
    if (!event.location) {
      return conflicts;
    }

    const overlappingEvents = allEvents.filter(otherEvent =>
      otherEvent.id !== event.id &&
      otherEvent.location === event.location &&
      this.hasTimeOverlap(event.startDate, event.endDate || event.startDate,
                         otherEvent.startDate, otherEvent.endDate || otherEvent.startDate)
    );

    if (overlappingEvents.length > 0) {
      // Calculate total participants at the location
      const totalParticipants = new Set([
        ...(event.participants || []),
        ...overlappingEvents.flatMap(e => e.participants || [])
      ]).size;

      // Assume location capacity issues if more than 10 participants (configurable)
      if (totalParticipants > 10) {
        conflicts.push({
          id: `location-capacity-${event.location}-${event.id}`,
          type: ConflictType.LOCATION_CAPACITY,
          severity: ConflictSeverity.MEDIUM,
          title: `Location Capacity Conflict`,
          description: `Location ${event.location} may be overcrowded with ${totalParticipants} participants`,
          affectedEvents: [event.id, ...overlappingEvents.map(e => e.id)],
          affectedEntities: [{
            entityType: EntityType.LOCATION,
            entityId: event.location,
            entityName: event.location
          }],
          timelineContext: {
            realWorldTimeRange: {
              start: event.startDate,
              end: event.endDate || event.startDate
            },
            affectedRows: [`location-${event.location}`]
          },
          metadata: {
            detectedAt: new Date(),
            detectedBy: 'system',
            autoResolvable: false,
            requiresGMApproval: false,
            tags: ['location-capacity', 'overcrowding']
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect logical inconsistencies
   */
  private detectLogicalInconsistencies(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    
    // Example: Character death before birth, quest completion before start, etc.
    // This would require more domain-specific logic based on event types and relationships
    
    return conflicts;
  }

  /**
   * Detect prerequisite conflicts
   */
  private detectPrerequisiteConflicts(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    
    // Example: Quest events without prerequisite events, character interactions without introductions
    // This would require relationship mapping and dependency tracking
    
    return conflicts;
  }

  /**
   * Detect relationships between events in a batch
   */
  private async detectBatchRelationships(
    batch: RPGTimelineEvent[], 
    allEvents: RPGTimelineEvent[]
  ): Promise<EventRelationship[]> {
    const relationships: EventRelationship[] = [];

    for (const event of batch) {
      // Detect causal relationships
      const causalRelationships = this.detectCausalRelationships(event, allEvents);
      relationships.push(...causalRelationships);

      // Detect temporal relationships
      const temporalRelationships = this.detectTemporalRelationships(event, allEvents);
      relationships.push(...temporalRelationships);

      // Detect entity-based relationships
      const entityRelationships = this.detectEntityRelationships(event, allEvents);
      relationships.push(...entityRelationships);
    }

    return relationships;
  }

  /**
   * Detect causal relationships between events
   */
  private detectCausalRelationships(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): EventRelationship[] {
    const relationships: EventRelationship[] = [];
    
    // Example logic: Quest completion causes reward events, character death causes mourning events
    // This would require more sophisticated analysis based on event content and types
    
    return relationships;
  }

  /**
   * Detect temporal relationships between events
   */
  private detectTemporalRelationships(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): EventRelationship[] {
    const relationships: EventRelationship[] = [];
    
    for (const otherEvent of allEvents) {
      if (otherEvent.id === event.id) continue;

      const timeDiff = otherEvent.startDate.getTime() - event.startDate.getTime();
      const hoursDiff = Math.abs(timeDiff) / (1000 * 60 * 60);

      // Events within 1 hour are considered concurrent
      if (hoursDiff <= 1) {
        relationships.push({
          id: `temporal-${event.id}-${otherEvent.id}`,
          sourceEventId: event.id,
          targetEventId: otherEvent.id,
          type: RelationshipType.CONCURRENT,
          strength: 1 - (hoursDiff / 1), // Closer in time = stronger relationship
          description: `Events occur within 1 hour of each other`,
          metadata: {
            createdAt: new Date(),
            createdBy: 'system',
            verified: false,
            tags: ['temporal', 'concurrent']
          }
        });
      }
      // Events in sequence
      else if (timeDiff > 0 && hoursDiff <= 24) {
        relationships.push({
          id: `sequence-${event.id}-${otherEvent.id}`,
          sourceEventId: event.id,
          targetEventId: otherEvent.id,
          type: RelationshipType.PRECEDES,
          strength: 1 - (hoursDiff / 24), // Closer in time = stronger relationship
          description: `Event precedes another event within 24 hours`,
          metadata: {
            createdAt: new Date(),
            createdBy: 'system',
            verified: false,
            tags: ['temporal', 'sequence']
          }
        });
      }
    }

    return relationships;
  }

  /**
   * Detect entity-based relationships between events
   */
  private detectEntityRelationships(event: RPGTimelineEvent, allEvents: RPGTimelineEvent[]): EventRelationship[] {
    const relationships: EventRelationship[] = [];
    
    for (const otherEvent of allEvents) {
      if (otherEvent.id === event.id) continue;

      // Shared participants create relationships
      const sharedParticipants = this.getSharedParticipants(event, otherEvent);
      if (sharedParticipants.length > 0) {
        const strength = sharedParticipants.length / Math.max(
          event.participants?.length || 1,
          otherEvent.participants?.length || 1
        );

        relationships.push({
          id: `entity-${event.id}-${otherEvent.id}`,
          sourceEventId: event.id,
          targetEventId: otherEvent.id,
          type: RelationshipType.RELATED_TO,
          strength,
          description: `Events share ${sharedParticipants.length} participants`,
          metadata: {
            createdAt: new Date(),
            createdBy: 'system',
            verified: false,
            tags: ['entity-based', 'shared-participants']
          }
        });
      }

      // Shared location creates relationships
      if (event.location && event.location === otherEvent.location) {
        relationships.push({
          id: `location-${event.id}-${otherEvent.id}`,
          sourceEventId: event.id,
          targetEventId: otherEvent.id,
          type: RelationshipType.RELATED_TO,
          strength: 0.7,
          description: `Events occur at the same location: ${event.location}`,
          metadata: {
            createdAt: new Date(),
            createdBy: 'system',
            verified: false,
            tags: ['entity-based', 'shared-location']
          }
        });
      }
    }

    return relationships;
  }

  /**
   * Check if two time ranges overlap
   */
  private hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Check if two events have shared participants
   */
  private hasSharedParticipants(event1: RPGTimelineEvent, event2: RPGTimelineEvent): boolean {
    if (!event1.participants || !event2.participants) return false;
    return event1.participants.some(p => event2.participants!.includes(p));
  }

  /**
   * Get shared participants between two events
   */
  private getSharedParticipants(event1: RPGTimelineEvent, event2: RPGTimelineEvent): string[] {
    if (!event1.participants || !event2.participants) return [];
    return event1.participants.filter(p => event2.participants!.includes(p));
  }

  /**
   * Calculate overlap severity
   */
  private calculateOverlapSeverity(
    event1: RPGTimelineEvent,
    event2: RPGTimelineEvent,
    hasSharedParticipants: boolean,
    hasSharedLocation: boolean
  ): ConflictSeverity {
    let severity = ConflictSeverity.LOW;

    if (hasSharedParticipants && hasSharedLocation) {
      severity = ConflictSeverity.CRITICAL;
    } else if (hasSharedParticipants) {
      severity = ConflictSeverity.HIGH;
    } else if (hasSharedLocation) {
      severity = ConflictSeverity.MEDIUM;
    }

    // Increase severity for important events
    if (event1.importance >= 8 || event2.importance >= 8) {
      severity = severity === ConflictSeverity.LOW ? ConflictSeverity.MEDIUM :
                 severity === ConflictSeverity.MEDIUM ? ConflictSeverity.HIGH : ConflictSeverity.CRITICAL;
    }

    return severity;
  }

  /**
   * Get affected entities from events
   */
  private getAffectedEntities(event1: RPGTimelineEvent, event2: RPGTimelineEvent) {
    const entities: { entityType: EntityType; entityId: string; entityName?: string }[] = [];

    // Add participants
    const allParticipants = new Set([...(event1.participants || []), ...(event2.participants || [])]);
    allParticipants.forEach(participant => {
      entities.push({
        entityType: EntityType.CHARACTER,
        entityId: participant,
        entityName: participant
      });
    });

    // Add locations
    if (event1.location) {
      entities.push({
        entityType: EntityType.LOCATION,
        entityId: event1.location,
        entityName: event1.location
      });
    }
    if (event2.location && event2.location !== event1.location) {
      entities.push({
        entityType: EntityType.LOCATION,
        entityId: event2.location,
        entityName: event2.location
      });
    }

    return entities;
  }

  /**
   * Get affected timeline rows
   */
  private getAffectedRows(event1: RPGTimelineEvent, event2: RPGTimelineEvent): string[] {
    const rows = new Set<string>();

    // Add meta rows
    rows.add('real-world');
    rows.add('in-game');

    // Add entity rows
    if (event1.entityType && event1.entityId) {
      rows.add(`${event1.entityType.toLowerCase()}-${event1.entityId}`);
    }
    if (event2.entityType && event2.entityId) {
      rows.add(`${event2.entityType.toLowerCase()}-${event2.entityId}`);
    }

    // Add participant rows
    [...(event1.participants || []), ...(event2.participants || [])].forEach(participant => {
      rows.add(`character-${participant}`);
    });

    // Add location rows
    if (event1.location) rows.add(`location-${event1.location}`);
    if (event2.location) rows.add(`location-${event2.location}`);

    return Array.from(rows);
  }

  /**
   * Filter conflicts by severity threshold
   */
  private filterConflictsBySeverity(conflicts: TimelineConflict[]): TimelineConflict[] {
    const severityOrder = {
      [ConflictSeverity.CRITICAL]: 4,
      [ConflictSeverity.HIGH]: 3,
      [ConflictSeverity.MEDIUM]: 2,
      [ConflictSeverity.LOW]: 1
    };

    const threshold = severityOrder[this.config.severityThreshold];
    return conflicts.filter(conflict => severityOrder[conflict.severity] >= threshold);
  }

  /**
   * Deduplicate conflicts
   */
  private deduplicateConflicts(conflicts: TimelineConflict[]): TimelineConflict[] {
    const seen = new Set<string>();
    return conflicts.filter(conflict => {
      const key = `${conflict.type}-${conflict.affectedEvents.sort().join('-')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Create empty result for disabled detection
   */
  private createEmptyResult(startTime: number, eventCount: number): ConflictDetectionResult {
    return {
      conflicts: [],
      relationships: [],
      performance: {
        detectionTime: performance.now() - startTime,
        eventsAnalyzed: eventCount,
        conflictsFound: 0,
        relationshipsFound: 0
      },
      metadata: {
        detectedAt: new Date(),
        configUsed: { ...this.config },
        dataVersion: '1.0.0'
      }
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): ConflictDetectionMetrics {
    return {
      totalConflicts: 0,
      conflictsBySeverity: {
        [ConflictSeverity.CRITICAL]: 0,
        [ConflictSeverity.HIGH]: 0,
        [ConflictSeverity.MEDIUM]: 0,
        [ConflictSeverity.LOW]: 0
      },
      conflictsByType: Object.values(ConflictType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<ConflictType, number>),
      averageDetectionTime: 0,
      resolutionRate: 0,
      autoResolutionRate: 0,
      performanceScore: 100
    };
  }

  /**
   * Update metrics with detection result
   */
  private updateMetrics(result: ConflictDetectionResult): void {
    this.metrics.totalConflicts += result.conflicts.length;

    result.conflicts.forEach(conflict => {
      this.metrics.conflictsBySeverity[conflict.severity]++;
      this.metrics.conflictsByType[conflict.type]++;
    });

    // Update average detection time (simple moving average)
    this.metrics.averageDetectionTime =
      (this.metrics.averageDetectionTime + result.performance.detectionTime) / 2;

    // Calculate performance score based on detection time and accuracy
    const targetTime = 1000; // 1 second target
    const timeScore = Math.max(0, 100 - (result.performance.detectionTime / targetTime) * 50);
    this.metrics.performanceScore = (this.metrics.performanceScore + timeScore) / 2;
  }

  /**
   * Send conflict notifications
   */
  private sendConflictNotifications(conflicts: TimelineConflict[]): void {
    conflicts.forEach(conflict => {
      const shouldNotify = this.shouldSendNotification(conflict);
      if (shouldNotify) {
        const notification: ConflictNotification = {
          id: `notification-${conflict.id}`,
          conflictId: conflict.id,
          type: 'new_conflict',
          severity: conflict.severity,
          title: `New ${conflict.severity.toUpperCase()} Conflict Detected`,
          message: conflict.description,
          timestamp: new Date(),
          read: false,
          actions: [
            {
              label: 'View Details',
              action: () => this.openConflictDetails(conflict.id)
            },
            {
              label: 'Send to AI',
              action: () => this.sendToAIProposal(conflict.id),
              primary: true
            }
          ]
        };

        this.notificationCallbacks.forEach(callback => callback(notification));
      }
    });
  }

  /**
   * Check if notification should be sent
   */
  private shouldSendNotification(conflict: TimelineConflict): boolean {
    const settings = this.config.notificationSettings;

    switch (conflict.severity) {
      case ConflictSeverity.CRITICAL:
        return settings.showCritical;
      case ConflictSeverity.HIGH:
        return settings.showHigh;
      case ConflictSeverity.MEDIUM:
        return settings.showMedium;
      case ConflictSeverity.LOW:
        return settings.showLow;
      default:
        return false;
    }
  }

  /**
   * Open conflict details (placeholder)
   */
  private openConflictDetails(conflictId: string): void {
    console.log(`Opening conflict details for: ${conflictId}`);
    // This would open a modal or navigate to conflict details
  }

  /**
   * Send to AI proposal system (placeholder)
   */
  private sendToAIProposal(conflictId: string): void {
    console.log(`Sending conflict to AI proposal system: ${conflictId}`);
    // This would integrate with future AI Brain service
  }

  /**
   * Subscribe to conflict notifications
   */
  onNotification(callback: (notification: ConflictNotification) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConflictDetectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConflictDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ConflictDetectionConfig {
    return { ...this.config };
  }
}
