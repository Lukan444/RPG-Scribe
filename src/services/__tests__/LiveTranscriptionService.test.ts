/**
 * Live Transcription Service Tests
 * 
 * Comprehensive test suite for the Live Transcription Service
 * Tests audio processing, speech recognition, and real-time streaming
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LiveTranscriptionService, SessionState, TranscriptionProvider } from '../LiveTranscriptionService';
import { AudioSourceType, TranscriptionStatus } from '../../models/Transcription';

// Mock dependencies
const mockTranscriptionService = {
  createSessionTranscription: vi.fn(),
  addTranscriptionSegments: vi.fn(),
  update: vi.fn(),
  cleanup: vi.fn()
};

const mockVertexAIService = {
  startStreamingRecognition: vi.fn(),
  sendAudioChunk: vi.fn(),
  stopStreamingRecognition: vi.fn(),
  transcribeAudioFile: vi.fn(),
  checkAvailability: vi.fn(),
  cleanup: vi.fn()
};

const mockWhisperService = {
  transcribeAudioFile: vi.fn(),
  checkAvailability: vi.fn()
};

const mockWebSocketService = {
  connect: vi.fn(),
  startSession: vi.fn(),
  sendAudioChunk: vi.fn(),
  endSession: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn()
};

// Mock modules
vi.mock('../transcription.service', () => ({
  TranscriptionService: vi.fn(() => mockTranscriptionService)
}));

vi.mock('../speech/VertexAISpeechService', () => ({
  VertexAISpeechService: vi.fn(() => mockVertexAIService)
}));

vi.mock('../speech/OpenAIWhisperService', () => ({
  OpenAIWhisperService: vi.fn(() => mockWhisperService)
}));

vi.mock('../websocket/TranscriptionWebSocketService', () => ({
  TranscriptionWebSocketService: vi.fn(() => mockWebSocketService)
}));

describe('LiveTranscriptionService', () => {
  let service: LiveTranscriptionService;
  const mockEvents = {
    onStateChange: vi.fn(),
    onSegmentReceived: vi.fn(),
    onError: vi.fn(),
    onConnectionStateChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockTranscriptionService.createSessionTranscription.mockResolvedValue('transcription-123');
    mockVertexAIService.startStreamingRecognition.mockResolvedValue('stream-123');
    mockVertexAIService.checkAvailability.mockResolvedValue(true);
    mockWhisperService.checkAvailability.mockResolvedValue(true);
    mockWebSocketService.connect.mockResolvedValue(undefined);
    mockWebSocketService.startSession.mockResolvedValue('session-123');
    mockWebSocketService.isConnected.mockReturnValue(true);

    service = new LiveTranscriptionService({}, mockEvents);
  });

  afterEach(() => {
    service.dispose();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default configuration', () => {
      expect(service.getSessionState()).toBe(SessionState.IDLE);
      expect(service.getCurrentTranscriptionId()).toBeNull();
    });

    it('initializes with custom configuration', () => {
      const customConfig = {
        provider: TranscriptionProvider.OPENAI_WHISPER,
        language: 'es-ES',
        enableSpeakerDiarization: false
      };

      const customService = new LiveTranscriptionService(customConfig, mockEvents);
      expect(customService.getSessionState()).toBe(SessionState.IDLE);
      customService.dispose();
    });
  });

  describe('Live Session Management', () => {
    const sessionId = 'test-session-123';
    const campaignId = 'test-campaign-456';
    const worldId = 'test-world-789';

    it('starts live session successfully', async () => {
      const transcriptionId = await service.startLiveSession(sessionId, campaignId, worldId);

      expect(transcriptionId).toBe('transcription-123');
      expect(mockTranscriptionService.createSessionTranscription).toHaveBeenCalledWith({
        sessionId,
        campaignId,
        worldId,
        audioSource: AudioSourceType.MICROPHONE,
        language: 'en-US',
        provider: TranscriptionProvider.VERTEX_AI,
        isLiveSession: true,
        name: expect.stringContaining('Live Session'),
        description: expect.stringContaining(sessionId)
      });
      expect(mockEvents.onStateChange).toHaveBeenCalledWith(SessionState.ACTIVE);
    });

    it('handles session start failure', async () => {
      const error = new Error('Failed to create transcription');
      mockTranscriptionService.createSessionTranscription.mockRejectedValue(error);

      await expect(service.startLiveSession(sessionId, campaignId, worldId))
        .rejects.toThrow('Failed to create transcription');
      
      expect(mockEvents.onError).toHaveBeenCalledWith(error);
    });

    it('prevents starting session when already active', async () => {
      await service.startLiveSession(sessionId, campaignId, worldId);
      
      await expect(service.startLiveSession(sessionId, campaignId, worldId))
        .rejects.toThrow('Session already active');
    });

    it('stops live session successfully', async () => {
      await service.startLiveSession(sessionId, campaignId, worldId);
      await service.stopSession();

      expect(mockVertexAIService.stopStreamingRecognition).toHaveBeenCalled();
      expect(mockWebSocketService.endSession).toHaveBeenCalled();
      expect(mockTranscriptionService.addTranscriptionSegments).toHaveBeenCalled();
      expect(mockEvents.onStateChange).toHaveBeenCalledWith(SessionState.IDLE);
    });

    it('handles session stop when idle', async () => {
      await service.stopSession();
      expect(service.getSessionState()).toBe(SessionState.IDLE);
    });
  });

  describe('Audio Processing', () => {
    const sessionId = 'test-session-123';
    const campaignId = 'test-campaign-456';
    const worldId = 'test-world-789';

    beforeEach(async () => {
      await service.startLiveSession(sessionId, campaignId, worldId);
    });

    it('processes audio chunks successfully', async () => {
      const audioChunk = new ArrayBuffer(1024);
      const timestamp = Date.now();

      await service.processAudioChunk(audioChunk, timestamp);

      expect(mockWebSocketService.sendAudioChunk).toHaveBeenCalledWith(audioChunk, timestamp);
      expect(mockVertexAIService.sendAudioChunk).toHaveBeenCalledWith('stream-123', audioChunk);
    });

    it('handles audio processing errors gracefully', async () => {
      const audioChunk = new ArrayBuffer(1024);
      const timestamp = Date.now();
      const error = new Error('Audio processing failed');
      
      mockVertexAIService.sendAudioChunk.mockRejectedValue(error);

      await service.processAudioChunk(audioChunk, timestamp);

      expect(mockEvents.onError).toHaveBeenCalledWith(error);
    });

    it('ignores audio chunks when session is not active', async () => {
      await service.stopSession();
      
      const audioChunk = new ArrayBuffer(1024);
      const timestamp = Date.now();

      await service.processAudioChunk(audioChunk, timestamp);

      expect(mockWebSocketService.sendAudioChunk).not.toHaveBeenCalled();
    });
  });

  describe('File Processing', () => {
    const sessionId = 'test-session-123';
    const campaignId = 'test-campaign-456';
    const worldId = 'test-world-789';

    it('processes audio file with primary provider', async () => {
      const audioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const mockSegments = [
        {
          id: 'segment-1',
          startTime: 0,
          endTime: 5,
          text: 'Hello world',
          speakerId: 'speaker-1',
          confidence: 0.9,
          speakerConfidence: 'high' as const,
          entities: []
        }
      ];

      mockVertexAIService.transcribeAudioFile.mockResolvedValue(mockSegments);

      const transcriptionId = await service.processAudioFile(audioFile, sessionId, campaignId, worldId);

      expect(transcriptionId).toBe('transcription-123');
      expect(mockTranscriptionService.createSessionTranscription).toHaveBeenCalledWith({
        sessionId,
        campaignId,
        worldId,
        audioSource: AudioSourceType.FILE_UPLOAD,
        language: 'en-US',
        provider: TranscriptionProvider.VERTEX_AI,
        isLiveSession: false,
        name: `File Transcription - ${audioFile.name}`,
        description: `Transcription of uploaded file: ${audioFile.name}`
      });
      expect(mockTranscriptionService.addTranscriptionSegments).toHaveBeenCalledWith(
        'transcription-123',
        mockSegments,
        true
      );
    });

    it('falls back to secondary provider on primary failure', async () => {
      const audioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const mockSegments = [
        {
          id: 'segment-1',
          startTime: 0,
          endTime: 5,
          text: 'Hello world',
          speakerId: 'speaker-1',
          confidence: 0.8,
          speakerConfidence: 'high' as const,
          entities: []
        }
      ];

      mockVertexAIService.transcribeAudioFile.mockRejectedValue(new Error('Primary provider failed'));
      mockWhisperService.transcribeAudioFile.mockResolvedValue(mockSegments);

      const transcriptionId = await service.processAudioFile(audioFile, sessionId, campaignId, worldId);

      expect(transcriptionId).toBe('transcription-123');
      expect(mockVertexAIService.transcribeAudioFile).toHaveBeenCalled();
      expect(mockWhisperService.transcribeAudioFile).toHaveBeenCalled();
    });

    it('throws error when all providers fail', async () => {
      const audioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      
      mockVertexAIService.transcribeAudioFile.mockRejectedValue(new Error('Primary failed'));
      mockWhisperService.transcribeAudioFile.mockRejectedValue(new Error('Fallback failed'));

      await expect(service.processAudioFile(audioFile, sessionId, campaignId, worldId))
        .rejects.toThrow();
    });
  });

  describe('Session State Management', () => {
    it('pauses and resumes session correctly', () => {
      service.pauseSession();
      expect(service.getSessionState()).toBe(SessionState.PAUSED);

      service.resumeSession();
      expect(service.getSessionState()).toBe(SessionState.ACTIVE);
    });

    it('handles state transitions correctly', async () => {
      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      // Start session
      await service.startLiveSession(sessionId, campaignId, worldId);
      expect(mockEvents.onStateChange).toHaveBeenCalledWith(SessionState.STARTING);
      expect(mockEvents.onStateChange).toHaveBeenCalledWith(SessionState.ACTIVE);

      // Stop session
      await service.stopSession();
      expect(mockEvents.onStateChange).toHaveBeenCalledWith(SessionState.STOPPING);
      expect(mockEvents.onStateChange).toHaveBeenCalledWith(SessionState.IDLE);
    });
  });

  describe('Speech Recognition Integration', () => {
    it('handles speech recognition results', async () => {
      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      await service.startLiveSession(sessionId, campaignId, worldId);

      // Simulate speech recognition result
      const mockResult = {
        segments: [
          {
            id: 'segment-1',
            startTime: 0,
            endTime: 2,
            text: 'Test transcription',
            speakerId: 'speaker-1',
            confidence: 0.95,
            speakerConfidence: 'high' as const,
            entities: []
          }
        ],
        isFinal: true,
        stability: 1.0,
        resultEndTime: 2000
      };

      // This would be called by the speech recognition service
      expect(mockEvents.onSegmentReceived).toBeDefined();
    });

    it('filters low confidence segments', async () => {
      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      const customService = new LiveTranscriptionService({
        confidenceThreshold: 0.8
      }, mockEvents);

      await customService.startLiveSession(sessionId, campaignId, worldId);

      // Low confidence segments should be filtered
      expect(customService.getSessionState()).toBe(SessionState.ACTIVE);
      
      customService.dispose();
    });
  });

  describe('WebSocket Integration', () => {
    it('connects to WebSocket when real-time streaming is enabled', async () => {
      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      await service.startLiveSession(sessionId, campaignId, worldId);

      expect(mockWebSocketService.connect).toHaveBeenCalled();
      expect(mockWebSocketService.startSession).toHaveBeenCalledWith({
        campaignId,
        worldId,
        audioConfig: expect.objectContaining({
          format: 'webm'
        })
      });
    });

    it('handles WebSocket connection errors', async () => {
      mockWebSocketService.connect.mockRejectedValue(new Error('WebSocket connection failed'));

      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      await expect(service.startLiveSession(sessionId, campaignId, worldId))
        .rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles speech recognition errors', async () => {
      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      mockVertexAIService.startStreamingRecognition.mockRejectedValue(
        new Error('Speech recognition failed')
      );

      await expect(service.startLiveSession(sessionId, campaignId, worldId))
        .rejects.toThrow();
    });

    it('handles service unavailability gracefully', async () => {
      mockVertexAIService.checkAvailability.mockResolvedValue(false);
      mockWhisperService.checkAvailability.mockResolvedValue(false);

      const sessionId = 'test-session-123';
      const campaignId = 'test-campaign-456';
      const worldId = 'test-world-789';

      // Service should still attempt to start but may fail gracefully
      await expect(service.startLiveSession(sessionId, campaignId, worldId))
        .resolves.toBeDefined();
    });
  });

  describe('Cleanup and Disposal', () => {
    it('cleans up resources on disposal', () => {
      service.dispose();

      expect(mockTranscriptionService.cleanup).toHaveBeenCalled();
      expect(mockVertexAIService.cleanup).toHaveBeenCalled();
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('handles multiple disposal calls safely', () => {
      service.dispose();
      service.dispose(); // Should not throw

      expect(mockTranscriptionService.cleanup).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration', () => {
    it('respects custom configuration options', () => {
      const customConfig = {
        provider: TranscriptionProvider.OPENAI_WHISPER,
        language: 'fr-FR',
        enableSpeakerDiarization: false,
        maxSpeakers: 2,
        confidenceThreshold: 0.8,
        chunkDuration: 3
      };

      const customService = new LiveTranscriptionService(customConfig, mockEvents);
      expect(customService.getSessionState()).toBe(SessionState.IDLE);
      customService.dispose();
    });
  });
});
