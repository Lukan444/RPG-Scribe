/**
 * Transcription AI Analysis Service
 * 
 * Integrates with existing VertexAIIndexService to provide AI-powered analysis
 * of transcription content including entity extraction, timeline events, and relationships
 */

import { VertexAIIndexService } from '../vector/VertexAIIndexService';
import { AISearchService } from '../search/AISearchService';
import { 
  TranscriptionSegment, 
  ExtractedEntity, 
  TimelineEventSuggestion, 
  RelationshipSuggestion,
  SessionTranscription
} from '../../models/Transcription';
import { EntityType } from '../../models/EntityType';

/**
 * AI analysis configuration
 */
export interface AIAnalysisConfig {
  entityExtractionEnabled: boolean;
  timelineEventDetectionEnabled: boolean;
  relationshipInferenceEnabled: boolean;
  summaryGenerationEnabled: boolean;
  confidenceThreshold: number;
  maxEntitiesPerSegment: number;
  maxEventsPerSession: number;
  languageCode: string;
}

/**
 * Analysis result
 */
export interface TranscriptionAnalysisResult {
  extractedEntities: ExtractedEntity[];
  timelineEvents: TimelineEventSuggestion[];
  relationshipSuggestions: RelationshipSuggestion[];
  summary?: string;
  keyMoments: KeyMoment[];
  speakerInsights: SpeakerInsight[];
  processingTime: number;
}

/**
 * Key moment in the session
 */
export interface KeyMoment {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  importance: number; // 0-1 scale
  segmentIds: string[];
  entities: string[];
  type: 'combat' | 'roleplay' | 'discovery' | 'decision' | 'other';
}

/**
 * Speaker insight
 */
export interface SpeakerInsight {
  speakerId: string;
  speakerName?: string;
  totalSpeakingTime: number;
  wordCount: number;
  averageConfidence: number;
  dominantEmotions: string[];
  characterVoices: string[]; // Detected character names they spoke as
  keyQuotes: string[];
}

/**
 * Entity extraction prompt templates
 */
const ENTITY_EXTRACTION_PROMPTS = {
  characters: `Extract character names mentioned in this RPG session transcript. Include both player characters and NPCs. Return as JSON array with name, type (PC/NPC), and confidence.`,
  locations: `Extract location names mentioned in this RPG session transcript. Include cities, dungeons, regions, buildings, etc. Return as JSON array with name, type, and confidence.`,
  items: `Extract item names mentioned in this RPG session transcript. Include weapons, armor, magical items, treasures, etc. Return as JSON array with name, type, and confidence.`,
  events: `Extract significant events from this RPG session transcript. Include combat encounters, story developments, discoveries, etc. Return as JSON array with event, timestamp, and importance.`
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AIAnalysisConfig = {
  entityExtractionEnabled: true,
  timelineEventDetectionEnabled: true,
  relationshipInferenceEnabled: true,
  summaryGenerationEnabled: true,
  confidenceThreshold: 0.7,
  maxEntitiesPerSegment: 10,
  maxEventsPerSession: 50,
  languageCode: 'en-US'
};

/**
 * Transcription AI Analysis Service
 */
export class TranscriptionAIAnalysisService {
  private config: AIAnalysisConfig;
  private vertexAIService: VertexAIIndexService | null = null;
  private aiSearchService: AISearchService;

  constructor(
    config: Partial<AIAnalysisConfig> = {},
    vertexAIService?: VertexAIIndexService
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.vertexAIService = vertexAIService || null;
    this.aiSearchService = new AISearchService();
  }

  /**
   * Analyze complete transcription
   * @param transcription Session transcription
   * @param campaignId Campaign ID for context
   * @param worldId World ID for context
   * @returns Analysis results
   */
  async analyzeTranscription(
    transcription: SessionTranscription,
    campaignId: string,
    worldId: string
  ): Promise<TranscriptionAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const results: TranscriptionAnalysisResult = {
        extractedEntities: [],
        timelineEvents: [],
        relationshipSuggestions: [],
        keyMoments: [],
        speakerInsights: [],
        processingTime: 0
      };

      // Extract entities from segments
      if (this.config.entityExtractionEnabled) {
        results.extractedEntities = await this.extractEntities(
          transcription.segments,
          campaignId,
          worldId
        );
      }

      // Detect timeline events
      if (this.config.timelineEventDetectionEnabled) {
        results.timelineEvents = await this.detectTimelineEvents(
          transcription.segments,
          results.extractedEntities
        );
      }

      // Infer relationships
      if (this.config.relationshipInferenceEnabled) {
        results.relationshipSuggestions = await this.inferRelationships(
          transcription.segments,
          results.extractedEntities
        );
      }

      // Generate summary
      if (this.config.summaryGenerationEnabled) {
        results.summary = await this.generateSummary(transcription);
      }

      // Identify key moments
      results.keyMoments = await this.identifyKeyMoments(
        transcription.segments,
        results.extractedEntities
      );

      // Analyze speakers
      results.speakerInsights = await this.analyzeSpeakers(
        transcription.segments,
        transcription.speakers
      );

      results.processingTime = Date.now() - startTime;
      return results;
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`Transcription analysis failed: ${error}`);
    }
  }

  /**
   * Analyze real-time segment
   * @param segment Transcription segment
   * @param campaignId Campaign ID
   * @param worldId World ID
   * @returns Extracted entities and events
   */
  async analyzeSegment(
    segment: TranscriptionSegment,
    campaignId: string,
    worldId: string
  ): Promise<{
    entities: ExtractedEntity[];
    events: TimelineEventSuggestion[];
  }> {
    try {
      const entities = await this.extractEntitiesFromText(
        segment.text,
        campaignId,
        worldId
      );

      const events = await this.detectEventsFromSegment(segment, entities);

      return { entities, events };
    } catch (error) {
      console.error('Segment analysis failed:', error);
      return { entities: [], events: [] };
    }
  }

  /**
   * Extract entities from transcription segments
   */
  private async extractEntities(
    segments: TranscriptionSegment[],
    campaignId: string,
    worldId: string
  ): Promise<ExtractedEntity[]> {
    const allEntities: ExtractedEntity[] = [];
    
    for (const segment of segments) {
      if (segment.confidence >= this.config.confidenceThreshold) {
        const entities = await this.extractEntitiesFromText(
          segment.text,
          campaignId,
          worldId
        );
        allEntities.push(...entities);
      }
    }

    // Deduplicate and merge similar entities
    return this.deduplicateEntities(allEntities);
  }

  /**
   * Extract entities from text using AI
   */
  private async extractEntitiesFromText(
    text: string,
    campaignId: string,
    worldId: string
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    try {
      // Use existing AI search service to find similar entities
      const searchResults = await this.aiSearchService.search(text, {
        campaignId,
        worldId,
        entityTypes: [
          EntityType.CHARACTER,
          EntityType.LOCATION,
          EntityType.ITEM,
          EntityType.EVENT
        ],
        limit: this.config.maxEntitiesPerSegment
      });

      // Convert search results to extracted entities
      for (const result of searchResults) {
        if (result.confidence >= this.config.confidenceThreshold) {
          const entity: ExtractedEntity = {
            id: `extracted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: result.type,
            name: result.name,
            confidence: result.confidence,
            startOffset: 0, // Would need NLP to find exact position
            endOffset: result.name.length,
            existingEntityId: result.isExactMatch ? result.id : undefined,
            isNewEntity: !result.isExactMatch
          };
          entities.push(entity);
        }
      }

      return entities;
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Detect timeline events from segments
   */
  private async detectTimelineEvents(
    segments: TranscriptionSegment[],
    entities: ExtractedEntity[]
  ): Promise<TimelineEventSuggestion[]> {
    const events: TimelineEventSuggestion[] = [];
    
    // Group segments by time windows (e.g., 5-minute chunks)
    const timeWindows = this.groupSegmentsByTimeWindows(segments, 300); // 5 minutes
    
    for (const window of timeWindows) {
      const windowText = window.segments.map(s => s.text).join(' ');
      const windowEntities = entities.filter(e => 
        window.segments.some(s => s.text.toLowerCase().includes(e.name.toLowerCase()))
      );

      // Detect significant events using keyword analysis
      const eventSuggestion = await this.detectEventFromText(
        windowText,
        window.startTime,
        windowEntities,
        window.segments.map(s => s.id)
      );

      if (eventSuggestion) {
        events.push(eventSuggestion);
      }
    }

    return events.slice(0, this.config.maxEventsPerSession);
  }

  /**
   * Detect events from a single segment
   */
  private async detectEventsFromSegment(
    segment: TranscriptionSegment,
    entities: ExtractedEntity[]
  ): Promise<TimelineEventSuggestion[]> {
    const events: TimelineEventSuggestion[] = [];
    
    const eventSuggestion = await this.detectEventFromText(
      segment.text,
      segment.startTime,
      entities,
      [segment.id]
    );

    if (eventSuggestion) {
      events.push(eventSuggestion);
    }

    return events;
  }

  /**
   * Detect event from text using pattern matching
   */
  private async detectEventFromText(
    text: string,
    timestamp: number,
    entities: ExtractedEntity[],
    segmentIds: string[]
  ): Promise<TimelineEventSuggestion | null> {
    const lowerText = text.toLowerCase();
    
    // Event detection patterns
    const eventPatterns = [
      { pattern: /attack|combat|fight|battle|initiative/i, type: 'combat', importance: 0.8 },
      { pattern: /discover|find|found|reveal|uncover/i, type: 'discovery', importance: 0.7 },
      { pattern: /decide|choose|vote|agree/i, type: 'decision', importance: 0.6 },
      { pattern: /talk|speak|conversation|dialogue/i, type: 'roleplay', importance: 0.5 },
      { pattern: /level up|gain|learn|acquire/i, type: 'progression', importance: 0.7 }
    ];

    for (const { pattern, type, importance } of eventPatterns) {
      if (pattern.test(text)) {
        return {
          id: `event_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp,
          eventType: type,
          title: this.generateEventTitle(text, type),
          description: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          confidence: importance,
          sourceSegmentIds: segmentIds,
          entities: entities.map(e => e.id)
        };
      }
    }

    return null;
  }

  /**
   * Generate event title from text
   */
  private generateEventTitle(text: string, eventType: string): string {
    const words = text.split(' ').slice(0, 8).join(' ');
    const typePrefix = eventType.charAt(0).toUpperCase() + eventType.slice(1);
    return `${typePrefix}: ${words}${text.split(' ').length > 8 ? '...' : ''}`;
  }

  /**
   * Infer relationships between entities
   */
  private async inferRelationships(
    segments: TranscriptionSegment[],
    entities: ExtractedEntity[]
  ): Promise<RelationshipSuggestion[]> {
    const relationships: RelationshipSuggestion[] = [];
    
    // Simple co-occurrence based relationship inference
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        // Find segments where both entities appear
        const coOccurrenceSegments = segments.filter(segment =>
          segment.text.toLowerCase().includes(entity1.name.toLowerCase()) &&
          segment.text.toLowerCase().includes(entity2.name.toLowerCase())
        );

        if (coOccurrenceSegments.length > 0) {
          const relationshipType = this.inferRelationshipType(
            entity1.type,
            entity2.type,
            coOccurrenceSegments
          );

          if (relationshipType) {
            relationships.push({
              id: `rel_${entity1.id}_${entity2.id}`,
              sourceEntityId: entity1.existingEntityId || entity1.id,
              targetEntityId: entity2.existingEntityId || entity2.id,
              relationshipType,
              description: `Relationship inferred from session transcript`,
              confidence: Math.min(entity1.confidence, entity2.confidence),
              sourceSegmentIds: coOccurrenceSegments.map(s => s.id)
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Infer relationship type between entities
   */
  private inferRelationshipType(
    type1: EntityType,
    type2: EntityType,
    segments: TranscriptionSegment[]
  ): string | null {
    const combinedText = segments.map(s => s.text).join(' ').toLowerCase();

    // Character-Character relationships
    if (type1 === EntityType.CHARACTER && type2 === EntityType.CHARACTER) {
      if (/ally|friend|companion|party|team/i.test(combinedText)) return 'ally';
      if (/enemy|foe|rival|opponent/i.test(combinedText)) return 'enemy';
      if (/knows|met|familiar/i.test(combinedText)) return 'knows';
      return 'interacts_with';
    }

    // Character-Location relationships
    if ((type1 === EntityType.CHARACTER && type2 === EntityType.LOCATION) ||
        (type1 === EntityType.LOCATION && type2 === EntityType.CHARACTER)) {
      if (/visit|go to|travel|arrive/i.test(combinedText)) return 'visits';
      if (/live|home|residence/i.test(combinedText)) return 'lives_in';
      return 'associated_with';
    }

    // Character-Item relationships
    if ((type1 === EntityType.CHARACTER && type2 === EntityType.ITEM) ||
        (type1 === EntityType.ITEM && type2 === EntityType.CHARACTER)) {
      if (/own|possess|carry|wield/i.test(combinedText)) return 'owns';
      if (/use|equip|wear/i.test(combinedText)) return 'uses';
      return 'associated_with';
    }

    return 'related_to';
  }

  /**
   * Generate session summary
   */
  private async generateSummary(transcription: SessionTranscription): Promise<string> {
    const fullText = transcription.fullText || 
      transcription.segments.map(s => s.text).join(' ');
    
    // Simple extractive summary - take first and last parts
    const words = fullText.split(' ');
    if (words.length <= 100) {
      return fullText;
    }

    const beginning = words.slice(0, 50).join(' ');
    const ending = words.slice(-50).join(' ');
    
    return `${beginning}... ${ending}`;
  }

  /**
   * Identify key moments in the session
   */
  private async identifyKeyMoments(
    segments: TranscriptionSegment[],
    entities: ExtractedEntity[]
  ): Promise<KeyMoment[]> {
    const moments: KeyMoment[] = [];
    
    // Group segments and identify high-importance moments
    const timeWindows = this.groupSegmentsByTimeWindows(segments, 180); // 3 minutes
    
    for (const window of timeWindows) {
      const importance = this.calculateMomentImportance(window.segments, entities);
      
      if (importance > 0.6) {
        moments.push({
          id: `moment_${window.startTime}`,
          timestamp: window.startTime,
          title: this.generateMomentTitle(window.segments),
          description: window.segments.map(s => s.text).join(' ').substring(0, 200),
          importance,
          segmentIds: window.segments.map(s => s.id),
          entities: entities.filter(e => 
            window.segments.some(s => s.text.includes(e.name))
          ).map(e => e.id),
          type: this.classifyMomentType(window.segments)
        });
      }
    }

    return moments.sort((a, b) => b.importance - a.importance).slice(0, 10);
  }

  /**
   * Analyze speakers
   */
  private async analyzeSpeakers(
    segments: TranscriptionSegment[],
    speakers: any[]
  ): Promise<SpeakerInsight[]> {
    const insights: SpeakerInsight[] = [];
    
    const speakerMap = new Map<string, TranscriptionSegment[]>();
    
    // Group segments by speaker
    for (const segment of segments) {
      const speakerId = segment.speakerId || 'unknown';
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, []);
      }
      speakerMap.get(speakerId)!.push(segment);
    }

    // Analyze each speaker
    for (const [speakerId, speakerSegments] of speakerMap.entries()) {
      const totalTime = speakerSegments.reduce(
        (sum, segment) => sum + (segment.endTime - segment.startTime), 0
      );
      
      const wordCount = speakerSegments.reduce(
        (sum, segment) => sum + segment.text.split(' ').length, 0
      );
      
      const avgConfidence = speakerSegments.reduce(
        (sum, segment) => sum + segment.confidence, 0
      ) / speakerSegments.length;

      insights.push({
        speakerId,
        speakerName: speakers.find(s => s.id === speakerId)?.name,
        totalSpeakingTime: totalTime,
        wordCount,
        averageConfidence: avgConfidence,
        dominantEmotions: [], // Would need emotion analysis
        characterVoices: [], // Would need character voice detection
        keyQuotes: this.extractKeyQuotes(speakerSegments)
      });
    }

    return insights;
  }

  /**
   * Helper methods
   */
  private groupSegmentsByTimeWindows(
    segments: TranscriptionSegment[],
    windowSize: number
  ): { startTime: number; endTime: number; segments: TranscriptionSegment[] }[] {
    const windows: { startTime: number; endTime: number; segments: TranscriptionSegment[] }[] = [];
    
    if (segments.length === 0) return windows;
    
    const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime);
    let currentWindow = {
      startTime: sortedSegments[0].startTime,
      endTime: sortedSegments[0].startTime + windowSize,
      segments: [] as TranscriptionSegment[]
    };

    for (const segment of sortedSegments) {
      if (segment.startTime >= currentWindow.endTime) {
        if (currentWindow.segments.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = {
          startTime: segment.startTime,
          endTime: segment.startTime + windowSize,
          segments: []
        };
      }
      currentWindow.segments.push(segment);
    }

    if (currentWindow.segments.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const uniqueEntities = new Map<string, ExtractedEntity>();
    
    for (const entity of entities) {
      const key = `${entity.type}_${entity.name.toLowerCase()}`;
      const existing = uniqueEntities.get(key);
      
      if (!existing || entity.confidence > existing.confidence) {
        uniqueEntities.set(key, entity);
      }
    }

    return Array.from(uniqueEntities.values());
  }

  private calculateMomentImportance(
    segments: TranscriptionSegment[],
    entities: ExtractedEntity[]
  ): number {
    let importance = 0;
    
    const text = segments.map(s => s.text).join(' ').toLowerCase();
    
    // High importance keywords
    const highImportancePatterns = [
      /combat|fight|attack|battle/i,
      /discover|revelation|secret/i,
      /death|die|kill/i,
      /magic|spell|artifact/i
    ];

    for (const pattern of highImportancePatterns) {
      if (pattern.test(text)) importance += 0.3;
    }

    // Entity density
    const entityMentions = entities.filter(e => 
      text.includes(e.name.toLowerCase())
    ).length;
    importance += Math.min(entityMentions * 0.1, 0.4);

    return Math.min(importance, 1.0);
  }

  private generateMomentTitle(segments: TranscriptionSegment[]): string {
    const text = segments.map(s => s.text).join(' ');
    const words = text.split(' ').slice(0, 6).join(' ');
    return words + (text.split(' ').length > 6 ? '...' : '');
  }

  private classifyMomentType(segments: TranscriptionSegment[]): KeyMoment['type'] {
    const text = segments.map(s => s.text).join(' ').toLowerCase();
    
    if (/combat|fight|attack|battle/i.test(text)) return 'combat';
    if (/discover|find|reveal/i.test(text)) return 'discovery';
    if (/decide|choose|vote/i.test(text)) return 'decision';
    if (/talk|speak|conversation/i.test(text)) return 'roleplay';
    
    return 'other';
  }

  private extractKeyQuotes(segments: TranscriptionSegment[]): string[] {
    return segments
      .filter(s => s.text.length > 20 && s.confidence > 0.8)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(s => s.text);
  }
}
