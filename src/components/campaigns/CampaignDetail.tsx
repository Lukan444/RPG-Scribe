import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Tabs,
  Image,
  Badge,
  Paper,
  Grid,
  Stack,
  Divider,
  ActionIcon,
  Menu,
  LoadingOverlay,
  Alert,
  Card,
  Avatar,
  SimpleGrid,
  ThemeIcon,
  Loader
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCalendar,
  IconDeviceGamepad2,
  IconMap,
  IconUsers,
  IconMapPin,
  IconBook,
  IconAlertCircle,
  IconClock,
  IconNote,
  IconSword,
  IconCalendarEvent,
  IconBuildingCastle,
  IconTimeline
} from '@tabler/icons-react';
import { Campaign } from '../../models/Campaign';
import { campaignService } from '../../services/api/campaign.service';
import { EntityType } from '../../models/EntityType';
import { EntityList } from '../common/EntityList';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import CampaignSessions from '../campaign/CampaignSessions';
import CampaignCharacters from '../campaign/CampaignCharacters';
import CampaignLocations from '../campaign/CampaignLocations';
import CampaignNotes from '../campaign/CampaignNotes';
import { EntityCountTooltip } from '../common/EntityCountTooltip';
import { OptimizedEntityCountTooltip } from '../common/OptimizedEntityCountTooltip';
import { useOptimizedEntityCounts } from '../../hooks/useOptimizedEntityCounts';

// Import service classes for campaign-scoped data fetching
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { EventService } from '../../services/event.service';
import { SessionService } from '../../services/session.service';
import { FactionService } from '../../services/faction.service';
import { StoryArcService } from '../../services/storyArc.service';
import { NoteService } from '../../services/note.service';

/**
 * CampaignDetail component - Detailed view of a campaign
 */
export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Use optimized entity counts hook for campaign-scoped data
  const {
    entityCounts: optimizedEntityCounts,
    recentEntities: optimizedRecentEntities,
    loading: countsLoading,
    error: countsError,
    lastUpdated,
    refresh: refreshEntityCounts,
    performanceMetrics
  } = useOptimizedEntityCounts({
    worldId: campaign?.worldId,
    campaignId: campaign?.id,
    enableStaleWhileRevalidate: true,
    enableBackgroundRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    onCacheHit: () => console.debug('Entity counts cache hit for campaign:', campaign?.id),
    onCacheMiss: () => console.debug('Entity counts cache miss for campaign:', campaign?.id),
    onError: (error) => console.error('Entity counts error for campaign:', campaign?.id, error)
  });

  // Transform optimized data to match existing component structure
  const entityCounts = {
    characters: optimizedEntityCounts.character || 0,
    locations: optimizedEntityCounts.location || 0,
    factions: optimizedEntityCounts.faction || 0,
    items: optimizedEntityCounts.item || 0,
    events: optimizedEntityCounts.event || 0,
    sessions: optimizedEntityCounts.session || 0,
    storyArcs: optimizedEntityCounts.story_arc || 0,
    notes: optimizedEntityCounts.note || 0
  };

  const recentEntities = {
    characters: optimizedRecentEntities.character || [],
    locations: optimizedRecentEntities.location || [],
    factions: optimizedRecentEntities.faction || [],
    items: optimizedRecentEntities.item || [],
    events: optimizedRecentEntities.event || [],
    sessions: optimizedRecentEntities.session || [],
    storyArcs: optimizedRecentEntities.story_arc || [],
    notes: optimizedRecentEntities.note || []
  };

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const campaignData = await campaignService.getCampaignById(id);

        if (!campaignData) {
          setError('Campaign not found');
          return;
        }

        setCampaign(campaignData);
      } catch (err) {
        console.error('Error loading campaign:', err);
        setError('Failed to load campaign data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id]);

  // Performance metrics display (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performanceMetrics.loadTime > 0) {
      console.log('Campaign entity counts performance:', {
        cacheHit: performanceMetrics.cacheHit,
        loadTime: `${performanceMetrics.loadTime.toFixed(2)}ms`,
        source: performanceMetrics.source,
        campaignId: campaign?.id
      });
    }
  }, [performanceMetrics, campaign?.id]);

  // Handle edit campaign
  const handleEditCampaign = () => {
    if (id) {
      navigate(`/campaigns/${id}/edit`);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await campaignService.deleteCampaign(id);
        navigate('/campaigns');
      } catch (err) {
        console.error('Error deleting campaign:', err);
        alert('Failed to delete campaign. Please try again later.');
      }
    }
  };

  // Check if user can edit
  const canEdit = user && campaign && (user.id === campaign.createdBy);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />

      {error ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      ) : campaign ? (
        <>
          {/* Campaign Header */}
          <Paper p="md" withBorder mb="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                {campaign.imageURL ? (
                  <Image
                    src={campaign.imageURL}
                    alt={campaign.name}
                    radius="md"
                    height={200}
                    fit="cover"
                  />
                ) : (
                  <Box
                    h={200}
                    bg="gray.2"
                    style={{
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text c="dimmed">No image</Text>
                  </Box>
                )}
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 9 }}>
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Title order={2}>{campaign.name}</Title>
                    <Group gap="xs" mt="xs">
                      <Badge color={getCampaignStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge color="blue">{campaign.system}</Badge>
                    </Group>
                  </Box>

                  {canEdit && (
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={handleEditCampaign}
                        >
                          Edit Campaign
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={handleDeleteCampaign}
                        >
                          Delete Campaign
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>

                <Text mt="md">{campaign.description}</Text>

                <Grid mt="md">
                  {campaign.setting && (
                    <Grid.Col span={6}>
                      <Group gap="xs">
                        <IconMap size={16} />
                        <Text fw={500}>Setting:</Text>
                        <Text>{campaign.setting}</Text>
                      </Group>
                    </Grid.Col>
                  )}

                  {campaign.startDate && (
                    <Grid.Col span={6}>
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text fw={500}>Started:</Text>
                        <Text>{formatDate(campaign.startDate)}</Text>
                      </Group>
                    </Grid.Col>
                  )}

                  {campaign.endDate && (
                    <Grid.Col span={6}>
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text fw={500}>Ended:</Text>
                        <Text>{formatDate(campaign.endDate)}</Text>
                      </Group>
                    </Grid.Col>
                  )}

                  <Grid.Col span={6}>
                    <Group gap="xs">
                      <IconDeviceGamepad2 size={16} />
                      <Text fw={500}>System:</Text>
                      <Text>{campaign.system}</Text>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Campaign Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="md">
              <Tabs.Tab value="overview" leftSection={<IconBook size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="sessions" leftSection={<IconClock size={16} />}>
                Sessions
              </Tabs.Tab>
              <Tabs.Tab value="characters" leftSection={<IconUsers size={16} />}>
                Characters
              </Tabs.Tab>
              <Tabs.Tab value="locations" leftSection={<IconMapPin size={16} />}>
                Locations
              </Tabs.Tab>
              <Tabs.Tab value="notes" leftSection={<IconNote size={16} />}>
                Notes
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview">
              <CampaignOverview
                campaign={campaign}
                entityCounts={entityCounts}
                recentEntities={recentEntities}
                countsLoading={countsLoading}
              />
            </Tabs.Panel>

            <Tabs.Panel value="sessions">
              <CampaignSessions campaignId={campaign.id || ''} />
            </Tabs.Panel>

            <Tabs.Panel value="characters">
              <CampaignCharacters campaignId={campaign.id || ''} />
            </Tabs.Panel>

            <Tabs.Panel value="locations">
              <CampaignLocations campaignId={campaign.id || ''} />
            </Tabs.Panel>

            <Tabs.Panel value="notes">
              <CampaignNotes campaignId={campaign.id || ''} />
            </Tabs.Panel>
          </Tabs>
        </>
      ) : null}
    </Box>
  );
}

/**
 * CampaignOverview component - Overview tab content
 */
function CampaignOverview({
  campaign,
  entityCounts,
  recentEntities,
  countsLoading
}: {
  campaign: Campaign;
  entityCounts: any;
  recentEntities: any;
  countsLoading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Stack gap="md">
      {/* Campaign Stats - Clickable Entity Count Badges */}
      <Paper p="md" withBorder>
        <Title order={4} mb="md">Campaign Statistics</Title>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 4 }} spacing="md">
          {/* Characters */}
          <Card
            withBorder
            p="md"
            radius="md"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/campaigns/${campaign.id}/characters`)}
          >
            <Group wrap="nowrap">
              <ThemeIcon size="lg" radius="md" color="teal">
                <IconUsers style={{ width: '20px', height: '20px' }} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" c="dimmed">Characters</Text>
                    {countsLoading ? (
                      <Text fw={700} size="xl">
                        <Loader size="xs" />
                      </Text>
                    ) : (
                      <EntityCountTooltip
                        entityType={EntityType.CHARACTER}
                        count={entityCounts.characters}
                        recentEntities={recentEntities.characters}
                        color="teal"
                        position="top"
                      >
                        <Text fw={700} size="xl" style={{ cursor: 'help' }}>
                          {entityCounts.characters}
                        </Text>
                      </EntityCountTooltip>
                    )}
                  </div>
                </Group>
              </div>
            </Group>
          </Card>

          {/* Locations */}
          <Card
            withBorder
            p="md"
            radius="md"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/campaigns/${campaign.id}/locations`)}
          >
            <Group wrap="nowrap">
              <ThemeIcon size="lg" radius="md" color="violet">
                <IconMapPin style={{ width: '20px', height: '20px' }} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" c="dimmed">Locations</Text>
                    {countsLoading ? (
                      <Text fw={700} size="xl">
                        <Loader size="xs" />
                      </Text>
                    ) : (
                      <EntityCountTooltip
                        entityType={EntityType.LOCATION}
                        count={entityCounts.locations}
                        recentEntities={recentEntities.locations}
                        color="violet"
                        position="top"
                      >
                        <Text fw={700} size="xl" style={{ cursor: 'help' }}>
                          {entityCounts.locations}
                        </Text>
                      </EntityCountTooltip>
                    )}
                  </div>
                </Group>
              </div>
            </Group>
          </Card>

          {/* Factions */}
          <Card
            withBorder
            p="md"
            radius="md"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/campaigns/${campaign.id}/factions`)}
          >
            <Group wrap="nowrap">
              <ThemeIcon size="lg" radius="md" color="pink">
                <IconBuildingCastle style={{ width: '20px', height: '20px' }} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" c="dimmed">Factions</Text>
                    {countsLoading ? (
                      <Text fw={700} size="xl">
                        <Loader size="xs" />
                      </Text>
                    ) : (
                      <EntityCountTooltip
                        entityType={EntityType.FACTION}
                        count={entityCounts.factions}
                        recentEntities={recentEntities.factions}
                        color="pink"
                        position="top"
                      >
                        <Text fw={700} size="xl" style={{ cursor: 'help' }}>
                          {entityCounts.factions}
                        </Text>
                      </EntityCountTooltip>
                    )}
                  </div>
                </Group>
              </div>
            </Group>
          </Card>

          {/* Items */}
          <Card
            withBorder
            p="md"
            radius="md"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/campaigns/${campaign.id}/items`)}
          >
            <Group wrap="nowrap">
              <ThemeIcon size="lg" radius="md" color="yellow">
                <IconSword style={{ width: '20px', height: '20px' }} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" c="dimmed">Items</Text>
                    {countsLoading ? (
                      <Text fw={700} size="xl">
                        <Loader size="xs" />
                      </Text>
                    ) : (
                      <EntityCountTooltip
                        entityType={EntityType.ITEM}
                        count={entityCounts.items}
                        recentEntities={recentEntities.items}
                        color="yellow"
                        position="top"
                      >
                        <Text fw={700} size="xl" style={{ cursor: 'help' }}>
                          {entityCounts.items}
                        </Text>
                      </EntityCountTooltip>
                    )}
                  </div>
                </Group>
              </div>
            </Group>
          </Card>
        </SimpleGrid>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="md" withBorder>
          <Title order={4} mb="md">Campaign Summary</Title>
          <Text>{campaign.description}</Text>

          {/* Additional campaign details would go here */}
        </Paper>

        <Paper p="md" withBorder>
          <Title order={4} mb="md">Recent Activity</Title>
          <Text c="dimmed">No recent activity</Text>

          {/* Recent activity would go here */}
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}

// Note: These components have been moved to their own files in the campaign directory

// Note: This component has been moved to its own file in the campaign directory

/**
 * Get color for campaign status
 */
function getCampaignStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'green';
    case 'completed':
      return 'blue';
    case 'planned':
      return 'yellow';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}
