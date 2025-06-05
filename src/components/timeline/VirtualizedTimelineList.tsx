/**
 * Virtualized Timeline List Component
 *
 * Optimized for rendering large datasets (100+ timeline entries)
 * with virtual scrolling and performance optimizations.
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Box,
  ThemeIcon,
  Tooltip,
  ScrollArea
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconClock,
  IconCalendar,
  IconSword,
  IconMapPin,
  IconEye,
  IconUsers,
  IconBook,
  IconFlag
} from '@tabler/icons-react';
import { TimelineEntry } from '../../models/Timeline';
import { TimelineEntryType } from '../../constants/timelineConstants';
import { useTranslation } from 'react-i18next';

interface VirtualizedTimelineListProps {
  entries: TimelineEntry[];
  onEntryEdit?: (entry: TimelineEntry) => void;
  onEntryDelete?: (entryId: string) => void;
  onEntryView?: (entry: TimelineEntry) => void;
  height?: number;
  width?: number; // Add width prop
  itemHeight?: number;
  showActions?: boolean;
}

interface TimelineItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    entries: TimelineEntry[];
    onEntryEdit?: (entry: TimelineEntry) => void;
    onEntryDelete?: (entryId: string) => void;
    onEntryView?: (entry: TimelineEntry) => void;
    showActions: boolean;
    t: any;
  };
}

// Icon mapping for different entry types
const getEntryTypeIcon = (entryType: TimelineEntryType) => {
  switch (entryType) {
    case TimelineEntryType.SESSION_START:
    case TimelineEntryType.SESSION_END:
      return IconClock;
    case TimelineEntryType.COMBAT:
      return IconSword;
    case TimelineEntryType.TRAVEL:
      return IconMapPin;
    case TimelineEntryType.DISCOVERY:
      return IconEye;
    case TimelineEntryType.CHARACTER_EVENT:
      return IconUsers;
    case TimelineEntryType.STORY_EVENT:
      return IconBook;
    case TimelineEntryType.MILESTONE:
      return IconFlag;
    default:
      return IconCalendar;
  }
};

// Color mapping for different entry types
const getEntryTypeColor = (entryType: TimelineEntryType) => {
  switch (entryType) {
    case TimelineEntryType.SESSION_START:
    case TimelineEntryType.SESSION_END:
      return 'blue';
    case TimelineEntryType.COMBAT:
      return 'red';
    case TimelineEntryType.TRAVEL:
      return 'green';
    case TimelineEntryType.DISCOVERY:
      return 'yellow';
    case TimelineEntryType.CHARACTER_EVENT:
      return 'violet';
    case TimelineEntryType.STORY_EVENT:
      return 'indigo';
    case TimelineEntryType.MILESTONE:
      return 'orange';
    default:
      return 'gray';
  }
};

// Individual timeline item component
const TimelineItem: React.FC<TimelineItemProps> = ({ index, style, data }) => {
  const { entries, onEntryEdit, onEntryDelete, onEntryView, showActions, t } = data;
  const entry = entries[index];

  const IconComponent = getEntryTypeIcon(entry.entryType);
  const entryColor = getEntryTypeColor(entry.entryType);

  const handleEdit = useCallback(() => {
    onEntryEdit?.(entry);
  }, [entry, onEntryEdit]);

  const handleDelete = useCallback(() => {
    if (entry.id) {
      onEntryDelete?.(entry.id);
    }
  }, [entry.id, onEntryDelete]);

  const handleView = useCallback(() => {
    onEntryView?.(entry);
  }, [entry, onEntryView]);

  // Format time display
  const formatTime = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleString();
  };

  return (
    <div style={style}>
      <Paper
        p="sm"
        withBorder
        shadow="xs"
        style={{
          margin: '4px 8px',
          height: 'calc(100% - 8px)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Group justify="space-between" style={{ width: '100%' }}>
          <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
            {/* Entry Type Icon */}
            <ThemeIcon size="lg" variant="light" color={entryColor}>
              <IconComponent size={20} />
            </ThemeIcon>

            {/* Entry Content */}
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs">
                <Text fw={500} truncate style={{ maxWidth: '300px' }}>
                  {entry.title}
                </Text>
                <Badge size="xs" variant="light" color={entryColor}>
                  {t(`timeline.entryTypes.${entry.entryType}`)}
                </Badge>
                {entry.importance && (
                  <Badge size="xs" variant="outline" color="gray">
                    {entry.importance}/10
                  </Badge>
                )}
              </Group>

              <Group gap="md">
                {entry.dualTimestamp?.realWorldTime && (
                  <Text size="xs" c="dimmed">
                    Real: {formatTime(entry.dualTimestamp.realWorldTime)}
                  </Text>
                )}
                {entry.dualTimestamp?.inGameTime && (
                  <Text size="xs" c="dimmed">
                    Game: {formatTime(entry.dualTimestamp.inGameTime)}
                  </Text>
                )}
              </Group>

              {entry.description && (
                <Text size="xs" c="dimmed" truncate style={{ maxWidth: '400px' }}>
                  {entry.description}
                </Text>
              )}
            </Stack>
          </Group>

          {/* Actions */}
          {showActions && (
            <Group gap="xs">
              <Tooltip label={t('timeline.actions.view', 'View')}>
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={handleView}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={t('timeline.actions.edit', 'Edit')}>
                <ActionIcon
                  variant="light"
                  color="yellow"
                  size="sm"
                  onClick={handleEdit}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={t('timeline.actions.delete', 'Delete')}>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={handleDelete}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>
      </Paper>
    </div>
  );
};

export const VirtualizedTimelineList: React.FC<VirtualizedTimelineListProps> = ({
  entries,
  onEntryEdit,
  onEntryDelete,
  onEntryView,
  height = 600,
  width = 0, // Default to 0, will be set by parent or use a ref
  itemHeight = 80,
  showActions = true
}) => {
  const { t } = useTranslation(['ui']);

  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    entries,
    onEntryEdit,
    onEntryDelete,
    onEntryView,
    showActions,
    t
  }), [entries, onEntryEdit, onEntryDelete, onEntryView, showActions, t]);

  if (entries.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <ThemeIcon size="xl" variant="light" color="gray">
            <IconCalendar size={32} />
          </ThemeIcon>
          <Text c="dimmed" ta="center">
            {t('timeline.noEntries', 'No timeline entries found')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      <List
        height={height}
        width={width} // Pass the width prop
        itemCount={entries.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items for smooth scrolling
        style={{
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 'var(--mantine-radius-md)'
        }}
      >
        {TimelineItem}
      </List>
    </Box>
  );
};
