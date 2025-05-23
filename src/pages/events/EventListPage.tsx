import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Tabs,
  Group,
  Badge,
  Text,
  Avatar,
  ThemeIcon,
  SimpleGrid,
  Paper,
  Divider,
  Loader,
  Center,
  Button
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconList,
  IconLayoutGrid,
  IconArticle,
  IconPlus,
  IconSwords,
  IconGripVertical,
  IconUsers,
  IconMap,
  IconArrowLeft
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { EntityTable } from '../../components/common/EntityTable';
import { EntityCardGrid } from '../../components/common/EntityCardGrid';
import { ArticleCard } from '../../components/common/ArticleCard';
import { DragDropEntityOrganizer } from '../../components/common/DragDropEntityOrganizer';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EntityActionButton } from '../../components/common/EntityActionButton';
import { EntityType } from '../../models/EntityType';
import { EventService, Event } from '../../services/event.service';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '@mantine/dates/styles.css'; // Import date styles
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * EventListPage component - Displays a list of events with various view options
 *
 * Uses the EventService to fetch event data from Firestore
 * Provides table, grid, and article views for events
 * Supports filtering, sorting, and CRUD operations
 *
 * @see {@link https://mantine.dev/core/tabs/} - Mantine Tabs documentation
 * @see {@link https://mantine.dev/core/badge/} - Mantine Badge documentation
 */
export function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('table');
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);
  const [fromPath, setFromPath] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Get params at the component level
  const params = useParams();
  const campaignId = getCampaignIdFromParams(params);

  // Extract worldFilter from location state if available
  useEffect(() => {
    if (location.state) {
      const { worldFilter, from } = location.state as { worldFilter?: string, from?: string };
      if (worldFilter) {
        setWorldFilter(worldFilter);
      }
      if (from) {
        setFromPath(from);
      }
    }
  }, [location.state]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);

        // Use worldFilter if available, otherwise use empty string for global view
        const worldId = worldFilter || '';

        // Create event service - it will handle empty worldId internally
        const eventService = EventService.getInstance(worldId, campaignId);
        const eventsData = await eventService.listEntities();

        // If worldFilter is set, add a note to the UI
        if (worldFilter) {
          console.log(`Filtering events for world: ${worldFilter}`);
        }

        setEvents(eventsData);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [worldFilter, campaignId]);

  // Handle view event
  const handleViewEvent = (event: Event) => {
    if (!event.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'events', event.id));
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/events/${event.id}`);
    }
  };

  // Handle edit event
  const handleEditEvent = (event: Event) => {
    if (!event.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'events', event.id, 'edit'));
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/events/${event.id}/edit`);
    }
  };

  // Handle delete event
  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    openConfirmDelete();
  };

  // Confirm delete event
  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      setLoading(true);

      // Use worldFilter if available, otherwise use empty string for global view
      const worldId = worldFilter || '';

      const eventService = EventService.getInstance(worldId, campaignId);
      await eventService.deleteEntity(eventToDelete.id!);

      // Remove from state
      setEvents(prev => prev.filter(c => c.id !== eventToDelete.id));
      closeConfirmDelete();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle save order
  const handleSaveOrder = (orderedEvents: Event[]) => {
    setEvents(orderedEvents);
    // In a real implementation, we would save the order to the database
  };

  // Render event badge
  const renderEventBadge = (event: Event) => (
    <Group gap={5}>
      <Badge color={getEventTypeColor(event.type)}>
        {event.type}
      </Badge>
      {event.importance && (
        <Badge color={getImportanceColor(event.importance)}>
          Importance: {event.importance}
        </Badge>
      )}
      {event.isSecret && (
        <Badge color="gray">
          Secret
        </Badge>
      )}
    </Group>
  );

  // Get color for event type
  const getEventTypeColor = (eventType: string): string => {
    switch (eventType) {
      case 'Battle':
        return 'red';
      case 'Social':
        return 'blue';
      case 'Discovery':
        return 'green';
      case 'Plot Point':
        return 'violet';
      case 'Quest':
        return 'yellow';
      case 'Travel':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  // Get color for importance
  const getImportanceColor = (importance: number): string => {
    if (importance >= 8) return 'red';
    if (importance >= 6) return 'orange';
    if (importance >= 4) return 'yellow';
    if (importance >= 2) return 'blue';
    return 'gray';
  };

  // Filter options
  const filterOptions = [
    { value: 'Battle', label: 'Battles' },
    { value: 'Social', label: 'Social Events' },
    { value: 'Discovery', label: 'Discoveries' },
    { value: 'Plot Point', label: 'Plot Points' },
    { value: 'Quest', label: 'Quests' },
    { value: 'Travel', label: 'Travel' }
  ];

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (event: Event) => (
        <Group gap="sm">
          <Avatar
            src={event.imageURL}
            radius="xl"
            size="sm"
            alt={event.name}
          >
            <IconCalendarEvent size={16} />
          </Avatar>
          <Text fw={500}>{event.name}</Text>
        </Group>
      )
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (event: Event) => (
        <Badge color={getEventTypeColor(event.type)}>
          {event.type}
        </Badge>
      )
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (event: Event) => (
        <Text size="sm">
          {event.date ? new Date(event.date.toDate()).toLocaleDateString() : 'N/A'}
        </Text>
      )
    },
    {
      key: 'importance',
      title: 'Importance',
      sortable: true,
      render: (event: Event) => (
        event.importance ? (
          <Badge color={getImportanceColor(event.importance)}>
            {event.importance}/10
          </Badge>
        ) : (
          <Text size="sm">-</Text>
        )
      )
    },
    {
      key: 'location',
      title: 'Location',
      sortable: true,
      render: (event: Event) => (
        event.location ? (
          <Text size="sm">{event.location.name}</Text>
        ) : (
          <Text size="sm">None</Text>
        )
      )
    },
    {
      key: 'session',
      title: 'Session',
      sortable: true,
      render: (event: Event) => (
        event.session ? (
          <Text size="sm">{event.session.title || `Session ${event.session.number}`}</Text>
        ) : (
          <Text size="sm">None</Text>
        )
      )
    }
  ];

  // Render event item for drag and drop
  const renderEventItem = (event: Event) => (
    <Group wrap="nowrap">
      <Avatar
        src={event.imageURL}
        radius="xl"
        size="md"
        alt={event.name}
      >
        <IconCalendarEvent size={16} />
      </Avatar>
      <div>
        <Group gap={5}>
          <Text fw={500}>{event.name}</Text>
          <Badge size="xs" color={getEventTypeColor(event.type)}>
            {event.type}
          </Badge>
          {event.importance && (
            <Badge size="xs" color={getImportanceColor(event.importance)}>
              {event.importance}/10
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">{event.description?.substring(0, 50)}{event.description?.length > 50 ? '...' : ''}</Text>
      </div>
    </Group>
  );

  // If loading
  if (loading && events.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && events.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            {fromPath && (
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate(fromPath)}
              >
                Back
              </Button>
            )}
            <Title order={1}>
              {worldFilter ? 'World Events' : 'Events'}
              {worldFilter && <Badge ml="xs" color="blue">Filtered by World</Badge>}
            </Title>
          </Group>

          <Group>
            <EntityActionButton
              entityType={EntityType.EVENT}
              primaryAction={{
                label: 'Create Event',
                icon: <IconPlus size={16} />,
                onClick: () => {
                  if (worldFilter) {
                    navigate(buildEntityRoutePath(worldFilter, 'events', undefined, 'new'));
                  } else {
                    navigate('/events/new');
                  }
                }
              }}
              actions={[
                {
                  label: 'Import Events',
                  icon: <IconCalendarEvent size={16} />,
                  onClick: () => console.log('Import events')
                }
              ]}
              groupedActions={[
                {
                  title: 'Generate',
                  actions: [
                    {
                      label: 'Generate Battle',
                      icon: <IconSwords size={16} />,
                      onClick: () => console.log('Generate battle')
                    },
                    {
                      label: 'Generate Social Event',
                      icon: <IconUsers size={16} />,
                      onClick: () => console.log('Generate social event')
                    },
                    {
                      label: 'Generate Travel Event',
                      icon: <IconMap size={16} />,
                      onClick: () => console.log('Generate travel event')
                    }
                  ]
                }
              ]}
            />
          </Group>
        </Group>

        <Divider mb="md" />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="table" leftSection={<IconList size={16} />}>
              Table View
            </Tabs.Tab>
            <Tabs.Tab value="grid" leftSection={<IconLayoutGrid size={16} />}>
              Grid View
            </Tabs.Tab>
            <Tabs.Tab value="article" leftSection={<IconArticle size={16} />}>
              Article View
            </Tabs.Tab>
            <Tabs.Tab value="organize" leftSection={<IconGripVertical size={16} />}>
              Organize
            </Tabs.Tab>
          </Tabs.List>

          <div style={{ marginTop: '1rem' }}>
            {activeTab === 'table' && (
              <EntityTable
                data={events}
                columns={columns}
                entityType={EntityType.EVENT}
                onView={handleViewEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                filterOptions={filterOptions}
              />
            )}

            {activeTab === 'grid' && (
              <EntityCardGrid
                data={events}
                entityType={EntityType.EVENT}
                onView={handleViewEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                filterOptions={filterOptions}
                renderBadge={renderEventBadge}
              />
            )}

            {activeTab === 'article' && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {events.map(event => (
                  <ArticleCard
                    key={event.id}
                    id={event.id!}
                    image={event.imageURL}
                    title={event.name}
                    description={event.description || ''}
                    entityType={EntityType.EVENT}
                    category={event.type}
                    date={event.date ? new Date(event.date.toDate()).toLocaleDateString() : undefined}
                    onView={() => handleViewEvent(event)}
                    onEdit={() => handleEditEvent(event)}
                    onDelete={() => handleDeleteEvent(event)}
                  />
                ))}
              </SimpleGrid>
            )}

            {activeTab === 'organize' && (
              <DragDropEntityOrganizer
                data={events}
                entityType={EntityType.EVENT}
                onSaveOrder={handleSaveOrder}
                onView={handleViewEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                renderItem={renderEventItem}
              />
            )}
          </div>
        </Tabs>
      </Paper>

      {/* Event Stats */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="red">
              <IconSwords size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Battles</Text>
              <Text fw={700} size="xl">{events.filter(e => e.type === 'Battle').length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="blue">
              <IconUsers size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Social Events</Text>
              <Text fw={700} size="xl">{events.filter(e => e.type === 'Social').length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="teal">
              <IconCalendarEvent size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Total Events</Text>
              <Text fw={700} size="xl">{events.length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete ${eventToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteEvent}
      />
    </Container>
  );
}

export default EventListPage;
