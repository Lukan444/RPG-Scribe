import React, { useState, useEffect, useRef } from 'react';
import { Badge, HoverCard, Group, Text, Tooltip, ThemeIcon, Loader } from '@mantine/core';
import {
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconNetwork,
  IconInfoCircle
} from '@tabler/icons-react';
import { EntityRelationshipsService } from '../../services/entityRelationships.service';
import { EntityType } from '../../models/EntityType';
import { useNavigate } from 'react-router-dom';
import { getRelationshipCountAriaLabel, getZeroRelationshipAriaLabel } from '../../utils/accessibility';

interface RelationshipCounterProps {
  entityId: string;
  entityType: any; // Accept any EntityType to handle different enum implementations
  count?: number;
  interactive?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'light';
  showIcon?: boolean;
  breakdown?: {
    [key: string]: number;
  } | null;
  worldId?: string;
  campaignId?: string;
  onMouseEnter?: () => void;
}

/**
 * @deprecated This component is deprecated. Use RelationshipCountBadge from '../relationships/badges' instead.
 *
 * RelationshipCounter component - Displays a badge with relationship count
 * and a visual indicator for zero relationships
 *
 * If count is not provided, it will fetch the count from the database
 */
export function RelationshipCounter({
  entityId,
  entityType,
  count,
  interactive = true,
  size = 'sm',
  variant = 'filled',
  showIcon = true,
  breakdown,
  worldId = '',
  campaignId = '',
  onMouseEnter
}: RelationshipCounterProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(count === undefined);
  const [actualCount, setActualCount] = useState(count || 0);
  const badgeRef = useRef<HTMLDivElement>(null);
  const isZero = actualCount === 0;

  // Load relationship count if not provided
  useEffect(() => {
    const loadRelationshipCount = async () => {
      if (count === undefined) {
        setLoading(true);
        try {
          const relationshipService = new EntityRelationshipsService(campaignId, worldId);
          const relationships = await relationshipService.getEntityRelationships(
            entityId,
            entityType
          );
          setActualCount(relationships.length);
        } catch (error) {
          console.error('Error loading relationship count:', error);
          setActualCount(0);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRelationshipCount();
  }, [entityId, entityType, count, campaignId, worldId]);

  // Get color based on entity type
  const getColor = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return 'teal';
    if (entityTypeStr.includes('LOCATION')) return 'blue';
    if (entityTypeStr.includes('ITEM')) return 'yellow';
    if (entityTypeStr.includes('EVENT')) return 'violet';
    if (entityTypeStr.includes('SESSION')) return 'orange';
    if (entityTypeStr.includes('CAMPAIGN')) return 'red';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'indigo';
    return 'gray';
  };

  // Get icon based on entity type
  const getIcon = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return <IconUsers size={14} />;
    if (entityTypeStr.includes('LOCATION')) return <IconMap size={14} />;
    if (entityTypeStr.includes('ITEM')) return <IconSword size={14} />;
    if (entityTypeStr.includes('EVENT')) return <IconCalendarEvent size={14} />;
    return <IconNetwork size={14} />;
  };

  // Handle click to navigate to relationships page
  const handleClick = () => {
    if (interactive) {
      // Convert entityType to string for path construction
      let entityTypePath = entityType.toString().toLowerCase();

      // Handle special cases for path construction
      if (entityTypePath.includes('rpgworld') || entityTypePath.includes('rpg_world')) {
        entityTypePath = 'rpgworlds';
      } else {
        // Add 's' for plural in URL
        entityTypePath = entityTypePath + 's';
      }

      // Use worldId and campaignId if provided, otherwise use a generic path
      if (worldId && campaignId) {
        navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/${entityTypePath}/${entityId}/relationships`);
      } else {
        navigate(`/entities/${entityTypePath}/${entityId}/relationships`);
      }
    }
  };

  // Accessibility: Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  // Get entity type name for display
  const getEntityTypeName = () => {
    // Convert entityType to string for formatting
    const entityTypeStr = entityType.toString();

    // Handle special cases
    if (entityTypeStr.toUpperCase().includes('RPGWORLD') || entityTypeStr.toUpperCase().includes('RPG_WORLD')) {
      return 'RPG World';
    }

    // Format normal cases
    return entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1).toLowerCase();
  };

  // Render badge with hover card for breakdown
  return (
    <Group gap={4} wrap="nowrap">
      {loading ? (
        <Loader size={size === 'xs' ? 'xs' : size === 'lg' ? 'md' : 'sm'} color={getColor()} />
      ) : (
        <HoverCard width={200} shadow="md" withArrow openDelay={300} closeDelay={100} disabled={!breakdown}>
          <HoverCard.Target>
            <Badge
              ref={badgeRef}
              renderRoot={(props) =>
                interactive ? (
                  <button {...props} type="button" />
                ) : (
                  <div {...props} />
                )
              }
              color={getColor()}
              size={size}
              variant={variant}
              leftSection={showIcon ? getIcon() : null}
              onClick={handleClick}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              aria-label={getRelationshipCountAriaLabel(actualCount, entityType)}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                setHovered(true);
                if (onMouseEnter) onMouseEnter();
              }}
              onMouseLeave={() => setHovered(false)}
              onKeyDown={handleKeyDown}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? "button" : undefined}
              aria-haspopup={breakdown ? "dialog" : undefined}
              aria-expanded={breakdown ? hovered : undefined}
            >
              {actualCount}
            </Badge>
          </HoverCard.Target>

          {breakdown && (
            <HoverCard.Dropdown aria-live="polite">
              <Text size="sm" fw={500} mb="xs">Relationship Breakdown</Text>
              {Object.entries(breakdown).length > 0 ? (
                Object.entries(breakdown).map(([type, typeCount]) => (
                  <Group key={type} justify="space-between" mb="xs">
                    <Group gap="xs">
                      {type === 'character' && <IconUsers size={14} />}
                      {type === 'location' && <IconMap size={14} />}
                      {type === 'item' && <IconSword size={14} />}
                      {type === 'event' && <IconCalendarEvent size={14} />}
                      <Text size="xs">{type.charAt(0).toUpperCase() + type.slice(1)}s:</Text>
                    </Group>
                    <Text size="xs" fw={500}>{typeCount}</Text>
                  </Group>
                ))
              ) : (
                <Text size="xs" c="dimmed">No relationships found</Text>
              )}
            </HoverCard.Dropdown>
          )}
        </HoverCard>
      )}

      {/* Visual indicator for zero relationships */}
      {!loading && isZero && (
        <Tooltip
          label={`No relationships found. Click to add relationships for this ${getEntityTypeName().toLowerCase()}.`}
          position="top"
          withArrow
          transitionProps={{ transition: 'fade', duration: 200 }}
        >
          <ThemeIcon
            color="blue"
            variant="light"
            size={size === 'xs' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
            radius="xl"
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onClick={handleClick}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={handleKeyDown}
            role={interactive ? "button" : undefined}
            aria-label={getZeroRelationshipAriaLabel(entityType)}
          >
            <IconInfoCircle size={size === 'xs' ? 10 : size === 'lg' ? 16 : 14} />
          </ThemeIcon>
        </Tooltip>
      )}
    </Group>
  );
}
