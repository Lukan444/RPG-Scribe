import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Image,
  Text,
  Badge,
  Group,
  Menu,
  ActionIcon,
  Tooltip,
  Skeleton
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLink,
  IconEye,
  IconCopy
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import { RelationshipCountBadge } from '../relationships/badges';
import { RelationshipBreakdownService, RelationshipBreakdown } from '../../services/relationshipBreakdown.service';

/**
 * Entity card props
 */
interface EntityCardProps {
  id: string;
  type: any; // Accept any EntityType to handle different enum implementations
  name: string;
  description?: string;
  imageUrl?: string;
  badges?: { label: string; color?: string }[];
  metadata?: { label: string; value: string }[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  worldId?: string;
  campaignId?: string;
  relationshipCount?: number;
  showRelationshipCount?: boolean;
}

/**
 * EntityCard component - Card for displaying entity information
 */
export function EntityCard({
  id,
  type,
  name,
  description,
  imageUrl,
  badges = [],
  metadata = [],
  onEdit,
  onDelete,
  onView,
  worldId = '',
  campaignId = '',
  relationshipCount,
  showRelationshipCount = true
}: EntityCardProps) {
  const navigate = useNavigate();
  const [menuOpened, setMenuOpened] = useState(false);
  const [breakdown, setBreakdown] = useState<RelationshipBreakdown | undefined>(undefined);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [isLoadingRelationshipCount, setIsLoadingRelationshipCount] = useState(false);

  // Load relationship breakdown on hover
  const loadBreakdown = async () => {
    if (!worldId || !campaignId || !id || breakdown !== undefined) return;

    try {
      setIsLoadingBreakdown(true);
      const breakdownService = new RelationshipBreakdownService(worldId, campaignId);
      const result = await breakdownService.getRelationshipBreakdown(id, type);
      setBreakdown(result);
    } catch (error) {
      console.error('Error loading relationship breakdown:', error);
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // State for internal relationship count
  const [internalRelationshipCount, setInternalRelationshipCount] = useState<number | undefined>(relationshipCount);

  // Load relationship count if not provided
  useEffect(() => {
    const loadRelationshipCount = async () => {
      if (relationshipCount === undefined && worldId && campaignId && id) {
        try {
          setIsLoadingRelationshipCount(true);
          const breakdownService = RelationshipBreakdownService.getInstance(worldId, campaignId);
          const result = await breakdownService.getRelationshipBreakdown(id, type);
          setInternalRelationshipCount(result.total);
        } catch (error) {
          console.error('Error loading relationship count:', error);
          setInternalRelationshipCount(0);
        } finally {
          setIsLoadingRelationshipCount(false);
        }
      } else if (relationshipCount !== undefined) {
        // Update internal state if relationshipCount prop changes
        setInternalRelationshipCount(relationshipCount);
      }
    };

    loadRelationshipCount();
  }, [id, type, relationshipCount, worldId, campaignId]);

  // Get path based on entity type
  const getEntityPath = (type: EntityType): string => {
    // Use world-scoped route if worldId is available
    if (worldId) {
      const typeLower = type.toLowerCase();
      return `/rpg-worlds/${worldId}/${typeLower}s/${id}`;
    }

    // Fallback to simple route
    const typeLower = type.toLowerCase();
    return `/${typeLower}s/${id}`;
  };

  // Handle view click
  const handleView = () => {
    if (onView) {
      onView(id);
    } else {
      navigate(getEntityPath(type));
    }
  };

  // Handle edit click
  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`${getEntityPath(type)}/edit`);
    }
  };

  // Handle delete click
  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    } else {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        console.log(`Delete ${name} (${id})`);
        // Implement delete logic
      }
    }
  };

  // Handle copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}${getEntityPath(type)}`;
    navigator.clipboard.writeText(url);
    // Show notification (would use Mantine notifications in a real app)
    console.log(`Link copied to clipboard: ${url}`);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {imageUrl && (
        <Card.Section>
          <Image
            src={imageUrl}
            height={160}
            alt={name}
            fallbackSrc="https://placehold.co/600x400?text=No+Image"
          />
        </Card.Section>
      )}

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{name}</Text>

        <Menu
          position="bottom-end"
          shadow="md"
          width={200}
          opened={menuOpened}
          onChange={setMenuOpened}
        >
          <Menu.Target>
            <ActionIcon variant="subtle" aria-label="Options">
              <IconDotsVertical style={{ width: '16px', height: '16px' }} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEye style={{ width: '14px', height: '14px' }} />}
              onClick={handleView}
            >
              View Details
            </Menu.Item>
            <Menu.Item
              leftSection={<IconEdit style={{ width: '14px', height: '14px' }} />}
              onClick={handleEdit}
            >
              Edit
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLink style={{ width: '14px', height: '14px' }} />}
              onClick={handleCopyLink}
            >
              Copy Link
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash style={{ width: '14px', height: '14px' }} />}
              onClick={handleDelete}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Group gap={5} mb="xs">
        <Badge color="teal">{type}</Badge>
        {badges.map((badge, index) => (
          <Badge key={index} color={badge.color || 'blue'}>
            {badge.label}
          </Badge>
        ))}
        {showRelationshipCount && (
          isLoadingRelationshipCount ? (
            <Skeleton height={22} width={40} radius="xl" />
          ) : (
            <RelationshipCountBadge
              entityId={id || 'dashboard'}
              entityType={type}
              count={internalRelationshipCount || 0}
              interactive={true}
              breakdownData={breakdown}
              onHover={loadBreakdown}
              worldId={worldId || ''}
              campaignId={campaignId || ''}
              size="sm"
              variant="filled"
            />
          )
        )}
      </Group>

      {description && (
        <Text size="sm" c="dimmed" lineClamp={2}>
          {description}
        </Text>
      )}

      {metadata.length > 0 && (
        <Group mt="md" gap="xs">
          {metadata.map((item, index) => (
            <Tooltip key={index} label={item.value}>
              <Badge variant="light" color="gray">
                {item.label}: {item.value}
              </Badge>
            </Tooltip>
          ))}
        </Group>
      )}
    </Card>
  );
}
