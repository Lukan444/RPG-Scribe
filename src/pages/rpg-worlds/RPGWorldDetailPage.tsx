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
  Skeleton,
  Tabs,
  rem,
  Group,
  Button,
  Box,
  SimpleGrid,
  Card,
  Badge,
  Image
} from '@mantine/core';
import {
  IconAlertCircle,
  IconWorld,
  IconBook,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconPlus,
  IconClock,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconChevronRight,
  IconUsersGroup,
  IconNote
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
  const [activeTab, setActiveTab] = useState<string | null>('overview');

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

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconWorld style={{ width: '16px', height: '16px' }} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="campaigns" leftSection={<IconBook style={{ width: '16px', height: '16px' }} />}>
              Campaigns
            </Tabs.Tab>
            <Tabs.Tab value="characters" leftSection={<IconUsers style={{ width: '16px', height: '16px' }} />}>
              Characters
            </Tabs.Tab>
            <Tabs.Tab value="locations" leftSection={<IconMap style={{ width: '16px', height: '16px' }} />}>
              Locations
            </Tabs.Tab>
            <Tabs.Tab value="items" leftSection={<IconSword style={{ width: '16px', height: '16px' }} />}>
              Items
            </Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconCalendarEvent style={{ width: '16px', height: '16px' }} />}>
              Events
            </Tabs.Tab>
            <Tabs.Tab value="sessions" leftSection={<IconClock style={{ width: '16px', height: '16px' }} />}>
              Sessions
            </Tabs.Tab>
            <Tabs.Tab value="factions" leftSection={<IconUsersGroup style={{ width: '16px', height: '16px' }} />}>
              Factions
            </Tabs.Tab>
            <Tabs.Tab value="storyArcs" leftSection={<IconBook style={{ width: '16px', height: '16px' }} />}>
              Story Arcs
            </Tabs.Tab>
            <Tabs.Tab value="notes" leftSection={<IconNote style={{ width: '16px', height: '16px' }} />}>
              Notes
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <RPGWorldDetail
              world={world}
              campaigns={campaigns}
              onEditWorld={handleEditWorld}
              onDeleteWorld={handleDeleteWorld}
              onCreateCampaign={handleCreateCampaign}
            />
          </Tabs.Panel>

          <Tabs.Panel value="campaigns" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Campaigns</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={handleCreateCampaign}
              >
                Create Campaign
              </Button>
            </Group>

            {campaigns.length === 0 ? (
              <Box py="xl" ta="center">
                <IconBook style={{ width: '48px', height: '48px' }} color="var(--mantine-color-gray-4)" />
                <Text mt="md" c="dimmed">
                  No campaigns yet. Create your first campaign to get started.
                </Text>
              </Box>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    withBorder
                    padding="lg"
                    radius="md"
                    onClick={() => handleViewCampaign(campaign.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Section>
                      <Image
                        src={campaign.imageURL || 'https://placehold.co/600x400?text=Campaign'}
                        height={160}
                        alt={campaign.name}
                      />
                    </Card.Section>

                    <Group justify="space-between" mt="md">
                      <Text fw={500}>{campaign.name}</Text>
                      {campaign.status && (
                        <Badge color={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      )}
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                      {campaign.description || 'No description available'}
                    </Text>

                    <Group mt="md" gap="xs">
                      {campaign.characterCount > 0 && (
                        <Badge color="teal" variant="light">
                          {campaign.characterCount} {campaign.characterCount === 1 ? 'Character' : 'Characters'}
                        </Badge>
                      )}
                      {campaign.locationCount > 0 && (
                        <Badge color="blue" variant="light">
                          {campaign.locationCount} {campaign.locationCount === 1 ? 'Location' : 'Locations'}
                        </Badge>
                      )}
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="characters" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Characters</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/characters/new`)}
              >
                Create Character
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level character management is being implemented. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/characters', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Characters
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/characters`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Characters
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="locations" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Locations</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/locations/new`)}
              >
                Create Location
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level location management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/locations', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Locations
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/locations`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Locations
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="items" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Items</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/items/new`)}
              >
                Create Item
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level item management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/items', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Items
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/items`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Items
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="events" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Events</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/events/new`)}
              >
                Create Event
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level event management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/events', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Events
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/events`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Events
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="sessions" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Sessions</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/sessions/new`)}
              >
                Create Session
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level session management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/sessions', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Sessions
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/sessions`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Sessions
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="factions" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Factions</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/factions/new`)}
              >
                Create Faction
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level faction management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/factions', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Factions
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/factions`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Factions
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="storyArcs" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Story Arcs</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/story-arcs/new`)}
              >
                Create Story Arc
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level story arc management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/story-arcs', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Story Arcs
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/story-arcs`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Story Arcs
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="notes" pt="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Notes</Title>
              <Button
                leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
                onClick={() => navigate(`/rpg-worlds/${worldId}/notes/new`)}
              >
                Create Note
              </Button>
            </Group>

            <Group mb="xl">
              <Text>World-level note management is now available. You can:</Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => navigate('/notes', {
                  state: {
                    from: location.pathname,
                    worldFilter: worldId
                  }
                })}
              >
                View All Notes
              </Button>
              <Button
                variant="outline"
                color="teal"
                onClick={() => navigate(`/rpg-worlds/${worldId}/notes`, {
                  state: { from: location.pathname }
                })}
              >
                View World-Specific Notes
              </Button>
            </Group>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default RPGWorldDetailPage;