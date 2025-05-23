import React, { useState, useEffect } from 'react';
import { Container, Grid, Title, Text, Card, Group, Button, Badge, Skeleton, Image, SimpleGrid, useMantineTheme } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { CampaignService } from '../../services/campaign.service';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../models/Character';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/Session';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { RPGWorld } from '../../models/RPGWorld';
import { UserPreferencesService } from '../../services/userPreferences.service';
import { IconCalendarEvent, IconUsers, IconMap2, IconSword, IconBook, IconUsersGroup, IconMapPin, IconTimeline, IconNotebook, IconBookmark, IconWorld } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { EntityType } from '../../models/EntityType';
import { RelationshipCountBadge } from '../../components/relationships/badges';

/**
 * Dashboard page component
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useMantineTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentCharacters, setRecentCharacters] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [publicWorlds, setPublicWorlds] = useState<RPGWorld[]>([]);
  const [dashboardLayout, setDashboardLayout] = useState<string>('grid');
  const [activeWidgets, setActiveWidgets] = useState<string[]>([
    'recentCampaigns',
    'recentCharacters',
    'upcomingSessions',
    'publicWorlds'
  ]);

  // Services
  const campaignService = new CampaignService();
  const rpgWorldService = new RPGWorldService();
  const userPreferencesService = new UserPreferencesService();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setLoading(true);

      try {
        // Load user preferences
        const preferences = await userPreferencesService.getUserPreferences(user.id);

        if (preferences.dashboard) {
          setDashboardLayout(preferences.dashboard.layout || 'grid');
          setActiveWidgets(preferences.dashboard.widgets || [
            'recentCampaigns',
            'recentCharacters',
            'upcomingSessions',
            'publicWorlds'
          ]);
        }

        // Load recent campaigns
        const campaigns = await campaignService.getCampaignsByUser(user.id);
        setRecentCampaigns(campaigns.slice(0, 4));

        // Load recent characters from all campaigns
        const characters: any[] = [];
        for (const campaign of campaigns.slice(0, 3)) {
          if (campaign.id && campaign.worldId) {
            const characterService = CharacterService.getInstance(campaign.worldId, campaign.id);
            const campaignCharacters = await characterService.getCharactersByType('PC');
            characters.push(...campaignCharacters.slice(0, 2));
          }
        }
        setRecentCharacters(characters.slice(0, 4));

        // Load upcoming sessions from all campaigns
        const sessions: any[] = [];
        for (const campaign of campaigns.slice(0, 3)) {
          if (campaign.id && campaign.worldId) {
            const sessionService = SessionService.getInstance(campaign.worldId, campaign.id);
            try {
              const campaignSessions = await sessionService.getSessionsByStatus('planned');
              sessions.push(...campaignSessions.slice(0, 2));
            } catch (error) {
              console.error(`Error loading sessions for campaign ${campaign.id}:`, error);
            }
          }
        }
        setUpcomingSessions(sessions.slice(0, 4));

        // Load public worlds
        const worlds = await rpgWorldService.getPublicWorlds();
        setPublicWorlds(worlds.slice(0, 4));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Render campaign card
  const renderCampaignCard = (campaign: Campaign) => (
    <Card key={campaign.id} shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={campaign.imageURL || 'https://via.placeholder.com/300x150?text=Campaign'}
          height={160}
          alt={campaign.name}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Title order={4}>{campaign.name}</Title>
        <Badge color={campaign.status === CampaignStatus.ACTIVE ? 'green' : campaign.status === CampaignStatus.PLANNING ? 'blue' : 'gray'}>
          {campaign.status}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed" lineClamp={2}>
        {campaign.description}
      </Text>

      <Group justify="space-between" mt="md">
        <Text size="xs" color="dimmed">
          {campaign.system} • {campaign.setting}
        </Text>
        <Group gap={5}>
          <Badge size="xs" color="blue" variant="outline">
            <Group gap={4}>
              <IconUsers size={12} />
              <Text>{campaign.characterCount || 0}</Text>
            </Group>
          </Badge>
          <Badge size="xs" color="green" variant="outline">
            <Group gap={4}>
              <IconMapPin size={12} />
              <Text>{campaign.locationCount || 0}</Text>
            </Group>
          </Badge>
        </Group>
      </Group>

      <Button component={Link} to={`/campaigns/${campaign.id}`} variant="light" color="blue" fullWidth mt="md" radius="md">
        View Campaign
      </Button>
    </Card>
  );

  // Render character card
  const renderCharacterCard = (character: Character) => (
    <Card key={character.id} shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={character.imageURL || 'https://via.placeholder.com/300x150?text=Character'}
          height={160}
          alt={character.name}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Title order={4}>{character.name}</Title>
        <Badge color={character.isPlayerCharacter ? 'blue' : 'gray'}>
          {character.isPlayerCharacter ? 'PC' : 'NPC'}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed">
        {character.race} {character.class} (Level {character.level})
      </Text>

      <Text size="sm" color="dimmed" mt="xs" lineClamp={2}>
        {character.background}
      </Text>

      <Button component={Link} to={`/characters/${character.id}`} variant="light" color="green" fullWidth mt="md" radius="md">
        View Character
      </Button>
    </Card>
  );

  // Render session card
  const renderSessionCard = (session: any) => (
    <Card key={session.id} shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Title order={4}>{session.title || `Session #${session.number || 0}`}</Title>
        <Badge color={session.status === 'planned' ? 'blue' : session.status === 'completed' ? 'green' : 'red'}>
          {session.status}
        </Badge>
      </Group>

      <Group gap="xs" mb="md">
        <IconCalendarEvent size={16} />
        <Text size="sm">
          {session.datePlayed ? new Date(session.datePlayed.seconds * 1000).toLocaleDateString() : 'Date TBD'}
        </Text>
        {session.duration && (
          <Text size="sm" color="dimmed">
            ({session.duration} minutes)
          </Text>
        )}
      </Group>

      <Text size="sm" color="dimmed" lineClamp={2}>
        {session.summary || 'No summary available'}
      </Text>

      <Group justify="space-between" mt="md">
        <Text size="xs" color="dimmed">
          {session.participants?.length || 0} participants
        </Text>
        <Text size="xs" color="dimmed">
          {session.locations?.length || 0} locations
        </Text>
      </Group>

      <Button component={Link} to={`/sessions/${session.id}`} variant="light" color="violet" fullWidth mt="md" radius="md">
        View Session
      </Button>
    </Card>
  );

  // Render world card
  const renderWorldCard = (world: RPGWorld) => (
    <Card key={world.id} shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={world.imageURL || 'https://via.placeholder.com/300x150?text=World'}
          height={160}
          alt={world.name}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Title order={4}>{world.name}</Title>
        <Badge color="cyan">
          {world.system}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed" lineClamp={2}>
        {world.description}
      </Text>

      <Group justify="space-between" mt="md">
        <Text size="xs" color="dimmed">
          Setting: {world.setting}
        </Text>
        <Badge size="xs" color="blue" variant="outline">
          <Group gap={4}>
            <IconBook size={12} />
            <Text>{world.campaignCount || 0} campaigns</Text>
          </Group>
        </Badge>
      </Group>

      <Button component={Link} to={`/worlds/${world.id}`} variant="light" color="indigo" fullWidth mt="md" radius="md">
        View World
      </Button>
    </Card>
  );

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Dashboard</Title>

      <SimpleGrid cols={dashboardLayout === 'grid' ? 2 : 1} spacing="xl">
        {/* Recent Campaigns */}
        {activeWidgets.includes('recentCampaigns') && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={2}>Recent Campaigns</Title>
              <Button component={Link} to="/campaigns" variant="subtle" color="blue" size="xs">
                View All
              </Button>
            </Group>

            {loading ? (
              <Grid>
                {[1, 2].map((i) => (
                  <Grid.Col key={i} span={6}>
                    <Skeleton height={300} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            ) : recentCampaigns.length > 0 ? (
              <Grid>
                {recentCampaigns.map((campaign) => (
                  <Grid.Col key={campaign.id} span={6}>
                    {renderCampaignCard(campaign)}
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Text color="dimmed" ta="center" py="xl">
                No campaigns found. Create your first campaign to get started!
              </Text>
            )}

            <Button component={Link} to="/campaigns/new" variant="filled" color="blue" fullWidth mt="md">
              Create New Campaign
            </Button>
          </Card>
        )}

        {/* Recent Characters */}
        {activeWidgets.includes('recentCharacters') && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={2}>Recent Characters</Title>
              <Button component={Link} to="/characters" variant="subtle" color="green" size="xs">
                View All
              </Button>
            </Group>

            {loading ? (
              <Grid>
                {[1, 2].map((i) => (
                  <Grid.Col key={i} span={6}>
                    <Skeleton height={300} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            ) : recentCharacters.length > 0 ? (
              <Grid>
                {recentCharacters.map((character) => (
                  <Grid.Col key={character.id} span={6}>
                    {renderCharacterCard(character)}
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Text color="dimmed" ta="center" py="xl">
                No characters found. Create your first character to get started!
              </Text>
            )}

            <Button component={Link} to="/characters/new" variant="filled" color="green" fullWidth mt="md">
              Create New Character
            </Button>
          </Card>
        )}

        {/* Upcoming Sessions */}
        {activeWidgets.includes('upcomingSessions') && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={2}>Upcoming Sessions</Title>
              <Button component={Link} to="/sessions" variant="subtle" color="violet" size="xs">
                View All
              </Button>
            </Group>

            {loading ? (
              <Grid>
                {[1, 2].map((i) => (
                  <Grid.Col key={i} span={6}>
                    <Skeleton height={200} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            ) : upcomingSessions.length > 0 ? (
              <Grid>
                {upcomingSessions.map((session) => (
                  <Grid.Col key={session.id} span={6}>
                    {renderSessionCard(session)}
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Text color="dimmed" ta="center" py="xl">
                No upcoming sessions found. Schedule a session to get started!
              </Text>
            )}

            <Button component={Link} to="/sessions/new" variant="filled" color="violet" fullWidth mt="md">
              Schedule New Session
            </Button>
          </Card>
        )}

        {/* Public Worlds */}
        {activeWidgets.includes('publicWorlds') && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={2}>Public Worlds</Title>
              <Button component={Link} to="/worlds" variant="subtle" color="indigo" size="xs">
                View All
              </Button>
            </Group>

            {loading ? (
              <Grid>
                {[1, 2].map((i) => (
                  <Grid.Col key={i} span={6}>
                    <Skeleton height={300} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            ) : publicWorlds.length > 0 ? (
              <Grid>
                {publicWorlds.map((world) => (
                  <Grid.Col key={world.id} span={6}>
                    {renderWorldCard(world)}
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Text color="dimmed" ta="center" py="xl">
                No public worlds found. Create your first world to get started!
              </Text>
            )}

            <Button component={Link} to="/worlds/new" variant="filled" color="indigo" fullWidth mt="md">
              Create New World
            </Button>
          </Card>
        )}
      </SimpleGrid>
    </Container>
  );
};

export default DashboardPage;
