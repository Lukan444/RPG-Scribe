import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Tabs,
  Group,
  Badge,
  Text,
  Avatar,
  ThemeIcon,
  SimpleGrid,
  Paper,
  Divider,
  Loader,
  Center,
  Button
} from '@mantine/core';
import {
  IconSword,
  IconList,
  IconLayoutGrid,
  IconArticle,
  IconPlus,
  IconShield,
  IconGripVertical,
  IconArrowLeft
} from '@tabler/icons-react';
import { IconPotion } from '../../components/icons';
import { useDisclosure } from '@mantine/hooks';
import { EntityTable } from '../../components/common/EntityTable';
import { EntityCardGrid } from '../../components/common/EntityCardGrid';
import { ArticleCard } from '../../components/common/ArticleCard';
import { DragDropEntityOrganizer } from '../../components/common/DragDropEntityOrganizer';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EntityActionButton } from '../../components/common/EntityActionButton';
import { EntityType } from '../../models/EntityType';
import { ItemService, Item } from '../../services/item.service';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';

/**
 * ItemListPage component - Displays a list of items with various view options
 *
 * Uses the ItemService to fetch item data from Firestore
 * Provides table, grid, and article views for items
 * Supports filtering, sorting, and CRUD operations
 *
 * @see {@link https://mantine.dev/core/tabs/} - Mantine Tabs documentation
 * @see {@link https://mantine.dev/core/badge/} - Mantine Badge documentation
 */
export function ItemListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('table');
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);
  const [fromPath, setFromPath] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract worldFilter from location state if available
  useEffect(() => {
    if (location.state) {
      const { worldFilter, from } = location.state as { worldFilter?: string, from?: string };
      if (worldFilter) {
        setWorldFilter(worldFilter);
      }
      if (from) {
        setFromPath(from);
      }
    }
  }, [location.state]);

  // Get params at the component level
  const params = useParams();
  const campaignId = getCampaignIdFromParams(params);

  // Load items
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);

        // Use worldFilter if available, otherwise use empty string for global view
        const worldId = worldFilter || '';

        // Create item service - it will handle empty worldId internally
        const itemService = ItemService.getInstance(worldId, campaignId);
        const itemsData = await itemService.listEntities();

        // If worldFilter is set, add a note to the UI
        if (worldFilter) {
          console.log(`Filtering items for world: ${worldFilter}`);
        }

        setItems(itemsData);
      } catch (err) {
        console.error('Error loading items:', err);
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [worldFilter, campaignId]);

  // Handle view item
  const handleViewItem = (item: Item) => {
    if (!item.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'items', item.id));
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/items/${item.id}`);
    }
  };

  // Handle edit item
  const handleEditItem = (item: Item) => {
    if (!item.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      navigate(buildEntityRoutePath(worldFilter, 'items', item.id, 'edit'));
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/items/${item.id}/edit`);
    }
  };

  // Handle delete item
  const handleDeleteItem = (item: Item) => {
    setItemToDelete(item);
    openConfirmDelete();
  };

  // Confirm delete item
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      // Use worldFilter if available, otherwise use empty string for global view
      const worldId = worldFilter || '';

      const itemService = ItemService.getInstance(worldId, campaignId);
      await itemService.deleteEntity(itemToDelete.id!);

      // Remove from state
      setItems(prev => prev.filter(c => c.id !== itemToDelete.id));
      closeConfirmDelete();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle save order
  const handleSaveOrder = (orderedItems: Item[]) => {
    setItems(orderedItems);
    // In a real implementation, we would save the order to the database
  };

  // Render item badge
  const renderItemBadge = (item: Item) => (
    <Group gap={5}>
      <Badge color={getItemTypeColor(item.type)}>
        {item.type}
      </Badge>
      {item.rarity && (
        <Badge color={getItemRarityColor(item.rarity)}>
          {item.rarity}
        </Badge>
      )}
      {item.attunement && (
        <Badge color="indigo">
          Attunement
        </Badge>
      )}
    </Group>
  );

  // Get color for item type
  const getItemTypeColor = (itemType: string): string => {
    switch (itemType) {
      case 'Weapon':
        return 'red';
      case 'Armor':
        return 'blue';
      case 'Potion':
        return 'green';
      case 'Scroll':
        return 'yellow';
      case 'Wondrous':
        return 'violet';
      case 'Artifact':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Get color for item rarity
  const getItemRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'Common':
        return 'gray';
      case 'Uncommon':
        return 'green';
      case 'Rare':
        return 'blue';
      case 'Very Rare':
        return 'violet';
      case 'Legendary':
        return 'orange';
      case 'Artifact':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Filter options
  const filterOptions = [
    { value: 'Weapon', label: 'Weapons' },
    { value: 'Armor', label: 'Armor' },
    { value: 'Potion', label: 'Potions' },
    { value: 'Scroll', label: 'Scrolls' },
    { value: 'Wondrous', label: 'Wondrous Items' },
    { value: 'Artifact', label: 'Artifacts' }
  ];

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (item: Item) => (
        <Group gap="sm">
          <Avatar
            src={item.imageURL}
            radius="xl"
            size="sm"
            alt={item.name}
          >
            <IconSword size={16} />
          </Avatar>
          <Text fw={500}>{item.name}</Text>
        </Group>
      )
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (item: Item) => (
        <Badge color={getItemTypeColor(item.type)}>
          {item.type}
        </Badge>
      )
    },
    {
      key: 'rarity',
      title: 'Rarity',
      sortable: true,
      render: (item: Item) => (
        item.rarity ? (
          <Badge color={getItemRarityColor(item.rarity)}>
            {item.rarity}
          </Badge>
        ) : (
          <Text size="sm">-</Text>
        )
      )
    },
    {
      key: 'attunement',
      title: 'Attunement',
      sortable: true,
      render: (item: Item) => (
        item.attunement ? (
          <Badge color="indigo">Required</Badge>
        ) : (
          <Text size="sm">No</Text>
        )
      )
    },
    {
      key: 'currentOwner',
      title: 'Current Owner',
      sortable: true,
      render: (item: Item) => (
        item.currentOwner ? (
          <Text size="sm">{item.currentOwner.name}</Text>
        ) : (
          <Text size="sm">None</Text>
        )
      )
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (item: Item) => (
        <Text size="sm">
          {item.updatedAt ? new Date(item.updatedAt.toDate()).toLocaleDateString() : 'N/A'}
        </Text>
      )
    }
  ];

  // Render item item for drag and drop
  const renderItemItem = (item: Item) => (
    <Group wrap="nowrap">
      <Avatar
        src={item.imageURL}
        radius="xl"
        size="md"
        alt={item.name}
      >
        <IconSword size={16} />
      </Avatar>
      <div>
        <Group gap={5}>
          <Text fw={500}>{item.name}</Text>
          <Badge size="xs" color={getItemTypeColor(item.type)}>
            {item.type}
          </Badge>
          {item.rarity && (
            <Badge size="xs" color={getItemRarityColor(item.rarity)}>
              {item.rarity}
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">{item.description?.substring(0, 50)}{item.description?.length > 50 ? '...' : ''}</Text>
      </div>
    </Group>
  );

  // If loading
  if (loading && items.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && items.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            {fromPath && (
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate(fromPath)}
              >
                Back
              </Button>
            )}
            <Title order={1}>
              {worldFilter ? 'World Items' : 'Items'}
              {worldFilter && <Badge ml="xs" color="blue">Filtered by World</Badge>}
            </Title>
          </Group>

          <Group>
            <EntityActionButton
              entityType={EntityType.ITEM}
              primaryAction={{
                label: 'Create Item',
                icon: <IconPlus size={16} />,
                onClick: () => {
                  if (worldFilter) {
                    navigate(buildEntityRoutePath(worldFilter, 'items', undefined, 'new'));
                  } else {
                    navigate('/items/new');
                  }
                }
              }}
              actions={[
                {
                  label: 'Import Items',
                  icon: <IconSword size={16} />,
                  onClick: () => console.log('Import items')
                }
              ]}
              groupedActions={[
                {
                  title: 'Generate',
                  actions: [
                    {
                      label: 'Generate Weapon',
                      icon: <IconSword size={16} />,
                      onClick: () => console.log('Generate weapon')
                    },
                    {
                      label: 'Generate Armor',
                      icon: <IconShield size={16} />,
                      onClick: () => console.log('Generate armor')
                    },
                    {
                      label: 'Generate Potion',
                      icon: <IconPotion size={16} />,
                      onClick: () => console.log('Generate potion')
                    }
                  ]
                }
              ]}
            />
          </Group>
        </Group>

        <Divider mb="md" />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="table" leftSection={<IconList size={16} />}>
              Table View
            </Tabs.Tab>
            <Tabs.Tab value="grid" leftSection={<IconLayoutGrid size={16} />}>
              Grid View
            </Tabs.Tab>
            <Tabs.Tab value="article" leftSection={<IconArticle size={16} />}>
              Article View
            </Tabs.Tab>
            <Tabs.Tab value="organize" leftSection={<IconGripVertical size={16} />}>
              Organize
            </Tabs.Tab>
          </Tabs.List>

          <div style={{ marginTop: '1rem' }}>
            {activeTab === 'table' && (
              <EntityTable
                data={items}
                columns={columns}
                entityType={EntityType.ITEM}
                onView={handleViewItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                filterOptions={filterOptions}
              />
            )}

            {activeTab === 'grid' && (
              <EntityCardGrid
                data={items}
                entityType={EntityType.ITEM}
                onView={handleViewItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                filterOptions={filterOptions}
                renderBadge={renderItemBadge}
              />
            )}

            {activeTab === 'article' && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {items.map(item => (
                  <ArticleCard
                    key={item.id}
                    id={item.id!}
                    image={item.imageURL}
                    title={item.name}
                    description={item.description || ''}
                    entityType={EntityType.ITEM}
                    category={item.type}
                    date={item.rarity}
                    onView={() => handleViewItem(item)}
                    onEdit={() => handleEditItem(item)}
                    onDelete={() => handleDeleteItem(item)}
                  />
                ))}
              </SimpleGrid>
            )}

            {activeTab === 'organize' && (
              <DragDropEntityOrganizer
                data={items}
                entityType={EntityType.ITEM}
                onSaveOrder={handleSaveOrder}
                onView={handleViewItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                renderItem={renderItemItem}
              />
            )}
          </div>
        </Tabs>
      </Paper>

      {/* Item Stats */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="red">
              <IconSword size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Weapons</Text>
              <Text fw={700} size="xl">{items.filter(i => i.type === 'Weapon').length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="blue">
              <IconShield size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Armor</Text>
              <Text fw={700} size="xl">{items.filter(i => i.type === 'Armor').length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="teal">
              <IconSword size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Total Items</Text>
              <Text fw={700} size="xl">{items.length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteItem}
      />
    </Container>
  );
}

export default ItemListPage;
