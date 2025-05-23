import React, { useState, useEffect, memo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Button,
  Tabs,
  ActionIcon,
  Menu,
  Skeleton,
  Table,
  TextInput,
  Select,
  Pagination,
  Badge,
  Checkbox,
  useMantineTheme
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/Campaign';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { EventService } from '../../services/event.service';
import { SessionService } from '../../services/session.service';
import { QueryConstraint, where } from 'firebase/firestore';
import {
  IconDotsVertical,
  IconPlus,
  IconSearch,
  IconFilter,
  IconUsers,
  IconMap2,
  IconSword,
  IconBackpack,
  IconCalendarEvent,
  IconTrash,
  IconEdit,
  IconEye
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';

/**
 * EntityTable component - Displays a table of entities with selection and action capabilities
 */
const EntityTable = memo(({
  entities,
  entityType,
  campaignId,
  user,
  isOwner,
  selectedEntities,
  onSelectEntity,
  onSelectAll,
  onDeleteSelected
}: {
  entities: any[];
  entityType: string;
  campaignId: string;
  user: any;
  isOwner: boolean;
  selectedEntities: string[];
  onSelectEntity: (entityId: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: (entityIds: string[]) => void;
}) => {
  return (
    <Table striped highlightOnHover>
      <thead>
        <tr>
          <th style={{ width: 40 }}>
            <Checkbox
              checked={selectedEntities.length === entities.length && entities.length > 0}
              indeterminate={selectedEntities.length > 0 && selectedEntities.length < entities.length}
              onChange={onSelectAll}
            />
          </th>
          <th>Name</th>
          <th>Type</th>
          <th>Created By</th>
          <th>Last Updated</th>
          <th style={{ width: 120 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {entities.length > 0 ? (
          entities.map((entity: any) => (
            <tr key={entity.id}>
              <td>
                <Checkbox
                  checked={selectedEntities.includes(entity.id)}
                  onChange={() => onSelectEntity(entity.id)}
                />
              </td>
              <td>
                <Link to={`/campaigns/${campaignId}/${entityType}/${entity.id}`}>
                  {entity.name || entity.title}
                </Link>
              </td>
              <td>
                <Badge color={
                  entityType === 'characters' ? (entity.type === 'PC' ? 'blue' : 'gray') :
                  entityType === 'locations' ? 'green' :
                  entityType === 'items' ? 'amber' :
                  entityType === 'events' ? 'orange' :
                  entityType === 'sessions' ? (
                    entity.status === 'planned' ? 'blue' :
                    entity.status === 'completed' ? 'green' : 'red'
                  ) : 'gray'
                }>
                  {entity.type || entity.status}
                </Badge>
              </td>
              <td>{entity.createdBy === user?.id ? 'You' : entity.createdBy}</td>
              <td>{entity.updatedAt ? new Date(entity.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
              <td>
                <Group gap={8}>
                  <ActionIcon
                    component={Link}
                    to={`/campaigns/${campaignId}/${entityType}/${entity.id}`}
                    color="blue"
                  >
                    <IconEye size={16} />
                  </ActionIcon>

                  {(isOwner || entity.createdBy === user?.id) && (
                    <>
                      <ActionIcon
                        component={Link}
                        to={`/campaigns/${campaignId}/${entityType}/${entity.id}/edit`}
                        color="green"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>

                      <ActionIcon
                        color="red"
                        onClick={() => onDeleteSelected([entity.id])}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </>
                  )}
                </Group>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
              <Text color="dimmed">
                No {entityType?.toLowerCase()} found
              </Text>
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
});

/**
 * Entity Management Page component
 */
const EntityManagementPage: React.FC = () => {
  const { campaignId, entityType } = useParams<{ campaignId: string; entityType: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useMantineTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [totalEntities, setTotalEntities] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Services
  const campaignService = new CampaignService();

  // Get entity service based on entity type
  const getEntityService = () => {
    if (!campaignId) return null;

    switch (entityType) {
      case 'characters':
        return CharacterService.getInstance(campaign?.worldId || '', campaignId);
      case 'locations':
        return LocationService.getInstance(campaign?.worldId || '', campaignId);
      case 'items':
        return ItemService.getInstance(campaign?.worldId || '', campaignId);
      case 'events':
        return EventService.getInstance(campaign?.worldId || '', campaignId);
      case 'sessions':
        return SessionService.getInstance(campaign?.worldId || '', campaignId);
      default:
        return null;
    }
  };

  // Get entity type label
  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'characters':
        return 'Characters';
      case 'locations':
        return 'Locations';
      case 'items':
        return 'Items';
      case 'events':
        return 'Events';
      case 'sessions':
        return 'Sessions';
      default:
        return 'Entities';
    }
  };

  // Get entity type icon
  const getEntityTypeIcon = () => {
    switch (entityType) {
      case 'characters':
        return <IconUsers size={20} />;
      case 'locations':
        return <IconMap2 size={20} />;
      case 'items':
        return <IconBackpack size={20} />;
      case 'events':
        return <IconSword size={20} />;
      case 'sessions':
        return <IconCalendarEvent size={20} />;
      default:
        return null;
    }
  };

  // Get filter options based on entity type
  const getFilterOptions = () => {
    switch (entityType) {
      case 'characters':
        return [
          { value: '', label: 'All Types' },
          { value: 'PC', label: 'Player Characters' },
          { value: 'NPC', label: 'Non-Player Characters' }
        ];
      case 'locations':
        return [
          { value: '', label: 'All Types' },
          { value: 'city', label: 'Cities' },
          { value: 'dungeon', label: 'Dungeons' },
          { value: 'wilderness', label: 'Wilderness' },
          { value: 'building', label: 'Buildings' }
        ];
      case 'items':
        return [
          { value: '', label: 'All Types' },
          { value: 'weapon', label: 'Weapons' },
          { value: 'armor', label: 'Armor' },
          { value: 'potion', label: 'Potions' },
          { value: 'scroll', label: 'Scrolls' },
          { value: 'wondrous', label: 'Wondrous Items' }
        ];
      case 'events':
        return [
          { value: '', label: 'All Types' },
          { value: 'battle', label: 'Battles' },
          { value: 'social', label: 'Social Events' },
          { value: 'discovery', label: 'Discoveries' },
          { value: 'plot', label: 'Plot Points' }
        ];
      case 'sessions':
        return [
          { value: '', label: 'All Statuses' },
          { value: 'planned', label: 'Planned' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      default:
        return [];
    }
  };

  // Load campaign and entity data
  useEffect(() => {
    const loadData = async () => {
      if (!campaignId || !entityType || !user) return;

      setLoading(true);

      try {
        // Load campaign
        const campaignData = await campaignService.getById(campaignId);

        if (!campaignData) {
          navigate('/campaigns');
          return;
        }

        setCampaign(campaignData);
        setIsOwner(campaignData.createdBy === user.id);

        // Load entities
        const entityService = getEntityService();

        if (!entityService) {
          navigate(`/campaigns/${campaignId}`);
          return;
        }

        // Build query constraints
        const constraints: QueryConstraint[] = [];

        if (filterValue) {
          if (entityType === 'characters' || entityType === 'locations' || entityType === 'items' || entityType === 'events') {
            constraints.push(where('type', '==', filterValue));
          } else if (entityType === 'sessions') {
            constraints.push(where('status', '==', filterValue));
          }
        }

        // Execute query
        const result = await entityService.query(constraints, pageSize, undefined);
        setEntities(result.data);

        // Get total count (this would be better with a proper count query)
        const allEntities = await entityService.query(constraints, 1000, undefined);
        setTotalEntities(allEntities.data.length);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [campaignId, entityType, user, navigate, page, pageSize, filterValue]);

  // Handle search
  const handleSearch = () => {
    // This would be better with a proper search query
    // For now, we'll just filter the loaded entities
    if (!searchQuery) {
      return entities;
    }

    const query = searchQuery.toLowerCase();
    return entities.filter((entity: any) =>
      entity.name?.toLowerCase().includes(query) ||
      entity.description?.toLowerCase().includes(query) ||
      entity.title?.toLowerCase().includes(query) // For sessions
    );
  };

  // Handle entity selection - memoized with useCallback
  const handleSelectEntity = useCallback((entityId: string) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      } else {
        return [...prev, entityId];
      }
    });
  }, []);

  // Handle select all entities - memoized with useCallback
  const handleSelectAll = useCallback(() => {
    setSelectedEntities(prev => {
      if (prev.length === entities.length) {
        return [];
      } else {
        return entities.map((entity: any) => entity.id);
      }
    });
  }, [entities]);

  // Delete selected entities confirmation
  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: `Delete ${selectedEntities.length} ${getEntityTypeLabel()}`,
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete the selected {getEntityTypeLabel().toLowerCase()}? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: deleteSelectedEntities,
    });
  };

  // Delete selected entities - memoized with useCallback
  const deleteSelectedEntities = useCallback(async () => {
    if (!campaignId || selectedEntities.length === 0) return;

    try {
      const entityService = getEntityService();

      if (!entityService) return;

      // Delete each selected entity
      for (const entityId of selectedEntities) {
        await entityService.delete(entityId);
      }

      // Refresh data
      setSelectedEntities([]);

      // Reload entities
      const result = await entityService.query([], pageSize, undefined);
      setEntities(result.data);

      // Get total count
      const allEntities = await entityService.query([], 1000, undefined);
      setTotalEntities(allEntities.data.length);
    } catch (error) {
      console.error('Error deleting entities:', error);
    }
  }, [campaignId, selectedEntities, pageSize, getEntityService]);

  // Render loading state
  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Skeleton height={50} width="50%" mb="xl" />
        <Skeleton height={50} mb="xl" />
        <Skeleton height={400} />
      </Container>
    );
  }

  // Render not found state
  if (!campaign) {
    return (
      <Container size="xl" py="xl">
        <Title order={1} mb="xl">Campaign Not Found</Title>
        <Text>The campaign you are looking for does not exist or you do not have permission to view it.</Text>
        <Button component={Link} to="/campaigns" mt="xl">
          Back to Campaigns
        </Button>
      </Container>
    );
  }

  // Filter entities based on search query
  const filteredEntities = handleSearch();

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Text size="sm" color="dimmed" mb="xs">
            <Link to={`/campaigns/${campaignId}`}>{campaign.name}</Link> / {getEntityTypeLabel()}
          </Text>
          <Title order={1}>{getEntityTypeLabel()}</Title>
        </div>

        {isOwner && (
          <Button
            component={Link}
            to={`/campaigns/${campaignId}/${entityType}/new`}
            leftSection={<IconPlus size={16} />}
          >
            Add {entityType === 'sessions' ? 'Session' : entityType?.slice(0, -1)}
          </Button>
        )}
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            <TextInput
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />

            <Select
              placeholder="Filter by type"
              leftSection={<IconFilter size={16} />}
              data={getFilterOptions()}
              value={filterValue}
              onChange={(value) => setFilterValue(value || '')}
              clearable
            />
          </Group>

          {selectedEntities.length > 0 && (
            <Group>
              <Text size="sm">{selectedEntities.length} selected</Text>
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={openDeleteModal}
              >
                Delete Selected
              </Button>
            </Group>
          )}
        </Group>

        <EntityTable
          entities={filteredEntities}
          entityType={entityType || ''}
          campaignId={campaignId || ''}
          user={user}
          isOwner={isOwner}
          selectedEntities={selectedEntities}
          onSelectEntity={handleSelectEntity}
          onSelectAll={handleSelectAll}
          onDeleteSelected={(entityIds) => {
            setSelectedEntities(entityIds);
            openDeleteModal();
          }}
        />

        {totalEntities > pageSize && (
          <Group justify="center" mt="xl">
            <Pagination
              total={Math.ceil(totalEntities / pageSize)}
              value={page}
              onChange={setPage}
            />
          </Group>
        )}
      </Card>
    </Container>
  );
};

export default memo(EntityManagementPage);
