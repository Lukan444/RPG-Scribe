import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Tabs,
  Group,
  Badge,
  Text,
  Avatar,
  ThemeIcon,
  SimpleGrid,
  Paper,
  Divider,
  Loader,
  Center,
  Button
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconUser,
  IconList,
  IconLayoutGrid,
  IconArticle,
  IconPlus,
  IconSword,
  IconGripVertical,
  IconUsers,
  IconArrowLeft
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { EntityTable } from '../../components/common/EntityTable';
import { EntityCardGrid } from '../../components/common/EntityCardGrid';
import { ArticleCard } from '../../components/common/ArticleCard';
import { DragDropEntityOrganizer } from '../../components/common/DragDropEntityOrganizer';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EntityActionButton } from '../../components/common/EntityActionButton';
import { EntityType } from '../../models/EntityType';
import { CharacterService, Character } from '../../services/character.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { getWorldIdFromParams, getCampaignIdFromParams, buildEntityRoutePath } from '../../utils/routeUtils';
import EntityCountTooltip from '../../components/common/EntityCountTooltip';

export function CharacterListPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('table');
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);
  const [fromPath, setFromPath] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['ui', 'common']);

  // Extract worldFilter, campaignFilter, and fromPath from location state if available
  useEffect(() => {
    if (location.state) {
      const { worldId, worldFilter, campaignId, from } = location.state as {
        worldId?: string,
        worldFilter?: string,
        campaignId?: string,
        from?: string
      };

      // Use worldId if provided, otherwise use worldFilter for backward compatibility
      if (worldId) {
        setWorldFilter(worldId);
      } else if (worldFilter) {
        setWorldFilter(worldFilter);
      }

      // Set campaign filter if provided
      if (campaignId) {
        setCampaignFilter(campaignId);
      }

      // Set from path if provided
      if (from) {
        setFromPath(from);
      }

      // Log the filters for debugging
      if (worldId || worldFilter) {
        console.log(`Filtering characters for world: ${worldId || worldFilter}`);
      }

      if (campaignId) {
        console.log(`Filtering characters for campaign: ${campaignId}`);
      }
    }
  }, [location.state]);

  // Load characters
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use filters if available, otherwise use empty string for global view
        const worldId = worldFilter || '';
        const campaignId = campaignFilter || getCampaignIdFromParams(undefined);

        // Create character service - it will handle empty worldId internally
        const characterService = CharacterService.getInstance(worldId, campaignId);
        const charactersData = await characterService.listEntities();

        // Log the results for debugging
        console.log(`Loaded ${charactersData.length} characters for world: ${worldId}, campaign: ${campaignId}`);

        setCharacters(charactersData);
      } catch (err) {
        console.error('Error loading characters:', err);
        setError(t('pages.characters.errorLoadingCharacters'));
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, [worldFilter, campaignFilter]);

  // Handle view character
  const handleViewCharacter = (character: Character) => {
    if (!character.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      // If we have a campaignFilter, include it in the state
      const state = campaignFilter ? { campaignId: campaignFilter } : undefined;
      navigate(buildEntityRoutePath(worldFilter, 'characters', character.id), { state });
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/characters/${character.id}`);
    }
  };

  // Handle edit character
  const handleEditCharacter = (character: Character) => {
    if (!character.id) return;

    // If we have a worldFilter, use the world-specific route
    if (worldFilter) {
      // If we have a campaignFilter, include it in the state
      const state = campaignFilter ? { campaignId: campaignFilter } : undefined;
      navigate(buildEntityRoutePath(worldFilter, 'characters', character.id, 'edit'), { state });
    } else {
      // Redirect to the global route for backward compatibility
      navigate(`/characters/${character.id}/edit`);
    }
  };

  // Handle delete character
  const handleDeleteCharacter = (character: Character) => {
    setCharacterToDelete(character);
    openConfirmDelete();
  };

  // Confirm delete character
  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;

    try {
      setLoading(true);

      // Use filters if available, otherwise use empty string for global view
      const worldId = worldFilter || '';
      const campaignId = campaignFilter || getCampaignIdFromParams(undefined);

      const characterService = CharacterService.getInstance(worldId, campaignId);
      await characterService.deleteEntity(characterToDelete.id!);

      // Remove from state
      setCharacters(prev => prev.filter(c => c.id !== characterToDelete.id));
      closeConfirmDelete();
    } catch (err) {
      console.error('Error deleting character:', err);
      setError('Failed to delete character. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle save order
  const handleSaveOrder = (orderedCharacters: Character[]) => {
    setCharacters(orderedCharacters);
    // In a real implementation, we would save the order to the database
  };

  // Render character badge
  const renderCharacterBadge = (character: Character) => (
    <Group gap={5}>
      <Badge color={character.type === 'PC' ? 'blue' : 'gray'}>
        {character.type}
      </Badge>
      {character.level && (
        <Badge color="cyan">
          Lvl {character.level}
        </Badge>
      )}
    </Group>
  );

  // Filter options
  const filterOptions = [
    { value: 'PC', label: 'Player Characters' },
    { value: 'NPC', label: 'Non-Player Characters' },
    { value: 'alive', label: 'Alive' },
    { value: 'dead', label: 'Dead' },
    { value: 'unknown', label: 'Unknown Status' }
  ];

  // Table columns
  const columns = [
    {
      key: 'name',
      title: t('tables.headers.name'),
      sortable: true,
      render: (character: Character) => (
        <Group gap="sm">
          <Avatar
            src={character.imageURL}
            radius="xl"
            size="sm"
            alt={character.name}
          />
          <Text fw={500}>{character.name}</Text>
        </Group>
      )
    },
    {
      key: 'race',
      title: t('tables.headers.race'),
      sortable: true
    },
    {
      key: 'class',
      title: t('tables.headers.class'),
      sortable: true
    },
    {
      key: 'level',
      title: t('tables.headers.level'),
      sortable: true
    },
    {
      key: 'type',
      title: t('tables.headers.type'),
      sortable: true,
      render: (character: Character) => (
        <Badge
          color={character.type === 'PC' ? 'blue' : 'gray'}
        >
          {character.type}
        </Badge>
      )
    },
    {
      key: 'updatedAt',
      title: t('tables.headers.lastUpdated'),
      sortable: true,
      render: (character: Character) => (
        <Text size="sm">
          {character.updatedAt ? new Date(character.updatedAt).toLocaleDateString() : t('tooltips.invalidDate')}
        </Text>
      )
    }
  ];

  // Render character item for drag and drop
  const renderCharacterItem = (character: Character) => (
    <Group wrap="nowrap">
      <Avatar
        src={character.imageURL}
        radius="xl"
        size="md"
        alt={character.name}
      />
      <div>
        <Group gap={5}>
          <Text fw={500}>{character.name}</Text>
          <Badge size="xs" color={character.type === 'PC' ? 'blue' : 'gray'}>
            {character.type}
          </Badge>
        </Group>
        <Group gap={5}>
          <Text size="xs" c="dimmed">{character.race}</Text>
          <Text size="xs" c="dimmed">•</Text>
          <Text size="xs" c="dimmed">{character.class}</Text>
          {character.level && (
            <>
              <Text size="xs" c="dimmed">•</Text>
              <Text size="xs" c="dimmed">Level {character.level}</Text>
            </>
          )}
        </Group>
      </div>
    </Group>
  );

  // If loading
  if (loading && characters.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && characters.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            {fromPath && (
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate(fromPath)}
              >
                {t('pages.characters.backToCharacters')}
              </Button>
            )}
            <Title order={1}>
              {worldFilter ? t('pages.characters.worldCharacters') : t('pages.characters.title')}
              {worldFilter && <Badge ml="xs" color="blue">Filtered by World</Badge>}
            </Title>
          </Group>

          <Group>
            <EntityActionButton
              entityType={EntityType.CHARACTER}
              primaryAction={{
                label: 'Create Character',
                icon: <IconPlus size={16} />,
                onClick: () => {
                  if (worldFilter) {
                    navigate(buildEntityRoutePath(worldFilter, 'characters', undefined, 'new'));
                  } else {
                    navigate('/characters/new');
                  }
                }
              }}
              actions={[
                {
                  label: 'Import Characters',
                  icon: <IconUser size={16} />,
                  onClick: () => console.log('Import characters')
                }
              ]}
              groupedActions={[
                {
                  title: 'Generate',
                  actions: [
                    {
                      label: 'Generate NPC',
                      icon: <IconUser size={16} />,
                      onClick: () => console.log('Generate NPC')
                    },
                    {
                      label: 'Generate Party',
                      icon: <IconUsers size={16} />,
                      onClick: () => console.log('Generate party')
                    }
                  ]
                }
              ]}
            />
          </Group>
        </Group>

        <Divider mb="md" />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="table" leftSection={<IconList size={16} />}>
              {t('viewModes.table')}
            </Tabs.Tab>
            <Tabs.Tab value="grid" leftSection={<IconLayoutGrid size={16} />}>
              {t('viewModes.grid')}
            </Tabs.Tab>
            <Tabs.Tab value="article" leftSection={<IconArticle size={16} />}>
              {t('viewModes.article')}
            </Tabs.Tab>
            <Tabs.Tab value="organize" leftSection={<IconGripVertical size={16} />}>
              {t('viewModes.organize')}
            </Tabs.Tab>
          </Tabs.List>

          <div style={{ marginTop: '1rem' }}>
            {activeTab === 'table' && (
              <EntityTable
                data={characters}
                columns={columns}
                entityType={EntityType.CHARACTER}
                onView={handleViewCharacter}
                onEdit={handleEditCharacter}
                onDelete={handleDeleteCharacter}
                filterOptions={filterOptions}
              />
            )}

            {activeTab === 'grid' && (
              <EntityCardGrid
                data={characters}
                entityType={EntityType.CHARACTER}
                onView={handleViewCharacter}
                onEdit={handleEditCharacter}
                onDelete={handleDeleteCharacter}
                filterOptions={filterOptions}
                renderBadge={renderCharacterBadge}
              />
            )}

            {activeTab === 'article' && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {characters.map(character => (
                  <ArticleCard
                    key={character.id}
                    id={character.id!}
                    image={character.imageURL}
                    title={character.name || 'Unnamed Character'}
                    description={character.description || ''}
                    entityType={EntityType.CHARACTER}
                    category={`${character.race} ${character.class}`}
                    date={character.level ? `Level ${character.level}` : undefined}
                    onView={() => handleViewCharacter(character)}
                    onEdit={() => handleEditCharacter(character)}
                    onDelete={() => handleDeleteCharacter(character)}
                  />
                ))}
              </SimpleGrid>
            )}

            {activeTab === 'organize' && (
              <DragDropEntityOrganizer
                data={characters}
                entityType={EntityType.CHARACTER}
                onSaveOrder={handleSaveOrder}
                onView={handleViewCharacter}
                onEdit={handleEditCharacter}
                onDelete={handleDeleteCharacter}
                renderItem={renderCharacterItem}
              />
            )}
          </div>
        </Tabs>
      </Paper>

      {/* Character Stats */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="blue">
              <IconUser size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">{t('tooltips.playerCharacters')}</Text>
              {/* Add tooltip to PC count */}
              <EntityCountTooltip
                entityType={EntityType.CHARACTER}
                count={characters.filter(c => c.characterType === 'PC' || c.isPlayerCharacter).length}
                typeBreakdown={[]}
                lastUpdated={characters.length > 0
                  ? new Date(Math.max(...characters
                      .filter((c: any) => c.characterType === 'PC' || c.isPlayerCharacter)
                      .map((c: any) => c.updatedAt ? new Date(c.updatedAt).getTime() : 0)))
                  : null}
                relationshipCount={0}
                recentEntities={characters
                  .filter(c => c && (c.characterType === 'PC' || c.isPlayerCharacter))
                  .sort((a: any, b: any) => {
                    try {
                      const aDate = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const bDate = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return bDate - aDate;
                    } catch (error) {
                      console.error('Error sorting characters:', error);
                      return 0;
                    }
                  })
                  .slice(0, 3)
                  .map((c: any) => {
                    try {
                      return {
                        id: c && c.id ? c.id : '',
                        name: c && c.name ? c.name : 'Unnamed Character',
                        createdAt: c && c.createdAt ? new Date(c.createdAt) : new Date(),
                        type: 'PC'
                      };
                    } catch (error) {
                      console.error('Error mapping character:', error);
                      return {
                        id: '',
                        name: 'Error Character',
                        createdAt: new Date(),
                        type: 'PC'
                      };
                    }
                  })}
                color="blue"
                position="top"
              >
                <Text fw={700} size="xl" style={{ cursor: 'help' }}>
                  {characters.filter((c: any) => c.characterType === 'PC' || c.isPlayerCharacter).length}
                </Text>
              </EntityCountTooltip>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="gray">
              <IconUser size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">{t('tooltips.nonPlayerCharacters')}</Text>
              {/* Add tooltip to NPC count */}
              <EntityCountTooltip
                entityType={EntityType.CHARACTER}
                count={characters.filter(c => c.characterType === 'NPC' || !c.isPlayerCharacter).length}
                typeBreakdown={[]}
                lastUpdated={characters.length > 0
                  ? new Date(Math.max(...characters
                      .filter((c: any) => c.characterType === 'NPC' || !c.isPlayerCharacter)
                      .map((c: any) => c.updatedAt ? new Date(c.updatedAt).getTime() : 0)))
                  : null}
                relationshipCount={0}
                recentEntities={characters
                  .filter(c => c && (c.characterType === 'NPC' || !c.isPlayerCharacter))
                  .sort((a: any, b: any) => {
                    try {
                      const aDate = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const bDate = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return bDate - aDate;
                    } catch (error) {
                      console.error('Error sorting NPC characters:', error);
                      return 0;
                    }
                  })
                  .slice(0, 3)
                  .map((c: any) => {
                    try {
                      return {
                        id: c && c.id ? c.id : '',
                        name: c && c.name ? c.name : 'Unnamed Character',
                        createdAt: c && c.createdAt ? new Date(c.createdAt) : new Date(),
                        type: 'NPC'
                      };
                    } catch (error) {
                      console.error('Error mapping NPC character:', error);
                      return {
                        id: '',
                        name: 'Error Character',
                        createdAt: new Date(),
                        type: 'NPC'
                      };
                    }
                  })}
                color="gray"
                position="top"
              >
                <Text fw={700} size="xl" style={{ cursor: 'help' }}>
                  {characters.filter((c: any) => c.characterType === 'NPC' || !c.isPlayerCharacter).length}
                </Text>
              </EntityCountTooltip>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="teal">
              <IconSword size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs">{t('ui:tooltips.totalCharacters', { count: characters.length })}</Text>
              {/* Add tooltip to total count */}
              <EntityCountTooltip
                entityType={EntityType.CHARACTER}
                count={characters.length}
                typeBreakdown={[
                  {
                    type: 'PC',
                    count: characters.filter((c: any) => c.characterType === 'PC' || c.isPlayerCharacter).length,
                    label: t('tooltips.playerCharacters')
                  },
                  {
                    type: 'NPC',
                    count: characters.filter((c: any) => c.characterType === 'NPC' || !c.isPlayerCharacter).length,
                    label: t('tooltips.nonPlayerCharacters')
                  }
                ]}
                lastUpdated={characters.length > 0
                  ? new Date(Math.max(...characters.map((c: any) => c.updatedAt ? new Date(c.updatedAt).getTime() : 0)))
                  : null}
                relationshipCount={0}
                recentEntities={characters
                  .filter(c => c) // Filter out any null/undefined characters
                  .sort((a: any, b: any) => {
                    try {
                      const aDate = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const bDate = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return bDate - aDate;
                    } catch (error) {
                      console.error('Error sorting all characters:', error);
                      return 0;
                    }
                  })
                  .slice(0, 3)
                  .map((c: any) => {
                    try {
                      return {
                        id: c && c.id ? c.id : '',
                        name: c && c.name ? c.name : 'Unnamed Character',
                        createdAt: c && c.createdAt ? new Date(c.createdAt) : new Date(),
                        type: c && c.characterType ? c.characterType :
                              c && c.isPlayerCharacter ? 'PC' : 'NPC'
                      };
                    } catch (error) {
                      console.error('Error mapping total character:', error);
                      return {
                        id: '',
                        name: 'Error Character',
                        createdAt: new Date(),
                        type: 'Unknown'
                      };
                    }
                  })}
                color="teal"
                position="top"
              >
                <Text fw={700} size="xl" style={{ cursor: 'help' }}>{characters.length}</Text>
              </EntityCountTooltip>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Character"
        message={`Are you sure you want to delete ${characterToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteCharacter}
      />
    </Container>
  );
}

export default CharacterListPage;
