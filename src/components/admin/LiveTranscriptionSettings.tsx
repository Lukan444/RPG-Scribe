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
import { LiveTranscriptionConfigService } from '../../services/liveTranscriptionConfig.service';

/**
 * Live Transcription Configuration Interface
 */
export interface LiveTranscriptionConfig {
  // Speech Recognition Settings
  speechRecognition: {
    primaryProvider: 'vertex-ai' | 'openai-whisper';
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

/**
 * Live Transcription Settings Component
 */
export function LiveTranscriptionSettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LiveTranscriptionConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('speech');
  const [showApiKeys, { toggle: toggleShowApiKeys }] = useDisclosure(false);
  const [configJson, setConfigJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const configService = LiveTranscriptionConfigService.getInstance();

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Load configuration from service
  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const loadedConfig = await configService.getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Error loading configuration:', error);
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
      // Validate configuration using service
      const validation = configService.validateConfig(config);
      if (!validation.isValid) {
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

      // Log the activity
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

      notifications.show({
        title: 'Success',
        message: 'Live Transcription configuration saved successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
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

    // Validate API keys
    if (config.speechRecognition.primaryProvider === 'vertex-ai' && !config.speechRecognition.vertexAI.apiKey) {
      errors.push('Vertex AI API key is required');
    }
    if (config.speechRecognition.fallbackEnabled && !config.speechRecognition.openAIWhisper.apiKey) {
      errors.push('OpenAI Whisper API key is required for fallback');
    }

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
                    { value: 'openai-whisper', label: 'OpenAI Whisper' }
                  ]}
                  value={config.speechRecognition.primaryProvider}
                  onChange={(value) => updateConfig('speechRecognition.primaryProvider', value)}
                />
              </Card>

              {/* Vertex AI Settings */}
              <Card withBorder p="md">
                <Title order={5} mb="md">Vertex AI Configuration</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Project ID"
                      placeholder="your-gcp-project-id"
                      value={config.speechRecognition.vertexAI.projectId}
                      onChange={(e) => updateConfig('speechRecognition.vertexAI.projectId', e.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <PasswordInput
                      label="API Key"
                      placeholder="Your Vertex AI API key"
                      value={config.speechRecognition.vertexAI.apiKey}
                      onChange={(e) => updateConfig('speechRecognition.vertexAI.apiKey', e.currentTarget.value)}
                      visible={showApiKeys}
                      onVisibilityChange={toggleShowApiKeys}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Region"
                      data={[
                        { value: 'us-central1', label: 'US Central (Iowa)' },
                        { value: 'us-east1', label: 'US East (South Carolina)' },
                        { value: 'us-west1', label: 'US West (Oregon)' },
                        { value: 'europe-west1', label: 'Europe West (Belgium)' },
                        { value: 'asia-east1', label: 'Asia East (Taiwan)' }
                      ]}
                      value={config.speechRecognition.vertexAI.region}
                      onChange={(value) => updateConfig('speechRecognition.vertexAI.region', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Max Speakers"
                      description="Maximum number of speakers for diarization"
                      min={2}
                      max={10}
                      value={config.speechRecognition.vertexAI.maxSpeakers}
                      onChange={(value) => updateConfig('speechRecognition.vertexAI.maxSpeakers', value)}
                    />
                  </Grid.Col>
                </Grid>
                
                <Stack gap="sm" mt="md">
                  <Switch
                    label="Enable Speaker Diarization"
                    description="Identify different speakers in the audio"
                    checked={config.speechRecognition.vertexAI.enableSpeakerDiarization}
                    onChange={(e) => updateConfig('speechRecognition.vertexAI.enableSpeakerDiarization', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Automatic Punctuation"
                    description="Automatically add punctuation to transcripts"
                    checked={config.speechRecognition.vertexAI.enableAutomaticPunctuation}
                    onChange={(e) => updateConfig('speechRecognition.vertexAI.enableAutomaticPunctuation', e.currentTarget.checked)}
                  />
                  <Switch
                    label="Enable Word Time Offsets"
                    description="Include timing information for individual words"
                    checked={config.speechRecognition.vertexAI.enableWordTimeOffsets}
                    onChange={(e) => updateConfig('speechRecognition.vertexAI.enableWordTimeOffsets', e.currentTarget.checked)}
                  />
                </Stack>
              </Card>

              {/* OpenAI Whisper Settings */}
              <Card withBorder p="md">
                <Title order={5} mb="md">OpenAI Whisper Configuration</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <PasswordInput
                      label="API Key"
                      placeholder="Your OpenAI API key"
                      value={config.speechRecognition.openAIWhisper.apiKey}
                      onChange={(e) => updateConfig('speechRecognition.openAIWhisper.apiKey', e.currentTarget.value)}
                      visible={showApiKeys}
                      onVisibilityChange={toggleShowApiKeys}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Temperature"
                      description="Sampling temperature (0-1)"
                      min={0}
                      max={1}
                      step={0.1}
                      decimalScale={1}
                      value={config.speechRecognition.openAIWhisper.temperature}
                      onChange={(value) => updateConfig('speechRecognition.openAIWhisper.temperature', value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Textarea
                      label="Prompt"
                      description="Optional prompt to guide the transcription"
                      placeholder="Transcribe this RPG session audio..."
                      value={config.speechRecognition.openAIWhisper.prompt}
                      onChange={(e) => updateConfig('speechRecognition.openAIWhisper.prompt', e.currentTarget.value)}
                      minRows={2}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

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
