import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Item } from '../../models/Item';
import { EntityType } from '../../models/EntityType';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { ItemServiceAdapter } from '../../services/adapters/ItemServiceAdapter';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * Unified Item List Page
 * Displays a list of items using the unified entity list component
 */
export function UnifiedItemListPage() {
  // Get params and navigation
  const params = useParams();
  const navigate = useNavigate();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);
  const { t } = useTranslation(['ui', 'common']);

  // Get item service
  const itemService = new ItemServiceAdapter(
    worldId || '',
    campaignId || 'default-campaign'
  );

  // Get entity list config
  const config = EntityListConfigFactory.createConfig<Item>(EntityType.ITEM);

  // Handle back to world navigation
  const handleBackToWorld = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}`);
    }
  };

  return (
    <EntityListPage
      config={config}
      entityService={itemService}
      worldId={worldId}
      campaignId={campaignId}
      title={worldId ? 'World Items' : 'All Items'}
      showBackButton={!!worldId}
      backButtonLabel="Back to World"
      onBackClick={handleBackToWorld}
    />
  );
}

export default UnifiedItemListPage;
