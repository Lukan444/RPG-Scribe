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
  Card,
  Image,
  Button,
  ActionIcon,
  Menu,
  Tooltip,
  Stack
} from '@mantine/core';
import {
  IconWorld,
  IconList,
  IconLayoutGrid,
  IconArticle,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconShare,
  IconBookmark,
  IconLock,
  IconUsers,
  IconGlobe
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { RPGWorld, RPGWorldPrivacy } from '../../models/RPGWorld';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RPGWorldListPage component - Displays a list of RPG Worlds
 *
 * Uses the RPGWorldService to fetch RPG World data from Firestore
 * Provides grid and list views for RPG Worlds
 * Supports filtering, sorting, and CRUD operations
 *
 * @see {@link https://mantine.dev/core/tabs/} - Mantine Tabs documentation
 * @see {@link https://mantine.dev/core/card/} - Mantine Card documentation
 */
export function RPGWorldListPage() {
  const [worlds, setWorlds] = useState<RPGWorld[]>([]);
  const [publicWorlds, setPublicWorlds] = useState<RPGWorld[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('my-worlds');
  const [viewMode, setViewMode] = useState<string | null>('grid');
  const [worldToDelete, setWorldToDelete] = useState<RPGWorld | null>(null);
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Load RPG Worlds
  useEffect(() => {
    const loadWorlds = async () => {
      try {
        setLoading(true);

        const worldService = new RPGWorldService();

        // Load user's worlds
        if (currentUser?.id) {
          const userWorlds = await worldService.getWorldsByUser(currentUser.id);
          setWorlds(userWorlds);
        }

        // Load public worlds
        const publicWorldsData = await worldService.getPublicWorlds();
        setPublicWorlds(publicWorldsData);
      } catch (err) {
        console.error('Error loading RPG Worlds:', err);
        setError('Failed to load RPG Worlds. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadWorlds();
  }, [currentUser?.id]);

  // Handle view world
  const handleViewWorld = (world: RPGWorld) => {
    navigate(`/rpg-worlds/${world.id}`);
  };

  // Handle edit world
  const handleEditWorld = (world: RPGWorld) => {
    navigate(`/rpg-worlds/${world.id}/edit`);
  };

  // Handle delete world
  const handleDeleteWorld = (world: RPGWorld) => {
    setWorldToDelete(world);
    openConfirmDelete();
  };

  // Confirm delete world
  const confirmDeleteWorld = async () => {
    if (!worldToDelete) return;

    try {
      setLoading(true);

      const worldService = new RPGWorldService();
      await worldService.delete(worldToDelete.id!);

      // Remove from state
      setWorlds(prev => prev.filter(w => w.id !== worldToDelete.id));
      closeConfirmDelete();
    } catch (err) {
      console.error('Error deleting RPG World:', err);
      setError('Failed to delete RPG World. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get privacy badge color
  const getPrivacyBadgeColor = (privacy?: RPGWorldPrivacy): string => {
    switch (privacy) {
      case RPGWorldPrivacy.PUBLIC:
        return 'green';
      case RPGWorldPrivacy.FRIENDS:
        return 'blue';
      case RPGWorldPrivacy.PRIVATE:
      default:
        return 'gray';
    }
  };

  // Get privacy badge label
  const getPrivacyBadgeLabel = (privacy?: RPGWorldPrivacy): string => {
    switch (privacy) {
      case RPGWorldPrivacy.PUBLIC:
        return 'Public';
      case RPGWorldPrivacy.FRIENDS:
        return 'Friends';
      case RPGWorldPrivacy.PRIVATE:
      default:
        return 'Private';
    }
  };

  // Get privacy badge icon
  const getPrivacyBadgeIcon = (privacy?: RPGWorldPrivacy) => {
    switch (privacy) {
      case RPGWorldPrivacy.PUBLIC:
        return <IconGlobe size={14} />;
      case RPGWorldPrivacy.FRIENDS:
        return <IconUsers size={14} />;
      case RPGWorldPrivacy.PRIVATE:
      default:
        return <IconLock size={14} />;
    }
  };

  // Render world card
  const renderWorldCard = (world: RPGWorld, isPublic = false) => (
    <Card key={world.id} shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={world.imageURL || 'https://via.placeholder.com/400x200?text=RPG+World'}
          height={160}
          alt={world.name}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{world.name}</Text>
        <Badge
          color={getPrivacyBadgeColor(world.privacySetting)}
          leftSection={getPrivacyBadgeIcon(world.privacySetting)}
        >
          {getPrivacyBadgeLabel(world.privacySetting)}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2}>
        {world.description || 'No description available.'}
      </Text>

      <Group mt="md" justify="space-between">
        <Text size="sm" c="dimmed">
          {world.campaignCount || 0} {world.campaignCount === 1 ? 'Campaign' : 'Campaigns'}
        </Text>

        <Group gap={5}>
          <Button
            variant="light"
            color="blue"
            size="xs"
            onClick={() => handleViewWorld(world)}
          >
            View
          </Button>

          {!isPublic && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => handleEditWorld(world)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconShare size={14} />}
                >
                  Share
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => handleDeleteWorld(world)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </Card>
  );

  // Render world list item
  const renderWorldListItem = (world: RPGWorld, isPublic = false) => (
    <Paper key={world.id} p="md" withBorder>
      <Group justify="space-between">
        <Group>
          <Avatar
            src={world.imageURL}
            size="lg"
            radius="md"
            alt={world.name}
          >
            <IconWorld size={24} />
          </Avatar>

          <div>
            <Group gap={5}>
              <Text fw={500}>{world.name}</Text>
              <Badge
                color={getPrivacyBadgeColor(world.privacySetting)}
                leftSection={getPrivacyBadgeIcon(world.privacySetting)}
                size="sm"
              >
                {getPrivacyBadgeLabel(world.privacySetting)}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed" lineClamp={1}>
              {world.description || 'No description available.'}
            </Text>

            <Text size="xs" c="dimmed" mt={5}>
              {world.campaignCount || 0} {world.campaignCount === 1 ? 'Campaign' : 'Campaigns'}
            </Text>
          </div>
        </Group>

        <Group gap={5}>
          <Button
            variant="light"
            color="blue"
            size="xs"
            onClick={() => handleViewWorld(world)}
          >
            View
          </Button>

          {!isPublic && (
            <>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => handleEditWorld(world)}
              >
                Edit
              </Button>

              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <IconDotsVertical size={16} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconShare size={14} />}
                  >
                    Share
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => handleDeleteWorld(world)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          )}
        </Group>
      </Group>
    </Paper>
  );

  // If loading
  if (loading && worlds.length === 0 && publicWorlds.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && worlds.length === 0 && publicWorlds.length === 0) {
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
          <Title order={1}>RPG Worlds</Title>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/rpg-worlds/new')}
          >
            Create World
          </Button>
        </Group>

        <Divider mb="md" />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="my-worlds" leftSection={<IconWorld size={16} />}>
              My Worlds
            </Tabs.Tab>
            <Tabs.Tab value="public-worlds" leftSection={<IconGlobe size={16} />}>
              Public Worlds
            </Tabs.Tab>
          </Tabs.List>

          <Group mt="md" mb="md">
            <Tabs value={viewMode} onChange={setViewMode}>
              <Tabs.List>
                <Tooltip label="Grid View">
                  <Tabs.Tab value="grid" leftSection={<IconLayoutGrid size={16} />} />
                </Tooltip>
                <Tooltip label="List View">
                  <Tabs.Tab value="list" leftSection={<IconList size={16} />} />
                </Tooltip>
              </Tabs.List>
            </Tabs>
          </Group>

          <div>
            {activeTab === 'my-worlds' && (
              <>
                {worlds.length === 0 ? (
                  <Center py="xl">
                    <div style={{ textAlign: 'center' }}>
                      <IconWorld size={48} style={{ opacity: 0.3 }} />
                      <Text mt="md">You haven't created any RPG Worlds yet.</Text>
                      <Button
                        mt="md"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => navigate('/rpg-worlds/new')}
                      >
                        Create Your First World
                      </Button>
                    </div>
                  </Center>
                ) : viewMode === 'grid' ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    {worlds.map(world => renderWorldCard(world))}
                  </SimpleGrid>
                ) : (
                  <Stack gap="md">
                    {worlds.map(world => renderWorldListItem(world))}
                  </Stack>
                )}
              </>
            )}

            {activeTab === 'public-worlds' && (
              <>
                {publicWorlds.length === 0 ? (
                  <Center py="xl">
                    <div style={{ textAlign: 'center' }}>
                      <IconGlobe size={48} style={{ opacity: 0.3 }} />
                      <Text mt="md">No public RPG Worlds available.</Text>
                    </div>
                  </Center>
                ) : viewMode === 'grid' ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    {publicWorlds.map(world => renderWorldCard(world, true))}
                  </SimpleGrid>
                ) : (
                  <Stack gap="md">
                    {publicWorlds.map(world => renderWorldListItem(world, true))}
                  </Stack>
                )}
              </>
            )}
          </div>
        </Tabs>
      </Paper>

      {/* RPG World Stats */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="blue">
              <IconWorld size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">My Worlds</Text>
              <Text fw={700} size="xl">{worlds.length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="green">
              <IconGlobe size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Public Worlds</Text>
              <Text fw={700} size="xl">{publicWorlds.length}</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="teal">
              <IconBookmark size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">Total Campaigns</Text>
              <Text fw={700} size="xl">
                {worlds.reduce((total, world) => total + (world.campaignCount || 0), 0)}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete RPG World"
        message={`Are you sure you want to delete ${worldToDelete?.name}? This action cannot be undone and will delete all campaigns, characters, and other data associated with this world.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteWorld}
      />
    </Container>
  );
}

export default RPGWorldListPage;
