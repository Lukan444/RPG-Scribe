import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Title,
  Text,
  Card,
  Group,
  Button,
  Badge,
  Tabs,
  Image,
  ActionIcon,
  Menu,
  Skeleton,
  Avatar,
  SimpleGrid,
  useMantineTheme
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { CampaignService } from '../../services/campaign.service';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../models/Character';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/Location';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/Session';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/Event';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUsers,
  IconMap2,
  IconCalendarEvent,
  IconSword,
  IconBook,
  IconSettings
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';

/**
 * Campaign page component
 */
const CampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useMantineTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Services
  const campaignService = new CampaignService();

  // Load campaign data
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!id || !user) return;

      setLoading(true);

      try {
        // Load campaign
        const campaignData = await campaignService.getById(id);

        if (!campaignData) {
          navigate('/campaigns');
          return;
        }

        setCampaign(campaignData);
        setIsOwner(campaignData.createdBy === user.id);

        // Load characters
        const characterService = CharacterService.getInstance(campaignData.worldId, id);
        const charactersData = await characterService.query([], 10);
        setCharacters(charactersData.data);

        // Load locations
        const locationService = LocationService.getInstance(campaignData.worldId, id);
        const locationsData = await locationService.query([], 10);
        setLocations(locationsData.data);

        // Load sessions
        const sessionService = SessionService.getInstance(campaignData.worldId, id);
        const sessionsData = await sessionService.query([], 10);
        setSessions(sessionsData.data);

        // Load events
        const eventService = EventService.getInstance(campaignData.worldId, id);
        const eventsData = await eventService.query([], 10);
        setEvents(eventsData.data);
      } catch (error) {
        console.error('Error loading campaign data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [id, user, navigate]);

  // Delete campaign confirmation
  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: 'Delete Campaign',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this campaign? This action cannot be undone and all associated data will be permanently deleted.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: deleteCampaign,
    });
  };

  // Delete campaign
  const deleteCampaign = async () => {
    if (!id) return;

    try {
      await campaignService.delete(id);
      navigate('/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Skeleton height={50} width="50%" mb="xl" />
        <Skeleton height={200} mb="xl" />
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="characters">Characters</Tabs.Tab>
            <Tabs.Tab value="locations">Locations</Tabs.Tab>
            <Tabs.Tab value="sessions">Sessions</Tabs.Tab>
            <Tabs.Tab value="events">Events</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <SimpleGrid cols={2} spacing="md" mt="xl">
          <Skeleton height={300} />
          <Skeleton height={300} />
        </SimpleGrid>
      </Container>
    );
  }

  // Render not found state
  if (!campaign) {
    return (
      <Container size="xl" py="xl">
        <Title order={1} mb="xl">Campaign Not Found</Title>
        <Text>The campaign you are looking for does not exist or you do not have permission to view it.</Text>
        <Button component={Link} to="/campaigns" mt="xl">
          Back to Campaigns
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>{campaign.name}</Title>

        {isOwner && (
          <Group>
            <Button component={Link} to={`/campaigns/${id}/edit`} leftSection={<IconEdit size={16} />}>
              Edit
            </Button>

            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="default" size="lg">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={16} />} component={Link} to={`/campaigns/${id}/settings`}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={openDeleteModal}>
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        )}
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Grid>
          <Grid.Col span={4}>
            <Image
              src={campaign.imageURL || 'https://via.placeholder.com/300x200?text=Campaign'}
              height={200}
              alt={campaign.name}
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={8}>
            <Group justify="space-between" mb="md">
              <div>
                <Badge color={campaign.status === CampaignStatus.ACTIVE ? 'green' : campaign.status === CampaignStatus.PLANNING ? 'blue' : 'gray'} size="lg" mb="xs">
                  {campaign.status}
                </Badge>
                <Text size="sm" color="dimmed">
                  System: {campaign.system}
                </Text>
                <Text size="sm" color="dimmed">
                  Setting: {campaign.setting}
                </Text>
              </div>

              <Group>
                <Badge size="lg" color="blue" variant="outline">
                  <Group gap={4}>
                    <IconUsers size={16} />
                    <Text>{campaign.characterCount || 0} Characters</Text>
                  </Group>
                </Badge>
                <Badge size="lg" color="green" variant="outline">
                  <Group gap={4}>
                    <IconMap2 size={16} />
                    <Text>{campaign.locationCount || 0} Locations</Text>
                  </Group>
                </Badge>
                <Badge size="lg" color="violet" variant="outline">
                  <Group gap={4}>
                    <IconCalendarEvent size={16} />
                    <Text>{campaign.sessionCount || 0} Sessions</Text>
                  </Group>
                </Badge>
              </Group>
            </Group>

            <Text>{campaign.description}</Text>
          </Grid.Col>
        </Grid>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconBook size={16} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="characters" leftSection={<IconUsers size={16} />}>Characters</Tabs.Tab>
          <Tabs.Tab value="locations" leftSection={<IconMap2 size={16} />}>Locations</Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<IconCalendarEvent size={16} />}>Sessions</Tabs.Tab>
          <Tabs.Tab value="events" leftSection={<IconSword size={16} />}>Events</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Recent Sessions</Title>

                {sessions && sessions.length > 0 ? (
                  sessions.slice(0, 3).map((session) => (
                    <Card key={session.id} shadow="xs" padding="md" radius="md" withBorder mb="sm">
                      <Group justify="space-between">
                        <Text fw={500}>{session.title}</Text>
                        <Text size="sm" color="dimmed">
                          {session.datePlayed ? new Date(session.datePlayed.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                        </Text>
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Text color="dimmed">No recent sessions</Text>
                )}

                <Button component={Link} to={`/campaigns/${id}/sessions`} variant="light" fullWidth mt="md">
                  View All Sessions
                </Button>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Recent Events</Title>

                {events && events.length > 0 ? (
                  events.slice(0, 3).map((event) => (
                    <Card key={event.id} shadow="xs" padding="md" radius="md" withBorder mb="sm">
                      <Group justify="space-between">
                        <Text fw={500}>{event.name}</Text>
                        <Text size="sm" color="dimmed">
                          {event.date ? new Date(event.date.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                        </Text>
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Text color="dimmed">No recent events</Text>
                )}

                <Button component={Link} to={`/campaigns/${id}/events`} variant="light" fullWidth mt="md">
                  View All Events
                </Button>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="characters" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Characters</Title>

            <Button component={Link} to={`/campaigns/${id}/characters/new`} variant="filled" color="blue">
              Add Character
            </Button>
          </Group>

          <SimpleGrid cols={3} spacing="md">
            {characters.map((character) => (
              <Card key={character.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Avatar src={character.imageURL} size="lg" radius="xl" />
                  <Badge color={character.type === 'PC' ? 'blue' : 'gray'}>
                    {character.type}
                  </Badge>
                </Group>

                <Title order={4} mb="xs">{character.name}</Title>

                <Text size="sm" color="dimmed">
                  {character.race} {character.class} (Level {character.level})
                </Text>

                <Button component={Link} to={`/campaigns/${id}/characters/${character.id}`} variant="light" fullWidth mt="md">
                  View Character
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {characters.length === 0 && (
            <Text color="dimmed" ta="center" py="xl">
              No characters found. Add your first character to get started!
            </Text>
          )}

          {characters.length > 0 && (
            <Button component={Link} to={`/campaigns/${id}/characters`} variant="subtle" fullWidth mt="xl">
              View All Characters
            </Button>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="locations" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Locations</Title>

            <Button component={Link} to={`/campaigns/${id}/locations/new`} variant="filled" color="green">
              Add Location
            </Button>
          </Group>

          <SimpleGrid cols={3} spacing="md">
            {locations.map((location) => (
              <Card key={location.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Badge color="green">{location.type}</Badge>
                </Group>

                <Title order={4} mb="xs">{location.name}</Title>

                <Text size="sm" color="dimmed" lineClamp={2}>
                  {location.description}
                </Text>

                <Button component={Link} to={`/campaigns/${id}/locations/${location.id}`} variant="light" fullWidth mt="md">
                  View Location
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {locations.length === 0 && (
            <Text color="dimmed" ta="center" py="xl">
              No locations found. Add your first location to get started!
            </Text>
          )}

          {locations.length > 0 && (
            <Button component={Link} to={`/campaigns/${id}/locations`} variant="subtle" fullWidth mt="xl">
              View All Locations
            </Button>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="sessions" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Sessions</Title>

            <Button component={Link} to={`/campaigns/${id}/sessions/new`} variant="filled" color="violet">
              Add Session
            </Button>
          </Group>

          <SimpleGrid cols={2} spacing="md">
            {sessions.map((session) => (
              <Card key={session.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Title order={4}>Session #{session.number}: {session.title}</Title>
                  <Badge color={session.status === 'planned' ? 'blue' : session.status === 'completed' ? 'green' : 'red'}>
                    {session.status}
                  </Badge>
                </Group>

                <Group gap="xs" mb="md">
                  <IconCalendarEvent size={16} />
                  <Text size="sm">
                    {session.datePlayed ? new Date(session.datePlayed.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                  </Text>
                </Group>

                <Text size="sm" color="dimmed" lineClamp={2}>
                  {session.summary}
                </Text>

                <Button component={Link} to={`/campaigns/${id}/sessions/${session.id}`} variant="light" fullWidth mt="md">
                  View Session
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {sessions.length === 0 && (
            <Text color="dimmed" ta="center" py="xl">
              No sessions found. Add your first session to get started!
            </Text>
          )}

          {sessions.length > 0 && (
            <Button component={Link} to={`/campaigns/${id}/sessions`} variant="subtle" fullWidth mt="xl">
              View All Sessions
            </Button>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="events" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Events</Title>

            <Button component={Link} to={`/campaigns/${id}/events/new`} variant="filled" color="orange">
              Add Event
            </Button>
          </Group>

          <SimpleGrid cols={2} spacing="md">
            {events.map((event) => (
              <Card key={event.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Title order={4}>{event.name}</Title>
                  <Badge color="orange">{event.type}</Badge>
                </Group>

                <Group gap="xs" mb="md">
                  <Text size="sm">
                    {event.date ? new Date(event.date.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                  </Text>
                  <Badge size="sm" color="gray">
                    Importance: {event.importance}/10
                  </Badge>
                </Group>

                <Text size="sm" color="dimmed" lineClamp={2}>
                  {event.description}
                </Text>

                <Button component={Link} to={`/campaigns/${id}/events/${event.id}`} variant="light" fullWidth mt="md">
                  View Event
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {events.length === 0 && (
            <Text color="dimmed" ta="center" py="xl">
              No events found. Add your first event to get started!
            </Text>
          )}

          {events.length > 0 && (
            <Button component={Link} to={`/campaigns/${id}/events`} variant="subtle" fullWidth mt="xl">
              View All Events
            </Button>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default CampaignPage;
