import React from 'react';
import {
  Card,
  Image,
  Text,
  Group,
  Badge,
  Button,
  ActionIcon,
  Menu,
  rem,
  Box,
  createTheme
} from '@mantine/core';
import {
  IconBookmark,
  IconHeart,
  IconShare,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';

// Define styles as CSS classes
const styles = {
  card: {
    backgroundColor: 'var(--mantine-color-body)',
    transition: 'transform 150ms ease, box-shadow 150ms ease',
  } as React.CSSProperties,

  imageSection: {
    position: 'relative' as const,
    padding: 0,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderBottom: `1px solid var(--mantine-color-gray-3)`,
  } as React.CSSProperties,

  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, .85) 90%)',
  } as React.CSSProperties,

  content: {
    position: 'relative' as const,
    zIndex: 1,
  } as React.CSSProperties,

  title: {
    fontFamily: `Greycliff CF, var(--mantine-font-family)`,
    fontWeight: 900,
    color: 'white',
    lineHeight: 1.2,
    fontSize: '22px',
    marginTop: 'var(--mantine-spacing-xs)',
  } as React.CSSProperties,

  category: {
    opacity: 0.7,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  footer: {
    padding: `var(--mantine-spacing-xs) var(--mantine-spacing-lg)`,
    marginTop: 'var(--mantine-spacing-md)',
    borderTop: `1px solid var(--mantine-color-gray-2)`,
  } as React.CSSProperties,

  stats: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 'var(--mantine-spacing-xs)',
  } as React.CSSProperties,
};

interface ArticleCardProps {
  id: string;
  image?: string; // Make image optional to handle undefined values
  title: string;
  description: string;
  entityType: any; // Accept any EntityType to handle different enum implementations
  category?: string;
  date?: string;
  author?: {
    name: string;
    image?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBookmark?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  isBookmarked?: boolean;
  isLiked?: boolean;
}

export function ArticleCard({
  image,
  title,
  description,
  entityType,
  category,
  date,
  author,
  stats,
  onView,
  onEdit,
  onDelete,
  onBookmark,
  onLike,
  onShare,
  isBookmarked = false,
  isLiked = false,
}: ArticleCardProps) {
  // No need for useStyles in Mantine 8.0

  // Get entity type color
  const getEntityColor = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return 'teal';
    if (entityTypeStr.includes('LOCATION')) return 'blue';
    if (entityTypeStr.includes('ITEM')) return 'yellow';
    if (entityTypeStr.includes('EVENT')) return 'violet';
    if (entityTypeStr.includes('SESSION')) return 'orange';
    if (entityTypeStr.includes('CAMPAIGN')) return 'red';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'indigo';
    if (entityTypeStr.includes('NOTE')) return 'cyan';

    return 'gray';
  };

  // Get placeholder image based on entity type
  const getPlaceholderImage = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return '/images/character-placeholder.png';
    if (entityTypeStr.includes('LOCATION')) return '/images/location-placeholder.png';
    if (entityTypeStr.includes('ITEM')) return '/images/item-placeholder.png';
    if (entityTypeStr.includes('EVENT')) return '/images/event-placeholder.png';
    if (entityTypeStr.includes('SESSION')) return '/images/session-placeholder.png';
    if (entityTypeStr.includes('CAMPAIGN')) return '/images/campaign-placeholder.png';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return '/images/rpgworld-placeholder.png';
    if (entityTypeStr.includes('NOTE')) return '/images/note-placeholder.png';

    return '/images/placeholder.png';
  };

  return (
    <Card withBorder radius="md" p={0} style={styles.card}>
      <Card.Section style={styles.imageSection}>
        <Image
          src={image || getPlaceholderImage()}
          alt={title}
          height={220}
          fallbackSrc={getPlaceholderImage()}
        />
        <div style={styles.overlay} />

        <Box style={styles.content} p="lg">
          <Badge color={getEntityColor()} variant="filled" size="sm">
            {category || (() => {
              // Format entity type name for display
              const entityTypeStr = entityType.toString();

              // Handle special cases
              if (entityTypeStr.toUpperCase().includes('RPGWORLD') || entityTypeStr.toUpperCase().includes('RPG_WORLD')) {
                return 'RPG World';
              }

              // Format normal cases - capitalize first letter
              return entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1).toLowerCase();
            })()}
          </Badge>

          <Text style={styles.title} component="h3" mb="xs">
            {title}
          </Text>

          {date && (
            <Group justify="space-between">
              <Text c="dimmed" size="xs">
                {date}
              </Text>
            </Group>
          )}
        </Box>
      </Card.Section>

      <Card.Section p="md">
        <Text size="sm" lineClamp={3}>
          {description || 'No description available'}
        </Text>
      </Card.Section>

      <Card.Section style={styles.footer}>
        <Group justify="space-between">
          <Group>
            {onView && (
              <Button
                variant="light"
                color={getEntityColor()}
                size="xs"
                leftSection={<IconEye style={{ width: '14px', height: '14px' }} />}
                onClick={onView}
              >
                View
              </Button>
            )}
          </Group>

          <Group gap={8}>
            {onBookmark && (
              <ActionIcon variant={isBookmarked ? "filled" : "subtle"} color={getEntityColor()}>
                <IconBookmark style={{ width: '16px', height: '16px' }} onClick={onBookmark} />
              </ActionIcon>
            )}

            {onLike && (
              <ActionIcon variant={isLiked ? "filled" : "subtle"} color="red">
                <IconHeart style={{ width: '16px', height: '16px' }} onClick={onLike} />
              </ActionIcon>
            )}

            {onShare && (
              <ActionIcon variant="subtle" color="gray">
                <IconShare style={{ width: '16px', height: '16px' }} onClick={onShare} />
              </ActionIcon>
            )}

            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDotsVertical style={{ width: '16px', height: '16px' }} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {onView && (
                  <Menu.Item
                    leftSection={<IconEye style={{ width: '14px', height: '14px' }} />}
                    onClick={onView}
                  >
                    View details
                  </Menu.Item>
                )}
                {onEdit && (
                  <Menu.Item
                    leftSection={<IconEdit style={{ width: '14px', height: '14px' }} />}
                    onClick={onEdit}
                  >
                    Edit
                  </Menu.Item>
                )}
                {onDelete && (
                  <Menu.Item
                    leftSection={<IconTrash style={{ width: '14px', height: '14px' }} />}
                    color="red"
                    onClick={onDelete}
                  >
                    Delete
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Card.Section>
    </Card>
  );
}

export default ArticleCard;