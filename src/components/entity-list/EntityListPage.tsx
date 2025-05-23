/**
 * Entity List Page
 *
 * This component provides a standardized page for displaying lists of entities.
 * It supports multiple view types, filtering, sorting, and pagination.
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DocumentData, QueryConstraint, where, orderBy } from 'firebase/firestore';
import {
  Container,
  Title,
  Group,
  Button,
  Loader,
  Center,
  Text,
  Stack,
  SegmentedControl,
  Paper,
  Tabs,
  Divider,
  Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconArrowLeft } from '@tabler/icons-react';
import { EntityTable } from '../common/EntityTable';
import { EntityCardGrid } from '../common/EntityCardGrid';
import { ArticleCard } from '../common/ArticleCard';
import { DragDropEntityOrganizer } from '../common/DragDropEntityOrganizer';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { EntityListProvider, useEntityList } from './context/EntityListContext';
import { EntityListViewType, IEntityListConfig } from './interfaces/EntityListConfig.interface';
import { EntityListFilters } from './components/EntityListFilters';
import { EntityListEmptyState } from './components/EntityListEmptyState';
import { EntityListSkeleton } from './components/EntityListSkeleton';
import { IEntityService } from '../../services/interfaces/EntityService.interface';
import { EntityServiceFactory } from '../../services/EntityServiceFactory';
import { EntityType } from '../../models/EntityType';

/**
 * Entity list page props
 */
interface EntityListPageProps<T extends DocumentData> {
  config: IEntityListConfig<T>;
  worldId?: string;
  campaignId?: string;
  entityService?: IEntityService<T>;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackClick?: () => void;
  additionalActions?: ReactNode;
  additionalFilters?: QueryConstraint[];
  headerContent?: ReactNode;
  footerContent?: ReactNode;
}

/**
 * Entity list page component
 */
export function EntityListPage<T extends DocumentData>({
  config,
  worldId,
  campaignId,
  entityService: providedEntityService,
  title,
  subtitle,
  showBackButton = false,
  backButtonLabel = 'Back',
  onBackClick,
  additionalActions,
  additionalFilters = [],
  headerContent,
  footerContent
}: EntityListPageProps<T>) {
  return (
    <EntityListProvider config={config}>
      <EntityListPageContent<T>
        config={config}
        worldId={worldId}
        campaignId={campaignId}
        entityService={providedEntityService}
        title={title}
        subtitle={subtitle}
        showBackButton={showBackButton}
        backButtonLabel={backButtonLabel}
        onBackClick={onBackClick}
        additionalActions={additionalActions}
        additionalFilters={additionalFilters}
        headerContent={headerContent}
        footerContent={footerContent}
      />
    </EntityListProvider>
  );
}

/**
 * Entity list page content component
 */
function EntityListPageContent<T extends DocumentData>({
  config,
  worldId,
  campaignId,
  entityService: providedEntityService,
  title,
  subtitle,
  showBackButton,
  backButtonLabel,
  onBackClick,
  additionalActions,
  additionalFilters,
  headerContent,
  footerContent
}: EntityListPageProps<T>) {
  const navigate = useNavigate();
  const params = useParams();
  const {
    viewType,
    setViewType,
    filters,
    sortBy,
    sortDirection,
    searchQuery,
    page,
    setPage,
    pageSize
  } = useEntityList<T>();

  // State
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [deleteDialogOpened, { open: openDeleteDialog, close: closeDeleteDialog }] = useDisclosure(false);
  const [entityToDelete, setEntityToDelete] = useState<T | null>(null);

  // Get entity service
  const entityService = providedEntityService || (() => {
    const effectiveWorldId = worldId || params.worldId || '';
    const effectiveCampaignId = campaignId || params.campaignId || '';
    return EntityServiceFactory.getInstance().getService<T>(
      config.entityType,
      effectiveWorldId,
      effectiveCampaignId
    );
  })();

  // Fetch entities
  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query constraints
        const constraints: QueryConstraint[] = additionalFilters ? [...additionalFilters] : [];

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            constraints.push(where(key, '==', value));
          }
        });

        // Add search
        if (searchQuery) {
          // This is a simple implementation - in a real app, you might use
          // a more sophisticated search mechanism like Firestore's array-contains
          // or a dedicated search service
          constraints.push(where(config.nameField, '>=', searchQuery));
          constraints.push(where(config.nameField, '<=', searchQuery + '\uf8ff'));
        }

        // Add sorting
        if (sortBy) {
          constraints.push(orderBy(sortBy, sortDirection));
        } else {
          // Default sort by name
          constraints.push(orderBy(config.nameField, 'asc'));
        }

        // Get total count for pagination
        const totalCount = await entityService.getCount('list', constraints);
        setTotalCount(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));

        // Query entities with pagination
        const { data } = await entityService.query(
          constraints,
          pageSize,
          undefined, // TODO: Implement cursor-based pagination
          {
            forceServer: true
          }
        );

        setEntities(data);
      } catch (err) {
        console.error('Error fetching entities:', err);
        setError('Failed to load entities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [
    entityService,
    filters,
    sortBy,
    sortDirection,
    searchQuery,
    page,
    pageSize,
    additionalFilters
  ]);

  // Handle view entity
  const handleViewEntity = (entity: T) => {
    const id = entity[config.idField];
    const effectiveWorldId = worldId || params.worldId || '';
    const effectiveCampaignId = campaignId || params.campaignId || '';
    navigate(config.getViewRoute(id, effectiveWorldId, effectiveCampaignId));
  };

  // Handle edit entity
  const handleEditEntity = (entity: T) => {
    const id = entity[config.idField];
    const effectiveWorldId = worldId || params.worldId || '';
    const effectiveCampaignId = campaignId || params.campaignId || '';
    navigate(config.getEditRoute(id, effectiveWorldId, effectiveCampaignId));
  };

  // Handle delete entity
  const handleDeleteEntity = (entity: T) => {
    setEntityToDelete(entity);
    openDeleteDialog();
  };

  // Confirm delete entity
  const confirmDeleteEntity = async () => {
    if (!entityToDelete) return;

    try {
      const id = entityToDelete[config.idField];
      await entityService.delete(id);

      // Remove entity from state
      setEntities(prev => prev.filter(entity => entity[config.idField] !== id));

      // Show success notification
      notifications.show({
        title: 'Entity Deleted',
        message: `The ${config.displayName.toLowerCase()} has been deleted successfully.`,
        color: 'green'
      });
    } catch (err) {
      console.error('Error deleting entity:', err);

      // Show error notification
      notifications.show({
        title: 'Error',
        message: `Failed to delete ${config.displayName.toLowerCase()}. Please try again.`,
        color: 'red'
      });
    } finally {
      closeDeleteDialog();
      setEntityToDelete(null);
    }
  };

  // Handle create entity
  const handleCreateEntity = () => {
    const effectiveWorldId = worldId || params.worldId || '';
    const effectiveCampaignId = campaignId || params.campaignId || '';
    navigate(config.getCreateRoute(effectiveWorldId, effectiveCampaignId));
  };

  // Handle save order (for organize view)
  const handleSaveOrder = async (orderedEntities: T[]) => {
    // This is a placeholder - in a real app, you would implement
    // logic to save the new order to the database
    console.log('Save order:', orderedEntities);

    // Show success notification
    notifications.show({
      title: 'Order Saved',
      message: `The ${config.displayName.toLowerCase()} order has been saved successfully.`,
      color: 'green'
    });
  };

  // Render view based on view type
  const renderView = () => {
    if (loading) {
      return <EntityListSkeleton viewType={viewType} />;
    }

    if (error) {
      return (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Stack align="center">
              <Text c="red" size="lg">{error}</Text>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </Stack>
          </Center>
        </Paper>
      );
    }

    if (entities.length === 0) {
      return (
        <EntityListEmptyState
          entityType={config.entityType}
          message={config.emptyStateMessage}
          actionText={config.emptyStateActionText}
          onAction={handleCreateEntity}
        />
      );
    }

    switch (viewType) {
      case 'table':
        return (
          <EntityTable
            data={entities}
            columns={config.columns}
            entityType={config.entityType}
            onView={handleViewEntity}
            onEdit={handleEditEntity}
            onDelete={handleDeleteEntity}
            idField={config.idField}
            filterOptions={config.filterOptions}
            showRelationshipCounts={config.showRelationshipCounts}
            worldId={worldId || params.worldId || ''}
            campaignId={campaignId || params.campaignId || ''}
          />
        );

      case 'grid':
        return (
          <EntityCardGrid
            data={entities}
            entityType={config.entityType}
            onView={handleViewEntity}
            onEdit={handleEditEntity}
            onDelete={handleDeleteEntity}
            idField={config.idField}
            nameField={config.nameField}
            descriptionField={config.descriptionField}
            imageField={config.imageField || undefined}
            filterOptions={config.filterOptions}
            renderBadge={config.renderBadge || undefined}
            showRelationshipCounts={config.showRelationshipCounts}
            worldId={worldId || params.worldId || ''}
            campaignId={campaignId || params.campaignId || ''}
          />
        );

      case 'article':
        return (
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group>
                  {config.icon}
                  <Text fw={500} size="lg">{config.displayName}s</Text>
                </Group>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleCreateEntity}
                >
                  Add {config.displayName}
                </Button>
              </Group>

              <Divider />

              <Box>
                <Stack gap="md">
                  {entities.map(entity => (
                    <ArticleCard
                      key={entity[config.idField]}
                      id={entity[config.idField]}
                      image={config.imageField ? entity[config.imageField] : undefined}
                      title={entity[config.nameField]}
                      description={entity[config.descriptionField] || ''}
                      entityType={config.entityType}
                      onView={() => handleViewEntity(entity)}
                      onEdit={() => handleEditEntity(entity)}
                      onDelete={() => handleDeleteEntity(entity)}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        );

      case 'organize':
        return (
          <DragDropEntityOrganizer
            data={entities}
            entityType={config.entityType}
            onSaveOrder={handleSaveOrder}
            onView={handleViewEntity}
            onEdit={handleEditEntity}
            onDelete={handleDeleteEntity}
            renderItem={config.renderOrganizeItem}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            {showBackButton && (
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={onBackClick || (() => navigate(-1))}
              >
                {backButtonLabel}
              </Button>
            )}

            <Stack gap={0}>
              <Title order={1}>{title || `${config.displayName}s`}</Title>
              {subtitle && <Text c="dimmed">{subtitle}</Text>}
            </Stack>
          </Group>

          <Group>
            {additionalActions}

            {config.showAddButton && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleCreateEntity}
              >
                Add {config.displayName}
              </Button>
            )}
          </Group>
        </Group>

        {/* Header content */}
        {headerContent}

        {/* View selector */}
        {config.availableViews.length > 1 && (
          <SegmentedControl
            value={viewType}
            onChange={(value) => setViewType(value as EntityListViewType)}
            data={[
              { value: 'table', label: 'Table' },
              { value: 'grid', label: 'Grid' },
              { value: 'article', label: 'Article' },
              { value: 'organize', label: 'Organize' }
            ].filter(item => config.availableViews.includes(item.value as EntityListViewType))}
          />
        )}

        {/* Filters */}
        {config.showFilterPanel && config.filterOptions.length > 0 && (
          <EntityListFilters />
        )}

        {/* Entity list */}
        {renderView()}

        {/* Footer content */}
        {footerContent}
      </Stack>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        opened={deleteDialogOpened}
        onClose={closeDeleteDialog}
        title={`Delete ${config.displayName}`}
        message={`Are you sure you want to delete this ${config.displayName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteEntity}
      />
    </Container>
  );
}
