import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import {
  Container, Title, Group, Button, TextInput, Select, Table, Badge,
  Paper, Stack, Text, Avatar, ActionIcon, Menu, Alert, Breadcrumbs,
  Anchor, SimpleGrid, Card, Tabs, Progress
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconFilter, IconEye, IconEdit, IconTrash,
  IconDotsVertical, IconBook, IconCalendarEvent, IconUser, IconMapPin,
  IconAlertCircle
} from '@tabler/icons-react';
import { StoryArc, StoryArcType, StoryArcStatus } from '../../models/StoryArc';
import { StoryArcService } from '../../services/storyArc.service';
import { EntityType } from '../../models/EntityType';
import { getCampaignIdFromParams } from '../../utils/routeUtils';
import { buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * Global Story Arc List Page
 * Displays a list of all story arcs across all worlds
 */
export function StoryArcListPage() {
  // State
  const [storyArcs, setStoryArcs] = useState<StoryArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  const navigate = useNavigate();
  const location = useLocation();

  // Get params at the component level
  const params = useParams();
  const campaignId = getCampaignIdFromParams(params);

  // Fetch story arcs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use empty string for worldId to get global story arcs
        const worldId = '';

        // Get story arcs
        const storyArcService = StoryArcService.getInstance(worldId, campaignId);
        const allStoryArcs = await storyArcService.listEntities();
        setStoryArcs(allStoryArcs);
      } catch (err) {
        console.error('Error fetching story arcs:', err);
        setError('Failed to load story arcs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  // Filter story arcs based on search, type, and status
  const filteredStoryArcs = storyArcs.filter(storyArc => {
    const matchesSearch = searchQuery === '' ||
      (storyArc.name && storyArc.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = !selectedType ||
      (storyArc.arcType === selectedType);

    const matchesStatus = !selectedStatus ||
      (storyArc.status === selectedStatus);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle create story arc
  const handleCreateStoryArc = () => {
    navigate('/story-arcs/new');
  };

  // Handle view story arc
  const handleViewStoryArc = (storyArcId: string) => {
    navigate(`/story-arcs/${storyArcId}`);
  };

  // Handle edit story arc
  const handleEditStoryArc = (event: React.MouseEvent, storyArcId: string) => {
    event.stopPropagation();
    navigate(`/story-arcs/${storyArcId}/edit`);
  };

  // Handle delete story arc
  const handleDeleteStoryArc = async (event: React.MouseEvent, storyArcId: string) => {
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this story arc?')) {
      try {
        // Use empty string for worldId to delete from global story arcs
        const worldId = '';

        const storyArcService = StoryArcService.getInstance(worldId, campaignId);
        await storyArcService.delete(storyArcId);

        // Update local state
        setStoryArcs(storyArcs.filter(a => a.id !== storyArcId));

        notifications.show({
          title: 'Story Arc Deleted',
          message: 'The story arc has been deleted successfully',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting story arc:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete story arc. Please try again.',
          color: 'red',
        });
      }
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Story Arcs', href: '/story-arcs' },
  ];

  // Show loading state
  if (loading && storyArcs.length === 0) {
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
  if (error && storyArcs.length === 0) {
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
          <Title order={1}>All Story Arcs</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateStoryArc}
          >
            Create Story Arc
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
            placeholder="Search story arcs..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: StoryArcType.MAIN_PLOT, label: 'Main Plot' },
              { value: StoryArcType.SIDE_QUEST, label: 'Side Quest' },
              { value: StoryArcType.CHARACTER_ARC, label: 'Character Arc' },
              { value: StoryArcType.BACKGROUND_PLOT, label: 'Background Plot' },
              { value: StoryArcType.FACTION_ARC, label: 'Faction Arc' },
              { value: StoryArcType.LOCATION_ARC, label: 'Location Arc' },
              { value: StoryArcType.ITEM_ARC, label: 'Item Arc' },
              { value: StoryArcType.OTHER, label: 'Other' }
            ]}
            value={selectedType}
            onChange={setSelectedType}
            leftSection={<IconFilter size="1rem" />}
            clearable
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All Statuses' },
              { value: StoryArcStatus.UPCOMING, label: 'Upcoming' },
              { value: StoryArcStatus.ONGOING, label: 'Ongoing' },
              { value: StoryArcStatus.PAUSED, label: 'Paused' },
              { value: StoryArcStatus.COMPLETED, label: 'Completed' },
              { value: StoryArcStatus.FAILED, label: 'Failed' },
              { value: StoryArcStatus.ABANDONED, label: 'Abandoned' }
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

        {/* Story Arcs List */}
        {filteredStoryArcs.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconBook size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No story arcs found. Create your first story arc to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateStoryArc}
              >
                Create Story Arc
              </Button>
            </Stack>
          </Paper>
        ) : viewMode === 'table' ? (
          <Table striped highlightOnHover tabularNums stickyHeader stickyHeaderOffset={60}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Importance</Table.Th>
                <Table.Th>World</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredStoryArcs.map((storyArc) => (
                <Table.Tr
                  key={storyArc.id}
                  onClick={() => handleViewStoryArc(storyArc.id!)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        src={storyArc.imageURL}
                        radius="xl"
                        size="sm"
                        color={getStoryArcTypeColor(storyArc.arcType)}
                      >
                        {storyArc.name ? storyArc.name.charAt(0) : 'S'}
                      </Avatar>
                      {storyArc.name}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStoryArcTypeColor(storyArc.arcType)}>
                      {formatStoryArcType(storyArc.arcType)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStoryArcStatusColor(storyArc.status)}>
                      {formatStoryArcStatus(storyArc.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {storyArc.importance ? (
                      <Group gap="xs">
                        <Text size="sm">{storyArc.importance}/10</Text>
                        <Progress
                          value={storyArc.importance * 10}
                          size="sm"
                          style={{ width: 60 }}
                          color={getImportanceColor(storyArc.importance)}
                        />
                      </Group>
                    ) : (
                      'N/A'
                    )}
                  </Table.Td>
                  <Table.Td>{storyArc.worldId || 'Unknown'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStoryArc(storyArc.id!);
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
                            onClick={(e) => handleEditStoryArc(e, storyArc.id!)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => handleDeleteStoryArc(e, storyArc.id!)}
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
            {filteredStoryArcs.map((storyArc) => (
              <Card
                key={storyArc.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => handleViewStoryArc(storyArc.id!)}
                style={{ cursor: 'pointer' }}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{storyArc.name}</Text>
                  <Badge color={getStoryArcTypeColor(storyArc.arcType)}>
                    {formatStoryArcType(storyArc.arcType)}
                  </Badge>
                </Group>

                <Badge color={getStoryArcStatusColor(storyArc.status)} mb="md">
                  {formatStoryArcStatus(storyArc.status)}
                </Badge>

                <Text size="sm" c="dimmed" mb="md">
                  {truncateText(storyArc.description, 80)}
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
                        onClick={(e) => handleEditStoryArc(e, storyArc.id!)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => handleDeleteStoryArc(e, storyArc.id!)}
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

// Helper function to get color based on story arc type
function getStoryArcTypeColor(arcType: string): string {
  switch (arcType) {
    case StoryArcType.MAIN_PLOT: return 'red';
    case StoryArcType.SIDE_QUEST: return 'blue';
    case StoryArcType.CHARACTER_ARC: return 'green';
    case StoryArcType.BACKGROUND_PLOT: return 'gray';
    case StoryArcType.FACTION_ARC: return 'indigo';
    case StoryArcType.LOCATION_ARC: return 'teal';
    case StoryArcType.ITEM_ARC: return 'orange';
    default: return 'gray';
  }
}

// Helper function to get color based on story arc status
function getStoryArcStatusColor(status: string): string {
  switch (status) {
    case StoryArcStatus.UPCOMING: return 'blue';
    case StoryArcStatus.ONGOING: return 'green';
    case StoryArcStatus.PAUSED: return 'yellow';
    case StoryArcStatus.COMPLETED: return 'teal';
    case StoryArcStatus.FAILED: return 'red';
    case StoryArcStatus.ABANDONED: return 'gray';
    default: return 'gray';
  }
}

// Helper function to get color based on importance
function getImportanceColor(importance: number): string {
  if (importance >= 8) return 'red';
  if (importance >= 6) return 'orange';
  if (importance >= 4) return 'yellow';
  if (importance >= 2) return 'blue';
  return 'gray';
}

// Helper function to format story arc type
function formatStoryArcType(arcType: string): string {
  switch (arcType) {
    case StoryArcType.MAIN_PLOT: return 'Main Plot';
    case StoryArcType.SIDE_QUEST: return 'Side Quest';
    case StoryArcType.CHARACTER_ARC: return 'Character Arc';
    case StoryArcType.BACKGROUND_PLOT: return 'Background Plot';
    case StoryArcType.FACTION_ARC: return 'Faction Arc';
    case StoryArcType.LOCATION_ARC: return 'Location Arc';
    case StoryArcType.ITEM_ARC: return 'Item Arc';
    default: return 'Other';
  }
}

// Helper function to format story arc status
function formatStoryArcStatus(status: string): string {
  switch (status) {
    case StoryArcStatus.UPCOMING: return 'Upcoming';
    case StoryArcStatus.ONGOING: return 'Ongoing';
    case StoryArcStatus.PAUSED: return 'Paused';
    case StoryArcStatus.COMPLETED: return 'Completed';
    case StoryArcStatus.FAILED: return 'Failed';
    case StoryArcStatus.ABANDONED: return 'Abandoned';
    default: return 'Unknown';
  }
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

export default StoryArcListPage;
