/**
 * Cost Optimization Settings
 *
 * This component allows users to configure cost optimization settings for Vertex AI integration.
 */

import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Stack,
  Group,
  Text,
  Switch,
  NumberInput,
  Select,
  Button,
  Divider,
  Title
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconDimensions,
  IconDatabase,
  IconSearch,
  IconPackage
} from '@tabler/icons-react';

import {
  DimensionReductionMethod,
  CostOptimizationConfig,
  DEFAULT_COST_OPTIMIZATION_CONFIG
} from '../../../functions/src/monitoring/cost-optimization';

/**
 * Cost optimization settings props
 */
interface CostOptimizationSettingsProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Initial configuration */
  initialConfig?: CostOptimizationConfig;
  /** Function to save configuration */
  onSave?: (config: CostOptimizationConfig) => void;
}/**
 * Cost optimization settings component
 */
const CostOptimizationSettings: React.FC<CostOptimizationSettingsProps> = ({
  opened,
  onClose,
  initialConfig,
  onSave
}) => {
  // State
  const [config, setConfig] = useState<CostOptimizationConfig>(
    initialConfig || DEFAULT_COST_OPTIMIZATION_CONFIG
  );
  const [activeTab, setActiveTab] = useState<string | null>('dimensionReduction');

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }

    notifications.show({
      title: 'Success',
      message: 'Cost optimization settings saved',
      color: 'green'
    });

    onClose();
  };

  // Handle reset
  const handleReset = () => {
    setConfig(DEFAULT_COST_OPTIMIZATION_CONFIG);

    notifications.show({
      title: 'Reset',
      message: 'Cost optimization settings reset to defaults',
      color: 'blue'
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cost Optimization Settings"
      size="lg"
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab
            value="dimensionReduction"
            leftSection={<IconDimensions size={14} />}
          >
            Dimension Reduction
          </Tabs.Tab>          <Tabs.Tab
            value="caching"
            leftSection={<IconDatabase size={14} />}
          >
            Caching
          </Tabs.Tab>
          <Tabs.Tab
            value="queryOptimization"
            leftSection={<IconSearch size={14} />}
          >
            Query Optimization
          </Tabs.Tab>
          <Tabs.Tab
            value="batching"
            leftSection={<IconPackage size={14} />}
          >
            Batching
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dimensionReduction" pt="xs">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Dimension Reduction</Title>
              <Switch
                label="Enabled"
                checked={config.dimensionReduction.enabled}
                onChange={(event) => setConfig({
                  ...config,
                  dimensionReduction: {
                    ...config.dimensionReduction,
                    enabled: event.currentTarget.checked
                  }
                })}
              />
            </Group>

            <Divider />

            <Select
              label="Reduction Method"
              value={config.dimensionReduction.method}
              onChange={(value) => setConfig({
                ...config,
                dimensionReduction: {
                  ...config.dimensionReduction,
                  method: value as DimensionReductionMethod
                }
              })}
              data={Object.values(DimensionReductionMethod).map(method => ({
                value: method,
                label: method.split('_').map(word => word[0] + word.slice(1).toLowerCase()).join(' ')
              }))}
              disabled={!config.dimensionReduction.enabled}
            />
            <Group grow>
              <NumberInput
                label="Original Dimension"
                value={config.dimensionReduction.originalDimension}
                onChange={(value) => setConfig({
                  ...config,
                  dimensionReduction: {
                    ...config.dimensionReduction,
                    originalDimension: typeof value === 'number' ? value : 768
                  }
                })}
                min={1}
                max={2048}
                disabled={!config.dimensionReduction.enabled}
              />

              <NumberInput
                label="Target Dimension"
                value={config.dimensionReduction.targetDimension}
                onChange={(value) => setConfig({
                  ...config,
                  dimensionReduction: {
                    ...config.dimensionReduction,
                    targetDimension: typeof value === 'number' ? value : 256
                  }
                })}
                min={1}
                max={config.dimensionReduction.originalDimension}
                disabled={!config.dimensionReduction.enabled}
              />
            </Group>

            <NumberInput
              label="Minimum Similarity Threshold (0-1)"
              value={config.dimensionReduction.minSimilarityThreshold}
              onChange={(value) => setConfig({
                ...config,
                dimensionReduction: {
                  ...config.dimensionReduction,
                  minSimilarityThreshold: typeof value === 'number' ? value : 0.9
                }
              })}
              min={0}
              max={1}
              step={0.01}
              decimalScale={2}
              disabled={!config.dimensionReduction.enabled}
            />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="caching" pt="xs">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Caching</Title>
              <Switch
                label="Enabled"
                checked={config.caching.enabled}
                onChange={(event) => setConfig({
                  ...config,
                  caching: {
                    ...config.caching,
                    enabled: event.currentTarget.checked
                  }
                })}
              />
            </Group>

            <Divider />

            <NumberInput
              label="Cache TTL (milliseconds)"
              value={config.caching.ttlMs}
              onChange={(value) => setConfig({
                ...config,
                caching: {
                  ...config.caching,
                  ttlMs: typeof value === 'number' ? value : 3600000
                }
              })}
              min={1000}
              step={1000}
              disabled={!config.caching.enabled}
            />

            <NumberInput
              label="Maximum Cache Size"
              value={config.caching.maxCacheSize}
              onChange={(value) => setConfig({
                ...config,
                caching: {
                  ...config.caching,
                  maxCacheSize: typeof value === 'number' ? value : 1000
                }
              })}
              min={10}
              disabled={!config.caching.enabled}
            />
            <Group grow>
              <NumberInput
                label="Minimum Similarity Threshold (0-1)"
                value={config.caching.minSimilarityThreshold}
                onChange={(value) => setConfig({
                  ...config,
                  caching: {
                    ...config.caching,
                    minSimilarityThreshold: typeof value === 'number' ? value : 0.95
                  }
                })}
                min={0}
                max={1}
                step={0.01}
                decimalScale={2}
                disabled={!config.caching.enabled}
              />
            </Group>

              <Switch
                label="Use Fuzzy Matching"
                checked={config.caching.useFuzzyMatching}
                onChange={(event) => setConfig({
                  ...config,
                  caching: {
                    ...config.caching,
                    useFuzzyMatching: event.currentTarget.checked
                  }
                })}
                disabled={!config.caching.enabled}
              />
          </Stack>
        </Tabs.Panel>


        <Tabs.Panel value="queryOptimization" pt="xs">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Query Optimization</Title>
              <Switch
                label="Enabled"
                checked={config.queryOptimization.enabled}
                onChange={(event) => setConfig({
                  ...config,
                  queryOptimization: {
                    ...config.queryOptimization,
                    enabled: event.currentTarget.checked
                  }
                })}
              />
            </Group>

            <Divider />
            <NumberInput
              label="Maximum Results"
              value={config.queryOptimization.maxResults}
              onChange={(value) => setConfig({
                ...config,
                queryOptimization: {
                  ...config.queryOptimization,
                  maxResults: typeof value === 'number' ? value : 10
                }
              })}
              min={1}
              max={100}
              disabled={!config.queryOptimization.enabled}
            />

            <NumberInput
              label="Minimum Similarity Threshold (0-1)"
              value={config.queryOptimization.minSimilarityThreshold}
              onChange={(value) => setConfig({
                ...config,
                queryOptimization: {
                  ...config.queryOptimization,
                  minSimilarityThreshold: typeof value === 'number' ? value : 0.7
                }
              })}
              min={0}
              max={1}
              step={0.01}
              decimalScale={2}
              disabled={!config.queryOptimization.enabled}
            />

            <Group grow>
              <Switch
                label="Use Filters"
                checked={config.queryOptimization.useFilters}
                onChange={(event) => setConfig({
                  ...config,
                  queryOptimization: {
                    ...config.queryOptimization,
                    useFilters: event.currentTarget.checked
                  }
                })}
                disabled={!config.queryOptimization.enabled}
              />
              <Switch
                label="Use Approximate Search"
                checked={config.queryOptimization.useApproximateSearch}
                onChange={(event) => setConfig({
                  ...config,
                  queryOptimization: {
                    ...config.queryOptimization,
                    useApproximateSearch: event.currentTarget.checked
                  }
                })}
                disabled={!config.queryOptimization.enabled}
              />
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="batching" pt="xs">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Batching</Title>
              <Switch
                label="Enabled"
                checked={config.batching.enabled}
                onChange={(event) => setConfig({
                  ...config,
                  batching: {
                    ...config.batching,
                    enabled: event.currentTarget.checked
                  }
                })}
              />
            </Group>

            <Divider />

            <NumberInput
              label="Maximum Batch Size"
              value={config.batching.maxBatchSize}
              onChange={(value) => setConfig({
                ...config,
                batching: {
                  ...config.batching,
                  maxBatchSize: typeof value === 'number' ? value : 10
                }
              })}
              min={2}
              max={100}
              disabled={!config.batching.enabled}
            />
            <Group grow>
              <NumberInput
                label="Minimum Batch Size"
                value={config.batching.minBatchSize}
                onChange={(value) => setConfig({
                  ...config,
                  batching: {
                    ...config.batching,
                    minBatchSize: typeof value === 'number' ? value : 2
                  }
                })}
                min={1}
                max={config.batching.maxBatchSize}
                disabled={!config.batching.enabled}
              />

              <NumberInput
                label="Maximum Wait Time (ms)"
                value={config.batching.maxWaitTimeMs}
                onChange={(value) => setConfig({
                  ...config,
                  batching: {
                    ...config.batching,
                    maxWaitTimeMs: typeof value === 'number' ? value : 100
                  }
                })}
                min={10}
                max={10000}
                step={10}
                disabled={!config.batching.enabled}
              />
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="space-between" mt="xl">
        <Button variant="outline" color="red" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </Group>
    </Modal>
  );
};

export default CostOptimizationSettings;