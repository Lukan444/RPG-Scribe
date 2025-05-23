import React from 'react';
import {
  Tabs,
  Badge,
  Group,
  Text,
  Avatar,
  Paper,
  SimpleGrid,
  Card,
  ThemeIcon,
  rem,
  List,
  Divider,
  Button,
  ActionIcon,
} from '@mantine/core';
import {
  IconBook,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconNotes,
  IconPlus,
  IconLink,
  IconChartBar,
  IconTimeline,
  IconEdit,
} from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import RPGWorldPage from '../../components/rpg-world/RPGWorldPage';

// Mock data for a campaign
const mockCampaign = {
  id: '1',
  name: 'The Courts of Chaos',
  description: 'A campaign set in the Amber Chronicles universe. The player characters are princes and princesses of Amber, the one true world of which all others, including Earth, are but shadows. They are the children of Oberon, the now-missing King of Amber, and each has walked the Pattern, a labyrinth inscribed on the floor of the Great Hall of Castle Amber, which gives them the ability to walk among shadows.',
  gameSystem: 'Amber Diceless',
  status: 'active',
  createdAt: '2023-01-15',
  updatedAt: '2023-05-20',
  gamemaster: {
    id: '1',
    name: 'John Doe',
    avatar: null,
  },
  players: [
    { id: '1', name: 'Alice Johnson', character: 'Florimel', avatar: null },
    { id: '2', name: 'Bob Smith', character: 'Random', avatar: null },
    { id: '3', name: 'Carol Davis', character: 'Bleys', avatar: null },
    { id: '4', name: 'Dave Wilson', character: 'Corwin', avatar: null },
    { id: '5', name: 'Eve Brown', character: 'Fiona', avatar: null },
  ],
  sessions: [
    { id: '1', name: 'Session 1: The Awakening', date: '2023-01-20', status: 'completed' },
    { id: '2', name: 'Session 2: The Pattern', date: '2023-02-03', status: 'completed' },
    { id: '3', name: 'Session 3: Shadow Walking', date: '2023-02-17', status: 'completed' },
    { id: '4', name: 'Session 4: The Courts of Chaos', date: '2023-03-03', status: 'completed' },
    { id: '5', name: 'Session 5: The Black Road', date: '2023-03-17', status: 'completed' },
    { id: '6', name: 'Session 6: The Jewel of Judgment', date: '2023-03-31', status: 'completed' },
    { id: '7', name: 'Session 7: The Primal Pattern', date: '2023-04-14', status: 'completed' },
    { id: '8', name: 'Session 8: The Courts of Chaos', date: '2023-04-28', status: 'completed' },
    { id: '9', name: 'Session 9: The Patternfall War', date: '2023-05-12', status: 'completed' },
    { id: '10', name: 'Session 10: The New King', date: '2023-05-26', status: 'planned' },
    { id: '11', name: 'Session 11: The Aftermath', date: '2023-06-09', status: 'planned' },
    { id: '12', name: 'Session 12: The New Threat', date: '2023-06-23', status: 'planned' },
  ],
  locations: [
    { id: '1', name: 'Castle Amber', type: 'Castle' },
    { id: '2', name: 'The Pattern', type: 'Magical Location' },
    { id: '3', name: 'The Courts of Chaos', type: 'City' },
    { id: '4', name: 'Arden Forest', type: 'Forest' },
    { id: '5', name: 'Rebma', type: 'Underwater City' },
  ],
  characters: [
    { id: '1', name: 'Oberon', type: 'NPC', status: 'missing' },
    { id: '2', name: 'Dworkin', type: 'NPC', status: 'alive' },
    { id: '3', name: 'Eric', type: 'NPC', status: 'alive' },
    { id: '4', name: 'Caine', type: 'NPC', status: 'alive' },
    { id: '5', name: 'Julian', type: 'NPC', status: 'alive' },
    { id: '6', name: 'Gerard', type: 'NPC', status: 'alive' },
    { id: '7', name: 'Benedict', type: 'NPC', status: 'alive' },
  ],
  items: [
    { id: '1', name: 'The Pattern Blade', type: 'Weapon' },
    { id: '2', name: 'The Jewel of Judgment', type: 'Artifact' },
    { id: '3', name: 'Trump Deck', type: 'Magical Item' },
    { id: '4', name: 'Grayswandir', type: 'Weapon' },
  ],
  events: [
    { id: '1', name: 'The Black Road', type: 'Plot Event' },
    { id: '2', name: 'The Pattern Walk', type: 'Character Event' },
    { id: '3', name: 'The Courts of Chaos', type: 'Plot Event' },
  ],
  notes: [
    { id: '1', title: 'The Pattern', content: 'The Pattern is a labyrinth inscribed on the floor of the Great Hall of Castle Amber...' },
    { id: '2', title: 'Shadow Walking', content: 'Shadow walking is the ability to travel between shadows...' },
    { id: '3', title: 'The Courts of Chaos', content: 'The Courts of Chaos are the opposite of Amber...' },
  ],
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    active: 'green',
    planning: 'blue',
    hiatus: 'yellow',
    completed: 'gray',
  };

  return (
    <Badge color={statusColors[status] || 'gray'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const campaign = mockCampaign; // In a real app, fetch the campaign by ID

  return (
    <RPGWorldPage
      title={campaign.name}
      description={campaign.description}
      icon={<IconBook style={{ width: '24px', height: '24px' }} />}
      breadcrumbs={[
        { title: 'RPG World', path: '/rpg-world' },
        { title: 'Campaigns', path: '/campaigns' },
      ]}
    >
      <Paper p="md" withBorder mb="lg">
        <Group wrap="nowrap" mb="md">
          <div>
            <Group mb="xs">
              <Text fw={700}>Game System:</Text>
              <Text>{campaign.gameSystem}</Text>
            </Group>
            <Group mb="xs">
              <Text fw={700}>Status:</Text>
              <StatusBadge status={campaign.status} />
            </Group>
            <Group mb="xs">
              <Text fw={700}>Game Master:</Text>
              <Group gap="xs">
                <Avatar
                  size="sm"
                  color="blue"
                  radius="xl"
                >
                  {campaign.gamemaster.name.charAt(0)}
                </Avatar>
                <Text>{campaign.gamemaster.name}</Text>
              </Group>
            </Group>
            <Group>
              <Text fw={700}>Players:</Text>
              <Text>{campaign.players.length}</Text>
            </Group>
          </div>
        </Group>
      </Paper>

      <Tabs defaultValue="overview">
        <Tabs.List mb="md">
          <Tabs.Tab value="overview" leftSection={<IconChartBar size="0.8rem" />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<IconCalendarEvent size="0.8rem" />}>
            Sessions ({campaign.sessions.length})
          </Tabs.Tab>
          <Tabs.Tab value="characters" leftSection={<IconUsers size="0.8rem" />}>
            Characters ({campaign.characters.length + campaign.players.length})
          </Tabs.Tab>
          <Tabs.Tab value="locations" leftSection={<IconMap size="0.8rem" />}>
            Locations ({campaign.locations.length})
          </Tabs.Tab>
          <Tabs.Tab value="items" leftSection={<IconSword size="0.8rem" />}>
            Items ({campaign.items.length})
          </Tabs.Tab>
          <Tabs.Tab value="events" leftSection={<IconTimeline size="0.8rem" />}>
            Events ({campaign.events.length})
          </Tabs.Tab>
          <Tabs.Tab value="notes" leftSection={<IconNotes size="0.8rem" />}>
            Notes ({campaign.notes.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Card withBorder padding="lg">
              <Group mb="md">
                <ThemeIcon size={40} radius={40} color="blue">
                  <IconCalendarEvent size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Sessions</Text>
                  <Text size="xl" fw={700}>{campaign.sessions.length}</Text>
                </div>
              </Group>
              <Group>
                <Button
                  component={Link}
                  to={`/campaigns/${id}/sessions`}
                  variant="light"
                  leftSection={<IconLink size="1rem" />}
                  fullWidth
                >
                  View All
                </Button>
              </Group>
            </Card>

            <Card withBorder padding="lg">
              <Group mb="md">
                <ThemeIcon size={40} radius={40} color="violet">
                  <IconUsers size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Characters</Text>
                  <Text size="xl" fw={700}>{campaign.characters.length + campaign.players.length}</Text>
                </div>
              </Group>
              <Group>
                <Button
                  component={Link}
                  to={`/campaigns/${id}/characters`}
                  variant="light"
                  leftSection={<IconLink size="1rem" />}
                  fullWidth
                >
                  View All
                </Button>
              </Group>
            </Card>

            <Card withBorder padding="lg">
              <Group mb="md">
                <ThemeIcon size={40} radius={40} color="green">
                  <IconMap size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Locations</Text>
                  <Text size="xl" fw={700}>{campaign.locations.length}</Text>
                </div>
              </Group>
              <Group>
                <Button
                  component={Link}
                  to={`/campaigns/${id}/locations`}
                  variant="light"
                  leftSection={<IconLink size="1rem" />}
                  fullWidth
                >
                  View All
                </Button>
              </Group>
            </Card>

            <Card withBorder padding="lg">
              <Group mb="md">
                <ThemeIcon size={40} radius={40} color="orange">
                  <IconSword size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Items</Text>
                  <Text size="xl" fw={700}>{campaign.items.length}</Text>
                </div>
              </Group>
              <Group>
                <Button
                  component={Link}
                  to={`/campaigns/${id}/items`}
                  variant="light"
                  leftSection={<IconLink size="1rem" />}
                  fullWidth
                >
                  View All
                </Button>
              </Group>
            </Card>

            <Card withBorder padding="lg">
              <Group mb="md">
                <ThemeIcon size={40} radius={40} color="red">
                  <IconTimeline size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Events</Text>
                  <Text size="xl" fw={700}>{campaign.events.length}</Text>
                </div>
              </Group>
              <Group>
                <Button
                  component={Link}
                  to={`/campaigns/${id}/events`}
                  variant="light"
                  leftSection={<IconLink size="1rem" />}
                  fullWidth
                >
                  View All
                </Button>
              </Group>
            </Card>

            <Card withBorder padding="lg">
              <Group mb="md">
                <ThemeIcon size={40} radius={40} color="cyan">
                  <IconNotes size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Notes</Text>
                  <Text size="xl" fw={700}>{campaign.notes.length}</Text>
                </div>
              </Group>
              <Group>
                <Button
                  component={Link}
                  to={`/campaigns/${id}/notes`}
                  variant="light"
                  leftSection={<IconLink size="1rem" />}
                  fullWidth
                >
                  View All
                </Button>
              </Group>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="sessions">
          <Group mb="md" justify="flex-end">
            <Button
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to={`/campaigns/${id}/sessions/new`}
            >
              Add Session
            </Button>
          </Group>

          <Paper withBorder p="md">
            <List spacing="md">
              {campaign.sessions.map((session) => (
                <List.Item
                  key={session.id}
                  icon={
                    <ThemeIcon color={session.status === 'completed' ? 'green' : 'blue'} size={24} radius="xl">
                      <IconCalendarEvent size="1rem" />
                    </ThemeIcon>
                  }
                >
                  <Group justify="space-between">
                    <Text component={Link} to={`/campaigns/${id}/sessions/${session.id}`}>
                      {session.name}
                    </Text>
                    <Group gap="xs">
                      <Text size="sm" color="dimmed">{session.date}</Text>
                      <Badge size="sm" color={session.status === 'completed' ? 'green' : 'blue'}>
                        {session.status}
                      </Badge>
                    </Group>
                  </Group>
                </List.Item>
              ))}
            </List>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="characters">
          <Group mb="md" justify="flex-end">
            <Button
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to={`/campaigns/${id}/characters/new`}
            >
              Add Character
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <Card withBorder p="md">
              <Text fw={700} mb="md">Player Characters</Text>
              <Divider mb="md" />
              <List spacing="md">
                {campaign.players.map((player) => (
                  <List.Item
                    key={player.id}
                    icon={
                      <Avatar size="sm" radius="xl" color="blue">
                        {player.character.charAt(0)}
                      </Avatar>
                    }
                  >
                    <Group justify="space-between">
                      <Text component={Link} to={`/characters/${player.id}`}>
                        {player.character}
                      </Text>
                      <Text size="sm" color="dimmed">
                        Played by {player.name}
                      </Text>
                    </Group>
                  </List.Item>
                ))}
              </List>
            </Card>

            <Card withBorder p="md">
              <Text fw={700} mb="md">Non-Player Characters</Text>
              <Divider mb="md" />
              <List spacing="md">
                {campaign.characters.map((character) => (
                  <List.Item
                    key={character.id}
                    icon={
                      <Avatar size="sm" radius="xl" color="gray">
                        {character.name.charAt(0)}
                      </Avatar>
                    }
                  >
                    <Group justify="space-between">
                      <Text component={Link} to={`/characters/${character.id}`}>
                        {character.name}
                      </Text>
                      <Badge size="sm" color={character.status === 'alive' ? 'green' : 'red'}>
                        {character.status}
                      </Badge>
                    </Group>
                  </List.Item>
                ))}
              </List>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="locations">
          <Group mb="md" justify="flex-end">
            <Button
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to={`/campaigns/${id}/locations/new`}
            >
              Add Location
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {campaign.locations.map((location) => (
              <Card key={location.id} withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={700} component={Link} to={`/locations/${location.id}`}>
                    {location.name}
                  </Text>
                  <Badge>{location.type}</Badge>
                </Group>
                <Group justify="flex-end" mt="md">
                  <ActionIcon
                    component={Link}
                    to={`/locations/${location.id}/edit`}
                    variant="light"
                  >
                    <IconEdit size="1rem" />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="items">
          <Group mb="md" justify="flex-end">
            <Button
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to={`/campaigns/${id}/items/new`}
            >
              Add Item
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {campaign.items.map((item) => (
              <Card key={item.id} withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={700} component={Link} to={`/items/${item.id}`}>
                    {item.name}
                  </Text>
                  <Badge>{item.type}</Badge>
                </Group>
                <Group justify="flex-end" mt="md">
                  <ActionIcon
                    component={Link}
                    to={`/items/${item.id}/edit`}
                    variant="light"
                  >
                    <IconEdit size="1rem" />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="events">
          <Group mb="md" justify="flex-end">
            <Button
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to={`/campaigns/${id}/events/new`}
            >
              Add Event
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {campaign.events.map((event) => (
              <Card key={event.id} withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={700} component={Link} to={`/events/${event.id}`}>
                    {event.name}
                  </Text>
                  <Badge>{event.type}</Badge>
                </Group>
                <Group justify="flex-end" mt="md">
                  <ActionIcon
                    component={Link}
                    to={`/events/${event.id}/edit`}
                    variant="light"
                  >
                    <IconEdit size="1rem" />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="notes">
          <Group mb="md" justify="flex-end">
            <Button
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to={`/campaigns/${id}/notes/new`}
            >
              Add Note
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {campaign.notes.map((note) => (
              <Card key={note.id} withBorder p="md">
                <Text fw={700} mb="xs" component={Link} to={`/notes/${note.id}`}>
                  {note.title}
                </Text>
                <Text lineClamp={3} mb="md">
                  {note.content}
                </Text>
                <Group justify="flex-end">
                  <Button
                    component={Link}
                    to={`/notes/${note.id}`}
                    variant="light"
                    size="xs"
                  >
                    Read More
                  </Button>
                  <ActionIcon
                    component={Link}
                    to={`/notes/${note.id}/edit`}
                    variant="light"
                  >
                    <IconEdit size="1rem" />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </RPGWorldPage>
  );
}

export default CampaignDetailPage;