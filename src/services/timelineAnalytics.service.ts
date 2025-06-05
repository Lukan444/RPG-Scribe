/**
 * Timeline Analytics Service
 * Advanced analytics for timeline data including gap detection and narrative flow analysis
 */

import { TimelineEventData } from './timelineDataIntegration.service';
import { TimelineConflict } from './timelineConflictDetection.service';

export interface TimelineGap {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  type: 'session' | 'narrative' | 'character' | 'location';
  severity: 'minor' | 'moderate' | 'significant' | 'major';
  description: string;
  suggestions: string[];
  affectedEntities: string[];
}

export interface NarrativeFlowAnalysis {
  pacing: {
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
  continuity: {
    score: number; // 0-100
    breaks: Array<{
      eventId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  characterDevelopment: {
    score: number; // 0-100
    characters: Array<{
      characterId: string;
      developmentScore: number;
      milestones: number;
      gaps: TimelineGap[];
    }>;
  };
  worldBuilding: {
    score: number; // 0-100
    locationCoverage: number;
    factionInvolvement: number;
    worldEvents: number;
  };
}

export interface TimelineMetrics {
  totalEvents: number;
  timeSpan: {
    realWorld: { start: Date; end: Date; duration: number };
    inGame: { start: Date; end: Date; duration: number };
  };
  eventDensity: {
    realWorld: number; // events per day
    inGame: number; // events per game day
  };
  participantActivity: Array<{
    participantId: string;
    eventCount: number;
    lastActivity: Date;
    activityScore: number;
  }>;
  locationUsage: Array<{
    locationId: string;
    eventCount: number;
    lastUsed: Date;
    usageScore: number;
  }>;
  gaps: TimelineGap[];
  conflicts: TimelineConflict[];
}

/**
 * Timeline Analytics Service
 * Provides comprehensive analytics for timeline data
 */
export class TimelineAnalyticsService {
  private static instance: TimelineAnalyticsService;

  private constructor() {}

  public static getInstance(): TimelineAnalyticsService {
    if (!TimelineAnalyticsService.instance) {
      TimelineAnalyticsService.instance = new TimelineAnalyticsService();
    }
    return TimelineAnalyticsService.instance;
  }

  /**
   * Generate comprehensive timeline metrics
   */
  public generateMetrics(
    events: TimelineEventData[],
    conflicts: TimelineConflict[] = []
  ): TimelineMetrics {
    if (events.length === 0) {
      return this.getEmptyMetrics();
    }

    const sortedEvents = [...events].sort((a, b) => 
      a.realWorldTime.getTime() - b.realWorldTime.getTime()
    );

    const timeSpan = this.calculateTimeSpan(sortedEvents);
    const eventDensity = this.calculateEventDensity(sortedEvents, timeSpan);
    const participantActivity = this.analyzeParticipantActivity(sortedEvents);
    const locationUsage = this.analyzeLocationUsage(sortedEvents);
    const gaps = this.detectTimelineGaps(sortedEvents);

    return {
      totalEvents: events.length,
      timeSpan,
      eventDensity,
      participantActivity,
      locationUsage,
      gaps,
      conflicts
    };
  }

  /**
   * Analyze narrative flow of the timeline
   */
  public analyzeNarrativeFlow(events: TimelineEventData[]): NarrativeFlowAnalysis {
    const pacing = this.analyzePacing(events);
    const continuity = this.analyzeContinuity(events);
    const characterDevelopment = this.analyzeCharacterDevelopment(events);
    const worldBuilding = this.analyzeWorldBuilding(events);

    return {
      pacing,
      continuity,
      characterDevelopment,
      worldBuilding
    };
  }

  /**
   * Detect gaps in timeline
   */
  public detectTimelineGaps(events: TimelineEventData[]): TimelineGap[] {
    const gaps: TimelineGap[] = [];
    
    if (events.length < 2) return gaps;

    const sortedEvents = [...events].sort((a, b) => 
      a.realWorldTime.getTime() - b.realWorldTime.getTime()
    );

    // Detect session gaps (real-world time)
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      const gapDuration = next.realWorldTime.getTime() - current.realWorldTime.getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // Consider gaps longer than 7 days significant
      if (gapDuration > 7 * dayInMs) {
        gaps.push({
          id: `session-gap-${current.id}-${next.id}`,
          startTime: current.realWorldTime,
          endTime: next.realWorldTime,
          duration: gapDuration,
          type: 'session',
          severity: this.calculateGapSeverity(gapDuration, 'session'),
          description: `${Math.round(gapDuration / dayInMs)} day gap between sessions`,
          suggestions: [
            'Consider adding interim events',
            'Document what happened during the gap',
            'Add character development events'
          ],
          affectedEntities: [current.entityId, next.entityId].filter(Boolean) as string[]
        });
      }
    }

    // Detect character activity gaps
    gaps.push(...this.detectCharacterGaps(events));

    // Detect location gaps
    gaps.push(...this.detectLocationGaps(events));

    return gaps;
  }

  /**
   * Calculate timeline health score
   */
  public calculateHealthScore(metrics: TimelineMetrics): number {
    let score = 100;

    // Deduct for conflicts
    score -= metrics.conflicts.length * 5;

    // Deduct for significant gaps
    const significantGaps = metrics.gaps.filter(g => 
      g.severity === 'significant' || g.severity === 'major'
    );
    score -= significantGaps.length * 10;

    // Deduct for low activity
    const lowActivityParticipants = metrics.participantActivity.filter(p => 
      p.activityScore < 50
    );
    score -= lowActivityParticipants.length * 3;

    // Bonus for good event density
    if (metrics.eventDensity.realWorld > 0.1 && metrics.eventDensity.realWorld < 2) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate time span of events
   */
  private calculateTimeSpan(events: TimelineEventData[]) {
    const realWorldTimes = events.map(e => e.realWorldTime.getTime());
    const inGameTimes = events.map(e => e.inGameTime.getTime());

    return {
      realWorld: {
        start: new Date(Math.min(...realWorldTimes)),
        end: new Date(Math.max(...realWorldTimes)),
        duration: Math.max(...realWorldTimes) - Math.min(...realWorldTimes)
      },
      inGame: {
        start: new Date(Math.min(...inGameTimes)),
        end: new Date(Math.max(...inGameTimes)),
        duration: Math.max(...inGameTimes) - Math.min(...inGameTimes)
      }
    };
  }

  /**
   * Calculate event density
   */
  private calculateEventDensity(events: TimelineEventData[], timeSpan: any) {
    const dayInMs = 24 * 60 * 60 * 1000;
    
    return {
      realWorld: timeSpan.realWorld.duration > 0 
        ? events.length / (timeSpan.realWorld.duration / dayInMs)
        : 0,
      inGame: timeSpan.inGame.duration > 0 
        ? events.length / (timeSpan.inGame.duration / dayInMs)
        : 0
    };
  }

  /**
   * Analyze participant activity
   */
  private analyzeParticipantActivity(events: TimelineEventData[]) {
    const participantMap = new Map<string, {
      eventCount: number;
      lastActivity: Date;
      events: TimelineEventData[];
    }>();

    // Collect participant data
    for (const event of events) {
      if (event.participants) {
        for (const participantId of event.participants) {
          if (!participantMap.has(participantId)) {
            participantMap.set(participantId, {
              eventCount: 0,
              lastActivity: event.realWorldTime,
              events: []
            });
          }
          
          const participant = participantMap.get(participantId)!;
          participant.eventCount++;
          participant.events.push(event);
          
          if (event.realWorldTime > participant.lastActivity) {
            participant.lastActivity = event.realWorldTime;
          }
        }
      }
    }

    // Calculate activity scores
    const now = new Date();
    const maxEvents = Math.max(...Array.from(participantMap.values()).map(p => p.eventCount));
    
    return Array.from(participantMap.entries()).map(([participantId, data]) => {
      const daysSinceLastActivity = (now.getTime() - data.lastActivity.getTime()) / (24 * 60 * 60 * 1000);
      const eventScore = maxEvents > 0 ? (data.eventCount / maxEvents) * 50 : 0;
      const recencyScore = Math.max(0, 50 - daysSinceLastActivity);
      
      return {
        participantId,
        eventCount: data.eventCount,
        lastActivity: data.lastActivity,
        activityScore: Math.round(eventScore + recencyScore)
      };
    });
  }

  /**
   * Analyze location usage
   */
  private analyzeLocationUsage(events: TimelineEventData[]) {
    const locationMap = new Map<string, {
      eventCount: number;
      lastUsed: Date;
      events: TimelineEventData[];
    }>();

    // Collect location data
    for (const event of events) {
      if (event.locations) {
        for (const locationId of event.locations) {
          if (!locationMap.has(locationId)) {
            locationMap.set(locationId, {
              eventCount: 0,
              lastUsed: event.realWorldTime,
              events: []
            });
          }
          
          const location = locationMap.get(locationId)!;
          location.eventCount++;
          location.events.push(event);
          
          if (event.realWorldTime > location.lastUsed) {
            location.lastUsed = event.realWorldTime;
          }
        }
      }
    }

    // Calculate usage scores
    const now = new Date();
    const maxEvents = Math.max(...Array.from(locationMap.values()).map(l => l.eventCount));
    
    return Array.from(locationMap.entries()).map(([locationId, data]) => {
      const daysSinceLastUsed = (now.getTime() - data.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
      const eventScore = maxEvents > 0 ? (data.eventCount / maxEvents) * 50 : 0;
      const recencyScore = Math.max(0, 50 - daysSinceLastUsed);
      
      return {
        locationId,
        eventCount: data.eventCount,
        lastUsed: data.lastUsed,
        usageScore: Math.round(eventScore + recencyScore)
      };
    });
  }

  /**
   * Detect character-specific gaps
   */
  private detectCharacterGaps(events: TimelineEventData[]): TimelineGap[] {
    const gaps: TimelineGap[] = [];
    const characterEvents = new Map<string, TimelineEventData[]>();

    // Group events by character
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

    // Check for gaps in character activity
    for (const [characterId, charEvents] of characterEvents) {
      const sortedCharEvents = charEvents.sort((a, b) => 
        a.realWorldTime.getTime() - b.realWorldTime.getTime()
      );

      for (let i = 0; i < sortedCharEvents.length - 1; i++) {
        const current = sortedCharEvents[i];
        const next = sortedCharEvents[i + 1];
        
        const gapDuration = next.realWorldTime.getTime() - current.realWorldTime.getTime();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        // Consider character gaps longer than 14 days significant
        if (gapDuration > 14 * dayInMs) {
          gaps.push({
            id: `character-gap-${characterId}-${current.id}-${next.id}`,
            startTime: current.realWorldTime,
            endTime: next.realWorldTime,
            duration: gapDuration,
            type: 'character',
            severity: this.calculateGapSeverity(gapDuration, 'character'),
            description: `Character inactive for ${Math.round(gapDuration / dayInMs)} days`,
            suggestions: [
              'Add character development events',
              'Document character activities during gap',
              'Consider character subplot events'
            ],
            affectedEntities: [characterId]
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Detect location-specific gaps
   */
  private detectLocationGaps(events: TimelineEventData[]): TimelineGap[] {
    // Similar to character gaps but for locations
    // Implementation would be similar to detectCharacterGaps
    return [];
  }

  /**
   * Calculate gap severity
   */
  private calculateGapSeverity(duration: number, type: string): 'minor' | 'moderate' | 'significant' | 'major' {
    const dayInMs = 24 * 60 * 60 * 1000;
    const days = duration / dayInMs;

    if (type === 'session') {
      if (days > 60) return 'major';
      if (days > 30) return 'significant';
      if (days > 14) return 'moderate';
      return 'minor';
    }

    if (type === 'character') {
      if (days > 90) return 'major';
      if (days > 45) return 'significant';
      if (days > 21) return 'moderate';
      return 'minor';
    }

    return 'minor';
  }

  /**
   * Analyze pacing
   */
  private analyzePacing(events: TimelineEventData[]) {
    // Simplified pacing analysis
    const score = events.length > 10 ? 80 : Math.max(20, events.length * 8);
    
    return {
      score,
      issues: score < 60 ? ['Timeline may be too sparse', 'Consider adding more events'] : [],
      recommendations: score < 60 ? ['Add interim events', 'Develop subplots'] : ['Maintain current pacing']
    };
  }

  /**
   * Analyze continuity
   */
  private analyzeContinuity(events: TimelineEventData[]) {
    // Simplified continuity analysis
    const score = 85; // Placeholder
    
    return {
      score,
      breaks: []
    };
  }

  /**
   * Analyze character development
   */
  private analyzeCharacterDevelopment(events: TimelineEventData[]) {
    // Simplified character development analysis
    const score = 75; // Placeholder
    
    return {
      score,
      characters: []
    };
  }

  /**
   * Analyze world building
   */
  private analyzeWorldBuilding(events: TimelineEventData[]) {
    // Simplified world building analysis
    const score = 70; // Placeholder
    
    return {
      score,
      locationCoverage: 60,
      factionInvolvement: 40,
      worldEvents: events.length
    };
  }

  /**
   * Get empty metrics for when no events exist
   */
  private getEmptyMetrics(): TimelineMetrics {
    const now = new Date();
    return {
      totalEvents: 0,
      timeSpan: {
        realWorld: { start: now, end: now, duration: 0 },
        inGame: { start: now, end: now, duration: 0 }
      },
      eventDensity: { realWorld: 0, inGame: 0 },
      participantActivity: [],
      locationUsage: [],
      gaps: [],
      conflicts: []
    };
  }
}

// Export singleton instance
export const timelineAnalytics = TimelineAnalyticsService.getInstance();
