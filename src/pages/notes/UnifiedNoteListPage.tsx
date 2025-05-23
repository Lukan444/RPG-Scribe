import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Group, Text, rem } from '@mantine/core';
import { IconNote } from '@tabler/icons-react';
import { EntityListPage } from '../../components/entity-list/EntityListPage';
import { EntityListConfigFactory } from '../../components/entity-list/factories/EntityListConfigFactory';
import { NoteServiceAdapter } from '../../services/adapters/NoteServiceAdapter';
import { Note, NoteType } from '../../models/Note';
import { EntityType } from '../../models/EntityType';
import { getWorldIdFromParams, getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * Unified Note List Page
 * Displays a list of notes using the unified entity list component
 */
export function UnifiedNoteListPage() {
  // Get params
  const params = useParams();
  const worldId = getWorldIdFromParams(params);
  const campaignId = getCampaignIdFromParams(params);

  // Get note service
  const noteService = new NoteServiceAdapter(
    worldId || '',
    campaignId || 'default-campaign'
  );

  // Get entity list config
  const config = EntityListConfigFactory.createConfig<Note>(EntityType.NOTE);

  // Override the icon and renderBadge function to provide a custom badge
  const configWithCustomBadge = {
    ...config,
    icon: <IconNote size={rem(20)} />,
    renderBadge: (note: Note) => {
      const getNoteTypeColor = () => {
        switch (note.noteType) {
          case NoteType.GENERAL:
            return 'blue';
          case NoteType.LORE:
            return 'green';
          case NoteType.QUEST:
            return 'orange';
          case NoteType.PLAYER:
            return 'violet';
          case NoteType.DM:
            return 'red';
          case NoteType.SESSION:
            return 'cyan';
          default:
            return 'gray';
        }
      };

      const getPrivacyColor = () => {
        return note.isPrivate ? 'red' : 'green';
      };

      return (
        <Group gap="xs">
          <Badge color={getNoteTypeColor()} size="sm">
            {formatNoteType(note.noteType)}
          </Badge>
          <Badge color={getPrivacyColor()} size="sm">
            {note.isPrivate ? 'Private' : 'Public'}
          </Badge>
          {note.relatedEntityType && (
            <Badge color="blue" size="sm">
              Related: {note.relatedEntityType}
            </Badge>
          )}
        </Group>
      );
    },
    columns: [
      { key: 'title', title: 'Title', sortable: true },
      { key: 'noteType', title: 'Type', sortable: true },
      { key: 'isPrivate', title: 'Privacy', sortable: true },
      { key: 'updatedAt', title: 'Last Updated', sortable: true },
      { key: 'createdBy', title: 'Author', sortable: true }
    ],
    filterOptions: [
      {
        key: 'noteType',
        label: 'Type',
        options: [
          { value: NoteType.GENERAL, label: 'General' },
          { value: NoteType.LORE, label: 'Lore' },
          { value: NoteType.QUEST, label: 'Quest' },
          { value: NoteType.PLAYER, label: 'Player' },
          { value: NoteType.DM, label: 'DM' },
          { value: NoteType.SESSION, label: 'Session' }
        ]
      },
      {
        key: 'isPrivate',
        label: 'Privacy',
        options: [
          { value: 'true', label: 'Private' },
          { value: 'false', label: 'Public' }
        ]
      }
    ],
    sortOptions: [
      { key: 'title', label: 'Title', direction: 'asc' as 'asc', default: true },
      { key: 'noteType', label: 'Type', direction: 'asc' as 'asc' },
      { key: 'createdAt', label: 'Date Created', direction: 'desc' as 'desc' },
      { key: 'updatedAt', label: 'Date Updated', direction: 'desc' as 'desc' }
    ],
    emptyStateMessage: 'No notes found',
    emptyStateActionText: 'Create New Note'
  };

  return (
    <EntityListPage
      config={configWithCustomBadge}
      entityService={noteService}
      worldId={worldId}
      campaignId={campaignId}
      title={worldId ? 'World Notes' : 'All Notes'}
      showBackButton={!!worldId}
      backButtonLabel="Back to World"
    />
  );
}

/**
 * Format note type for display
 * @param type Note type
 * @returns Formatted note type
 */
function formatNoteType(type: NoteType): string {
  switch (type) {
    case NoteType.GENERAL:
      return 'General';
    case NoteType.LORE:
      return 'Lore';
    case NoteType.QUEST:
      return 'Quest';
    case NoteType.PLAYER:
      return 'Player';
    case NoteType.DM:
      return 'DM';
    case NoteType.SESSION:
      return 'Session';
    default:
      if (typeof type === 'string') {
        const typeStr = type as string;
        return typeStr.replace('_', ' ');
      }
      return 'Unknown';
  }
}

export default UnifiedNoteListPage;
