import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Group, Text, rem } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { FactionServiceAdapter } from '../../services/adapters/FactionServiceAdapter';
import { Faction, FactionType } from '../../models/Faction';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * Unified Faction List Page
 * Displays a list of factions using the unified entity list component
 */
export function UnifiedFactionListPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  // Get faction service
  const factionService = new FactionServiceAdapter(
    worldId || '',
    campaignId || 'default-campaign'
  );

  // Get entity list config
  const config = EntityListConfigFactory.createConfig<Faction>(EntityType.FACTION);

  // Override the icon and renderBadge function to provide a custom badge
  const configWithCustomBadge = {
    ...config,
    icon: <IconUsers size={rem(20)} />,
    renderBadge: (faction: Faction) => {
      const getTypeColor = () => {
        switch (faction.factionType) {
          case FactionType.GUILD:
            return 'blue';
          case FactionType.KINGDOM:
            return 'indigo';
          case FactionType.CULT:
            return 'violet';
          case FactionType.MILITARY:
            return 'red';
          case FactionType.CRIMINAL:
            return 'dark';
          case FactionType.RELIGIOUS:
            return 'yellow';
          case FactionType.POLITICAL:
            return 'cyan';
          case FactionType.MERCANTILE:
            return 'green';
          case FactionType.ARCANE:
            return 'grape';
          case FactionType.TRIBAL:
            return 'orange';
          default:
            return 'gray';
        }
      };

      return (
        <Group gap="xs">
          <Badge color={getTypeColor()} size="sm">
            {formatFactionType(faction.factionType)}
          </Badge>
          {faction.scope && (
            <Badge color="blue" size="sm">
              {faction.scope}
            </Badge>
          )}
        </Group>
      );
    },
    columns: [
      { key: 'name', title: 'Name', sortable: true },
      { key: 'factionType', title: 'Type', sortable: true },
      { key: 'scope', title: 'Scope', sortable: true },
      { key: 'leaderTitle', title: 'Leader', sortable: true },
      { key: 'headquartersId', title: 'Headquarters', sortable: true }
    ],
    filterOptions: [
      {
        key: 'factionType',
        label: 'Type',
        options: [
          { value: FactionType.GUILD, label: 'Guild' },
          { value: FactionType.KINGDOM, label: 'Kingdom' },
          { value: FactionType.CULT, label: 'Cult' },
          { value: FactionType.MILITARY, label: 'Military' },
          { value: FactionType.CRIMINAL, label: 'Criminal' },
          { value: FactionType.RELIGIOUS, label: 'Religious' },
          { value: FactionType.POLITICAL, label: 'Political' },
          { value: FactionType.MERCANTILE, label: 'Mercantile' },
          { value: FactionType.ARCANE, label: 'Arcane' },
          { value: FactionType.TRIBAL, label: 'Tribal' },
          { value: FactionType.OTHER, label: 'Other' }
        ]
      },
      {
        key: 'scope',
        label: 'Scope',
        options: [
          { value: 'Local', label: 'Local' },
          { value: 'Regional', label: 'Regional' },
          { value: 'National', label: 'National' },
          { value: 'Continental', label: 'Continental' },
          { value: 'Global', label: 'Global' }
        ]
      }
    ],
    sortOptions: [
      { key: 'name', label: 'Name', direction: 'asc' as 'asc', default: true },
      { key: 'factionType', label: 'Type', direction: 'asc' as 'asc' },
      { key: 'scope', label: 'Scope', direction: 'asc' as 'asc' },
      { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
      { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
    ],
    emptyStateMessage: 'No factions found',
    emptyStateActionText: 'Create New Faction'
  };

  return (
    <EntityListPage
      config={configWithCustomBadge}
      entityService={factionService}
      worldId={worldId}
      campaignId={campaignId}
      title={worldId ? 'World Factions' : 'All Factions'}
      showBackButton={!!worldId}
      backButtonLabel="Back to World"
    />
  );
}

/**
 * Format faction type for display
 * @param type Faction type
 * @returns Formatted faction type
 */
function formatFactionType(type: FactionType): string {
  switch (type) {
    case FactionType.GUILD:
      return 'Guild';
    case FactionType.KINGDOM:
      return 'Kingdom';
    case FactionType.CULT:
      return 'Cult';
    case FactionType.MILITARY:
      return 'Military';
    case FactionType.CRIMINAL:
      return 'Criminal';
    case FactionType.RELIGIOUS:
      return 'Religious';
    case FactionType.POLITICAL:
      return 'Political';
    case FactionType.MERCANTILE:
      return 'Mercantile';
    case FactionType.ARCANE:
      return 'Arcane';
    case FactionType.TRIBAL:
      return 'Tribal';
    case FactionType.OTHER:
    default:
      return 'Other';
  }
}

export default UnifiedFactionListPage;
