/**
 * Timeline Setup Guide Component
 *
 * Provides guidance for users to set up their timeline system,
 * including sample data population and authentication handling.
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Alert,
  Group,
  Badge,
  Divider,
  List,
  ThemeIcon,
  Progress,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconTimeline,
  IconDatabase,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconTrash,
  IconDownload,
  IconUser,
  IconWorld
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRPGWorld } from '../../contexts/RPGWorldContext';
import { sampleDataPopulator, sampleCampaignInfo, sampleWorldInfo } from '../../utils/populateSampleData';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

interface TimelineSetupGuideProps {
  onSetupComplete?: () => void;
}

export const TimelineSetupGuide: React.FC<TimelineSetupGuideProps> = ({
  onSetupComplete
}) => {
  const { t } = useTranslation(['ui']);
  const { user } = useAuth();
  const { currentWorld, currentCampaign, setCurrentWorld, setCurrentCampaign } = useRPGWorld();

  const [loading, setLoading] = useState(false);
  const [sampleDataStats, setSampleDataStats] = useState({
    worldExists: false,
    campaignExists: false,
    timelineEntryCount: 0,
    totalExpectedEntries: 10
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load sample data statistics
  const loadSampleDataStats = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      const stats = await sampleDataPopulator.getSampleDataStats(user.uid);
      setSampleDataStats(stats);
    } catch (error) {
      console.error('Error loading sample data stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSampleDataStats();
  }, [user]);

  // Handle sample data population
  const handlePopulateSampleData = async () => {
    if (!user) {
      notifications.show({
        title: t('timeline.setup.authRequired'),
        message: t('timeline.setup.loginPrompt'),
        color: 'red',
        icon: <IconUser size={16} />
      });
      return;
    }

    setLoading(true);
    try {
      await sampleDataPopulator.populateTimelineData(user.id);

      notifications.show({
        title: 'Sample Data Created',
        message: 'Timeline sample data has been successfully populated!',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      // Refresh stats and trigger setup complete
      await loadSampleDataStats();
      onSetupComplete?.();

    } catch (error) {
      console.error('Error populating sample data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to populate sample data. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sample data clearing
  const handleClearSampleData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await sampleDataPopulator.clearSampleData(user.uid);

      notifications.show({
        title: 'Sample Data Cleared',
        message: 'All sample timeline data has been removed',
        color: 'blue',
        icon: <IconTrash size={16} />
      });

      await loadSampleDataStats();

    } catch (error) {
      console.error('Error clearing sample data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to clear sample data. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (sampleDataStats.timelineEntryCount / sampleDataStats.totalExpectedEntries) * 100
  );

  if (!user) {
    return (
      <Paper p="md" withBorder shadow="sm">
        <Stack gap="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconUser size={20} />
            </ThemeIcon>
            <div>
              <Title order={3}>Authentication Required</Title>
              <Text c="dimmed" size="sm">Please log in to access timeline features</Text>
            </div>
          </Group>

          <Alert icon={<IconAlertCircle size="1rem" />} title="Login Required" color="blue" variant="light">
            <Text>
              The timeline system requires authentication to store and manage your campaign data securely.
              Please log in to continue.
            </Text>
          </Alert>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="lg" variant="light" color="violet">
              <IconTimeline size={20} />
            </ThemeIcon>
            <div>
              <Title order={3}>Timeline Setup Guide</Title>
              <Text c="dimmed" size="sm">Get started with RPG Scribe's dual timeline system</Text>
            </div>
          </Group>

          <Tooltip label="Refresh data">
            <ActionIcon
              variant="light"
              onClick={loadSampleDataStats}
              loading={refreshing}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        {/* Sample Data Status */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={500}>Sample Data Status</Text>
            <Badge
              color={sampleDataStats.timelineEntryCount > 0 ? 'green' : 'gray'}
              variant="light"
            >
              {sampleDataStats.timelineEntryCount} / {sampleDataStats.totalExpectedEntries} entries
            </Badge>
          </Group>

          <Progress
            value={completionPercentage}
            color={completionPercentage === 100 ? 'green' : 'blue'}
            size="sm"
          />

          <Text size="sm" c="dimmed">
            {completionPercentage === 100
              ? 'Sample timeline data is fully populated and ready to explore!'
              : 'Sample data will help you explore timeline features with realistic RPG campaign data.'
            }
          </Text>
        </Stack>

        <Divider />

        {/* Setup Actions */}
        <Stack gap="sm">
          <Text fw={500}>Quick Setup Options</Text>

          <Group>
            <Button
              leftSection={<IconDatabase size={16} />}
              onClick={handlePopulateSampleData}
              loading={loading}
              disabled={completionPercentage === 100}
              variant={completionPercentage === 100 ? 'light' : 'filled'}
            >
              {completionPercentage === 100 ? 'Sample Data Ready' : 'Populate Sample Data'}
            </Button>

            {sampleDataStats.timelineEntryCount > 0 && (
              <Button
                leftSection={<IconTrash size={16} />}
                onClick={handleClearSampleData}
                loading={loading}
                variant="light"
                color="red"
              >
                Clear Sample Data
              </Button>
            )}
          </Group>
        </Stack>

        <Divider />

        {/* Feature Overview */}
        <Stack gap="sm">
          <Text fw={500}>Timeline Features</Text>

          <List
            spacing="xs"
            size="sm"
            center
            icon={
              <ThemeIcon color="violet" size={18} radius="xl">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <strong>Dual-Time Tracking:</strong> Track both real-world session time and in-game time
            </List.Item>
            <List.Item>
              <strong>Campaign Timeline:</strong> Visualize your entire campaign progression
            </List.Item>
            <List.Item>
              <strong>Event Management:</strong> Create, edit, and organize timeline entries
            </List.Item>
            <List.Item>
              <strong>Conflict Detection:</strong> Automatically detect timeline inconsistencies
            </List.Item>
            <List.Item>
              <strong>Entity Integration:</strong> Link timeline events to characters, locations, and more
            </List.Item>
          </List>
        </Stack>

        {/* Sample Campaign Info */}
        {completionPercentage > 0 && (
          <>
            <Divider />
            <Stack gap="sm">
              <Text fw={500}>Sample Campaign: {sampleCampaignInfo.name}</Text>
              <Group>
                <Badge leftSection={<IconWorld size={12} />} variant="light">
                  {sampleWorldInfo.name}
                </Badge>
                <Badge leftSection={<IconTimeline size={12} />} variant="light" color="violet">
                  {sampleDataStats.timelineEntryCount} Timeline Entries
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Explore a complete D&D campaign timeline featuring the classic "Sunless Citadel" adventure
                with realistic dual-time tracking and various event types.
              </Text>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
};
