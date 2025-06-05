/**
 * Optimized Entity Count Tooltip Component
 * 
 * High-performance version of EntityCountTooltip with React.memo,
 * useCallback, useMemo optimizations and intelligent rendering.
 */

import React, { memo, useMemo, useCallback } from 'react';
import { Tooltip, Stack, Group, Text, Divider, FloatingPosition, ThemeIcon, Badge, useMantineTheme } from '@mantine/core';
import { EntityType, getEntityTypeIconName, getEntityTypeDisplayName } from '../../models/EntityType';
import { formatDistanceToNow } from 'date-fns';
import * as TablerIcons from '@tabler/icons-react';
import { IconClock, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface EntityTypeBreakdown {
  type: string;
  count: number;
  label: string;
}

interface RecentEntity {
  id: string;
  name: string;
  createdAt: Date;
  type?: string;
}

interface OptimizedEntityCountTooltipProps {
  entityType: EntityType;
  count: number;
  children: React.ReactNode;
  lastUpdated?: Date | null;
  typeBreakdown?: EntityTypeBreakdown[];
  recentEntities?: RecentEntity[];
  relationshipCount?: number;
  position?: FloatingPosition;
  withArrow?: boolean;
  color?: string;
  multiline?: boolean;
  width?: number;
  loading?: boolean;
  cacheHit?: boolean;
  loadTime?: number;
}

/**
 * Memoized helper function to get entity icon
 */
const EntityIcon = memo(({ entityType }: { entityType: EntityType }) => {
  const iconName = getEntityTypeIconName(entityType);
  const IconComponent = (TablerIcons as any)[`Icon${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`];
  return IconComponent ? <IconComponent size={16} /> : null;
});

EntityIcon.displayName = 'EntityIcon';

/**
 * Utility function to check if color is dark
 */
const isDarkColor = (color?: string): boolean => {
  if (!color) return false;
  
  // Simple heuristic for common Mantine colors
  const darkColors = ['dark', 'gray', 'blue', 'indigo', 'violet', 'grape'];
  return darkColors.some(darkColor => color.includes(darkColor));
};

/**
 * Memoized recent entity item component
 */
const RecentEntityItem = memo(({ 
  entity, 
  entityType, 
  color, 
  textColor, 
  dimmedTextColor,
  t 
}: {
  entity: RecentEntity;
  entityType: EntityType;
  color?: string;
  textColor: string;
  dimmedTextColor: string;
  t: any;
}) => {
  const createdText = useMemo(() => {
    try {
      if (entity?.createdAt && !isNaN(entity.createdAt.getTime())) {
        return formatDistanceToNow(entity.createdAt, { addSuffix: true });
      }
    } catch (error) {
      console.error('Invalid date value in RecentEntityItem:', error);
    }
    return t('tooltips.createdUnknownDate');
  }, [entity?.createdAt, t]);

  const badgeColor = useMemo(() => {
    if (!entity?.type) return 'gray';
    
    const type = entity.type.toLowerCase();
    if (type === 'pc') return 'blue';
    if (type === 'npc') return 'teal';
    return 'gray';
  }, [entity?.type]);

  if (!entity) return null;

  return (
    <Group wrap="nowrap" gap="xs">
      <ThemeIcon size="sm" variant={isDarkColor(color) ? 'filled' : 'light'} color={color}>
        <EntityIcon entityType={entityType} />
      </ThemeIcon>
      <Stack gap={0} style={{ flex: 1 }}>
        <Group justify="space-between" gap="xs">
          <Text size="xs" fw={500} c={textColor} lineClamp={1}>
            {entity.name || 'Unnamed'}
          </Text>
          {entity.type && (
            <Badge size="xs" variant={isDarkColor(color) ? 'filled' : 'light'} color={badgeColor}>
              {entity.type === 'OTHER' ? t('tooltips.other') : entity.type}
            </Badge>
          )}
        </Group>
        <Text size="xs" c={dimmedTextColor}>Created {createdText}</Text>
      </Stack>
    </Group>
  );
});

RecentEntityItem.displayName = 'RecentEntityItem';

/**
 * Optimized Entity Count Tooltip Component
 */
export const OptimizedEntityCountTooltip = memo<OptimizedEntityCountTooltipProps>(({
  entityType,
  count,
  children,
  lastUpdated,
  typeBreakdown = [],
  recentEntities = [],
  relationshipCount = 0,
  position = 'top',
  withArrow = true,
  color,
  multiline = true,
  width = 250,
  loading = false,
  cacheHit = false,
  loadTime = 0
}) => {
  const { t } = useTranslation(['ui', 'common']);
  const theme = useMantineTheme();

  // Memoized color calculations
  const { textColor, dimmedTextColor } = useMemo(() => ({
    textColor: isDarkColor(color) ? 'white' : 'dark',
    dimmedTextColor: isDarkColor(color) ? 'gray.3' : 'dimmed'
  }), [color]);

  // Memoized last updated text
  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) {
      return (
        <Group gap="xs" wrap="nowrap">
          <IconClock size={14} />
          <Text size="xs" c={dimmedTextColor} span>
            {t('tooltips.noUpdateInformation')}
          </Text>
        </Group>
      );
    }

    try {
      const isValidDate = !isNaN(lastUpdated.getTime());
      if (isValidDate) {
        return (
          <Group gap="xs" wrap="nowrap">
            <IconClock size={14} />
            <Text size="xs" c={dimmedTextColor} span>
              Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </Text>
          </Group>
        );
      }
    } catch (error) {
      console.error('Invalid date value in OptimizedEntityCountTooltip:', error);
    }

    return (
      <Group gap="xs" wrap="nowrap">
        <IconClock size={14} />
        <Text size="xs" c={dimmedTextColor} span>
          {t('tooltips.noUpdateInformation')}
        </Text>
      </Group>
    );
  }, [lastUpdated, dimmedTextColor, t]);

  // Memoized type breakdown section
  const typeBreakdownSection = useMemo(() => {
    if (!typeBreakdown || typeBreakdown.length === 0) return null;

    return (
      <>
        <Text size="sm" fw={500} c={textColor}>{t('tooltips.breakdown')}</Text>
        {typeBreakdown.map((item, index) => (
          <Group key={index} justify="space-between" gap="xs">
            <Text size="xs" c={textColor}>{item.label}:</Text>
            <Text size="xs" fw={500} c={textColor}>{item.count}</Text>
          </Group>
        ))}
        <Divider my={5} color={isDarkColor(color) ? 'gray.5' : 'gray.3'} />
      </>
    );
  }, [typeBreakdown, textColor, color, t]);

  // Memoized recent entities section
  const recentEntitiesSection = useMemo(() => {
    if (!recentEntities || recentEntities.length === 0) return null;

    const visibleEntities = recentEntities.slice(0, 3);
    const remainingCount = recentEntities.length - 3;

    return (
      <>
        <Divider my={5} color={isDarkColor(color) ? 'gray.5' : 'gray.3'} />
        <Text size="sm" fw={500} c={textColor}>{t('tooltips.recentlyAdded')}</Text>
        {visibleEntities.map((entity, index) => (
          <RecentEntityItem
            key={entity?.id || index}
            entity={entity}
            entityType={entityType}
            color={color}
            textColor={textColor}
            dimmedTextColor={dimmedTextColor}
            t={t}
          />
        ))}
        {remainingCount > 0 && (
          <Text size="xs" c={dimmedTextColor} ta="center">
            {t('ui:tooltips.moreRecentCharacters', { count: remainingCount })}
          </Text>
        )}
      </>
    );
  }, [recentEntities, entityType, color, textColor, dimmedTextColor, t]);

  // Memoized performance indicator
  const performanceIndicator = useMemo(() => {
    if (loadTime === 0) return null;

    const performanceColor = cacheHit ? 'green' : loadTime < 200 ? 'yellow' : 'red';
    const performanceText = cacheHit ? 'Cached' : `${loadTime.toFixed(0)}ms`;

    return (
      <Group gap="xs" wrap="nowrap">
        <Badge size="xs" color={performanceColor} variant="light">
          {performanceText}
        </Badge>
      </Group>
    );
  }, [cacheHit, loadTime]);

  // Memoized tooltip content
  const tooltipContent = useMemo(() => {
    if (loading) {
      return (
        <Stack gap="xs">
          <Text size="sm" c={textColor}>Loading...</Text>
        </Stack>
      );
    }

    try {
      return (
        <Stack gap="xs">
          {/* Performance indicator */}
          {performanceIndicator}

          {/* Entity Type Breakdown */}
          {typeBreakdownSection}

          {/* Last Updated Information */}
          {lastUpdatedText}

          {/* Recently Added Entities */}
          {recentEntitiesSection}

          {/* Activity Summary */}
          <Divider my={5} color={isDarkColor(color) ? 'gray.5' : 'gray.3'} />
          <Group gap="xs" wrap="nowrap">
            <IconInfoCircle size={14} style={{ color: isDarkColor(color) ? theme.colors.gray[3] : theme.colors.gray[6] }} />
            <Text size="xs" fw={500} c={textColor}>
              {count === 0
                ? `No ${getEntityTypeDisplayName(entityType).toLowerCase()}s yet`
                : t('ui:tooltips.totalCharacters', { count })
              }
            </Text>
          </Group>
        </Stack>
      );
    } catch (error) {
      console.error('Error generating optimized tooltip content:', error);
      return (
        <Stack gap="xs">
          <Text c="red" size="sm">Error displaying tooltip content</Text>
          <Text size="xs">Please check the console for details</Text>
        </Stack>
      );
    }
  }, [
    loading,
    performanceIndicator,
    typeBreakdownSection,
    lastUpdatedText,
    recentEntitiesSection,
    color,
    theme.colors.gray,
    textColor,
    count,
    entityType,
    t
  ]);

  // Memoized tooltip props
  const tooltipProps = useMemo(() => ({
    label: tooltipContent,
    position,
    withArrow,
    color,
    multiline,
    w: width,
    transitionProps: { duration: 200 },
    openDelay: 300,
    closeDelay: 100
  }), [tooltipContent, position, withArrow, color, multiline, width]);

  return (
    <Tooltip {...tooltipProps}>
      {children}
    </Tooltip>
  );
});

OptimizedEntityCountTooltip.displayName = 'OptimizedEntityCountTooltip';

export default OptimizedEntityCountTooltip;
