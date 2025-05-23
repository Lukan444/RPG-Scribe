import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Grid,
  Image,
  Text,
  Badge,
  Group,
  Button,
  ActionIcon,
  Menu,
  Title,
  Stack,
  Divider,
  Box,
  SimpleGrid,
  Card,
  ThemeIcon,
  Tooltip,
  Tabs,
  Progress,
  Avatar,
  AvatarGroup,
  rem
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconShare,
  IconBookmark,
  IconBook,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconPlus,
  IconLock,
  IconWorld,
  IconBuildingCastle,
  IconTimeline,
  IconNotes
} from '@tabler/icons-react';
import { Campaign, CampaignStatus, CampaignPrivacy } from '../../models/Campaign';
import { modals } from '@mantine/modals';
import { CampaignCharacters } from './CampaignCharacters';
import { CampaignLocations } from './CampaignLocations';
import CampaignSessions from './CampaignSessions';
import CampaignNotes from './CampaignNotes';

// Session interface (simplified)
interface Session {
  id: string;
  name: string;
  number: number;
  date?: Date;
  summary?: string;
  imageURL?: string;
}

// Character interface (simplified)
interface Character {
  id: string;
  name: string;
  characterType: string;
  isPlayerCharacter: boolean;
  imageURL?: string;
}

// Location interface (simplified)
interface Location {
  id: string;
  name: string;
  locationType: string;
  imageURL?: string;
}

// Props interface
interface CampaignDetailProps {
  campaign: Campaign;
  worldId?: string;
  sessions?: Session[];
  characters?: Character[];
  locations?: Location[];
  isLoading?: boolean;
  error?: string | null;
  onEditCampaign?: () => void;
  onDeleteCampaign?: () => void;
  onCreateSession?: () => void;
  onViewSession?: (sessionId: string) => void;
  onCreateCharacter?: () => void;
  onViewCharacter?: (characterId: string) => void;
  onCreateLocation?: () => void;
  onViewLocation?: (locationId: string) => void;
}

/**
 * Campaign Detail Component
 */
export function CampaignDetail({
  campaign,
  worldId,
  sessions = [],
  characters = [],
  locations = [],
  isLoading = false,
  error = null,
  onEditCampaign,
  onDeleteCampaign,
  onCreateSession,
  onViewSession,
  onCreateCharacter,
  onViewCharacter,
  onCreateLocation,
  onViewLocation
}: CampaignDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Handle edit campaign
  const handleEditCampaign = () => {
    if (onEditCampaign) {
      onEditCampaign();
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/edit`);
    } else {
      navigate(`/campaigns/${campaign.id}/edit`);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = () => {
    // Open confirmation modal
    modals.openConfirmModal({
      title: 'Delete Campaign',
      children: (
        <Text size="sm">
          Are you sure you want to delete this campaign? This action cannot be undone and will also delete all characters, locations, and other data associated with this campaign.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        if (onDeleteCampaign) {
          onDeleteCampaign();
        }
      },
    });
  };

  // Handle create session
  const handleCreateSession = () => {
    if (onCreateSession) {
      onCreateSession();
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/sessions/new`);
    } else {
      navigate(`/campaigns/${campaign.id}/sessions/new`);
    }
  };

  // Handle view session
  const handleViewSession = (sessionId: string) => {
    if (onViewSession) {
      onViewSession(sessionId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/sessions/${sessionId}`);
    } else {
      navigate(`/campaigns/${campaign.id}/sessions/${sessionId}`);
    }
  };

  // Handle create character
  const handleCreateCharacter = () => {
    if (onCreateCharacter) {
      onCreateCharacter();
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/characters/new`);
    } else {
      navigate(`/campaigns/${campaign.id}/characters/new`);
    }
  };

  // Handle view character
  const handleViewCharacter = (characterId: string) => {
    if (onViewCharacter) {
      onViewCharacter(characterId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/characters/${characterId}`);
    } else {
      navigate(`/campaigns/${campaign.id}/characters/${characterId}`);
    }
  };

  // Handle create location
  const handleCreateLocation = () => {
    if (onCreateLocation) {
      onCreateLocation();
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/locations/new`);
    } else {
      navigate(`/campaigns/${campaign.id}/locations/new`);
    }
  };

  // Handle view location
  const handleViewLocation = (locationId: string) => {
    if (onViewLocation) {
      onViewLocation(locationId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaign.id}/locations/${locationId}`);
    } else {
      navigate(`/campaigns/${campaign.id}/locations/${locationId}`);
    }
  };

  // Get status color
  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.PLANNING: return 'blue';
      case CampaignStatus.ACTIVE: return 'green';
      case CampaignStatus.PAUSED: return 'yellow';
      case CampaignStatus.COMPLETED: return 'teal';
      case CampaignStatus.ABANDONED: return 'red';
      case CampaignStatus.ARCHIVED: return 'gray';
      default: return 'gray';
    }
  };

  // Get progress value based on status
  const getProgressValue = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.PLANNING: return 10;
      case CampaignStatus.ACTIVE: return 50;
      case CampaignStatus.PAUSED: return 50;
      case CampaignStatus.COMPLETED: return 100;
      case CampaignStatus.ABANDONED: return 100;
      case CampaignStatus.ARCHIVED: return 100;
      default: return 0;
    }
  };

  return (
    <Stack gap="lg">
      {/* Campaign Header */}
      <Paper withBorder p="lg" radius="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Image
              src={campaign.imageURL || 'https://placehold.co/600x400?text=Campaign'}
              height={250}
              radius="md"
              alt={campaign.name}
              fallbackSrc="https://placehold.co/600x400?text=Campaign"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack>
              <Group justify="space-between">
                <Group>
                  <ThemeIcon size="xl" radius="md" color="blue">
                    <IconBook style={{ width: '24px', height: '24px' }} />
                  </ThemeIcon>
                  <Title order={2}>{campaign.name}</Title>
                </Group>

                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="lg">
                      <IconDotsVertical style={{ width: '18px', height: '18px' }} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit style={{ width: '14px', height: '14px' }} />}
                      onClick={handleEditCampaign}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconShare style={{ width: '14px', height: '14px' }} />}
                    >
                      Share
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBookmark style={{ width: '14px', height: '14px' }} />}
                    >
                      Bookmark
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash style={{ width: '14px', height: '14px' }} />}
                      onClick={handleDeleteCampaign}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Group gap="xs">
                <Badge color={getStatusColor(campaign.status)} size="lg">
                  {campaign.status}
                </Badge>

                {campaign.system && (
                  <Badge color="blue" size="lg">
                    {campaign.system}
                  </Badge>
                )}

                {campaign.systemVersion && (
                  <Badge color="blue" variant="outline" size="lg">
                    {campaign.systemVersion}
                  </Badge>
                )}

                {/* Privacy Badge */}
                {campaign.privacySetting === CampaignPrivacy.PRIVATE && (
                  <Tooltip label="Only GMs and players can view this campaign">
                    <Badge color="gray" variant="dot" size="lg" leftSection={<IconLock style={{ width: '12px', height: '12px' }} />}>
                      Private
                    </Badge>
                  </Tooltip>
                )}
                {campaign.privacySetting === CampaignPrivacy.PUBLIC && (
                  <Tooltip label="Anyone can view this campaign">
                    <Badge color="green" variant="dot" size="lg" leftSection={<IconWorld style={{ width: '12px', height: '12px' }} />}>
                      Public
                    </Badge>
                  </Tooltip>
                )}
              </Group>

              <Text>{campaign.description}</Text>

              <Group>
                <div>
                  <Text size="xs" c="dimmed">Setting</Text>
                  <Text>{campaign.setting}</Text>
                </div>

                {campaign.startDate && (
                  <div>
                    <Text size="xs" c="dimmed">Started</Text>
                    <Text>{campaign.startDate.toLocaleDateString()}</Text>
                  </div>
                )}

                {campaign.endDate && (
                  <div>
                    <Text size="xs" c="dimmed">Ended</Text>
                    <Text>{campaign.endDate.toLocaleDateString()}</Text>
                  </div>
                )}
              </Group>

              <Progress
                value={getProgressValue(campaign.status)}
                color={getStatusColor(campaign.status)}
                size="sm"
                mt="xs"
              />

              {campaign.tags && campaign.tags.length > 0 && (
                <Group gap="xs">
                  {campaign.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}

              {/* Players */}
              {campaign.playerIds && campaign.playerIds.length > 0 && (
                <Group>
                  <Text size="sm" fw={500}>Players:</Text>
                  <Group>
                    {campaign.playerIds.slice(0, 3).map((playerId) => (
                      <Avatar key={playerId} radius="xl" size="md" />
                    ))}
                    {campaign.playerIds.length > 3 && (
                      <Avatar radius="xl" size="md">+{campaign.playerIds.length - 3}</Avatar>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {campaign.playerIds.length} {campaign.playerIds.length === 1 ? 'player' : 'players'}
                  </Text>
                </Group>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Campaign Stats */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="blue">
              <IconCalendarEvent style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Sessions</Text>
              <Text fw={700} size="xl">{campaign.sessionCount || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="teal">
              <IconUsers style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Characters</Text>
              <Text fw={700} size="xl">{campaign.characterCount || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="violet">
              <IconMap style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Locations</Text>
              <Text fw={700} size="xl">{campaign.locationCount || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="pink">
              <IconBuildingCastle style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Factions</Text>
              <Text fw={700} size="xl">{campaign.factionCount || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="yellow">
              <IconSword style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Items</Text>
              <Text fw={700} size="xl">{campaign.itemCount || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="orange">
              <IconTimeline style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Story Arcs</Text>
              <Text fw={700} size="xl">{campaign.storyArcCount || 0}</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Campaign Content Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconBook style={{ width: '16px', height: '16px' }} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<IconCalendarEvent style={{ width: '16px', height: '16px' }} />}>
            Sessions
          </Tabs.Tab>
          <Tabs.Tab value="characters" leftSection={<IconUsers style={{ width: '16px', height: '16px' }} />}>
            Characters
          </Tabs.Tab>
          <Tabs.Tab value="locations" leftSection={<IconMap style={{ width: '16px', height: '16px' }} />}>
            Locations
          </Tabs.Tab>
          <Tabs.Tab value="notes" leftSection={<IconNotes style={{ width: '16px', height: '16px' }} />}>
            Notes
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Title order={3}>Campaign Overview</Title>
            <Text>{campaign.description}</Text>

            {/* Campaign Banner (if available) */}
            {campaign.bannerURL && (
              <Box>
                <Image
                  src={campaign.bannerURL}
                  alt={`Banner for ${campaign.name}`}
                  radius="md"
                />
              </Box>
            )}

            {/* Next Session (if scheduled) */}
            {campaign.nextSessionAt && (
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Next Session</Text>
                    <Text size="lg">{campaign.nextSessionAt.toLocaleDateString()} at {campaign.nextSessionAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </div>
                  <ThemeIcon size="xl" radius="md" color="blue">
                    <IconCalendarEvent style={{ width: '24px', height: '24px' }} />
                  </ThemeIcon>
                </Group>
              </Paper>
            )}

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Recent Sessions</Title>
                  <Button
                    variant="subtle"
                    onClick={() => setActiveTab('sessions')}
                  >
                    View All
                  </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {sessions.slice(0, 3).map((session) => (
                    <Card
                      key={session.id}
                      withBorder
                      padding="md"
                      radius="md"
                      onClick={() => handleViewSession(session.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Group justify="space-between">
                        <Text fw={500}>Session #{session.number}: {session.name}</Text>
                      </Group>

                      {session.date && (
                        <Text size="sm" c="dimmed">
                          {session.date.toLocaleDateString()}
                        </Text>
                      )}

                      {session.summary && (
                        <Text size="sm" lineClamp={2} mt="xs">
                          {session.summary}
                        </Text>
                      )}
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Key Characters */}
            {characters.length > 0 && (
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Key Characters</Title>
                  <Button
                    variant="subtle"
                    onClick={() => setActiveTab('characters')}
                  >
                    View All
                  </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                  {characters.slice(0, 4).map((character) => (
                    <Card
                      key={character.id}
                      withBorder
                      padding="md"
                      radius="md"
                      onClick={() => handleViewCharacter(character.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Section>
                        <Image
                          src={character.imageURL || 'https://placehold.co/400x400?text=Character'}
                          height={120}
                          alt={character.name}
                        />
                      </Card.Section>

                      <Group justify="space-between" mt="md">
                        <Text fw={500}>{character.name}</Text>
                        <Badge color={character.isPlayerCharacter ? 'blue' : 'gray'}>
                          {character.isPlayerCharacter ? 'PC' : 'NPC'}
                        </Badge>
                      </Group>

                      <Text size="sm" c="dimmed">
                        {character.characterType}
                      </Text>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Key Locations */}
            {locations.length > 0 && (
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Key Locations</Title>
                  <Button
                    variant="subtle"
                    onClick={() => setActiveTab('locations')}
                  >
                    View All
                  </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                  {locations.slice(0, 4).map((location) => (
                    <Card
                      key={location.id}
                      withBorder
                      padding="md"
                      radius="md"
                      onClick={() => handleViewLocation(location.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Section>
                        <Image
                          src={location.imageURL || 'https://placehold.co/400x400?text=Location'}
                          height={120}
                          alt={location.name}
                        />
                      </Card.Section>

                      <Group justify="space-between" mt="md">
                        <Text fw={500}>{location.name}</Text>
                      </Group>

                      <Text size="sm" c="dimmed">
                        {location.locationType}
                      </Text>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="sessions" pt="md">
          <CampaignSessions
            campaignId={campaign.id || ''}
            worldId={worldId}
          />
        </Tabs.Panel>

        <Tabs.Panel value="characters" pt="md">
          <CampaignCharacters
            campaignId={campaign.id || ''}
            worldId={worldId}
            characters={characters}
            loading={isLoading}
            error={error}
            onCreateCharacter={handleCreateCharacter}
            onViewCharacter={handleViewCharacter}
            onEditCharacter={handleEditCampaign}
            onDeleteCharacter={(characterId) => {
              // Implement character deletion logic
              console.log(`Delete character: ${characterId}`);
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="locations" pt="md">
          <CampaignLocations
            campaignId={campaign.id || ''}
            worldId={worldId}
            locations={locations}
            loading={isLoading}
            error={error}
            onCreateLocation={handleCreateLocation}
            onViewLocation={handleViewLocation}
            onEditLocation={handleEditCampaign}
            onDeleteLocation={(locationId) => {
              // Implement location deletion logic
              console.log(`Delete location: ${locationId}`);
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="notes" pt="md">
          <CampaignNotes
            campaignId={campaign.id || ''}
            worldId={worldId}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default CampaignDetail;