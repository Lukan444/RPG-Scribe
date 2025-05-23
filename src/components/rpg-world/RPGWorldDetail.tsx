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
  rem
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconShare,
  IconBookmark,
  IconWorld,
  IconBook,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconPlus,
  IconLock,
  IconWorld as IconGlobe,
  IconBuildingCastle,
  IconInfoCircle
} from '@tabler/icons-react';
import { RPGWorld, RPGWorldPrivacy } from '../../models/RPGWorld';
import { modals } from '@mantine/modals';

// Campaign interface (simplified)
interface Campaign {
  id: string;
  name: string;
  description?: string;
  status?: string;
  imageURL?: string;
  characterCount?: number;
  locationCount?: number;
}

// Props interface
interface RPGWorldDetailProps {
  world: RPGWorld;
  campaigns?: Campaign[];
  isLoading?: boolean;
  error?: string | null;
  onEditWorld?: () => void;
  onDeleteWorld?: () => void;
  onCreateCampaign?: () => void;
  onViewCampaign?: (campaignId: string) => void;
}

/**
 * RPG World Detail Component
 */
export function RPGWorldDetail({
  world,
  campaigns = [],
  isLoading = false,
  error = null,
  onEditWorld,
  onDeleteWorld,
  onCreateCampaign,
  onViewCampaign
}: RPGWorldDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Handle edit world
  const handleEditWorld = () => {
    if (onEditWorld) {
      onEditWorld();
    } else {
      navigate(`/rpg-worlds/${world.id}/edit`);
    }
  };

  // Handle delete world
  const handleDeleteWorld = () => {
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
          onDeleteWorld();
        }
      },
    });
  };

  // Handle create campaign
  const handleCreateCampaign = () => {
    if (onCreateCampaign) {
      onCreateCampaign();
    } else {
      navigate(`/rpg-worlds/${world.id}/campaigns/new`);
    }
  };

  // Handle view campaign
  const handleViewCampaign = (campaignId: string) => {
    if (onViewCampaign) {
      onViewCampaign(campaignId);
    } else {
      navigate(`/rpg-worlds/${world.id}/campaigns/${campaignId}`);
    }
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'planned': return 'yellow';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };

  // Helper function to format dates safely
  const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    try {
      // Check if it's a Firestore Timestamp
      if (dateInput && typeof dateInput.toDate === 'function') {
        return dateInput.toDate().toLocaleDateString();
      }
      // Check if it's already a Date object (e.g., from mock data)
      if (dateInput instanceof Date) {
        return dateInput.toLocaleDateString();
      }
      // Try to parse if it's a string
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      return 'Invalid Date';
    } catch (error) {
      console.error("Error formatting date:", dateInput, error);
      return 'Error';
    }
  };

  return (
    <Stack gap="lg">
      {/* World Header */}
      <Paper withBorder p="lg" radius="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Image
              src={world.imageURL || 'https://placehold.co/600x400?text=RPG+World'}
              height={250}
              radius="md"
              alt={world.name}
              fallbackSrc="https://placehold.co/600x400?text=RPG+World"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack>
              <Group justify="space-between">
                <Group>
                  <ThemeIcon size="xl" radius="md" color="blue">
                    <IconWorld style={{ width: '24px', height: '24px' }} />
                  </ThemeIcon>
                  <Title order={2}>{world.name}</Title>
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
                      onClick={handleEditWorld}
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
                      onClick={handleDeleteWorld}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Group gap="xs">
                <Badge color="blue" size="lg">
                  {world.system}
                </Badge>
                {world.systemVersion && (
                  <Badge color="blue" variant="outline" size="lg">
                    {world.systemVersion}
                  </Badge>
                )}
                {world.genre && (
                  <Badge color="teal" size="lg">
                    {world.genre}
                  </Badge>
                )}

                {/* Privacy Badge */}
                {world.privacySetting === RPGWorldPrivacy.PRIVATE && (
                  <Tooltip label="Only you and invited GMs can view this world">
                    <Badge color="gray" variant="dot" size="lg" leftSection={<IconLock style={{ width: '12px', height: '12px' }} />}>
                      Private
                    </Badge>
                  </Tooltip>
                )}
                {world.privacySetting === RPGWorldPrivacy.SHARED && (
                  <Tooltip label="Players in campaigns can view world-level information">
                    <Badge color="blue" variant="dot" size="lg" leftSection={<IconUsers style={{ width: '12px', height: '12px' }} />}>
                      Shared
                    </Badge>
                  </Tooltip>
                )}
                {world.privacySetting === RPGWorldPrivacy.PUBLIC && (
                  <Tooltip label="Anyone can view this world and its public content">
                    <Badge color="green" variant="dot" size="lg" leftSection={<IconGlobe style={{ width: '12px', height: '12px' }} />}>
                      Public
                    </Badge>
                  </Tooltip>
                )}

                {world.sharedLore && (
                  <Tooltip label="Lore is shared across all campaigns in this world">
                    <Badge color="violet" variant="light" size="lg">
                      Shared Lore
                    </Badge>
                  </Tooltip>
                )}
              </Group>

              <Text>{world.description}</Text>

              <Group>
                <div>
                  <Text size="xs" c="dimmed">Setting</Text>
                  <Text>{world.setting}</Text>
                </div>

                {world.createdAt && (
                  <div>
                    <Text size="xs" c="dimmed">Created</Text>
                    <Text>{formatDate(world.createdAt)}</Text>
                  </div>
                )}

                {world.updatedAt && (
                  <div>
                    <Text size="xs" c="dimmed">Last Updated</Text>
                    <Text>{formatDate(world.updatedAt)}</Text>
                  </div>
                )}
              </Group>

              {world.tags && world.tags.length > 0 && (
                <Group gap="xs">
                  {world.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* World Stats */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="blue">
              <IconBook style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Campaigns</Text>
              <Text fw={700} size="xl">{world.campaignCount || 0}</Text>
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
              <Text fw={700} size="xl">{world.characterCount || 0}</Text>
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
              <Text fw={700} size="xl">{world.locationCount || 0}</Text>
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
              <Text fw={700} size="xl">{world.factionCount || 0}</Text>
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
              <Text fw={700} size="xl">{world.itemCount || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group wrap="nowrap">
            <ThemeIcon size="lg" radius="md" color="orange">
              <IconCalendarEvent style={{ width: '20px', height: '20px' }} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Events</Text>
              <Text fw={700} size="xl">{world.eventCount || 0}</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      {/* World Map (if available) */}
      {world.worldMapURL && (
        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Title order={3}>World Map</Title>
            <Tooltip label="View full size map">
              <ActionIcon
                variant="subtle"
                component="a"
                href={world.worldMapURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconInfoCircle style={{ width: '18px', height: '18px' }} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Box style={{ maxHeight: '500px', overflow: 'hidden' }}>
            <Image
              src={world.worldMapURL}
              alt={`Map of ${world.name}`}
              radius="md"
              fit="contain"
            />
          </Box>
        </Paper>
      )}

      {/* Campaigns */}
      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={3}>Campaigns</Title>
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateCampaign}
          >
            Create Campaign
          </Button>
        </Group>

        {campaigns.length === 0 ? (
          <Box py="xl" ta="center">
            <IconBook style={{ width: '48px', height: '48px' }} color="var(--mantine-color-gray-4)" />
            <Text mt="md" c="dimmed">
              No campaigns yet. Create your first campaign to get started.
            </Text>
          </Box>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => handleViewCampaign(campaign.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Section>
                  <Image
                    src={campaign.imageURL || 'https://placehold.co/600x400?text=Campaign'}
                    height={160}
                    alt={campaign.name}
                  />
                </Card.Section>

                <Group justify="space-between" mt="md">
                  <Text fw={500}>{campaign.name}</Text>
                  {campaign.status && (
                    <Badge color={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  )}
                </Group>

                <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                  {campaign.description || 'No description available'}
                </Text>

                <Group mt="md" gap="xs">
                  {(campaign.characterCount ?? 0) > 0 && (
                    <Badge color="teal" variant="light">
                      {campaign.characterCount} {campaign.characterCount === 1 ? 'Character' : 'Characters'}
                    </Badge>
                  )}
                  {(campaign.locationCount ?? 0) > 0 && (
                    <Badge color="blue" variant="light">
                      {campaign.locationCount} {campaign.locationCount === 1 ? 'Location' : 'Locations'}
                    </Badge>
                  )}
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Paper>
    </Stack>
  );
}

export default RPGWorldDetail;