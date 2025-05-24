/**
 * Timeline Widget Component
 *
 * Dashboard widget for timeline overview, recent entries, and quick access
 * to timeline features with conflict alerts and statistics.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Alert,
  Loader,
  Center,
  Card,
  Flex,
  Progress,
  Divider,
  ScrollArea,
} from '@mantine/core';
import {
  IconTimeline,
  IconCalendarEvent,
  IconAlertTriangle,
  IconPlus,
  IconEdit,
  IconEye,
  IconClock,
  IconWorld,
  IconTrendingUp,
  IconExclamationMark,
} from '@tabler/icons-react';
import { useRPGWorld } from '../../contexts/RPGWorldContext';
import { TimelineService } from '../../services/timeline.service';
import { TimelineValidationService } from '../../services/timelineValidation.service';
import { formatTimeGap } from '../../utils/timelineUtils';

/**
 * Timeline statistics interface
 */
interface TimelineStats {
  totalEntries: number;
  recentEntries: number;
  conflictCount: number;
  lastUpdated: Date | null;
  timeSpan: {
    inGame: { start: Date | null; end: Date | null };
    realWorld: { start: Date | null; end: Date | null };
  };
}

/**
 * Recent timeline entry interface
 */
interface RecentTimelineEntry {
  id: string;
  title: string;
  entryType: string;
  sequence: number;
  hasConflicts: boolean;
  createdAt: Date;
}

/**
 * Timeline Widget Props
 */
interface TimelineWidgetProps {
  maxHeight?: number;
  showQuickActions?: boolean;
  showConflicts?: boolean;
}

/**
 * Timeline Widget Component
 */
export function TimelineWidget({
  maxHeight = 400,
  showQuickActions = true,
  showConflicts = true
}: TimelineWidgetProps) {
  const { t } = useTranslation(['ui']);
  const navigate = useNavigate();
  const { currentWorld, currentCampaign } = useRPGWorld();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<RecentTimelineEntry[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Services
  const [timelineService, setTimelineService] = useState<TimelineService | null>(null);
  const [validationService] = useState(() => TimelineValidationService.getInstance());

  // Initialize timeline service
  useEffect(() => {
    if (currentWorld?.id && currentCampaign?.id) {
      const service = new TimelineService(currentWorld.id, currentCampaign.id);
      setTimelineService(service);
    }
  }, [currentWorld?.id, currentCampaign?.id]);

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      if (!timelineService) return;

      try {
        setLoading(true);
        setError(null);

        // Get timeline statistics
        const timelineStats = await timelineService.getTimelineStatistics();

        // Get recent entries
        const entries = await timelineService.getTimelineEntries({
          limit: 5,
          sortBy: 'createdAt',
          sortDirection: 'desc'
        });

        // Convert to recent entries format
        const recentEntriesData: RecentTimelineEntry[] = entries.map(entry => ({
          id: entry.id || '',
          title: entry.title,
          entryType: entry.entryType,
          sequence: entry.position.sequence,
          hasConflicts: false, // Will be updated by validation
          createdAt: entry.createdAt || new Date()
        }));

        // Validate timeline if conflicts are enabled
        let conflictsData: any[] = [];
        if (showConflicts) {
          const validation = await validationService.validateTimeline(entries, {
            campaignId: currentCampaign?.id || '',
            worldId: currentWorld?.id || '',
            recentEntries: [],
            activeCharacters: [],
            sessionInProgress: false
          });

          conflictsData = validation.conflicts;

          // Mark entries with conflicts
          recentEntriesData.forEach(entry => {
            const entryConflicts = conflictsData.filter(conflict =>
              conflict.affectedEntityIds.includes(entry.id)
            );
            entry.hasConflicts = entryConflicts.length > 0;
          });
        }

        // Create stats object
        const statsData: TimelineStats = {
          totalEntries: timelineStats.totalEntries,
          recentEntries: recentEntriesData.length,
          conflictCount: conflictsData.length,
          lastUpdated: entries.length > 0 ? entries[0].updatedAt || null : null,
          timeSpan: {
            inGame: {
              start: entries.length > 0 ? entries[0].position.inGameTimestamp || null : null,
              end: entries.length > 0 ? entries[entries.length - 1].position.inGameTimestamp || null : null
            },
            realWorld: {
              start: entries.length > 0 ? entries[0].position.realWorldTimestamp || null : null,
              end: entries.length > 0 ? entries[entries.length - 1].position.realWorldTimestamp || null : null
            }
          }
        };

        setStats(statsData);
        setRecentEntries(recentEntriesData);
        setConflicts(conflictsData);

      } catch (err) {
        console.error('Error loading timeline data:', err);
        setError('Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };

    if (timelineService) {
      loadTimelineData();
    }
  }, [timelineService, showConflicts, validationService, currentCampaign?.id, currentWorld?.id]);

  // Handle navigation
  const handleViewTimeline = () => {
    navigate('/visualizations/timeline');
  };

  const handleCreateEntry = () => {
    navigate('/visualizations/timeline', { state: { tab: 'editor', action: 'create' } });
  };

  const handleViewEntry = (entryId: string) => {
    navigate(`/visualizations/timeline`, { state: { entryId } });
  };

  // Render loading state
  if (loading) {
    return (
      <Paper p="md" withBorder shadow="sm" style={{ height: maxHeight }}>
        <Center h="100%">
          <Stack align="center">
            <Loader size="md" />
            <Text size="sm" c="dimmed">{t('timeline.loadingEntries')}</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper p="md" withBorder shadow="sm" style={{ height: maxHeight }}>
        <Alert icon={<IconExclamationMark size={16} />} color="red" title="Timeline Error">
          <Text size="sm">{error}</Text>
          <Button size="xs" variant="light" mt="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Paper>
    );
  }

  // Render no data state
  if (!stats || !currentWorld || !currentCampaign) {
    return (
      <Paper p="md" withBorder shadow="sm" style={{ height: maxHeight }}>
        <Stack align="center" justify="center" h="100%">
          <IconTimeline size={48} color="gray" />
          <Text c="dimmed" ta="center">No timeline data available</Text>
          <Text size="sm" c="dimmed" ta="center">
            Select a world and campaign to view timeline information
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder shadow="sm" style={{ height: maxHeight }}>
      <Stack h="100%">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group>
            <IconTimeline size={24} color="violet" />
            <div>
              <Title order={4}>{t('timeline.overview')}</Title>
              <Text size="sm" c="dimmed">Campaign timeline status</Text>
            </div>
          </Group>

          {showQuickActions && (
            <Group>
              <Tooltip label="Create Timeline Entry">
                <ActionIcon variant="light" onClick={handleCreateEntry}>
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="View Full Timeline">
                <ActionIcon variant="light" onClick={handleViewTimeline}>
                  <IconEye size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        {/* Statistics */}
        <Group grow>
          <Card withBorder p="xs">
            <Text size="xs" c="dimmed" ta="center">Total Entries</Text>
            <Text size="lg" fw={700} ta="center">{stats.totalEntries}</Text>
          </Card>

          {showConflicts && (
            <Card withBorder p="xs" style={{ borderColor: stats.conflictCount > 0 ? 'var(--mantine-color-red-6)' : undefined }}>
              <Text size="xs" c="dimmed" ta="center">Conflicts</Text>
              <Text size="lg" fw={700} ta="center" c={stats.conflictCount > 0 ? 'red' : 'green'}>
                {stats.conflictCount}
              </Text>
            </Card>
          )}
        </Group>

        {/* Conflicts Alert */}
        {showConflicts && stats.conflictCount > 0 && (
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
            <Text size="sm">
              {stats.conflictCount} timeline conflict{stats.conflictCount !== 1 ? 's' : ''} detected
            </Text>
          </Alert>
        )}

        <Divider />

        {/* Recent Entries */}
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Recent Entries</Text>

          {recentEntries.length === 0 ? (
            <Center h={100}>
              <Text size="sm" c="dimmed">No timeline entries yet</Text>
            </Center>
          ) : (
            <ScrollArea h={150}>
              <Stack gap="xs">
                {recentEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    withBorder
                    p="xs"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewEntry(entry.id)}
                  >
                    <Group justify="space-between" align="center">
                      <div style={{ flex: 1 }}>
                        <Group>
                          <Badge size="xs" color="blue">
                            {entry.entryType.replace('_', ' ')}
                          </Badge>
                          {entry.hasConflicts && (
                            <Badge size="xs" color="red" leftSection={<IconAlertTriangle size={10} />}>
                              Conflict
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" fw={500} lineClamp={1}>{entry.title}</Text>
                        <Text size="xs" c="dimmed">Seq: {entry.sequence}</Text>
                      </div>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <>
            <Divider />
            <Group>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconEye size={16} />}
                onClick={handleViewTimeline}
                style={{ flex: 1 }}
              >
                View Timeline
              </Button>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconEdit size={16} />}
                onClick={handleCreateEntry}
                style={{ flex: 1 }}
              >
                Create Entry
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
