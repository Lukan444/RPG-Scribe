import { useState } from 'react';
import {
  Box,
  Grid,
  Group,
  TextInput,
  Select,
  Button,
  Pagination,
  Text,
  Stack,
  Loader,
  Center,
  SimpleGrid
} from '@mantine/core';
import { IconSearch, IconPlus, IconFilter, IconSortAscending } from '@tabler/icons-react';
import { EntityCard } from './EntityCard';
import { EntityType } from '../../models/EntityType';

/**
 * Entity item interface
 */
interface EntityItem {
  id: string;
  type: any; // Accept any EntityType to handle different enum implementations
  name: string;
  description?: string;
  imageUrl?: string;
  badges?: { label: string; color?: string }[];
  metadata?: { label: string; value: string }[];
  [key: string]: any;
}

/**
 * Entity list props
 */
interface EntityListProps {
  entities: EntityItem[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filter: string) => void;
  onSort?: (sort: string) => void;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  filterOptions?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
  emptyStateMessage?: string;
  showFilters?: boolean;
  showPagination?: boolean;
  showAddButton?: boolean;
  columns?: { xs: number; sm: number; md: number; lg: number };
}

/**
 * EntityList component - List of entity cards with filtering and pagination
 */
export function EntityList({
  entities,
  title,
  loading = false,
  error = null,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onSearch,
  onFilter,
  onSort,
  onAdd,
  onEdit,
  onDelete,
  onView,
  filterOptions = [],
  sortOptions = [],
  emptyStateMessage = 'No entities found',
  showFilters = true,
  showPagination = true,
  showAddButton = true,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 }
}: EntityListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>(null);

  // Handle search
  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string | null) => {
    setFilter(value);
    if (onFilter && value) {
      onFilter(value);
    }
  };

  // Handle sort change
  const handleSortChange = (value: string | null) => {
    setSort(value);
    if (onSort && value) {
      onSort(value);
    }
  };

  // Handle add button click
  const handleAddClick = () => {
    if (onAdd) {
      onAdd();
    }
  };

  return (
    <Stack>
      {title && <Text size="xl" fw={700}>{title}</Text>}

      {showFilters && (
        <Box mb="md">
          <Group align="flex-end" mb="xs">
            <TextInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flexGrow: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            {filterOptions.length > 0 && (
              <Select
                placeholder="Filter by"
                data={filterOptions}
                value={filter}
                onChange={handleFilterChange}
                leftSection={<IconFilter size={16} />}
                clearable
                w={200}
              />
            )}

            {sortOptions.length > 0 && (
              <Select
                placeholder="Sort by"
                data={sortOptions}
                value={sort}
                onChange={handleSortChange}
                leftSection={<IconSortAscending size={16} />}
                clearable
                w={200}
              />
            )}

            <Button onClick={handleSearch}>Search</Button>

            {showAddButton && (
              <Button leftSection={<IconPlus size={16} />} onClick={handleAddClick}>
                Add New
              </Button>
            )}
          </Group>
        </Box>
      )}

      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : error ? (
        <Center h={200}>
          <Text c="red">{error}</Text>
        </Center>
      ) : entities.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{emptyStateMessage}</Text>
        </Center>
      ) : (
        <SimpleGrid cols={columns}>
          {entities.map((entity) => (
            <EntityCard
              key={entity.id}
              id={entity.id}
              type={entity.type}
              name={entity.name}
              description={entity.description}
              imageUrl={entity.imageUrl}
              badges={entity.badges}
              metadata={entity.metadata}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </SimpleGrid>
      )}

      {showPagination && totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={onPageChange}
          />
        </Group>
      )}
    </Stack>
  );
}
