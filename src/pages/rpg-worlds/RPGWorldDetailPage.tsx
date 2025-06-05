import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Breadcrumbs,
  Anchor,
  Stack,
  Alert,
  Skeleton
} from '@mantine/core';
import {
  IconAlertCircle
} from '@tabler/icons-react';
import { RPGWorldDetail } from '../../components/rpg-world/RPGWorldDetail';
import { RPGWorld, RPGWorldPrivacy } from '../../models/RPGWorld'; // Added RPGWorldPrivacy
import { RPGWorldService } from '../../services/rpgWorld.service';
// Removed MockDataService import
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * RPG World Detail Page
 */
export function RPGWorldDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { worldId } = useParams<{ worldId: string }>();
  const { currentUser } = useAuth();
  const rpgWorldService = useMemo(() => new RPGWorldService(), []);

  // State
  const [world, setWorld] = useState<RPGWorld | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch RPG World
  useEffect(() => {
    const fetchWorld = async () => {
      if (!worldId) {
        setError('No world ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Always use real data from Firestore
      try {
        // Get world with campaigns
        const result = await rpgWorldService.getWorldWithCampaigns(worldId);
        setWorld(result);
        setCampaigns(result.campaigns || []);
      } catch (err) {
        console.error('Error fetching RPG World:', err);
        setError('Failed to load RPG World. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorld();
  }, [worldId, currentUser, rpgWorldService]); // Added currentUser and rpgWorldService as dependencies

  // Handle edit world
  const handleEditWorld = () => {
    navigate(`/rpg-worlds/${worldId}/edit`);
  };

  // Handle delete world
  const handleDeleteWorld = async () => {
    if (!worldId) return;

    try {
      await rpgWorldService.delete(worldId);

      // Show success notification
      notifications.show({
        title: 'RPG World Deleted',
        message: `${world?.name} has been deleted successfully`,
        color: 'green',
      });

      // Navigate back to worlds list
      navigate('/rpg-worlds');
    } catch (error) {
      console.error('Error deleting RPG World:', error);
      setError('Failed to delete RPG World. Please try again.');
    }
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'planning': return 'yellow';
      case 'paused': return 'orange';
      case 'abandoned': return 'red';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };

  // Handle create campaign
  const handleCreateCampaign = () => {
    navigate(`/rpg-worlds/${worldId}/campaigns/new`);
  };

  // Handle view campaign
  const handleViewCampaign = (campaignId: string) => {
    navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}`);
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', href: '/' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: world?.name || 'Loading...', href: `/rpg-worlds/${worldId}` }
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
          <Skeleton height={300} radius="md" />
          <Skeleton height={100} radius="md" />
          <Skeleton height={200} radius="md" />
        </Stack>
      </Container>
    );
  }

  // Show error state
  if (error || !world) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.slice(0, 2).map((item, index) => (
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
            {error || 'RPG World not found'}
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

        {/* World Overview - Always Visible */}

        <RPGWorldDetail
          world={world}
          campaigns={campaigns}
          onEditWorld={handleEditWorld}
          onDeleteWorld={handleDeleteWorld}
          onCreateCampaign={handleCreateCampaign}
        />
      </Stack>
    </Container>
  );
}

export default RPGWorldDetailPage;