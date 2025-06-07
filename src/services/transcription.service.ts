/**
 * Transcription Service
 * 
 * Handles session transcription data management with Firebase/Firestore integration
 * Supports real-time transcription, speaker identification, and AI analysis
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { 
  SessionTranscription, 
  SessionTranscriptionCreationParams, 
  SessionTranscriptionUpdateParams,
  TranscriptionSegment,
  LiveTranscriptionSession,
  AudioSourceType,
  TranscriptionStatus,
  SpeakerInfo,
  ExtractedEntity,
  TimelineEventSuggestion,
  RelationshipSuggestion
} from '../models/Transcription';
import { EntityType } from '../models/EntityType';

/**
 * Transcription Service
 * Manages session transcription data with real-time capabilities
 */
export class TranscriptionService extends FirestoreService<SessionTranscription> {
  private liveSessionListeners: Map<string, () => void> = new Map();
  private segmentListeners: Map<string, () => void> = new Map();

  constructor() {
    super('transcriptions');
  }

  /**
   * Create a new session transcription
   * @param params Creation parameters
   * @returns Transcription ID
   */
  async createSessionTranscription(
    params: SessionTranscriptionCreationParams
  ): Promise<string> {
    const transcriptionData: Omit<SessionTranscription, 'id'> = {
      ...params,
      entityType: EntityType.SESSION,
      name: `Session Transcription - ${new Date().toLocaleDateString()}`,
      description: `Transcription for session in campaign ${params.campaignId}`,
      audioSource: params.audioSource,
      status: TranscriptionStatus.PENDING,
      language: params.language || 'en-US',
      provider: params.provider || 'vertex-ai',
      segments: [],
      speakers: [],
      extractedEntities: [],
      timelineEvents: [],
      relationshipSuggestions: [],
      isLiveSession: params.isLiveSession || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.create(transcriptionData);
  }

  /**
   * Update transcription with new segments (for real-time transcription)
   * @param transcriptionId Transcription ID
   * @param segments New segments to add
   * @param isComplete Whether transcription is complete
   */
  async addTranscriptionSegments(
    transcriptionId: string,
    segments: TranscriptionSegment[],
    isComplete: boolean = false
  ): Promise<void> {
    const transcription = await this.getById(transcriptionId);
    if (!transcription) {
      throw new Error(`Transcription ${transcriptionId} not found`);
    }

    // Merge new segments with existing ones
    const existingSegments = transcription.segments || [];
    const updatedSegments = [...existingSegments, ...segments];

    // Update full text
    const fullText = updatedSegments
      .filter(segment => !segment.isInterim)
      .map(segment => segment.text)
      .join(' ');

    const updateData: Partial<SessionTranscription> = {
      segments: updatedSegments,
      fullText,
      status: isComplete ? TranscriptionStatus.COMPLETED : TranscriptionStatus.PROCESSING,
      updatedAt: new Date()
    };

    if (isComplete) {
      updateData.processingCompletedAt = new Date();
      updateData.liveSessionEndedAt = new Date();
    }

    await this.update(transcriptionId, updateData);
  }

  /**
   * Update speaker information
   * @param transcriptionId Transcription ID
   * @param speakers Updated speaker information
   */
  async updateSpeakers(
    transcriptionId: string,
    speakers: SpeakerInfo[]
  ): Promise<void> {
    await this.update(transcriptionId, {
      speakers,
      speakerCount: speakers.length,
      updatedAt: new Date()
    });
  }

  /**
   * Add AI analysis results
   * @param transcriptionId Transcription ID
   * @param analysis Analysis results
   */
  async addAIAnalysis(
    transcriptionId: string,
    analysis: {
      extractedEntities?: ExtractedEntity[];
      timelineEvents?: TimelineEventSuggestion[];
      relationshipSuggestions?: RelationshipSuggestion[];
      summary?: string;
    }
  ): Promise<void> {
    const updateData: Partial<SessionTranscription> = {
      ...analysis,
      updatedAt: new Date()
    };

    await this.update(transcriptionId, updateData);
  }

  /**
   * Get transcriptions for a session
   * @param sessionId Session ID
   * @returns Array of transcriptions
   */
  async getSessionTranscriptions(sessionId: string): Promise<SessionTranscription[]> {
    const constraints = [
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'desc')
    ];

    const result = await this.query(constraints);
    return result.data;
  }

  /**
   * Get transcriptions for a campaign
   * @param campaignId Campaign ID
   * @param limitCount Optional limit
   * @returns Array of transcriptions
   */
  async getCampaignTranscriptions(
    campaignId: string,
    limitCount: number = 50
  ): Promise<SessionTranscription[]> {
    const constraints = [
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];

    const result = await this.query(constraints);
    return result.data;
  }

  /**
   * Get active live transcription sessions
   * @param campaignId Campaign ID
   * @returns Array of active sessions
   */
  async getActiveLiveSessions(campaignId: string): Promise<SessionTranscription[]> {
    const constraints = [
      where('campaignId', '==', campaignId),
      where('isLiveSession', '==', true),
      where('status', 'in', [TranscriptionStatus.PENDING, TranscriptionStatus.PROCESSING])
    ];

    const result = await this.query(constraints);
    return result.data;
  }

  /**
   * Subscribe to real-time transcription updates
   * @param transcriptionId Transcription ID
   * @param onUpdate Callback for updates
   * @param onError Error callback
   * @returns Unsubscribe function
   */
  subscribeToTranscription(
    transcriptionId: string,
    onUpdate: (transcription: SessionTranscription | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `transcription_${transcriptionId}`;
    
    const unsubscribe = this.subscribeToDocument(
      transcriptionId,
      onUpdate,
      { listenerId, onError }
    );

    this.liveSessionListeners.set(listenerId, unsubscribe);
    return () => {
      unsubscribe();
      this.liveSessionListeners.delete(listenerId);
    };
  }

  /**
   * Subscribe to live transcription segments
   * @param transcriptionId Transcription ID
   * @param onSegmentUpdate Callback for new segments
   * @param onError Error callback
   * @returns Unsubscribe function
   */
  subscribeToLiveSegments(
    transcriptionId: string,
    onSegmentUpdate: (segments: TranscriptionSegment[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `segments_${transcriptionId}`;
    
    const unsubscribe = this.subscribeToDocument(
      transcriptionId,
      (transcription) => {
        if (transcription?.segments) {
          onSegmentUpdate(transcription.segments);
        }
      },
      { listenerId, onError }
    );

    this.segmentListeners.set(listenerId, unsubscribe);
    return () => {
      unsubscribe();
      this.segmentListeners.delete(listenerId);
    };
  }

  /**
   * Search transcriptions by text content
   * @param campaignId Campaign ID
   * @param searchText Search text
   * @param limitCount Optional limit
   * @returns Array of matching transcriptions
   */
  async searchTranscriptions(
    campaignId: string,
    searchText: string,
    limitCount: number = 20
  ): Promise<SessionTranscription[]> {
    // Note: This is a basic implementation. For production, consider using
    // Firestore's full-text search or Algolia integration
    const allTranscriptions = await this.getCampaignTranscriptions(campaignId, 100);
    
    const searchLower = searchText.toLowerCase();
    return allTranscriptions
      .filter(transcription => 
        transcription.fullText?.toLowerCase().includes(searchLower) ||
        transcription.summary?.toLowerCase().includes(searchLower) ||
        transcription.segments?.some(segment => 
          segment.text.toLowerCase().includes(searchLower)
        )
      )
      .slice(0, limitCount);
  }

  /**
   * Get transcription statistics for a campaign
   * @param campaignId Campaign ID
   * @returns Statistics object
   */
  async getTranscriptionStats(campaignId: string): Promise<{
    totalTranscriptions: number;
    totalDuration: number;
    totalWords: number;
    averageConfidence: number;
    speakerCount: number;
    recentActivity: Date | null;
  }> {
    const transcriptions = await this.getCampaignTranscriptions(campaignId);
    
    const stats = transcriptions.reduce((acc, transcription) => {
      acc.totalTranscriptions++;
      acc.totalDuration += transcription.audioDuration || 0;
      acc.totalWords += transcription.wordCount || 0;
      acc.averageConfidence += transcription.averageConfidence || 0;
      
      const uniqueSpeakers = new Set(transcription.speakers?.map(s => s.id) || []);
      acc.speakerCount = Math.max(acc.speakerCount, uniqueSpeakers.size);
      
      if (!acc.recentActivity || (transcription.updatedAt && transcription.updatedAt > acc.recentActivity)) {
        acc.recentActivity = transcription.updatedAt || null;
      }
      
      return acc;
    }, {
      totalTranscriptions: 0,
      totalDuration: 0,
      totalWords: 0,
      averageConfidence: 0,
      speakerCount: 0,
      recentActivity: null as Date | null
    });

    if (stats.totalTranscriptions > 0) {
      stats.averageConfidence = stats.averageConfidence / stats.totalTranscriptions;
    }

    return stats;
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.liveSessionListeners.forEach(unsubscribe => unsubscribe());
    this.segmentListeners.forEach(unsubscribe => unsubscribe());
    this.liveSessionListeners.clear();
    this.segmentListeners.clear();
  }
}
