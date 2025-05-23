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
  RangeSlider,
  Switch,
  Divider,
  Button
} from '@mantine/core';
import { IconAlertCircle, IconTimeline, IconCalendarEvent, IconFilter } from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Campaign } from '../../models/Campaign';
import { Event } from '../../models/Event';

/**
 * TimelinePage - Page component for the Timeline visualization
 */
export function TimelinePage() {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(campaignId || null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Custom handler for DatePickerInput to fix type issues
  const handleDateRangeChange = (value: [string | null, string | null]) => {
    const [startStr, endStr] = value;
    const startDate = startStr ? new Date(startStr) : null;
    const endDate = endStr ? new Date(endStr) : null;
    setDateRange([startDate, endDate]);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(true);

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
        const q = query(campaignsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const campaignData: Campaign[] = [];
        querySnapshot.forEach((doc) => {
          campaignData.push({ id: doc.id, ...doc.data() } as Campaign);
        });

        setCampaigns(campaignData);

        // If no campaign is selected and we have campaigns, select the first one
        if (!selectedCampaignId && campaignData.length > 0 && campaignData[0].id) {
          setSelectedCampaignId(campaignData[0].id);
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, campaignId, selectedCampaignId]);

  // Fetch events for the selected campaign
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedCampaignId) return;

      try {
        setLoading(true);
        setError(null);

        const eventsRef = collection(db, 'events');
        let q = query(
          eventsRef,
          where('campaignId', '==', selectedCampaignId),
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
  }, [selectedCampaignId]);

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
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" withCloseButton onClose={() => setError(null)} variant="filled">
            <Stack gap="md">
              <Text>{error}</Text>
              <Button variant="white" color="red" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Stack>
          </Alert>
        ) : campaigns.length === 0 ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="No Campaigns" color="yellow" variant="filled">
            <Stack gap="md">
              <Text>You don't have any campaigns yet. Create a campaign to use the Timeline visualization.</Text>
              <Button variant="white" color="yellow" onClick={() => navigate('/campaigns/new')}>
                Create Campaign
              </Button>
            </Stack>
          </Alert>
        ) : (
          <>
            <Paper p="md" withBorder shadow="sm">
              <Stack gap="md">
                <Group align="flex-end">
                  <Select
                    label="Select Campaign"
                    placeholder="Choose a campaign"
                    data={campaignOptions}
                    value={selectedCampaignId}
                    onChange={setSelectedCampaignId}
                    w={300}
                    comboboxProps={{ withinPortal: true }}
                  />
                </Group>

                <Divider label="Timeline Filters" labelPosition="center" />

                <Group align="flex-end">
                  <DatePickerInput
                    type="range"
                    label="Date Range"
                    placeholder="Filter events by date range"
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    w={300}
                    clearable
                    popoverProps={{ withinPortal: true }}
                  />

                  <Switch
                    label="Show all events"
                    checked={showAllEvents}
                    onChange={(event) => setShowAllEvents(event.currentTarget.checked)}
                    color="violet"
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
                {events.length === 0 ? (
                  <Alert icon={<IconAlertCircle size="1rem" />} title="No Events" color="blue" variant="light">
                    This campaign doesn't have any events yet. Create events to visualize them on the timeline.
                  </Alert>
                ) : filteredEvents.length === 0 ? (
                  <Alert icon={<IconAlertCircle size="1rem" />} title="No Events in Range" color="blue" variant="light">
                    There are no events in the selected date range. Adjust the filter or create new events.
                  </Alert>
                ) : (
                  <Paper p="md" withBorder shadow="sm">
                    <Stack gap="md">
                      {filteredEvents.map((event) => (
                        <Paper key={event.id} p="md" withBorder shadow="xs" radius="sm">
                          <Group align="flex-start">
                            <ThemeIcon size="lg" radius="md" color="violet">
                              <IconCalendarEvent size={20} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                              <Group justify="space-between">
                                <Text fw={600}>{event.name}</Text>
                                <Text size="sm" c="dimmed" fw={500}>{formatDate(event.date)}</Text>
                              </Group>
                              <Text size="sm" mt="xs" lh={1.6}>{event.description}</Text>
                            </div>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
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
