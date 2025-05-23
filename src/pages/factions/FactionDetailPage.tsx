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
  List
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
  IconQuote,
  IconTarget,
  IconCrown,
  IconLock
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { FactionService } from '../../services/faction.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { Faction, FactionType } from '../../models/Faction';
import { Character } from '../../models/Character';
import { Location } from '../../models/Location';
import { Item } from '../../models/Item';
import { EntityType } from '../../models/EntityType';
import { ModelEntityType } from '../../models/ModelEntityType';
import { ItemType } from '../../models/ItemType';

/**
 * Faction Detail Page
 * Displays detailed information about a faction
 */
export function FactionDetailPage() {
  const { id = '', worldId = '' } = useParams<{ id: string; worldId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [faction, setFaction] = useState<Faction | null>(null);
  const [leader, setLeader] = useState<Character | null>(null);
  const [members, setMembers] = useState<Character[]>([]);
  const [headquarters, setHeadquarters] = useState<Location | null>(null);
  const [territories, setTerritories] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Load faction data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !worldId) {
        setError('Missing faction ID or world ID');
        setLoading(false);
        return;
      }

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(worldId);
        setWorldName(world?.name || 'Unknown World');

        // Get faction details
        const factionService = FactionService.getInstance(worldId, 'default-campaign');
        const factionData = await factionService.getById(id);

        if (factionData) {
          setFaction(factionData);

          // Load related entities
          const characterService = CharacterService.getInstance(worldId, 'default-campaign');
          const locationService = LocationService.getInstance(worldId, 'default-campaign');
          const itemService = ItemService.getInstance(worldId, 'default-campaign');

          // Load leader
          if (factionData.leaderId) {
            const leaderData = await characterService.getById(factionData.leaderId);
            // Add entityType to leader
            setLeader(leaderData ? {
              ...leaderData,
              entityType: EntityType.CHARACTER,
              characterType: leaderData.type || 'Other'
            } : null);
          }

          // Load members
          if (factionData.memberIds && factionData.memberIds.length > 0) {
            const membersData = await Promise.all(
              factionData.memberIds.map(id => characterService.getById(id))
            );
            // Add entityType to members
            setMembers(membersData.filter(Boolean).map(character => {
              if (!character) return null;
              return {
                ...character,
                entityType: EntityType.CHARACTER,
                characterType: character.type || 'Other',
                isPlayerCharacter: character.isPlayerCharacter || false
              };
            }).filter(Boolean) as Character[]);
          }

          // Load headquarters
          if (factionData.headquartersId) {
            const headquartersData = await locationService.getById(factionData.headquartersId);
            // Add entityType to headquarters
            setHeadquarters(headquartersData ? {
              ...headquartersData,
              entityType: EntityType.LOCATION,
              locationType: headquartersData.locationType || headquartersData.type || 'Other'
            } : null);
          }

          // Load territories
          if (factionData.territoryIds && factionData.territoryIds.length > 0) {
            const territoriesData = await Promise.all(
              factionData.territoryIds.map(id => locationService.getById(id))
            );
            // Add entityType to territories
            setTerritories(territoriesData.filter(Boolean).map(location => {
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
          if (factionData.itemIds && factionData.itemIds.length > 0) {
            const itemsData = await Promise.all(
              factionData.itemIds.map(id => itemService.getById(id))
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
        } else {
          setError('Faction not found');
        }
      } catch (err) {
        console.error('Error loading faction:', err);
        setError('Failed to load faction. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, worldId]);

  // Handle edit faction
  const handleEditFaction = () => {
    navigate(`/rpg-worlds/${worldId}/factions/${id}/edit`);
  };

  // Handle delete faction
  const handleDeleteFaction = async () => {
    if (window.confirm('Are you sure you want to delete this faction?')) {
      try {
        const factionService = FactionService.getInstance(worldId, 'default-campaign');
        await factionService.delete(id);

        notifications.show({
          title: 'Faction Deleted',
          message: 'The faction has been deleted successfully',
          color: 'green',
        });

        // Navigate back to factions list
        navigate(`/rpg-worlds/${worldId}/factions`);
      } catch (error) {
        console.error('Error deleting faction:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete faction. Please try again.',
          color: 'red',
        });
      }
    }
  };

  // Get faction type color
  const getFactionTypeColor = (factionType: string): string => {
    switch (factionType) {
      case FactionType.GUILD: return 'blue';
      case FactionType.KINGDOM: return 'indigo';
      case FactionType.CULT: return 'purple';
      case FactionType.MILITARY: return 'red';
      case FactionType.CRIMINAL: return 'dark';
      case FactionType.RELIGIOUS: return 'yellow';
      case FactionType.POLITICAL: return 'orange';
      case FactionType.MERCANTILE: return 'green';
      case FactionType.ARCANE: return 'violet';
      case FactionType.TRIBAL: return 'teal';
      default: return 'gray';
    }
  };

  // Format faction type for display
  const formatFactionType = (factionType: string): string => {
    return factionType.charAt(0) + factionType.slice(1).toLowerCase().replace('_', ' ');
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Factions', href: `/rpg-worlds/${worldId}/factions` },
    { title: faction?.name || 'Faction Details', href: `/rpg-worlds/${worldId}/factions/${id}` },
  ];

  // Show loading or error state
  if (loading) {
    return (
      <Container size="lg">
        <Text>Loading faction details...</Text>
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
          to={`/rpg-worlds/${worldId}/factions`}
        >
          Back to Factions
        </Button>
      </Container>
    );
  }

  if (!faction) {
    return (
      <Container size="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Not Found" color="yellow">
          Faction not found
        </Alert>
        <Button
          leftSection={<IconArrowLeft size="1rem" />}
          mt="md"
          component={Link}
          to={`/rpg-worlds/${worldId}/factions`}
        >
          Back to Factions
        </Button>
      </Container>
    );
  }

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
            <Badge size="lg" color={getFactionTypeColor(faction.factionType)}>
              {formatFactionType(faction.factionType)}
            </Badge>
            <Title order={1}>{faction.name}</Title>
            {faction.motto && (
              <Group gap="xs">
                <IconQuote size="1rem" />
                <Text fs="italic">"{faction.motto}"</Text>
              </Group>
            )}
          </Stack>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconArrowLeft size="1rem" />}
              component={Link}
              to={`/rpg-worlds/${worldId}/factions`}
            >
              Back
            </Button>
            <Button
              leftSection={<IconEdit size="1rem" />}
              onClick={handleEditFaction}
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
                  onClick={handleDeleteFaction}
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
            <Tabs.Tab value="overview" leftSection={<IconTarget size="0.8rem" />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="members" leftSection={<IconUsers size="0.8rem" />}>
              Members
            </Tabs.Tab>
            <Tabs.Tab value="locations" leftSection={<IconMapPin size="0.8rem" />}>
              Locations
            </Tabs.Tab>
            <Tabs.Tab value="assets" leftSection={<IconBriefcase size="0.8rem" />}>
              Assets
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
                <Grid.Col span={{ base: 12, md: faction.imageURL ? 8 : 12 }}>
                  <Stack gap="md">
                    <Title order={3}>Description</Title>
                    {faction.description ? (
                      <Text>{faction.description}</Text>
                    ) : (
                      <Text c="dimmed" fs="italic">No description available</Text>
                    )}

                    <Divider />

                    <Title order={3}>Goals</Title>
                    {faction.goals && faction.goals.length > 0 ? (
                      <List>
                        {faction.goals.map((goal, index) => (
                          <List.Item key={index}>{goal}</List.Item>
                        ))}
                      </List>
                    ) : (
                      <Text c="dimmed" fs="italic">No goals listed</Text>
                    )}

                    <Divider />

                    <Title order={3}>Resources & Scope</Title>
                    <Grid>
                      <Grid.Col span={6}>
                        <Text fw={700}>Resources:</Text>
                        <Text>{faction.resources || 'Unknown'}</Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text fw={700}>Scope:</Text>
                        <Text>{faction.scope || 'Unknown'}</Text>
                      </Grid.Col>
                    </Grid>

                    <Divider />

                    <Title order={3}>Leadership</Title>
                    {leader ? (
                      <Card withBorder p="sm">
                        <Group>
                          <Avatar radius="xl" color="blue">
                            {leader.name ? leader.name.charAt(0) : 'L'}
                          </Avatar>
                          <div>
                            <Text fw={500}>{leader.name}</Text>
                            <Text size="sm">{faction.leaderTitle || 'Leader'}</Text>
                          </div>
                        </Group>
                      </Card>
                    ) : (
                      <Text c="dimmed" fs="italic">No leader assigned</Text>
                    )}
                  </Stack>
                </Grid.Col>

                {faction.imageURL && (
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card withBorder>
                      <Card.Section>
                        <Image
                          src={faction.imageURL}
                          alt={faction.name}
                          height={300}
                          fit="cover"
                        />
                      </Card.Section>
                    </Card>
                  </Grid.Col>
                )}
              </Grid>
            </Tabs.Panel>

            {/* Members Tab */}
            <Tabs.Panel value="members">
              <Stack gap="md">
                <Title order={3}>Members</Title>
                {members.length > 0 ? (
                  <Grid>
                    {members.map((member) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={member.id}>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar
                              src={member.imageURL}
                              radius="xl"
                              color="blue"
                            >
                              {member.name ? member.name.charAt(0) : 'M'}
                            </Avatar>
                            <div>
                              <Text fw={500}>{member.name}</Text>
                              <Text size="xs" c="dimmed">
                                {member.characterType || 'Member'}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No members recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Locations Tab */}
            <Tabs.Panel value="locations">
              <Stack gap="md">
                <Title order={3}>Headquarters</Title>
                {headquarters ? (
                  <Card withBorder p="sm">
                    <Group>
                      <Avatar radius="xl" color="teal">
                        <IconMapPin size="1rem" />
                      </Avatar>
                      <div>
                        <Text fw={500}>{headquarters.name}</Text>
                        <Badge size="xs">{headquarters.locationType}</Badge>
                      </div>
                    </Group>
                    {headquarters.description && (
                      <Text size="sm" mt="xs">{headquarters.description}</Text>
                    )}
                  </Card>
                ) : (
                  <Text c="dimmed" fs="italic">No headquarters assigned</Text>
                )}

                <Divider />

                <Title order={3}>Territories</Title>
                {territories.length > 0 ? (
                  <Grid>
                    {territories.map((territory) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={territory.id}>
                        <Card withBorder p="sm">
                          <Group>
                            <Avatar radius="xl" color="teal">
                              <IconMapPin size="1rem" />
                            </Avatar>
                            <div>
                              <Text fw={500}>{territory.name}</Text>
                              <Badge size="xs">{territory.locationType}</Badge>
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No territories recorded</Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Assets Tab */}
            <Tabs.Panel value="assets">
              <Stack gap="md">
                <Title order={3}>Items & Assets</Title>
                {items.length > 0 ? (
                  <Grid>
                    {items.map((item) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={item.id}>
                        <Card withBorder p="sm">
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
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" fs="italic">No items recorded</Text>
                )}
              </Stack>
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

                <Divider label="Secret Notes" />
                {faction.secretNotes ? (
                  <Text>{faction.secretNotes}</Text>
                ) : (
                  <Text c="dimmed" fs="italic">No secret notes available</Text>
                )}

                <Divider label="Hidden Goals" />
                {faction.hiddenGoals && faction.hiddenGoals.length > 0 ? (
                  <List>
                    {faction.hiddenGoals.map((goal, index) => (
                      <List.Item key={index}>{goal}</List.Item>
                    ))}
                  </List>
                ) : (
                  <Text c="dimmed" fs="italic">No hidden goals listed</Text>
                )}
              </Stack>
            </Tabs.Panel>
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default FactionDetailPage;
