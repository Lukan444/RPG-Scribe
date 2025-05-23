import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Avatar,
  Tabs,
  Grid,
  Stack,
  Button,
  ActionIcon,
  Menu,
  Loader,
  Center,
  Divider,
  List,
  ThemeIcon,
  Card,
  SimpleGrid
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconCalendarEvent,
  IconUser,
  IconMapPin,
  IconSword,
  IconNotes,
  IconUsers as IconRelationship,
  IconHistory,
  IconDotsVertical,
  IconSwords,
  IconUsers
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EventService, Event } from '../../services/event.service';
import { RelationshipService, Relationship } from '../../services/relationship.service';
import { EntityType } from '../../models/EntityType';
import '@mantine/dates/styles.css'; // Import date styles

/**
 * EventDetailPage component - Displays detailed information about an event
 *
 * Uses the EventService to fetch event data from Firestore
 * Displays event details, relationships, participants, and outcomes
 * Supports editing and deleting the event
 *
 * @see {@link https://mantine.dev/core/tabs/} - Mantine Tabs documentation
 * @see {@link https://mantine.dev/core/badge/} - Mantine Badge documentation
 */
export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // For now, we'll use a hardcoded world and campaign ID
        const worldId = 'default-world';
        const campaignId = 'default-campaign';

        const eventService = EventService.getInstance(worldId, campaignId);
        const eventData = await eventService.getEntity(id);

        if (!eventData) {
          setError('Event not found');
          return;
        }

        setEvent(eventData);

        // Load relationships
        const relationshipService = RelationshipService.getInstance(worldId, campaignId);
        const relationshipsData = await relationshipService.getRelationshipsByEntity(id, EntityType.EVENT);
        setRelationships(relationshipsData);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  // Handle delete event
  const handleDeleteEvent = () => {
    openConfirmDelete();
  };

  // Confirm delete event
  const confirmDeleteEvent = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // For now, we'll use a hardcoded world and campaign ID
      const worldId = 'default-world';
      const campaignId = 'default-campaign';

      const eventService = EventService.getInstance(worldId, campaignId);
      await eventService.deleteEntity(id);

      navigate('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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

  // Get icon for event type
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'Battle':
        return <IconSwords size={24} />;
      case 'Social':
        return <IconUsers size={24} />;
      case 'Discovery':
        return <IconMapPin size={24} />;
      case 'Plot Point':
        return <IconCalendarEvent size={24} />;
      default:
        return <IconCalendarEvent size={24} />;
    }
  };

  // If loading
  if (loading && !event) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && !event) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  // If event not found
  if (!event) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text>Event not found</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            component={Link}
            to="/events"
            mb="xs"
          >
            Back to Events
          </Button>
          <Title order={1}>{event.name}</Title>
        </div>

        <Group>
          <Button
            component={Link}
            to={`/events/${id}/edit`}
            leftSection={<IconEdit size={16} />}
          >
            Edit
          </Button>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="default" size="lg">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={handleDeleteEvent}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Stack align="center" gap="md">
              <Avatar
                src={event.imageURL}
                size={150}
                radius={100}
                alt={event.name}
              >
                {getEventTypeIcon(event.type)}
              </Avatar>

              <Title order={2}>{event.name}</Title>

              <Group gap={5}>
                <Badge color={getEventTypeColor(event.type)} size="lg">
                  {event.type}
                </Badge>

                {event.importance && (
                  <Badge color={getImportanceColor(event.importance)} size="lg">
                    Importance: {event.importance}/10
                  </Badge>
                )}

                {event.isSecret && (
                  <Badge color="gray" size="lg">
                    Secret
                  </Badge>
                )}
              </Group>

              <Text c="dimmed" ta="center">
                {event.description || 'No description available.'}
              </Text>

              <Divider w="100%" />

              <Group grow w="100%">
                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{relationships.length}</Text>
                  <Text size="xs" c="dimmed">Relationships</Text>
                </Stack>

                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{event.participants?.length || 0}</Text>
                  <Text size="xs" c="dimmed">Participants</Text>
                </Stack>
              </Group>

              {event.date && (
                <Group grow w="100%">
                  <Stack align="center" gap={5}>
                    <Text fw={700} size="lg">{new Date(event.date.toDate()).toLocaleDateString()}</Text>
                    <Text size="xs" c="dimmed">Date</Text>
                  </Stack>
                </Group>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="details" leftSection={<IconCalendarEvent size={16} />}>
                  Details
                </Tabs.Tab>
                <Tabs.Tab value="participants" leftSection={<IconUser size={16} />}>
                  Participants
                </Tabs.Tab>
                <Tabs.Tab value="location" leftSection={<IconMapPin size={16} />}>
                  Location
                </Tabs.Tab>
                <Tabs.Tab value="items" leftSection={<IconSword size={16} />}>
                  Items
                </Tabs.Tab>
                <Tabs.Tab value="relationships" leftSection={<IconRelationship size={16} />}>
                  Relationships
                </Tabs.Tab>
                <Tabs.Tab value="outcome" leftSection={<IconNotes size={16} />}>
                  Outcome
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Type</Text>
                      <Text>{event.type || 'N/A'}</Text>

                      <Text fw={700} mt="md">Date</Text>
                      <Text>{event.date ? new Date(event.date.toDate()).toLocaleDateString() : 'N/A'}</Text>

                      <Text fw={700} mt="md">Importance</Text>
                      <Text>{event.importance ? `${event.importance}/10` : 'N/A'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Created By</Text>
                      <Text>{event.createdBy || 'N/A'}</Text>

                      <Text fw={700} mt="md">Created At</Text>
                      <Text>{event.createdAt ? new Date(event.createdAt.toDate()).toLocaleString() : 'N/A'}</Text>

                      <Text fw={700} mt="md">Updated At</Text>
                      <Text>{event.updatedAt ? new Date(event.updatedAt.toDate()).toLocaleString() : 'N/A'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={12} mt="md">
                    <Text fw={700}>Description</Text>
                    <Text>{event.description || 'No description available.'}</Text>
                  </Grid.Col>

                  {event.session && (
                    <Grid.Col span={12} mt="md">
                      <Text fw={700}>Session</Text>
                      <Group>
                        <Text>{event.session.title || `Session ${event.session.number}`}</Text>
                        <Button
                          variant="subtle"
                          size="xs"
                          component={Link}
                          to={`/sessions/${event.sessionId}`}
                        >
                          View Session
                        </Button>
                      </Group>
                    </Grid.Col>
                  )}
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="participants" pt="md">
                {event.participants && event.participants.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {event.participants.map((participant, index) => (
                      <Card key={index} withBorder shadow="sm" p="md">
                        <Group justify="space-between">
                          <Text fw={700}>{participant.name || 'Unknown Character'}</Text>
                          <Badge>{participant.role || 'Participant'}</Badge>
                        </Group>
                        <Group mt="md" justify="flex-end">
                          <Button
                            variant="subtle"
                            size="xs"
                            component={Link}
                            to={`/characters/${participant.id}`}
                          >
                            View Character
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No participants recorded for this event.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="location" pt="md">
                {event.location ? (
                  <Card withBorder shadow="sm" p="md">
                    <Group justify="space-between">
                      <Text fw={700}>{event.location.name}</Text>
                      <Badge>{event.location.type}</Badge>
                    </Group>
                    <Group mt="md" justify="flex-end">
                      <Button
                        variant="subtle"
                        size="xs"
                        component={Link}
                        to={`/locations/${event.locationId}`}
                      >
                        View Location
                      </Button>
                    </Group>
                  </Card>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No location specified for this event.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="items" pt="md">
                <Text c="dimmed" ta="center" py="xl">
                  No items associated with this event.
                </Text>
              </Tabs.Panel>

              <Tabs.Panel value="relationships" pt="md">
                {relationships.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {relationships.map((relationship) => (
                      <Card key={relationship.id} withBorder shadow="sm" p="md">
                        <Group justify="space-between">
                          <Text fw={700}>{relationship.targetEntity?.name || 'Unknown Entity'}</Text>
                          <Badge>{relationship.type}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">
                          {relationship.description || 'No description available.'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No relationships found for this event.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="outcome" pt="md">
                <Paper p="md" withBorder>
                  {event.outcome ? (
                    <div>
                      <Text fw={700} mb="md">Outcome</Text>
                      <Text>{event.outcome}</Text>

                      {event.consequences && event.consequences.length > 0 && (
                        <div>
                          <Text fw={700} mt="xl" mb="md">Consequences</Text>
                          <List>
                            {event.consequences.map((consequence: string, index: number) => (
                              <List.Item key={index}>{consequence}</List.Item>
                            ))}
                          </List>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Text c="dimmed" ta="center">
                      No outcome recorded for this event.
                    </Text>
                  )}
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete ${event.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteEvent}
      />
    </Container>
  );
}

export default EventDetailPage;
