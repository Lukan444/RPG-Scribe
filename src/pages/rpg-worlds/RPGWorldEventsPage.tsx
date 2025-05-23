import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Menu,
  Card,
  Image,
  Paper,
  Stack,
  Avatar,
  SimpleGrid,
  Tabs,
  Alert,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconEye,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconArrowLeft,
  IconAlertCircle,
  IconCalendarEvent
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/Event';
import { EventType } from '../../models/EventType';
import { EventImportance } from '../../models/Event';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * RPG World Events Page
 * Displays events specific to a world with filtering, table/grid views,
 * and CRUD operations
 *
 * @returns JSX.Element - The rendered component
 */
export function RPGWorldEventsPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { worldId = '' } = useParams<{ worldId: string }>();
  const { currentUser } = useAuth();

  /**
   * Component state
   */
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  // Get all params at the component level
  const params = useParams();

  /**
   * Fetch world name and events when worldId changes
   */
  useEffect(() => {
    /**
     * Async function to fetch data from services
     */
    const fetchData = async (): Promise<void> => {
      // Get worldId and campaignId from params using utility functions
      const currentWorldId = getWorldIdFromParams({ worldId });
      const campaignId = getCampaignIdFromParams(params);

      if (!currentWorldId) {
        setError('No world ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(currentWorldId);
        setWorldName(world?.name || 'Unknown World');

        // Get events for this world
        const eventService = EventService.getInstance(currentWorldId, campaignId);
        const worldEvents = await eventService.listEntities();
        // Add entityType to each event
        setEvents(worldEvents.map(event => ({
          ...event,
          entityType: EntityType.EVENT,
          eventType: event.type ? (event.type as EventType) : EventType.OTHER,
          timelinePosition: event.timelinePosition || 0
        })));
      } catch (err) {
        console.error('Error fetching world events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId, params]);

  /**
   * Filter events based on search query and selected type
   */
  const filteredEvents = events.filter(event => {
    const matchesSearch: boolean = searchQuery === '' ||
      (event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType: boolean = !selectedType ||
      (event.eventType === selectedType);

    return matchesSearch && matchesType;
  });

  /**
   * Handle create event navigation
   */
  const handleCreateEvent = (): void => {
    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'events', undefined, 'new'));
  };

  /**
   * Handle view event navigation
   * @param eventId Event ID
   */
  const handleViewEvent = (eventId: string): void => {
    if (!eventId) {
      console.error('Event ID is undefined');
      return;
    }

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'events', eventId));
  };

  /**
   * Handle edit event navigation
   * @param e Mouse event
   * @param eventId Event ID
   */
  const handleEditEvent = (e: React.MouseEvent, eventId: string): void => {
    if (!eventId) {
      console.error('Event ID is undefined');
      return;
    }
    e.stopPropagation();

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'events', eventId, 'edit'));
  };

  /**
   * Handle event deletion
   * @param e Mouse event
   * @param eventId Event ID
   */
  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string): Promise<void> => {
    if (!eventId) {
      console.error('Event ID is undefined');
      return;
    }
    e.stopPropagation();

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        // Get worldId and campaignId from params using utility functions
        const currentWorldId = getWorldIdFromParams({ worldId });
        const campaignId = getCampaignIdFromParams(params);

        if (!currentWorldId) {
          notifications.show({
            title: 'Error',
            message: 'No world ID provided',
            color: 'red',
          });
          return;
        }

        const eventService = EventService.getInstance(currentWorldId, campaignId);
        await eventService.delete(eventId);

        // Update local state
        setEvents(events.filter(e => e.id !== eventId));

        notifications.show({
          title: 'Event Deleted',
          message: 'The event has been deleted successfully',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting event:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete event. Please try again.',
          color: 'red',
        });
      }
    }
  };

  /**
   * Breadcrumb navigation items
   */
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Events', href: buildEntityRoutePath(worldId, 'events') },
  ];

  return (
    <Container size="xl">
      <Stack gap="md">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <Anchor
              key={index}
              component={Link}
              to={item.href}
              c={index === breadcrumbItems.length - 1 ? 'dimmed' : undefined}
              underline={index === breadcrumbItems.length - 1 ? 'never' : 'always'}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        {/* Header */}
        <Group justify="space-between">
          <Title order={1}>Events in {worldName}</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateEvent}
          >
            Create Event
          </Button>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Group>
          <TextInput
            placeholder="Search events..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: 'Battle', label: 'Battle' },
              { value: 'Social', label: 'Social' },
              { value: 'Discovery', label: 'Discovery' },
              { value: 'PlotPoint', label: 'Plot Point' },
              { value: 'Other', label: 'Other' }
            ]}
            value={selectedType}
            onChange={setSelectedType}
            leftSection={<IconFilter size="1rem" />}
            clearable
          />
        </Group>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onChange={(value) => setViewMode(value || 'table')}>
          <Tabs.List>
            <Tabs.Tab value="table">Table View</Tabs.Tab>
            <Tabs.Tab value="grid">Grid View</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconCalendarEvent size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No events found. Create your first event to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateEvent}
              >
                Create Event
              </Button>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size="1rem" />}
                component={Link}
                to={`/rpg-worlds/${getWorldIdFromParams({ worldId })}`}
              >
                Back to World
              </Button>
            </Stack>
          </Paper>
        ) : viewMode === 'table' ? (
          <Table striped highlightOnHover tabularNums stickyHeader stickyHeaderOffset={60}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Importance</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredEvents.map((event) => (
                <Table.Tr
                  key={event.id}
                  onClick={() => event.id && handleViewEvent(event.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        radius="xl"
                        size="sm"
                        color={getEventTypeColor(event.eventType)}
                      >
                        {event.name ? event.name.charAt(0) : 'E'}
                      </Avatar>
                      {event.name}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getEventTypeColor(event.eventType)}>
                      {event.eventType}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatEventDate(event.eventDate)}</Table.Td>
                  <Table.Td>
                    <Badge color={getImportanceColor(event.importance)}>
                      {event.importance || 5}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{truncateText(event.description, 50)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          event.id && handleViewEvent(event.id);
                        }}
                      >
                        <IconEye size="1rem" />
                      </ActionIcon>
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDotsVertical size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={(e) => event.id && handleEditEvent(e, event.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => event.id && handleDeleteEvent(e, event.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => event.id && handleViewEvent(event.id)}
                style={{ cursor: 'pointer' }}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{event.name}</Text>
                  <Badge color={getEventTypeColor(event.eventType)}>
                    {event.eventType}
                  </Badge>
                </Group>

                <Group mb="xs">
                  <Text size="xs" c="dimmed">
                    {formatEventDate(event.eventDate)}
                  </Text>
                  <Badge color={getImportanceColor(event.importance)}>
                    Importance: {event.importance || 5}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" mb="md">
                  {truncateText(event.description, 100)}
                </Text>

                <Group mt="md" justify="flex-end">
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size="1rem" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size="1rem" />}
                        onClick={(e) => event.id && handleEditEvent(e, event.id)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => event.id && handleDeleteEvent(e, event.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}

/**
 * Get color based on event type
 * @param eventType Type of event
 * @returns Color string for Mantine components
 */
function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'Battle': return 'red';
    case 'Social': return 'blue';
    case 'Discovery': return 'green';
    case 'PlotPoint': return 'violet';
    default: return 'gray';
  }
}

/**
 * Get color based on event importance
 * @param importance Importance level (1-10)
 * @returns Color string for Mantine components
 */
function getImportanceColor(importance?: number): string {
  if (!importance) return 'gray';
  if (importance >= 8) return 'red';
  if (importance >= 6) return 'orange';
  if (importance >= 4) return 'yellow';
  return 'gray';
}

/**
 * Format event date for display
 * @param date Date to format (can be Date, Firestore Timestamp, string, or null)
 * @returns Formatted date string
 */
function formatEventDate(date?: Date | { toDate: () => Date } | string | null): string {
  if (!date) return 'No date';

  try {
    // Handle Firestore Timestamp
    if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }

    // Handle Date object
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }

    // Handle string date
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString();
      }
    }

    return 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Truncate text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis or default message if text is empty
 */
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return 'No description';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export default RPGWorldEventsPage;
