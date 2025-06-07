import { OpenAIWhisperService } from '../OpenAIWhisperService';
import { SpeechConfig, RecognitionError, RecognitionErrorType } from '../VertexAISpeechService'; // Re-using for common types
import { httpsCallable } from 'firebase/functions';
import { LogCategory } from '../../../utils/liveTranscriptionLogger';

// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    // Mock implementation of getFunctions if needed
  })),
  httpsCallable: jest.fn(),
}));

const mockHttpsCallable = httpsCallable as jest.Mock;

// Mock the logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  startTiming: jest.fn(),
  endTiming: jest.fn(),
  setSessionId: jest.fn(),
  clearSessionId: jest.fn(),
  logAudioMetrics: jest.fn(),
  logTranscriptionSegment: jest.fn(),
  logDatabaseOperation: jest.fn(),
};

jest.mock('../../../utils/liveTranscriptionLogger', () => ({
  createLiveTranscriptionLogger: () => mockLogger,
  LogCategory: {
    SERVICE: 'SERVICE',
    TRANSCRIPTION: 'TRANSCRIPTION',
    TRANSLATION: 'TRANSLATION',
    AUDIO: 'AUDIO',
    WEBSOCKET: 'WEBSOCKET',
    DATABASE: 'DATABASE',
    UI: 'UI',
    CONFIG: 'CONFIG',
    PERFORMANCE: 'PERFORMANCE',
  }
}));


describe('OpenAIWhisperService', () => {
  let service: OpenAIWhisperService;
  let mockProxyFn: jest.Mock;

  const mockBase64String = "bW9ja0Jhc2U2NFN0cmluZw=="; // "mockBase64String"

  beforeEach(() => {
    mockProxyFn = jest.fn();
    mockHttpsCallable.mockReturnValue(mockProxyFn);

    service = new OpenAIWhisperService();

    // Mock the private fileOrBlobToBase64 method
    // @ts-ignore
    service.fileOrBlobToBase64 = jest.fn().mockResolvedValue(mockBase64String);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize correctly and log initialization', () => {
      expect(service).toBeInstanceOf(OpenAIWhisperService);
      expect(mockLogger.info).toHaveBeenCalledWith(
        LogCategory.SERVICE,
        'OpenAI Whisper service initialized',
        expect.any(Object)
      );
    });
  });

  const mockSpeechConfig: SpeechConfig = {
    language: 'en-US',
    sampleRate: 16000,
    channels: 1,
    enableSpeakerDiarization: false, // Not used by Whisper but part of shared config
    enableAutomaticPunctuation: true, // Not directly used by Whisper but part of shared config
    enableWordTimeOffsets: true, // Not directly used by Whisper but part of shared config
  };
  const mockFile = new File(["audio content"], "test.mp3", { type: "audio/mp3" });

  describe('transcribeAudioFile', () => {
    const mockWhisperApiResponse = {
      text: "Hello world from Whisper.",
      segments: [
        { id: 0, seek: 0, start: 0.0, end: 1.5, text: "Hello world", avg_logprob: -0.25, no_speech_prob: 0.05, compression_ratio: 2.0, tokens: [], temperature: 0 },
        { id: 1, seek: 0, start: 1.5, end: 2.5, text: "from Whisper.", avg_logprob: -0.35, no_speech_prob: 0.1, compression_ratio: 2.2, tokens: [], temperature: 0 },
      ],
      language: 'en'
    };

    it('should call proxyOpenAIWhisper and process results correctly', async () => {
      mockProxyFn.mockResolvedValue({ data: mockWhisperApiResponse });
      // @ts-ignore (spy on private method)
      const processResponseSpy = jest.spyOn(service, 'processWhisperResponse');
      // @ts-ignore (spy on private method)
      const calculateConfidenceSpy = jest.spyOn(service, 'calculateConfidence');

      const segments = await service.transcribeAudioFile(mockFile, mockSpeechConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(LogCategory.TRANSCRIPTION, 'Starting Whisper transcription', expect.any(Object));
      // @ts-ignore
      expect(service.fileOrBlobToBase64).toHaveBeenCalledWith(mockFile);
      expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, 'proxyOpenAIWhisper');
      expect(mockProxyFn).toHaveBeenCalledWith({
        audioBytes: mockBase64String,
        model: 'whisper-1',
        language: 'en', // Extracted from 'en-US'
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
        // task: 'transcribe' is default in proxy if not specified
      });
      expect(processResponseSpy).toHaveBeenCalledWith(mockWhisperApiResponse, false);
      expect(calculateConfidenceSpy).toHaveBeenCalledTimes(mockWhisperApiResponse.segments.length);
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe("Hello world");
      expect(segments[1].text).toBe("from Whisper.");
      expect(segments[0].language).toBe("en");
      expect(mockLogger.info).toHaveBeenCalledWith(LogCategory.TRANSCRIPTION, 'Whisper transcription completed successfully', expect.any(Object));
    });

    it('should handle proxy error and throw RecognitionError', async () => {
      const proxyError = { code: 'functions/internal', message: 'Proxy failed', details: { info: "detail" } };
      mockProxyFn.mockRejectedValue(proxyError);

      await expect(service.transcribeAudioFile(mockFile, mockSpeechConfig))
        .rejects.toThrow(RecognitionError);

      try {
        await service.transcribeAudioFile(mockFile, mockSpeechConfig);
      } catch (e: any) {
        expect(e).toBeInstanceOf(RecognitionError);
        expect(e.type).toBe(RecognitionErrorType.UNKNOWN); // Mapped from functions/internal
        expect(e.message).toContain('Whisper transcription failed via proxy: Proxy failed');
        expect(e.details).toEqual(proxyError.details);
      }
    });

    it('should handle proxy error without details', async () => {
        const proxyError = { code: 'functions/unavailable', message: 'Network issue' };
        mockProxyFn.mockRejectedValue(proxyError);

        try {
          await service.transcribeAudioFile(mockFile, mockSpeechConfig);
        } catch (e: any) {
          expect(e).toBeInstanceOf(RecognitionError);
          expect(e.type).toBe(RecognitionErrorType.NETWORK_ERROR);
          expect(e.message).toContain('Whisper transcription failed via proxy: Network issue');
          expect(e.details).toBeUndefined(); // error.details was undefined on original error
        }
      });
  });

  describe('translateAudioFile', () => {
    const mockWhisperTranslationResponse = {
      text: "Hello world from Whisper translated.",
      segments: [
        { id: 0, seek: 0, start: 0.0, end: 2.0, text: "Hello world from Whisper translated.", avg_logprob: -0.15, no_speech_prob: 0.02, compression_ratio: 2.1, tokens: [], temperature: 0 },
      ],
      // language for translations is typically 'en'
    };

    it('should call proxy with translate task and process results', async () => {
      mockProxyFn.mockResolvedValue({ data: mockWhisperTranslationResponse });
      // @ts-ignore
      const processResponseSpy = jest.spyOn(service, 'processWhisperResponse');

      const segments = await service.translateAudioFile(mockFile);

      expect(mockProxyFn).toHaveBeenCalledWith(expect.objectContaining({
        task: 'translate',
        audioBytes: mockBase64String,
      }));
      expect(processResponseSpy).toHaveBeenCalledWith(mockWhisperTranslationResponse, true);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe("Hello world from Whisper translated.");
      expect(segments[0].language).toBe('en'); // Translations are to English
    });
  });

  describe('processWhisperResponse (private)', () => {
    it('should process response with segments', () => {
      const responseWithSegments = {
        text: "Seg1. Seg2.",
        segments: [
          { id: 0, seek: 0, start: 0.1, end: 0.8, text: "Seg1.", avg_logprob: -0.4, no_speech_prob: 0.2, compression_ratio: 1.9, tokens: [], temperature: 0 },
          { id: 1, seek: 0, start: 0.9, end: 1.5, text: "Seg2.", avg_logprob: -0.2, no_speech_prob: 0.1, compression_ratio: 2.5, tokens: [], temperature: 0 },
        ],
        language: 'es'
      };
      // @ts-ignore
      const segments = service.processWhisperResponse(responseWithSegments, false);
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe("Seg1.");
      expect(segments[0].startTime).toBe(0.1);
      expect(segments[0].endTime).toBe(0.8);
      expect(segments[0].language).toBe("es");
      expect(segments[0].isInterim).toBe(false);
      expect(segments[0].speakerId).toBe("unknown");

      // @ts-ignore (test with isTranslation true)
      const translatedSegments = service.processWhisperResponse(responseWithSegments, true);
      expect(translatedSegments[0].language).toBe("en");
    });

    it('should process response with only top-level text', () => {
      const responseOnlyText = { text: "Full text only.", language: "fr" };
      // @ts-ignore
      const segments = service.processWhisperResponse(responseOnlyText);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe("Full text only.");
      expect(segments[0].startTime).toBe(0);
      expect(segments[0].endTime).toBe(0); // Unknown duration
      expect(segments[0].language).toBe("fr");
      expect(segments[0].confidence).toBe(0.8); // Default confidence
    });
  });

  describe('calculateConfidence (private)', () => {
    const baseSegment = { id: 0, seek: 0, start: 0, end: 0, text: "", tokens: [], temperature: 0 };

    it('should return a score between 0 and 1', () => {
      // @ts-ignore
      const confidence = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.5, no_speech_prob: 0.1, compression_ratio: 2.0 });
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should score higher for better avg_logprob', () => {
      // @ts-ignore
      const conf1 = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.2, no_speech_prob: 0.1, compression_ratio: 2.4 }); // Better logprob
      // @ts-ignore
      const conf2 = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.8, no_speech_prob: 0.1, compression_ratio: 2.4 }); // Worse logprob
      expect(conf1).toBeGreaterThan(conf2);
    });

    it('should score higher for lower no_speech_prob', () => {
      // @ts-ignore
      const conf1 = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.5, no_speech_prob: 0.05, compression_ratio: 2.4 }); // Lower no_speech_prob
      // @ts-ignore
      const conf2 = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.5, no_speech_prob: 0.5, compression_ratio: 2.4 });  // Higher no_speech_prob
      expect(conf1).toBeGreaterThan(conf2);
    });

    it('should give bonus for normal compression_ratio', () => {
      // @ts-ignore
      const conf1 = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.5, no_speech_prob: 0.1, compression_ratio: 2.4 }); // Normal CR
      // @ts-ignore
      const conf2 = service.calculateConfidence({ ...baseSegment, avg_logprob: -0.5, no_speech_prob: 0.1, compression_ratio: 1.0 }); // Abnormal CR
      expect(conf1).toBeGreaterThan(conf2);
    });

    it('should use default values for undefined metrics', () => {
      // @ts-ignore
      const confidence = service.calculateConfidence({ ...baseSegment, avg_logprob: undefined, no_speech_prob: undefined, compression_ratio: undefined });
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
      // Based on defaults: avg_logprob: -1.0 (0.1 bonus), no_speech_prob: 0.0 (0.2 bonus), compression_ratio: 2.4 (0.1 bonus)
      // Base 0.5 + 0.1 + 0.2 + 0.1 = 0.9
      expect(confidence).toBeCloseTo(0.9);
    });
  });

  describe('checkAvailability', () => {
    it('should return true if proxy call is successful-like', async () => {
      mockProxyFn.mockResolvedValue({});
      const isAvailable = await service.checkAvailability();
      expect(isAvailable).toBe(true);
      expect(mockProxyFn).toHaveBeenCalledWith({ healthCheck: true });
    });

    it('should return true for non-"not-found" errors (proxy reachable)', async () => {
      mockProxyFn.mockRejectedValue({ code: 'functions/internal', message: 'Internal error' });
      const isAvailable = await service.checkAvailability();
      expect(isAvailable).toBe(true);
    });

    it('should return false if proxy function is not found', async () => {
      mockProxyFn.mockRejectedValue({ code: 'functions/not-found', message: 'Function not found' });
      const isAvailable = await service.checkAvailability();
      expect(isAvailable).toBe(false);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return a non-empty array of strings', () => {
      const languages = service.getSupportedLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
      expect(typeof languages[0]).toBe('string');
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const modelInfo = service.getModelInfo();
      expect(modelInfo.name).toBe('whisper-1');
      expect(modelInfo.maxFileSize).toBe(25 * 1024 * 1024);
      expect(Array.isArray(modelInfo.supportedFormats)).toBe(true);
    });
  });

  // Methods not supported by Whisper (startStreamingRecognition, sendAudioChunk, stopStreamingRecognition)
  // should throw errors as implemented.
  describe('Unsupported streaming methods', () => {
    it('startStreamingRecognition should throw', async () => {
        await expect(service.startStreamingRecognition()).rejects.toThrow(RecognitionError);
    });
    it('sendAudioChunk should throw', async () => {
        await expect(service.sendAudioChunk()).rejects.toThrow(RecognitionError);
    });
    it('stopStreamingRecognition should not throw (no-op)', async () => {
        await expect(service.stopStreamingRecognition()).resolves.toBeUndefined();
    });
  });

});
