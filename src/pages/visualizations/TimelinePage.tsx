import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Paper,
  Tabs,
  Select,
  Group,
  Stack,
  Alert,
  Loader,
  Center,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Flex,
  SegmentedControl,
  Switch,
  Divider,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconTimeline,
  IconCalendarEvent,
  IconFilter,
  IconEdit,
  IconPlus,
  IconSettings,
  IconRefresh,
  IconDownload,
  IconWorld,
  IconClock
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRPGWorld } from '../../contexts/RPGWorldContext';
import { DualTimelineVisualization } from '../../components/timeline/DualTimelineVisualization';
import { TimelineEditor } from '../../components/timeline/TimelineEditor';
import { Campaign } from '../../models/Campaign';
import { Event } from '../../models/Event';

/**
 * Enhanced TimelinePage with Dual Timeline System Integration
 */
export function TimelinePage() {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentWorld, currentCampaign } = useRPGWorld();

  // Timeline state management
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaignId || currentCampaign?.id || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timeline display options
  const [activeTab, setActiveTab] = useState<string | null>('visualization');
  const [displayMode, setDisplayMode] = useState<'in-game' | 'real-world' | 'dual'>('dual');
  const [showConflicts, setShowConflicts] = useState(true);
  const [enableEditing, setEnableEditing] = useState(false);

  // Timeline data
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Handle timeline event interactions
  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleEventEdit = (eventId: string) => {
    // Open event edit modal or navigate to edit page
    navigate(`/events/${eventId}/edit`);
  };

  const handleEventMove = (eventId: string, newPosition: number) => {
    // Handle timeline entry reordering
    console.log(`Moving event ${eventId} to position ${newPosition}`);
  };

  const handleTimelineChange = (events: any[]) => {
    setTimelineEvents(events);
  };

  // Handle timeline entry creation
  const handleCreateTimelineEntry = async (params: any) => {
    try {
      // Create timeline entry using TimelineService
      console.log('Creating timeline entry:', params);
      return `entry-${Date.now()}`;
    } catch (error) {
      console.error('Failed to create timeline entry:', error);
      throw error;
    }
  };

  // Handle timeline entry updates
  const handleUpdateTimelineEntry = async (id: string, updates: any) => {
    try {
      // Update timeline entry using TimelineService
      console.log('Updating timeline entry:', id, updates);
      return true;
    } catch (error) {
      console.error('Failed to update timeline entry:', error);
      return false;
    }
  };

  // Handle timeline entry deletion
  const handleDeleteTimelineEntry = async (id: string) => {
    try {
      // Delete timeline entry using TimelineService
      console.log('Deleting timeline entry:', id);
      return true;
    } catch (error) {
      console.error('Failed to delete timeline entry:', error);
      return false;
    }
  };

  // Initialize timeline data when campaign changes
  useEffect(() => {
    if (selectedCampaignId && currentWorld?.id) {
      // Timeline data will be loaded by the DualTimelineVisualization component
      setLoading(false);
    }
  }, [selectedCampaignId, currentWorld?.id]);

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Header */}
        <Paper p="md" withBorder shadow="sm">
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Dual Timeline System</Title>
              <Text c="dimmed" size="sm">
                Advanced timeline visualization with dual-time tracking and conflict detection
              </Text>
            </div>
            <Group>
              <Badge color="blue" leftSection={<IconWorld size={12} />}>
                {currentWorld?.name || 'No World'}
              </Badge>
              <Badge color="green" leftSection={<IconCalendarEvent size={12} />}>
                {currentCampaign?.name || 'No Campaign'}
              </Badge>
              <IconTimeline size={40} color="violet" stroke={1.5} />
            </Group>
          </Group>
        </Paper>

        {/* Timeline Controls */}
        <Paper p="md" withBorder shadow="sm">
          <Group justify="space-between" align="center">
            <Group>
              <SegmentedControl
                value={displayMode}
                onChange={(value) => setDisplayMode(value as any)}
                data={[
                  { label: 'In-Game', value: 'in-game' },
                  { label: 'Real World', value: 'real-world' },
                  { label: 'Dual View', value: 'dual' }
                ]}
              />

              <Switch
                label="Show Conflicts"
                checked={showConflicts}
                onChange={(event) => setShowConflicts(event.currentTarget.checked)}
                color="red"
              />

              <Switch
                label="Enable Editing"
                checked={enableEditing}
                onChange={(event) => setEnableEditing(event.currentTarget.checked)}
                color="blue"
              />
            </Group>

            <Group>
              <Tooltip label="Refresh Timeline">
                <ActionIcon variant="light" onClick={() => window.location.reload()}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Timeline Settings">
                <ActionIcon variant="light">
                  <IconSettings size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Export Timeline">
                <ActionIcon variant="light">
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Paper>

        {/* Main Timeline Content */}
        {error ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" withCloseButton onClose={() => setError(null)} variant="filled">
            <Stack gap="md">
              <Text>{error}</Text>
              <Button variant="white" color="red" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Stack>
          </Alert>
        ) : !currentWorld || !currentCampaign ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="No World or Campaign Selected" color="yellow" variant="filled">
            <Stack gap="md">
              <Text>Please select a world and campaign to use the Timeline system.</Text>
              <Button variant="white" color="yellow" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </Stack>
          </Alert>
        ) : (
          <Tabs value={activeTab} onChange={setActiveTab} color="violet">
            <Tabs.List>
              <Tabs.Tab value="visualization" leftSection={<IconTimeline size={16} />}>
                Timeline Visualization
              </Tabs.Tab>
              <Tabs.Tab value="editor" leftSection={<IconEdit size={16} />}>
                Timeline Editor
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="visualization" pt="md">
              <DualTimelineVisualization
                campaignId={selectedCampaignId || undefined}
                worldId={currentWorld?.id}
                title="Campaign Timeline"
                description="View and manage your campaign timeline with dual-time tracking"
                displayMode={displayMode}
                showConflicts={showConflicts}
                enableDragDrop={enableEditing}
                onEventClick={handleEventClick}
                onEventEdit={handleEventEdit}
                onEventMove={handleEventMove}
                onTimelineChange={handleTimelineChange}
              />
            </Tabs.Panel>

            <Tabs.Panel value="editor" pt="md">
              {enableEditing ? (
                <TimelineEditor
                  entries={timelineEvents}
                  onEntriesChange={setTimelineEvents}
                  onEntryCreate={handleCreateTimelineEntry}
                  onEntryUpdate={handleUpdateTimelineEntry}
                  onEntryDelete={handleDeleteTimelineEntry}
                  enableDragDrop={true}
                  showValidation={showConflicts}
                />
              ) : (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Editing Disabled" color="blue" variant="light">
                  <Stack gap="md">
                    <Text>Enable editing mode to use the Timeline Editor.</Text>
                    <Button
                      variant="light"
                      onClick={() => setEnableEditing(true)}
                      leftSection={<IconEdit size={16} />}
                    >
                      Enable Editing
                    </Button>
                  </Stack>
                </Alert>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="md">
              <Paper p="md" withBorder shadow="sm">
                <Stack gap="md">
                  <Title order={3}>Timeline Settings</Title>
                  <Text c="dimmed" size="sm">Configure timeline display and behavior options.</Text>

                  <Divider />

                  <Group>
                    <Text fw={500}>Display Mode:</Text>
                    <SegmentedControl
                      value={displayMode}
                      onChange={(value) => setDisplayMode(value as any)}
                      data={[
                        { label: 'In-Game', value: 'in-game' },
                        { label: 'Real World', value: 'real-world' },
                        { label: 'Dual View', value: 'dual' }
                      ]}
                    />
                  </Group>

                  <Group>
                    <Switch
                      label="Show Validation Conflicts"
                      description="Display timeline conflicts and validation warnings"
                      checked={showConflicts}
                      onChange={(event) => setShowConflicts(event.currentTarget.checked)}
                      color="red"
                    />
                  </Group>

                  <Group>
                    <Switch
                      label="Enable Timeline Editing"
                      description="Allow creating, editing, and reordering timeline entries"
                      checked={enableEditing}
                      onChange={(event) => setEnableEditing(event.currentTarget.checked)}
                      color="blue"
                    />
                  </Group>

                  <Divider />

                  <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />}>
                      Reset to Defaults
                    </Button>
                    <Button variant="light" leftSection={<IconDownload size={16} />}>
                      Export Timeline
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
    </Container>
  );
}

export default TimelinePage;
