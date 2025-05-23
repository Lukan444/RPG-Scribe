import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Tabs,
  SimpleGrid,
  Stack,
  Divider,
  rem
} from '@mantine/core';
import {
  EntityType
} from '../../models/EntityType';
import {
  ENTITY_CATEGORIES,
  ENTITY_CATEGORY_COLORS,
  CATEGORY_DISPLAY_NAMES
} from '../../constants/iconConfig';
import { EntityCard } from '../../components/entity-manager/EntityCard';
import { EntityCategorySection } from '../../components/entity-manager/EntityCategorySection';
import { useTranslation } from 'react-i18next';

/**
 * EntityManagerPage Component
 *
 * A centralized interface for managing all entity types in the system.
 * Provides quick access to create, view, and manage entities by category.
 */
export function EntityManagerPage() {
  const { t } = useTranslation(['ui', 'common', 'entities']);
  const [activeTab, setActiveTab] = useState<string | null>('all');

  // Filter entities by category
  const getEntitiesByCategory = (category: string | null) => {
    if (category === 'all') {
      return Object.values(EntityType);
    }

    return ENTITY_CATEGORIES[category as keyof typeof ENTITY_CATEGORIES] || [];
  };

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="md">{t('ui:entityManagement.entityManager')}</Title>
      <Text c="dimmed" mb="xl">
        {t('ui:entityManagement.entityManagerDescription')}
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="all">{t('ui:entityManagement.allEntities')}</Tabs.Tab>
          {Object.keys(ENTITY_CATEGORIES).map(category => (
            <Tabs.Tab
              key={category}
              value={category}
              leftSection={
                <div style={{
                  width: rem(12),
                  height: rem(12),
                  borderRadius: rem(6),
                  backgroundColor: ENTITY_CATEGORY_COLORS[category as keyof typeof ENTITY_CATEGORY_COLORS]
                }}
                />
              }
            >
              {CATEGORY_DISPLAY_NAMES[category as keyof typeof CATEGORY_DISPLAY_NAMES]}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="all" pt="xs">
          <Stack gap="xl">
            <div>
              <Title order={2}>{t('ui:entityManagement.allEntityTypes')}</Title>
              <Text size="sm" c="dimmed">
                {t('ui:entityManagement.allEntityTypesDescription')}
              </Text>
            </div>
            <Divider />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {Object.values(EntityType).map(entityType => (
                <EntityCard
                  key={entityType}
                  entityType={entityType}
                  showRelationshipBadge={true} // Enable relationship badge for the "All Entities" view
                />
              ))}
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        {Object.keys(ENTITY_CATEGORIES).map(category => (
          <Tabs.Panel key={category} value={category} pt="xs">
            <EntityCategorySection
              category={category}
              entityTypes={getEntitiesByCategory(category)}
            />
          </Tabs.Panel>
        ))}
      </Tabs>
    </Container>
  );
}

export default EntityManagerPage;
