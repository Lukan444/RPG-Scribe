import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Breadcrumbs, Anchor, Group, Button, Loader, Center } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { RelationshipManagement } from '../../components/relationships/RelationshipManagement';
import { EntityType } from '../../models/EntityType';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { EventService } from '../../services/event.service';

/**
 * RelationshipManagementPage component - Page for managing entity relationships
 */
function RelationshipManagementPage() {
  const { entityType, entityId, worldId, campaignId } = useParams<{
    entityType: string;
    entityId: string;
    worldId: string;
    campaignId: string;
  }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load entity data
  useEffect(() => {
    const loadEntity = async () => {
      if (!entityType || !entityId || !worldId || !campaignId) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the appropriate service based on entity type
        let service;
        let mappedEntityType: EntityType;

        switch (entityType) {
          case 'characters':
            service = CharacterService.getInstance(worldId, campaignId);
            mappedEntityType = EntityType.CHARACTER;
            break;
          case 'locations':
            service = LocationService.getInstance(worldId, campaignId);
            mappedEntityType = EntityType.LOCATION;
            break;
          case 'items':
            service = ItemService.getInstance(worldId, campaignId);
            mappedEntityType = EntityType.ITEM;
            break;
          case 'events':
            service = EventService.getInstance(worldId, campaignId);
            mappedEntityType = EntityType.EVENT;
            break;
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }

        // Get entity with relationship count
        const entityData = await service.getEntityWithRelationships(entityId);

        if (!entityData) {
          throw new Error(`Entity not found: ${entityId}`);
        }

        setEntity({
          ...entityData,
          mappedType: mappedEntityType
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load entity');
        console.error('Error loading entity:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
  }, [entityType, entityId, worldId, campaignId]);

  // Handle back button click
  const handleBack = () => {
    navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/${entityType}/${entityId}`);
  };

  // Get singular entity type name
  const getEntityTypeName = () => {
    if (!entityType) return '';
    return entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
  };

  return (
    <Container size="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="md" separator="→">
        <Anchor component="button" onClick={() => navigate('/rpg-worlds')}>
          RPG Worlds
        </Anchor>
        <Anchor component="button" onClick={() => navigate(`/rpg-worlds/${worldId}`)}>
          World
        </Anchor>
        <Anchor component="button" onClick={() => navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}`)}>
          Campaign
        </Anchor>
        <Anchor component="button" onClick={() => navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/${entityType}`)}>
          {entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : 'Entity'}
        </Anchor>
        <Anchor component="button" onClick={() => navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/${entityType}/${entityId}`)}>
          {entity?.name || 'Entity'}
        </Anchor>
        <Text>Relationships</Text>
      </Breadcrumbs>

      {/* Back button */}
      <Group mb="md">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={handleBack}
        >
          Back to {getEntityTypeName()}
        </Button>
      </Group>

      {/* Title */}
      <Title order={2} mb="md">
        {entity?.name || getEntityTypeName()} Relationships
      </Title>
      <Text c="dimmed" mb="xl">
        Manage relationships for this {getEntityTypeName()}.
      </Text>

      {/* Loading state */}
      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : error ? (
        <Text c="red" ta="center">
          {error}
        </Text>
      ) : entity ? (
        <RelationshipManagement
          entityId={entityId || ''}
          entityType={entity.mappedType}
          worldId={worldId || ''}
          campaignId={campaignId || ''}
        />
      ) : (
        <Text c="dimmed" ta="center">
          Entity not found
        </Text>
      )}
    </Container>
  );
}

export default RelationshipManagementPage;
