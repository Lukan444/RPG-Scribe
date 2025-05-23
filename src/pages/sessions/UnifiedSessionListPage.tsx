import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Group, Text, rem } from '@mantine/core';
import { IconCalendarEvent } from '@tabler/icons-react';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { SessionServiceAdapter } from '../../services/adapters/SessionServiceAdapter';
import { Session, SessionStatus } from '../../models/Session';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';
import { formatDate } from '../../utils/dateUtils';

/**
 * Unified Session List Page
 * Displays a list of sessions using the unified entity list component
 */
export function UnifiedSessionListPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  // Get session service
  const sessionService = new SessionServiceAdapter(
    worldId || '',
    campaignId || 'default-campaign'
  );

  // Get entity list config
  const config = EntityListConfigFactory.createConfig<Session>(EntityType.SESSION);

  // Override the icon and renderBadge function to provide a custom badge
  const configWithCustomBadge = {
    ...config,
    icon: <IconCalendarEvent size={rem(20)} />,
    renderBadge: (session: Session) => {
      const getStatusColor = () => {
        switch (session.status) {
          case SessionStatus.PLANNED:
            return 'blue';
          case SessionStatus.COMPLETED:
            return 'green';
          case SessionStatus.CANCELLED:
            return 'red';
          case SessionStatus.IN_PROGRESS:
            return 'orange';
          default:
            return 'gray';
        }
      };

      return (
        <Group gap="xs">
          <Badge color={getStatusColor()} size="sm">
            {formatSessionStatus(session.status)}
          </Badge>
          {session.date && (
            <Badge color="blue" size="sm">
              {formatDate(session.date)}
            </Badge>
          )}
          {session.sessionNumber && (
            <Badge color="violet" size="sm">
              Session #{session.sessionNumber}
            </Badge>
          )}
        </Group>
      );
    },
    columns: [
      { key: 'name', title: 'Name', sortable: true },
      { key: 'sessionNumber', title: 'Session #', sortable: true },
      { key: 'date', title: 'Date', sortable: true },
      { key: 'status', title: 'Status', sortable: true },
      { key: 'duration', title: 'Duration', sortable: true }
    ],
    filterOptions: [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: SessionStatus.PLANNED, label: 'Planned' },
          { value: SessionStatus.COMPLETED, label: 'Completed' },
          { value: SessionStatus.CANCELLED, label: 'Cancelled' },
          { value: SessionStatus.IN_PROGRESS, label: 'In Progress' }
        ]
      }
    ],
    sortOptions: [
      { key: 'sessionNumber', label: 'Session #', direction: 'asc' as 'asc', default: true },
      { key: 'date', label: 'Date', direction: 'desc' as 'desc' },
      { key: 'name', label: 'Name', direction: 'asc' as 'asc' },
      { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
      { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
    ],
    emptyStateMessage: 'No sessions found',
    emptyStateActionText: 'Create New Session'
  };

  return (
    <EntityListPage
      config={configWithCustomBadge}
      entityService={sessionService}
      worldId={worldId}
      campaignId={campaignId}
      title={worldId ? 'World Sessions' : 'All Sessions'}
      showBackButton={!!worldId}
      backButtonLabel="Back to World"
    />
  );
}

/**
 * Format session status for display
 * @param status Session status
 * @returns Formatted session status
 */
function formatSessionStatus(status?: SessionStatus | string): string {
  if (!status) return 'Unknown';

  // Handle string status
  if (typeof status === 'string') {
    switch (status) {
      case 'planned':
        return 'Planned';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  }

  // Handle SessionStatus enum
  switch (status) {
    case SessionStatus.PLANNED:
      return 'Planned';
    case SessionStatus.COMPLETED:
      return 'Completed';
    case SessionStatus.CANCELLED:
      return 'Cancelled';
    case SessionStatus.IN_PROGRESS:
      return 'In Progress';
    default:
      return 'Unknown';
  }
}

export default UnifiedSessionListPage;
