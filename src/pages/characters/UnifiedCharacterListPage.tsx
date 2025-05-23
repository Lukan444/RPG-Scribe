/**
 * Unified Character List Page
 *
 * This page demonstrates the use of the unified entity list component for characters.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Group, Text, rem } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { CharacterServiceAdapter } from '../../services/adapters/CharacterServiceAdapter';
import { Character } from '../../models/Character';
import { EntityType } from '../../models/EntityType';

/**
 * Unified character list page component
 */
export function UnifiedCharacterListPage() {
  const { worldId } = useParams<{ worldId?: string }>();
  const { t } = useTranslation(['ui', 'common']);

  // Get character service
  const characterService = new CharacterServiceAdapter(
    worldId || '',
    'default-campaign'
  );

  // Get character list configuration
  const config = EntityListConfigFactory.createCharacterConfig();

  // Override the icon and renderBadge function to provide a custom badge
  const configWithCustomBadge = {
    ...config,
    icon: <IconUser size={rem(20)} />,
    renderBadge: (character: Character) => {
      const getTypeColor = () => {
        switch (character.type) {
          case 'PC':
            return 'blue';
          case 'NPC':
            return 'green';
          default:
            return 'gray';
        }
      };

      return (
        <Group gap="xs">
          <Badge color={getTypeColor()} size="sm">
            {character.type === 'PC' ? t('entityTypes.pc') :
             character.type === 'NPC' ? t('entityTypes.npc') :
             character.type || 'Unknown'}
          </Badge>
          {character.level && (
            <Badge color="yellow" size="sm">
              {t('entityTypes.level')} {character.level}
            </Badge>
          )}
        </Group>
      );
    }
  };

  // Render the page title based on whether we're in a world context
  const renderTitle = () => {
    if (worldId) {
      return t('pages.characters.worldCharacters');
    }
    return t('pages.characters.allCharacters');
  };

  // Render the page subtitle based on whether we're in a world context
  const renderSubtitle = () => {
    if (worldId) {
      return t('pages.characters.worldSubtitle');
    }
    return t('pages.characters.subtitle');
  };

  return (
    <EntityListPage<Character>
      config={configWithCustomBadge}
      worldId={worldId}
      entityService={characterService}
      title={renderTitle()}
      subtitle={renderSubtitle()}
      showBackButton={!!worldId}
      backButtonLabel={t('pages.worlds.backToWorld')}
    />
  );
}
