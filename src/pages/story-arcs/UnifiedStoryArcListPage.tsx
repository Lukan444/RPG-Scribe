import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Group, Text, rem } from '@mantine/core';
import { IconTimeline } from '@tabler/icons-react';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { StoryArcServiceAdapter } from '../../services/adapters/StoryArcServiceAdapter';
import { StoryArc, StoryArcType, StoryArcStatus } from '../../models/StoryArc';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * Unified Story Arc List Page
 * Displays a list of story arcs using the unified entity list component
 */
export function UnifiedStoryArcListPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  // Get story arc service
  const storyArcService = new StoryArcServiceAdapter(
    worldId || '',
    campaignId || 'default-campaign'
  );

  // Get entity list config
  const config = EntityListConfigFactory.createConfig<StoryArc>(EntityType.STORY_ARC);

  // Override the icon and renderBadge function to provide a custom badge
  const configWithCustomBadge = {
    ...config,
    icon: <IconTimeline size={rem(20)} />,
    renderBadge: (storyArc: StoryArc) => {
      const getTypeColor = () => {
        switch (storyArc.arcType) {
          case StoryArcType.MAIN_PLOT:
            return 'red';
          case StoryArcType.SIDE_QUEST:
            return 'blue';
          case StoryArcType.CHARACTER_ARC:
            return 'green';
          case StoryArcType.BACKGROUND_PLOT:
            return 'yellow';
          case StoryArcType.FACTION_ARC:
            return 'violet';
          case StoryArcType.LOCATION_ARC:
            return 'cyan';
          case StoryArcType.ITEM_ARC:
            return 'orange';
          case StoryArcType.OTHER:
          default:
            return 'gray';
        }
      };

      const getStatusColor = () => {
        switch (storyArc.status) {
          case StoryArcStatus.UPCOMING:
            return 'blue';
          case StoryArcStatus.ONGOING:
            return 'green';
          case StoryArcStatus.PAUSED:
            return 'yellow';
          case StoryArcStatus.COMPLETED:
            return 'teal';
          case StoryArcStatus.FAILED:
            return 'red';
          case StoryArcStatus.ABANDONED:
            return 'gray';
          default:
            return 'gray';
        }
      };

      return (
        <Group gap="xs">
          <Badge color={getTypeColor()} size="sm">
            {formatStoryArcType(storyArc.arcType)}
          </Badge>
          <Badge color={getStatusColor()} size="sm">
            {formatStoryArcStatus(storyArc.status)}
          </Badge>
          {storyArc.importance && (
            <Badge color="blue" size="sm">
              Importance: {storyArc.importance}
            </Badge>
          )}
        </Group>
      );
    },
    columns: [
      { key: 'name', title: 'Name', sortable: true },
      { key: 'arcType', title: 'Type', sortable: true },
      { key: 'status', title: 'Status', sortable: true },
      { key: 'importance', title: 'Importance', sortable: true },
      { key: 'parentArcId', title: 'Parent Arc', sortable: true }
    ],
    filterOptions: [
      {
        key: 'arcType',
        label: 'Type',
        options: [
          { value: StoryArcType.MAIN_PLOT, label: 'Main Plot' },
          { value: StoryArcType.SIDE_QUEST, label: 'Side Quest' },
          { value: StoryArcType.CHARACTER_ARC, label: 'Character Arc' },
          { value: StoryArcType.BACKGROUND_PLOT, label: 'Background Plot' },
          { value: StoryArcType.FACTION_ARC, label: 'Faction Arc' },
          { value: StoryArcType.LOCATION_ARC, label: 'Location Arc' },
          { value: StoryArcType.ITEM_ARC, label: 'Item Arc' },
          { value: StoryArcType.OTHER, label: 'Other' }
        ]
      },
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: StoryArcStatus.UPCOMING, label: 'Upcoming' },
          { value: StoryArcStatus.ONGOING, label: 'Ongoing' },
          { value: StoryArcStatus.PAUSED, label: 'Paused' },
          { value: StoryArcStatus.COMPLETED, label: 'Completed' },
          { value: StoryArcStatus.FAILED, label: 'Failed' },
          { value: StoryArcStatus.ABANDONED, label: 'Abandoned' }
        ]
      }
    ],
    sortOptions: [
      { key: 'name', label: 'Name', direction: 'asc' as 'asc', default: true },
      { key: 'arcType', label: 'Type', direction: 'asc' as 'asc' },
      { key: 'status', label: 'Status', direction: 'asc' as 'asc' },
      { key: 'importance', label: 'Importance', direction: 'desc' as 'desc' },
      { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
      { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
    ],
    emptyStateMessage: 'No story arcs found',
    emptyStateActionText: 'Create New Story Arc'
  };

  return (
    <EntityListPage
      config={configWithCustomBadge}
      entityService={storyArcService}
      worldId={worldId}
      campaignId={campaignId}
      title={worldId ? 'World Story Arcs' : 'All Story Arcs'}
      showBackButton={!!worldId}
      backButtonLabel="Back to World"
    />
  );
}

/**
 * Format story arc type for display
 * @param type Story arc type
 * @returns Formatted story arc type
 */
function formatStoryArcType(type: StoryArcType): string {
  switch (type) {
    case StoryArcType.MAIN_PLOT:
      return 'Main Plot';
    case StoryArcType.SIDE_QUEST:
      return 'Side Quest';
    case StoryArcType.CHARACTER_ARC:
      return 'Character Arc';
    case StoryArcType.BACKGROUND_PLOT:
      return 'Background Plot';
    case StoryArcType.FACTION_ARC:
      return 'Faction Arc';
    case StoryArcType.LOCATION_ARC:
      return 'Location Arc';
    case StoryArcType.ITEM_ARC:
      return 'Item Arc';
    case StoryArcType.OTHER:
      return 'Other';
    default:
      if (typeof type === 'string') {
        const typeStr = type as string;
        return typeStr.replace('_', ' ');
      }
      return 'Unknown';
  }
}

/**
 * Format story arc status for display
 * @param status Story arc status
 * @returns Formatted story arc status
 */
function formatStoryArcStatus(status: StoryArcStatus): string {
  switch (status) {
    case StoryArcStatus.UPCOMING:
      return 'Upcoming';
    case StoryArcStatus.ONGOING:
      return 'Ongoing';
    case StoryArcStatus.PAUSED:
      return 'Paused';
    case StoryArcStatus.COMPLETED:
      return 'Completed';
    case StoryArcStatus.FAILED:
      return 'Failed';
    case StoryArcStatus.ABANDONED:
      return 'Abandoned';
    default:
      if (typeof status === 'string') {
        const statusStr = status as string;
        return statusStr.replace('_', ' ');
      }
      return 'Unknown';
  }
}

export default UnifiedStoryArcListPage;
