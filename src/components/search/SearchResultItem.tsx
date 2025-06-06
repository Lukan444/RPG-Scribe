/**
 * Search Result Item Component
 * 
 * Displays individual search results with visual enhancements for AI-powered search.
 * Includes confidence indicators, relationship context, and entity type styling.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Group,
  Text,
  Badge,
  ThemeIcon,
  UnstyledButton,
  Stack,
  Progress,
  Tooltip,
  Box,
  ActionIcon
} from '@mantine/core';
import {
  IconExternalLink,
  IconSparkles,
  IconNetwork,
  IconTarget,
  IconBrain
} from '@tabler/icons-react';
import { AISearchResult } from '../../services/search/AISearchService';
import { EntityType } from '../../models/EntityType';
import { getEntityColor, getEntityIcon } from '../../constants/iconConfig';
import { useTranslation } from 'react-i18next';

/**
 * Props for SearchResultItem component
 */
interface SearchResultItemProps {
  /** Search result data */
  result: AISearchResult;
  /** Whether to show detailed information */
  detailed?: boolean;
  /** Callback when item is clicked */
  onClick?: (result: AISearchResult) => void;
  /** Whether to show relationship context */
  showRelationships?: boolean;
}

/**
 * Get confidence color based on score
 */
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'green';
  if (confidence >= 0.6) return 'yellow';
  if (confidence >= 0.4) return 'orange';
  return 'red';
};

/**
 * Get match type badge
 */
const getMatchTypeBadge = (result: AISearchResult, t: any) => {
  if (result.isExactMatch) {
    return (
      <Badge size="xs" color="blue" variant="filled">
        {t('ui:lists.search.aiSearch.badges.exact')}
      </Badge>
    );
  }

  if (result.isSemanticMatch) {
    return (
      <Badge
        size="xs"
        color="violet"
        variant="gradient"
        gradient={{ from: 'violet', to: 'blue' }}
        leftSection={<IconSparkles size={10} />}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease'
        }}
      >
        {t('ui:lists.search.aiSearch.badges.aiMatch')}
      </Badge>
    );
  }

  return (
    <Badge size="xs" color="gray" variant="outline">
      {t('ui:lists.search.aiSearch.badges.keyword')}
    </Badge>
  );
};

/**
 * Search Result Item Component
 */
export function SearchResultItem({
  result,
  detailed = false,
  onClick,
  showRelationships = true
}: SearchResultItemProps) {
  const { t } = useTranslation(['ui', 'common']);
  const navigate = useNavigate();

  /**
   * Handle item click
   */
  const handleClick = () => {
    if (onClick) {
      onClick(result);
    } else {
      // Navigate to the entity detail page using proper routing
      const entityPath = getEntityPath(result.type, result.id, result);
      navigate(entityPath);
    }
  };

  /**
   * Get navigation path for entity
   */
  const getEntityPath = (entityType: EntityType, entityId: string, searchResult?: AISearchResult): string => {
    // For entities that require worldId, use the world-scoped route if worldId is available
    if (searchResult?.worldId) {
      const worldScopedTypeMap: Record<EntityType, string> = {
        [EntityType.CHARACTER]: `/rpg-worlds/${searchResult.worldId}/characters/${entityId}`,
        [EntityType.LOCATION]: `/rpg-worlds/${searchResult.worldId}/locations/${entityId}`,
        [EntityType.ITEM]: `/rpg-worlds/${searchResult.worldId}/items/${entityId}`,
        [EntityType.EVENT]: `/rpg-worlds/${searchResult.worldId}/events/${entityId}`,
        [EntityType.SESSION]: `/rpg-worlds/${searchResult.worldId}/sessions/${entityId}`,
        [EntityType.FACTION]: `/rpg-worlds/${searchResult.worldId}/factions/${entityId}`,
        [EntityType.STORY_ARC]: `/rpg-worlds/${searchResult.worldId}/story-arcs/${entityId}`,
        [EntityType.NOTE]: `/rpg-worlds/${searchResult.worldId}/notes/${entityId}`,
        [EntityType.CAMPAIGN]: `/rpg-worlds/${searchResult.worldId}/campaigns/${entityId}`,
        [EntityType.RPG_WORLD]: `/rpg-worlds/${entityId}`
      };

      if (worldScopedTypeMap[entityType]) {
        return worldScopedTypeMap[entityType];
      }
    }

    // Fallback to simple routes for entities without worldId or unsupported types
    const typeMap: Record<EntityType, string> = {
      [EntityType.CHARACTER]: `/characters/${entityId}`,
      [EntityType.LOCATION]: `/locations/${entityId}`,
      [EntityType.ITEM]: `/items/${entityId}`,
      [EntityType.EVENT]: `/events/${entityId}`,
      [EntityType.SESSION]: `/sessions/${entityId}`,
      [EntityType.FACTION]: `/factions/${entityId}`,
      [EntityType.STORY_ARC]: `/story-arcs/${entityId}`,
      [EntityType.NOTE]: `/notes/${entityId}`,
      [EntityType.CAMPAIGN]: `/campaigns/${entityId}`,
      [EntityType.RPG_WORLD]: `/rpg-worlds/${entityId}`
    };
    return typeMap[entityType] || `/entity-manager`;
  };

  const EntityIcon = getEntityIcon(result.type);
  const entityColor = getEntityColor(result.type);

  return (
    <UnstyledButton
      onClick={handleClick}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.1) 100%)',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.1) 100%)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" gap="md" style={{ flex: 1 }}>
          {/* Entity Icon */}
          <ThemeIcon
            size="lg"
            variant={result.isExactMatch ? 'filled' : 'light'}
            color={entityColor}
            style={{
              border: result.isSemanticMatch ? '2px solid' : 'none',
              borderColor: result.isSemanticMatch ? 'var(--mantine-color-violet-4)' : 'transparent'
            }}
          >
            {EntityIcon && <EntityIcon size={20} />}
          </ThemeIcon>

          {/* Content */}
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Text fw={500} size="sm" lineClamp={1}>
                  {result.name}
                </Text>
                
                {result.description && (
                  <Text size="xs" c="dimmed" lineClamp={detailed ? 3 : 2} mt={2}>
                    {result.description}
                  </Text>
                )}
                
                {result.matchReason && detailed && (
                  <Text size="xs" c="dimmed" fs="italic" mt={4}>
                    {result.matchReason}
                  </Text>
                )}
              </div>
            </Group>

            {/* Badges and Indicators */}
            <Group gap="xs" align="center">
              {/* Entity Type Badge */}
              <Badge size="xs" color={entityColor} variant="light">
                {result.type}
              </Badge>

              {/* Match Type Badge */}
              {getMatchTypeBadge(result, t)}

              {/* Confidence Score */}
              {result.confidence && (
                <Tooltip label={t('ui:lists.search.aiSearch.tooltips.confidence', { percent: Math.round(result.confidence * 100) })}>
                  <Badge
                    size="xs"
                    color={getConfidenceColor(result.confidence)}
                    variant="outline"
                  >
                    {Math.round(result.confidence * 100)}%
                  </Badge>
                </Tooltip>
              )}

              {/* Relationship Count */}
              {showRelationships && result.relationshipCount && result.relationshipCount > 0 && (
                <Tooltip label={t('ui:lists.search.aiSearch.tooltips.connectedEntities')}>
                  <Badge
                    size="xs"
                    color="blue"
                    variant="outline"
                    leftSection={<IconNetwork size={10} />}
                  >
                    {result.relationshipCount}
                  </Badge>
                </Tooltip>
              )}

              {/* AI Indicator for semantic matches */}
              {result.isSemanticMatch && (
                <Tooltip label={t('ui:lists.search.aiSearch.tooltips.aiPowered')}>
                  <ThemeIcon
                    size="xs"
                    color="violet"
                    variant="light"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(124, 58, 237, 0.3))',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <IconBrain size={10} />
                  </ThemeIcon>
                </Tooltip>
              )}
            </Group>

            {/* Confidence Progress Bar */}
            {detailed && result.confidence && (
              <Box mt="xs">
                <Group justify="space-between" mb={2}>
                  <Text size="xs" c="dimmed">Match Confidence</Text>
                  <Text size="xs" c="dimmed">{Math.round(result.confidence * 100)}%</Text>
                </Group>
                <Progress
                  value={result.confidence * 100}
                  color={getConfidenceColor(result.confidence)}
                  size="xs"
                  radius="xl"
                />
              </Box>
            )}

            {/* Relationship Context */}
            {detailed && showRelationships && result.relationshipContext && result.relationshipContext.length > 0 && (
              <Stack gap={2} mt="xs">
                <Text size="xs" c="dimmed" fw={500}>Relationships:</Text>
                {result.relationshipContext.slice(0, 3).map((context, index) => (
                  <Text key={index} size="xs" c="dimmed" pl="sm">
                    • {context}
                  </Text>
                ))}
                {result.relationshipContext.length > 3 && (
                  <Text size="xs" c="dimmed" pl="sm">
                    • +{result.relationshipContext.length - 3} more...
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Group>

        {/* Action Icon */}
        <Box
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={{
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: 'var(--mantine-color-gray-6)',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: 'var(--mantine-color-gray-4)'
            }
          }}
        >
          <IconExternalLink size={14} />
        </Box>
      </Group>
    </UnstyledButton>
  );
}

export default SearchResultItem;
