import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Stack,
  Badge,
  Divider,
  Avatar,
  Grid,
  Card,
  ActionIcon,
  Menu,
  Tabs,
  Alert,
  Anchor,
  Breadcrumbs
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconCalendarEvent,
  IconClock,
  IconUsers,
  IconMapPin,
  IconNotes,
  IconLock,
  IconAlertCircle,
  IconDotsVertical
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { SessionService } from '../../services/session.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { Session } from '../../models/Session';
import { EntityType } from '../../models/EntityType';
import { ModelEntityType } from '../../models/ModelEntityType';

/**
 * Session Detail Page
 * Displays detailed information about a session
 */
export function SessionDetailPage() {
  const { id = '', worldId = '' } = useParams<{ id: string; worldId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string | null>('summary');

  // Load session data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !worldId) {
        setError('Missing session ID or world ID');
        setLoading(false);
        return;
      }

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(worldId);
        setWorldName(world?.name || 'Unknown World');

        // Get session details
        const sessionService = SessionService.getInstance(worldId, 'default-campaign');
        const sessionData = await sessionService.getById(id);

        if (sessionData) {
          // Add entityType to the session
          setSession(sessionData ? {
            ...sessionData,
            entityType: EntityType.SESSION,
            name: sessionData.title || `Session #${sessionData.number}`
          } : null);
        } else {
          setError('Session not found');
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, worldId]);

  // Handle edit session
  const handleEditSession = () => {
    navigate(`/rpg-worlds/${worldId}/sessions/${id}/edit`);
  };

  // Handle delete session
  const handleDeleteSession = async () => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const sessionService = SessionService.getInstance(worldId, 'default-campaign');
        await sessionService.delete(id);

        notifications.show({
          title: 'Session Deleted',
          message: 'The session has been deleted successfully',
          color: 'green',
        });

        // Navigate back to sessions list
        navigate(`/rpg-worlds/${worldId}/sessions`);
      } catch (error) {
        console.error('Error deleting session:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete session. Please try again.',
          color: 'red',
        });
      }
    }
  };

  // Format date
  const formatDate = (date: any): string => {
    if (!date) return 'No date';

    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }

    // Format date
    try {
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'planned': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Sessions', href: `/rpg-worlds/${worldId}/sessions` },
    { title: session?.title || 'Session Details', href: `/rpg-worlds/${worldId}/sessions/${id}` },
  ];

  // Show loading or error state
  if (loading) {
    return (
      <Container size="lg">
        <Text>Loading session details...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
        <Button
          leftSection={<IconArrowLeft size="1rem" />}
          mt="md"
          component={Link}
          to={`/rpg-worlds/${worldId}/sessions`}
        >
          Back to Sessions
        </Button>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container size="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Not Found" color="yellow">
          Session not found
        </Alert>
        <Button
          leftSection={<IconArrowLeft size="1rem" />}
          mt="md"
          component={Link}
          to={`/rpg-worlds/${worldId}/sessions`}
        >
          Back to Sessions
        </Button>
      </Container>
    );
  }

  return (
    <Container size="lg">
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
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="xs">
              <Badge size="lg" color="blue">
                Session #{session.number}
              </Badge>
              <Badge size="lg" color={session.status ? getStatusColor(session.status) : 'blue'}>
                {session.status ? session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Planned'}
              </Badge>
            </Group>
            <Title order={1}>{session.title}</Title>
            <Group>
              <Group gap="xs">
                <IconCalendarEvent size="1rem" />
                <Text>{formatDate(session.datePlayed)}</Text>
              </Group>
              {session.duration && (
                <Group gap="xs">
                  <IconClock size="1rem" />
                  <Text>{session.duration} minutes</Text>
                </Group>
              )}
            </Group>
          </Stack>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconArrowLeft size="1rem" />}
              component={Link}
              to={`/rpg-worlds/${worldId}/sessions`}
            >
              Back
            </Button>
            <Button
              leftSection={<IconEdit size="1rem" />}
              onClick={handleEditSession}
            >
              Edit
            </Button>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg">
                  <IconDotsVertical size="1rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconTrash size="1rem" />}
                  color="red"
                  onClick={handleDeleteSession}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Content Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="summary" leftSection={<IconNotes size="0.8rem" />}>
              Summary
            </Tabs.Tab>
            <Tabs.Tab value="participants" leftSection={<IconUsers size="0.8rem" />}>
              Participants
            </Tabs.Tab>
            <Tabs.Tab value="locations" leftSection={<IconMapPin size="0.8rem" />}>
              Locations
            </Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconCalendarEvent size="0.8rem" />}>
              Events
            </Tabs.Tab>
            <Tabs.Tab value="dm-notes" leftSection={<IconLock size="0.8rem" />}>
              DM Notes
            </Tabs.Tab>
          </Tabs.List>

          <Paper p="md" withBorder mt="xs">
            {/* Summary Tab */}
            <Tabs.Panel value="summary">
              <Stack gap="md">
                <Title order={3}>Session Summary</Title>
                {session.summary ? (
                  <Text>{session.summary}</Text>
                ) : (
                  <Text c="dimmed" fs="italic">No summary available</Text>
                )}

                <Divider />

                <Title order={3}>Player Notes</Title>
                {session.notes ? (
                  <Text>{session.notes}</Text>
                ) : (
                  <Text c="dimmed" fs="italic">No player notes available</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Participants Tab */}
            <Tabs.Panel value="participants">
              <Stack gap="md">
                <Title order={3}>Participants</Title>
                {session.participants && session.participants.length > 0 ? (
                  <Grid>
                    {session.participants.map((participant, index) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={index}>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar radius="xl" color="blue">
                              {participant.name ? participant.name.charAt(0) : '?'}
                            </Avatar>
                            <div>
                              <Text fw={500}>{participant.name}</Text>
                              {participant.userId && (
                                <Text size="xs" c="dimmed">Player Character</Text>
                              )}
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No participants recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Locations Tab */}
            <Tabs.Panel value="locations">
              <Stack gap="md">
                <Title order={3}>Locations</Title>
                {session.locations && session.locations.length > 0 ? (
                  <Grid>
                    {session.locations.map((location, index) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={index}>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar radius="xl" color="teal">
                              <IconMapPin size="1rem" />
                            </Avatar>
                            <div>
                              <Text fw={500}>{location.name}</Text>
                              <Badge size="xs">{location.type}</Badge>
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No locations recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Events Tab */}
            <Tabs.Panel value="events">
              <Stack gap="md">
                <Title order={3}>Events</Title>
                {session.events && session.events.length > 0 ? (
                  <Grid>
                    {session.events.map((event, index) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={index}>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar radius="xl" color="orange">
                              <IconCalendarEvent size="1rem" />
                            </Avatar>
                            <div>
                              <Text fw={500}>{event.name}</Text>
                              <Badge size="xs">{event.type}</Badge>
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No events recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* DM Notes Tab */}
            <Tabs.Panel value="dm-notes">
              <Stack gap="md">
                <Group>
                  <Title order={3}>DM Notes</Title>
                  <Badge color="red" leftSection={<IconLock size="0.8rem" />}>
                    Private
                  </Badge>
                </Group>
                {session.dmNotes ? (
                  <Text>{session.dmNotes}</Text>
                ) : (
                  <Text c="dimmed" fs="italic">No DM notes available</Text>
                )}
              </Stack>
            </Tabs.Panel>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}

// Helper function to get color based on session status
function getStatusColor(status: string | undefined): string {
  if (!status) return 'gray';

  switch (status) {
    case 'planned': return 'blue';
    case 'completed': return 'green';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
}

// Helper function to format date
function formatDate(date: Date | { toDate: () => Date } | string | null | undefined): string {
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

export default SessionDetailPage;
