import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Stack,
  Badge,
  Divider,
  Avatar,
  Grid,
  Card,
  ActionIcon,
  Menu,
  Tabs,
  Alert,
  Anchor,
  Breadcrumbs,
  Image,
  List,
  Table,
  Progress
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconUsers,
  IconMapPin,
  IconBriefcase,
  IconAlertCircle,
  IconDotsVertical,
  IconBook,
  IconTimeline,
  IconTarget,
  IconCalendarEvent,
  IconCheck,
  IconX,
  IconLock,
  IconNetwork
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { StoryArcService } from '../../services/storyArc.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { FactionService } from '../../services/faction.service';
import { SessionService } from '../../services/session.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { StoryArc, StoryArcType, StoryArcStatus, Clue } from '../../models/StoryArc';
import { Character } from '../../models/Character';
import { Location } from '../../models/Location';
import { Item } from '../../models/Item';
import { Faction } from '../../models/Faction';
import { Session } from '../../models/Session';
import { EntityType } from '../../models/EntityType';
import { ModelEntityType } from '../../models/ModelEntityType';
import { ItemType } from '../../models/ItemType';

/**
 * Story Arc Detail Page
 * Displays detailed information about a story arc
 */
export function StoryArcDetailPage() {
  const { id = '', worldId = '', campaignId = 'default-campaign' } = useParams<{ id: string; worldId: string; campaignId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [storyArc, setStoryArc] = useState<StoryArc | null>(null);
  const [parentArc, setParentArc] = useState<StoryArc | null>(null);
  const [childArcs, setChildArcs] = useState<StoryArc[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [startSession, setStartSession] = useState<Session | null>(null);
  const [endSession, setEndSession] = useState<Session | null>(null);
  const [relatedSessions, setRelatedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Load story arc data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !worldId) {
        setError('Missing story arc ID or world ID');
        setLoading(false);
        return;
      }

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(worldId);
        setWorldName(world?.name || 'Unknown World');

        // Get story arc details
        const storyArcService = StoryArcService.getInstance(worldId, campaignId);
        const storyArcData = await storyArcService.getById(id);

        if (storyArcData) {
          setStoryArc(storyArcData);

          // Load related entities
          const characterService = CharacterService.getInstance(worldId, campaignId);
          const locationService = LocationService.getInstance(worldId, campaignId);
          const itemService = ItemService.getInstance(worldId, campaignId);
          const factionService = FactionService.getInstance(worldId, campaignId);
          const sessionService = SessionService.getInstance(worldId, campaignId);

          // Load parent arc if exists
          if (storyArcData.parentArcId) {
            const parentArcData = await storyArcService.getById(storyArcData.parentArcId);
            setParentArc(parentArcData);
          }

          // Load child arcs if any
          if (storyArcData.childArcIds && storyArcData.childArcIds.length > 0) {
            const childArcsData = await Promise.all(
              storyArcData.childArcIds.map(childId => storyArcService.getById(childId))
            );
            setChildArcs(childArcsData.filter(Boolean) as StoryArc[]);
          } else {
            // Try to find child arcs by querying
            const allArcs = await storyArcService.getStoryArcsByParent(id);
            if (allArcs.length > 0) {
              setChildArcs(allArcs);
            }
          }

          // Load characters
          if (storyArcData.characterIds && storyArcData.characterIds.length > 0) {
            const charactersData = await Promise.all(
              storyArcData.characterIds.map(charId => characterService.getById(charId))
            );
            // Add entityType to characters
            setCharacters(charactersData.filter(Boolean).map(character => {
              if (!character) return null;
              return {
                ...character,
                entityType: EntityType.CHARACTER,
                characterType: character.type || 'Other',
                isPlayerCharacter: character.isPlayerCharacter || false,
                createdBy: character.createdBy || 'system'
              };
            }).filter(Boolean) as Character[]);
          }

          // Load locations
          if (storyArcData.locationIds && storyArcData.locationIds.length > 0) {
            const locationsData = await Promise.all(
              storyArcData.locationIds.map(locId => locationService.getById(locId))
            );
            // Add entityType to locations
            setLocations(locationsData.filter(Boolean).map(location => {
              if (!location) return null;
              return {
                ...location,
                entityType: EntityType.LOCATION,
                locationType: location.locationType || location.type || 'Other',
                name: location.name || 'Unknown Location',
                createdBy: location.createdBy || 'system'
              };
            }).filter(Boolean) as Location[]);
          }

          // Load items
          if (storyArcData.itemIds && storyArcData.itemIds.length > 0) {
            const itemsData = await Promise.all(
              storyArcData.itemIds.map(itemId => itemService.getById(itemId))
            );
            // Add entityType to items
            setItems(itemsData.filter(Boolean).map(item => {
              if (!item) return null;
              return {
                ...item,
                entityType: EntityType.ITEM,
                itemType: item.type ? (item.type as ItemType) : ItemType.OTHER
              };
            }).filter(Boolean) as Item[]);
          }

          // Load factions
          if (storyArcData.factionIds && storyArcData.factionIds.length > 0) {
            const factionsData = await Promise.all(
              storyArcData.factionIds.map(factionId => factionService.getById(factionId))
            );
            setFactions(factionsData.filter(Boolean) as Faction[]);
          }

          // Load sessions
          if (storyArcData.startSessionId) {
            const startSessionData = await sessionService.getById(storyArcData.startSessionId);
            // Add entityType to start session
            setStartSession(startSessionData ? {
              ...startSessionData,
              entityType: EntityType.SESSION,
              name: startSessionData.title || `Session #${startSessionData.number}`
            } : null);
          }

          if (storyArcData.endSessionId) {
            const endSessionData = await sessionService.getById(storyArcData.endSessionId);
            // Add entityType to end session
            setEndSession(endSessionData ? {
              ...endSessionData,
              entityType: EntityType.SESSION,
              name: endSessionData.title || `Session #${endSessionData.number}`
            } : null);
          }

          if (storyArcData.relatedSessionIds && storyArcData.relatedSessionIds.length > 0) {
            const sessionsData = await Promise.all(
              storyArcData.relatedSessionIds.map(sessionId => sessionService.getById(sessionId))
            );
            // Add entityType to related sessions
            setRelatedSessions(sessionsData.filter(Boolean).map(session => {
              if (!session) return null;
              return {
                ...session,
                entityType: EntityType.SESSION,
                name: session.title || `Session #${session.number || 0}`,
                number: session.number || 0,
                createdBy: session.createdBy || 'system'
              };
            }).filter(Boolean) as Session[]);
          }
        } else {
          setError('Story arc not found');
        }
      } catch (err) {
        console.error('Error loading story arc:', err);
        setError('Failed to load story arc. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, worldId, campaignId]);

  // Handle edit story arc
  const handleEditStoryArc = () => {
    navigate(`/rpg-worlds/${worldId}/story-arcs/${id}/edit`);
  };

  // Handle delete story arc
  const handleDeleteStoryArc = async () => {
    if (window.confirm('Are you sure you want to delete this story arc?')) {
      try {
        const storyArcService = StoryArcService.getInstance(worldId, campaignId);
        await storyArcService.delete(id);

        notifications.show({
          title: 'Story Arc Deleted',
          message: 'The story arc has been deleted successfully',
          color: 'green',
        });

        // Navigate back to story arcs list
        navigate(`/rpg-worlds/${worldId}/story-arcs`);
      } catch (error) {
        console.error('Error deleting story arc:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete story arc. Please try again.',
          color: 'red',
        });
      }
    }
  };

  // Get arc type color
  const getArcTypeColor = (arcType: string): string => {
    switch (arcType) {
      case StoryArcType.MAIN_PLOT: return 'blue';
      case StoryArcType.SIDE_QUEST: return 'green';
      case StoryArcType.CHARACTER_ARC: return 'orange';
      case StoryArcType.BACKGROUND_PLOT: return 'gray';
      case StoryArcType.FACTION_ARC: return 'indigo';
      case StoryArcType.LOCATION_ARC: return 'teal';
      case StoryArcType.ITEM_ARC: return 'yellow';
      default: return 'gray';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case StoryArcStatus.UPCOMING: return 'blue';
      case StoryArcStatus.ONGOING: return 'green';
      case StoryArcStatus.PAUSED: return 'yellow';
      case StoryArcStatus.COMPLETED: return 'teal';
      case StoryArcStatus.FAILED: return 'red';
      case StoryArcStatus.ABANDONED: return 'gray';
      default: return 'gray';
    }
  };

  // Format arc type for display
  const formatArcType = (arcType: string): string => {
    return arcType.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Calculate progress based on clues discovered
  const calculateProgress = (): { percent: number; discovered: number; total: number } => {
    if (!storyArc?.clues || storyArc.clues.length === 0) {
      return { percent: 0, discovered: 0, total: 0 };
    }

    const discovered = storyArc.clues.filter(clue => clue.discovered).length;
    const total = storyArc.clues.length;
    const percent = Math.round((discovered / total) * 100);

    return { percent, discovered, total };
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Story Arcs', href: `/rpg-worlds/${worldId}/story-arcs` },
    { title: storyArc?.name || 'Story Arc Details', href: `/rpg-worlds/${worldId}/story-arcs/${id}` },
  ];

  // Show loading or error state
  if (loading) {
    return (
      <Container size="lg">
        <Text>Loading story arc details...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
        <Button
          leftSection={<IconArrowLeft size="1rem" />}
          mt="md"
          component={Link}
          to={`/rpg-worlds/${worldId}/story-arcs`}
        >
          Back to Story Arcs
        </Button>
      </Container>
    );
  }

  if (!storyArc) {
    return (
      <Container size="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Not Found" color="yellow">
          Story arc not found
        </Alert>
        <Button
          leftSection={<IconArrowLeft size="1rem" />}
          mt="md"
          component={Link}
          to={`/rpg-worlds/${worldId}/story-arcs`}
        >
          Back to Story Arcs
        </Button>
      </Container>
    );
  }

  const progress = calculateProgress();

  return (
    <Container size="lg">
      <Stack gap="md">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <Anchor
              key={index}
              component={Link}
              to={item.href}
              c={index === breadcrumbItems.length - 1 ? 'dimmed' : undefined}
              underline={index === breadcrumbItems.length - 1 ? 'never' : 'always'}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="xs">
              <Badge size="lg" color={getArcTypeColor(storyArc.arcType)}>
                {formatArcType(storyArc.arcType)}
              </Badge>
              <Badge size="lg" color={getStatusColor(storyArc.status)}>
                {formatStatus(storyArc.status)}
              </Badge>
              {storyArc.importance && (
                <Badge size="lg" color="gray">
                  Importance: {storyArc.importance}/10
                </Badge>
              )}
            </Group>
            <Title order={1}>{storyArc.name}</Title>
          </Stack>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconArrowLeft size="1rem" />}
              component={Link}
              to={`/rpg-worlds/${worldId}/story-arcs`}
            >
              Back
            </Button>
            <Button
              leftSection={<IconEdit size="1rem" />}
              onClick={handleEditStoryArc}
            >
              Edit
            </Button>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg">
                  <IconDotsVertical size="1rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconTrash size="1rem" />}
                  color="red"
                  onClick={handleDeleteStoryArc}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Content Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconBook size="0.8rem" />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="clues" leftSection={<IconTarget size="0.8rem" />}>
              Clues & Progress
            </Tabs.Tab>
            <Tabs.Tab value="timeline" leftSection={<IconTimeline size="0.8rem" />}>
              Timeline
            </Tabs.Tab>
            <Tabs.Tab value="relationships" leftSection={<IconNetwork size="0.8rem" />}>
              Relationships
            </Tabs.Tab>
            {currentUser && (
              <Tabs.Tab value="gm-notes" leftSection={<IconLock size="0.8rem" />}>
                GM Notes
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Paper p="md" withBorder mt="xs">
            {/* Overview Tab */}
            <Tabs.Panel value="overview">
              <Grid>
                <Grid.Col span={{ base: 12, md: storyArc.imageURL ? 8 : 12 }}>
                  <Stack gap="md">
                    <Title order={3}>Description</Title>
                    {storyArc.description ? (
                      <Text>{storyArc.description}</Text>
                    ) : (
                      <Text c="dimmed" fs="italic">No description available</Text>
                    )}

                    <Divider />

                    {/* Parent Arc */}
                    <Title order={3}>Story Arc Structure</Title>
                    {parentArc && (
                      <>
                        <Text fw={700}>Parent Arc:</Text>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar radius="xl" color={getArcTypeColor(parentArc.arcType)}>
                              <IconBook size="1rem" />
                            </Avatar>
                            <div>
                              <Text fw={500}>{parentArc.name}</Text>
                              <Badge size="xs" color={getArcTypeColor(parentArc.arcType)}>
                                {formatArcType(parentArc.arcType)}
                              </Badge>
                              <Badge size="xs" color={getStatusColor(parentArc.status)}>
                                {formatStatus(parentArc.status)}
                              </Badge>
                            </div>
                          </Group>
                        </Card>
                      </>
                    )}

                    {/* Child Arcs */}
                    {childArcs.length > 0 && (
                      <>
                        <Text fw={700}>Child Arcs:</Text>
                        <Grid>
                          {childArcs.map((childArc) => (
                            <Grid.Col span={{ base: 12, sm: 6 }} key={childArc.id}>
                              <Card withBorder p="sm">
                                <Group>
                                  <Avatar radius="xl" color={getArcTypeColor(childArc.arcType)}>
                                    <IconBook size="1rem" />
                                  </Avatar>
                                  <div>
                                    <Text fw={500}>{childArc.name}</Text>
                                    <Group gap="xs">
                                      <Badge size="xs" color={getArcTypeColor(childArc.arcType)}>
                                        {formatArcType(childArc.arcType)}
                                      </Badge>
                                      <Badge size="xs" color={getStatusColor(childArc.status)}>
                                        {formatStatus(childArc.status)}
                                      </Badge>
                                    </Group>
                                  </div>
                                </Group>
                              </Card>
                            </Grid.Col>
                          ))}
                        </Grid>
                      </>
                    )}

                    <Divider />

                    {/* Resolution */}
                    {storyArc.resolution && (
                      <>
                        <Title order={3}>Resolution</Title>
                        <Text>{storyArc.resolution}</Text>
                        <Divider />
                      </>
                    )}
                  </Stack>
                </Grid.Col>

                {storyArc.imageURL && (
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card withBorder>
                      <Card.Section>
                        <Image
                          src={storyArc.imageURL}
                          alt={storyArc.name}
                          height={300}
                          fit="cover"
                        />
                      </Card.Section>
                    </Card>
                  </Grid.Col>
                )}
              </Grid>
            </Tabs.Panel>

            {/* Clues & Progress Tab */}
            <Tabs.Panel value="clues">
              <Stack gap="md">
                <Title order={3}>Progress</Title>
                {progress.total > 0 ? (
                  <>
                    <Group>
                      <Text>{progress.discovered} of {progress.total} clues discovered</Text>
                      <Badge color={progress.percent === 100 ? 'green' : 'blue'}>
                        {progress.percent}% Complete
                      </Badge>
                    </Group>
                    <Progress value={progress.percent} size="xl" />
                  </>
                ) : (
                  <Text c="dimmed" fs="italic">No clues recorded for this story arc</Text>
                )}

                <Divider />

                <Title order={3}>Clues & Mysteries</Title>
                {storyArc.clues && storyArc.clues.length > 0 ? (
                  <Table striped withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Location</Table.Th>
                        <Table.Th>Discovered By</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {storyArc.clues.map((clue) => (
                        <Table.Tr key={clue.id}>
                          <Table.Td>{clue.description}</Table.Td>
                          <Table.Td>
                            {clue.discovered ? (
                              <Badge color="green" leftSection={<IconCheck size="0.8rem" />}>
                                Discovered
                              </Badge>
                            ) : (
                              <Badge color="red" leftSection={<IconX size="0.8rem" />}>
                                Hidden
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {clue.locationId ? (
                              locations.find(loc => loc.id === clue.locationId)?.name || 'Unknown Location'
                            ) : (
                              'N/A'
                            )}
                          </Table.Td>
                          <Table.Td>
                            {clue.characterId ? (
                              characters.find(char => char.id === clue.characterId)?.name || 'Unknown Character'
                            ) : (
                              'N/A'
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text c="dimmed" fs="italic">No clues recorded for this story arc</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Timeline Tab */}
            <Tabs.Panel value="timeline">
              <Stack gap="md">
                <Title order={3}>Timeline</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Text fw={700}>Starting Session:</Text>
                    {startSession ? (
                      <Card withBorder p="sm">
                        <Group>
                          <Avatar radius="xl" color="blue">
                            <IconCalendarEvent size="1rem" />
                          </Avatar>
                          <div>
                            <Text fw={500}>Session #{startSession.number}: {startSession.title}</Text>
                          </div>
                        </Group>
                      </Card>
                    ) : (
                      <Text c="dimmed" fs="italic">Not specified</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text fw={700}>Ending Session:</Text>
                    {endSession ? (
                      <Card withBorder p="sm">
                        <Group>
                          <Avatar radius="xl" color="blue">
                            <IconCalendarEvent size="1rem" />
                          </Avatar>
                          <div>
                            <Text fw={500}>Session #{endSession.number}: {endSession.title}</Text>
                          </div>
                        </Group>
                      </Card>
                    ) : (
                      <Text c="dimmed" fs="italic">Not specified</Text>
                    )}
                  </Grid.Col>
                </Grid>

                <Divider />

                <Title order={3}>Related Sessions</Title>
                {relatedSessions.length > 0 ? (
                  <Grid>
                    {relatedSessions.map((session) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={session.id}>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar radius="xl" color="blue">
                              <IconCalendarEvent size="1rem" />
                            </Avatar>
                            <div>
                              <Text fw={500}>Session #{session.number}: {session.title}</Text>
                              <Badge size="xs" color={session.status === 'completed' ? 'green' : 'blue'}>
                                {session.status && typeof session.status === 'string' ?
                                  session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Planned'}
                              </Badge>
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No related sessions recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Relationships Tab */}
            <Tabs.Panel value="relationships">
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Title order={3}>Characters</Title>
                    {characters.length > 0 ? (
                      <Stack gap="xs">
                        {characters.map((character) => (
                          <Card withBorder p="sm" key={character.id}>
                            <Group>
                              <Avatar
                                src={character.imageURL}
                                radius="xl"
                                color="blue"
                              >
                                {character.name ? character.name.charAt(0) : 'C'}
                              </Avatar>
                              <div>
                                <Text fw={500}>{character.name}</Text>
                                <Text size="xs" c="dimmed">
                                  {character.characterType || 'Character'}
                                </Text>
                              </div>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Text c="dimmed" fs="italic">No characters involved</Text>
                    )}

                    <Title order={3}>Locations</Title>
                    {locations.length > 0 ? (
                      <Stack gap="xs">
                        {locations.map((location) => (
                          <Card withBorder p="sm" key={location.id}>
                            <Group>
                              <Avatar radius="xl" color="teal">
                                <IconMapPin size="1rem" />
                              </Avatar>
                              <div>
                                <Text fw={500}>{location.name}</Text>
                                <Badge size="xs">{location.locationType}</Badge>
                              </div>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Text c="dimmed" fs="italic">No locations involved</Text>
                    )}
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Title order={3}>Factions</Title>
                    {factions.length > 0 ? (
                      <Stack gap="xs">
                        {factions.map((faction) => (
                          <Card withBorder p="sm" key={faction.id}>
                            <Group>
                              <Avatar
                                src={faction.imageURL}
                                radius="xl"
                                color="indigo"
                              >
                                <IconUsers size="1rem" />
                              </Avatar>
                              <div>
                                <Text fw={500}>{faction.name}</Text>
                                <Badge size="xs">{faction.factionType}</Badge>
                              </div>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Text c="dimmed" fs="italic">No factions involved</Text>
                    )}

                    <Title order={3}>Items</Title>
                    {items.length > 0 ? (
                      <Stack gap="xs">
                        {items.map((item) => (
                          <Card withBorder p="sm" key={item.id}>
                            <Group>
                              <Avatar
                                src={item.imageURL}
                                radius="xl"
                                color="orange"
                              >
                                <IconBriefcase size="1rem" />
                              </Avatar>
                              <div>
                                <Text fw={500}>{item.name}</Text>
                                <Badge size="xs">{item.itemType}</Badge>
                              </div>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Text c="dimmed" fs="italic">No items involved</Text>
                    )}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            {/* GM Notes Tab */}
            <Tabs.Panel value="gm-notes">
              <Stack gap="md">
                <Group>
                  <Title order={3}>GM Notes</Title>
                  <Badge color="red" leftSection={<IconLock size="0.8rem" />}>
                    Private
                  </Badge>
                </Group>

                <Title order={4}>Next Steps</Title>
                {storyArc.nextSteps ? (
                  <Text>{storyArc.nextSteps}</Text>
                ) : (
                  <Text c="dimmed" fs="italic">No next steps recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default StoryArcDetailPage;
