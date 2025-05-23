import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Breadcrumbs,
  Anchor,
  Stack,
  Alert,
  Skeleton,
  Table,
  Badge,
  ActionIcon,
  Menu,
  Tabs,
  TextInput,
  Select,
  Paper,
  Avatar,
  SimpleGrid,
  Card,
  Image,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconUsers,
  IconArrowLeft,
} from '@tabler/icons-react';
// Using Character interface from service to ensure compatibility with database schema
import { Character } from '../../services/character.service';
import { CharacterService } from '../../services/character.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * RPG World Characters Page
 * Displays characters specific to a world with filtering, table/grid views,
 * and CRUD operations
 *
 * @returns JSX.Element - The rendered component
 */
export function RPGWorldCharactersPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { worldId = '' } = useParams<{ worldId: string }>();
  const { currentUser } = useAuth();

  // State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  // Get all params at the component level
  const params = useParams();

  /**
   * Fetch world name and characters when worldId changes
   */
  useEffect(() => {
    /**
     * Async function to fetch data from services
     */
    const fetchData = async (): Promise<void> => {
      // Get worldId and campaignId from params using utility functions
      const currentWorldId = getWorldIdFromParams({ worldId });
      const campaignId = getCampaignIdFromParams(params);

      if (!currentWorldId) {
        setError('No world ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(currentWorldId);
        setWorldName(world?.name || 'Unknown World');

        // Get characters for this world
        const characterService = CharacterService.getInstance(currentWorldId, campaignId);
        const worldCharacters = await characterService.listEntities();
        setCharacters(worldCharacters);
      } catch (err) {
        console.error('Error fetching world characters:', err);
        setError('Failed to load characters. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId, params]);

  /**
   * Filter characters based on search query and selected type
   */
  const filteredCharacters: Character[] = characters.filter(character => {
    const matchesSearch: boolean = searchQuery === '' ||
      (character.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType: boolean = !selectedType ||
      (character.characterType === selectedType);

    return matchesSearch && matchesType;
  });

  /**
   * Handle create character navigation
   */
  const handleCreateCharacter = (): void => {
    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'characters', undefined, 'new'));
  };

  /**
   * Handle view character navigation
   * @param characterId Character ID
   */
  const handleViewCharacter = (characterId: string): void => {
    if (!characterId) {
      console.error('Character ID is undefined');
      return;
    }

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'characters', characterId));
  };

  /**
   * Handle edit character navigation
   * @param event Mouse event
   * @param characterId Character ID
   */
  const handleEditCharacter = (event: React.MouseEvent, characterId: string): void => {
    if (!characterId) {
      console.error('Character ID is undefined');
      return;
    }
    event.stopPropagation();

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'characters', characterId, 'edit'));
  };

  /**
   * Handle character deletion
   * @param event Mouse event
   * @param characterId Character ID
   */
  const handleDeleteCharacter = async (event: React.MouseEvent, characterId: string): Promise<void> => {
    if (!characterId) {
      console.error('Character ID is undefined');
      return;
    }
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        // Get worldId and campaignId from params using utility functions
        const currentWorldId = getWorldIdFromParams({ worldId });
        const campaignId = getCampaignIdFromParams(params);

        if (!currentWorldId) {
          notifications.show({
            title: 'Error',
            message: 'No world ID provided',
            color: 'red',
          });
          return;
        }

        const characterService = CharacterService.getInstance(currentWorldId, campaignId);
        await characterService.delete(characterId);

        // Update local state
        setCharacters(characters.filter(c => c.id !== characterId));

        notifications.show({
          title: 'Character Deleted',
          message: 'The character has been deleted successfully',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting character:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete character. Please try again.',
          color: 'red',
        });
      }
    }
  };

  /**
   * Breadcrumb navigation items
   */
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Characters', href: `/rpg-worlds/${worldId}/characters` }
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
          <Skeleton height={50} radius="md" />
          <Skeleton height={300} radius="md" />
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
        <Group justify="space-between">
          <Title order={1}>Characters in {worldName}</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateCharacter}
          >
            Create Character
          </Button>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Group>
          <TextInput
            placeholder="Search characters..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: 'PC', label: 'Player Character' },
              { value: 'NPC', label: 'Non-Player Character' }
            ]}
            value={selectedType}
            onChange={setSelectedType}
            leftSection={<IconFilter size="1rem" />}
            clearable
          />
        </Group>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onChange={(value) => setViewMode(value || 'table')}>
          <Tabs.List>
            <Tabs.Tab value="table">Table View</Tabs.Tab>
            <Tabs.Tab value="grid">Grid View</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Characters List */}
        {filteredCharacters.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconUsers size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No characters found. Create your first character to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateCharacter}
              >
                Create Character
              </Button>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size="1rem" />}
                component={Link}
                to={`/rpg-worlds/${worldId}`}
              >
                Back to World
              </Button>
            </Stack>
          </Paper>
        ) : viewMode === 'table' ? (
          <Table striped highlightOnHover tabularNums stickyHeader stickyHeaderOffset={60}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Race</Table.Th>
                <Table.Th>Class</Table.Th>
                <Table.Th>Level</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCharacters.map((character) => (
                <Table.Tr
                  key={character.id}
                  onClick={() => character.id && handleViewCharacter(character.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        src={character.imageURL}
                        radius="xl"
                        size="sm"
                      />
                      {character.name}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={character.characterType === 'PC' ? 'blue' : 'gray'}>
                      {character.characterType === 'PC' ? 'Player Character' : 'NPC'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{character.race}</Table.Td>
                  <Table.Td>{character.class}</Table.Td>
                  <Table.Td>{character.level}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          character.id && handleViewCharacter(character.id);
                        }}
                      >
                        <IconEye size="1rem" />
                      </ActionIcon>
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDotsVertical size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={(e) => character.id && handleEditCharacter(e, character.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => character.id && handleDeleteCharacter(e, character.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {filteredCharacters.map((character) => (
              <Card
                key={character.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => character.id && handleViewCharacter(character.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Section>
                  <Image
                    src={character.imageURL || 'https://placehold.co/600x400?text=Character'}
                    height={160}
                    alt={character.name}
                  />
                </Card.Section>

                <Group justify="space-between" mt="md">
                  <Text fw={500}>{character.name}</Text>
                  <Badge color={character.characterType === 'PC' ? 'blue' : 'gray'}>
                    {character.characterType === 'PC' ? 'PC' : 'NPC'}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" mt="xs">
                  {character.race} {character.class} (Level {character.level})
                </Text>

                <Group mt="md" justify="space-between">
                  <Text size="xs" c="dimmed">
                    {character.background ? character.background.substring(0, 50) + '...' : 'No background'}
                  </Text>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size="1rem" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size="1rem" />}
                        onClick={(e) => character.id && handleEditCharacter(e, character.id)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => character.id && handleDeleteCharacter(e, character.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}

export default RPGWorldCharactersPage;
