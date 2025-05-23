import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Group,
  Button,
  Select,
  TextInput,
  Stack,
  Text,
  Badge,
  Card,
  ActionIcon,
  Tooltip,
  Divider,
  Textarea
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconLink,
  IconSearch
} from '@tabler/icons-react';
import { useEntityRelationship } from '../../contexts/EntityRelationshipContext';
import { EntityType, RelationshipType } from '../../models/Relationship';
import { SafeModal } from '../common/SafeModal';

/**
 * Entity relationship manager props
 */
interface EntityRelationshipManagerProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  campaignId: string;
}

/**
 * EntityRelationshipManager component - Manages relationships for an entity
 */
export function EntityRelationshipManager({
  entityId,
  entityType,
  entityName,
  campaignId
}: EntityRelationshipManagerProps) {
  const {
    relationships,
    relatedEntities,
    isLoading,
    error,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    refreshRelationships
  } = useEntityRelationship();

  // State for add/edit relationship modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRelationshipId, setCurrentRelationshipId] = useState<string | null>(null);
  const [targetEntityId, setTargetEntityId] = useState<string | null>(null);
  const [targetEntityType, setTargetEntityType] = useState<EntityType | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get relationship type options based on entity types
  const getRelationshipTypeOptions = (sourceType: EntityType, targetType: EntityType) => {
    // Common relationship types for all entity combinations
    const commonTypes = [
      { value: RelationshipType.RELATED_TO, label: 'Related To' },
      { value: RelationshipType.PART_OF, label: 'Part Of' },
      { value: RelationshipType.REFERENCES, label: 'References' }
    ];

    // Specific relationship types based on entity types
    if (sourceType === EntityType.CHARACTER && targetType === EntityType.CHARACTER) {
      return [
        { value: RelationshipType.FRIEND, label: 'Friend' },
        { value: RelationshipType.ALLY, label: 'Ally' },
        { value: RelationshipType.ENEMY, label: 'Enemy' },
        { value: RelationshipType.FAMILY, label: 'Family' },
        { value: RelationshipType.MENTOR, label: 'Mentor' },
        { value: RelationshipType.STUDENT, label: 'Student' },
        { value: RelationshipType.RIVAL, label: 'Rival' },
        { value: RelationshipType.LOVER, label: 'Lover' },
        ...commonTypes
      ];
    }

    if ((sourceType === EntityType.CHARACTER && targetType === EntityType.LOCATION) ||
        (sourceType === EntityType.LOCATION && targetType === EntityType.CHARACTER)) {
      return [
        { value: RelationshipType.LOCATED_AT, label: 'Located At' },
        ...commonTypes
      ];
    }

    if ((sourceType === EntityType.CHARACTER && targetType === EntityType.ITEM) ||
        (sourceType === EntityType.ITEM && targetType === EntityType.CHARACTER)) {
      return [
        { value: RelationshipType.OWNS, label: 'Owns' },
        { value: RelationshipType.CREATED, label: 'Created' },
        ...commonTypes
      ];
    }

    if ((sourceType === EntityType.LOCATION && targetType === EntityType.LOCATION)) {
      return [
        { value: RelationshipType.CONTAINS, label: 'Contains' },
        { value: RelationshipType.NEAR, label: 'Near' },
        { value: RelationshipType.CONNECTED_TO, label: 'Connected To' },
        ...commonTypes
      ];
    }

    if ((sourceType === EntityType.EVENT && targetType === EntityType.CHARACTER) ||
        (sourceType === EntityType.CHARACTER && targetType === EntityType.EVENT)) {
      return [
        { value: RelationshipType.PARTICIPATED_IN, label: 'Participated In' },
        ...commonTypes
      ];
    }

    if ((sourceType === EntityType.EVENT && targetType === EntityType.LOCATION) ||
        (sourceType === EntityType.LOCATION && targetType === EntityType.EVENT)) {
      return [
        { value: RelationshipType.OCCURRED_AT, label: 'Occurred At' },
        ...commonTypes
      ];
    }

    if ((sourceType === EntityType.EVENT && targetType === EntityType.EVENT)) {
      return [
        { value: RelationshipType.CAUSED, label: 'Caused' },
        { value: RelationshipType.RESULTED_FROM, label: 'Resulted From' },
        ...commonTypes
      ];
    }

    return commonTypes;
  };

  // Get entity type options
  const entityTypeOptions = Object.values(EntityType)
    .filter(type => type !== entityType) // Exclude current entity type
    .map(type => ({
      value: type,
      label: type.charAt(0) + type.slice(1).toLowerCase()
    }));

  // Reset modal form
  const resetForm = () => {
    setTargetEntityId(null);
    setTargetEntityType(null);
    setRelationshipType(null);
    setDescription('');
    setCurrentRelationshipId(null);
    setIsEditing(false);
  };

  // Open add relationship modal
  const handleAddRelationship = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open edit relationship modal
  const handleEditRelationship = (relationshipId: string) => {
    const relationship = relationships.find(rel => rel.id === relationshipId);
    if (!relationship) return;

    const isSource = relationship.sourceEntityId === entityId;
    setTargetEntityId(isSource ? relationship.targetEntityId : relationship.sourceEntityId);
    setTargetEntityType(isSource ? relationship.targetEntityType : relationship.sourceEntityType);
    setRelationshipType(relationship.relationshipType);
    setDescription(relationship.description || '');
    setCurrentRelationshipId(relationshipId);
    setIsEditing(true);
    setModalOpen(true);
  };

  // Handle save relationship
  const handleSaveRelationship = async () => {
    if (!targetEntityId || !targetEntityType || !relationshipType) return;

    try {
      if (isEditing && currentRelationshipId) {
        await updateRelationship(
          currentRelationshipId,
          relationshipType,
          description
        );
      } else {
        await addRelationship(
          entityId,
          entityType,
          targetEntityId,
          targetEntityType,
          relationshipType,
          description
        );
      }

      setModalOpen(false);
      resetForm();
      refreshRelationships();
    } catch (error) {
      console.error('Error saving relationship:', error);
    }
  };

  // Handle delete relationship
  const handleDeleteRelationship = async (relationshipId: string) => {
    if (window.confirm('Are you sure you want to delete this relationship?')) {
      try {
        await deleteRelationship(relationshipId);
        refreshRelationships();
      } catch (error) {
        console.error('Error deleting relationship:', error);
      }
    }
  };

  // Filter relationship types based on selected entity types
  const relationshipTypeOptions = targetEntityType
    ? getRelationshipTypeOptions(entityType, targetEntityType)
    : [];

  // Mock entity search results
  const searchResults = [
    { id: '1', name: 'Gandalf', type: EntityType.CHARACTER },
    { id: '2', name: 'Mordor', type: EntityType.LOCATION },
    { id: '3', name: 'One Ring', type: EntityType.ITEM }
  ];

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Relationships</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddRelationship}
          disabled={isLoading}
        >
          Add Relationship
        </Button>
      </Group>

      {error && <Text c="red">{typeof error === 'string' ? error : 'An error occurred'}</Text>}

      {relationships.length === 0 ? (
        <Text c="dimmed">No relationships found for this entity.</Text>
      ) : (
        <Stack>
          {relationships.map(relationship => {
            const isSource = relationship.sourceEntityId === entityId;
            const relatedEntityId = isSource ? relationship.targetEntityId : relationship.sourceEntityId;
            const relatedEntity = relatedEntities.find(entity => entity.id === relatedEntityId);

            return (
              <Card key={relationship.id} withBorder shadow="sm" p="sm">
                <Group justify="space-between">
                  <Group>
                    <Badge color="blue">
                      {isSource ? 'This' : relatedEntity?.name || 'Unknown'}
                    </Badge>
                    <Text fw={500}>
                      {relationship.relationshipType.replace('_', ' ')}
                    </Text>
                    <Badge color="green">
                      {isSource ? relatedEntity?.name || 'Unknown' : 'This'}
                    </Badge>
                  </Group>

                  <Group>
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleEditRelationship(relationship.id)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteRelationship(relationship.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                {relationship.description && (
                  <Text size="sm" c="dimmed" mt="xs">
                    {relationship.description}
                  </Text>
                )}
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Add/Edit Relationship Modal */}
      <SafeModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Relationship' : 'Add Relationship'}
        size="md"
      >
        <Stack>
          <Group grow>
            <TextInput
              label="Source Entity"
              value={entityName}
              disabled
            />
            <Select
              label="Relationship Type"
              placeholder="Select type"
              data={relationshipTypeOptions}
              value={relationshipType}
              onChange={(value) => setRelationshipType(value as RelationshipType)}
              disabled={!targetEntityType}
              required
            />
          </Group>

          <Select
            label="Target Entity Type"
            placeholder="Select entity type"
            data={entityTypeOptions}
            value={targetEntityType}
            onChange={(value) => setTargetEntityType(value as EntityType)}
            required
          />

          <TextInput
            label="Search Entities"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            disabled={!targetEntityType}
          />

          {searchQuery && (
            <Paper withBorder p="xs">
              <Stack>
                {searchResults
                  .filter(entity =>
                    entity.type === targetEntityType &&
                    entity.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(entity => (
                    <Group key={entity.id} justify="space-between">
                      <Text>{entity.name}</Text>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => setTargetEntityId(entity.id)}
                      >
                        Select
                      </Button>
                    </Group>
                  ))
                }
              </Stack>
            </Paper>
          )}

          <Textarea
            label="Description"
            placeholder="Describe the relationship..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRelationship}
              disabled={!targetEntityId || !targetEntityType || !relationshipType}
            >
              {isEditing ? 'Update' : 'Add'} Relationship
            </Button>
          </Group>
        </Stack>
      </SafeModal>
    </Stack>
  );
}
