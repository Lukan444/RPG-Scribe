import React from 'react';
import { useParams } from 'react-router-dom';
import { UnifiedFactionListPage } from '../factions/UnifiedFactionListPage';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * RPG World Factions Page
 * Displays factions specific to a world using the unified entity list component
 */
export function RPGWorldFactionsPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  return <UnifiedFactionListPage />;
}

export default RPGWorldFactionsPage;
