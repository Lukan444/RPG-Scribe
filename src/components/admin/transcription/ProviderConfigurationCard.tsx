/**
 * Provider Configuration Card Component
 * 
 * Enhanced configuration card for transcription providers with:
 * - Auto-populated environment variables
 * - API key status indicators
 * - Dynamic model lists
 * - Direct setup links and tooltips
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  TextInput,
  PasswordInput,
  Select,
  Switch,
  NumberInput,
  Tooltip,
  ActionIcon,
  Loader,
  Alert,
  Anchor,
  Divider,
  ThemeIcon,
  Progress,
  Indicator
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconExternalLink,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconTestPipe,
  IconInfoCircle,
  IconKey,
  IconServer,
  IconClock,
  IconShield
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { APIConnectivityService, ProviderInfo, ModelInfo } from '../../../services/transcription/APIConnectivityService';

/**
 * Provider configuration props
 */
export interface ProviderConfigurationCardProps {
  provider: 'vertex-ai' | 'openai-whisper' | 'ollama';
  title: string;
  description: string;
  config: any;
  onConfigChange: (config: any) => void;
  disabled?: boolean;
}

/**
 * Provider Configuration Card Component
 */
export function ProviderConfigurationCard({
  provider,
  title,
  description,
  config,
  onConfigChange,
  disabled = false
}: ProviderConfigurationCardProps) {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showApiKey, { toggle: toggleShowApiKey }] = useDisclosure(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const connectivityService = APIConnectivityService.getInstance();

  // Load provider information on mount
  useEffect(() => {
    loadProviderInfo();
  }, [provider]);

  // Auto-populate from environment variables
  useEffect(() => {
    autoPopulateConfig();
  }, [provider]);

  /**
   * Load provider information and status
   */
  const loadProviderInfo = async () => {
    setLoading(true);
    try {
      const info = await connectivityService.getProviderInfo(provider);
      setProviderInfo(info);
      setAvailableModels(info.availableModels);
    } catch (error) {
      console.error('Failed to load provider info:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-populate configuration from environment variables
   */
  const autoPopulateConfig = () => {
    const updates: any = {};

    switch (provider) {
      case 'vertex-ai':
        if (process.env.REACT_APP_VERTEX_AI_PROJECT_ID && !config.projectId) {
          updates.projectId = process.env.REACT_APP_VERTEX_AI_PROJECT_ID;
        }
        if (process.env.REACT_APP_VERTEX_AI_API_KEY && !config.apiKey) {
          updates.apiKey = process.env.REACT_APP_VERTEX_AI_API_KEY;
        }
        if (process.env.REACT_APP_VERTEX_AI_LOCATION && !config.region) {
          updates.region = process.env.REACT_APP_VERTEX_AI_LOCATION;
        }
        break;

      case 'openai-whisper':
        if (process.env.REACT_APP_OPENAI_API_KEY && !config.apiKey) {
          updates.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
        }
        break;

      case 'ollama':
        if (!config.serverUrl) {
          updates.serverUrl = 'http://localhost:11434';
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      onConfigChange({ ...config, ...updates });
    }
  };

  /**
   * Test API connectivity
   */
  const testConnectivity = async () => {
    setTesting(true);
    try {
      const apiKey = provider === 'ollama' ? '' : config.apiKey;
      const status = await connectivityService.testAPIKey(provider, apiKey);
      
      if (status.valid) {
        notifications.show({
          title: 'Connection Successful',
          message: `${title} is configured correctly`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        notifications.show({
          title: 'Connection Failed',
          message: status.error || 'Failed to connect to service',
          color: 'red',
          icon: <IconX size={16} />
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Test Failed',
        message: 'Unable to test connection',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setTesting(false);
    }
  };

  /**
   * Refresh available models
   */
  const refreshModels = async () => {
    setModelsLoading(true);
    try {
      const apiKey = provider === 'ollama' ? '' : config.apiKey;
      const models = await connectivityService.getAvailableModels(provider, apiKey);
      setAvailableModels(models);
      
      notifications.show({
        title: 'Models Updated',
        message: `Found ${models.length} available models`,
        color: 'blue',
        icon: <IconRefresh size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Refresh Failed',
        message: 'Unable to fetch available models',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setModelsLoading(false);
    }
  };

  /**
   * Get status color based on provider info
   */
  const getStatusColor = () => {
    if (!providerInfo) return 'gray';
    if (providerInfo.apiKeyStatus.valid && providerInfo.serviceStatus.status === 'online') return 'green';
    if (providerInfo.apiKeyStatus.configured) return 'yellow';
    return 'red';
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    if (!providerInfo) return 'Loading...';
    if (!providerInfo.apiKeyStatus.configured) return 'Not Configured';
    if (!providerInfo.apiKeyStatus.valid) return 'Invalid Configuration';
    if (providerInfo.serviceStatus.status === 'offline') return 'Service Offline';
    if (providerInfo.serviceStatus.status === 'degraded') return 'Service Degraded';
    return 'Ready';
  };

  /**
   * Render setup help for unconfigured services
   */
  const renderSetupHelp = () => {
    if (!providerInfo || providerInfo.apiKeyStatus.configured) return null;

    return (
      <Alert
        icon={<IconInfoCircle size={16} />}
        title="Setup Required"
        color="blue"
        variant="light"
      >
        <Stack gap="xs">
          <Text size="sm">
            This service is not configured. Get started by obtaining an API key:
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconKey size={14} />}
              component="a"
              href={providerInfo.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get API Key
            </Button>
            <Button
              size="xs"
              variant="outline"
              leftSection={<IconExternalLink size={14} />}
              component="a"
              href={providerInfo.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </Button>
            <Button
              size="xs"
              variant="outline"
              leftSection={<IconExternalLink size={14} />}
              component="a"
              href={providerInfo.pricingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Pricing
            </Button>
          </Group>
        </Stack>
      </Alert>
    );
  };

  /**
   * Render provider-specific configuration fields
   */
  const renderConfigFields = () => {
    switch (provider) {
      case 'vertex-ai':
        return (
          <Stack gap="md">
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Authentication Method"
              color="blue"
              variant="light"
            >
              <Text size="sm">
                Google Vertex AI Speech-to-Text requires <strong>Service Account JSON credentials</strong> rather than API keys.
                If you're using an API key and getting authentication errors, please switch to Service Account authentication.
              </Text>
              <Group gap="xs" mt="xs">
                <Button
                  size="xs"
                  variant="light"
                  component="a"
                  href="https://cloud.google.com/docs/authentication/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Service Account Guide
                </Button>
              </Group>
            </Alert>

            <TextInput
              label="Project ID"
              placeholder="your-gcp-project-id"
              value={config.projectId || ''}
              onChange={(e) => onConfigChange({ ...config, projectId: e.target.value })}
              disabled={disabled}
              rightSection={
                process.env.REACT_APP_VERTEX_AI_PROJECT_ID ? (
                  <Tooltip label="Auto-populated from environment">
                    <ThemeIcon size="sm" color="green" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  </Tooltip>
                ) : null
              }
            />

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Credentials</Text>
                <Badge size="xs" color="orange" variant="light">
                  Service Account JSON Recommended
                </Badge>
              </Group>

              <PasswordInput
                label="API Key or Service Account JSON"
                placeholder="Enter API key or paste Service Account JSON"
                value={config.apiKey || ''}
                onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
                disabled={disabled}
                visible={showApiKey}
                onVisibilityChange={toggleShowApiKey}
                description="For best results, use Service Account JSON credentials instead of API keys"
                rightSection={
                  process.env.REACT_APP_VERTEX_AI_API_KEY ? (
                    <Tooltip label="Auto-populated from environment">
                      <ThemeIcon size="sm" color="green" variant="light">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    </Tooltip>
                  ) : null
                }
              />
            </Stack>

            <TextInput
              label="Region"
              placeholder="us-central1"
              value={config.region || ''}
              onChange={(e) => onConfigChange({ ...config, region: e.target.value })}
              disabled={disabled}
            />

            <Select
              label="Model"
              placeholder="Select a model"
              value={config.model || ''}
              onChange={(value) => onConfigChange({ ...config, model: value })}
              data={availableModels.map(model => ({
                value: model.id,
                label: model.name,
                disabled: model.status !== 'available'
              }))}
              disabled={disabled}
              rightSection={
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={refreshModels}
                  loading={modelsLoading}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              }
            />
          </Stack>
        );

      case 'openai-whisper':
        return (
          <Stack gap="md">
            <PasswordInput
              label="API Key"
              placeholder="sk-..."
              value={config.apiKey || ''}
              onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
              disabled={disabled}
              visible={showApiKey}
              onVisibilityChange={toggleShowApiKey}
              rightSection={
                process.env.REACT_APP_OPENAI_API_KEY ? (
                  <Tooltip label="Auto-populated from environment">
                    <ThemeIcon size="sm" color="green" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  </Tooltip>
                ) : null
              }
            />
            
            <Select
              label="Model"
              value={config.model || ''}
              onChange={(value) => onConfigChange({ ...config, model: value })}
              data={availableModels.map(model => ({
                value: model.id,
                label: model.name,
                disabled: model.status !== 'available'
              }))}
              disabled={disabled}
              rightSection={
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={refreshModels}
                  loading={modelsLoading}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              }
            />
            
            <NumberInput
              label="Temperature"
              description="Controls randomness in transcription"
              value={config.temperature || 0}
              onChange={(value) => onConfigChange({ ...config, temperature: value })}
              min={0}
              max={1}
              step={0.1}
              disabled={disabled}
            />
          </Stack>
        );

      case 'ollama':
        return (
          <Stack gap="md">
            <TextInput
              label="Server URL"
              placeholder="http://localhost:11434"
              value={config.serverUrl || ''}
              onChange={(e) => onConfigChange({ ...config, serverUrl: e.target.value })}
              disabled={disabled}
            />
            
            <Select
              label="Model"
              placeholder="Select a local model"
              value={config.model || ''}
              onChange={(value) => onConfigChange({ ...config, model: value })}
              data={availableModels.map(model => ({
                value: model.id,
                label: model.name,
                disabled: model.status !== 'available'
              }))}
              disabled={disabled}
              rightSection={
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={refreshModels}
                  loading={modelsLoading}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              }
            />
            
            {availableModels.length === 0 && (
              <Alert
                icon={<IconInfoCircle size={16} />}
                title="No Models Found"
                color="orange"
                variant="light"
              >
                <Text size="sm">
                  No local models detected. Make sure Ollama is running and has models installed.
                </Text>
                <Group gap="xs" mt="xs">
                  <Button
                    size="xs"
                    variant="light"
                    component="a"
                    href="https://ollama.ai/library"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Browse Models
                  </Button>
                </Group>
              </Alert>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card withBorder p="md">
        <Group justify="center">
          <Loader size="sm" />
          <Text size="sm">Loading provider information...</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <Text fw={500} size="lg">{title}</Text>
            <Indicator
              inline
              size={8}
              offset={2}
              position="middle-end"
              color={getStatusColor()}
              processing={providerInfo?.serviceStatus.status === 'degraded'}
            >
              <Badge
                color={getStatusColor()}
                variant="light"
                size="sm"
              >
                {getStatusText()}
              </Badge>
            </Indicator>
          </Group>
          
          <Group gap="xs">
            <Tooltip label="Test Connection">
              <ActionIcon
                variant="light"
                onClick={testConnectivity}
                loading={testing}
                disabled={disabled}
              >
                <IconTestPipe size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Refresh Status">
              <ActionIcon
                variant="light"
                onClick={loadProviderInfo}
                disabled={disabled}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Text size="sm" c="dimmed">{description}</Text>

        {/* Service Status */}
        {providerInfo && (
          <Group gap="md">
            <Group gap="xs">
              <ThemeIcon size="sm" color={providerInfo.serviceStatus.status === 'online' ? 'green' : 'red'} variant="light">
                <IconServer size={12} />
              </ThemeIcon>
              <Text size="xs">
                {providerInfo.serviceStatus.name}: {providerInfo.serviceStatus.status}
              </Text>
            </Group>
            
            {providerInfo.serviceStatus.latency && (
              <Group gap="xs">
                <ThemeIcon size="sm" color="blue" variant="light">
                  <IconClock size={12} />
                </ThemeIcon>
                <Text size="xs">
                  {providerInfo.serviceStatus.latency}ms
                </Text>
              </Group>
            )}
          </Group>
        )}

        {/* Setup Help */}
        {renderSetupHelp()}

        <Divider />

        {/* Configuration Fields */}
        {renderConfigFields()}

        {/* Model Information */}
        {availableModels.length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Available Models ({availableModels.length})</Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={refreshModels}
                  loading={modelsLoading}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Group>
              
              <Stack gap="xs">
                {availableModels.slice(0, 3).map(model => (
                  <Group key={model.id} justify="space-between">
                    <Group gap="xs">
                      <Badge
                        size="xs"
                        color={model.status === 'available' ? 'green' : model.status === 'deprecated' ? 'orange' : 'red'}
                        variant="light"
                      >
                        {model.status}
                      </Badge>
                      <Text size="xs">{model.name}</Text>
                    </Group>
                    {model.capabilities && (
                      <Text size="xs" c="dimmed">
                        {model.capabilities.slice(0, 2).join(', ')}
                      </Text>
                    )}
                  </Group>
                ))}
                
                {availableModels.length > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{availableModels.length - 3} more models available
                  </Text>
                )}
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
