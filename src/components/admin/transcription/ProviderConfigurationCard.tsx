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
  Textarea,
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
  Indicator,
  FileInput,
  Tabs
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
  IconShield,
  IconUpload,
  IconFile,
  IconFileText
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { APIConnectivityService, ProviderInfo, ModelInfo } from '../../../services/transcription/APIConnectivityService';

/**
 * Comprehensive Google Cloud regions list
 */
const GOOGLE_CLOUD_REGIONS = [
  // Americas
  { value: 'us-central1', label: 'us-central1 (Iowa, USA)' },
  { value: 'us-east1', label: 'us-east1 (South Carolina, USA)' },
  { value: 'us-east4', label: 'us-east4 (Northern Virginia, USA)' },
  { value: 'us-west1', label: 'us-west1 (Oregon, USA)' },
  { value: 'us-west2', label: 'us-west2 (Los Angeles, USA)' },
  { value: 'us-west3', label: 'us-west3 (Salt Lake City, USA)' },
  { value: 'us-west4', label: 'us-west4 (Las Vegas, USA)' },
  { value: 'northamerica-northeast1', label: 'northamerica-northeast1 (Montreal, Canada)' },
  { value: 'northamerica-northeast2', label: 'northamerica-northeast2 (Toronto, Canada)' },
  { value: 'southamerica-east1', label: 'southamerica-east1 (São Paulo, Brazil)' },
  { value: 'southamerica-west1', label: 'southamerica-west1 (Santiago, Chile)' },

  // Europe
  { value: 'europe-central2', label: 'europe-central2 (Warsaw, Poland)' },
  { value: 'europe-north1', label: 'europe-north1 (Hamina, Finland)' },
  { value: 'europe-southwest1', label: 'europe-southwest1 (Madrid, Spain)' },
  { value: 'europe-west1', label: 'europe-west1 (St. Ghislain, Belgium)' },
  { value: 'europe-west2', label: 'europe-west2 (London, England)' },
  { value: 'europe-west3', label: 'europe-west3 (Frankfurt, Germany)' },
  { value: 'europe-west4', label: 'europe-west4 (Eemshaven, Netherlands)' },
  { value: 'europe-west6', label: 'europe-west6 (Zurich, Switzerland)' },
  { value: 'europe-west8', label: 'europe-west8 (Milan, Italy)' },
  { value: 'europe-west9', label: 'europe-west9 (Paris, France)' },
  { value: 'europe-west10', label: 'europe-west10 (Berlin, Germany)' },
  { value: 'europe-west12', label: 'europe-west12 (Turin, Italy)' },

  // Asia Pacific
  { value: 'asia-east1', label: 'asia-east1 (Changhua County, Taiwan)' },
  { value: 'asia-east2', label: 'asia-east2 (Hong Kong)' },
  { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo, Japan)' },
  { value: 'asia-northeast2', label: 'asia-northeast2 (Osaka, Japan)' },
  { value: 'asia-northeast3', label: 'asia-northeast3 (Seoul, South Korea)' },
  { value: 'asia-south1', label: 'asia-south1 (Mumbai, India)' },
  { value: 'asia-south2', label: 'asia-south2 (Delhi, India)' },
  { value: 'asia-southeast1', label: 'asia-southeast1 (Jurong West, Singapore)' },
  { value: 'asia-southeast2', label: 'asia-southeast2 (Jakarta, Indonesia)' },
  { value: 'australia-southeast1', label: 'australia-southeast1 (Sydney, Australia)' },
  { value: 'australia-southeast2', label: 'australia-southeast2 (Melbourne, Australia)' },

  // Middle East & Africa
  { value: 'me-central1', label: 'me-central1 (Doha, Qatar)' },
  { value: 'me-central2', label: 'me-central2 (Dammam, Saudi Arabia)' },
  { value: 'me-west1', label: 'me-west1 (Tel Aviv, Israel)' },
  { value: 'africa-south1', label: 'africa-south1 (Johannesburg, South Africa)' }
];

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [credentialsMethod, setCredentialsMethod] = useState<'manual' | 'upload'>('manual');

  const connectivityService = APIConnectivityService.getInstance();

  // Load provider information on mount and when config changes
  useEffect(() => {
    loadProviderInfo();
  }, [provider, config.apiKey]);

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
      // Get provider info with actual config values
      const info = await connectivityService.getProviderInfo(provider);

      // Override API key status with actual config values
      const actualApiKey = provider === 'ollama' ? '' : config.apiKey;
      const actualApiKeyStatus = await connectivityService.testAPIKey(provider, actualApiKey);

      setProviderInfo({
        ...info,
        apiKeyStatus: actualApiKeyStatus
      });
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
   * Validate Service Account JSON structure
   */
  const validateServiceAccountJSON = (jsonContent: string): { valid: boolean; error?: string; data?: any } => {
    try {
      const parsed = JSON.parse(jsonContent);

      // Check for required Service Account fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri'];
      const missingFields = requiredFields.filter(field => !parsed[field]);

      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Missing required Service Account fields: ${missingFields.join(', ')}`
        };
      }

      if (parsed.type !== 'service_account') {
        return {
          valid: false,
          error: 'Invalid JSON: type must be "service_account"'
        };
      }

      return { valid: true, data: parsed };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid JSON format'
      };
    }
  };

  /**
   * Handle Service Account JSON file upload
   */
  const handleFileUpload = async (file: File | null) => {
    setUploadedFile(file);
    setFileUploadError(null);

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setFileUploadError('Please upload a JSON file');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setFileUploadError('File size must be less than 1MB');
      return;
    }

    try {
      const fileContent = await file.text();
      const validation = validateServiceAccountJSON(fileContent);

      if (!validation.valid) {
        setFileUploadError(validation.error || 'Invalid Service Account JSON');
        return;
      }

      // Auto-populate configuration
      const serviceAccount = validation.data;
      const updates: any = {
        apiKey: fileContent,
        projectId: serviceAccount.project_id
      };

      onConfigChange({ ...config, ...updates });

      notifications.show({
        title: 'Service Account Uploaded',
        message: `Successfully loaded Service Account for project: ${serviceAccount.project_id}`,
        color: 'green',
        icon: <IconCheck size={16} />
      });

    } catch (error) {
      setFileUploadError('Failed to read file content');
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
                You can either upload your Service Account JSON file or manually paste the credentials.
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
                <Button
                  size="xs"
                  variant="outline"
                  component="a"
                  href="/docs/vertex-ai-setup-guide.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Setup Guide
                </Button>
              </Group>
            </Alert>

            <TextInput
              label="Project ID"
              placeholder="your-gcp-project-id"
              value={config.projectId || ''}
              onChange={(e) => onConfigChange({ ...config, projectId: e.target.value })}
              disabled={disabled}
              description="This will be auto-populated when you upload a Service Account JSON file"
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
                <Text size="sm" fw={500}>Service Account Credentials</Text>
                <Badge size="xs" color="green" variant="light">
                  JSON File Recommended
                </Badge>
              </Group>

              <Tabs value={credentialsMethod} onChange={(value) => setCredentialsMethod(value as 'manual' | 'upload')}>
                <Tabs.List>
                  <Tabs.Tab value="upload" leftSection={<IconUpload size={14} />}>
                    Upload JSON File
                  </Tabs.Tab>
                  <Tabs.Tab value="manual" leftSection={<IconFileText size={14} />}>
                    Manual Entry
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="upload" pt="md">
                  <Stack gap="sm">
                    <FileInput
                      label="Service Account JSON File"
                      placeholder="Click to upload your Service Account JSON file"
                      accept=".json"
                      value={uploadedFile}
                      onChange={handleFileUpload}
                      disabled={disabled}
                      leftSection={<IconFile size={16} />}
                      description="Upload the JSON file downloaded from Google Cloud Console"
                      error={fileUploadError}
                    />

                    {uploadedFile && !fileUploadError && (
                      <Alert
                        icon={<IconCheck size={16} />}
                        title="File Uploaded Successfully"
                        color="green"
                        variant="light"
                      >
                        <Text size="sm">
                          Service Account credentials have been loaded from: <strong>{uploadedFile.name}</strong>
                        </Text>
                      </Alert>
                    )}
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="manual" pt="md">
                  <Stack gap="xs">
                    <Textarea
                      label="Service Account JSON"
                      placeholder="Paste your Service Account JSON content here"
                      value={config.apiKey || ''}
                      onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
                      disabled={disabled}
                      description="Paste the entire JSON content from your Service Account file"
                      minRows={4}
                      autosize
                    />

                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={showApiKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                        onClick={toggleShowApiKey}
                      >
                        {showApiKey ? 'Hide' : 'Show'} JSON Content
                      </Button>

                      {process.env.REACT_APP_VERTEX_AI_API_KEY && (
                        <Badge size="xs" color="green" variant="light">
                          Auto-populated from environment
                        </Badge>
                      )}
                    </Group>

                    {!showApiKey && config.apiKey && (
                      <Text size="xs" c="dimmed">
                        JSON content is hidden for security. Click "Show JSON Content" to view.
                      </Text>
                    )}
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </Stack>

            <Select
              label="Region"
              placeholder="Select a Google Cloud region"
              value={config.region || ''}
              onChange={(value) => onConfigChange({ ...config, region: value })}
              data={GOOGLE_CLOUD_REGIONS}
              disabled={disabled}
              searchable
              description="Choose the region closest to your users for optimal performance"
              rightSection={
                process.env.REACT_APP_VERTEX_AI_LOCATION ? (
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
