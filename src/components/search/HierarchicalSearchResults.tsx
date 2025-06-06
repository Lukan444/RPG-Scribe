/**
 * Hierarchical Search Results Component
 * 
 * Groups search results by RPG World and displays them with visual hierarchy indicators.
 * Shows world names as section headers, campaign context, and breadcrumb-style paths.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Group,
  Badge,
  Divider,
  Box,
  ThemeIcon,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import {
  IconWorld,
  IconSword,
  IconChevronRight,
  IconMapPin
} from '@tabler/icons-react';
import { AISearchResult } from '../../services/search/AISearchService';
import { SearchResultItem } from './SearchResultItem';
import { useTranslation } from 'react-i18next';
import { RPGWorldService } from '../../services/rpgWorld.service';

/**
 * Props for HierarchicalSearchResults component
 */
interface HierarchicalSearchResultsProps {
  /** Search results to display */
  results: AISearchResult[];
  /** Callback when a result is clicked */
  onResultClick: (result: AISearchResult) => void;
}

/**
 * Grouped search results by world
 */
interface GroupedResults {
  worldId: string | null;
  worldName: string;
  results: AISearchResult[];
}

/**
 * Hook to fetch world names by their IDs
 */
const useWorldNames = (worldIds: (string | null)[]): Record<string, string> => {
  const [worldNames, setWorldNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchWorldNames = async () => {
      const rpgWorldService = new RPGWorldService();
      const names: Record<string, string> = {};

      // Process each unique worldId
      const uniqueWorldIds = [...new Set(worldIds.filter(Boolean))] as string[];

      await Promise.all(
        uniqueWorldIds.map(async (worldId) => {
          try {
            const world = await rpgWorldService.getById(worldId);
            names[worldId] = world?.name || 'Unknown World';
          } catch (error) {
            console.error(`Failed to fetch world name for ${worldId}:`, error);
            names[worldId] = 'Unknown World';
          }
        })
      );

      setWorldNames(names);
    };

    if (worldIds.length > 0) {
      fetchWorldNames();
    }
  }, [worldIds]);

  return worldNames;
};

/**
 * Get campaign name from result
 */
const getCampaignName = (result: AISearchResult): string | null => {
  // This would ideally come from the database, but for now we'll use heuristics
  if (result.description?.includes('Lost Mine') || result.description?.includes('Phandelver')) {
    return 'Lost Mine of Phandelver';
  }
  if (result.description?.includes('Crown') || result.description?.includes('fragment')) {
    return 'The Shattered Crown Chronicles';
  }
  if (result.description?.includes('Shadow Dragon')) {
    return 'Dragon Hunt Campaign';
  }
  return null;
};

/**
 * Create breadcrumb path for a result
 */
const createBreadcrumbPath = (result: AISearchResult, worldName: string): React.ReactNode => {
  const campaignName = getCampaignName(result);
  
  const breadcrumbItems = [
    <Text key="world" size="xs" c="dimmed">{worldName}</Text>
  ];

  if (campaignName) {
    breadcrumbItems.push(
      <Text key="campaign" size="xs" c="dimmed">{campaignName}</Text>
    );
  }

  breadcrumbItems.push(
    <Text key="entity" size="xs" c="violet.4" fw={500}>{result.name}</Text>
  );

  return (
    <Breadcrumbs
      separator={<IconChevronRight size={10} style={{ color: 'var(--mantine-color-dimmed)' }} />}
    >
      {breadcrumbItems}
    </Breadcrumbs>
  );
};

/**
 * Hierarchical Search Results Component
 */
export function HierarchicalSearchResults({
  results,
  onResultClick
}: HierarchicalSearchResultsProps) {
  const { t } = useTranslation(['ui', 'common']);

  // Extract unique world IDs from results
  const worldIds = useMemo(() => {
    return [...new Set(results.map(result => result.worldId).filter((id): id is string => Boolean(id)))];
  }, [results]);

  // Fetch world names
  const worldNames = useWorldNames(worldIds);

  // Group results by world
  const groupedResults = useMemo((): GroupedResults[] => {
    const groups: Record<string, AISearchResult[]> = {};

    results.forEach(result => {
      // Use worldId as the grouping key, or 'unknown' for results without worldId
      const worldKey = result.worldId || 'unknown';

      if (!groups[worldKey]) {
        groups[worldKey] = [];
      }
      groups[worldKey].push(result);
    });

    // Convert to array and sort by world name
    return Object.entries(groups)
      .map(([worldId, groupResults]) => {
        const actualWorldId = worldId === 'unknown' ? null : worldId;
        let worldName = 'Unknown World';

        if (actualWorldId && worldNames[actualWorldId]) {
          worldName = worldNames[actualWorldId];
        } else {
          // Try to find an RPG_WORLD result in this group as fallback
          const worldResult = groupResults.find(r => r.type === 'RPG_WORLD');
          if (worldResult) {
            worldName = worldResult.name;
          }
        }

        return {
          worldId: actualWorldId,
          worldName,
          results: groupResults
        };
      })
      .sort((a, b) => a.worldName.localeCompare(b.worldName));
  }, [results, worldNames]);

  return (
    <Stack gap="lg">
      <Text size="sm" fw={500} c="dimmed">
        {t('ui:lists.search.aiSearch.searchResults')} 
        {groupedResults.length > 1 && (
          <Text component="span" size="xs" c="dimmed" ml="xs">
            • {groupedResults.length} worlds
          </Text>
        )}
      </Text>

      {groupedResults.map((group, groupIndex) => (
        <Stack key={group.worldId || 'unknown'} gap="xs">
          {/* World Header (only show if multiple worlds) */}
          {groupedResults.length > 1 && (
            <>
              <Group gap="xs" align="center">
                <ThemeIcon size="sm" variant="light" color="indigo">
                  <IconWorld size={14} />
                </ThemeIcon>
                <Text size="sm" fw={600} c="indigo.4">
                  {group.worldName}
                </Text>
                <Badge size="xs" variant="light" color="indigo">
                  {group.results.length} result{group.results.length > 1 ? 's' : ''}
                </Badge>
              </Group>
              
              {/* Visual separator line */}
              <Box
                style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.3) 0%, transparent 100%)',
                  marginBottom: '8px'
                }}
              />
            </>
          )}

          {/* Results in this world */}
          <Stack gap="xs" pl={groupedResults.length > 1 ? "md" : 0}>
            {group.results.map((result, resultIndex) => (
              <Box key={result.id}>
                {/* Breadcrumb path for context */}
                {groupedResults.length > 1 && (
                  <Box mb="xs" pl="sm">
                    {createBreadcrumbPath(result, group.worldName)}
                  </Box>
                )}
                
                {/* Search result item */}
                <SearchResultItem
                  result={result}
                  onClick={onResultClick}
                  showRelationships={true}
                />
                
                {/* Subtle separator between results in the same world */}
                {resultIndex < group.results.length - 1 && (
                  <Box
                    mt="xs"
                    style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      marginLeft: '40px',
                      marginRight: '40px'
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>

          {/* Divider between worlds */}
          {groupIndex < groupedResults.length - 1 && (
            <Divider
              my="md"
              variant="dashed"
              labelPosition="center"
              label={
                <Group gap="xs">
                  <IconMapPin size={12} style={{ opacity: 0.5 }} />
                  <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
                    Different World
                  </Text>
                  <IconMapPin size={12} style={{ opacity: 0.5 }} />
                </Group>
              }
            />
          )}
        </Stack>
      ))}
    </Stack>
  );
}

export default HierarchicalSearchResults;
