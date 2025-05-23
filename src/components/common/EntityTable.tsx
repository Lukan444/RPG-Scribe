import React, { useState, useEffect } from 'react';
import {
  Table,
  Group,
  Text,
  ActionIcon,
  Menu,
  Pagination,
  TextInput,
  Select,
  Paper,
  Stack,
  Badge,
  ThemeIcon,
  Tooltip,
  LoadingOverlay,
  Skeleton
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconArrowUp,
  IconArrowDown,
  IconFilter
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import { RelationshipCountBadge } from '../relationships/badges';
import { RelationshipBreakdownService } from '../../services/relationshipBreakdown.service';

interface EntityTableProps<T> {
  data: T[];
  columns: {
    key: string;
    title: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  entityType: any; // Accept any EntityType to handle different enum implementations
  loading?: boolean;
  error?: string | null;
  onView?: ((id: string) => void) | ((item: T) => void); // Accept both id and item callbacks
  onEdit?: ((id: string) => void) | ((item: T) => void); // Accept both id and item callbacks
  onDelete?: ((id: string) => void) | ((item: T) => void); // Accept both id and item callbacks
  idField?: string;
  filterOptions?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[] | { value: string; label: string }[]; // Accept both formats
  showRelationshipCounts?: boolean;
  worldId?: string;
  campaignId?: string;
}

export function EntityTable<T extends { [key: string]: any }>({
  data,
  columns,
  entityType,
  loading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  idField = 'id',
  filterOptions = [],
  showRelationshipCounts = true,
  worldId = '',
  campaignId = ''
}: EntityTableProps<T>) {
  const { t } = useTranslation(['ui', 'entities']);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const itemsPerPage = 10;

  // State for relationship counts
  const [relationshipCounts, setRelationshipCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});

  // Load relationship counts for all entities
  useEffect(() => {
    const loadRelationshipCounts = async () => {
      if (!showRelationshipCounts || !worldId || !campaignId) return;

      // Create a map of entity IDs to track loading state
      const loadingMap: Record<string, boolean> = {};
      data.forEach(item => {
        const id = item[idField];
        if (id && !relationshipCounts[id]) {
          loadingMap[id] = true;
        }
      });

      if (Object.keys(loadingMap).length === 0) return;

      setLoadingCounts(loadingMap);

      // Create a breakdown service instance
      const breakdownService = RelationshipBreakdownService.getInstance(worldId, campaignId);

      // Fetch counts for all entities in batches
      const batchSize = 5;
      const batches = Math.ceil(Object.keys(loadingMap).length / batchSize);

      const newCounts: Record<string, number> = { ...relationshipCounts };

      for (let i = 0; i < batches; i++) {
        const batchIds = Object.keys(loadingMap).slice(i * batchSize, (i + 1) * batchSize);

        // Fetch counts in parallel for this batch
        await Promise.all(
          batchIds.map(async (id) => {
            try {
              const item = data.find(item => item[idField] === id);
              if (!item) return;

              const result = await breakdownService.getRelationshipBreakdown(id, entityType);
              newCounts[id] = result.total;
            } catch (error) {
              console.error(`Error loading relationship count for ${id}:`, error);
              newCounts[id] = 0;
            } finally {
              loadingMap[id] = false;
            }
          })
        );

        // Update loading state after each batch
        setLoadingCounts({ ...loadingMap });
      }

      // Update all counts at once
      setRelationshipCounts(newCounts);
      setLoadingCounts({});
    };

    loadRelationshipCounts();
  }, [data, entityType, showRelationshipCounts, worldId, campaignId, idField, relationshipCounts]);

  // Filter and sort data
  let filteredData = [...data];

  // Apply search filter
  if (searchQuery) {
    const lowerCaseQuery = searchQuery.toLowerCase();
    filteredData = filteredData.filter(item =>
      Object.values(item).some(value =>
        value && typeof value === 'string' && value.toLowerCase().includes(lowerCaseQuery)
      )
    );
  }

  // Apply column filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      filteredData = filteredData.filter(item => String(item[key]) === value);
    }
  });

  // Apply sorting
  if (sortBy) {
    filteredData.sort((a, b) => {
      // Special case for relationship count sorting
      if (sortBy === 'relationshipCount') {
        const aValue = a.relationshipCount !== undefined ? a.relationshipCount : 0;
        const bValue = b.relationshipCount !== undefined ? b.relationshipCount : 0;

        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1);
    });
  }

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Reset to first page when filter changes
  };

  // Get entity type icon
  const getEntityIcon = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER'))
      return <ThemeIcon color="teal" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('LOCATION'))
      return <ThemeIcon color="blue" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('ITEM'))
      return <ThemeIcon color="yellow" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('EVENT'))
      return <ThemeIcon color="violet" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('SESSION'))
      return <ThemeIcon color="orange" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('CAMPAIGN'))
      return <ThemeIcon color="red" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD'))
      return <ThemeIcon color="indigo" variant="light"><IconEye size={16} /></ThemeIcon>;
    if (entityTypeStr.includes('NOTE'))
      return <ThemeIcon color="cyan" variant="light"><IconEye size={16} /></ThemeIcon>;

    return <ThemeIcon color="gray" variant="light"><IconEye size={16} /></ThemeIcon>;
  };

  // Get entity type color
  const getEntityColor = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return 'teal';
    if (entityTypeStr.includes('LOCATION')) return 'blue';
    if (entityTypeStr.includes('ITEM')) return 'yellow';
    if (entityTypeStr.includes('EVENT')) return 'violet';
    if (entityTypeStr.includes('SESSION')) return 'orange';
    if (entityTypeStr.includes('CAMPAIGN')) return 'red';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'indigo';
    if (entityTypeStr.includes('NOTE')) return 'cyan';

    return 'gray';
  };

  return (
    <Paper withBorder shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            {getEntityIcon()}
            <Text fw={500} size="lg">
              {(() => {
                // Format entity type name for display using translations
                const entityTypeStr = entityType.toString().toLowerCase();

                // Handle special cases
                if (entityTypeStr.includes('rpgworld') || entityTypeStr.includes('rpg_world')) {
                  return t('types.worlds', { ns: 'entities' });
                }

                // Try to get translation for plural form
                const pluralKey = `entities:types.${entityTypeStr}s`;
                const translated = t(pluralKey);

                // If translation exists, use it; otherwise fallback to formatted string
                if (translated !== pluralKey) {
                  return translated;
                }

                // Fallback to capitalized form
                return entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1) + 's';
              })()}
            </Text>
            <Badge color={getEntityColor()}>
              {filteredData.length}
            </Badge>
          </Group>

          <Group>
            <TextInput
              placeholder={t('tables.filters.search')}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.currentTarget.value);
                setPage(1); // Reset to first page when search changes
              }}
              w={200}
            />

            {filterOptions && Array.isArray(filterOptions) && filterOptions.length > 0 &&
              filterOptions.map((filter, index) => {
                // Check if filter has key and options properties (old format)
                if ('key' in filter && 'options' in filter) {
                  return (
                    <Select
                      key={filter.key}
                      placeholder={filter.label}
                      data={filter.options}
                      value={filters[filter.key] || null}
                      onChange={(value) => handleFilterChange(filter.key, value || '')}
                      leftSection={<IconFilter size={16} />}
                      clearable
                      w={150}
                      comboboxProps={{ withinPortal: true }}
                    />
                  );
                } else if ('value' in filter && 'label' in filter) {
                  // Handle simple format (value/label pairs)
                  // In this case, we'll use a single filter with a generic key
                  return (
                    <Select
                      key={index}
                      placeholder={t('tables.filters.filterBy')}
                      data={filterOptions as any}
                      value={filters['simple'] || null}
                      onChange={(value) => handleFilterChange('simple', value || '')}
                      leftSection={<IconFilter size={16} />}
                      clearable
                      w={150}
                      comboboxProps={{ withinPortal: true }}
                    />
                  );
                }
                return null;
              })
            }
          </Group>
        </Group>

        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

          {error ? (
            <Text c="red" ta="center" p="md">{error}</Text>
          ) : (
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover withTableBorder tabularNums>
                <Table.Thead>
                  <Table.Tr>
                    {columns.map((column) => (
                      <Table.Th key={column.key}>
                        <Group gap="xs" justify="space-between" wrap="nowrap">
                          <Text>{column.title}</Text>
                          {column.sortable && (
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              onClick={() => handleSort(column.key)}
                            >
                              {sortBy === column.key ? (
                                sortDirection === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />
                              ) : (
                                <IconArrowUp size={16} opacity={0.3} />
                              )}
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Th>
                    ))}
                    {showRelationshipCounts && (
                      <Table.Th style={{ width: 120 }}>
                        <Group gap="xs" justify="space-between" wrap="nowrap">
                          <Text>{t('ui:tables.headers.relationships', 'Relationships')}</Text>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => handleSort('relationshipCount')}
                          >
                            {sortBy === 'relationshipCount' ? (
                              sortDirection === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />
                            ) : (
                              <IconArrowUp size={16} opacity={0.3} />
                            )}
                          </ActionIcon>
                        </Group>
                      </Table.Th>
                    )}
                    <Table.Th style={{ width: 80 }}>{t('tables.headers.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={columns.length + (showRelationshipCounts ? 2 : 1)} ta="center">
                        <Text c="dimmed" py="lg">{t('tables.pagination.noResults')}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paginatedData.map((item) => (
                      <Table.Tr key={item[idField]}>
                        {columns.map((column) => (
                          <Table.Td key={`${item[idField]}-${column.key}`}>
                            {column.render ? column.render(item) : item[column.key]}
                          </Table.Td>
                        ))}
                        {showRelationshipCounts && (
                          <Table.Td>
                            {loadingCounts[item[idField]] ? (
                              <Skeleton height={22} width={40} radius="xl" />
                            ) : (
                              <RelationshipCountBadge
                                entityId={item[idField] || 'dashboard'}
                                entityType={entityType}
                                count={relationshipCounts[item[idField]] || 0}
                                interactive={true}
                                worldId={worldId || ''}
                                campaignId={campaignId || ''}
                                size="sm"
                                variant="filled"
                              />
                            )}
                          </Table.Td>
                        )}
                        <Table.Td>
                          <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray">
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {onView && (
                                <Menu.Item
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => {
                                    // Check if the callback expects an item or an id
                                    const callback = onView as any;
                                    if (callback.length === 1) {
                                      // If it expects one parameter, it could be either item or id
                                      // Try to pass the whole item, which will work if the callback expects an item
                                      callback(item);
                                    } else {
                                      // Default to passing just the ID
                                      callback(item[idField]);
                                    }
                                  }}
                                >
                                  {t('buttons.view', { ns: 'common' })}
                                </Menu.Item>
                              )}
                              {onEdit && (
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => {
                                    // Check if the callback expects an item or an id
                                    const callback = onEdit as any;
                                    if (callback.length === 1) {
                                      // If it expects one parameter, it could be either item or id
                                      // Try to pass the whole item, which will work if the callback expects an item
                                      callback(item);
                                    } else {
                                      // Default to passing just the ID
                                      callback(item[idField]);
                                    }
                                  }}
                                >
                                  {t('buttons.edit', { ns: 'common' })}
                                </Menu.Item>
                              )}
                              {onDelete && (
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => {
                                    // Check if the callback expects an item or an id
                                    const callback = onDelete as any;
                                    if (callback.length === 1) {
                                      // If it expects one parameter, it could be either item or id
                                      // Try to pass the whole item, which will work if the callback expects an item
                                      callback(item);
                                    } else {
                                      // Default to passing just the ID
                                      callback(item[idField]);
                                    }
                                  }}
                                >
                                  {t('buttons.delete', { ns: 'common' })}
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </div>

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              withEdges
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

export default EntityTable;