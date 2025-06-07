import { VertexAISpeechService, SpeechConfig, RecognitionError, RecognitionErrorType, StreamingResult } from '../VertexAISpeechService';
import { httpsCallable } from 'firebase/functions';

// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    // Mock implementation of getFunctions if needed, or just return an object
  })),
  httpsCallable: jest.fn(),
}));

// Stronger type for the mock httpsCallable
const mockHttpsCallable = httpsCallable as jest.Mock;

describe('VertexAISpeechService', () => {
  let service: VertexAISpeechService;
  let mockProxyFn: jest.Mock;

  const mockProjectId = 'test-project';
  const mockLocation = 'test-location';

  beforeEach(() => {
    // Reset mocks for each test
    mockProxyFn = jest.fn();
    mockHttpsCallable.mockReturnValue(mockProxyFn); // Make HttpsCallable return our specific mock function

    service = new VertexAISpeechService({ projectId: mockProjectId, location: mockLocation });

    // Mock arrayBufferToBase64 as it's a private method used internally
    // @ts-ignore
    service.arrayBufferToBase64 = jest.fn((buffer: ArrayBuffer) => {
      // Simple mock: return a fixed string or something derived from buffer size
      return Buffer.from(buffer).toString('base64');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize correctly', () => {
      expect(service).toBeInstanceOf(VertexAISpeechService);
      // @ts-ignore
      expect(service.projectId).toBe(mockProjectId);
      // @ts-ignore
      expect(service.location).toBe(mockLocation);
    });
  });

  describe('startStreamingRecognition', () => {
    it('should return a streamId and store stream configuration', async () => {
      const mockConfig: SpeechConfig = { language: 'en-US', sampleRate: 16000, channels: 1 };
      const mockOnResult = jest.fn();
      const mockOnError = jest.fn();

      const streamId = await service.startStreamingRecognition(mockConfig, mockOnResult, mockOnError);

      expect(streamId).toMatch(/^stream_\d{13}_[a-z0-9]{9}$/);
      // @ts-ignore
      const streamData = service.activeStreams.get(streamId);
      expect(streamData).toBeDefined();
      expect(streamData.config).toEqual(expect.objectContaining({
        encoding: 'WEBM_OPUS',
        sampleRateHertz: mockConfig.sampleRate,
        languageCode: mockConfig.language,
        interimResults: true,
      }));
      expect(streamData.onResult).toBe(mockOnResult);
      expect(streamData.onError).toBe(mockOnError);
      expect(streamData.isActive).toBe(true);
    });
  });

  describe('sendAudioChunk', () => {
    let streamId: string;
    const mockOnResult = jest.fn();
    const mockOnError = jest.fn();
    const mockAudioChunk = new ArrayBuffer(10); // e.g. 'AAAAAAAAAAAAAA=='
    const mockBase64Audio = Buffer.from(mockAudioChunk).toString('base64');
    const speechConfig: SpeechConfig = { language: 'en-US', sampleRate: 16000, channels: 1 };

    beforeEach(async () => {
      // Reset callbacks for each test in this describe block
      mockOnResult.mockClear();
      mockOnError.mockClear();
      streamId = await service.startStreamingRecognition(speechConfig, mockOnResult, mockOnError);
    });

    it('should call proxyVertexAISpeech and process results correctly', async () => {
      const mockProxyResponseData = {
        results: [
          {
            results: [{ alternatives: [{ transcript: "hello" }], stability: 0.9, isFinal: false }],
            resultEndTime: { seconds: '1', nanos: 500000000 }
          },
          {
            results: [{ alternatives: [{ transcript: "hello world" }], stability: 0.95, isFinal: true }],
            resultEndTime: { seconds: '2', nanos: 0 }
          }
        ],
        streamId: streamId,
      };
      mockProxyFn.mockResolvedValue({ data: mockProxyResponseData });

      await service.sendAudioChunk(streamId, mockAudioChunk);

      expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, 'proxyVertexAISpeech');
      expect(mockProxyFn).toHaveBeenCalledWith({
        audioBytes: mockBase64Audio,
        // @ts-ignore
        config: service.activeStreams.get(streamId).config,
        streamId: streamId,
      });

      expect(mockOnResult).toHaveBeenCalledTimes(2);

      const firstCallArgs = mockOnResult.mock.calls[0][0] as StreamingResult;
      expect(firstCallArgs.segments[0].text).toBe("hello");
      expect(firstCallArgs.isFinal).toBe(false);
      expect(firstCallArgs.stability).toBe(0.9);
      expect(firstCallArgs.resultEndTime).toBe(1500);


      const secondCallArgs = mockOnResult.mock.calls[1][0] as StreamingResult;
      expect(secondCallArgs.segments[0].text).toBe("hello world");
      expect(secondCallArgs.isFinal).toBe(true);
      expect(secondCallArgs.stability).toBe(0.95);
      expect(secondCallArgs.resultEndTime).toBe(2000);

      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle empty results from proxy', async () => {
      mockProxyFn.mockResolvedValue({ data: { results: [] } });
      await service.sendAudioChunk(streamId, mockAudioChunk);
      expect(mockOnResult).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle individual streamingResponseItem errors if present (though main error path is via catch)', async () => {
      const mockProxyResponseDataWithItemError = {
        results: [
          { error: { code: 3, message: "Individual item error" } }
        ],
        streamId: streamId,
      };
      mockProxyFn.mockResolvedValue({ data: mockProxyResponseDataWithItemError });

      // In the current implementation, item-level errors are console.error'd but don't call stream.onError
      // The main catch block handles promise rejection.
      await service.sendAudioChunk(streamId, mockAudioChunk);
      expect(mockOnError).not.toHaveBeenCalled(); // Error at item level doesn't call stream.onError directly
    });


    it('should handle errors from proxy function call', async () => {
      const proxyError = { code: 'functions/unavailable', message: 'Proxy function is unavailable' };
      mockProxyFn.mockRejectedValue(proxyError);

      await service.sendAudioChunk(streamId, mockAudioChunk);

      expect(mockOnResult).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError.mock.calls[0][0]).toBeInstanceOf(RecognitionError);
      expect(mockOnError.mock.calls[0][0].type).toBe(RecognitionErrorType.NETWORK_ERROR);
      expect(mockOnError.mock.calls[0][0].message).toContain('Proxy function is unavailable');
      expect(mockOnError.mock.calls[0][0].details).toEqual(proxyError);
    });
  });

  describe('stopStreamingRecognition', () => {
    it('should deactivate and delete the stream', async () => {
      const streamId = await service.startStreamingRecognition({ language: 'en-US', sampleRate: 16000, channels: 1 }, jest.fn(), jest.fn());
      // @ts-ignore
      expect(service.activeStreams.has(streamId)).toBe(true);

      await service.stopStreamingRecognition(streamId);

      // @ts-ignore
      const streamData = service.activeStreams.get(streamId);
      // The stream is deleted, so streamData should be undefined.
      // If it were only marked inactive: expect(streamData.isActive).toBe(false);
      expect(streamData).toBeUndefined();
    });
  });

  describe('transcribeAudioFile', () => {
    const mockAudioData = new ArrayBuffer(20);
    const mockBase64AudioData = Buffer.from(mockAudioData).toString('base64');
    const mockConfig: SpeechConfig = { language: 'en-US', sampleRate: 16000, channels: 1 };

    it('should call proxy and return processed segments on success', async () => {
      const mockProxyResponse = {
        data: {
          results: [ // This is the google.cloud.speech.v1.SpeechRecognitionResult array
            { alternatives: [{ transcript: "Test file transcript" }], isFinal: true }
          ]
        }
      };
      mockProxyFn.mockResolvedValue(mockProxyResponse);

      const segments = await service.transcribeAudioFile(mockAudioData, mockConfig);

      expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, 'proxyVertexAISpeech');
      expect(mockProxyFn).toHaveBeenCalledWith({
        audioBytes: mockBase64AudioData,
        config: expect.objectContaining({
          sampleRateHertz: mockConfig.sampleRate,
          languageCode: mockConfig.language,
          enableAutomaticPunctuation: true, // Default from service
        })
      });
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe("Test file transcript");
    });

    it('should throw RecognitionError on proxy error', async () => {
      const proxyError = { code: 'functions/internal', message: 'Proxy internal error' };
      mockProxyFn.mockRejectedValue(proxyError);

      await expect(service.transcribeAudioFile(mockAudioData, mockConfig))
        .rejects.toThrow(RecognitionError);

      try {
        await service.transcribeAudioFile(mockAudioData, mockConfig);
      } catch (e: any) {
        expect(e.type).toBe(RecognitionErrorType.UNKNOWN); // Mapped from functions/internal
        expect(e.message).toContain('Internal proxy error');
        expect(e.details).toEqual(proxyError);
      }
    });

    it('should throw RecognitionError for unexpected proxy response structure', async () => {
      mockProxyFn.mockResolvedValue({ data: { unexpected: "structure" } }); // Missing 'results'

      await expect(service.transcribeAudioFile(mockAudioData, mockConfig))
        .rejects.toThrow(RecognitionError);
      try {
        await service.transcribeAudioFile(mockAudioData, mockConfig);
      } catch (e: any) {
        expect(e.type).toBe(RecognitionErrorType.UNKNOWN);
        expect(e.message).toContain("Unexpected response structure from proxy.");
      }
    });
  });

  describe('processRecognitionResults (private method, tested via public methods)', () => {
    // This method is tested indirectly via sendAudioChunk and transcribeAudioFile.
    // For more direct testing, it could be made protected or static if language allows, or tested via a harness.
    // Given its current usage, testing through the public methods that use it should suffice for now.
    // Example test cases that would be covered:
    // - Empty results array from API -> empty segments array
    // - Results with alternatives -> correct transcript chosen
    // - Results with word timings -> startTime/endTime parsed
    // - isFinal flag correctly sets segment.isInterim

    it('should correctly transform various API result structures into TranscriptionSegments', async () => {
        // @ts-ignore (to test private method)
        const segments = service.processRecognitionResults(
            [
                { alternatives: [{ transcript: "Segment one", confidence: 0.9 }], isFinal: false, words: [{startTime: "0.1s", endTime: "0.5s"}] },
                { alternatives: [{ transcript: "Segment two", confidence: 0.8 }], isFinal: true, words: [{startTime: "0.6s", endTime: "1.0s", speakerTag: 2}] }
            ],
            "testStream"
        );
        expect(segments).toHaveLength(2);
        expect(segments[0].text).toBe("Segment one");
        expect(segments[0].isInterim).toBe(true);
        expect(segments[0].startTime).toBe(0.1);
        expect(segments[0].endTime).toBe(0.5);
        expect(segments[0].speakerId).toBe("unknown");

        expect(segments[1].text).toBe("Segment two");
        expect(segments[1].isInterim).toBe(false);
        expect(segments[1].startTime).toBe(0.6);
        expect(segments[1].endTime).toBe(1.0);
        expect(segments[1].speakerId).toBe("speaker_2");
    });
  });

  describe('checkAvailability', () => {
    it('should return true if proxy call is successful-like', async () => {
      mockProxyFn.mockResolvedValue({}); // Success-like, no specific data needed for health check to pass
      const isAvailable = await service.checkAvailability();
      expect(isAvailable).toBe(true);
      expect(mockProxyFn).toHaveBeenCalledWith({
        healthCheck: true,
        audioBytes: expect.any(String),
        config: { languageCode: "en-US" }
      });
    });

    it('should return true even if proxy call errors (but not functions/not-found)', async () => {
      // Errors like "invalid-argument" for a health check payload still mean the function is deployed.
      mockProxyFn.mockRejectedValue({ code: 'functions/invalid-argument', message: 'Bad health check payload' });
      const isAvailable = await service.checkAvailability();
      expect(isAvailable).toBe(true);
    });

    it('should return false if proxy function is not found', async () => {
      mockProxyFn.mockRejectedValue({ code: 'functions/not-found', message: 'Function not found' });
      const isAvailable = await service.checkAvailability();
      expect(isAvailable).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clear activeStreams', async () => {
      const streamId = await service.startStreamingRecognition({ language: 'en-US', sampleRate: 16000, channels: 1 }, jest.fn(), jest.fn());
      // @ts-ignore
      expect(service.activeStreams.size).toBe(1);
      service.cleanup();
      // @ts-ignore
      expect(service.activeStreams.size).toBe(0);
    });
  });

});
