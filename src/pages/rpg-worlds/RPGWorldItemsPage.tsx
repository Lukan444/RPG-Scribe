import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
  Anchor
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
  IconSword
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { ItemService } from '../../services/item.service';
import { Item, ItemRarity } from '../../models/Item';
import { ItemType } from '../../models/ItemType';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * RPG World Items Page
 * Displays items specific to a world with filtering, table/grid views,
 * and CRUD operations
 *
 * @returns JSX.Element - The rendered component
 */
export function RPGWorldItemsPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { worldId = '' } = useParams<{ worldId: string }>();
  const { currentUser } = useAuth();

  /**
   * Component state
   */
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  // Get all params at the component level
  const params = useParams();

  /**
   * Fetch world name and items when worldId changes
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

        // Get items for this world
        const itemService = ItemService.getInstance(currentWorldId, campaignId);
        const worldItems = await itemService.listEntities();
        // Add entityType to each item
        setItems(worldItems.map(item => {
          // Convert string rarity to ItemRarity enum if needed
          let itemRarity = item.rarity as ItemRarity | undefined;

          return {
            ...item,
            entityType: EntityType.ITEM,
            itemType: item.type ? (item.type as ItemType) : ItemType.OTHER,
            rarity: itemRarity
          };
        }));
      } catch (err) {
        console.error('Error fetching world items:', err);
        setError('Failed to load items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId, params]);

  /**
   * Filter items based on search query and selected type
   */
  const filteredItems = items.filter(item => {
    const matchesSearch: boolean = searchQuery === '' ||
      (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType: boolean = !selectedType ||
      (item.itemType === selectedType);

    return matchesSearch && matchesType;
  });

  /**
   * Handle create item navigation
   */
  const handleCreateItem = (): void => {
    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'items', undefined, 'new'));
  };

  /**
   * Handle view item navigation
   * @param itemId Item ID
   */
  const handleViewItem = (itemId: string): void => {
    if (!itemId) {
      console.error('Item ID is undefined');
      return;
    }

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'items', itemId));
  };

  /**
   * Handle edit item navigation
   * @param event Mouse event
   * @param itemId Item ID
   */
  const handleEditItem = (event: React.MouseEvent, itemId: string): void => {
    if (!itemId) {
      console.error('Item ID is undefined');
      return;
    }
    event.stopPropagation();

    // Get worldId from params using utility function
    const currentWorldId = getWorldIdFromParams({ worldId });

    if (!currentWorldId) return;

    navigate(buildEntityRoutePath(currentWorldId, 'items', itemId, 'edit'));
  };

  /**
   * Handle item deletion
   * @param event Mouse event
   * @param itemId Item ID
   */
  const handleDeleteItem = async (event: React.MouseEvent, itemId: string): Promise<void> => {
    if (!itemId) {
      console.error('Item ID is undefined');
      return;
    }
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this item?')) {
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

        const itemService = ItemService.getInstance(currentWorldId, campaignId);
        await itemService.delete(itemId);

        // Update local state
        setItems(items.filter(i => i.id !== itemId));

        notifications.show({
          title: 'Item Deleted',
          message: 'The item has been deleted successfully',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete item. Please try again.',
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
    { title: 'Items', href: buildEntityRoutePath(worldId, 'items') },
  ];

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
          <Title order={1}>Items in {worldName}</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateItem}
          >
            Create Item
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
            placeholder="Search items..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: 'Weapon', label: 'Weapon' },
              { value: 'Armor', label: 'Armor' },
              { value: 'Potion', label: 'Potion' },
              { value: 'Scroll', label: 'Scroll' },
              { value: 'Wondrous', label: 'Wondrous Item' },
              { value: 'Artifact', label: 'Artifact' },
              { value: 'Other', label: 'Other' }
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

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconSword size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No items found. Create your first item to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateItem}
              >
                Create Item
              </Button>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size="1rem" />}
                component={Link}
                to={`/rpg-worlds/${getWorldIdFromParams({ worldId })}`}
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
                <Table.Th>Rarity</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredItems.map((item) => (
                <Table.Tr
                  key={item.id}
                  onClick={() => item.id && handleViewItem(item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        src={item.imageURL}
                        radius="xl"
                        size="sm"
                      />
                      {item.name}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getItemTypeColor(item.itemType)}>
                      {item.itemType}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getItemRarityColor(item.rarity)}>
                      {item.rarity || 'Common'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{truncateText(item.description, 50)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.id && handleViewItem(item.id);
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
                            onClick={(e) => item.id && handleEditItem(e, item.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => item.id && handleDeleteItem(e, item.id)}
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
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => item.id && handleViewItem(item.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Section>
                  <Image
                    src={item.imageURL || 'https://placehold.co/600x400?text=Item'}
                    height={160}
                    alt={item.name}
                  />
                </Card.Section>

                <Group justify="space-between" mt="md">
                  <Text fw={500}>{item.name}</Text>
                  <Badge color={getItemTypeColor(item.itemType)}>
                    {item.itemType}
                  </Badge>
                </Group>

                <Group mt="xs">
                  <Badge color={getItemRarityColor(item.rarity)}>
                    {item.rarity || 'Common'}
                  </Badge>
                  {item.requiresAttunement && (
                    <Badge color="yellow">Attunement</Badge>
                  )}
                </Group>

                <Text size="sm" c="dimmed" mt="xs">
                  {truncateText(item.description, 100)}
                </Text>

                <Group mt="md" justify="flex-end">
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size="1rem" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size="1rem" />}
                        onClick={(e) => item.id && handleEditItem(e, item.id)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => item.id && handleDeleteItem(e, item.id)}
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

/**
 * Get color based on item type
 * @param itemType Type of item
 * @returns Color string for Mantine components
 */
function getItemTypeColor(itemType: string): string {
  switch (itemType) {
    case 'Weapon': return 'red';
    case 'Armor': return 'blue';
    case 'Potion': return 'green';
    case 'Scroll': return 'yellow';
    case 'Wondrous': return 'violet';
    case 'Artifact': return 'orange';
    default: return 'gray';
  }
}

/**
 * Get color based on item rarity
 * @param rarity Rarity of item
 * @returns Color string for Mantine components
 */
function getItemRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'Common': return 'gray';
    case 'Uncommon': return 'green';
    case 'Rare': return 'blue';
    case 'Very Rare': return 'violet';
    case 'Legendary': return 'orange';
    case 'Artifact': return 'red';
    default: return 'gray';
  }
}

/**
 * Truncate text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis or default message if text is empty
 */
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return 'No description';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export default RPGWorldItemsPage;
