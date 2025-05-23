import {
  Title,
  SimpleGrid,
  Stack,
  Text,
  Divider
} from '@mantine/core';
import { EntityType } from '../../models/EntityType';
import { EntityCard } from './EntityCard';
import { CATEGORY_DISPLAY_NAMES } from '../../constants/iconConfig';

interface EntityCategorySectionProps {
  category: string;
  entityTypes: EntityType[];
  entityCounts?: Record<EntityType, number>;
}

/**
 * EntityCategorySection Component
 * 
 * Displays a section for a specific entity category with cards for each entity type.
 * Used in the EntityManagerPage to organize entity types by category.
 */
export function EntityCategorySection({ 
  category, 
  entityTypes,
  entityCounts
}: EntityCategorySectionProps) {
  const displayName = CATEGORY_DISPLAY_NAMES[category as keyof typeof CATEGORY_DISPLAY_NAMES] || category;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{displayName}</Title>
        <Text size="sm" c="dimmed">
          Manage all {displayName.toLowerCase()} in your RPG campaigns and worlds.
        </Text>
      </div>
      <Divider />
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {entityTypes.map(entityType => (
          <EntityCard 
            key={entityType} 
            entityType={entityType} 
            count={entityCounts?.[entityType]}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default EntityCategorySection;
