/**
 * Transcription Models
 * 
 * Core models for Live Session Transcription & AI Assistant feature
 * Supports real-time audio transcription, speaker identification, and AI analysis
 */

import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Audio source types for transcription
 */
export enum AudioSourceType {
  MICROPHONE = 'microphone',
  FILE_UPLOAD = 'file_upload',
  DISCORD_BOT = 'discord_bot',
  STREAM = 'stream'
}

/**
 * Transcription status
 */
export enum TranscriptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Speaker identification confidence levels
 */
export enum SpeakerConfidence {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  UNKNOWN = 'unknown'
}

/**
 * Transcription segment representing a single speaker utterance
 */
export interface TranscriptionSegment {
  id: string;
  startTime: number; // Seconds from session start
  endTime: number;
  text: string;
  speakerId?: string; // Speaker identification
  speakerName?: string; // Human-readable speaker name
  confidence: number; // 0-1 confidence score
  speakerConfidence: SpeakerConfidence;
  isInterim?: boolean; // True for real-time partial results
  language?: string; // Detected language code
  entities?: ExtractedEntity[]; // AI-detected entities
  emotions?: EmotionAnalysis; // Optional emotion detection
}

/**
 * Extracted entity from transcription
 */
export interface ExtractedEntity {
  id: string;
  type: EntityType;
  name: string;
  confidence: number;
  startOffset: number; // Character offset in segment text
  endOffset: number;
  existingEntityId?: string; // Link to existing entity if found
  isNewEntity: boolean;
}

/**
 * Emotion analysis for transcription segments
 */
export interface EmotionAnalysis {
  primary: string; // Primary emotion
  confidence: number;
  emotions: Record<string, number>; // Emotion scores
}

/**
 * Session transcription model
 */
export interface SessionTranscription extends BaseEntity {
  entityType: EntityType.SESSION;
  
  // Session reference
  sessionId: string;
  campaignId: string;
  worldId: string;
  
  // Audio metadata
  audioSource: AudioSourceType;
  audioFormat?: string; // 'wav', 'mp3', 'webm', etc.
  audioDuration?: number; // Total duration in seconds
  audioFileUrl?: string; // Storage URL for uploaded files
  audioFileSize?: number; // File size in bytes
  
  // Transcription metadata
  status: TranscriptionStatus;
  language: string; // Primary language code
  provider: string; // 'vertex-ai', 'openai-whisper', 'browser-api'
  model?: string; // Specific model used
  
  // Transcription content
  segments: TranscriptionSegment[];
  fullText?: string; // Complete transcription text
  summary?: string; // AI-generated summary
  
  // Speaker information
  speakers: SpeakerInfo[];
  speakerCount?: number;
  
  // Processing metadata
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingDuration?: number; // Processing time in seconds
  
  // Real-time session data
  isLiveSession: boolean;
  liveSessionStartedAt?: Date;
  liveSessionEndedAt?: Date;
  
  // AI analysis results
  extractedEntities: ExtractedEntity[];
  timelineEvents: TimelineEventSuggestion[];
  relationshipSuggestions: RelationshipSuggestion[];
  
  // Quality metrics
  averageConfidence?: number;
  wordCount?: number;
  errorCount?: number;
  
  // Discord integration
  discordChannelId?: string;
  discordGuildId?: string;
  discordBotUserId?: string;
}

/**
 * Speaker information
 */
export interface SpeakerInfo {
  id: string;
  name?: string; // Human-assigned name
  characterId?: string; // Link to character entity
  voiceProfile?: VoiceProfile; // Voice characteristics
  segmentCount: number;
  totalSpeakingTime: number; // Seconds
  averageConfidence: number;
}

/**
 * Voice profile for speaker identification
 */
export interface VoiceProfile {
  id: string;
  speakerId: string;
  embedding?: number[]; // Voice embedding vector
  characteristics: {
    pitch: number;
    tone: string;
    accent?: string;
    gender?: string;
  };
  trainingSegments: string[]; // Segment IDs used for training
  confidence: number;
  lastUpdated: Date;
}

/**
 * Timeline event suggestion from transcription
 */
export interface TimelineEventSuggestion {
  id: string;
  timestamp: number; // Seconds from session start
  eventType: string;
  title: string;
  description: string;
  confidence: number;
  sourceSegmentIds: string[];
  entities: string[]; // Entity IDs mentioned
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Relationship suggestion from transcription
 */
export interface RelationshipSuggestion {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  description: string;
  confidence: number;
  sourceSegmentIds: string[];
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Live transcription session state
 */
export interface LiveTranscriptionSession {
  id: string;
  sessionId: string;
  campaignId: string;
  worldId: string;
  
  // Session state
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  
  // Audio configuration
  audioSource: AudioSourceType;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  
  // Real-time data
  currentSegments: TranscriptionSegment[];
  activeParticipants: string[];
  
  // WebSocket connection info
  connectionId?: string;
  lastHeartbeat?: Date;
  
  // Quality monitoring
  latency: number; // Average latency in ms
  dropouts: number; // Audio dropout count
  reconnections: number;
}

/**
 * Creation parameters for session transcription
 */
export interface SessionTranscriptionCreationParams extends BaseEntityCreationParams {
  sessionId: string;
  campaignId: string;
  worldId: string;
  audioSource: AudioSourceType;
  language?: string;
  provider?: string;
  isLiveSession?: boolean;
  discordChannelId?: string;
  discordGuildId?: string;
}

/**
 * Update parameters for session transcription
 */
export interface SessionTranscriptionUpdateParams extends BaseEntityUpdateParams {
  status?: TranscriptionStatus;
  segments?: TranscriptionSegment[];
  fullText?: string;
  summary?: string;
  speakers?: SpeakerInfo[];
  extractedEntities?: ExtractedEntity[];
  timelineEvents?: TimelineEventSuggestion[];
  relationshipSuggestions?: RelationshipSuggestion[];
  processingCompletedAt?: Date;
  liveSessionEndedAt?: Date;
}
