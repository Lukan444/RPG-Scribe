import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Switch,
  Button,
  Divider,
  Badge
} from '@mantine/core';
import {
  IconAlertCircle,
  IconTimeline,
  IconFilter,
  IconSettings,
  IconPlus,
  IconDatabase
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useRPGWorld } from '../../contexts/RPGWorldContext';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Campaign } from '../../models/Campaign';
import { Event } from '../../models/Event';
import { DualTimelineVisualization } from '../../components/timeline/DualTimelineVisualization';
import { ReactCalendarTimeline } from '../../components/timeline/ReactCalendarTimeline';
import { TimelineProvider } from '../../contexts/TimelineContext';
import { TimelineErrorBoundary, TimelineConfigError } from '../../components/timeline/TimelineErrorBoundary';
import { TimelineFilters, TimelineFilterState } from '../../components/timeline/TimelineFilters';
import { EntityType } from '../../models/EntityType';
import { DualTimelineConfig } from '../../types/dualTimeline.types';
import { TimelineEditorIntegrationService } from '../../services/timelineEditorIntegration.service';
import { BasicSampleDataService } from '../../services/basicSampleData.service';
import { timelineNavigation } from '../../services/timelineNavigation.service';
import { timelineParticipantFixer } from '../../utils/fixTimelineParticipants';

/**
 * TimelinePage - Page component for the Timeline visualization
 */
export function TimelinePage() {
  const { campaignId, worldId } = useParams<{ campaignId?: string; worldId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Try to get RPG World context, but don't fail if not available
  let currentWorld = null;
  let currentCampaign = null;
  try {
    const rpgWorldContext = useRPGWorld();
    currentWorld = rpgWorldContext.currentWorld;
    currentCampaign = rpgWorldContext.currentCampaign;
  } catch (error) {
    // RPGWorldProvider not available, continue without context
    console.log('RPGWorldProvider not available, continuing without world context');
  }

  // Initialize timeline navigation service
  useEffect(() => {
    timelineNavigation.initialize(navigate);
  }, [navigate]);



  // Parse URL parameters for entity context and filters
  const entityContext = useMemo(() => {
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const entityName = searchParams.get('entityName');

    if (entityType && entityId && entityName) {
      return { type: entityType, id: entityId, name: entityName };
    }
    return null;
  }, [searchParams]);

  // Initialize timeline filters from URL parameters
  const [timelineFilters, setTimelineFilters] = useState<TimelineFilterState>(() => {
    const urlWorldId = searchParams.get('worldId') || worldId || currentWorld?.id;
    const urlCampaignId = searchParams.get('campaignId') || campaignId || currentCampaign?.id;
    const urlSessionId = searchParams.get('sessionId');

    return {
      worldId: urlWorldId || undefined,
      campaignId: urlCampaignId || undefined,
      sessionId: urlSessionId || undefined,
      timeFrame: 'last-month',
      entityType: entityContext?.type,
      entityId: entityContext?.id
    };
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Validate and correct campaign ID for the given world
  useEffect(() => {
    const validateCampaignId = async () => {
      if (timelineFilters.worldId && timelineFilters.campaignId) {
        try {
          // Check if the campaign exists for this world
          const campaignsQuery = query(
            collection(db, 'campaigns'),
            where('worldId', '==', timelineFilters.worldId)
          );
          const campaignsSnapshot = await getDocs(campaignsQuery);
          const worldCampaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // If the current campaign ID doesn't exist for this world, use the first available campaign
          const campaignExists = worldCampaigns.some(campaign => campaign.id === timelineFilters.campaignId);
          if (!campaignExists && worldCampaigns.length > 0) {
            const correctCampaignId = worldCampaigns[0].id;
            console.log(`Correcting campaign ID from ${timelineFilters.campaignId} to ${correctCampaignId} for world ${timelineFilters.worldId}`);
            setTimelineFilters(prev => ({
              ...prev,
              campaignId: correctCampaignId
            }));
          }
        } catch (error) {
          console.error('Error validating campaign ID:', error);
        }
      }
    };

    validateCampaignId();
  }, [timelineFilters.worldId, timelineFilters.campaignId]);

  // Validate and correct campaign ID for the given world
  useEffect(() => {
    const validateCampaignId = async () => {
      if (timelineFilters.worldId && timelineFilters.campaignId) {
        try {
          // Check if the campaign exists for this world
          const campaignsQuery = query(
            collection(db, 'campaigns'),
            where('worldId', '==', timelineFilters.worldId)
          );
          const campaignsSnapshot = await getDocs(campaignsQuery);
          const worldCampaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

          // If the current campaign ID doesn't exist for this world, use the first available campaign
          const campaignExists = worldCampaigns.some(campaign => campaign.id === timelineFilters.campaignId);
          if (!campaignExists && worldCampaigns.length > 0) {
            const correctCampaignId = worldCampaigns[0].id;
            console.log(`🔧 Correcting campaign ID from ${timelineFilters.campaignId} to ${correctCampaignId} for world ${timelineFilters.worldId}`);

            // Update the URL and state with the correct campaign ID
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('campaignId', correctCampaignId);
            window.history.replaceState({}, '', newUrl.toString());

            setTimelineFilters(prev => ({
              ...prev,
              campaignId: correctCampaignId
            }));

            notifications.show({
              title: 'Campaign ID Corrected',
              message: `Updated to use the correct campaign for this world: ${worldCampaigns[0].name || correctCampaignId}`,
              color: 'blue'
            });
          }
        } catch (error) {
          console.error('Error validating campaign ID:', error);
        }
      }
    };

    validateCampaignId();
  }, [timelineFilters.worldId]); // Only depend on worldId to avoid infinite loops

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDualTimeline, setShowDualTimeline] = useState(true);
  const [creatingData, setCreatingData] = useState(false);
  const [sampleDataService] = useState(() => new BasicSampleDataService());
  const [entities, setEntities] = useState<{ [entityType: string]: any[] }>({});
  const [timelineIntegrationService, setTimelineIntegrationService] = useState<TimelineEditorIntegrationService | null>(null);

  // Initialize timeline integration service when world/campaign changes (memoized to prevent flickering)
  const timelineService = useMemo(() => {
    if (timelineFilters.worldId && timelineFilters.campaignId) {
      return new TimelineEditorIntegrationService(
        timelineFilters.worldId,
        timelineFilters.campaignId
      );
    }
    return null;
  }, [timelineFilters.worldId, timelineFilters.campaignId]);

  useEffect(() => {
    if (timelineService) {
      setTimelineIntegrationService(timelineService);

      // Load entities for timeline rows with debouncing
      const timeoutId = setTimeout(() => {
        timelineService.loadEntitiesForTimeline().then(setEntities).catch(console.error);
      }, 200); // 200ms debounce for entity loading

      return () => {
        clearTimeout(timeoutId);
        timelineService.cleanup();
      };
    } else {
      setTimelineIntegrationService(null);
      setEntities({});
    }
  }, [timelineService]);

  // Handle timeline filter changes (memoized to prevent unnecessary re-renders)
  const handleFiltersChange = useCallback((newFilters: TimelineFilterState) => {
    setTimelineFilters(prev => {
      // Only update if values actually changed
      const hasChanges = Object.keys(newFilters).some(key =>
        prev[key as keyof TimelineFilterState] !== newFilters[key as keyof TimelineFilterState]
      );
      return hasChanges ? newFilters : prev;
    });

    // Update URL parameters to maintain state
    const newSearchParams = new URLSearchParams(searchParams);

    if (newFilters.worldId) {
      newSearchParams.set('worldId', newFilters.worldId);
    } else {
      newSearchParams.delete('worldId');
    }

    if (newFilters.campaignId) {
      newSearchParams.set('campaignId', newFilters.campaignId);
    } else {
      newSearchParams.delete('campaignId');
    }

    if (newFilters.sessionId) {
      newSearchParams.set('sessionId', newFilters.sessionId);
    } else {
      newSearchParams.delete('sessionId');
    }

    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // Handle clearing entity context
  const handleClearEntityContext = () => {
    const newFilters = {
      ...timelineFilters,
      entityType: undefined,
      entityId: undefined
    };
    setTimelineFilters(newFilters);

    // Remove entity parameters from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('entityType');
    newSearchParams.delete('entityId');
    newSearchParams.delete('entityName');
    setSearchParams(newSearchParams);
  };

  // Handle sample data creation
  const handleCreateSampleData = async () => {
    if (!user) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please log in to create sample data',
        color: 'red'
      });
      return;
    }

    setCreatingData(true);
    try {
      const result = await sampleDataService.createBasicSampleData(user.id);

      if (result.success) {
        notifications.show({
          title: 'Sample Data Created!',
          message: `Successfully created ${result.entitiesCreated} entities including campaigns, characters, locations, and events.`,
          color: 'green'
        });

        // Refresh the page to load the new data
        window.location.reload();
      } else {
        notifications.show({
          title: 'Error Creating Sample Data',
          message: result.error || 'Unknown error occurred',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      notifications.show({
        title: 'Error Creating Sample Data',
        message: 'Failed to create sample data. Please try again.',
        color: 'red'
      });
    } finally {
      setCreatingData(false);
    }
  };

  // Handle fixing participant references
  const handleFixParticipants = async () => {
    if (!user || !timelineFilters.campaignId) {
      notifications.show({
        title: 'Configuration Required',
        message: 'Please select a campaign to fix participant references',
        color: 'red'
      });
      return;
    }

    setCreatingData(true);
    try {
      const result = await timelineParticipantFixer.fixMissingParticipants(timelineFilters.campaignId);

      if (result.success) {
        notifications.show({
          title: 'Participants Fixed!',
          message: `Fixed ${result.eventsFixed} events with ${result.participantsAdded} participant references`,
          color: 'green'
        });

        // Refresh the page to reload the timeline
        window.location.reload();
      } else {
        notifications.show({
          title: 'Error Fixing Participants',
          message: result.error || 'Unknown error occurred',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error fixing participants:', error);
      notifications.show({
        title: 'Error Fixing Participants',
        message: 'Failed to fix participant references. Please try again.',
        color: 'red'
      });
    } finally {
      setCreatingData(false);
    }
  };

  // Fetch campaigns from Firebase
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError('You must be logged in to view campaigns');
          setLoading(false);
          return;
        }

        const campaignsRef = collection(db, 'campaigns');
        const q = query(campaignsRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);

        const campaignData: Campaign[] = [];
        querySnapshot.forEach((doc) => {
          campaignData.push({ id: doc.id, ...doc.data() } as Campaign);
        });

        setCampaigns(campaignData);

        // If no campaign is selected and we have campaigns, select the first one
        if (!timelineFilters.campaignId && campaignData.length > 0 && campaignData[0].id) {
          handleFiltersChange({
            ...timelineFilters,
            campaignId: campaignData[0].id
          });
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, campaignId, timelineFilters.campaignId, handleFiltersChange]);

  // Fetch events for the selected campaign
  useEffect(() => {
    const fetchEvents = async () => {
      if (!timelineFilters.campaignId) return;

      try {
        setLoading(true);
        setError(null);

        const eventsRef = collection(db, 'events');
        let q = query(
          eventsRef,
          where('campaignId', '==', timelineFilters.campaignId),
          orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);

        const eventData: Event[] = [];
        querySnapshot.forEach((doc) => {
          const event = { id: doc.id, ...doc.data() } as Event;
          // Convert Firestore timestamp to Date
          if (event.date && typeof event.date.toDate === 'function') {
            event.date = event.date.toDate();
          }
          eventData.push(event);
        });

        setEvents(eventData);

        // Set date range based on events if not already set
        if (eventData.length > 0 && (!dateRange[0] || !dateRange[1])) {
          const dates = eventData
            .filter(event => event.date)
            .map(event => new Date(event.date));

          if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
            const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));
            setDateRange([minDate, maxDate]);
          }
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [timelineFilters.campaignId]);

  // Filter events based on date range
  const filteredEvents = events.filter(event => {
    if (!event.date) return false;
    if (!dateRange[0] || !dateRange[1]) return true;

    const eventDate = new Date(event.date);
    return eventDate >= dateRange[0] && eventDate <= dateRange[1];
  });

  // Campaign selection options
  const campaignOptions = campaigns.map((campaign) => ({
    value: campaign.id || '',
    label: campaign.name
  }));

  // Format date for display
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString();
  };

  // Create dual timeline configuration
  const createDualTimelineConfig = (): DualTimelineConfig => {
    const now = new Date();

    return {
      worldId: timelineFilters.worldId || '',
      campaignId: timelineFilters.campaignId || '',
      displayMode: 'dual',
      timeConversion: {
        baseMapping: {
          realWorldTime: now,
          inGameTime: now,
          conversionRatio: 24, // 1 real hour = 24 game hours
          calendarSystem: 'gregorian'
        },
        allowNonLinear: true
      },
      syncOptions: {
        syncScrolling: true,
        syncZoom: true,
        syncSelection: true,
        showConnections: true
      },
      realWorldAxis: {
        id: 'real-world',
        label: 'Real World Timeline',
        timeSystem: 'real-world',
        visible: true,
        height: 200,
        color: '#1c7ed6',
        groups: [
          { id: 'sessions', title: 'Game Sessions', timeSystem: 'real-world' }
        ]
      },
      inGameAxis: {
        id: 'in-game',
        label: 'In-Game Timeline',
        timeSystem: 'in-game',
        visible: true,
        height: 200,
        color: '#e64980',
        groups: [
          { id: 'events', title: 'Story Events', timeSystem: 'in-game' }
        ]
      },
      showMarkers: true,
      showConflicts: true,
      enableEditing: true,
      height: 400,
      connectionStyle: 'lines',
      connectionOpacity: 0.7
    };
  };

  // Memoize individual filter values to ensure stable references
  const memoizedWorldId = useMemo(() => timelineFilters.worldId, [timelineFilters.worldId]);
  const memoizedCampaignId = useMemo(() => timelineFilters.campaignId, [timelineFilters.campaignId]);
  const memoizedEntityId = useMemo(() => timelineFilters.entityId, [timelineFilters.entityId]);
  const memoizedEntityType = useMemo(() => timelineFilters.entityType, [timelineFilters.entityType]);

  // Memoize timeline configuration using stable individual values
  const timelineInitialConfig = useMemo(() => ({
    worldId: memoizedWorldId,
    campaignId: memoizedCampaignId,
    entityId: memoizedEntityId,
    entityType: memoizedEntityType as EntityType,
    height: 600,
    enableEditing: true,
    showMarkers: true,
    showControls: true
  }), [memoizedWorldId, memoizedCampaignId, memoizedEntityId, memoizedEntityType]);

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Paper p="md" withBorder shadow="sm">
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Timeline Visualization</Title>
              <Text c="dimmed" size="sm">View campaign events in chronological order</Text>
            </div>
            <IconTimeline size={40} color="violet" stroke={1.5} />
          </Group>
        </Paper>

        {loading ? (
          <Center h={200}>
            <Stack align="center">
              <Loader size="lg" color="violet" />
              <Text c="dimmed" mt="md" size="sm">Loading timeline data...</Text>
            </Stack>
          </Center>
        ) : error ? (
          <>
            <Alert icon={<IconAlertCircle size="1rem" />} title="Data Loading Issue" color="yellow" withCloseButton onClose={() => setError(null)} variant="light">
              <Stack gap="md">
                <Text>{error}</Text>
                <Text size="sm" c="dimmed">You can create sample data to test the timeline system, or retry loading your existing data.</Text>
                <Group>
                  <Button
                    variant="light"
                    color="green"
                    leftSection={<IconDatabase size={16} />}
                    onClick={handleCreateSampleData}
                    loading={creatingData}
                  >
                    Create Sample Data
                  </Button>
                  <Button variant="light" color="yellow" onClick={() => window.location.reload()}>
                    Retry Loading Data
                  </Button>
                </Group>
              </Stack>
            </Alert>
            {/* Show demo timeline even when there's an error */}
            <Paper p="md" withBorder shadow="sm">
              <Stack gap="md">
                <Group align="flex-end">
                  <Select
                    label="Select Campaign"
                    placeholder="Demo Campaign (No real data available)"
                    data={[{ value: 'demo', label: 'Demo Campaign' }]}
                    value="demo"
                    disabled
                    w={300}
                  />
                </Group>

                <Divider label="Timeline Filters" labelPosition="center" />

                <Group align="flex-end">
                  <Switch
                    label="Dual Timeline Mode"
                    checked={showDualTimeline}
                    onChange={(event) => setShowDualTimeline(event.currentTarget.checked)}
                    color="blue"
                  />
                </Group>
              </Stack>
            </Paper>

            <Tabs defaultValue="timeline" color="violet">
              <Tabs.List>
                <Tabs.Tab value="timeline" leftSection={<IconTimeline size={16} />}>Timeline</Tabs.Tab>
                <Tabs.Tab value="settings" leftSection={<IconFilter size={16} />}>Visualization Settings</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="timeline" pt="md">
                {showDualTimeline ? (
                  <DualTimelineVisualization
                    config={{
                      ...createDualTimelineConfig(),
                      worldId: 'demo-world',
                      campaignId: 'demo-campaign'
                    }}
                    onEventClick={(eventId, timeline) => {
                      console.log('Demo event clicked:', eventId, timeline);
                    }}
                    onEventEdit={(eventId) => {
                      console.log('Demo event edit:', eventId);
                    }}
                    onEventCreate={(eventData, timeline) => {
                      console.log('Demo event create:', eventData, timeline);
                    }}
                    onTimeRangeChange={(start, end, timeline) => {
                      console.log('Demo time range change:', start, end, timeline);
                    }}
                  />
                ) : (
                  <Alert icon={<IconAlertCircle size="1rem" />} title="Demo Mode" color="blue" variant="light">
                    Enable "Dual Timeline Mode" above to see the interactive timeline visualization.
                  </Alert>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="settings" pt="md">
                <Paper p="md" withBorder shadow="sm">
                  <Title order={3}>Visualization Settings</Title>
                  <Text c="dimmed" size="sm" mb="md">Configure how the timeline visualization appears and behaves.</Text>
                  <Alert color="blue" variant="light">
                    <Text>Settings will be available in a future update.</Text>
                  </Alert>
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </>
        ) : (
          <>
            {/* Timeline Filters - Always render so it can load worlds */}
            <TimelineFilters
              filters={timelineFilters}
              onFiltersChange={handleFiltersChange}
              showEntityContext={!!entityContext}
              entityContext={entityContext || undefined}
              onClearEntityContext={handleClearEntityContext}
              loading={loading}
            />

            {/* Timeline Visualization */}
            <Tabs defaultValue="timeline" color="violet">
              <Tabs.List>
                <Tabs.Tab value="timeline" leftSection={<IconTimeline size={16} />}>
                  Timeline
                  {entityContext && (
                    <Badge size="xs" color="blue" ml="xs">
                      {entityContext.type}
                    </Badge>
                  )}
                </Tabs.Tab>
                <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>Settings</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="timeline" pt="md">
                {!timelineFilters.worldId || !timelineFilters.campaignId ? (
                  <TimelineConfigError
                    worldId={timelineFilters.worldId}
                    campaignId={timelineFilters.campaignId}
                    onRetry={() => window.location.reload()}
                  />
                ) : (
                  <TimelineErrorBoundary
                    onError={(error, errorInfo) => {
                      console.error('Timeline Error Boundary:', error, errorInfo);
                    }}
                  >
                    <TimelineProvider initialConfig={timelineInitialConfig}>
                      <ReactCalendarTimeline config={timelineInitialConfig}
                      onEventClick={(eventId: string) => {
                        console.log('Event clicked:', eventId);
                      }}
                      onEventEdit={(eventId: string) => {
                        console.log('Event edit:', eventId);
                      }}
                      onEventCreate={(event: any) => {
                        console.log('Event create:', event);
                      }}
                      onEventDelete={(eventId: string) => {
                        console.log('Event delete:', eventId);
                      }}
                      onTimeRangeChange={(start: Date, end: Date) => {
                        console.log('Time range change:', start, end);
                      }}
                    />
                    </TimelineProvider>
                  </TimelineErrorBoundary>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="settings" pt="md">
                <Paper p="md" withBorder shadow="sm">
                  <Title order={3}>Timeline Settings</Title>
                  <Text c="dimmed" size="sm" mb="md">Configure timeline display and behavior options.</Text>

                  <Stack gap="md">
                    <Alert color="green" variant="light">
                      <Text fw={500}>Enhanced Timeline Editor Active</Text>
                      <Text size="sm">Using the new React Timeline Editor with hierarchical grouping, advanced filtering, and conflict detection.</Text>
                    </Alert>
                    <Switch
                      label="Show Timeline Markers"
                      description="Display today markers and other timeline indicators"
                      checked={true}
                      onChange={() => {}}
                    />
                    <Switch
                      label="Enable Timeline Editing"
                      description="Allow creating, editing, and moving timeline events"
                      checked={true}
                      onChange={() => {}}
                    />
                    <Switch
                      label="Show Metrics Panel"
                      description="Display timeline analytics and statistics"
                      checked={true}
                      onChange={() => {}}
                    />
                  </Stack>
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </>
        )}

        {/* No campaigns fallback */}
        {campaigns.length === 0 && !loading && !error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="No Campaigns" color="blue" variant="light">
            <Stack gap="md">
              <Text>You don't have any campaigns yet. Create a campaign to use the Timeline visualization with your own data.</Text>
              <Text size="sm" c="dimmed">You can create sample data to test the timeline system, or create your own campaign manually.</Text>
              <Group>
                <Button
                  variant="light"
                  color="green"
                  leftSection={<IconDatabase size={16} />}
                  onClick={handleCreateSampleData}
                  loading={creatingData}
                >
                  Create Sample Data
                </Button>
                <Button variant="light" color="blue" leftSection={<IconPlus size={16} />} onClick={() => navigate('/campaigns/new')}>
                  Create Campaign
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}


      </Stack>
    </Container>
  );
}

// ThemeIcon component for the timeline events
function ThemeIcon({ children, size, radius, color }: { children: React.ReactNode, size: string, radius: string, color: string }) {
  return (
    <div style={{
      backgroundColor: `var(--mantine-color-${color}-filled)`,
      color: 'var(--mantine-color-white)',
      width: size === 'lg' ? '36px' : '24px',
      height: size === 'lg' ? '36px' : '24px',
      borderRadius: radius === 'md' ? 'var(--mantine-radius-md)' : 'var(--mantine-radius-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--mantine-shadow-xs)'
    }}>
      {children}
    </div>
  );
}

export default TimelinePage;
