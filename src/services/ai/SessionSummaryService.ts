/**
 * Session Summary Service
 * 
 * Generates AI-powered session summaries using established Vertex AI patterns
 * Supports multiple summary lengths and styles
 */

import { SessionTranscription, TranscriptionSegment } from '../../models/Transcription';
import { VertexAIIndexService } from '../vector/VertexAIIndexService';

/**
 * Summary types
 */
export enum SummaryType {
  BRIEF = 'brief',           // 1-2 sentences
  SHORT = 'short',           // 1 paragraph
  MEDIUM = 'medium',         // 2-3 paragraphs
  DETAILED = 'detailed'      // Full detailed summary
}

/**
 * Summary style
 */
export enum SummaryStyle {
  NARRATIVE = 'narrative',   // Story-like narrative
  BULLET_POINTS = 'bullet_points', // Structured bullet points
  TIMELINE = 'timeline',     // Chronological timeline
  HIGHLIGHTS = 'highlights'  // Key highlights and moments
}

/**
 * Summary configuration
 */
export interface SummaryConfig {
  type: SummaryType;
  style: SummaryStyle;
  includeDialogue: boolean;
  includeCharacterActions: boolean;
  includeNPCInteractions: boolean;
  includeCombatDetails: boolean;
  includeDiscoveries: boolean;
  focusAreas?: string[]; // Specific areas to focus on
  excludeAreas?: string[]; // Areas to exclude
  maxLength?: number; // Maximum character length
}

/**
 * Generated summary
 */
export interface GeneratedSummary {
  id: string;
  sessionId: string;
  type: SummaryType;
  style: SummaryStyle;
  content: string;
  keyPoints: string[];
  characterMentions: string[];
  locationMentions: string[];
  importantEvents: string[];
  generatedAt: Date;
  processingTime: number;
  confidence: number;
}

/**
 * Summary prompt templates
 */
const SUMMARY_PROMPTS = {
  [SummaryType.BRIEF]: {
    [SummaryStyle.NARRATIVE]: `Summarize this RPG session transcript in 1-2 sentences, focusing on the main story developments and key events.`,
    [SummaryStyle.BULLET_POINTS]: `Create a brief bullet-point summary of this RPG session, highlighting the most important events.`,
    [SummaryStyle.TIMELINE]: `Create a brief timeline of the main events in this RPG session.`,
    [SummaryStyle.HIGHLIGHTS]: `List the top 3 highlights from this RPG session.`
  },
  [SummaryType.SHORT]: {
    [SummaryStyle.NARRATIVE]: `Write a short paragraph summarizing this RPG session, capturing the main story arc and character actions.`,
    [SummaryStyle.BULLET_POINTS]: `Create a structured summary of this RPG session using bullet points for major events and developments.`,
    [SummaryStyle.TIMELINE]: `Create a chronological timeline of events from this RPG session with timestamps.`,
    [SummaryStyle.HIGHLIGHTS]: `Identify and describe the key highlights and memorable moments from this RPG session.`
  },
  [SummaryType.MEDIUM]: {
    [SummaryStyle.NARRATIVE]: `Write a detailed narrative summary of this RPG session in 2-3 paragraphs, including character development, plot progression, and significant interactions.`,
    [SummaryStyle.BULLET_POINTS]: `Create a comprehensive bullet-point summary organized by categories: Story Progress, Character Actions, Combat Encounters, Discoveries, and NPC Interactions.`,
    [SummaryStyle.TIMELINE]: `Create a detailed timeline of this RPG session with timestamps, including major events, character actions, and story developments.`,
    [SummaryStyle.HIGHLIGHTS]: `Provide an in-depth analysis of the session highlights, including context and significance of each moment.`
  },
  [SummaryType.DETAILED]: {
    [SummaryStyle.NARRATIVE]: `Write a comprehensive narrative summary of this RPG session, including all significant events, character interactions, dialogue highlights, combat encounters, discoveries, and story developments. Maintain the narrative flow and emotional beats of the session.`,
    [SummaryStyle.BULLET_POINTS]: `Create an exhaustive bullet-point summary organized by time periods and categories, including all significant events, character actions, NPC interactions, combat details, discoveries, and story developments.`,
    [SummaryStyle.TIMELINE]: `Create a complete chronological timeline of the entire RPG session with precise timestamps, including all events, character actions, dialogue highlights, and story developments.`,
    [SummaryStyle.HIGHLIGHTS]: `Provide a comprehensive analysis of all significant moments in the session, including context, player reactions, story implications, and character development.`
  }
};

/**
 * Default summary configuration
 */
const DEFAULT_CONFIG: SummaryConfig = {
  type: SummaryType.MEDIUM,
  style: SummaryStyle.NARRATIVE,
  includeDialogue: true,
  includeCharacterActions: true,
  includeNPCInteractions: true,
  includeCombatDetails: true,
  includeDiscoveries: true
};

/**
 * Session Summary Service
 */
export class SessionSummaryService {
  private vertexAIService: VertexAIIndexService | null = null;

  constructor(vertexAIService?: VertexAIIndexService) {
    this.vertexAIService = vertexAIService || null;
  }

  /**
   * Generate session summary
   * @param transcription Session transcription
   * @param config Summary configuration
   * @returns Generated summary
   */
  async generateSummary(
    transcription: SessionTranscription,
    config: Partial<SummaryConfig> = {}
  ): Promise<GeneratedSummary> {
    const startTime = Date.now();
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    try {
      // Prepare transcript text
      const transcriptText = this.prepareTranscriptText(transcription, finalConfig);
      
      // Generate summary using AI
      const summaryContent = await this.generateSummaryContent(
        transcriptText,
        finalConfig
      );

      // Extract key information
      const keyPoints = this.extractKeyPoints(summaryContent);
      const characterMentions = this.extractCharacterMentions(transcriptText);
      const locationMentions = this.extractLocationMentions(transcriptText);
      const importantEvents = this.extractImportantEvents(summaryContent);

      const summary: GeneratedSummary = {
        id: `summary_${transcription.id}_${Date.now()}`,
        sessionId: transcription.sessionId,
        type: finalConfig.type,
        style: finalConfig.style,
        content: summaryContent,
        keyPoints,
        characterMentions,
        locationMentions,
        importantEvents,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        confidence: this.calculateSummaryConfidence(summaryContent, transcriptText)
      };

      return summary;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new Error(`Failed to generate summary: ${error}`);
    }
  }

  /**
   * Generate multiple summary variants
   * @param transcription Session transcription
   * @param types Array of summary types to generate
   * @returns Array of generated summaries
   */
  async generateMultipleSummaries(
    transcription: SessionTranscription,
    types: SummaryType[] = [SummaryType.BRIEF, SummaryType.SHORT, SummaryType.MEDIUM]
  ): Promise<GeneratedSummary[]> {
    const summaries: GeneratedSummary[] = [];

    for (const type of types) {
      try {
        const summary = await this.generateSummary(transcription, { type });
        summaries.push(summary);
      } catch (error) {
        console.error(`Failed to generate ${type} summary:`, error);
      }
    }

    return summaries;
  }

  /**
   * Generate real-time session highlights
   * @param segments Recent transcription segments
   * @param timeWindow Time window in seconds
   * @returns Highlight summary
   */
  async generateRealtimeHighlights(
    segments: TranscriptionSegment[],
    timeWindow: number = 300 // 5 minutes
  ): Promise<string> {
    const recentSegments = segments.filter(
      segment => Date.now() - segment.startTime * 1000 <= timeWindow * 1000
    );

    if (recentSegments.length === 0) {
      return 'No recent activity to highlight.';
    }

    const recentText = recentSegments.map(s => s.text).join(' ');
    
    const prompt = `Summarize the most important events from the last ${Math.floor(timeWindow / 60)} minutes of this RPG session: "${recentText}"`;
    
    try {
      return await this.callAIService(prompt, recentText);
    } catch (error) {
      console.error('Real-time highlights generation failed:', error);
      return 'Unable to generate highlights at this time.';
    }
  }

  /**
   * Prepare transcript text based on configuration
   */
  private prepareTranscriptText(
    transcription: SessionTranscription,
    config: SummaryConfig
  ): string {
    let segments = transcription.segments.filter(s => !s.isInterim);

    // Apply filters based on configuration
    if (!config.includeDialogue) {
      segments = segments.filter(s => !this.isDialogue(s.text));
    }

    if (!config.includeCharacterActions) {
      segments = segments.filter(s => !this.isCharacterAction(s.text));
    }

    if (!config.includeCombatDetails) {
      segments = segments.filter(s => !this.isCombatRelated(s.text));
    }

    // Sort by timestamp
    segments.sort((a, b) => a.startTime - b.startTime);

    // Add speaker information if available
    return segments.map(segment => {
      const speakerName = segment.speakerName || `Speaker ${segment.speakerId}`;
      const timestamp = this.formatTimestamp(segment.startTime);
      return `[${timestamp}] ${speakerName}: ${segment.text}`;
    }).join('\n');
  }

  /**
   * Generate summary content using AI
   */
  private async generateSummaryContent(
    transcriptText: string,
    config: SummaryConfig
  ): Promise<string> {
    const basePrompt = SUMMARY_PROMPTS[config.type][config.style];
    
    let enhancedPrompt = basePrompt;

    // Add focus areas
    if (config.focusAreas && config.focusAreas.length > 0) {
      enhancedPrompt += ` Focus particularly on: ${config.focusAreas.join(', ')}.`;
    }

    // Add exclusions
    if (config.excludeAreas && config.excludeAreas.length > 0) {
      enhancedPrompt += ` Avoid focusing on: ${config.excludeAreas.join(', ')}.`;
    }

    // Add length constraint
    if (config.maxLength) {
      enhancedPrompt += ` Keep the summary under ${config.maxLength} characters.`;
    }

    return await this.callAIService(enhancedPrompt, transcriptText);
  }

  /**
   * Call AI service for text generation
   */
  private async callAIService(prompt: string, context: string): Promise<string> {
    // For now, implement a simple fallback
    // In production, this would integrate with the actual Vertex AI service
    
    if (this.vertexAIService) {
      // TODO: Integrate with actual Vertex AI text generation
      // This would use the existing VertexAI patterns from the codebase
    }

    // Fallback: Simple extractive summary
    return this.generateExtractiveSummary(context, prompt);
  }

  /**
   * Generate extractive summary as fallback
   */
  private generateExtractiveSummary(text: string, prompt: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Score sentences based on keyword importance
    const scoredSentences = sentences.map(sentence => ({
      text: sentence.trim(),
      score: this.scoreSentence(sentence)
    }));

    // Sort by score and take top sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    
    const summaryLength = prompt.includes('brief') ? 2 : 
                         prompt.includes('short') ? 5 : 10;
    
    return scoredSentences
      .slice(0, summaryLength)
      .map(s => s.text)
      .join('. ') + '.';
  }

  /**
   * Score sentence importance
   */
  private scoreSentence(sentence: string): number {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();

    // Important keywords
    const importantKeywords = [
      'attack', 'combat', 'fight', 'battle', 'discover', 'find', 'secret',
      'magic', 'spell', 'treasure', 'quest', 'mission', 'character', 'npc',
      'decision', 'choose', 'important', 'critical', 'death', 'victory'
    ];

    for (const keyword of importantKeywords) {
      if (lowerSentence.includes(keyword)) {
        score += 1;
      }
    }

    // Sentence length (moderate length preferred)
    const words = sentence.split(' ').length;
    if (words >= 8 && words <= 25) {
      score += 0.5;
    }

    return score;
  }

  /**
   * Extract key points from summary
   */
  private extractKeyPoints(summary: string): string[] {
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  /**
   * Extract character mentions
   */
  private extractCharacterMentions(text: string): string[] {
    // Simple pattern matching for character names
    const characterPatterns = [
      /\b[A-Z][a-z]+ the [A-Z][a-z]+\b/g, // "Gandalf the Grey"
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g // "Aragorn" or "Frodo Baggins"
    ];

    const mentions = new Set<string>();
    
    for (const pattern of characterPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(match => mentions.add(match.trim()));
    }

    return Array.from(mentions).slice(0, 10);
  }

  /**
   * Extract location mentions
   */
  private extractLocationMentions(text: string): string[] {
    // Simple pattern matching for locations
    const locationKeywords = ['castle', 'dungeon', 'forest', 'city', 'town', 'village', 'mountain', 'cave', 'temple', 'tower'];
    const mentions = new Set<string>();

    for (const keyword of locationKeywords) {
      const regex = new RegExp(`\\b[A-Z][a-z]*\\s+${keyword}\\b`, 'gi');
      const matches = text.match(regex) || [];
      matches.forEach(match => mentions.add(match.trim()));
    }

    return Array.from(mentions).slice(0, 10);
  }

  /**
   * Extract important events
   */
  private extractImportantEvents(summary: string): string[] {
    const eventPatterns = [
      /defeated?\s+[^.!?]+/gi,
      /discovered?\s+[^.!?]+/gi,
      /found\s+[^.!?]+/gi,
      /learned\s+[^.!?]+/gi
    ];

    const events = new Set<string>();
    
    for (const pattern of eventPatterns) {
      const matches = summary.match(pattern) || [];
      matches.forEach(match => events.add(match.trim()));
    }

    return Array.from(events).slice(0, 8);
  }

  /**
   * Calculate summary confidence
   */
  private calculateSummaryConfidence(summary: string, originalText: string): number {
    const summaryWords = summary.split(' ').length;
    const originalWords = originalText.split(' ').length;
    
    // Base confidence on compression ratio and content quality
    const compressionRatio = summaryWords / originalWords;
    let confidence = 0.5;

    // Good compression ratio
    if (compressionRatio >= 0.1 && compressionRatio <= 0.3) {
      confidence += 0.3;
    }

    // Contains important keywords
    const importantKeywords = ['character', 'event', 'discover', 'combat', 'quest'];
    const keywordCount = importantKeywords.filter(keyword => 
      summary.toLowerCase().includes(keyword)
    ).length;
    
    confidence += (keywordCount / importantKeywords.length) * 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Helper methods for content filtering
   */
  private isDialogue(text: string): boolean {
    return /["'].*["']/.test(text) || /says?|said|tells?|told|asks?|asked/.test(text.toLowerCase());
  }

  private isCharacterAction(text: string): boolean {
    return /moves?|walks?|runs?|attacks?|casts?|uses?/.test(text.toLowerCase());
  }

  private isCombatRelated(text: string): boolean {
    return /combat|fight|attack|damage|hit|miss|initiative|roll/.test(text.toLowerCase());
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
