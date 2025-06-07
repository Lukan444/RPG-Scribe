/**
 * Live Transcription Settings Component
 * 
 * Administrative configuration interface for Live Session Transcription & AI Assistant
 * Provides comprehensive settings management for all transcription features
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Switch,
  Select,
  NumberInput,
  TextInput,
  PasswordInput,
  Textarea,
  Alert,
  Tabs,
  Card,
  Badge,
  Divider,
  Loader,
  ActionIcon,
  Tooltip,
  Grid,
  Collapse,
  JsonInput
} from '@mantine/core';
import {
  IconMicrophone,
  IconBrain,
  IconUsers,
  IconServer,
  IconDatabase,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconEye,
  IconEyeOff,
  IconTestPipe,
  IconSettings
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityLogService } from '../../services/activityLog.service';
import { ActivityAction } from '../../models/ActivityLog';
import { useTranscriptionLogger } from '../../hooks/useSystemLogger';
import { LogCategory } from '../../utils/liveTranscriptionLogger';
import { LiveTranscriptionConfigService } from '../../services/liveTranscriptionConfig.service';
import { AdminAccessGuard } from './transcription/AdminAccessGuard';
import { ProviderConfigurationCard } from './transcription/ProviderConfigurationCard';
import { APIConnectivityService } from '../../services/transcription/APIConnectivityService';

/**
 * Live Transcription Configuration Interface
 */
export interface LiveTranscriptionConfig {
  // Speech Recognition Settings
  speechRecognition: {
    primaryProvider: 'vertex-ai' | 'openai-whisper' | 'ollama';
    vertexAI: {
      projectId: string;
      apiKey: string;
      region: string;
      model: string;
      enableSpeakerDiarization: boolean;
      maxSpeakers: number;
      enableAutomaticPunctuation: boolean;
      enableWordTimeOffsets: boolean;
    };
    openAIWhisper: {
      apiKey: string;
      model: 'whisper-1';
      temperature: number;
      language: string;
      prompt: string;
    };
    ollama: {
      serverUrl: string;
      model: string;
      temperature: number;
      enableLocalProcessing: boolean;
    };
    fallbackEnabled: boolean;
    confidenceThreshold: number;
    languageCode: string;
    supportedLanguages: string[];
  };

  // Audio Processing Settings
  audioProcessing: {
    sampleRate: number;
    chunkDuration: number;
    audioFormat: 'webm' | 'wav' | 'mp3';
    enableNoiseReduction: boolean;
    enableEchoCancellation: boolean;
    enableAutoGainControl: boolean;
    maxFileSizeMB: number;
    supportedFormats: string[];
    // Audio Device Selection
    selectedMicrophoneId: string;
    selectedSpeakerId: string;
    availableMicrophones: MediaDeviceInfo[];
    availableSpeakers: MediaDeviceInfo[];
  };

  // Real-time Features
  realTimeFeatures: {
    webSocketServer: {
      url: string;
      port: number;
      enableSSL: boolean;
      maxConnections: number;
      heartbeatInterval: number;
      reconnectAttempts: number;
      reconnectDelay: number;
    };
    latencyTarget: number;
    bufferSize: number;
    enableRealTimeProcessing: boolean;
    streamingChunkSize: number;
    fallbackToBatchMode: boolean; // Graceful degradation when WebSocket fails
  };

  // AI Assistant Settings
  aiAssistant: {
    entityExtraction: {
      enabled: boolean;
      confidenceThreshold: number;
      supportedEntityTypes: string[];
      maxEntitiesPerSegment: number;
    };
    timelineEventGeneration: {
      enabled: boolean;
      confidenceThreshold: number;
      autoApprovalThreshold: number;
      enableAutoApproval: boolean;
      eventTypes: string[];
    };
    semanticSearch: {
      enabled: boolean;
      embeddingModel: string;
      searchThreshold: number;
      maxResults: number;
    };
    contentGeneration: {
      enabled: boolean;
      model: string;
      maxTokens: number;
      temperature: number;
    };
  };

  // Collaboration Settings
  collaboration: {
    enableCollaboration: boolean;
    maxParticipants: number;
    votingThreshold: number;
    proposalApprovalThreshold: number;
    enableComments: boolean;
    enableBookmarks: boolean;
    permissionLevels: {
      canPropose: string[];
      canVote: string[];
      canReview: string[];
      canEdit: string[];
    };
  };

  // Storage & Performance
  storagePerformance: {
    transcriptionRetentionDays: number;
    enableCaching: boolean;
    cacheExpirationHours: number;
    maxConcurrentSessions: number;
    enableCompression: boolean;
    backupEnabled: boolean;
    backupFrequencyHours: number;
  };

  // System Settings
  system: {
    enabled: boolean;
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableTelemetry: boolean;
    enablePerformanceMonitoring: boolean;
    maintenanceMode: boolean;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: LiveTranscriptionConfig = {
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
    ollama: {
      serverUrl: 'http://localhost:11434',
      model: '',
      temperature: 0,
      enableLocalProcessing: true,
    },
    fallbackEnabled: true,
    confidenceThreshold: 0.7,
    languageCode: 'en-US',
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'pl-PL', 'ja-JP', 'ko-KR', 'zh-CN'],
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
    // Audio Device Selection
    selectedMicrophoneId: 'default',
    selectedSpeakerId: 'default',
    availableMicrophones: [],
    availableSpeakers: [],
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
    fallbackToBatchMode: true, // Enable graceful degradation by default
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

/**
 * Live Transcription Settings Component (Internal)
 */
function LiveTranscriptionSettingsInternal() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LiveTranscriptionConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('speech');
  const [showApiKeys, { toggle: toggleShowApiKeys }] = useDisclosure(false);
  const [configJson, setConfigJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const configService = LiveTranscriptionConfigService.getInstance();
  const logger = useTranscriptionLogger();

  // Load configuration on component mount (but not audio devices due to permission restrictions)
  useEffect(() => {
    loadConfiguration();
    // Note: loadAudioDevices() is not called automatically due to browser permission restrictions
    // Users must click "Refresh Devices" to trigger microphone permission request
  }, []);

  // Load configuration from service
  const loadConfiguration = async () => {
    setLoading(true);
    try {
      logger.debug(LogCategory.CONFIG, 'Loading Live Transcription configuration', {
        userId: user?.id
      });
      const loadedConfig = await configService.getConfig();
      setConfig(loadedConfig);
      logger.info(LogCategory.CONFIG, 'Live Transcription configuration loaded successfully', {
        userId: user?.id,
        primaryProvider: loadedConfig.speechRecognition.primaryProvider,
        fallbackEnabled: loadedConfig.speechRecognition.fallbackEnabled,
        language: loadedConfig.speechRecognition.languageCode
      });
    } catch (error) {
      logger.error(LogCategory.CONFIG, 'Failed to load Live Transcription configuration', error as Error, {
        userId: user?.id
      });
      notifications.show({
        title: 'Error',
        message: 'Failed to load transcription configuration',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Save configuration
  const saveConfiguration = async () => {
    setSaveLoading(true);
    try {
      logger.info(LogCategory.CONFIG, 'Starting Live Transcription configuration save', {
        userId: user?.id,
        userName: user?.name,
        configSections: Object.keys(config)
      });

      // Validate configuration using service
      const validation = configService.validateConfig(config);
      if (!validation.isValid) {
        logger.warn(LogCategory.CONFIG, 'Configuration validation failed', {
          errors: validation.errors,
          userId: user?.id
        });
        notifications.show({
          title: 'Validation Error',
          message: validation.errors.join(', '),
          color: 'red',
          icon: <IconX size={16} />
        });
        return;
      }

      // Save using service
      const success = await configService.saveConfig(config);
      if (!success) {
        throw new Error('Failed to save configuration');
      }

      // Log the user activity (for audit purposes)
      if (user && user.id && user.name && user.email) {
        const activityLogService = ActivityLogService.getInstance();
        await activityLogService.logActivity(
          user.id,
          user.name,
          user.email,
          ActivityAction.ADMIN_ACTION,
          'Updated Live Transcription configuration settings',
          '127.0.0.1',
          navigator.userAgent
        );
      }

      // Log the technical operation (for system monitoring)
      logger.info(LogCategory.CONFIG, 'Live Transcription configuration saved successfully', {
        userId: user?.id,
        userName: user?.name,
        configSections: Object.keys(config),
        primaryProvider: config.speechRecognition.primaryProvider,
        fallbackEnabled: config.speechRecognition.fallbackEnabled,
        language: config.speechRecognition.languageCode
      });

      notifications.show({
        title: 'Success',
        message: 'Live Transcription configuration saved successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      logger.error(LogCategory.CONFIG, 'Failed to save Live Transcription configuration', error as Error, {
        userId: user?.id,
        userName: user?.name,
        configSections: Object.keys(config)
      });
      notifications.show({
        title: 'Error',
        message: 'Failed to save configuration',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Validate configuration
  const validateConfiguration = (config: LiveTranscriptionConfig): string[] => {
    const errors: string[] = [];

    // Validate primary provider API keys
    if (config.speechRecognition.primaryProvider === 'vertex-ai' && !config.speechRecognition.vertexAI.apiKey) {
      errors.push('Vertex AI API key is required when set as primary provider');
    }
    if (config.speechRecognition.primaryProvider === 'openai-whisper' && !config.speechRecognition.openAIWhisper.apiKey) {
      errors.push('OpenAI Whisper API key is required when set as primary provider');
    }

    // Note: Fallback provider validation is now handled as warnings, not errors
    // This allows users to save partial configurations

    // Validate numeric ranges
    if (config.speechRecognition.confidenceThreshold < 0 || config.speechRecognition.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }
    if (config.audioProcessing.chunkDuration < 0.5 || config.audioProcessing.chunkDuration > 10) {
      errors.push('Chunk duration must be between 0.5 and 10 seconds');
    }
    if (config.collaboration.maxParticipants < 1 || config.collaboration.maxParticipants > 50) {
      errors.push('Max participants must be between 1 and 50');
    }

    return errors;
  };

  // Test configuration
  const testConfiguration = async () => {
    setTestLoading(true);
    try {
      const testResult = await configService.testConfig(config);

      if (testResult.success) {
        notifications.show({
          title: 'Test Successful',
          message: 'Configuration test completed successfully',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        notifications.show({
          title: 'Test Failed',
          message: 'Some configuration tests failed. Check your settings.',
          color: 'orange',
          icon: <IconAlertTriangle size={16} />
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Test Failed',
        message: 'Configuration test failed. Please check your settings.',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Export configuration
  const exportConfiguration = async () => {
    try {
      const configJson = await configService.exportConfig();
      const configBlob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(configBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'live-transcription-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.show({
        title: 'Export Complete',
        message: 'Configuration exported successfully',
        color: 'blue',
        icon: <IconDownload size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Export Failed',
        message: 'Failed to export configuration',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Import configuration
  const importConfiguration = async () => {
    try {
      setImportError(null);
      const success = await configService.importConfig(configJson);

      if (success) {
        const newConfig = await configService.getConfig();
        setConfig(newConfig);
        setConfigJson('');

        notifications.show({
          title: 'Import Successful',
          message: 'Configuration imported successfully',
          color: 'green',
          icon: <IconUpload size={16} />
        });
      } else {
        setImportError('Failed to import configuration');
      }
    } catch (error) {
      setImportError('Invalid JSON format or configuration');
    }
  };

  // Update configuration helper
  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  // Load available audio devices
  const loadAudioDevices = async () => {
    setDevicesLoading(true);
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');

      setConfig(prev => ({
        ...prev,
        audioProcessing: {
          ...prev.audioProcessing,
          availableMicrophones: microphones,
          availableSpeakers: speakers
        }
      }));

      console.log('Audio devices loaded:', { microphones: microphones.length, speakers: speakers.length });
    } catch (error) {
      console.error('Failed to load audio devices:', error);
      notifications.show({
        title: 'Audio Device Error',
        message: 'Failed to load audio devices. Please check microphone permissions.',
        color: 'red'
      });
    } finally {
      setDevicesLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper withBorder p="md" radius="md">
        <Group justify="center">
          <Loader size="lg" />
          <Text>Loading Live Transcription Settings...</Text>
        </Group>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconMicrophone size={24} />
            <Title order={4}>Live Transcription Settings</Title>
            <Badge color={config.system.enabled ? 'green' : 'red'} variant="filled">
              {config.system.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </Group>
          
          <Group gap="xs">
            <Tooltip label="Test Configuration">
              <ActionIcon
                variant="light"
                color="blue"
                onClick={testConfiguration}
                loading={testLoading}
              >
                <IconTestPipe size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Export Configuration">
              <ActionIcon variant="light" onClick={exportConfiguration}>
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={saveConfiguration}
              loading={saveLoading}
            >
              Save Configuration
            </Button>
          </Group>
        </Group>

        {/* System Status */}
        <Alert
          color={config.system.enabled ? 'green' : 'orange'}
          title={config.system.enabled ? 'Live Transcription Active' : 'Live Transcription Disabled'}
          icon={config.system.enabled ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
        >
          {config.system.enabled 
            ? 'Live Session Transcription is currently enabled and available to users.'
            : 'Live Session Transcription is disabled. Enable it in the System tab to activate the feature.'
          }
        </Alert>

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'speech')}>
          <Tabs.List>
            <Tabs.Tab value="speech" leftSection={<IconMicrophone size={16} />}>
              Speech Recognition
            </Tabs.Tab>
            <Tabs.Tab value="ai" leftSection={<IconBrain size={16} />}>
              AI Assistant
            </Tabs.Tab>
            <Tabs.Tab value="collaboration" leftSection={<IconUsers size={16} />}>
              Collaboration
            </Tabs.Tab>
            <Tabs.Tab value="performance" leftSection={<IconServer size={16} />}>
              Performance
            </Tabs.Tab>
            <Tabs.Tab value="system" leftSection={<IconSettings size={16} />}>
              System
            </Tabs.Tab>
            <Tabs.Tab value="import" leftSection={<IconUpload size={16} />}>
              Import/Export
            </Tabs.Tab>
          </Tabs.List>

          {/* Speech Recognition Tab */}
          <Tabs.Panel value="speech" pt="md">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={5} mb="md">Primary Provider</Title>
                <Select
                  label="Speech Recognition Provider"
                  description="Primary provider for speech-to-text processing"
                  data={[
                    { value: 'vertex-ai', label: 'Google Vertex AI Speech-to-Text' },
                    { value: 'openai-whisper', label: 'OpenAI Whisper' },
                    { value: 'ollama', label: 'Ollama (Local)' }
                  ]}
                  value={config.speechRecognition.primaryProvider}
                  onChange={(value) => updateConfig('speechRecognition.primaryProvider', value)}
                />
              </Card>

              {/* Provider Configuration Cards */}
              <ProviderConfigurationCard
                provider="vertex-ai"
                title="Google Vertex AI Speech-to-Text"
                description="Google Cloud's enterprise-grade speech recognition service with advanced features like speaker diarization and punctuation."
                config={config.speechRecognition.vertexAI}
                onConfigChange={(newConfig) => updateConfig('speechRecognition.vertexAI', newConfig)}
                disabled={loading || saveLoading}
              />

              <ProviderConfigurationCard
                provider="openai-whisper"
                title="OpenAI Whisper"
                description="OpenAI's robust speech recognition model with multilingual support and high accuracy."
                config={config.speechRecognition.openAIWhisper}
                onConfigChange={(newConfig) => updateConfig('speechRecognition.openAIWhisper', newConfig)}
                disabled={loading || saveLoading}
              />

              <ProviderConfigurationCard
                provider="ollama"
                title="Ollama (Local Processing)"
                description="Run speech recognition locally using Ollama for complete privacy and offline processing."
                config={config.speechRecognition.ollama}
                onConfigChange={(newConfig) => updateConfig('speechRecognition.ollama', newConfig)}
                disabled={loading || saveLoading}
              />



              {/* General Settings */}
              <Card withBorder p="md">
                <Title order={5} mb="md">General Settings</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Language"
                      data={config.speechRecognition.supportedLanguages.map(lang => ({
                        value: lang,
                        label: lang
                      }))}
                      value={config.speechRecognition.languageCode}
                      onChange={(value) => updateConfig('speechRecognition.languageCode', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Confidence Threshold"
                      description="Minimum confidence for accepting transcription results"
                      min={0}
                      max={1}
                      step={0.1}
                      decimalScale={1}
                      value={config.speechRecognition.confidenceThreshold}
                      onChange={(value) => updateConfig('speechRecognition.confidenceThreshold', value)}
                    />
                  </Grid.Col>
                </Grid>
                
                <Switch
                  label="Enable Fallback Provider"
                  description="Use OpenAI Whisper as fallback when primary provider fails"
                  checked={config.speechRecognition.fallbackEnabled}
                  onChange={(e) => updateConfig('speechRecognition.fallbackEnabled', e.currentTarget.checked)}
                  mt="md"
                />
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* AI Assistant Tab */}
          <Tabs.Panel value="ai" pt="md">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={5} mb="md">Entity Extraction</Title>
                <Switch
                  label="Enable Entity Extraction"
                  description="Automatically extract characters, locations, items, and events from transcription"
                  checked={config.aiAssistant.entityExtraction.enabled}
                  onChange={(e) => updateConfig('aiAssistant.entityExtraction.enabled', e.currentTarget.checked)}
                  mb="md"
                />

                {config.aiAssistant.entityExtraction.enabled && (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <NumberInput
                        label="Confidence Threshold"
                        description="Minimum confidence for entity extraction"
                        min={0}
                        max={1}
                        step={0.1}
                        decimalScale={1}
                        value={config.aiAssistant.entityExtraction.confidenceThreshold}
                        onChange={(value) => updateConfig('aiAssistant.entityExtraction.confidenceThreshold', value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <NumberInput
                        label="Max Entities Per Segment"
                        description="Maximum entities to extract per transcription segment"
                        min={1}
                        max={20}
                        value={config.aiAssistant.entityExtraction.maxEntitiesPerSegment}
                        onChange={(value) => updateConfig('aiAssistant.entityExtraction.maxEntitiesPerSegment', value)}
                      />
                    </Grid.Col>
                  </Grid>
                )}
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Timeline Event Generation</Title>
                <Switch
                  label="Enable Timeline Event Generation"
                  description="Automatically generate timeline events from transcription analysis"
                  checked={config.aiAssistant.timelineEventGeneration.enabled}
                  onChange={(e) => updateConfig('aiAssistant.timelineEventGeneration.enabled', e.currentTarget.checked)}
                  mb="md"
                />

                {config.aiAssistant.timelineEventGeneration.enabled && (
                  <Stack gap="md">
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Confidence Threshold"
                          description="Minimum confidence for event generation"
                          min={0}
                          max={1}
                          step={0.1}
                          decimalScale={1}
                          value={config.aiAssistant.timelineEventGeneration.confidenceThreshold}
                          onChange={(value) => updateConfig('aiAssistant.timelineEventGeneration.confidenceThreshold', value)}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Auto-Approval Threshold"
                          description="Confidence level for automatic event approval"
                          min={0}
                          max={1}
                          step={0.1}
                          decimalScale={1}
                          value={config.aiAssistant.timelineEventGeneration.autoApprovalThreshold}
                          onChange={(value) => updateConfig('aiAssistant.timelineEventGeneration.autoApprovalThreshold', value)}
                        />
                      </Grid.Col>
                    </Grid>

                    <Switch
                      label="Enable Auto-Approval"
                      description="Automatically approve high-confidence timeline events"
                      checked={config.aiAssistant.timelineEventGeneration.enableAutoApproval}
                      onChange={(e) => updateConfig('aiAssistant.timelineEventGeneration.enableAutoApproval', e.currentTarget.checked)}
                    />
                  </Stack>
                )}
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Content Generation</Title>
                <Switch
                  label="Enable Content Generation"
                  description="AI-powered content generation and enhancement"
                  checked={config.aiAssistant.contentGeneration.enabled}
                  onChange={(e) => updateConfig('aiAssistant.contentGeneration.enabled', e.currentTarget.checked)}
                  mb="md"
                />

                {config.aiAssistant.contentGeneration.enabled && (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Select
                        label="Model"
                        data={[
                          { value: 'gpt-4', label: 'GPT-4' },
                          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                          { value: 'claude-3', label: 'Claude 3' }
                        ]}
                        value={config.aiAssistant.contentGeneration.model}
                        onChange={(value) => updateConfig('aiAssistant.contentGeneration.model', value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <NumberInput
                        label="Max Tokens"
                        description="Maximum tokens for content generation"
                        min={100}
                        max={4000}
                        value={config.aiAssistant.contentGeneration.maxTokens}
                        onChange={(value) => updateConfig('aiAssistant.contentGeneration.maxTokens', value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <NumberInput
                        label="Temperature"
                        description="Creativity level (0-1)"
                        min={0}
                        max={1}
                        step={0.1}
                        decimalScale={1}
                        value={config.aiAssistant.contentGeneration.temperature}
                        onChange={(value) => updateConfig('aiAssistant.contentGeneration.temperature', value)}
                      />
                    </Grid.Col>
                  </Grid>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Collaboration Tab */}
          <Tabs.Panel value="collaboration" pt="md">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={5} mb="md">Collaboration Features</Title>
                <Switch
                  label="Enable Collaboration"
                  description="Allow multiple players to collaborate on transcription sessions"
                  checked={config.collaboration.enableCollaboration}
                  onChange={(e) => updateConfig('collaboration.enableCollaboration', e.currentTarget.checked)}
                  mb="md"
                />

                {config.collaboration.enableCollaboration && (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <NumberInput
                        label="Max Participants"
                        description="Maximum number of participants per session"
                        min={1}
                        max={50}
                        value={config.collaboration.maxParticipants}
                        onChange={(value) => updateConfig('collaboration.maxParticipants', value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <NumberInput
                        label="Voting Threshold"
                        description="Percentage of votes needed for approval (0-1)"
                        min={0}
                        max={1}
                        step={0.1}
                        decimalScale={1}
                        value={config.collaboration.votingThreshold}
                        onChange={(value) => updateConfig('collaboration.votingThreshold', value)}
                      />
                    </Grid.Col>
                  </Grid>
                )}
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Permission Levels</Title>
                <Text size="sm" c="dimmed" mb="md">
                  Configure which user roles can perform specific collaboration actions
                </Text>

                <Stack gap="md">
                  <Group>
                    <Text size="sm" fw={500} style={{ minWidth: 120 }}>Can Propose:</Text>
                    <Group gap="xs">
                      {['player', 'dm', 'admin'].map(role => (
                        <Badge
                          key={role}
                          variant={config.collaboration.permissionLevels.canPropose.includes(role) ? 'filled' : 'outline'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const current = config.collaboration.permissionLevels.canPropose;
                            const updated = current.includes(role)
                              ? current.filter(r => r !== role)
                              : [...current, role];
                            updateConfig('collaboration.permissionLevels.canPropose', updated);
                          }}
                        >
                          {role}
                        </Badge>
                      ))}
                    </Group>
                  </Group>

                  <Group>
                    <Text size="sm" fw={500} style={{ minWidth: 120 }}>Can Vote:</Text>
                    <Group gap="xs">
                      {['player', 'dm', 'admin'].map(role => (
                        <Badge
                          key={role}
                          variant={config.collaboration.permissionLevels.canVote.includes(role) ? 'filled' : 'outline'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const current = config.collaboration.permissionLevels.canVote;
                            const updated = current.includes(role)
                              ? current.filter(r => r !== role)
                              : [...current, role];
                            updateConfig('collaboration.permissionLevels.canVote', updated);
                          }}
                        >
                          {role}
                        </Badge>
                      ))}
                    </Group>
                  </Group>

                  <Group>
                    <Text size="sm" fw={500} style={{ minWidth: 120 }}>Can Review:</Text>
                    <Group gap="xs">
                      {['player', 'dm', 'admin'].map(role => (
                        <Badge
                          key={role}
                          variant={config.collaboration.permissionLevels.canReview.includes(role) ? 'filled' : 'outline'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const current = config.collaboration.permissionLevels.canReview;
                            const updated = current.includes(role)
                              ? current.filter(r => r !== role)
                              : [...current, role];
                            updateConfig('collaboration.permissionLevels.canReview', updated);
                          }}
                        >
                          {role}
                        </Badge>
                      ))}
                    </Group>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Performance Tab */}
          <Tabs.Panel value="performance" pt="md">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={5} mb="md">Audio Processing</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Sample Rate (Hz)"
                      description="Audio sample rate for processing"
                      value={config.audioProcessing.sampleRate}
                      onChange={(value) => updateConfig('audioProcessing.sampleRate', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Chunk Duration (seconds)"
                      description="Duration of audio chunks for processing"
                      min={0.5}
                      max={10}
                      step={0.5}
                      decimalScale={1}
                      value={config.audioProcessing.chunkDuration}
                      onChange={(value) => updateConfig('audioProcessing.chunkDuration', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Audio Format"
                      data={[
                        { value: 'webm', label: 'WebM' },
                        { value: 'wav', label: 'WAV' },
                        { value: 'mp3', label: 'MP3' }
                      ]}
                      value={config.audioProcessing.audioFormat}
                      onChange={(value) => updateConfig('audioProcessing.audioFormat', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Max File Size (MB)"
                      description="Maximum file size for uploads"
                      min={1}
                      max={500}
                      value={config.audioProcessing.maxFileSizeMB}
                      onChange={(value) => updateConfig('audioProcessing.maxFileSizeMB', value)}
                    />
                  </Grid.Col>
                </Grid>

                <Stack gap="sm" mt="md">
                  <Switch
                    label="Enable Noise Reduction"
                    checked={config.audioProcessing.enableNoiseReduction}
                    onChange={(e) => updateConfig('audioProcessing.enableNoiseReduction', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Echo Cancellation"
                    checked={config.audioProcessing.enableEchoCancellation}
                    onChange={(e) => updateConfig('audioProcessing.enableEchoCancellation', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Auto Gain Control"
                    checked={config.audioProcessing.enableAutoGainControl}
                    onChange={(e) => updateConfig('audioProcessing.enableAutoGainControl', e.currentTarget.checked)}
                  />
                </Stack>

                {/* Audio Device Selection */}
                <Divider my="md" label="Audio Device Selection" labelPosition="center" />
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Microphone"
                      description="Select the microphone for audio capture"
                      placeholder={devicesLoading ? "Loading devices..." : (config.audioProcessing.availableMicrophones?.length > 0 ? "Select microphone" : "Click 'Refresh Devices' to load microphones")}
                      data={(config.audioProcessing.availableMicrophones || []).map(device => ({
                        value: device.deviceId,
                        label: device.label || `Microphone ${device.deviceId.slice(0, 8)}...`
                      }))}
                      value={config.audioProcessing.selectedMicrophoneId}
                      onChange={(value) => updateConfig('audioProcessing.selectedMicrophoneId', value)}
                      disabled={devicesLoading || (config.audioProcessing.availableMicrophones?.length === 0)}
                      rightSection={devicesLoading ? <Loader size="xs" /> : undefined}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Speaker/Headphones"
                      description="Select the audio output device"
                      placeholder={devicesLoading ? "Loading devices..." : (config.audioProcessing.availableSpeakers?.length > 0 ? "Select speaker" : "Click 'Refresh Devices' to load speakers")}
                      data={(config.audioProcessing.availableSpeakers || []).map(device => ({
                        value: device.deviceId,
                        label: device.label || `Speaker ${device.deviceId.slice(0, 8)}...`
                      }))}
                      value={config.audioProcessing.selectedSpeakerId}
                      onChange={(value) => updateConfig('audioProcessing.selectedSpeakerId', value)}
                      disabled={devicesLoading || (config.audioProcessing.availableSpeakers?.length === 0)}
                      rightSection={devicesLoading ? <Loader size="xs" /> : undefined}
                    />
                  </Grid.Col>
                </Grid>

                <Group mt="sm">
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconRefresh size={14} />}
                    onClick={loadAudioDevices}
                    loading={devicesLoading}
                  >
                    Refresh Devices
                  </Button>
                  <Text size="xs" c="dimmed">
                    {(config.audioProcessing.availableMicrophones || []).length} microphones, {(config.audioProcessing.availableSpeakers || []).length} speakers detected
                  </Text>
                </Group>
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Real-time Features</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="WebSocket Server URL"
                      placeholder="wss://your-server.com"
                      value={config.realTimeFeatures.webSocketServer.url}
                      onChange={(e) => updateConfig('realTimeFeatures.webSocketServer.url', e.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="WebSocket Port"
                      min={1000}
                      max={65535}
                      value={config.realTimeFeatures.webSocketServer.port}
                      onChange={(value) => updateConfig('realTimeFeatures.webSocketServer.port', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Latency Target (ms)"
                      description="Target latency for real-time processing"
                      min={500}
                      max={10000}
                      value={config.realTimeFeatures.latencyTarget}
                      onChange={(value) => updateConfig('realTimeFeatures.latencyTarget', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Max Concurrent Sessions"
                      description="Maximum number of concurrent transcription sessions"
                      min={1}
                      max={100}
                      value={config.storagePerformance.maxConcurrentSessions}
                      onChange={(value) => updateConfig('storagePerformance.maxConcurrentSessions', value)}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Storage & Caching</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Transcription Retention (days)"
                      description="How long to keep transcription data"
                      min={1}
                      max={3650}
                      value={config.storagePerformance.transcriptionRetentionDays}
                      onChange={(value) => updateConfig('storagePerformance.transcriptionRetentionDays', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Cache Expiration (hours)"
                      description="How long to cache transcription data"
                      min={1}
                      max={168}
                      value={config.storagePerformance.cacheExpirationHours}
                      onChange={(value) => updateConfig('storagePerformance.cacheExpirationHours', value)}
                    />
                  </Grid.Col>
                </Grid>

                <Stack gap="sm" mt="md">
                  <Switch
                    label="Enable Caching"
                    description="Cache transcription data for improved performance"
                    checked={config.storagePerformance.enableCaching}
                    onChange={(e) => updateConfig('storagePerformance.enableCaching', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Compression"
                    description="Compress stored transcription data"
                    checked={config.storagePerformance.enableCompression}
                    onChange={(e) => updateConfig('storagePerformance.enableCompression', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Backup"
                    description="Automatically backup transcription data"
                    checked={config.storagePerformance.backupEnabled}
                    onChange={(e) => updateConfig('storagePerformance.backupEnabled', e.currentTarget.checked)}
                  />
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* System Tab */}
          <Tabs.Panel value="system" pt="md">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={5} mb="md">System Control</Title>
                <Switch
                  label="Enable Live Transcription"
                  description="Master switch for the entire Live Transcription system"
                  checked={config.system.enabled}
                  onChange={(e) => updateConfig('system.enabled', e.currentTarget.checked)}
                  size="lg"
                  mb="md"
                />

                <Switch
                  label="Maintenance Mode"
                  description="Disable transcription features for maintenance"
                  checked={config.system.maintenanceMode}
                  onChange={(e) => updateConfig('system.maintenanceMode', e.currentTarget.checked)}
                  mb="md"
                />
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Monitoring & Logging</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Log Level"
                      data={[
                        { value: 'error', label: 'Error' },
                        { value: 'warn', label: 'Warning' },
                        { value: 'info', label: 'Info' },
                        { value: 'debug', label: 'Debug' }
                      ]}
                      value={config.system.logLevel}
                      onChange={(value) => updateConfig('system.logLevel', value)}
                    />
                  </Grid.Col>
                </Grid>

                <Stack gap="sm" mt="md">
                  <Switch
                    label="Debug Mode"
                    description="Enable detailed debugging information"
                    checked={config.system.debugMode}
                    onChange={(e) => updateConfig('system.debugMode', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Telemetry"
                    description="Send anonymous usage data for improvement"
                    checked={config.system.enableTelemetry}
                    onChange={(e) => updateConfig('system.enableTelemetry', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Performance Monitoring"
                    description="Monitor system performance and metrics"
                    checked={config.system.enablePerformanceMonitoring}
                    onChange={(e) => updateConfig('system.enablePerformanceMonitoring', e.currentTarget.checked)}
                  />
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Import/Export Tab */}
          <Tabs.Panel value="import" pt="md">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={5} mb="md">Export Configuration</Title>
                <Text size="sm" c="dimmed" mb="md">
                  Export your current Live Transcription configuration for backup or deployment to other environments.
                </Text>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={exportConfiguration}
                  variant="light"
                >
                  Export Configuration
                </Button>
              </Card>

              <Card withBorder p="md">
                <Title order={5} mb="md">Import Configuration</Title>
                <Text size="sm" c="dimmed" mb="md">
                  Import a previously exported configuration file. This will replace your current settings.
                </Text>

                <JsonInput
                  label="Configuration JSON"
                  placeholder="Paste your configuration JSON here..."
                  value={configJson}
                  onChange={setConfigJson}
                  minRows={10}
                  maxRows={20}
                  mb="md"
                  error={importError}
                />

                <Group>
                  <Button
                    leftSection={<IconUpload size={16} />}
                    onClick={importConfiguration}
                    disabled={!configJson.trim()}
                  >
                    Import Configuration
                  </Button>
                  <Button
                    variant="light"
                    onClick={() => {
                      setConfigJson('');
                      setImportError(null);
                    }}
                  >
                    Clear
                  </Button>
                </Group>
              </Card>

              <Alert color="orange" title="Warning" icon={<IconAlertTriangle size={16} />}>
                Importing a configuration will replace all current settings. Make sure to export your current
                configuration first if you want to keep it as a backup.
              </Alert>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
}

/**
 * Live Transcription Settings Component with Admin Access Guard
 */
export function LiveTranscriptionSettings() {
  return (
    <AdminAccessGuard
      feature="Live Session Transcription Settings"
      description="Configure speech recognition providers, AI models, and system-wide transcription settings. This feature requires administrator privileges to access API keys and modify system configuration."
    >
      <LiveTranscriptionSettingsInternal />
    </AdminAccessGuard>
  );
}
