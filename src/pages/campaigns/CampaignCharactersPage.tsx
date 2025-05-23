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
import { CampaignCharacters } from '../../components/campaign/CampaignCharacters';
import { Campaign } from '../../models/Campaign';
import { CampaignService } from '../../services/campaign.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { CharacterService } from '../../services/character.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * Campaign Characters Page
 */
export function CampaignCharactersPage() {
  const navigate = useNavigate();
  const { worldId, campaignId } = useParams<{ worldId?: string; campaignId: string }>();
  const { currentUser } = useAuth();
  const campaignService = new CampaignService();
  const rpgWorldService = new RPGWorldService();
  // Initialize character service when campaign is loaded
  const [characterService, setCharacterService] = useState<CharacterService | null>(null);

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Campaign and Characters
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
        setCharacters(result.characters || []);

        // Initialize character service
        if (result.worldId) {
          setCharacterService(CharacterService.getInstance(result.worldId, campaignId));

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

  // Handle create character
  const handleCreateCharacter = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/new`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/new`);
    }
  };

  // Handle view character
  const handleViewCharacter = (characterId: string) => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/${characterId}`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/${characterId}`);
    }
  };

  // Handle edit character
  const handleEditCharacter = (characterId: string) => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/${characterId}/edit`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/${characterId}/edit`);
    }
  };

  // Handle delete character
  const handleDeleteCharacter = async (characterId: string) => {
    if (!characterService) {
      notifications.show({
        title: 'Error',
        message: 'Character service not initialized. Please try again.',
        color: 'red',
      });
      return;
    }

    try {
      await characterService.delete(characterId);

      // Update the characters list
      setCharacters(characters.filter(character => character.id !== characterId));

      // Update campaign character count
      if (campaign) {
        const updatedCampaign = { ...campaign };
        updatedCampaign.characterCount = (updatedCampaign.characterCount || 0) - 1;
        setCampaign(updatedCampaign);

        // Update in database
        if (campaignId) {
          await campaignService.update(campaignId, {
            characterCount: updatedCampaign.characterCount
          });
        }
      }

      notifications.show({
        title: 'Character Deleted',
        message: 'Character has been deleted successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting character:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete character. Please try again.',
        color: 'red',
      });
    }
  };

  // Breadcrumb items
  const breadcrumbItems = worldId
    ? [
        { title: 'Home', href: '/' },
        { title: 'RPG Worlds', href: '/rpg-worlds' },
        { title: worldName || 'World', href: `/rpg-worlds/${worldId}` },
        { title: campaign?.name || 'Campaign', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}` },
        { title: 'Characters', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}/characters` }
      ]
    : [
        { title: 'Home', href: '/' },
        { title: 'Campaigns', href: '/campaigns' },
        { title: campaign?.name || 'Campaign', href: `/campaigns/${campaignId}` },
        { title: 'Characters', href: `/campaigns/${campaignId}/characters` }
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

        {/* Characters Component */}
        <CampaignCharacters
          campaignId={campaignId || ''}
          worldId={worldId || ''}
          characters={characters}
          loading={loading}
          error={error}
          onCreateCharacter={handleCreateCharacter}
          onViewCharacter={handleViewCharacter}
          onEditCharacter={handleEditCharacter}
          onDeleteCharacter={handleDeleteCharacter}
        />
      </Stack>
    </Container>
  );
}

export default CampaignCharactersPage;
