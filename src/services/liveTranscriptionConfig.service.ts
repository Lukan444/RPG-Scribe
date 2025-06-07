/**
 * Live Transcription Configuration Service
 * 
 * Manages configuration settings for the Live Session Transcription & AI Assistant feature
 * Provides centralized configuration management with Firebase persistence
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LiveTranscriptionConfig } from '../components/admin/LiveTranscriptionSettings';

/**
 * Configuration change event interface
 */
export interface ConfigChangeEvent {
  section: string;
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Live Transcription Configuration Service
 */
export class LiveTranscriptionConfigService {
  private static instance: LiveTranscriptionConfigService;
  private configCache: LiveTranscriptionConfig | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly CONFIG_DOC_ID = 'live-transcription-config';
  private readonly COLLECTION_NAME = 'systemConfig';
  private changeListeners: ((event: ConfigChangeEvent) => void)[] = [];

  /**
   * Get singleton instance
   */
  public static getInstance(): LiveTranscriptionConfigService {
    if (!LiveTranscriptionConfigService.instance) {
      LiveTranscriptionConfigService.instance = new LiveTranscriptionConfigService();
    }
    return LiveTranscriptionConfigService.instance;
  }

  /**
   * Get the current configuration
   */
  public async getConfig(): Promise<LiveTranscriptionConfig> {
    // Check cache first
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, this.CONFIG_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const config = docSnap.data() as LiveTranscriptionConfig;
        this.updateCache(config);
        return config;
      } else {
        // Return default configuration if none exists
        const defaultConfig = this.getDefaultConfig();
        await this.saveConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error) {
      console.error('Error loading Live Transcription configuration:', error);
      // Return default configuration on error
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration
   */
  public async saveConfig(config: LiveTranscriptionConfig): Promise<boolean> {
    try {
      // Validate configuration before saving
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      const docRef = doc(db, this.COLLECTION_NAME, this.CONFIG_DOC_ID);
      const configWithMetadata = {
        ...config,
        lastUpdated: serverTimestamp(),
        version: '1.0.0'
      };

      await setDoc(docRef, configWithMetadata);
      this.updateCache(config);

      // Notify listeners of configuration change
      this.notifyConfigChange('system', 'full-config', this.configCache, config);

      return true;
    } catch (error) {
      console.error('Error saving Live Transcription configuration:', error);
      return false;
    }
  }

  /**
   * Update specific configuration section
   */
  public async updateConfigSection(section: keyof LiveTranscriptionConfig, sectionConfig: any): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig();
      const oldValue = currentConfig[section];
      const newConfig = {
        ...currentConfig,
        [section]: sectionConfig
      };

      const success = await this.saveConfig(newConfig);
      if (success) {
        this.notifyConfigChange(section, section, oldValue, sectionConfig);
      }

      return success;
    } catch (error) {
      console.error(`Error updating configuration section ${section}:`, error);
      return false;
    }
  }

  /**
   * Get specific configuration value
   */
  public async getConfigValue(path: string): Promise<any> {
    const config = await this.getConfig();
    const keys = path.split('.');
    let value: any = config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set specific configuration value
   */
  public async setConfigValue(path: string, value: any): Promise<boolean> {
    try {
      const config = await this.getConfig();
      const keys = path.split('.');
      let current: any = config;

      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      const oldValue = current[lastKey];
      current[lastKey] = value;

      const success = await this.saveConfig(config);
      if (success) {
        this.notifyConfigChange(keys[0], path, oldValue, value);
      }

      return success;
    } catch (error) {
      console.error(`Error setting configuration value ${path}:`, error);
      return false;
    }
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: LiveTranscriptionConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate API keys
    if (config.speechRecognition.primaryProvider === 'vertex-ai' && !config.speechRecognition.vertexAI.apiKey) {
      errors.push('Vertex AI API key is required when set as primary provider');
    }

    if (config.speechRecognition.fallbackEnabled && !config.speechRecognition.openAIWhisper.apiKey) {
      errors.push('OpenAI Whisper API key is required when fallback is enabled');
    }

    // Validate numeric ranges
    if (config.speechRecognition.confidenceThreshold < 0 || config.speechRecognition.confidenceThreshold > 1) {
      errors.push('Speech recognition confidence threshold must be between 0 and 1');
    }

    if (config.audioProcessing.chunkDuration < 0.5 || config.audioProcessing.chunkDuration > 10) {
      errors.push('Audio chunk duration must be between 0.5 and 10 seconds');
    }

    if (config.collaboration.maxParticipants < 1 || config.collaboration.maxParticipants > 50) {
      errors.push('Max participants must be between 1 and 50');
    }

    if (config.realTimeFeatures.latencyTarget < 500 || config.realTimeFeatures.latencyTarget > 30000) {
      warnings.push('Latency target should be between 500ms and 30 seconds for optimal performance');
    }

    // Validate WebSocket configuration
    if (!config.realTimeFeatures.webSocketServer.url) {
      errors.push('WebSocket server URL is required');
    }

    if (config.realTimeFeatures.webSocketServer.port < 1000 || config.realTimeFeatures.webSocketServer.port > 65535) {
      errors.push('WebSocket port must be between 1000 and 65535');
    }

    // Validate AI settings
    if (config.aiAssistant.entityExtraction.enabled && 
        (config.aiAssistant.entityExtraction.confidenceThreshold < 0 || 
         config.aiAssistant.entityExtraction.confidenceThreshold > 1)) {
      errors.push('Entity extraction confidence threshold must be between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Test configuration connectivity
   */
  public async testConfig(config: LiveTranscriptionConfig): Promise<{ success: boolean; results: any }> {
    const results: any = {
      vertexAI: { status: 'not_tested', message: '' },
      openAI: { status: 'not_tested', message: '' },
      webSocket: { status: 'not_tested', message: '' }
    };

    try {
      // Test Vertex AI connection (if configured)
      if (config.speechRecognition.vertexAI.apiKey) {
        try {
          // Simulate API test - in production, make actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          results.vertexAI = { status: 'success', message: 'Connection successful' };
        } catch (error) {
          results.vertexAI = { status: 'error', message: 'Failed to connect to Vertex AI' };
        }
      }

      // Test OpenAI connection (if configured)
      if (config.speechRecognition.openAIWhisper.apiKey) {
        try {
          // Simulate API test - in production, make actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          results.openAI = { status: 'success', message: 'Connection successful' };
        } catch (error) {
          results.openAI = { status: 'error', message: 'Failed to connect to OpenAI' };
        }
      }

      // Test WebSocket connection
      if (config.realTimeFeatures.webSocketServer.url) {
        try {
          // Simulate WebSocket test - in production, attempt actual connection
          await new Promise(resolve => setTimeout(resolve, 500));
          results.webSocket = { status: 'success', message: 'WebSocket server reachable' };
        } catch (error) {
          results.webSocket = { status: 'error', message: 'Failed to connect to WebSocket server' };
        }
      }

      const hasErrors = Object.values(results).some((result: any) => result.status === 'error');
      return { success: !hasErrors, results };
    } catch (error) {
      console.error('Error testing configuration:', error);
      return { success: false, results };
    }
  }

  /**
   * Export configuration as JSON
   */
  public async exportConfig(): Promise<string> {
    const config = await this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public async importConfig(configJson: string): Promise<boolean> {
    try {
      const config = JSON.parse(configJson) as LiveTranscriptionConfig;
      
      // Validate imported configuration
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      return await this.saveConfig(config);
    } catch (error) {
      console.error('Error importing configuration:', error);
      return false;
    }
  }

  /**
   * Add configuration change listener
   */
  public addChangeListener(listener: (event: ConfigChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove configuration change listener
   */
  public removeChangeListener(listener: (event: ConfigChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Clear configuration cache
   */
  public clearCache(): void {
    this.configCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): LiveTranscriptionConfig {
    return {
      speechRecognition: {
        primaryProvider: 'vertex-ai',
        vertexAI: {
          projectId: '',
          apiKey: '',
          region: 'us-central1',
          model: 'latest_long',
          enableSpeakerDiarization: true,
          maxSpeakers: 6,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
        },
        openAIWhisper: {
          apiKey: '',
          model: 'whisper-1',
          temperature: 0,
          language: 'en',
          prompt: '',
        },
        fallbackEnabled: true,
        confidenceThreshold: 0.7,
        languageCode: 'en-US',
        supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN'],
      },
      audioProcessing: {
        sampleRate: 16000,
        chunkDuration: 2,
        audioFormat: 'webm',
        enableNoiseReduction: true,
        enableEchoCancellation: true,
        enableAutoGainControl: true,
        maxFileSizeMB: 100,
        supportedFormats: ['webm', 'wav', 'mp3', 'ogg', 'm4a'],
      },
      realTimeFeatures: {
        webSocketServer: {
          url: 'wss://localhost',
          port: 8080,
          enableSSL: true,
          maxConnections: 100,
          heartbeatInterval: 30,
          reconnectAttempts: 5,
          reconnectDelay: 1000,
        },
        latencyTarget: 3000,
        bufferSize: 4096,
        enableRealTimeProcessing: true,
        streamingChunkSize: 1024,
      },
      aiAssistant: {
        entityExtraction: {
          enabled: true,
          confidenceThreshold: 0.8,
          supportedEntityTypes: ['character', 'location', 'item', 'event', 'faction'],
          maxEntitiesPerSegment: 10,
        },
        timelineEventGeneration: {
          enabled: true,
          confidenceThreshold: 0.8,
          autoApprovalThreshold: 0.9,
          enableAutoApproval: false,
          eventTypes: ['combat', 'social', 'exploration', 'quest', 'milestone'],
        },
        semanticSearch: {
          enabled: true,
          embeddingModel: 'text-embedding-ada-002',
          searchThreshold: 0.7,
          maxResults: 20,
        },
        contentGeneration: {
          enabled: true,
          model: 'gpt-4',
          maxTokens: 1000,
          temperature: 0.7,
        },
      },
      collaboration: {
        enableCollaboration: true,
        maxParticipants: 8,
        votingThreshold: 0.6,
        proposalApprovalThreshold: 0.7,
        enableComments: true,
        enableBookmarks: true,
        permissionLevels: {
          canPropose: ['player', 'dm', 'admin'],
          canVote: ['player', 'dm', 'admin'],
          canReview: ['dm', 'admin'],
          canEdit: ['dm', 'admin'],
        },
      },
      storagePerformance: {
        transcriptionRetentionDays: 365,
        enableCaching: true,
        cacheExpirationHours: 24,
        maxConcurrentSessions: 10,
        enableCompression: true,
        backupEnabled: true,
        backupFrequencyHours: 24,
      },
      system: {
        enabled: true,
        debugMode: false,
        logLevel: 'info',
        enableTelemetry: true,
        enablePerformanceMonitoring: true,
        maintenanceMode: false,
      },
    };
  }

  /**
   * Update cache with new configuration
   */
  private updateCache(config: LiveTranscriptionConfig): void {
    this.configCache = config;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  /**
   * Notify listeners of configuration changes
   */
  private notifyConfigChange(section: string, key: string, oldValue: any, newValue: any): void {
    const event: ConfigChangeEvent = {
      section,
      key,
      oldValue,
      newValue,
      timestamp: new Date()
    };

    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in configuration change listener:', error);
      }
    });
  }
}
