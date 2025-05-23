import React from 'react';
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
  type?: string; // Optional subtype (e.g., PC/NPC for characters)
}

interface EntityCountTooltipProps {
  entityType: EntityType;
  count: number;
  children: React.ReactNode;
  lastUpdated?: Date | null;
  typeBreakdown?: EntityTypeBreakdown[];
  recentEntities?: RecentEntity[]; // New prop for recently added entities
  relationshipCount?: number; // Keep this for backward compatibility
  position?: FloatingPosition;
  withArrow?: boolean;
  color?: string;
  multiline?: boolean;
  width?: number;
}

/**
 * A tooltip component for entity counts that shows detailed information on hover
 */
/**
 * Helper function to get the appropriate icon component for an entity type
 */
const getEntityIcon = (entityType: EntityType) => {
  const iconName = getEntityTypeIconName(entityType);
  const IconComponent = (TablerIcons as any)[`Icon${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`];
  return IconComponent ? <IconComponent size={16} /> : null;
};

/**
 * Helper function to determine if a color is dark
 * @param color The color to check
 * @returns True if the color is dark, false otherwise
 */
const isDarkColor = (color?: string): boolean => {
  // Default colors that are considered dark
  const darkColors = ['blue', 'violet', 'indigo', 'grape', 'dark', 'black', 'teal', 'green', 'cyan'];
  return color ? darkColors.includes(color) : false;
};

export function EntityCountTooltip({
  entityType,
  count,
  children,
  lastUpdated,
  typeBreakdown = [],
  recentEntities = [],
  relationshipCount = 0, // Add this parameter for backward compatibility
  position = 'top',
  withArrow = true,
  color,
  multiline = true,
  width = 250 // Increased width to accommodate more information
}: EntityCountTooltipProps) {
  const { t } = useTranslation(['ui', 'common']);
  // Debug logging to help identify issues
  try {
    console.debug('EntityCountTooltip props:', {
      entityType,
      count,
      lastUpdated: lastUpdated ? lastUpdated.toString() : null,
      typeBreakdownLength: typeBreakdown?.length,
      recentEntitiesLength: recentEntities?.length,
      color
    });

    // Check for potential issues with recentEntities
    if (recentEntities && recentEntities.length > 0) {
      console.debug('First recent entity:', {
        ...recentEntities[0],
        createdAt: recentEntities[0].createdAt ? recentEntities[0].createdAt.toString() : null
      });
    }
  } catch (error) {
    console.error('Error in EntityCountTooltip debug logging:', error);
  }

  const theme = useMantineTheme();

  // Determine text color based on background color for better contrast
  const textColor = isDarkColor(color) ? 'white' : 'dark';
  const dimmedTextColor = isDarkColor(color) ? 'gray.3' : 'dimmed';

  // Format the last updated date if available and valid
  let lastUpdatedText = (
    <Group gap="xs" wrap="nowrap">
      <IconClock size={14} />
      <Text size="xs" c={dimmedTextColor} span>
        {t('ui:tooltips.noUpdateInformation')}
      </Text>
    </Group>
  );

  if (lastUpdated) {
    try {
      // Check if the date is valid before formatting
      const isValidDate = !isNaN(lastUpdated.getTime());

      if (isValidDate) {
        lastUpdatedText = (
          <Group gap="xs" wrap="nowrap">
            <IconClock size={14} />
            <Text size="xs" c={dimmedTextColor} span>
              Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </Text>
          </Group>
        );
      }
    } catch (error) {
      console.error('Invalid date value in EntityCountTooltip:', error);
    }
  }

  // Generate the tooltip content
  let tooltipContent;

  try {
    tooltipContent = (
      <Stack gap="xs">
        {/* Entity Type Breakdown */}
        {typeBreakdown && typeBreakdown.length > 0 && (
          <>
            <Text size="sm" fw={500} c={textColor}>{t('ui:tooltips.breakdown')}</Text>
            {typeBreakdown.map((item, index) => (
              <Group key={index} justify="space-between" gap="xs">
                <Text size="xs" c={textColor}>{item.label}:</Text>
                <Text size="xs" fw={500} c={textColor}>{item.count}</Text>
              </Group>
            ))}
            <Divider my={5} color={isDarkColor(color) ? 'gray.5' : 'gray.3'} />
          </>
        )}

        {/* Last Updated Information */}
        {lastUpdatedText}

        {/* Recently Added Entities */}
        {recentEntities && recentEntities.length > 0 && (
          <>
            <Divider my={5} color={isDarkColor(color) ? 'gray.5' : 'gray.3'} />
            <Text size="sm" fw={500} c={textColor}>{t('ui:tooltips.recentlyAdded')}</Text>
            {recentEntities.slice(0, 3).map((entity, index) => {
              // Format creation date
              let createdText = t('ui:tooltips.createdUnknownDate');
              try {
                if (entity && entity.createdAt && !isNaN(entity.createdAt.getTime())) {
                  createdText = formatDistanceToNow(entity.createdAt, { addSuffix: true });
                }
              } catch (error) {
                console.error('Invalid date value in EntityCountTooltip:', error);
              }

              if (!entity) {
                return null; // Skip rendering if entity is undefined
              }

              return (
                <Group key={index} wrap="nowrap" gap="xs">
                  <ThemeIcon size="sm" variant={isDarkColor(color) ? 'filled' : 'light'} color={color}>
                    {getEntityIcon(entityType)}
                  </ThemeIcon>
                  <Stack gap={0} style={{ flex: 1 }}>
                    <Group justify="space-between" gap="xs">
                      <Text size="xs" fw={500} c={textColor} lineClamp={1}>{entity.name || 'Unnamed'}</Text>
                      {entity.type && (
                        <Badge size="xs" variant={isDarkColor(color) ? 'filled' : 'light'} color={
                          entity.type.toLowerCase() === 'pc' ? 'blue' :
                          entity.type.toLowerCase() === 'npc' ? 'teal' : 'gray'
                        }>
                          {entity.type === 'OTHER' ? t('ui:tooltips.other') : entity.type}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c={dimmedTextColor}>Created {createdText}</Text>
                  </Stack>
                </Group>
              );
            })}

            {/* Show count of additional entities if more than 3 */}
            {recentEntities.length > 3 && (
              <Text size="xs" c={dimmedTextColor} ta="center">
                {t('ui:tooltips.moreRecentCharacters', { count: recentEntities.length - 3 })}
              </Text>
            )}
          </>
        )}

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
    console.error('Error generating tooltip content:', error);

    // Fallback to a simple tooltip content
    tooltipContent = (
      <Stack gap="xs">
        <Text c="red" size="sm">Error displaying tooltip content</Text>
        <Text size="xs">Please check the console for details</Text>
      </Stack>
    );
  }

  return (
    <Tooltip
      label={tooltipContent}
      position={position}
      withArrow={withArrow}
      color={color}
      multiline={multiline}
      w={width}
      transitionProps={{ duration: 200 }}
      openDelay={300}
      closeDelay={100}
    >
      {children}
    </Tooltip>
  );
}

export default EntityCountTooltip;
