import React from 'react';
import { useParams } from 'react-router-dom';
import { UnifiedNoteListPage } from '../notes/UnifiedNoteListPage';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * RPG World Notes Page
 * Displays notes specific to a world using the unified entity list component
 */
export function RPGWorldNotesPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  return <UnifiedNoteListPage />;
}

export default RPGWorldNotesPage;