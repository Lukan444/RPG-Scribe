/**
 * Usage Dashboard
 *
 * This component displays usage metrics and cost information for Vertex AI integration.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Title,
  Badge,
  Progress,
  Tabs,
  Grid,
  Button,
  ActionIcon,
  Tooltip,
  Paper,
  Select,
  NumberInput,
  Switch
} from '@mantine/core';
import {
  IconChartBar,
  IconCoin,
  IconAlertTriangle,
  IconBulb,
  IconRefresh,
  IconSettings,
  IconDownload,
  IconCalendar
} from '@tabler/icons-react';
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// Import mock data for now - will be replaced with real API calls
import { mockUsageSummary, mockBudgetAllocations, mockOptimizationRecommendations } from './mockData';

/**
 * Usage dashboard props
 */
interface UsageDashboardProps {
  /** Whether to show detailed information */
  detailed?: boolean;
}/**
 * Usage dashboard component
 */
const UsageDashboard: React.FC<UsageDashboardProps> = ({ detailed = false }) => {
  // State
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date()
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [usageSummary, setUsageSummary] = useState(mockUsageSummary);
  const [budgetAllocations, setBudgetAllocations] = useState(mockBudgetAllocations);
  const [recommendations, setRecommendations] = useState(mockOptimizationRecommendations);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  // Custom handler for DatePickerInput to fix type issues
  // Using the exact DatesRangeValue<string> type that DatePickerInput expects
  const handleDateRangeChange = (value: DatesRangeValue) => {
    // Safely handle any type of input
    if (Array.isArray(value) && value.length === 2) {
      // Convert string dates to Date objects or null
      const convertedValue: [Date | null, Date | null] = [
        value[0] ? new Date(value[0]) : null,
        value[1] ? new Date(value[1]) : null
      ];
      setDateRange(convertedValue);
    }
  };

  // Load data
  useEffect(() => {
    loadData();
  }, [dateRange]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // In a real implementation, these would be API calls
      // For now, we're using mock data
      setUsageSummary(mockUsageSummary);
      setBudgetAllocations(mockBudgetAllocations);
      setRecommendations(mockOptimizationRecommendations);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load data', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load usage data',
        color: 'red'
      });
      setLoading(false);
    }
  };
  // Refresh data
  const handleRefresh = () => {
    loadData();
  };

  // Implement recommendation
  const handleImplementRecommendation = (id: string) => {
    // In a real implementation, this would be an API call
    setRecommendations(recommendations.map(rec =>
      rec.id === id ? { ...rec, implemented: true } : rec
    ));

    notifications.show({
      title: 'Success',
      message: 'Recommendation marked as implemented',
      color: 'green'
    });
  };

  // Export data
  const handleExport = () => {
    // In a real implementation, this would generate a CSV or PDF
    notifications.show({
      title: 'Export',
      message: 'Usage data exported successfully',
      color: 'blue'
    });
  };

  // Calculate total cost
  const totalCost = usageSummary.totalCost;

  // Calculate percentage of budget used
  const totalBudget = budgetAllocations.reduce((sum, allocation) => sum + allocation.budgetAmount, 0);
  const percentageUsed = (totalCost / totalBudget) * 100;

  // Determine status color
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  };
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Vertex AI Usage Dashboard</Title>
        <Group gap="xs">
          <DatePickerInput
            type="range"
            value={dateRange}
            onChange={handleDateRangeChange}
            leftSection={<IconCalendar size={16} />}
            size="sm"
          />
          <Tooltip label="Refresh data">
            <ActionIcon
              color="blue"
              variant="light"
              onClick={handleRefresh}
              loading={loading}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export data">
            <ActionIcon
              color="green"
              variant="light"
              onClick={handleExport}
            >
              <IconDownload size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Settings">
            <ActionIcon
              color="gray"
              variant="light"
              onClick={openSettings}
            >
              <IconSettings size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconChartBar size={14} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="budget" leftSection={<IconCoin size={14} />}>Budget</Tabs.Tab>
          <Tabs.Tab value="recommendations" leftSection={<IconBulb size={14} />}>Recommendations</Tabs.Tab>
          {detailed && <Tabs.Tab value="details" leftSection={<IconSettings size={14} />}>Details</Tabs.Tab>}
        </Tabs.List>        <Tabs.Panel value="overview" pt="xs">
          <Grid>
            <Grid.Col span={4}>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Text size="sm" color="dimmed">Total Cost</Text>
                  <Group justify="space-between">
                    <Title order={3}>${totalCost.toFixed(2)}</Title>
                    <Badge
                      color={getStatusColor(percentageUsed)}
                      size="lg"
                    >
                      {percentageUsed.toFixed(1)}% of Budget
                    </Badge>
                  </Group>
                  <Progress
                    value={percentageUsed}
                    color={getStatusColor(percentageUsed)}
                    size="lg"
                  />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={4}>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Text size="sm" color="dimmed">API Calls</Text>
                  <Title order={3}>{usageSummary.callCount.toLocaleString()}</Title>
                  <Group justify="space-between">
                    {Object.entries(usageSummary.callCountByType).map(([type, count]) => (
                      <Group key={type} gap="xs">
                        <Text size="xs">{type.split('_').map(word => word[0] + word.slice(1).toLowerCase()).join(' ')}:</Text>
                        <Text size="xs" fw={500}>{count.toLocaleString()}</Text>
                      </Group>
                    ))}
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={4}>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Text size="sm" color="dimmed">Recommendations</Text>
                  <Group justify="space-between">
                    <Title order={3}>{recommendations.filter(r => !r.implemented).length}</Title>
                    <Badge
                      color={recommendations.filter(r => !r.implemented).length > 0 ? 'yellow' : 'green'}
                      size="lg"
                    >
                      {recommendations.filter(r => !r.implemented).length > 0
                        ? 'Action Needed'
                        : 'All Implemented'}
                    </Badge>
                  </Group>
                  <Text size="sm">
                    Potential savings: ${recommendations
                      .filter(r => !r.implemented)
                      .reduce((sum, rec) => sum + rec.estimatedSavings, 0)
                      .toFixed(2)}/month
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={12}>
              <Card withBorder p="md">
                <Title order={4} mb="md">Cost by API Type</Title>
                <Grid>
                  {Object.entries(usageSummary.costByType).map(([type, cost]) => (
                    <Grid.Col key={type} span={3}>
                      <Paper withBorder p="xs">
                        <Group justify="space-between">
                          <Text size="sm">{type.split('_').map(word => word[0] + word.slice(1).toLowerCase()).join(' ')}</Text>
                          <Text fw={500}>${cost.toFixed(2)}</Text>
                        </Group>
                        <Progress
                          value={(cost / totalCost) * 100}
                          size="sm"
                          mt="xs"
                        />
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
        <Tabs.Panel value="budget" pt="xs">
          <Stack gap="md">
            <Card withBorder p="md">
              <Group justify="space-between">
                <Title order={4}>Budget Allocations</Title>
                <Text>Total Budget: ${totalBudget.toFixed(2)}/day</Text>
              </Group>
            </Card>

            {budgetAllocations.map(allocation => (
              <Card key={allocation.featureId} withBorder p="md">
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text fw={500}>{allocation.featureName}</Text>
                    <Text size="xs" color="dimmed">Budget: ${allocation.budgetAmount.toFixed(2)}/day</Text>
                  </Stack>
                  <Badge
                    color={getStatusColor(allocation.percentageUsed)}
                    size="lg"
                  >
                    {allocation.percentageUsed.toFixed(1)}% Used
                  </Badge>
                </Group>
                <Progress
                  value={allocation.percentageUsed}
                  color={getStatusColor(allocation.percentageUsed)}
                  size="lg"
                  mt="md"
                />
                <Group justify="space-between" mt="xs">
                  <Text size="sm">Current Usage: ${allocation.currentUsage.toFixed(2)}</Text>
                  <Group gap="xs">
                    <Text size="sm">Alert Threshold:</Text>
                    <Badge color="yellow">{allocation.alertThresholdPercent}%</Badge>
                    <Text size="sm">Hard Limit:</Text>
                    <Badge color={allocation.enforceHardLimit ? 'red' : 'gray'}>
                      {allocation.enforceHardLimit ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="recommendations" pt="xs">
          <Stack gap="md">
            <Card withBorder p="md">
              <Group justify="space-between">
                <Title order={4}>Cost Optimization Recommendations</Title>
                <Text>
                  Potential Savings: ${recommendations
                    .filter(r => !r.implemented)
                    .reduce((sum, rec) => sum + rec.estimatedSavings, 0)
                    .toFixed(2)}/month
                </Text>
              </Group>
            </Card>

            {recommendations.length === 0 ? (
              <Card withBorder p="md">
                <Text ta="center">No recommendations available</Text>
              </Card>
            ) : (
              recommendations
                .filter(rec => !rec.implemented)
                .map(recommendation => (
                  <Card key={recommendation.id} withBorder p="md">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Group gap="xs">
                          <Text fw={500}>{recommendation.title}</Text>
                          <Badge color="blue">{recommendation.type}</Badge>
                        </Group>
                        <Text size="sm">{recommendation.description}</Text>
                      </Stack>
                      <Button
                        variant="light"
                        onClick={() => handleImplementRecommendation(recommendation.id)}
                      >
                        Implement
                      </Button>
                    </Group>
                    <Group justify="space-between" mt="md">
                      <Group gap="xs">
                        <Text size="sm">Estimated Savings:</Text>
                        <Text size="sm" fw={500} color="green">
                          ${recommendation.estimatedSavings.toFixed(2)}/month
                        </Text>
                      </Group>                      <Group gap="xs">
                        <Text size="sm">Confidence:</Text>
                        <Badge
                          color={
                            recommendation.confidenceLevel >= 0.8 ? 'green' :
                            recommendation.confidenceLevel >= 0.5 ? 'yellow' :
                            'red'
                          }
                        >
                          {(recommendation.confidenceLevel * 100).toFixed(0)}%
                        </Badge>
                        <Text size="sm">Difficulty:</Text>
                        <Badge
                          color={
                            recommendation.implementationDifficulty <= 2 ? 'green' :
                            recommendation.implementationDifficulty <= 3 ? 'yellow' :
                            'red'
                          }
                        >
                          {recommendation.implementationDifficulty}/5
                        </Badge>
                      </Group>
                    </Group>
                  </Card>
                ))
            )}

            {recommendations.filter(rec => rec.implemented).length > 0 && (
              <>
                <Title order={5} mt="md">Implemented Recommendations</Title>
                {recommendations
                  .filter(rec => rec.implemented)
                  .map(recommendation => (
                    <Card key={recommendation.id} withBorder p="md" opacity={0.7}>
                      <Group justify="space-between">
                        <Stack gap={0}>
                          <Group gap="xs">
                            <Text fw={500}>{recommendation.title}</Text>
                            <Badge color="blue">{recommendation.type}</Badge>
                            <Badge color="green">Implemented</Badge>
                          </Group>
                          <Text size="sm">{recommendation.description}</Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))
                }
              </>
            )}
          </Stack>
        </Tabs.Panel>
        {detailed && (
          <Tabs.Panel value="details" pt="xs">
            <Stack gap="md">
              <Card withBorder p="md">
                <Title order={4}>Detailed Usage Metrics</Title>
                <Grid mt="md">
                  <Grid.Col span={6}>
                    <Title order={5}>Cost by User</Title>
                    {Object.entries(usageSummary.costByUser).length > 0 ? (
                      <Stack gap="xs" mt="xs">
                        {Object.entries(usageSummary.costByUser)
                          .sort(([, a], [, b]) => b - a)
                          .map(([userId, cost]) => (
                            <Group key={userId} justify="space-between">
                              <Text size="sm">{userId}</Text>
                              <Text size="sm" fw={500}>${cost.toFixed(2)}</Text>
                            </Group>
                          ))
                        }
                      </Stack>
                    ) : (
                      <Text size="sm" color="dimmed" mt="xs">No user data available</Text>
                    )}
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Title order={5}>Cost by World</Title>
                    {Object.entries(usageSummary.costByWorld).length > 0 ? (
                      <Stack gap="xs" mt="xs">
                        {Object.entries(usageSummary.costByWorld)
                          .sort(([, a], [, b]) => b - a)
                          .map(([worldId, cost]) => (
                            <Group key={worldId} justify="space-between">
                              <Text size="sm">{worldId}</Text>
                              <Text size="sm" fw={500}>${cost.toFixed(2)}</Text>
                            </Group>
                          ))
                        }
                      </Stack>
                    ) : (
                      <Text size="sm" color="dimmed" mt="xs">No world data available</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Card>
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
};export default UsageDashboard;