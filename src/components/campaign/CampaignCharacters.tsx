import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Tabs,
  Stack,
  SegmentedControl,
  rem,
  Center,
  ThemeIcon,
  Loader
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { keyframes } from '@emotion/react';
import {
  IconPlus,
  IconUsers,
  IconLayoutGrid,
  IconTable,
  IconArticle,
  IconUser
} from '@tabler/icons-react';
import { EntityCardGrid } from '../common/EntityCardGrid';
import { EntityTable } from '../common/EntityTable';
import { EntityRelationshipsService } from '../../services/entityRelationships.service';
import { EntityType } from '../../models/EntityType';
import { CharacterType } from '../../models/Character';
import { Badge } from '@mantine/core';
import { RelationshipCounter } from '../relationships/RelationshipCounter';

// Define the keyframes for the pulsing animation
const pulseAnimation = keyframes({
  '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
  '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' },
});

// Character interface (simplified)
interface Character {
  id: string;
  name: string;
  characterType: string;
  isPlayerCharacter: boolean;
  race?: string;
  class?: string;
  level?: number;
  imageURL?: string;
  description?: string;
  updatedAt?: Date;
}

interface CampaignCharactersProps {
  campaignId: string;
  worldId?: string;
  characters?: Character[];
  loading?: boolean;
  error?: string | null;
  onCreateCharacter?: () => void;
  onViewCharacter?: (characterId: string) => void;
  onEditCharacter?: (characterId: string) => void;
  onDeleteCharacter?: (characterId: string) => void;
}

/**
 * CampaignCharacters component - Enhanced character management for campaigns
 */
export function CampaignCharacters({
  campaignId,
  worldId,
  characters = [],
  loading = false,
  error = null,
  onCreateCharacter,
  onViewCharacter,
  onEditCharacter,
  onDeleteCharacter
}: CampaignCharactersProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<string>('grid');
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [charactersWithRelationships, setCharactersWithRelationships] = useState<Array<Character & { relationshipCount?: number }>>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  // Load relationship counts for characters
  useEffect(() => {
    const loadRelationshipCounts = async () => {
      if (characters.length === 0) return;

      setLoadingRelationships(true);
      try {
        const relationshipService = new EntityRelationshipsService(campaignId, worldId || '');

        const withRelationships = await Promise.all(
          characters.map(async (character) => {
            try {
              const relationships = await relationshipService.getEntityRelationships(
                character.id,
                EntityType.CHARACTER
              );
              return {
                ...character,
                relationshipCount: relationships.length
              };
            } catch (error) {
              console.error(`Error loading relationships for character ${character.id}:`, error);
              return {
                ...character,
                relationshipCount: 0
              };
            }
          })
        );

        setCharactersWithRelationships(withRelationships);
      } catch (error) {
        console.error('Error loading relationship counts:', error);
        setCharactersWithRelationships(characters.map(character => ({
          ...character,
          relationshipCount: 0
        })));
      } finally {
        setLoadingRelationships(false);
      }
    };

    loadRelationshipCounts();
  }, [characters, campaignId, worldId]);

  // Filter characters based on active tab
  const filteredCharacters = charactersWithRelationships.filter(character => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pc') return character.isPlayerCharacter;
    if (activeTab === 'npc') return !character.isPlayerCharacter;
    return true;
  });

  // Handle create character
  const handleCreateCharacter = () => {
    if (onCreateCharacter) {
      onCreateCharacter();
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/new`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/new`);
    }
  };

  // Handle view character
  const handleViewCharacter = (characterId: string) => {
    if (onViewCharacter) {
      onViewCharacter(characterId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/${characterId}`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/${characterId}`);
    }
  };

  // Handle edit character
  const handleEditCharacter = (characterId: string) => {
    if (onEditCharacter) {
      onEditCharacter(characterId);
    } else if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/characters/${characterId}/edit`);
    } else {
      navigate(`/campaigns/${campaignId}/characters/${characterId}/edit`);
    }
  };

  // Handle delete character
  const handleDeleteCharacter = (characterId: string) => {
    if (onDeleteCharacter) {
      onDeleteCharacter(characterId);
    } else {
      // Find the character by ID
      const character = characters.find(c => c.id === characterId);

      if (character) {
        // Show confirmation dialog
        modals.openConfirmModal({
          title: 'Delete Character',
          children: (
            <Text size="sm">
              Are you sure you want to delete {character.name}? This action cannot be undone.
            </Text>
          ),
          labels: { confirm: 'Delete', cancel: 'Cancel' },
          confirmProps: { color: 'red' },
          onConfirm: () => {
            // Delete character
            // This would call the API to delete the character
            console.log('Delete character:', characterId);
          },
        });
      }
    }
  };

  // Render character badge
  const renderCharacterBadge = (character: Character & { relationshipCount?: number }) => (
    <Group gap="xs">
      <Badge color={character.isPlayerCharacter ? 'blue' : 'gray'}>
        {character.isPlayerCharacter ? 'PC' : 'NPC'}
      </Badge>
      <RelationshipCounter
        entityId={character.id}
        entityType={EntityType.CHARACTER}
        count={character.relationshipCount}
        worldId={worldId}
        campaignId={campaignId}
        size="xs"
      />
    </Group>
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (character: Character) => (
        <Group gap="sm">
          <Text fw={500}>{character.name}</Text>
        </Group>
      )
    },
    {
      key: 'characterType',
      title: 'Type',
      sortable: true,
      render: (character: Character) => (
        <Badge color={character.isPlayerCharacter ? 'blue' : 'gray'}>
          {character.isPlayerCharacter ? 'PC' : 'NPC'}
        </Badge>
      )
    },
    {
      key: 'relationships',
      title: 'Relationships',
      sortable: false,
      render: (character: Character & { relationshipCount?: number }) => (
        <RelationshipCounter
          entityId={character.id}
          entityType={EntityType.CHARACTER}
          count={character.relationshipCount}
          worldId={worldId}
          campaignId={campaignId}
          size="sm"
        />
      )
    },
    {
      key: 'race',
      title: 'Race',
      sortable: true
    },
    {
      key: 'class',
      title: 'Class',
      sortable: true
    },
    {
      key: 'level',
      title: 'Level',
      sortable: true
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (character: Character) => (
        <Text size="sm">
          {character.updatedAt ? character.updatedAt.toLocaleDateString() : 'N/A'}
        </Text>
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'characterType',
      label: 'Character Type',
      options: [
        { value: 'Humanoid', label: 'Humanoid' },
        { value: 'Beast', label: 'Beast' },
        { value: 'Monster', label: 'Monster' },
        { value: 'Deity', label: 'Deity' },
        { value: 'Undead', label: 'Undead' }
      ]
    },
    {
      key: 'race',
      label: 'Race',
      options: [
        { value: 'Human', label: 'Human' },
        { value: 'Elf', label: 'Elf' },
        { value: 'Dwarf', label: 'Dwarf' },
        { value: 'Halfling', label: 'Halfling' },
        { value: 'Orc', label: 'Orc' }
      ]
    },
    {
      key: 'class',
      label: 'Class',
      options: [
        { value: 'Fighter', label: 'Fighter' },
        { value: 'Wizard', label: 'Wizard' },
        { value: 'Rogue', label: 'Rogue' },
        { value: 'Cleric', label: 'Cleric' },
        { value: 'Ranger', label: 'Ranger' }
      ]
    }
  ];

  // Render empty state
  const renderEmptyState = () => (
    <Center py={50}>
      <Stack align="center" gap="md">
        <ThemeIcon size={60} radius={30} color="gray.3">
          <IconUser style={{ width: '30px', height: '30px', color: 'var(--mantine-color-gray-6)' }} />
        </ThemeIcon>
        <Title order={3}>No Characters</Title>
        <Text c="dimmed">Create your first character to populate your campaign</Text>
        <Button
          leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
          onClick={handleCreateCharacter}
          style={{
            animation: `${pulseAnimation} 2s infinite`,
            transition: 'all 0.3s ease',
            '&:hover': {
              animation: 'none',
              transform: 'scale(1.05)'
            }
          }}
        >
          Create Character
        </Button>
      </Stack>
    </Center>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Characters</Title>
        <Group>
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            data={[
              {
                value: 'grid',
                label: (
                  <Group gap={5}>
                    <IconLayoutGrid size={16} />
                    <Box>Grid</Box>
                  </Group>
                ),
              },
              {
                value: 'table',
                label: (
                  <Group gap={5}>
                    <IconTable size={16} />
                    <Box>Table</Box>
                  </Group>
                ),
              },
              {
                value: 'article',
                label: (
                  <Group gap={5}>
                    <IconArticle size={16} />
                    <Box>Article</Box>
                  </Group>
                ),
              },
            ]}
          />
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateCharacter}
          >
            Create Character
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="all">All Characters</Tabs.Tab>
          <Tabs.Tab value="pc">Player Characters</Tabs.Tab>
          <Tabs.Tab value="npc">Non-Player Characters</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {loading || loadingRelationships ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading characters...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius={30} color="red.3">
              <IconUser style={{ width: '30px', height: '30px', color: 'var(--mantine-color-red-6)' }} />
            </ThemeIcon>
            <Title order={3}>Error Loading Characters</Title>
            <Text c="dimmed">{error}</Text>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Stack>
        </Center>
      ) : filteredCharacters.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {viewMode === 'grid' && (
            <EntityCardGrid
              data={filteredCharacters}
              entityType={EntityType.CHARACTER}
              loading={loading || loadingRelationships}
              error={error || null}
              onView={handleViewCharacter}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteCharacter}
              renderBadge={renderCharacterBadge}
              filterOptions={filterOptions}
            />
          )}

          {viewMode === 'table' && (
            <EntityTable
              data={filteredCharacters}
              columns={columns}
              entityType={EntityType.CHARACTER}
              loading={loading || loadingRelationships}
              error={error || null}
              onView={handleViewCharacter}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteCharacter}
              filterOptions={filterOptions}
            />
          )}

          {viewMode === 'article' && (
            <Box>
              <Text c="dimmed">Article view will be implemented in the next phase.</Text>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}

export default CampaignCharacters;
