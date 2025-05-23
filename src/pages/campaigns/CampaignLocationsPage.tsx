import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Breadcrumbs,
  Anchor,
  Stack,
  Alert,
  Skeleton,
  Group,
  Button,
  SimpleGrid,
  Card,
  Image,
  Badge,
  rem
} from '@mantine/core';
import { IconAlertCircle, IconPlus, IconMap } from '@tabler/icons-react';
import { Campaign } from '../../models/Campaign';
import { CampaignService } from '../../services/campaign.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { LocationService } from '../../services/location.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import { EntityCardGrid } from '../../components/common/EntityCardGrid';
import { EntityTable } from '../../components/common/EntityTable';
import { EntityType } from '../../models/EntityType';

/**
 * Campaign Locations Page
 */
export function CampaignLocationsPage() {
  const navigate = useNavigate();
  const { worldId, campaignId } = useParams<{ worldId?: string; campaignId: string }>();
  const { currentUser } = useAuth();
  const campaignService = new CampaignService();
  const rpgWorldService = new RPGWorldService();
  // Initialize location service when campaign is loaded
  const [locationService, setLocationService] = useState<LocationService | null>(null);

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('grid');

  // Fetch Campaign and Locations
  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) {
        setError('No campaign ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get campaign with related entities
        const result = await campaignService.getCampaignWithRelatedEntities(campaignId);

        setCampaign(result);
        setLocations(result.locations || []);

        // Initialize location service
        if (result.worldId) {
          setLocationService(LocationService.getInstance(result.worldId, campaignId));

          // Get world name
          const world = await rpgWorldService.getById(result.worldId);
          if (world) {
            setWorldName(world.name);
          }
        }
      } catch (error) {
        console.error('Error fetching Campaign data:', error);
        setError('Failed to load Campaign data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  // Handle create location
  const handleCreateLocation = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/new`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/new`);
    }
  };

  // Handle view location
  const handleViewLocation = (location: any) => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/${location.id}`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/${location.id}`);
    }
  };

  // Handle edit location
  const handleEditLocation = (location: any) => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/${location.id}/edit`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/${location.id}/edit`);
    }
  };

  // Handle delete location
  const handleDeleteLocation = async (location: any) => {
    if (!locationService) {
      notifications.show({
        title: 'Error',
        message: 'Location service not initialized. Please try again.',
        color: 'red',
      });
      return;
    }

    try {
      await locationService.delete(location.id);

      // Update the locations list
      setLocations(locations.filter(loc => loc.id !== location.id));

      // Update campaign location count
      if (campaign) {
        const updatedCampaign = { ...campaign };
        updatedCampaign.locationCount = (updatedCampaign.locationCount || 0) - 1;
        setCampaign(updatedCampaign);

        // Update in database
        if (campaignId) {
          await campaignService.update(campaignId, {
            locationCount: updatedCampaign.locationCount
          });
        }
      }

      notifications.show({
        title: 'Location Deleted',
        message: 'Location has been deleted successfully',
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
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (location: any) => (
        <Group gap="sm">
          <Text fw={500}>{location.name}</Text>
        </Group>
      )
    },
    {
      key: 'locationType',
      title: 'Type',
      sortable: true,
      render: (location: any) => (
        <Badge color="blue">
          {location.locationType}
        </Badge>
      )
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      render: (location: any) => (
        <Text lineClamp={2}>{location.description}</Text>
      )
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (location: any) => (
        <Text size="sm">
          {location.updatedAt ? new Date(location.updatedAt).toLocaleDateString() : 'N/A'}
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

  // Breadcrumb items
  const breadcrumbItems = worldId
    ? [
        { title: 'Home', href: '/' },
        { title: 'RPG Worlds', href: '/rpg-worlds' },
        { title: worldName || 'World', href: `/rpg-worlds/${worldId}` },
        { title: campaign?.name || 'Campaign', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}` },
        { title: 'Locations', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}/locations` }
      ]
    : [
        { title: 'Home', href: '/' },
        { title: 'Campaigns', href: '/campaigns' },
        { title: campaign?.name || 'Campaign', href: `/campaigns/${campaignId}` },
        { title: 'Locations', href: `/campaigns/${campaignId}/locations` }
      ];

  // Show loading state
  if (loading) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.map((item, index) => (
              <Skeleton key={index} height={20} width={80} radius="xl" />
            ))}
          </Breadcrumbs>
          <Skeleton height={50} radius="md" />
          <Skeleton height={400} radius="md" />
        </Stack>
      </Container>
    );
  }

  // Show error state
  if (error || !campaign) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.slice(0, breadcrumbItems.length - 1).map((item, index) => (
              <Anchor
                key={index}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(item.href);
                }}
              >
                {item.title}
              </Anchor>
            ))}
          </Breadcrumbs>
          <Title>Error</Title>
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error || 'Campaign not found'}
          </Alert>
        </Stack>
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
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.href);
              }}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Locations */}
        <Group justify="space-between" mb="md">
          <Title order={3}>Locations</Title>
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateLocation}
          >
            Create Location
          </Button>
        </Group>

        {viewMode === 'grid' && (
          <EntityCardGrid
            data={locations}
            entityType={EntityType.LOCATION}
            loading={loading}
            error={error}
            onView={handleViewLocation}
            onEdit={handleEditLocation}
            onDelete={handleDeleteLocation}
            filterOptions={filterOptions}
          />
        )}

        {viewMode === 'table' && (
          <EntityTable
            data={locations}
            columns={columns}
            entityType={EntityType.LOCATION}
            loading={loading}
            error={error}
            onView={handleViewLocation}
            onEdit={handleEditLocation}
            onDelete={handleDeleteLocation}
            filterOptions={filterOptions}
          />
        )}
      </Stack>
    </Container>
  );
}

export default CampaignLocationsPage;
