/**
 * Unified Location List Page
 *
 * This page demonstrates the use of the unified entity list component for locations.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Group, Text, rem } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { LocationServiceAdapter } from '../../services/adapters/LocationServiceAdapter';
import { Location, LocationType } from '../../models/Location';
import { EntityType } from '../../models/EntityType';

/**
 * Unified location list page component
 */
export function UnifiedLocationListPage() {
  const { worldId } = useParams<{ worldId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['ui', 'common']);

  // Get location service
  const locationService = new LocationServiceAdapter(
    worldId || '',
    'default-campaign'
  );

  // Get location list configuration
  const config = EntityListConfigFactory.createLocationConfig();

  // Override the icon and renderBadge function to provide a custom badge
  const configWithCustomBadge = {
    ...config,
    icon: <IconMapPin size={20} />,
    renderBadge: (location: Location) => {
      const getTypeColor = () => {
        switch (location.locationType) {
          case LocationType.CITY:
            return 'blue';
          case LocationType.BUILDING:
            return 'green';
          case LocationType.REGION:
            return 'teal';
          case LocationType.DUNGEON:
            return 'red';
          case LocationType.WILDERNESS:
            return 'lime';
          default:
            return 'gray';
        }
      };

      return (
        <Group gap="xs">
          <Badge color={getTypeColor()} size="sm">
            {location.locationType || 'Unknown'}
          </Badge>
          {location.region && (
            <Badge color="yellow" size="sm">
              {location.region}
            </Badge>
          )}
        </Group>
      );
    }
  };

  // Render the page title based on whether we're in a world context
  const renderTitle = () => {
    if (worldId) {
      return t('pages.locations.worldLocations');
    }
    return t('pages.locations.allLocations');
  };

  // Render the page subtitle based on whether we're in a world context
  const renderSubtitle = () => {
    if (worldId) {
      return t('pages.locations.worldSubtitle');
    }
    return t('pages.locations.subtitle');
  };

  // Handle back to world navigation
  const handleBackToWorld = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}`);
    }
  };

  return (
    <EntityListPage<Location>
      config={configWithCustomBadge}
      worldId={worldId}
      entityService={locationService}
      title={renderTitle()}
      subtitle={renderSubtitle()}
      showBackButton={!!worldId}
      backButtonLabel={t('pages.worlds.backToWorld')}
      onBackClick={handleBackToWorld}
    />
  );
}
