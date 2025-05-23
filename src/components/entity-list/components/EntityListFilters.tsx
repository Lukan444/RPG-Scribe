/**
 * Entity List Filters
 * 
 * This component provides a standardized filter panel for entity lists.
 * It supports multiple filter types and filter chips for active filters.
 */

import React, { useState } from 'react';
import {
  Paper,
  Group,
  TextInput,
  Select,
  Button,
  Collapse,
  Badge,
  ActionIcon,
  Stack,
  Divider,
  Box,
  Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconFilterOff
} from '@tabler/icons-react';
import { useEntityList } from '../context/EntityListContext';

/**
 * Entity list filters component
 */
export function EntityListFilters() {
  const {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    searchQuery,
    setSearchQuery,
    config
  } = useEntityList();
  
  const [opened, { toggle }] = useDisclosure(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(filters);
  
  // Handle search
  const handleSearch = () => {
    setSearchQuery(localSearchQuery);
  };
  
  // Handle filter change
  const handleFilterChange = (key: string, value: string | null) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || ''
    }));
  };
  
  // Handle apply filters
  const handleApplyFilters = () => {
    // Apply all filters
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value) {
        addFilter(key, value);
      } else {
        removeFilter(key);
      }
    });
    
    // Close filter panel
    if (opened) {
      toggle();
    }
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    // Reset local filters
    setLocalFilters({});
    
    // Clear all filters
    clearFilters();
    
    // Reset search query
    setLocalSearchQuery('');
    setSearchQuery('');
  };
  
  // Get filter option label
  const getFilterOptionLabel = (key: string, value: string) => {
    const filterOption = config.filterOptions.find(option => option.key === key);
    if (!filterOption) return value;
    
    const option = filterOption.options.find(option => option.value === value);
    return option ? option.label : value;
  };
  
  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery;
  
  return (
    <Stack gap="xs">
      {/* Search and filter toggle */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder="Search..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              rightSection={
                localSearchQuery ? (
                  <ActionIcon size="sm" onClick={() => setLocalSearchQuery('')}>
                    <IconX size={16} />
                  </ActionIcon>
                ) : null
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            
            <Button onClick={handleSearch}>Search</Button>
          </Group>
          
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconFilter size={16} />}
              rightSection={opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              onClick={toggle}
            >
              Filters
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="subtle"
                color="red"
                leftSection={<IconFilterOff size={16} />}
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            )}
          </Group>
        </Group>
        
        {/* Active filter chips */}
        {hasActiveFilters && (
          <Box mt="md">
            <Text size="sm" fw={500} mb="xs">Active Filters:</Text>
            <Group>
              {searchQuery && (
                <Badge
                  rightSection={
                    <ActionIcon
                      size="xs"
                      radius="xl"
                      variant="transparent"
                      onClick={() => {
                        setLocalSearchQuery('');
                        setSearchQuery('');
                      }}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                >
                  Search: {searchQuery}
                </Badge>
              )}
              
              {Object.entries(filters).map(([key, value]) => (
                <Badge
                  key={key}
                  rightSection={
                    <ActionIcon
                      size="xs"
                      radius="xl"
                      variant="transparent"
                      onClick={() => {
                        removeFilter(key);
                        setLocalFilters(prev => {
                          const newFilters = { ...prev };
                          delete newFilters[key];
                          return newFilters;
                        });
                      }}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                >
                  {config.filterOptions.find(option => option.key === key)?.label || key}: {getFilterOptionLabel(key, value)}
                </Badge>
              ))}
            </Group>
          </Box>
        )}
        
        {/* Filter panel */}
        <Collapse in={opened}>
          <Divider my="md" />
          
          <Stack gap="md">
            <Group grow>
              {config.filterOptions.map((filterOption) => (
                <Select
                  key={filterOption.key}
                  label={filterOption.label}
                  placeholder={`Select ${filterOption.label}`}
                  data={filterOption.options}
                  value={localFilters[filterOption.key] || null}
                  onChange={(value) => handleFilterChange(filterOption.key, value)}
                  clearable
                />
              ))}
            </Group>
            
            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </Group>
          </Stack>
        </Collapse>
      </Paper>
    </Stack>
  );
}
