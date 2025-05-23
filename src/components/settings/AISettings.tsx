import React, { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Switch,
  Select,
  NumberInput,
  Textarea,
  Card,
  Divider,
  Button,
  Alert,
  Tabs,
  PasswordInput,
  TextInput,
  Slider,
  Badge,
  ActionIcon,
  Tooltip,
  LoadingOverlay
} from '@mantine/core';
import {
  IconBrain,
  IconTemplate,
  IconSettings,
  IconInfoCircle,
  IconKey,
  IconRefresh,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useAISettings } from '../../hooks/useAISettings';
import { PromptTemplateList } from './PromptTemplateList';
import { AIProvider, AIModelConfig } from '../../types/ai';

const AI_PROVIDERS: { value: AIProvider; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI', description: 'GPT models from OpenAI' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude models from Anthropic' },
  { value: 'google', label: 'Google', description: 'Gemini models from Google' },
  { value: 'local', label: 'Local', description: 'Self-hosted models' },
  { value: 'custom', label: 'Custom', description: 'Custom API endpoint' }
];

const RESPONSE_FORMATS = [
  { value: 'text', label: 'Plain Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' }
];

export const AISettings: React.FC = () => {
  const {
    aiSettings,
    promptTemplates,
    loading,
    error,
    updateAISettings,
    createPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    executePrompt,
    refresh
  } = useAISettings();

  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [testingConnection, setTestingConnection] = useState<AIProvider | null>(null);

  if (loading && !aiSettings) {
    return (
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconX size={16} />} color="red">
        <Group justify="space-between">
          <Text>Error loading AI settings: {error}</Text>
          <Button size="xs" variant="light" onClick={refresh}>
            Retry
          </Button>
        </Group>
      </Alert>
    );
  }

  if (!aiSettings) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        AI settings not available. Please try refreshing the page.
      </Alert>
    );
  }

  const handleSettingUpdate = async (updates: Partial<typeof aiSettings>) => {
    try {
      await updateAISettings(updates);
    } catch (error) {
      console.error('Failed to update AI settings:', error);
    }
  };

  const handleModelConfigUpdate = async (provider: AIProvider, config: Partial<AIModelConfig>) => {
    const updatedModels = {
      ...aiSettings.models,
      [provider]: {
        ...aiSettings.models[provider],
        ...config
      }
    };
    await handleSettingUpdate({ models: updatedModels });
  };

  const testConnection = async (provider: AIProvider) => {
    setTestingConnection(provider);
    // Mock connection test - in real implementation, this would test the actual API
    setTimeout(() => {
      setTestingConnection(null);
      // Show success/error notification based on test result
    }, 2000);
  };

  const currentProviderConfig = aiSettings.models[aiSettings.defaultProvider];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Text size="lg" fw={600}>AI Settings</Text>
          <Text size="sm" c="dimmed">
            Configure AI providers and prompt templates for enhanced RPG content generation
          </Text>
        </div>
        <Group gap="xs">
          <ActionIcon variant="light" onClick={refresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="general" leftSection={<IconSettings size={16} />}>
            General
          </Tabs.Tab>
          <Tabs.Tab value="providers" leftSection={<IconBrain size={16} />}>
            AI Providers
          </Tabs.Tab>
          <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
            Prompt Templates
          </Tabs.Tab>
        </Tabs.List>

        {/* General Settings */}
        <Tabs.Panel value="general" pt="md">
          <Stack gap="md">
            <Card withBorder p="md">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={500}>Enable AI Features</Text>
                    <Text size="sm" c="dimmed">
                      Turn on AI-powered content generation and suggestions
                    </Text>
                  </div>
                  <Switch
                    checked={aiSettings.enabled}
                    onChange={(e) => handleSettingUpdate({ enabled: e.target.checked })}
                  />
                </Group>

                {aiSettings.enabled && (
                  <>
                    <Divider />
                    
                    <Select
                      label="Default AI Provider"
                      description="Choose your preferred AI provider for content generation"
                      data={AI_PROVIDERS}
                      value={aiSettings.defaultProvider}
                      onChange={(value) => handleSettingUpdate({ defaultProvider: value as AIProvider })}
                    />

                    <Group grow>
                      <Select
                        label="Response Format"
                        description="Default format for AI responses"
                        data={RESPONSE_FORMATS}
                        value={aiSettings.responseFormat}
                        onChange={(value) => handleSettingUpdate({ responseFormat: value as any })}
                      />
                      <NumberInput
                        label="Context Window"
                        description="Maximum context length in tokens"
                        value={aiSettings.contextWindow}
                        onChange={(value) => handleSettingUpdate({ contextWindow: Number(value) })}
                        min={1000}
                        max={32000}
                        step={1000}
                      />
                    </Group>

                    <Group grow>
                      <Switch
                        label="Auto Suggestions"
                        description="Enable automatic content suggestions"
                        checked={aiSettings.autoSuggestions}
                        onChange={(e) => handleSettingUpdate({ autoSuggestions: e.target.checked })}
                      />
                      <Switch
                        label="Safety Filters"
                        description="Enable content safety filtering"
                        checked={aiSettings.safetyFilters}
                        onChange={(e) => handleSettingUpdate({ safetyFilters: e.target.checked })}
                      />
                    </Group>

                    <Textarea
                      label="Custom Instructions"
                      description="Additional instructions to include with all AI requests"
                      placeholder="Enter custom instructions for the AI..."
                      value={aiSettings.customInstructions}
                      onChange={(e) => handleSettingUpdate({ customInstructions: e.target.value })}
                      minRows={3}
                    />
                  </>
                )}
              </Stack>
            </Card>

            {!aiSettings.enabled && (
              <Alert icon={<IconInfoCircle size={16} />} color="blue">
                Enable AI features to access advanced content generation capabilities including 
                character backgrounds, location descriptions, and story development assistance.
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>

        {/* AI Providers */}
        <Tabs.Panel value="providers" pt="md">
          <Stack gap="md">
            {AI_PROVIDERS.map((provider) => {
              const config = aiSettings.models[provider.value];
              const isActive = aiSettings.defaultProvider === provider.value;
              
              return (
                <Card key={provider.value} withBorder p="md">
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <div>
                        <Group align="center" gap="sm">
                          <Text fw={500}>{provider.label}</Text>
                          {isActive && (
                            <Badge color="green" variant="light" size="sm">
                              Active
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed">
                          {provider.description}
                        </Text>
                      </div>
                      <Group gap="xs">
                        <Tooltip label="Test connection">
                          <ActionIcon
                            variant="light"
                            onClick={() => testConnection(provider.value)}
                            loading={testingConnection === provider.value}
                          >
                            {testingConnection === provider.value ? (
                              <IconRefresh size={16} />
                            ) : (
                              <IconCheck size={16} />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    <Group grow>
                      <TextInput
                        label="Model"
                        placeholder="Model name"
                        value={config.model}
                        onChange={(e) => handleModelConfigUpdate(provider.value, { model: e.target.value })}
                      />
                      {(provider.value === 'local' || provider.value === 'custom') && (
                        <TextInput
                          label="Endpoint"
                          placeholder="API endpoint URL"
                          value={config.endpoint || ''}
                          onChange={(e) => handleModelConfigUpdate(provider.value, { endpoint: e.target.value })}
                        />
                      )}
                    </Group>

                    {provider.value !== 'local' && (
                      <PasswordInput
                        label="API Key"
                        placeholder="Enter API key"
                        value={config.apiKey || ''}
                        onChange={(e) => handleModelConfigUpdate(provider.value, { apiKey: e.target.value })}
                        leftSection={<IconKey size={16} />}
                      />
                    )}

                    <Divider label="Model Parameters" labelPosition="center" />

                    <Group grow>
                      <div>
                        <Text size="sm" mb="xs">Temperature: {config.temperature}</Text>
                        <Slider
                          value={config.temperature}
                          onChange={(value) => handleModelConfigUpdate(provider.value, { temperature: value })}
                          min={0}
                          max={2}
                          step={0.1}
                          marks={[
                            { value: 0, label: 'Focused' },
                            { value: 1, label: 'Balanced' },
                            { value: 2, label: 'Creative' }
                          ]}
                        />
                      </div>
                      <NumberInput
                        label="Max Tokens"
                        value={config.maxTokens}
                        onChange={(value) => handleModelConfigUpdate(provider.value, { maxTokens: Number(value) })}
                        min={1}
                        max={4000}
                      />
                    </Group>

                    <Group grow>
                      <div>
                        <Text size="sm" mb="xs">Top P: {config.topP}</Text>
                        <Slider
                          value={config.topP}
                          onChange={(value) => handleModelConfigUpdate(provider.value, { topP: value })}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </div>
                      <div>
                        <Text size="sm" mb="xs">Frequency Penalty: {config.frequencyPenalty}</Text>
                        <Slider
                          value={config.frequencyPenalty}
                          onChange={(value) => handleModelConfigUpdate(provider.value, { frequencyPenalty: value })}
                          min={-2}
                          max={2}
                          step={0.1}
                        />
                      </div>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Tabs.Panel>

        {/* Prompt Templates */}
        <Tabs.Panel value="templates" pt="md">
          <PromptTemplateList
            templates={promptTemplates}
            onCreateTemplate={createPromptTemplate}
            onUpdateTemplate={updatePromptTemplate}
            onDeleteTemplate={deletePromptTemplate}
            onExecuteTemplate={executePrompt}
            loading={loading}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
