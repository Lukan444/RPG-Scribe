/**
 * Timeline Event Extraction Service
 * 
 * Extracts timeline events from transcription content and integrates with
 * the existing Dual Timeline System
 */

import { 
  TranscriptionSegment, 
  TimelineEventSuggestion, 
  ExtractedEntity 
} from '../../models/Transcription';
import { EventService } from '../event.service';
import { EntityType } from '../../models/EntityType';
import { EventType } from '../../models/EventType';

/**
 * Event extraction configuration
 */
export interface EventExtractionConfig {
  confidenceThreshold: number;
  maxEventsPerSession: number;
  timeWindowSize: number; // seconds
  enableRealTimeExtraction: boolean;
  eventTypes: EventType[];
  priorityKeywords: string[];
}

/**
 * Extracted timeline event
 */
export interface ExtractedTimelineEvent {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  timestamp: Date;
  duration?: number;
  confidence: number;
  sourceSegments: TranscriptionSegment[];
  relatedEntities: ExtractedEntity[];
  importance: number; // 0-1 scale
  isApproved: boolean;
  suggestedBy: 'ai' | 'user';
}

/**
 * Event pattern for detection
 */
interface EventPattern {
  type: EventType;
  keywords: string[];
  patterns: RegExp[];
  importance: number;
  requiresEntities?: EntityType[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: EventExtractionConfig = {
  confidenceThreshold: 0.6,
  maxEventsPerSession: 25,
  timeWindowSize: 300, // 5 minutes
  enableRealTimeExtraction: true,
  eventTypes: [
    EventType.BATTLE,
    EventType.SOCIAL,
    EventType.EXPLORATION,
    EventType.DISCOVERY,
    EventType.QUEST,
    EventType.TRAVEL
  ],
  priorityKeywords: [
    'combat', 'fight', 'battle', 'attack',
    'discover', 'find', 'secret', 'treasure',
    'quest', 'mission', 'task',
    'travel', 'journey', 'arrive',
    'meet', 'talk', 'conversation',
    'magic', 'spell', 'artifact'
  ]
};

/**
 * Event detection patterns
 */
const EVENT_PATTERNS: EventPattern[] = [
  {
    type: EventType.BATTLE,
    keywords: ['combat', 'fight', 'battle', 'attack', 'initiative', 'damage', 'hit', 'miss'],
    patterns: [
      /(?:start|begin|enter).*(?:combat|fight|battle)/i,
      /(?:attack|hit|strike).*(?:with|using)/i,
      /(?:roll|rolled).*(?:initiative|attack|damage)/i,
      /(?:takes?|deals?).*damage/i
    ],
    importance: 0.8,
    requiresEntities: [EntityType.CHARACTER]
  },
  {
    type: EventType.DISCOVERY,
    keywords: ['discover', 'find', 'found', 'reveal', 'uncover', 'secret', 'hidden'],
    patterns: [
      /(?:discover|find|found).*(?:secret|treasure|artifact|clue)/i,
      /(?:reveal|uncover).*(?:hidden|secret)/i,
      /(?:notice|spot|see).*(?:something|unusual)/i
    ],
    importance: 0.7,
    requiresEntities: [EntityType.ITEM, EntityType.LOCATION]
  },
  {
    type: EventType.SOCIAL,
    keywords: ['talk', 'speak', 'conversation', 'meet', 'greet', 'negotiate', 'persuade'],
    patterns: [
      /(?:talk|speak).*(?:to|with)/i,
      /(?:meet|encounter).*(?:npc|character)/i,
      /(?:negotiate|persuade|convince)/i,
      /(?:conversation|dialogue).*(?:with|about)/i
    ],
    importance: 0.6,
    requiresEntities: [EntityType.CHARACTER]
  },
  {
    type: EventType.EXPLORATION,
    keywords: ['explore', 'search', 'investigate', 'examine', 'look', 'enter'],
    patterns: [
      /(?:explore|search|investigate).*(?:room|area|dungeon)/i,
      /(?:enter|go into).*(?:building|cave|forest)/i,
      /(?:examine|look at|inspect)/i
    ],
    importance: 0.5,
    requiresEntities: [EntityType.LOCATION]
  },
  {
    type: EventType.QUEST,
    keywords: ['quest', 'mission', 'task', 'objective', 'goal', 'complete', 'finish'],
    patterns: [
      /(?:start|begin|accept).*(?:quest|mission|task)/i,
      /(?:complete|finish|accomplish).*(?:quest|mission|objective)/i,
      /(?:objective|goal).*(?:is|was)/i
    ],
    importance: 0.8
  },
  {
    type: EventType.TRAVEL,
    keywords: ['travel', 'journey', 'move', 'go', 'arrive', 'depart', 'leave'],
    patterns: [
      /(?:travel|journey).*(?:to|from)/i,
      /(?:arrive|reach).*(?:at|in)/i,
      /(?:depart|leave).*(?:from|for)/i,
      /(?:move|go).*(?:to|towards)/i
    ],
    importance: 0.4,
    requiresEntities: [EntityType.LOCATION]
  }
];

/**
 * Timeline Event Extraction Service
 */
export class TimelineEventExtractionService {
  private config: EventExtractionConfig;
  private eventService: EventService;
  private extractedEvents: Map<string, ExtractedTimelineEvent> = new Map();

  constructor(
    config: Partial<EventExtractionConfig> = {},
    worldId: string = '',
    campaignId: string = ''
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventService = EventService.getInstance(worldId, campaignId);
  }

  /**
   * Extract events from complete transcription
   * @param segments Transcription segments
   * @param entities Extracted entities
   * @param sessionId Session ID
   * @param campaignId Campaign ID
   * @returns Extracted timeline events
   */
  async extractEventsFromTranscription(
    segments: TranscriptionSegment[],
    entities: ExtractedEntity[],
    sessionId: string,
    campaignId: string
  ): Promise<ExtractedTimelineEvent[]> {
    const events: ExtractedTimelineEvent[] = [];
    
    // Group segments into time windows
    const timeWindows = this.groupSegmentsByTimeWindows(segments);
    
    for (const window of timeWindows) {
      const windowEvents = await this.extractEventsFromWindow(
        window,
        entities,
        sessionId
      );
      events.push(...windowEvents);
    }

    // Filter and rank events
    const filteredEvents = this.filterAndRankEvents(events);
    
    // Store extracted events
    filteredEvents.forEach(event => {
      this.extractedEvents.set(event.id, event);
    });

    return filteredEvents;
  }

  /**
   * Extract events from real-time segment
   * @param segment New transcription segment
   * @param entities Current entities
   * @param sessionId Session ID
   * @returns Extracted events
   */
  async extractEventsFromSegment(
    segment: TranscriptionSegment,
    entities: ExtractedEntity[],
    sessionId: string
  ): Promise<ExtractedTimelineEvent[]> {
    if (!this.config.enableRealTimeExtraction) {
      return [];
    }

    const events: ExtractedTimelineEvent[] = [];
    
    // Check each event pattern
    for (const pattern of EVENT_PATTERNS) {
      if (!this.config.eventTypes.includes(pattern.type)) {
        continue;
      }

      const event = await this.detectEventInSegment(
        segment,
        pattern,
        entities,
        sessionId
      );

      if (event) {
        events.push(event);
        this.extractedEvents.set(event.id, event);
      }
    }

    return events;
  }

  /**
   * Convert extracted events to timeline events
   * @param extractedEvents Extracted events
   * @returns Event creation data
   */
  async convertToEvents(
    extractedEvents: ExtractedTimelineEvent[]
  ): Promise<any[]> {
    const events: any[] = [];

    for (const extractedEvent of extractedEvents) {
      if (extractedEvent.confidence >= this.config.confidenceThreshold) {
        const eventData = {
          name: extractedEvent.title,
          description: extractedEvent.description,
          type: extractedEvent.eventType,
          date: extractedEvent.timestamp,
          importance: Math.round(extractedEvent.importance * 10), // Convert to 1-10 scale
          createdBy: 'ai-system',
          isSecret: false,
          outcome: `AI-extracted from transcription (confidence: ${Math.round(extractedEvent.confidence * 100)}%)`,
          // Add metadata about the source
          metadata: {
            sourceType: 'transcription',
            confidence: extractedEvent.confidence,
            importance: extractedEvent.importance,
            sourceSegmentIds: extractedEvent.sourceSegments.map(s => s.id),
            relatedEntityIds: extractedEvent.relatedEntities.map(e => e.id)
          }
        };

        events.push(eventData);
      }
    }

    return events;
  }

  /**
   * Get event suggestions for approval
   * @param sessionId Session ID
   * @returns Pending event suggestions
   */
  getPendingEventSuggestions(sessionId: string): ExtractedTimelineEvent[] {
    return Array.from(this.extractedEvents.values())
      .filter(event => 
        event.sourceSegments.some(s => s.id.includes(sessionId)) &&
        !event.isApproved
      )
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Approve event suggestion
   * @param eventId Event ID
   * @returns Created event ID
   */
  async approveEventSuggestion(
    eventId: string
  ): Promise<string | null> {
    const extractedEvent = this.extractedEvents.get(eventId);
    if (!extractedEvent) {
      return null;
    }

    try {
      const eventData = {
        name: extractedEvent.title,
        description: extractedEvent.description,
        type: extractedEvent.eventType,
        date: extractedEvent.timestamp,
        importance: Math.round(extractedEvent.importance * 10),
        createdBy: 'ai-system',
        isSecret: false,
        outcome: `Approved AI-extracted event (confidence: ${Math.round(extractedEvent.confidence * 100)}%)`,
        metadata: {
          sourceType: 'transcription',
          confidence: extractedEvent.confidence,
          originalEventId: eventId
        }
      };

      const createdEventId = await this.eventService.create(eventData);

      // Mark as approved
      extractedEvent.isApproved = true;
      this.extractedEvents.set(eventId, extractedEvent);

      return createdEventId;
    } catch (error) {
      console.error('Failed to approve event suggestion:', error);
      return null;
    }
  }

  /**
   * Reject event suggestion
   * @param eventId Event ID
   */
  rejectEventSuggestion(eventId: string): void {
    this.extractedEvents.delete(eventId);
  }

  /**
   * Group segments into time windows
   */
  private groupSegmentsByTimeWindows(
    segments: TranscriptionSegment[]
  ): TranscriptionSegment[][] {
    const windows: TranscriptionSegment[][] = [];
    const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime);
    
    let currentWindow: TranscriptionSegment[] = [];
    let windowStartTime = 0;

    for (const segment of sortedSegments) {
      if (currentWindow.length === 0) {
        windowStartTime = segment.startTime;
        currentWindow.push(segment);
      } else if (segment.startTime - windowStartTime <= this.config.timeWindowSize) {
        currentWindow.push(segment);
      } else {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [segment];
        windowStartTime = segment.startTime;
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Extract events from a time window
   */
  private async extractEventsFromWindow(
    segments: TranscriptionSegment[],
    entities: ExtractedEntity[],
    sessionId: string
  ): Promise<ExtractedTimelineEvent[]> {
    const events: ExtractedTimelineEvent[] = [];
    const windowText = segments.map(s => s.text).join(' ');

    for (const pattern of EVENT_PATTERNS) {
      if (!this.config.eventTypes.includes(pattern.type)) {
        continue;
      }

      const event = await this.detectEventInText(
        windowText,
        segments,
        pattern,
        entities,
        sessionId
      );

      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Detect event in a single segment
   */
  private async detectEventInSegment(
    segment: TranscriptionSegment,
    pattern: EventPattern,
    entities: ExtractedEntity[],
    sessionId: string
  ): Promise<ExtractedTimelineEvent | null> {
    return this.detectEventInText(
      segment.text,
      [segment],
      pattern,
      entities,
      sessionId
    );
  }

  /**
   * Detect event in text using pattern matching
   */
  private async detectEventInText(
    text: string,
    segments: TranscriptionSegment[],
    pattern: EventPattern,
    entities: ExtractedEntity[],
    sessionId: string
  ): Promise<ExtractedTimelineEvent | null> {
    const lowerText = text.toLowerCase();
    
    // Check keyword matches
    const keywordMatches = pattern.keywords.filter(keyword =>
      lowerText.includes(keyword)
    ).length;

    // Check pattern matches
    const patternMatches = pattern.patterns.filter(regex =>
      regex.test(text)
    ).length;

    // Calculate base confidence
    let confidence = 0;
    confidence += (keywordMatches / pattern.keywords.length) * 0.4;
    confidence += (patternMatches / pattern.patterns.length) * 0.6;

    if (confidence < 0.3) {
      return null;
    }

    // Check for required entities
    if (pattern.requiresEntities) {
      const hasRequiredEntities = pattern.requiresEntities.some(entityType =>
        entities.some(entity => 
          entity.type === entityType &&
          lowerText.includes(entity.name.toLowerCase())
        )
      );

      if (!hasRequiredEntities) {
        confidence *= 0.5; // Reduce confidence if required entities are missing
      }
    }

    // Filter by confidence threshold
    if (confidence < this.config.confidenceThreshold) {
      return null;
    }

    // Find related entities
    const relatedEntities = entities.filter(entity =>
      lowerText.includes(entity.name.toLowerCase())
    );

    // Calculate importance
    const importance = this.calculateEventImportance(
      text,
      pattern,
      relatedEntities,
      segments
    );

    // Generate event
    const event: ExtractedTimelineEvent = {
      id: `extracted_${pattern.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateEventTitle(text, pattern.type),
      description: this.generateEventDescription(text, pattern.type, relatedEntities),
      eventType: pattern.type,
      timestamp: new Date(segments[0].startTime * 1000),
      duration: segments.length > 1 ? 
        (segments[segments.length - 1].endTime - segments[0].startTime) : undefined,
      confidence,
      sourceSegments: segments,
      relatedEntities,
      importance,
      isApproved: false,
      suggestedBy: 'ai'
    };

    return event;
  }

  /**
   * Calculate event importance
   */
  private calculateEventImportance(
    text: string,
    pattern: EventPattern,
    entities: ExtractedEntity[],
    segments: TranscriptionSegment[]
  ): number {
    let importance = pattern.importance;

    // Boost importance based on priority keywords
    const priorityKeywordCount = this.config.priorityKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword)
    ).length;
    importance += priorityKeywordCount * 0.1;

    // Boost importance based on entity count
    importance += Math.min(entities.length * 0.05, 0.2);

    // Boost importance based on segment confidence
    const avgConfidence = segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length;
    importance += (avgConfidence - 0.5) * 0.2;

    return Math.min(importance, 1.0);
  }

  /**
   * Generate event title
   */
  private generateEventTitle(text: string, eventType: EventType): string {
    const words = text.split(' ').slice(0, 8);
    const title = words.join(' ');
    const typePrefix = eventType.charAt(0).toUpperCase() + eventType.slice(1).toLowerCase();
    
    return `${typePrefix}: ${title}${text.split(' ').length > 8 ? '...' : ''}`;
  }

  /**
   * Generate event description
   */
  private generateEventDescription(
    text: string,
    eventType: EventType,
    entities: ExtractedEntity[]
  ): string {
    let description = text.length > 200 ? text.substring(0, 200) + '...' : text;
    
    if (entities.length > 0) {
      const entityNames = entities.map(e => e.name).join(', ');
      description += `\n\nInvolved entities: ${entityNames}`;
    }

    return description;
  }

  /**
   * Filter and rank events
   */
  private filterAndRankEvents(events: ExtractedTimelineEvent[]): ExtractedTimelineEvent[] {
    // Remove duplicates and low-confidence events
    const filteredEvents = events.filter(event =>
      event.confidence >= this.config.confidenceThreshold
    );

    // Sort by importance and confidence
    filteredEvents.sort((a, b) => {
      const scoreA = a.importance * 0.6 + a.confidence * 0.4;
      const scoreB = b.importance * 0.6 + b.confidence * 0.4;
      return scoreB - scoreA;
    });

    // Limit number of events
    return filteredEvents.slice(0, this.config.maxEventsPerSession);
  }

  /**
   * Get extraction statistics
   */
  getExtractionStats(): {
    totalExtracted: number;
    approved: number;
    pending: number;
    byType: Record<EventType, number>;
  } {
    const events = Array.from(this.extractedEvents.values());
    
    const stats = {
      totalExtracted: events.length,
      approved: events.filter(e => e.isApproved).length,
      pending: events.filter(e => !e.isApproved).length,
      byType: {} as Record<EventType, number>
    };

    // Count by type
    for (const eventType of this.config.eventTypes) {
      stats.byType[eventType] = events.filter(e => e.eventType === eventType).length;
    }

    return stats;
  }
}
