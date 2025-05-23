import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Menu,
  Card,
  Image,
  Paper,
  Stack,
  Avatar,
  SimpleGrid,
  Tabs,
  Alert,
  Breadcrumbs,
  Anchor,
  Skeleton,
  Tooltip
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconEye,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconArrowLeft,
  IconAlertCircle,
  IconUsersGroup,
  IconMapPin,
  IconUser,
  IconSword
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { FactionService } from '../../services/faction.service';
import { Faction, FactionType } from '../../models/Faction';
import { EntityType } from '../../models/EntityType';
import { RelationshipCountBadge } from '../../components/relationships/badges';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

// Extended Faction interface with computed properties
interface ExtendedFaction extends Faction {
  headquartersName?: string;
}

/**
 * Format faction type for display
 * @param type Faction type
 * @returns Formatted faction type
 */
function formatFactionType(type: FactionType): string {
  switch (type) {
    case FactionType.GUILD:
      return 'Guild';
    case FactionType.GOVERNMENT:
      return 'Government';
    case FactionType.RELIGIOUS:
      return 'Religious';
    case FactionType.CRIMINAL:
      return 'Criminal';
    case FactionType.MILITARY:
      return 'Military';
    case FactionType.MERCENARY:
      return 'Mercenary';
    case FactionType.MERCHANT:
      return 'Merchant';
    case FactionType.NOBLE:
      return 'Noble';
    case FactionType.TRIBAL:
      return 'Tribal';
    case FactionType.ARCANE:
      return 'Arcane';
    case FactionType.OTHER:
    default:
      return 'Other';
  }
}

/**
 * Get color for faction type
 * @param type Faction type
 * @returns Color for faction type
 */
function getFactionTypeColor(type: FactionType): string {
  switch (type) {
    case FactionType.GUILD:
      return 'blue';
    case FactionType.GOVERNMENT:
      return 'teal';
    case FactionType.RELIGIOUS:
      return 'violet';
    case FactionType.CRIMINAL:
      return 'red';
    case FactionType.MILITARY:
      return 'green';
    case FactionType.MERCENARY:
      return 'orange';
    case FactionType.MERCHANT:
      return 'yellow';
    case FactionType.NOBLE:
      return 'grape';
    case FactionType.TRIBAL:
      return 'lime';
    case FactionType.ARCANE:
      return 'indigo';
    case FactionType.OTHER:
    default:
      return 'gray';
  }
}

/**
 * Truncate text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Faction List Page
 * Displays a list of all factions
 */
export function FactionListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const worldFilter = location.state?.worldFilter;

  // State
  const [factions, setFactions] = useState<ExtendedFaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string | null>('table');

  // Get params at the component level
  const params = useParams();
  const campaignId = getCampaignIdFromParams(params);

  // Fetch factions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Create a faction service for global factions
        const factionService = FactionService.getInstance('global', 'global');
        let allFactions: Faction[] = [];

        // If worldFilter is provided, only get factions for that world
        if (worldFilter) {
          const worldFactionService = FactionService.getInstance(worldFilter, campaignId);
          allFactions = await worldFactionService.listEntities();
        } else {
          // Get all factions
          allFactions = await factionService.listEntities();
        }

        // Add computed properties to factions
        const extendedFactions: ExtendedFaction[] = allFactions.map(faction => ({
          ...faction,
          // Add a placeholder for headquartersName - in a real app, you would fetch this from the location service
          headquartersName: faction.headquartersId ? 'Headquarters Location' : undefined
        }));

        setFactions(extendedFactions);
      } catch (err) {
        console.error('Error fetching factions:', err);
        setError('Failed to load factions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldFilter, campaignId]);

  // Filter factions based on search query and selected type
  const filteredFactions = factions.filter(faction => {
    // Apply search filter
    const matchesSearch = !searchQuery ||
      (faction.name ? faction.name.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (faction.description && faction.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Apply type filter
    const matchesType = !selectedType || faction.factionType === selectedType;

    return matchesSearch && matchesType;
  });

  // Handle view faction
  const handleViewFaction = (factionId: string) => {
    if (!factionId) return;

    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'factions', factionId));
    } else {
      navigate(`/factions/${factionId}`);
    }
  };

  // Handle create faction
  const handleCreateFaction = () => {
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'factions', undefined, 'new'));
    } else {
      navigate('/factions/new');
    }
  };

  // Handle edit faction
  const handleEditFaction = (event: React.MouseEvent, factionId: string) => {
    event.stopPropagation();

    if (!factionId) return;

    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'factions', factionId, 'edit'));
    } else {
      navigate(`/factions/${factionId}/edit`);
    }
  };

  // Handle delete faction
  const handleDeleteFaction = async (event: React.MouseEvent, factionId: string) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this faction? This action cannot be undone.')) {
      return;
    }

    try {
      // Create appropriate faction service based on worldFilter
      const factionService = worldFilter
        ? FactionService.getInstance(worldFilter, campaignId)
        : FactionService.getInstance('global', 'global');

      await factionService.delete(factionId);

      // Remove the deleted faction from the state
      setFactions(factions.filter(faction => faction.id !== factionId));

      notifications.show({
        title: 'Faction Deleted',
        message: 'The faction has been deleted successfully',
        color: 'green',
      });
    } catch (err) {
      console.error('Error deleting faction:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete faction. Please try again.',
        color: 'red',
      });
    }
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => (
    <Breadcrumbs mb="md">
      <Anchor component="button" onClick={() => navigate('/dashboard')}>
        Dashboard
      </Anchor>
      {worldFilter && (
        <Anchor component="button" onClick={() => navigate(`/rpg-worlds/${worldFilter}`)}>
          World
        </Anchor>
      )}
      <Text>Factions</Text>
    </Breadcrumbs>
  );

  return (
    <Container size="xl">
      {renderBreadcrumbs()}

      <Group justify="space-between" mb="md">
        <Title order={2}>Factions</Title>
        <Button
          leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
          onClick={handleCreateFaction}
        >
          Create Faction
        </Button>
      </Group>

      <Group mb="md">
        <TextInput
          placeholder="Search factions..."
          leftSection={<IconSearch style={{ width: '16px', height: '16px' }} />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flex: 1 }}
        />

        <Select
          placeholder="Filter by type"
          data={[
            { value: '', label: 'All Types' },
            { value: FactionType.GUILD, label: 'Guild' },
            { value: FactionType.GOVERNMENT, label: 'Government' },
            { value: FactionType.RELIGIOUS, label: 'Religious' },
            { value: FactionType.CRIMINAL, label: 'Criminal' },
            { value: FactionType.MILITARY, label: 'Military' },
            { value: FactionType.MERCENARY, label: 'Mercenary' },
            { value: FactionType.MERCHANT, label: 'Merchant' },
            { value: FactionType.NOBLE, label: 'Noble' },
            { value: FactionType.TRIBAL, label: 'Tribal' },
            { value: FactionType.ARCANE, label: 'Arcane' },
            { value: FactionType.OTHER, label: 'Other' }
          ]}
          value={selectedType}
          onChange={setSelectedType}
          leftSection={<IconFilter style={{ width: '16px', height: '16px' }} />}
          clearable
          w={200}
        />

        <Tabs value={viewMode} onChange={setViewMode}>
          <Tabs.List>
            <Tabs.Tab value="table">Table</Tabs.Tab>
            <Tabs.Tab value="grid">Grid</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}

      {loading ? (
        viewMode === 'table' ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Scope</Table.Th>
                <Table.Th>Leader</Table.Th>
                <Table.Th>Headquarters</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array(5).fill(0).map((_, index) => (
                <Table.Tr key={index}>
                  <Table.Td><Skeleton height={20} width="80%" /></Table.Td>
                  <Table.Td><Skeleton height={20} width="60%" /></Table.Td>
                  <Table.Td><Skeleton height={20} width="40%" /></Table.Td>
                  <Table.Td><Skeleton height={20} width="70%" /></Table.Td>
                  <Table.Td><Skeleton height={20} width="50%" /></Table.Td>
                  <Table.Td><Skeleton height={20} width="30%" /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {Array(8).fill(0).map((_, index) => (
              <Card key={index} withBorder padding="lg" radius="md">
                <Skeleton height={20} width="80%" mb="sm" />
                <Skeleton height={15} width="40%" mb="xs" />
                <Skeleton height={60} mb="md" />
                <Group>
                  <Skeleton height={20} width="30%" />
                  <Skeleton height={20} width="30%" />
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )
      ) : filteredFactions.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="md">
            <IconUsersGroup size={48} color="gray" />
            <Title order={3}>No Factions Found</Title>
            <Text c="dimmed">
              {searchQuery || selectedType
                ? "No factions match your search criteria. Try adjusting your filters."
                : "You haven't created any factions yet. Click the button below to create your first faction."}
            </Text>
            <Button
              leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
              onClick={handleCreateFaction}
            >
              Create Faction
            </Button>
          </Stack>
        </Paper>
      ) : viewMode === 'table' ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Scope</Table.Th>
              <Table.Th>Leader</Table.Th>
              <Table.Th>Headquarters</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredFactions.map((faction) => (
              <Table.Tr
                key={faction.id}
                onClick={() => handleViewFaction(faction.id!)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td>
                  <Group gap="sm">
                    <Avatar
                      src={faction.imageURL}
                      radius="xl"
                      size="sm"
                      color={getFactionTypeColor(faction.factionType)}
                    >
                      {faction.name ? faction.name.charAt(0) : 'F'}
                    </Avatar>
                    {faction.name || 'Unnamed Faction'}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color={getFactionTypeColor(faction.factionType)}>
                    {formatFactionType(faction.factionType)}
                  </Badge>
                </Table.Td>
                <Table.Td>{faction.scope || 'Unknown'}</Table.Td>
                <Table.Td>{faction.leaderTitle ? `${faction.leaderTitle}` : 'None'}</Table.Td>
                <Table.Td>{faction.headquartersName || 'Unknown'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="View">
                      <ActionIcon
                        color="blue"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFaction(faction.id!);
                        }}
                      >
                        <IconEye style={{ width: '16px', height: '16px' }} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <ActionIcon
                        color="yellow"
                        variant="subtle"
                        onClick={(e) => handleEditFaction(e, faction.id!)}
                      >
                        <IconEdit style={{ width: '16px', height: '16px' }} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={(e) => handleDeleteFaction(e, faction.id!)}
                      >
                        <IconTrash style={{ width: '16px', height: '16px' }} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {filteredFactions.map((faction) => (
            <Card
              key={faction.id}
              withBorder
              padding="lg"
              radius="md"
              onClick={() => handleViewFaction(faction.id!)}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{faction.name || 'Unnamed Faction'}</Text>
                <Badge color={getFactionTypeColor(faction.factionType)}>
                  {formatFactionType(faction.factionType)}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                {truncateText(faction.description, 80)}
              </Text>

              {/* Scope */}
              {faction.scope && (
                <Group mb="xs">
                  <Text size="xs" fw={500}>Scope:</Text>
                  <Text size="xs">{faction.scope}</Text>
                </Group>
              )}

              {/* Leader */}
              {faction.leaderTitle && (
                <Group mb="xs">
                  <Text size="xs" fw={500}>Leader:</Text>
                  <Text size="xs">{faction.leaderTitle}</Text>
                </Group>
              )}

              {/* Headquarters */}
              {faction.headquartersName && (
                <Group mb="xs">
                  <Text size="xs" fw={500}>Headquarters:</Text>
                  <Text size="xs">{faction.headquartersName}</Text>
                </Group>
              )}

              {/* Relationship count */}
              <Group justify="space-between" mt="md">
                <Text size="xs" c="dimmed">Members: {faction.memberIds?.length || 0}</Text>
                <RelationshipCountBadge
                  entityId={faction.id || 'dashboard'}
                  entityType={EntityType.FACTION}
                  worldId={worldFilter || ''}
                  campaignId={worldFilter ? 'default-campaign' : ''}
                  size="sm"
                  variant="light"
                  color={getFactionTypeColor(faction.factionType)}
                />
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}

export default FactionListPage;
