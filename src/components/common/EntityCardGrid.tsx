import React, { useState, useEffect } from 'react';
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Paper,
  Stack,
  Pagination,
  Button,
  LoadingOverlay,
  ThemeIcon,
  Skeleton
} from '@mantine/core';
import {
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconFilter,
  IconUser,
  IconMapPin,
  IconSword,
  IconCalendarEvent,
  IconBook,
  IconWorld
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { EntityType } from '../../models/EntityType';
import { RelationshipCountBadge } from '../relationships/badges';
import { RelationshipBreakdownService } from '../../services/relationshipBreakdown.service';

interface EntityCardGridProps<T> {
  data: T[];
  entityType: any; // Accept any EntityType to handle different enum implementations
  loading?: boolean;
  error?: string | null;
  onView?: ((id: string) => void) | ((item: T) => void); // Accept both id and item callbacks
  onEdit?: ((id: string) => void) | ((item: T) => void); // Accept both id and item callbacks
  onDelete?: ((id: string) => void) | ((item: T) => void); // Accept both id and item callbacks
  idField?: string;
  nameField?: string;
  descriptionField?: string;
  imageField?: string;
  filterOptions?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[] | { value: string; label: string }[]; // Accept both formats
  renderBadge?: (item: T) => React.ReactNode;
  showRelationshipCounts?: boolean;
  worldId?: string;
  campaignId?: string;
}

export function EntityCardGrid<T extends { [key: string]: any }>({
  data,
  entityType,
  loading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  idField = 'id',
  nameField = 'name',
  descriptionField = 'description',
  imageField = 'imageURL',
  filterOptions = [],
  renderBadge,
  showRelationshipCounts = false,
  worldId = '',
  campaignId = ''
}: EntityCardGridProps<T>) {
  const { t } = useTranslation(['ui', 'entities', 'common']);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const itemsPerPage = 12;

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

  // Filter data
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

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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

    if (entityTypeStr.includes('CHARACTER')) return <IconUser size={24} />;
    if (entityTypeStr.includes('LOCATION')) return <IconMapPin size={24} />;
    if (entityTypeStr.includes('ITEM')) return <IconSword size={24} />;
    if (entityTypeStr.includes('EVENT')) return <IconCalendarEvent size={24} />;
    if (entityTypeStr.includes('SESSION')) return <IconBook size={24} />;
    if (entityTypeStr.includes('CAMPAIGN')) return <IconWorld size={24} />;
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return <IconWorld size={24} />;
    if (entityTypeStr.includes('NOTE')) return <IconBook size={24} />;

    return <IconEye size={24} />;
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

  // Get placeholder image based on entity type
  const getPlaceholderImage = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return 'https://placehold.co/400x400?text=Character';
    if (entityTypeStr.includes('LOCATION')) return 'https://placehold.co/400x400?text=Location';
    if (entityTypeStr.includes('ITEM')) return 'https://placehold.co/400x400?text=Item';
    if (entityTypeStr.includes('EVENT')) return 'https://placehold.co/400x400?text=Event';
    if (entityTypeStr.includes('SESSION')) return 'https://placehold.co/400x400?text=Session';
    if (entityTypeStr.includes('CAMPAIGN')) return 'https://placehold.co/400x400?text=Campaign';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'https://placehold.co/400x400?text=RPG+World';
    if (entityTypeStr.includes('NOTE')) return 'https://placehold.co/400x400?text=Note';

    return 'https://placehold.co/400x400?text=Entity';
  };

  return (
    <Paper withBorder shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="lg" color={getEntityColor()} variant="light">
              {getEntityIcon()}
            </ThemeIcon>
            <Text fw={500} size="lg">
              {(() => {
                // Format entity type name for display using translations
                const entityTypeStr = entityType.toString().toLowerCase();

                // Handle special cases
                if (entityTypeStr.includes('rpgworld') || entityTypeStr.includes('rpg_world')) {
                  return t('entities:types.worlds');
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
              placeholder={t('ui:tables.filters.search')}
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
                      placeholder={t('ui:tables.filters.filterBy')}
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

        <div style={{ position: 'relative', minHeight: '200px' }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

          {error ? (
            <Text c="red" ta="center" p="md">{error}</Text>
          ) : paginatedData.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No items found</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing="md">
              {paginatedData.map((item) => (
                <Card key={item[idField]} shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section>
                    <Image
                      src={item[imageField] || getPlaceholderImage()}
                      height={160}
                      alt={item[nameField]}
                      fallbackSrc={getPlaceholderImage()}
                    />
                  </Card.Section>

                  <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={500} truncate>{item[nameField]}</Text>
                    <Group gap="xs">
                      {renderBadge ? renderBadge(item) : (
                        <Badge color={getEntityColor()}>
                          {entityType}
                        </Badge>
                      )}
                      {showRelationshipCounts && (
                        loadingCounts[item[idField]] ? (
                          <Skeleton height={22} width={40} radius="xl" />
                        ) : (
                          <RelationshipCountBadge
                            entityId={item[idField] || 'dashboard'}
                            entityType={entityType}
                            count={relationshipCounts[item[idField]] || 0}
                            interactive={true}
                            worldId={worldId || ''}
                            campaignId={campaignId || ''}
                            size="xs"
                            variant="filled"
                          />
                        )
                      )}
                    </Group>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {item[descriptionField] || 'No description available'}
                  </Text>

                  <Group mt="md" justify="space-between">
                    {onView && (
                      <Button
                        variant="light"
                        color={getEntityColor()}
                        size="xs"
                        leftSection={<IconEye size={14} />}
                        onClick={() => onView(item[idField])}
                      >
                        View
                      </Button>
                    )}

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
                            View details
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
                            Edit
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
                            Delete
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
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

export default EntityCardGrid;