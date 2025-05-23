import React from 'react';
import { useParams } from 'react-router-dom';
import { UnifiedSessionListPage } from '../sessions/UnifiedSessionListPage';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * RPG World Sessions Page
 * Displays sessions specific to a world using the unified entity list component
 */
export function RPGWorldSessionsPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  return <UnifiedSessionListPage />;
}

export default RPGWorldSessionsPage;
