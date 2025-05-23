import React from 'react';
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
  Progress,
  Avatar,
  AvatarGroup,
  rem
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconShare,
  IconBookmark,
  IconBook,
  IconPlus,
  IconLock,
  IconWorld,
  IconCalendarEvent,
  IconUsers
} from '@tabler/icons-react';
import { Campaign, CampaignStatus, CampaignPrivacy } from '../../models/Campaign';
import { modals } from '@mantine/modals';

// Props interface
interface CampaignListProps {
  campaigns: Campaign[];
  worldId?: string;
  isLoading?: boolean;
  error?: string | null;
  onCreateCampaign?: () => void;
  onEditCampaign?: (campaignId: string) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onViewCampaign?: (campaignId: string) => void;
}

/**
 * Campaign List Component
 */
export function CampaignList({
  campaigns,
  worldId,
  isLoading = false,
  error = null,
  onCreateCampaign,
  onEditCampaign,
  onDeleteCampaign,
  onViewCampaign
}: CampaignListProps) {
  const navigate = useNavigate();

  // Handle view campaign
  const handleViewCampaign = (campaignId: string) => {
    if (onViewCampaign) {
      onViewCampaign(campaignId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}`);
    } else {
      navigate(`/campaigns/${campaignId}`);
    }
  };

  // Handle edit campaign
  const handleEditCampaign = (event: React.MouseEvent, campaignId: string) => {
    event.stopPropagation();
    if (onEditCampaign) {
      onEditCampaign(campaignId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/edit`);
    } else {
      navigate(`/campaigns/${campaignId}/edit`);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = (event: React.MouseEvent, campaignId: string) => {
    event.stopPropagation();

    // Open confirmation modal
    modals.openConfirmModal({
      title: 'Delete Campaign',
      children: (
        <Text size="sm">
          Are you sure you want to delete this campaign? This action cannot be undone and will also delete all characters, locations, and other data associated with this campaign.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        if (onDeleteCampaign) {
          onDeleteCampaign(campaignId);
        }
      },
    });
  };

  // Get status color
  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.PLANNING: return 'blue';
      case CampaignStatus.ACTIVE: return 'green';
      case CampaignStatus.PAUSED: return 'yellow';
      case CampaignStatus.COMPLETED: return 'teal';
      case CampaignStatus.ABANDONED: return 'red';
      case CampaignStatus.ARCHIVED: return 'gray';
      default: return 'gray';
    }
  };

  // Get progress value based on status
  const getProgressValue = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.PLANNING: return 10;
      case CampaignStatus.ACTIVE: return 50;
      case CampaignStatus.PAUSED: return 50;
      case CampaignStatus.COMPLETED: return 100;
      case CampaignStatus.ABANDONED: return 100;
      case CampaignStatus.ARCHIVED: return 100;
      default: return 0;
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {Array(3).fill(0).map((_, index) => (
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
  if (campaigns.length === 0) {
    return (
      <Center py={50}>
        <Stack align="center" gap="md">
          <IconBook style={{ width: '48px', height: '48px' }} color="var(--mantine-color-gray-5)" />
          <Title order={3}>No Campaigns</Title>
          <Text c="dimmed">Create your first campaign to get started</Text>
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={onCreateCampaign}
          >
            Create Campaign
          </Button>
        </Stack>
      </Center>
    );
  }

  // Render campaign list
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {campaigns.map((campaign) => (
        <Card
          key={campaign.id}
          withBorder
          padding="lg"
          radius="md"
          onClick={() => handleViewCampaign(campaign.id!)}
          style={{ cursor: 'pointer' }}
        >
          <Card.Section>
            <Image
              src={campaign.imageURL || campaign.bannerURL || 'https://placehold.co/600x400?text=Campaign'}
              height={160}
              alt={campaign.name}
            />
          </Card.Section>

          <Group justify="space-between" mt="md">
            <Text fw={500}>{campaign.name}</Text>
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
                  onClick={(e) => handleEditCampaign(e, campaign.id!)}
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
                  onClick={(e) => handleDeleteCampaign(e, campaign.id!)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
            {campaign.description}
          </Text>

          <Group mt="md" gap="xs">
            <Badge color={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>

            {campaign.system && (
              <Badge color="blue" variant="light">
                {campaign.system}
              </Badge>
            )}

            {/* Privacy Badge */}
            {campaign.privacySetting === CampaignPrivacy.PRIVATE && (
              <Tooltip label="Only GMs and players can view this campaign">
                <Badge color="gray" variant="dot" leftSection={<IconLock style={{ width: '10px', height: '10px' }} />}>
                  Private
                </Badge>
              </Tooltip>
            )}
            {campaign.privacySetting === CampaignPrivacy.PUBLIC && (
              <Tooltip label="Anyone can view this campaign">
                <Badge color="green" variant="dot" leftSection={<IconWorld style={{ width: '10px', height: '10px' }} />}>
                  Public
                </Badge>
              </Tooltip>
            )}
          </Group>

          <Progress
            value={getProgressValue(campaign.status)}
            color={getStatusColor(campaign.status)}
            size="sm"
            mt="md"
          />

          <Group justify="space-between" mt="md">
            {campaign.sessionCount !== undefined && (
              <Group gap="xs">
                <IconCalendarEvent style={{ width: '16px', height: '16px' }} color="var(--mantine-color-gray-6)" />
                <Text size="xs" c="dimmed">
                  {campaign.sessionCount} {campaign.sessionCount === 1 ? 'session' : 'sessions'}
                </Text>
              </Group>
            )}

            {campaign.playerIds && campaign.playerIds.length > 0 && (
              <Group gap="xs">
                <Group>
                  {campaign.playerIds.slice(0, 2).map((playerId) => (
                    <Avatar key={playerId} radius="xl" size="sm" />
                  ))}
                  {campaign.playerIds.length > 2 && (
                    <Avatar radius="xl" size="sm">+{campaign.playerIds.length - 2}</Avatar>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  {campaign.playerIds.length} {campaign.playerIds.length === 1 ? 'player' : 'players'}
                </Text>
              </Group>
            )}
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export default CampaignList;