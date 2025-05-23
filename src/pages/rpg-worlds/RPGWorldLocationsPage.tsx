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
  IconMap
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { LocationService } from '../../services/location.service';
import { Location, LocationType } from '../../models/Location';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * RPG World Locations Page
 * Displays locations specific to a world with filtering, table/grid views,
 * and CRUD operations
 *
 * @returns JSX.Element - The rendered component
 */
export function RPGWorldLocationsPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { worldId = '' } = useParams<{ worldId: string }>();
  const { currentUser } = useAuth();

  /**
   * Component state
   */
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  // Get all params at the component level
  const params = useParams();

  /**
   * Fetch world name and locations when worldId changes
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

        // Get locations for this world
        const locationService = LocationService.getInstance(currentWorldId, campaignId);
        const worldLocations = await locationService.listEntities();
        // Add entityType to each location
        setLocations(worldLocations.map(location => ({
          ...location,
          entityType: EntityType.LOCATION,
          locationType: location.locationType || location.type || 'Other'
        })));
      } catch (err) {
        console.error('Error fetching world locations:', err);
        setError('Failed to load locations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId, params]);

  /**
   * Filter locations based on search query and selected type
   */
  const filteredLocations = locations.filter(location => {
    const matchesSearch: boolean = searchQuery === '' ||
      (location.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType: boolean = !selectedType ||
      (location.locationType === selectedType);

    return matchesSearch && matchesType;
  });

  /**
   * Handle create location navigation
   */
  const handleCreateLocation = (): void => {
    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'locations', undefined, 'new'));
  };

  /**
   * Handle view location navigation
   * @param locationId Location ID
   */
  const handleViewLocation = (locationId: string): void => {
    if (!locationId) {
      console.error('Location ID is undefined');
      return;
    }

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'locations', locationId));
  };

  /**
   * Handle edit location navigation
   * @param event Mouse event
   * @param locationId Location ID
   */
  const handleEditLocation = (event: React.MouseEvent, locationId: string): void => {
    if (!locationId) {
      console.error('Location ID is undefined');
      return;
    }
    event.stopPropagation();

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'locations', locationId, 'edit'));
  };

  /**
   * Handle location deletion
   * @param event Mouse event
   * @param locationId Location ID
   */
  const handleDeleteLocation = async (event: React.MouseEvent, locationId: string): Promise<void> => {
    if (!locationId) {
      console.error('Location ID is undefined');
      return;
    }
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this location?')) {
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

        const locationService = LocationService.getInstance(currentWorldId, campaignId);
        await locationService.delete(locationId);

        // Update local state
        setLocations(locations.filter(l => l.id !== locationId));

        notifications.show({
          title: 'Location Deleted',
          message: 'The location has been deleted successfully',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting location:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete location. Please try again.',
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
    { title: 'Locations', href: buildEntityRoutePath(worldId, 'locations') },
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
          <Title order={1}>Locations in {worldName}</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateLocation}
          >
            Create Location
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
            placeholder="Search locations..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: 'Settlement', label: 'Settlement' },
              { value: 'Dungeon', label: 'Dungeon' },
              { value: 'Wilderness', label: 'Wilderness' },
              { value: 'Building', label: 'Building' },
              { value: 'Landmark', label: 'Landmark' },
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

        {/* Locations List */}
        {filteredLocations.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconMap size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No locations found. Create your first location to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateLocation}
              >
                Create Location
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
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredLocations.map((loc) => (
                <Table.Tr
                  key={loc.id}
                  onClick={() => loc.id && handleViewLocation(loc.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        src={loc.imageURL}
                        radius="xl"
                        size="sm"
                      />
                      {loc.name}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getLocationTypeColor(loc.locationType)}>
                      {loc.locationType}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{truncateText(loc.description, 50)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          loc.id && handleViewLocation(loc.id);
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
                            onClick={(e) => loc.id && handleEditLocation(e, loc.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => loc.id && handleDeleteLocation(e, loc.id)}
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
            {filteredLocations.map((loc) => (
              <Card
                key={loc.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => loc.id && handleViewLocation(loc.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Section>
                  <Image
                    src={loc.imageURL || 'https://placehold.co/600x400?text=Location'}
                    height={160}
                    alt={loc.name}
                  />
                </Card.Section>

                <Group justify="space-between" mt="md">
                  <Text fw={500}>{loc.name}</Text>
                  <Badge color={getLocationTypeColor(loc.locationType)}>
                    {loc.locationType}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" mt="xs">
                  {truncateText(loc.description, 100)}
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
                        onClick={(e) => loc.id && handleEditLocation(e, loc.id)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => loc.id && handleDeleteLocation(e, loc.id)}
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
 * Get color based on location type
 * @param locationType Type of location
 * @returns Color string for Mantine components
 */
function getLocationTypeColor(locationType: string): string {
  switch (locationType) {
    case 'Settlement': return 'blue';
    case 'Dungeon': return 'red';
    case 'Wilderness': return 'green';
    case 'Building': return 'yellow';
    case 'Landmark': return 'violet';
    default: return 'gray';
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

export default RPGWorldLocationsPage;
