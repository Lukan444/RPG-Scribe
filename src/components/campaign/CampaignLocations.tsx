import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Tabs,
  Stack,
  SegmentedControl,
  rem,
  Center,
  ThemeIcon,
  Loader
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { keyframes } from '@emotion/react';
import {
  IconPlus,
  IconMap,
  IconLayoutGrid,
  IconTable,
  IconArticle,
  IconMapPin
} from '@tabler/icons-react';
import { EntityCardGrid } from '../common/EntityCardGrid';
import { EntityTable } from '../common/EntityTable';
import { EntityRelationshipsService } from '../../services/entityRelationships.service';
import { EntityType } from '../../models/EntityType';
import { Badge } from '@mantine/core';
import { RelationshipCounter } from '../relationships/RelationshipCounter';

// Define the keyframes for the pulsing animation
const pulseAnimation = keyframes({
  '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
  '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' },
});

// Location interface (simplified)
interface Location {
  id: string;
  name: string;
  locationType: string;
  description?: string;
  imageURL?: string;
  updatedAt?: Date;
}

interface CampaignLocationsProps {
  campaignId: string;
  worldId?: string;
  locations?: Location[];
  loading?: boolean;
  error?: string | null;
  onCreateLocation?: () => void;
  onViewLocation?: (locationId: string) => void;
  onEditLocation?: (locationId: string) => void;
  onDeleteLocation?: (locationId: string) => void;
}

/**
 * CampaignLocations component - Enhanced location management for campaigns
 */
export function CampaignLocations({
  campaignId,
  worldId,
  locations = [],
  loading = false,
  error = null,
  onCreateLocation,
  onViewLocation,
  onEditLocation,
  onDeleteLocation
}: CampaignLocationsProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<string>('grid');
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [locationsWithRelationships, setLocationsWithRelationships] = useState<Array<Location & { relationshipCount?: number }>>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  // Load relationship counts for locations
  useEffect(() => {
    const loadRelationshipCounts = async () => {
      if (locations.length === 0) return;

      setLoadingRelationships(true);
      try {
        const relationshipService = new EntityRelationshipsService(campaignId, worldId || '');

        const withRelationships = await Promise.all(
          locations.map(async (location) => {
            try {
              const relationships = await relationshipService.getEntityRelationships(
                location.id,
                EntityType.LOCATION
              );
              return {
                ...location,
                relationshipCount: relationships.length
              };
            } catch (error) {
              console.error(`Error loading relationships for location ${location.id}:`, error);
              return {
                ...location,
                relationshipCount: 0
              };
            }
          })
        );

        setLocationsWithRelationships(withRelationships);
      } catch (error) {
        console.error('Error loading relationship counts:', error);
        setLocationsWithRelationships(locations.map(location => ({
          ...location,
          relationshipCount: 0
        })));
      } finally {
        setLoadingRelationships(false);
      }
    };

    loadRelationshipCounts();
  }, [locations, campaignId, worldId]);

  // Filter locations based on active tab
  const filteredLocations = locationsWithRelationships.filter(location => {
    if (activeTab === 'all') return true;
    if (activeTab === 'settlement') return location.locationType === 'Settlement';
    if (activeTab === 'dungeon') return location.locationType === 'Dungeon';
    if (activeTab === 'wilderness') return location.locationType === 'Wilderness';
    return true;
  });

  // Handle create location
  const handleCreateLocation = () => {
    if (onCreateLocation) {
      onCreateLocation();
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/new`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/new`);
    }
  };

  // Handle view location
  const handleViewLocation = (locationId: string) => {
    if (onViewLocation) {
      onViewLocation(locationId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/${locationId}`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/${locationId}`);
    }
  };

  // Handle edit location
  const handleEditLocation = (locationId: string) => {
    if (onEditLocation) {
      onEditLocation(locationId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/${locationId}/edit`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/${locationId}/edit`);
    }
  };

  // Handle delete location
  const handleDeleteLocation = (locationId: string) => {
    if (onDeleteLocation) {
      onDeleteLocation(locationId);
    } else {
      // Find the location by ID
      const location = locations.find(l => l.id === locationId);

      if (location) {
        // Show confirmation dialog
        modals.openConfirmModal({
          title: 'Delete Location',
          children: (
            <Text size="sm">
              Are you sure you want to delete {location.name}? This action cannot be undone.
            </Text>
          ),
          labels: { confirm: 'Delete', cancel: 'Cancel' },
          confirmProps: { color: 'red' },
          onConfirm: () => {
            // Delete location
            // This would call the API to delete the location
            console.log('Delete location:', locationId);
          },
        });
      }
    }
  };

  // Render location badge
  const renderLocationBadge = (location: Location & { relationshipCount?: number }) => (
    <Group gap="xs">
      <Badge color="blue">
        {location.locationType}
      </Badge>
      <RelationshipCounter
        entityId={location.id}
        entityType={EntityType.LOCATION}
        count={location.relationshipCount}
        worldId={worldId}
        campaignId={campaignId}
        size="xs"
      />
    </Group>
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (location: Location) => (
        <Group gap="sm">
          <Text fw={500}>{location.name}</Text>
        </Group>
      )
    },
    {
      key: 'locationType',
      title: 'Type',
      sortable: true,
      render: (location: Location) => (
        <Badge color="blue">
          {location.locationType}
        </Badge>
      )
    },
    {
      key: 'relationships',
      title: 'Relationships',
      sortable: false,
      render: (location: Location & { relationshipCount?: number }) => (
        <RelationshipCounter
          entityId={location.id}
          entityType={EntityType.LOCATION}
          count={location.relationshipCount}
          worldId={worldId}
          campaignId={campaignId}
          size="sm"
        />
      )
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      render: (location: Location) => (
        <Text size="sm" lineClamp={2}>
          {location.description || 'No description available'}
        </Text>
      )
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (location: Location) => (
        <Text size="sm">
          {location.updatedAt ? location.updatedAt.toLocaleDateString() : 'N/A'}
        </Text>
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'locationType',
      label: 'Location Type',
      options: [
        { value: 'Settlement', label: 'Settlement' },
        { value: 'Dungeon', label: 'Dungeon' },
        { value: 'Wilderness', label: 'Wilderness' },
        { value: 'Building', label: 'Building' },
        { value: 'Landmark', label: 'Landmark' }
      ]
    }
  ];

  // Render empty state
  const renderEmptyState = () => (
    <Center py={50}>
      <Stack align="center" gap="md">
        <ThemeIcon size={60} radius={30} color="gray.3">
          <IconMapPin style={{ width: '30px', height: '30px', color: 'var(--mantine-color-gray-6)' }} />
        </ThemeIcon>
        <Title order={3}>No Locations</Title>
        <Text c="dimmed">Create your first location to build your campaign world</Text>
        <Button
          leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
          onClick={handleCreateLocation}
          style={{
            animation: `${pulseAnimation} 2s infinite`,
            transition: 'all 0.3s ease',
            '&:hover': {
              animation: 'none',
              transform: 'scale(1.05)'
            }
          }}
        >
          Create Location
        </Button>
      </Stack>
    </Center>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Locations</Title>
        <Group>
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            data={[
              {
                value: 'grid',
                label: (
                  <Group gap={5}>
                    <IconLayoutGrid size={16} />
                    <Box>Grid</Box>
                  </Group>
                ),
              },
              {
                value: 'table',
                label: (
                  <Group gap={5}>
                    <IconTable size={16} />
                    <Box>Table</Box>
                  </Group>
                ),
              },
              {
                value: 'article',
                label: (
                  <Group gap={5}>
                    <IconArticle size={16} />
                    <Box>Article</Box>
                  </Group>
                ),
              },
            ]}
          />
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateLocation}
          >
            Create Location
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="all">All Locations</Tabs.Tab>
          <Tabs.Tab value="settlement">Settlements</Tabs.Tab>
          <Tabs.Tab value="dungeon">Dungeons</Tabs.Tab>
          <Tabs.Tab value="wilderness">Wilderness</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {loading || loadingRelationships ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading locations...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius={30} color="red.3">
              <IconMapPin style={{ width: '30px', height: '30px', color: 'var(--mantine-color-red-6)' }} />
            </ThemeIcon>
            <Title order={3}>Error Loading Locations</Title>
            <Text c="dimmed">{error}</Text>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Stack>
        </Center>
      ) : filteredLocations.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {viewMode === 'grid' && (
            <EntityCardGrid
              data={filteredLocations}
              entityType={EntityType.LOCATION}
              loading={loading || loadingRelationships}
              error={error || null}
              onView={handleViewLocation}
              onEdit={handleEditLocation}
              onDelete={handleDeleteLocation}
              renderBadge={renderLocationBadge}
              filterOptions={filterOptions}
            />
          )}

          {viewMode === 'table' && (
            <EntityTable
              data={filteredLocations}
              columns={columns}
              entityType={EntityType.LOCATION}
              loading={loading || loadingRelationships}
              error={error || null}
              onView={handleViewLocation}
              onEdit={handleEditLocation}
              onDelete={handleDeleteLocation}
              filterOptions={filterOptions}
            />
          )}

          {viewMode === 'article' && (
            <Box>
              <Text c="dimmed">Article view will be implemented in the next phase.</Text>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}

export default CampaignLocations;
