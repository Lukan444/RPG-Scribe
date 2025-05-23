/**
 * Vector Search Bar Component
 *
 * This component provides a search bar that uses vector search to find entities.
 */

import React, { useState, useEffect } from 'react';
import { TextInput, Button, Group, Paper, Text, Loader, Stack } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useVectorSearch } from '../../hooks/useVectorSearch';
import { EntityType, getEntityTypeDisplayName } from '../../models/EntityType';

/**
 * Vector Search Bar Props
 */
interface VectorSearchBarProps {
  /** Entity type to search for */
  entityType?: EntityType;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum number of results to show */
  maxResults?: number;
  /** Callback when an entity is selected */
  onEntitySelected?: (entityId: string, entityType: EntityType) => void;
}

/**
 * Vector Search Bar Component
 */
export function VectorSearchBar({
  entityType,
  placeholder = 'Search...',
  maxResults = 5,
  onEntitySelected
}: VectorSearchBarProps) {
  const [query, setQuery] = useState('');
  const { results, loading, error, search, clearResults } = useVectorSearch(entityType);

  // Perform search when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        search(query, { limit: maxResults });
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, maxResults, search, clearResults]);

  /**
   * Handle search input change
   * @param event Change event
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    setQuery('');
    clearResults();
  };

  /**
   * Handle entity selection
   * @param entityId ID of the selected entity
   * @param entityType Type of the selected entity
   */
  const handleEntitySelect = (entityId: string, entityType: EntityType) => {
    if (onEntitySelected) {
      onEntitySelected(entityId, entityType);
    }
    setQuery('');
    clearResults();
  };

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <TextInput
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          leftSection={<IconSearch size={16} />}
          rightSection={
            query ? (
              loading ? (
                <Loader size="xs" />
              ) : (
                <IconX
                  size={16}
                  style={{ cursor: 'pointer' }}
                  onClick={handleClear}
                />
              )
            ) : null
          }
          style={{ flex: 1 }}
        />
      </Group>

      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}

      {results.length > 0 && (
        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="xs">
            {results.map(result => (
              <Button
                key={result.entityId}
                variant="subtle"
                onClick={() => handleEntitySelect(result.entityId, result.entityType)}
                style={{ justifyContent: 'flex-start' }}
              >
                <Group gap="xs">
                  <Text fw={500}>
                    {result.metadata?.name || result.entityId}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {getEntityTypeDisplayName(result.entityType)}
                  </Text>
                </Group>
              </Button>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
