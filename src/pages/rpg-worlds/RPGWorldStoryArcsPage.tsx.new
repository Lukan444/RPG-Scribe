import React from 'react';
import { useParams } from 'react-router-dom';
import { UnifiedStoryArcListPage } from '../story-arcs/UnifiedStoryArcListPage';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * RPG World Story Arcs Page
 * Displays story arcs specific to a world using the unified entity list component
 */
export function RPGWorldStoryArcsPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  return <UnifiedStoryArcListPage />;
}

export default RPGWorldStoryArcsPage;