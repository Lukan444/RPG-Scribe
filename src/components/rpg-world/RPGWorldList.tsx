import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  Button,
  ActionIcon,
  Menu,
  Tooltip,
  Box,
  Title,
  Skeleton,
  Center,
  Stack,
  rem
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconShare,
  IconBookmark,
  IconWorld,
  IconPlus,
  IconLock,
  IconUsers,
  IconWorld as IconGlobe,
  IconMap
} from '@tabler/icons-react';
import { RPGWorld, RPGWorldPrivacy } from '../../models/RPGWorld';
import { modals } from '@mantine/modals';

// Props interface
interface RPGWorldListProps {
  worlds: RPGWorld[];
  isLoading?: boolean;
  error?: string | null;
  onCreateWorld?: () => void;
  onEditWorld?: (worldId: string) => void;
  onDeleteWorld?: (worldId: string) => void;
  onViewWorld?: (worldId: string) => void;
}

/**
 * RPG World List Component
 */
export function RPGWorldList({
  worlds,
  isLoading = false,
  error = null,
  onCreateWorld,
  onEditWorld,
  onDeleteWorld,
  onViewWorld
}: RPGWorldListProps) {
  const navigate = useNavigate();

  // Handle view world
  const handleViewWorld = (worldId: string) => {
    if (onViewWorld) {
      onViewWorld(worldId);
    } else {
      navigate(`/rpg-worlds/${worldId}`);
    }
  };

  // Handle edit world
  const handleEditWorld = (event: React.MouseEvent, worldId: string) => {
    event.stopPropagation();
    if (onEditWorld) {
      onEditWorld(worldId);
    } else {
      navigate(`/rpg-worlds/${worldId}/edit`);
    }
  };

  // Handle delete world
  const handleDeleteWorld = (event: React.MouseEvent, worldId: string) => {
    event.stopPropagation();

    // Open confirmation modal
    modals.openConfirmModal({
      title: 'Delete RPG World',
      children: (
        <Text size="sm">
          Are you sure you want to delete this RPG world? This action cannot be undone and will also delete all campaigns, characters, and other data associated with this world.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        if (onDeleteWorld) {
          onDeleteWorld(worldId);
        }
      },
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
        {Array(4).fill(0).map((_, index) => (
          <Card key={index} withBorder padding="lg" radius="md">
            <Card.Section>
              <Skeleton height={160} />
            </Card.Section>
            <Skeleton height={20} mt="md" width="70%" />
            <Skeleton height={15} mt="sm" width="40%" />
            <Skeleton height={15} mt="xs" width="90%" />
            <Group mt="md">
              <Skeleton height={20} width={60} radius="xl" />
              <Skeleton height={20} width={70} radius="xl" />
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  // Render error state
  if (error) {
    return (
      <Center>
        <Stack align="center" gap="md">
          <Text c="red" size="lg">{error}</Text>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Stack>
      </Center>
    );
  }

  // Render empty state
  if (worlds.length === 0) {
    return (
      <Center py={50}>
        <Stack align="center" gap="md">
          <IconWorld style={{ width: '48px', height: '48px' }} color="var(--mantine-color-gray-5)" />
          <Title order={3}>No RPG Worlds</Title>
          <Text c="dimmed">Create your first RPG world to get started</Text>
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={onCreateWorld}
          >
            Create RPG World
          </Button>
        </Stack>
      </Center>
    );
  }

  // Render world list
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
      {worlds.map((world) => (
        <Card
          key={world.id}
          withBorder
          padding="lg"
          radius="md"
          onClick={() => handleViewWorld(world.id!)}
          style={{ cursor: 'pointer' }}
        >
          <Card.Section>
            <Image
              src={world.imageURL || 'https://placehold.co/600x400?text=RPG+World'}
              height={160}
              alt={world.name}
            />
          </Card.Section>

          <Group justify="space-between" mt="md">
            <Text fw={500}>{world.name}</Text>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  onClick={(e) => e.stopPropagation()}
                  variant="subtle"
                >
                  <IconDotsVertical style={{ width: '16px', height: '16px' }} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEdit style={{ width: '14px', height: '14px' }} />}
                  onClick={(e) => handleEditWorld(e, world.id!)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconShare style={{ width: '14px', height: '14px' }} />}
                  onClick={(e) => e.stopPropagation()}
                >
                  Share
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconBookmark style={{ width: '14px', height: '14px' }} />}
                  onClick={(e) => e.stopPropagation()}
                >
                  Bookmark
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash style={{ width: '14px', height: '14px' }} />}
                  onClick={(e) => handleDeleteWorld(e, world.id!)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
            {world.description}
          </Text>

          <Group mt="md" gap="xs">
            <Badge color="blue" variant="light">
              {world.system}
            </Badge>
            {world.genre && (
              <Badge color="teal" variant="light">
                {world.genre}
              </Badge>
            )}

            {/* Privacy Badge */}
            {world.privacySetting === RPGWorldPrivacy.PRIVATE && (
              <Tooltip label="Only you and invited GMs can view this world">
                <Badge color="gray" variant="dot" leftSection={<IconLock style={{ width: '10px', height: '10px' }} />}>
                  Private
                </Badge>
              </Tooltip>
            )}
            {world.privacySetting === RPGWorldPrivacy.SHARED && (
              <Tooltip label="Players in campaigns can view world-level information">
                <Badge color="blue" variant="dot" leftSection={<IconUsers style={{ width: '10px', height: '10px' }} />}>
                  Shared
                </Badge>
              </Tooltip>
            )}
            {world.privacySetting === RPGWorldPrivacy.PUBLIC && (
              <Tooltip label="Anyone can view this world and its public content">
                <Badge color="green" variant="dot" leftSection={<IconGlobe style={{ width: '10px', height: '10px' }} />}>
                  Public
                </Badge>
              </Tooltip>
            )}
          </Group>

          <Group mt="md" gap="xs">
            {world.campaignCount !== undefined && (
              <Text size="xs" c="dimmed">
                {world.campaignCount} {world.campaignCount === 1 ? 'campaign' : 'campaigns'}
              </Text>
            )}
            {world.characterCount !== undefined && world.characterCount > 0 && (
              <Text size="xs" c="dimmed">
                {world.characterCount} {world.characterCount === 1 ? 'character' : 'characters'}
              </Text>
            )}
            {world.locationCount !== undefined && world.locationCount > 0 && (
              <Text size="xs" c="dimmed">
                {world.locationCount} {world.locationCount === 1 ? 'location' : 'locations'}
              </Text>
            )}
          </Group>

          {world.sharedLore && (
            <Tooltip label="Lore is shared across all campaigns in this world">
              <Badge size="xs" color="violet" variant="light" mt="xs">
                Shared Lore
              </Badge>
            </Tooltip>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}

export default RPGWorldList;