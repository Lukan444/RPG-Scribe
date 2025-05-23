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
  rem
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { CampaignDetail } from '../../components/campaign/CampaignDetail';
import { Campaign } from '../../models/Campaign';
import { CampaignService } from '../../services/campaign.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * Campaign Detail Page
 */
export function CampaignDetailPage() {
  const navigate = useNavigate();
  const { worldId, campaignId } = useParams<{ worldId?: string; campaignId: string }>();
  const { currentUser } = useAuth();
  const campaignService = new CampaignService();
  const rpgWorldService = new RPGWorldService();

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Campaign
  useEffect(() => {
    const fetchCampaign = async () => {
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

        // Process sessions to ensure dates are properly formatted
        const processedSessions = (result.sessions || []).map(session => ({
          ...session,
          // Convert Firestore timestamp to JavaScript Date
          date: session.date && session.date.seconds ? new Date(session.date.seconds * 1000) : undefined,
          createdAt: session.createdAt && session.createdAt.seconds ? new Date(session.createdAt.seconds * 1000) : undefined,
          updatedAt: session.updatedAt && session.updatedAt.seconds ? new Date(session.updatedAt.seconds * 1000) : undefined
        }));
        setSessions(processedSessions);

        // Process characters to include proper date formatting
        const processedCharacters = (result.characters || []).map(character => ({
          ...character,
          createdAt: character.createdAt && character.createdAt.seconds ? new Date(character.createdAt.seconds * 1000) : undefined,
          updatedAt: character.updatedAt && character.updatedAt.seconds ? new Date(character.updatedAt.seconds * 1000) : undefined
        }));
        setCharacters(processedCharacters);

        // Process locations to include proper date formatting
        const processedLocations = (result.locations || []).map(location => ({
          ...location,
          createdAt: location.createdAt && location.createdAt.seconds ? new Date(location.createdAt.seconds * 1000) : undefined,
          updatedAt: location.updatedAt && location.updatedAt.seconds ? new Date(location.updatedAt.seconds * 1000) : undefined
        }));
        setLocations(processedLocations);

        // Get world name
        if (result.worldId) {
          const world = await rpgWorldService.getById(result.worldId);
          if (world) {
            setWorldName(world.name);
          }
        }
      } catch (error) {
        console.error('Error fetching Campaign:', error);
        setError('Failed to load Campaign. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  // Handle edit campaign
  const handleEditCampaign = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/edit`);
    } else {
      navigate(`/campaigns/${campaignId}/edit`);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = async () => {
    if (!campaignId) return;

    try {
      await campaignService.deleteCampaign(campaignId);

      // Show success notification
      notifications.show({
        title: 'Campaign Deleted',
        message: `${campaign?.name} has been deleted successfully`,
        color: 'green',
      });

      // Navigate back to campaigns list or world detail
      if (worldId) {
        navigate(`/rpg-worlds/${worldId}`);
      } else {
        navigate('/campaigns');
      }
    } catch (error) {
      console.error('Error deleting Campaign:', error);
      setError('Failed to delete Campaign. Please try again.');
    }
  };

  // Handle create session
  const handleCreateSession = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/sessions/new`);
    } else {
      navigate(`/campaigns/${campaignId}/sessions/new`);
    }
  };

  // Handle create character
  const handleCreateCharacter = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/new`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/new`);
    }
  };

  // Handle create location
  const handleCreateLocation = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/locations/new`);
    } else {
      navigate(`/campaigns/${campaignId}/locations/new`);
    }
  };

  // Breadcrumb items
  const breadcrumbItems = worldId
    ? [
        { title: 'Home', href: '/' },
        { title: 'RPG Worlds', href: '/rpg-worlds' },
        { title: worldName || 'World', href: `/rpg-worlds/${worldId}` },
        { title: campaign?.name || 'Campaign', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}` }
      ]
    : [
        { title: 'Home', href: '/' },
        { title: 'Campaigns', href: '/campaigns' },
        { title: campaign?.name || 'Campaign', href: `/campaigns/${campaignId}` }
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

        {/* Campaign Detail */}
        <CampaignDetail
          campaign={campaign}
          worldId={worldId}
          sessions={sessions}
          characters={characters}
          locations={locations}
          onEditCampaign={handleEditCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onCreateSession={handleCreateSession}
          onCreateCharacter={handleCreateCharacter}
          onCreateLocation={handleCreateLocation}
        />
      </Stack>
    </Container>
  );
}

export default CampaignDetailPage;