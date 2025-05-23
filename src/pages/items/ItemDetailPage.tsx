import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Avatar,
  Tabs,
  Grid,
  Stack,
  Button,
  ActionIcon,
  Menu,
  Loader,
  Center,
  Divider,
  List,
  ThemeIcon,
  Card,
  SimpleGrid
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconSword,
  IconUser,
  IconMapPin,
  IconNotes,
  IconHistory,
  IconDotsVertical,
  IconShield
} from '@tabler/icons-react';
import { IconRelationship, IconPotion } from '../../components/icons';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ItemService, Item } from '../../services/item.service';
import { RelationshipService, Relationship } from '../../services/relationship.service';
import { EntityType } from '../../models/EntityType';

/**
 * ItemDetailPage component - Displays detailed information about an item
 *
 * Uses the ItemService to fetch item data from Firestore
 * Displays item details, relationships, properties, and history
 * Supports editing and deleting the item
 *
 * @see {@link https://mantine.dev/core/tabs/} - Mantine Tabs documentation
 * @see {@link https://mantine.dev/core/badge/} - Mantine Badge documentation
 */
export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);

  // Load item data
  useEffect(() => {
    const loadItem = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // For now, we'll use a hardcoded world and campaign ID
        const worldId = 'default-world';
        const campaignId = 'default-campaign';

        const itemService = ItemService.getInstance(worldId, campaignId);
        const itemData = await itemService.getEntity(id);

        if (!itemData) {
          setError('Item not found');
          return;
        }

        setItem(itemData);

        // Load relationships
        const relationshipService = RelationshipService.getInstance(worldId, campaignId);
        const relationshipsData = await relationshipService.getRelationshipsByEntity(id, EntityType.ITEM);
        setRelationships(relationshipsData);
      } catch (err) {
        console.error('Error loading item:', err);
        setError('Failed to load item data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  // Handle delete item
  const handleDeleteItem = () => {
    openConfirmDelete();
  };

  // Confirm delete item
  const confirmDeleteItem = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // For now, we'll use a hardcoded world and campaign ID
      const worldId = 'default-world';
      const campaignId = 'default-campaign';

      const itemService = ItemService.getInstance(worldId, campaignId);
      await itemService.deleteEntity(id);

      navigate('/items');
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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

  /**
   * Get icon for item type
   * @param itemType Type of item
   * @returns React component with appropriate icon
   */
  const getItemTypeIcon = (itemType: string): JSX.Element => {
    switch (itemType) {
      case 'Weapon':
        return <IconSword size={24} />;
      case 'Armor':
        return <IconShield size={24} />;
      case 'Potion':
        return <IconPotion size={24} />;
      default:
        return <IconSword size={24} />;
    }
  };

  // If loading
  if (loading && !item) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && !item) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  // If item not found
  if (!item) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text>Item not found</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            component={Link}
            to="/items"
            mb="xs"
          >
            Back to Items
          </Button>
          <Title order={1}>{item.name}</Title>
        </div>

        <Group>
          <Button
            component={Link}
            to={`/items/${id}/edit`}
            leftSection={<IconEdit size={16} />}
          >
            Edit
          </Button>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="default" size="lg">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={handleDeleteItem}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Stack align="center" gap="md">
              <Avatar
                src={item.imageURL}
                size={150}
                radius={100}
                alt={item.name}
              >
                {getItemTypeIcon(item.type)}
              </Avatar>

              <Title order={2}>{item.name}</Title>

              <Group gap={5}>
                <Badge color={getItemTypeColor(item.type)} size="lg">
                  {item.type}
                </Badge>

                {item.rarity && (
                  <Badge color={getItemRarityColor(item.rarity)} size="lg">
                    {item.rarity}
                  </Badge>
                )}

                {item.attunement && (
                  <Badge color="indigo" size="lg">
                    Attunement
                  </Badge>
                )}
              </Group>

              <Text c="dimmed" ta="center">
                {item.description || 'No description available.'}
              </Text>

              <Divider w="100%" />

              <Group grow w="100%">
                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{relationships.length}</Text>
                  <Text size="xs" c="dimmed">Relationships</Text>
                </Stack>

                {item.currentOwner && (
                  <Stack align="center" gap={5}>
                    <Text fw={700} size="lg">{item.currentOwner.name}</Text>
                    <Text size="xs" c="dimmed">Current Owner</Text>
                  </Stack>
                )}
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="details" leftSection={<IconSword size={16} />}>
                  Details
                </Tabs.Tab>
                <Tabs.Tab value="properties" leftSection={<IconNotes size={16} />}>
                  Properties
                </Tabs.Tab>
                <Tabs.Tab value="relationships" leftSection={<IconRelationship size={16} />}>
                  Relationships
                </Tabs.Tab>
                <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                  History
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Type</Text>
                      <Text>{item.type || 'N/A'}</Text>

                      <Text fw={700} mt="md">Rarity</Text>
                      <Text>{item.rarity || 'N/A'}</Text>

                      <Text fw={700} mt="md">Attunement</Text>
                      <Text>{item.attunement ? 'Required' : 'Not Required'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Created By</Text>
                      <Text>{item.createdBy || 'N/A'}</Text>

                      <Text fw={700} mt="md">Created At</Text>
                      <Text>{item.createdAt ? new Date(item.createdAt.toDate()).toLocaleString() : 'N/A'}</Text>

                      <Text fw={700} mt="md">Updated At</Text>
                      <Text>{item.updatedAt ? new Date(item.updatedAt.toDate()).toLocaleString() : 'N/A'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={12} mt="md">
                    <Text fw={700}>Description</Text>
                    <Text>{item.description || 'No description available.'}</Text>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="properties" pt="md">
                {item.properties ? (
                  <Paper p="md" withBorder>
                    <Text>
                      {typeof item.properties === 'string'
                        ? item.properties
                        : typeof item.properties === 'object'
                          ? JSON.stringify(item.properties, null, 2)
                          : String(item.properties)
                      }
                    </Text>
                  </Paper>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No special properties for this item.
                  </Text>
                )}

                {item.magicalProperties && (
                  <>
                    <Title order={3} mt="xl" mb="md">Magical Properties</Title>
                    <Paper p="md" withBorder>
                      {typeof item.magicalProperties === 'object' ? (
                        <>
                          <Text>{item.magicalProperties.description}</Text>

                          {item.magicalProperties.charges !== undefined && (
                            <Group mt="md">
                              <Text fw={700}>Charges:</Text>
                              <Text>{item.magicalProperties.charges} / {item.magicalProperties.maxCharges || '?'}</Text>
                            </Group>
                          )}

                          {item.magicalProperties.rechargeable !== undefined && (
                            <Group mt="xs">
                              <Text fw={700}>Rechargeable:</Text>
                              <Text>{item.magicalProperties.rechargeable ? 'Yes' : 'No'}</Text>
                            </Group>
                          )}
                        </>
                      ) : (
                        <Text>
                          {typeof item.magicalProperties === 'string'
                            ? item.magicalProperties
                            : String(item.magicalProperties)
                          }
                        </Text>
                      )}
                    </Paper>
                  </>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="relationships" pt="md">
                {relationships.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {relationships.map((relationship) => (
                      <Card key={relationship.id} withBorder shadow="sm" p="md">
                        <Group justify="space-between">
                          <Text fw={700}>{relationship.targetEntity?.name || 'Unknown Entity'}</Text>
                          <Badge>{relationship.type}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">
                          {relationship.description || 'No description available.'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No relationships found for this item.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="history" pt="md">
                {item.previousOwnerIds && item.previousOwnerIds.length > 0 ? (
                  <Paper p="md" withBorder>
                    <Title order={3} mb="md">Previous Owners</Title>
                    <List>
                      {item.previousOwnerIds.map((ownerId: string, index: number) => (
                        <List.Item key={index}>
                          Owner ID: {ownerId}
                        </List.Item>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No history available for this item.
                  </Text>
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteItem}
      />
    </Container>
  );
}

export default ItemDetailPage;
