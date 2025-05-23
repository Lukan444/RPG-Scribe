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
  IconMapPin,
  IconList,
  IconLayoutGrid,
  IconArticle,
  IconPlus,
  IconMap,
  IconGripVertical,
  IconBuilding,
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
import { LocationService, Location } from '../../services/location.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * LocationListPage component - Displays a list of locations with various view options
 *
 * Uses the LocationService to fetch location data from Firestore
 * Provides table, grid, and article views for locations
 * Supports filtering, sorting, and CRUD operations
 */
export function LocationListPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('table');
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);
  const [fromPath, setFromPath] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

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

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);

        // Use worldFilter if available, otherwise use empty string for global view
        const worldId = worldFilter || '';
        const campaignId = getCampaignIdFromParams(undefined);

        // Create location service - it will handle empty worldId internally
        const locationService = LocationService.getInstance(worldId, campaignId);
        const locationsData = await locationService.listEntities();

        // If worldFilter is set, add a note to the UI
        if (worldFilter) {
          console.log(`Filtering locations for world: ${worldFilter}`);
        }

        setLocations(locationsData);
      } catch (err) {
        console.error('Error loading locations:', err);
        setError('Failed to load locations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [worldFilter]);

  // Handle view location
  const handleViewLocation = (location: Location) => {
    if (!location.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'locations', location.id));
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/locations/${location.id}`);
    }
  };

  // Handle edit location
  const handleEditLocation = (location: Location) => {
    if (!location.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'locations', location.id, 'edit'));
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/locations/${location.id}/edit`);
    }
  };

  // Handle delete location
  const handleDeleteLocation = (location: Location) => {
    setLocationToDelete(location);
    openConfirmDelete();
  };

  // Confirm delete location
  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      setLoading(true);

      // Use worldFilter if available, otherwise use empty string for global view
      const worldId = worldFilter || '';
      const campaignId = getCampaignIdFromParams(undefined);

      const locationService = LocationService.getInstance(worldId, campaignId);
      await locationService.deleteEntity(locationToDelete.id!);

      // Remove from state
      setLocations(prev => prev.filter(c => c.id !== locationToDelete.id));
      closeConfirmDelete();
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle save order
  const handleSaveOrder = (orderedLocations: Location[]) => {
    setLocations(orderedLocations);
    // In a real implementation, we would save the order to the database
  };

  // Render location badge
  const renderLocationBadge = (location: Location) => (
    <Group gap={5}>
      <Badge color={getLocationTypeColor(location.locationType)}>
        {location.locationType}
      </Badge>
    </Group>
  );

  // Get color for location type
  const getLocationTypeColor = (locationType: string): string => {
    switch (locationType) {
      case 'Settlement':
        return 'blue';
      case 'Dungeon':
        return 'red';
      case 'Wilderness':
        return 'green';
      case 'Building':
        return 'yellow';
      case 'Landmark':
        return 'violet';
      default:
        return 'gray';
    }
  };

  // Filter options
  const filterOptions = [
    { value: 'Settlement', label: 'Settlements' },
    { value: 'Dungeon', label: 'Dungeons' },
    { value: 'Wilderness', label: 'Wilderness' },
    { value: 'Building', label: 'Buildings' },
    { value: 'Landmark', label: 'Landmarks' }
  ];

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (location: Location) => (
        <Group gap="sm">
          <Avatar
            src={location.imageURL}
            radius="xl"
            size="sm"
            alt={location.name}
          >
            <IconMapPin size={16} />
          </Avatar>
          <Text fw={500}>{location.name}</Text>
        </Group>
      )
    },
    {
      key: 'locationType',
      title: 'Type',
      sortable: true,
      render: (location: Location) => (
        <Badge color={getLocationTypeColor(location.locationType)}>
          {location.locationType}
        </Badge>
      )
    },
    {
      key: 'characterCount',
      title: 'Characters',
      sortable: true,
      render: (location: Location) => (
        <Text size="sm">{location.characterCount || 0}</Text>
      )
    },
    {
      key: 'itemCount',
      title: 'Items',
      sortable: true,
      render: (location: Location) => (
        <Text size="sm">{location.itemCount || 0}</Text>
      )
    },
    {
      key: 'relationshipCount',
      title: 'Relationships',
      sortable: true,
      render: (location: Location) => (
        <Text size="sm">{location.relationshipCount || 0}</Text>
      )
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (location: Location) => (
        <Text size="sm">
          {location.updatedAt ? new Date(location.updatedAt.toDate()).toLocaleDateString() : 'N/A'}
        </Text>
      )
    }
  ];

  // Render location item for drag and drop
  const renderLocationItem = (location: Location) => (
    <Group wrap="nowrap">
      <Avatar
        src={location.imageURL}
        radius="xl"
        size="md"
        alt={location.name}
      >
        <IconMapPin size={16} />
      </Avatar>
      <div>
        <Group gap={5}>
          <Text fw={500}>{location.name}</Text>
          <Badge size="xs" color={getLocationTypeColor(location.locationType)}>
            {location.locationType}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">{location.description?.substring(0, 50)}{location.description?.length > 50 ? '...' : ''}</Text>
      </div>
    </Group>
  );

  // If loading
  if (loading && locations.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && locations.length === 0) {
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
              {worldFilter ? 'World Locations' : 'Locations'}
              {worldFilter && <Badge ml="xs" color="blue">Filtered by World</Badge>}
            </Title>
          </Group>

          <Group>
            <EntityActionButton
              entityType={EntityType.LOCATION}
              primaryAction={{
                label: 'Create Location',
                icon: <IconPlus size={16} />,
                onClick: () => {
                  if (worldFilter) {
                    navigate(buildEntityRoutePath(worldFilter, 'locations', undefined, 'new'));
                  } else {
                    navigate('/locations/new');
                  }
                }
              }}
              actions={[
                {
                  label: 'Import Locations',
                  icon: <IconMapPin size={16} />,
                  onClick: () => console.log('Import locations')
                }
              ]}
              groupedActions={[
                {
                  title: 'Generate',
                  actions: [
                    {
                      label: 'Generate Settlement',
                      icon: <IconBuilding size={16} />,
                      onClick: () => console.log('Generate settlement')
                    },
                    {
                      label: 'Generate Dungeon',
                      icon: <IconMap size={16} />,
                      onClick: () => console.log('Generate dungeon')
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
                data={locations}
                columns={columns}
                entityType={EntityType.LOCATION}
                onView={handleViewLocation}
                onEdit={handleEditLocation}
                onDelete={handleDeleteLocation}
                filterOptions={filterOptions}
              />
            )}

            {activeTab === 'grid' && (
              <EntityCardGrid
                data={locations}
                entityType={EntityType.LOCATION}
                onView={handleViewLocation}
                onEdit={handleEditLocation}
                onDelete={handleDeleteLocation}
                filterOptions={filterOptions}
                renderBadge={renderLocationBadge}
              />
            )}

            {activeTab === 'article' && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {locations.map(location => (
                  <ArticleCard
                    key={location.id}
                    id={location.id!}
                    image={location.imageURL}
                    title={location.name}
                    description={location.description || ''}
                    entityType={EntityType.LOCATION}
                    category={location.locationType}
                    onView={() => handleViewLocation(location)}
                    onEdit={() => handleEditLocation(location)}
                    onDelete={() => handleDeleteLocation(location)}
                  />
                ))}
              </SimpleGrid>
            )}

            {activeTab === 'organize' && (
              <DragDropEntityOrganizer
                data={locations}
                entityType={EntityType.LOCATION}
                onSaveOrder={handleSaveOrder}
                onView={handleViewLocation}
                onEdit={handleEditLocation}
                onDelete={handleDeleteLocation}
                renderItem={renderLocationItem}
              />
            )}
          </div>
        </Tabs>
      </Paper>

      {/* Location Stats */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="blue">
              <IconBuilding size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Settlements</Text>
              <Text fw={700} size="xl">{locations.filter(l => l.locationType === 'Settlement').length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="red">
              <IconMap size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Dungeons</Text>
              <Text fw={700} size="xl">{locations.filter(l => l.locationType === 'Dungeon').length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="teal">
              <IconMapPin size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Total Locations</Text>
              <Text fw={700} size="xl">{locations.length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Location"
        message={`Are you sure you want to delete ${locationToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteLocation}
      />
    </Container>
  );
}

export default LocationListPage;
