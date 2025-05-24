/**
 * Service Health Monitor Component
 *
 * This component displays real-time service health information for the
 * Vector AI system, including service levels, circuit breaker status,
 * and performance metrics.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Progress,
  Stack,
  Grid,
  Tooltip,
  ActionIcon,
  Alert,
  RingProgress,
  Center
} from '@mantine/core';
import {
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconRefresh,
  IconClock,
  IconTrendingUp,
  IconDatabase
} from '@tabler/icons-react';
import { ServiceLevel } from '../../services/vector/types';

/**
 * Service health data interface
 */
interface ServiceHealthData {
  level: ServiceLevel;
  vertexAIAvailable: boolean;
  localProcessorEnabled: boolean;
  cacheHitRate: number;
  responseTimeMs: number;
  errorRate: number;
  lastHealthCheck: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  cacheStats: {
    memory: { hits: number; misses: number; size: number; maxSize: number };
    localStorage: { hits: number; misses: number; size: number; maxSize: number };
    overallHitRate: number;
  };
}

/**
 * Props for ServiceHealthMonitor component
 */
interface ServiceHealthMonitorProps {
  /** Health data from the vector service */
  healthData: ServiceHealthData;
  /** Callback to refresh health data */
  onRefresh?: () => void;
  /** Whether to show detailed metrics */
  showDetails?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Get service level color
 */
const getServiceLevelColor = (level: ServiceLevel): string => {
  switch (level) {
    case ServiceLevel.FULL:
      return 'green';
    case ServiceLevel.DEGRADED:
      return 'yellow';
    case ServiceLevel.EMERGENCY:
      return 'orange';
    case ServiceLevel.OFFLINE:
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get service level description
 */
const getServiceLevelDescription = (level: ServiceLevel): string => {
  switch (level) {
    case ServiceLevel.FULL:
      return 'All AI features available with Vertex AI';
    case ServiceLevel.DEGRADED:
      return 'Local vector processing active';
    case ServiceLevel.EMERGENCY:
      return 'Keyword search only';
    case ServiceLevel.OFFLINE:
      return 'Cached results only';
    default:
      return 'Unknown service level';
  }
};

/**
 * Get circuit breaker status color
 */
const getCircuitBreakerColor = (state: string): string => {
  switch (state) {
    case 'CLOSED':
      return 'green';
    case 'HALF_OPEN':
      return 'yellow';
    case 'OPEN':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Format response time
 */
const formatResponseTime = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Service Health Monitor Component
 */
export const ServiceHealthMonitor: React.FC<ServiceHealthMonitorProps> = ({
  healthData,
  onRefresh,
  showDetails = true,
  compact = false
}) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [healthData]);

  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

  if (compact) {
    return (
      <Group gap="xs">
        <Badge
          color={getServiceLevelColor(healthData.level)}
          variant="filled"
          size="sm"
        >
          {healthData.level}
        </Badge>
        
        <Badge
          color={getCircuitBreakerColor(healthData.circuitBreakerState)}
          variant="outline"
          size="sm"
        >
          CB: {healthData.circuitBreakerState}
        </Badge>
        
        <Text size="xs" c="dimmed">
          {formatResponseTime(healthData.responseTimeMs)}
        </Text>
        
        <Text size="xs" c="dimmed">
          Cache: {Math.round(healthData.cacheHitRate * 100)}%
        </Text>
      </Group>
    );
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconActivity size={20} />
            <Text fw={600}>Vector AI Service Health</Text>
          </Group>
          
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Updated {timeSinceUpdate}s ago
            </Text>
            {onRefresh && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={onRefresh}
                aria-label="Refresh health data"
              >
                <IconRefresh size={16} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Service Level Status */}
        <Alert
          icon={healthData.level === ServiceLevel.FULL ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
          color={getServiceLevelColor(healthData.level)}
          variant="light"
        >
          <Group justify="space-between">
            <div>
              <Text fw={500}>Service Level: {healthData.level}</Text>
              <Text size="sm" c="dimmed">
                {getServiceLevelDescription(healthData.level)}
              </Text>
            </div>
            <Badge
              color={getServiceLevelColor(healthData.level)}
              variant="filled"
            >
              {healthData.level}
            </Badge>
          </Group>
        </Alert>

        {showDetails && (
          <>
            {/* Key Metrics */}
            <Grid>
              <Grid.Col span={6}>
                <Card withBorder padding="sm">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Response Time</Text>
                    <IconClock size={16} />
                  </Group>
                  <Text size="lg" fw={700} c={healthData.responseTimeMs > 5000 ? 'red' : 'green'}>
                    {formatResponseTime(healthData.responseTimeMs)}
                  </Text>
                  <Progress
                    value={Math.min((healthData.responseTimeMs / 10000) * 100, 100)}
                    color={healthData.responseTimeMs > 5000 ? 'red' : 'green'}
                    size="sm"
                    mt="xs"
                  />
                </Card>
              </Grid.Col>

              <Grid.Col span={6}>
                <Card withBorder padding="sm">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Cache Hit Rate</Text>
                    <IconDatabase size={16} />
                  </Group>
                  <Text size="lg" fw={700} c={healthData.cacheHitRate > 0.7 ? 'green' : 'orange'}>
                    {Math.round(healthData.cacheHitRate * 100)}%
                  </Text>
                  <Progress
                    value={healthData.cacheHitRate * 100}
                    color={healthData.cacheHitRate > 0.7 ? 'green' : 'orange'}
                    size="sm"
                    mt="xs"
                  />
                </Card>
              </Grid.Col>
            </Grid>

            {/* Service Status Indicators */}
            <Grid>
              <Grid.Col span={4}>
                <Group gap="xs">
                  {healthData.vertexAIAvailable ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconX size={16} color="red" />
                  )}
                  <Text size="sm">Vertex AI</Text>
                </Group>
              </Grid.Col>

              <Grid.Col span={4}>
                <Group gap="xs">
                  {healthData.localProcessorEnabled ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconX size={16} color="gray" />
                  )}
                  <Text size="sm">Local Processor</Text>
                </Group>
              </Grid.Col>

              <Grid.Col span={4}>
                <Group gap="xs">
                  <Badge
                    color={getCircuitBreakerColor(healthData.circuitBreakerState)}
                    variant="outline"
                    size="sm"
                  >
                    {healthData.circuitBreakerState}
                  </Badge>
                  <Text size="sm">Circuit Breaker</Text>
                </Group>
              </Grid.Col>
            </Grid>

            {/* Error Rate */}
            {healthData.errorRate > 0 && (
              <Alert
                icon={<IconTrendingUp size={16} />}
                color="orange"
                variant="light"
              >
                <Text size="sm">
                  Error Rate: {Math.round(healthData.errorRate * 100)}%
                  {healthData.consecutiveFailures > 0 && (
                    <Text span c="dimmed" ml="xs">
                      ({healthData.consecutiveFailures} consecutive failures)
                    </Text>
                  )}
                </Text>
              </Alert>
            )}

            {/* Cache Statistics */}
            <Card withBorder padding="sm">
              <Text size="sm" fw={500} mb="xs">Cache Performance</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Group justify="space-between">
                    <Text size="xs">Memory Cache</Text>
                    <Text size="xs" c="dimmed">
                      {healthData.cacheStats.memory.size}/{healthData.cacheStats.memory.maxSize}
                    </Text>
                  </Group>
                  <Progress
                    value={(healthData.cacheStats.memory.size / healthData.cacheStats.memory.maxSize) * 100}
                    size="xs"
                    color="blue"
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Group justify="space-between">
                    <Text size="xs">Local Storage</Text>
                    <Text size="xs" c="dimmed">
                      {healthData.cacheStats.localStorage.size}/{healthData.cacheStats.localStorage.maxSize}
                    </Text>
                  </Group>
                  <Progress
                    value={(healthData.cacheStats.localStorage.size / healthData.cacheStats.localStorage.maxSize) * 100}
                    size="xs"
                    color="cyan"
                  />
                </Grid.Col>
              </Grid>
            </Card>
          </>
        )}
      </Stack>
    </Card>
  );
};

export default ServiceHealthMonitor;
