import { useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Text,
  Button,
  ThemeIcon,
  Title,
  rem
} from '@mantine/core';
import {
  EntityType,
  getEntityTypeDisplayName
} from '../../models/EntityType';
import {
  ENTITY_ICONS,
  getEntityCategory,
  getEntityColor,
  ENTITY_CATEGORY_COLORS
} from '../../constants/iconConfig';
import { RelationshipCountBadge } from '../relationships/badges';
import { useTranslation } from 'react-i18next';

interface EntityCardProps {
  entityType: EntityType;
  count?: number;
  worldId?: string;
  campaignId?: string;
  showRelationshipBadge?: boolean;
}

/**
 * EntityCard Component
 *
 * Displays a card for a specific entity type with actions to view all or create new.
 * Used in the EntityManagerPage to provide quick access to entity management.
 */
export function EntityCard({
  entityType,
  count,
  worldId = '',
  campaignId = '',
  showRelationshipBadge = true
}: EntityCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['ui', 'common', 'entities']);
  const IconComponent = ENTITY_ICONS[entityType];
  const displayName = getEntityTypeDisplayName(entityType);
  const category = getEntityCategory(entityType);
  const color = getEntityColor(entityType);

  // Navigate to the entity list page
  const navigateToEntityList = () => {
    const path = `/${entityType.toLowerCase()}s`;
    navigate(path);
  };

  // Navigate to the entity creation page
  const navigateToEntityCreate = () => {
    const path = `/${entityType.toLowerCase()}s/new`;
    navigate(path);
  };

  return (
    <Card withBorder padding="lg" radius="md" shadow="sm">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="lg" color={color} variant="light" radius="md">
              <IconComponent size={rem(18)} />
            </ThemeIcon>
            <Title order={4}>{displayName}</Title>
          </Group>
          {showRelationshipBadge ? (
            <RelationshipCountBadge
              entityId="dashboard" // Use "dashboard" to trigger the mock data generation
              entityType={entityType}
              count={count || 0}
              worldId={worldId}
              campaignId={campaignId}
              variant="light"
              size="md"
              interactive={false}
              tooltipPosition="left"
            />
          ) : (
            <Text size="sm" fw={500} c={color}>
              {category.replace('_GROUP', '')}
            </Text>
          )}
        </Group>
      </Card.Section>

      <Text mt="md" mb="md" size="sm" c="dimmed">
        {t(`ui:entityManagement.manage${displayName.replace(' ', '')}Entities`)}
      </Text>

      <Group mt="md" justify="space-between">
        <Button
          variant="light"
          color={color}
          onClick={navigateToEntityList}
        >
          {t('ui:entityManagement.viewAll')}
        </Button>
        <Button
          variant="filled"
          color={color}
          onClick={navigateToEntityCreate}
        >
          {t('ui:entityManagement.createNew')}
        </Button>
      </Group>
    </Card>
  );
}

export default EntityCard;
