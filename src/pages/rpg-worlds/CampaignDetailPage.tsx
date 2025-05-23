import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Badge,
  Paper,
  Tabs,
  Grid,
  Card,
  Image,
  Avatar,
  Stack,
  ThemeIcon,
  SimpleGrid,
  Button,
  ActionIcon,
  Tooltip,
  Divider,
  Box
} from '@mantine/core';
import {
  IconBook,
  IconUser,
  IconMapPin,
  IconSword,
  IconCalendarEvent,
  IconNotes,
  IconPlus,
  IconEdit,
  IconShare,
  IconBookmark,
  IconHeart,
  IconChevronRight,
  IconWorld
} from '@tabler/icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import { EntityTable } from '../../components/common/EntityTable';
import { EntityCardGrid } from '../../components/common/EntityCardGrid';
import { ArticleCard } from '../../components/common/ArticleCard';
import { EntityActionButton } from '../../components/common/EntityActionButton';
import { EntityType } from '../../models/EntityType';

// Mock campaign data
const mockCampaign = {
  id: 'shadows-of-eldoria',
  name: 'Shadows of Eldoria',
  description: 'A dark fantasy campaign set in a world where the boundaries between the living and the dead have blurred. The heroes must navigate political intrigue, ancient magic, and otherworldly threats to save the realm from eternal darkness.',
  setting: 'Eldoria',
  system: 'D&D 5E',
  startDate: new Date('2023-01-01'),
  endDate: null,
  status: 'active',
  createdBy: 'user1',
  createdAt: new Date('2022-12-15'),
  updatedAt: new Date('2023-05-20'),
  imageURL: 'https://placehold.co/800x400?text=Shadows+of+Eldoria',
  isPublic: true,
  characterCount: 12,
  locationCount: 8,
  itemCount: 15,
  eventCount: 10,
  sessionCount: 6,
  recentSessions: [
    {
      id: 'session1',
      title: 'The Dark Awakening',
      date: new Date('2023-05-15'),
      description: 'The party discovers an ancient artifact that begins to awaken dormant powers.'
    },
    {
      id: 'session2',
      title: 'Whispers in the Mist',
      date: new Date('2023-04-30'),
      description: 'Strange whispers lead the party to a forgotten temple in the misty forest.'
    },
    {
      id: 'session3',
      title: 'The Forgotten Tomb',
      date: new Date('2023-04-15'),
      description: 'The party explores a tomb of an ancient king, discovering dark secrets.'
    }
  ],
  recentEvents: [
    {
      id: 'event1',
      name: 'The Blood Moon',
      date: new Date('2023-05-10'),
      description: 'A rare celestial event that empowers undead creatures and weakens the veil between worlds.'
    },
    {
      id: 'event2',
      name: 'The King\'s Assassination',
      date: new Date('2023-04-25'),
      description: 'The sudden and mysterious death of King Aldric throws the kingdom into chaos.'
    },
    {
      id: 'event3',
      name: 'The Arcane Storm',
      date: new Date('2023-04-05'),
      description: 'A magical storm sweeps across the land, causing strange phenomena and mutations.'
    }
  ],
  featuredCharacters: [
    {
      id: 'char1',
      name: 'Thorne Ironheart',
      race: 'Dwarf',
      class: 'Warrior',
      type: 'PC',
      imageURL: 'https://placehold.co/100x100?text=Thorne',
    },
    {
      id: 'char2',
      name: 'Lyra Moonshadow',
      race: 'Elf',
      class: 'Ranger',
      type: 'PC',
      imageURL: 'https://placehold.co/100x100?text=Lyra',
    },
    {
      id: 'char3',
      name: 'Lord Darius Blackthorn',
      race: 'Human',
      class: 'Fighter',
      type: 'NPC',
      imageURL: 'https://placehold.co/100x100?text=Darius',
    }
  ],
  featuredLocations: [
    {
      id: 'loc1',
      name: 'Ravenhold Castle',
      type: 'Castle',
      description: 'A massive fortress perched on the edge of a cliff, overlooking the turbulent sea below.',
      imageURL: 'https://placehold.co/100x100?text=Ravenhold',
    },
    {
      id: 'loc2',
      name: 'Mistwood Forest',
      type: 'Forest',
      description: 'An ancient forest shrouded in perpetual mist, home to fey creatures and forgotten ruins.',
      imageURL: 'https://placehold.co/100x100?text=Mistwood',
    },
    {
      id: 'loc3',
      name: 'Shadowfell Portal',
      type: 'Magical Location',
      description: 'A tear in reality that connects the material plane to the Shadowfell, leaking dark energy into the world.',
      imageURL: 'https://placehold.co/100x100?text=Portal',
    }
  ]
};

export function CampaignDetailPage() {
  const { worldId, campaignId } = useParams<{ worldId: string, campaignId: string }>();
  const navigate = useNavigate();
  const [campaign] = useState(mockCampaign);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Get campaign status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'planned': return 'yellow';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl">
      {/* Campaign Header */}
      <Paper withBorder p="xl" radius="md" mb="xl">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Image
              src={campaign.imageURL}
              alt={campaign.name}
              radius="md"
              height={250}
              style={{ objectFit: 'cover' }}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack>
              <Group justify="space-between">
                <div>
                  <Group gap="xs">
                    <Badge color={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                    <Badge color="blue">{campaign.system}</Badge>
                  </Group>
                  <Title order={1} mt="xs">{campaign.name}</Title>
                </div>

                <Group>
                  <EntityActionButton
                    entityType={EntityType.CAMPAIGN}
                    variant="icon"
                    size="md"
                    primaryAction={{
                      label: 'Edit Campaign',
                      icon: <IconEdit style={{ width: '16px', height: '16px' }} />,
                      onClick: () => console.log('Edit campaign')
                    }}
                    actions={[
                      {
                        label: 'Share Campaign',
                        icon: <IconShare style={{ width: '16px', height: '16px' }} />,
                        onClick: () => console.log('Share campaign')
                      },
                      {
                        label: 'Bookmark Campaign',
                        icon: <IconBookmark style={{ width: '16px', height: '16px' }} />,
                        onClick: () => console.log('Bookmark campaign')
                      }
                    ]}
                  />
                </Group>
              </Group>

              <Text c="dimmed" size="sm">
                Setting: <Text span fw={500} inherit>{campaign.setting}</Text>
              </Text>

              <Text lineClamp={4}>
                {campaign.description}
              </Text>

              <Group>
                <div>
                  <Text size="xs" c="dimmed">Started</Text>
                  <Text>{campaign.startDate.toLocaleDateString()}</Text>
                </div>

                <div>
                  <Text size="xs" c="dimmed">Last Updated</Text>
                  <Text>{campaign.updatedAt.toLocaleDateString()}</Text>
                </div>

                <div>
                  <Text size="xs" c="dimmed">Sessions</Text>
                  <Text>{campaign.sessionCount}</Text>
                </div>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Campaign Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconBook style={{ width: '16px', height: '16px' }} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="characters" leftSection={<IconUser style={{ width: '16px', height: '16px' }} />}>
            Characters
          </Tabs.Tab>
          <Tabs.Tab value="locations" leftSection={<IconMapPin style={{ width: '16px', height: '16px' }} />}>
            Locations
          </Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<IconCalendarEvent style={{ width: '16px', height: '16px' }} />}>
            Sessions
          </Tabs.Tab>
        </Tabs.List>

        <div style={{ marginTop: '1rem' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <Grid>
              {/* Campaign Stats */}
              <Grid.Col span={12}>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="lg">
                  <Paper withBorder p="md" radius="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" color="teal">
                        <IconUser size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="dimmed" size="xs">Characters</Text>
                        <Text fw={700} size="xl">{campaign.characterCount}</Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" color="blue">
                        <IconMapPin size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="dimmed" size="xs">Locations</Text>
                        <Text fw={700} size="xl">{campaign.locationCount}</Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" color="yellow">
                        <IconSword size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="dimmed" size="xs">Items</Text>
                        <Text fw={700} size="xl">{campaign.itemCount}</Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" color="violet">
                        <IconCalendarEvent size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="dimmed" size="xs">Events</Text>
                        <Text fw={700} size="xl">{campaign.eventCount}</Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" color="green">
                        <IconCalendarEvent size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="dimmed" size="xs">Sessions</Text>
                        <Text fw={700} size="xl">{campaign.sessionCount}</Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" color="gray">
                        <IconNotes size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="dimmed" size="xs">Notes</Text>
                        <Text fw={700} size="xl">12</Text>
                      </div>
                    </Group>
                  </Paper>
                </SimpleGrid>
              </Grid.Col>

              {/* Recent Sessions */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Recent Sessions</Title>
                    <Button
                      variant="light"
                      color="blue"
                      size="xs"
                      rightSection={<IconChevronRight style={{ width: '14px', height: '14px' }} />}
                      onClick={() => setActiveTab('sessions')}
                    >
                      View All
                    </Button>
                  </Group>

                  <Stack>
                    {campaign.recentSessions.map((session) => (
                      <Card key={session.id} withBorder padding="sm">
                        <Group justify="space-between">
                          <div>
                            <Text fw={500}>{session.title}</Text>
                            <Text size="xs" c="dimmed">
                              {session.date.toLocaleDateString()}
                            </Text>
                          </div>
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/sessions/${session.id}`)}
                          >
                            View
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Recent Events */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Recent Events</Title>
                    <Button
                      variant="light"
                      color="violet"
                      size="xs"
                      rightSection={<IconChevronRight style={{ width: '14px', height: '14px' }} />}
                    >
                      View All
                    </Button>
                  </Group>

                  <Stack>
                    {campaign.recentEvents.map((event) => (
                      <Card key={event.id} withBorder padding="sm">
                        <Group justify="space-between">
                          <div>
                            <Text fw={500}>{event.name}</Text>
                            <Text size="xs" c="dimmed">
                              {event.date.toLocaleDateString()}
                            </Text>
                          </div>
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/events/${event.id}`)}
                          >
                            View
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Featured Characters */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Featured Characters</Title>
                    <Button
                      variant="light"
                      color="teal"
                      size="xs"
                      rightSection={<IconChevronRight style={{ width: '14px', height: '14px' }} />}
                      onClick={() => setActiveTab('characters')}
                    >
                      View All
                    </Button>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {campaign.featuredCharacters.map((character) => (
                      <Group key={character.id} wrap="nowrap">
                        <Avatar
                          src={character.imageURL}
                          size="lg"
                          radius="md"
                        />
                        <div>
                          <Text fw={500}>{character.name}</Text>
                          <Group gap={5}>
                            <Text size="xs">{character.race}</Text>
                            <Text size="xs">•</Text>
                            <Text size="xs">{character.class}</Text>
                          </Group>
                          <Badge size="xs" mt={5} color={character.type === 'PC' ? 'blue' : 'gray'}>
                            {character.type}
                          </Badge>
                        </div>
                      </Group>
                    ))}
                  </SimpleGrid>
                </Paper>
              </Grid.Col>

              {/* Featured Locations */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Featured Locations</Title>
                    <Button
                      variant="light"
                      color="blue"
                      size="xs"
                      rightSection={<IconChevronRight style={{ width: '14px', height: '14px' }} />}
                      onClick={() => setActiveTab('locations')}
                    >
                      View All
                    </Button>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {campaign.featuredLocations.map((location) => (
                      <Group key={location.id} wrap="nowrap">
                        <Avatar
                          src={location.imageURL}
                          size="lg"
                          radius="md"
                        />
                        <div>
                          <Text fw={500}>{location.name}</Text>
                          <Badge size="xs">{location.type}</Badge>
                          <Text size="xs" c="dimmed" lineClamp={2} mt={5}>
                            {location.description}
                          </Text>
                        </div>
                      </Group>
                    ))}
                  </SimpleGrid>
                </Paper>
              </Grid.Col>
            </Grid>
          )}

          {/* Characters Tab */}
          {activeTab === 'characters' && (
            <div>
              <Text>Characters content will go here</Text>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div>
              <Text>Locations content will go here</Text>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <Text>Sessions content will go here</Text>
            </div>
          )}
        </div>
      </Tabs>
    </Container>
  );
}

export default CampaignDetailPage;