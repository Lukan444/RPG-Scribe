import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import {
  Container, Title, Group, Button, TextInput, Select, Table, Badge,
  Paper, Stack, Text, Avatar, ActionIcon, Menu, Alert, Breadcrumbs,
  Anchor, SimpleGrid, Card, Tooltip, Tabs
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconFilter, IconEye, IconEdit, IconTrash,
  IconDotsVertical, IconClock, IconMapPin, IconUsers, IconCalendarEvent,
  IconAlertCircle, IconArrowLeft
} from '@tabler/icons-react';
import { Session } from '../../models/Session';
import { SessionServiceAdapter } from '../../services/adapters/SessionServiceAdapter';
import { EntityType } from '../../models/EntityType';
import { getCampaignIdFromParams } from '../../utils/routeUtils';
import { buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * Global Session List Page
 * Displays a list of all sessions across all worlds
 */
export function SessionListPage() {
  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  const navigate = useNavigate();
  const location = useLocation();

  // Get params at the component level
  const params = useParams();
  const campaignId = getCampaignIdFromParams(params);

  // Fetch sessions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use empty string for worldId to get global sessions
        const worldId = '';

        // Get sessions using SessionServiceAdapter
        const sessionService = new SessionServiceAdapter(worldId, campaignId || 'default-campaign');
        const result = await sessionService.query();
        const allSessions = result.data;

        // Add entityType to each session
        setSessions(allSessions.map(session => ({
          ...session,
          entityType: EntityType.SESSION,
          name: session.title || `Session #${session.number}`
        })));
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchQuery === '' ||
      (session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = !selectedStatus ||
      (session.status === selectedStatus);

    return matchesSearch && matchesStatus;
  });

  // Handle create session
  const handleCreateSession = () => {
    navigate('/sessions/new');
  };

  // Handle view session
  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  // Handle edit session
  const handleEditSession = (event: React.MouseEvent, sessionId: string) => {
    event.stopPropagation();
    navigate(`/sessions/${sessionId}/edit`);
  };

  // Handle delete session
  const handleDeleteSession = async (event: React.MouseEvent, sessionId: string) => {
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        // Use empty string for worldId to delete from global sessions
        const worldId = '';

        const sessionService = new SessionServiceAdapter(worldId, campaignId || 'default-campaign');
        await sessionService.delete(sessionId);

        // Update local state
        setSessions(sessions.filter(s => s.id !== sessionId));

        notifications.show({
          title: 'Session Deleted',
          message: 'The session has been deleted successfully',
          color: 'green',
        });
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

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sessions', href: '/sessions' },
  ];

  // Show loading state
  if (loading && sessions.length === 0) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.map((item, index) => (
              <Skeleton key={index} height={20} width={80} radius="xl" />
            ))}
          </Breadcrumbs>
          <Skeleton height={50} width="100%" radius="md" />
          <Skeleton height={300} width="100%" radius="md" />
        </Stack>
      </Container>
    );
  }

  // Show error state
  if (error && sessions.length === 0) {
    return (
      <Container size="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

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
          <Title order={1}>All Sessions</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateSession}
          >
            Create Session
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
            placeholder="Search sessions..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All Statuses' },
              { value: 'planned', label: 'Planned' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
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

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconClock size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No sessions found. Create your first session to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateSession}
              >
                Create Session
              </Button>
            </Stack>
          </Paper>
        ) : viewMode === 'table' ? (
          <Table striped highlightOnHover tabularNums stickyHeader stickyHeaderOffset={60}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Session #</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>World</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredSessions.map((session) => (
                <Table.Tr
                  key={session.id}
                  onClick={() => handleViewSession(session.id!)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        radius="xl"
                        size="sm"
                        color={getStatusColor(session.status)}
                      >
                        {session.number}
                      </Avatar>
                    </Group>
                  </Table.Td>
                  <Table.Td>{session.title}</Table.Td>
                  <Table.Td>{formatDate(session.datePlayed)}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(session.status)}>
                      {capitalizeFirstLetter(session.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{session.duration ? `${session.duration} min` : 'N/A'}</Table.Td>
                  <Table.Td>{session.worldId || 'Unknown'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSession(session.id!);
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
                            onClick={(e) => handleEditSession(e, session.id!)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => handleDeleteSession(e, session.id!)}
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
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => handleViewSession(session.id!)}
                style={{ cursor: 'pointer' }}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>Session #{session.number}</Text>
                  <Badge color={getStatusColor(session.status)}>
                    {capitalizeFirstLetter(session.status)}
                  </Badge>
                </Group>

                <Text fw={700} size="lg" mb="xs">
                  {session.title}
                </Text>

                <Group mb="xs">
                  <Text size="xs" c="dimmed">
                    {formatDate(session.datePlayed)}
                  </Text>
                  {session.duration && (
                    <Badge color="gray">
                      {session.duration} min
                    </Badge>
                  )}
                </Group>

                <Text size="sm" c="dimmed" mb="md">
                  {truncateText(session.summary, 80)}
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
                        onClick={(e) => handleEditSession(e, session.id!)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => handleDeleteSession(e, session.id!)}
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
function formatDate(date: any): string {
  if (!date) return 'No date';

  // If it's already a formatted string from SessionServiceAdapter, return it
  if (typeof date === 'string' && date !== 'Invalid date') {
    return date;
  }

  try {
    // Handle Firestore Timestamp objects
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    // Handle Date objects or date strings
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid date';
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(str: string | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to truncate text
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Skeleton component for loading state
function Skeleton({ height, width, radius }: { height: number, width: number | string, radius: string }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        backgroundColor: 'var(--mantine-color-gray-2)',
      }}
    />
  );
}

export default SessionListPage;
