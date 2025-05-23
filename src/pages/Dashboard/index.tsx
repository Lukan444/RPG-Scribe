import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SimpleGrid,
  Stack,
  Tabs,
  Paper,
  Group,
  ThemeIcon,
  Text,
  Flex,
  Loader,
  Center
} from '@mantine/core';
import {
  IconUsers,
  IconMap,
  IconCalendarEvent,
  IconSword,
  IconWorld,
  IconBookmark,
  IconUsersGroup,
  IconMapPin,
  IconTimeline,
  IconNotebook
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import RelationshipCountBadge from '../../components/relationships/badges/RelationshipCountBadge';
import EntityCountTooltip from '../../components/common/EntityCountTooltip';
import { useRPGWorld } from '../../contexts/RPGWorldContext';

import { auth } from '../../firebase/config';
import { CharacterService } from '../../services/character.service';
import { FactionService } from '../../services/faction.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { EventService } from '../../services/event.service';
import { SessionService } from '../../services/session.service';
import { StoryArcService } from '../../services/storyArc.service';
import { NoteService } from '../../services/note.service';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { CampaignService } from '../../services/campaign.service';

/**
 * Helper function to safely get the last updated date from an array of entities
 */
function getLastUpdatedDate(entities: any[]): Date | null {
  if (entities.length === 0) return null;

  try {
    const timestamps = entities
      .map((entity: any) => entity.updatedAt ? new Date(entity.updatedAt).getTime() : 0)
      .filter((timestamp: number) => timestamp > 0 && !isNaN(timestamp));

    if (timestamps.length === 0) return null;

    const maxTimestamp = Math.max(...timestamps);
    return maxTimestamp > 0 ? new Date(maxTimestamp) : null;
  } catch (error) {
    console.error('Error calculating last updated date:', error);
    return null;
  }
}

/**
 * StatCard component that displays entity counts and relationship badges
 */
function StatCard({
  title,
  value,
  icon,
  color,
  entityType,
  onClick,
  typeBreakdown = [],
  lastUpdated,
  relationshipCount = 0,
  recentEntities = []
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  entityType?: EntityType;
  onClick?: () => void;
  typeBreakdown?: Array<{ type: string; count: number; label: string }>;
  lastUpdated?: Date | null;
  relationshipCount?: number;
  recentEntities?: Array<{ id: string; name: string; createdAt: Date; type?: string }>;
}) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Parse the value to a number for the tooltip
  const countValue = parseInt(value) || 0;

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%'
      }}
      onClick={handleClick}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group>
            <ThemeIcon size="lg" color={color} variant="light" radius="md">
              {icon}
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">{title}</Text>
              {/* Wrap the count value in the tooltip */}
              {entityType ? (
                <EntityCountTooltip
                  entityType={entityType}
                  count={countValue}
                  typeBreakdown={typeBreakdown}
                  lastUpdated={lastUpdated}
                  recentEntities={recentEntities}
                  color={color}
                  position="top"
                >
                  <Text fw={700} size="xl" style={{ cursor: 'help' }}>{value}</Text>
                </EntityCountTooltip>
              ) : (
                <Text fw={700} size="xl">{value}</Text>
              )}
            </div>
          </Group>
          {entityType && (
            <RelationshipCountBadge
              entityId="dashboard"
              entityType={entityType}
              count={countValue}
              variant="light"
              size="md"
              interactive={false}
              tooltipPosition="left"
            />
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorld, currentCampaign } = useRPGWorld();
  const { t } = useTranslation(['ui', 'common']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Entity stats with additional metadata
  interface EntityStats {
    count: number;
    lastUpdated: Date | null;
    relationshipCount: number;
    typeBreakdown: Array<{ type: string; count: number; label: string }>;
    recentEntities: Array<{ id: string; name: string; createdAt: Date; type?: string }>;
  }

  // Total stats for entity counts
  const initialEntityStats: EntityStats = {
    count: 0,
    lastUpdated: null,
    relationshipCount: 0,
    typeBreakdown: [],
    recentEntities: []
  };

  const [totalStats, setTotalStats] = useState({
    characters: { ...initialEntityStats },
    factions: { ...initialEntityStats },
    locations: { ...initialEntityStats },
    items: { ...initialEntityStats },
    events: { ...initialEntityStats },
    sessions: { ...initialEntityStats },
    storyArcs: { ...initialEntityStats },
    notes: { ...initialEntityStats },
    campaigns: { ...initialEntityStats },
    worlds: { ...initialEntityStats }
  });

  // Fetch entity counts from Firestore
  useEffect(() => {
    const fetchEntityCounts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get worldId and campaignId from context or use defaults
        const worldId = currentWorld?.id || '';
        const campaignId = currentCampaign?.id || '';

        // Create service instances for each entity type
        const characterService = CharacterService.getInstance(worldId, campaignId);
        const factionService = FactionService.getInstance(worldId, campaignId);
        const locationService = LocationService.getInstance(worldId, campaignId);
        const itemService = ItemService.getInstance(worldId, campaignId);
        const eventService = EventService.getInstance(worldId, campaignId);
        const sessionService = SessionService.getInstance(worldId, campaignId);
        const storyArcService = StoryArcService.getInstance(worldId, campaignId);
        const noteService = NoteService.getInstance(worldId, campaignId);
        const campaignService = new CampaignService();
        const worldService = new RPGWorldService();

        // Fetch entities in parallel
        const [
          characters,
          factions,
          locations,
          items,
          events,
          sessions,
          storyArcs,
          notes,
          campaigns,
          worlds
        ] = await Promise.all([
          characterService.listEntities(),
          factionService.listEntities(),
          locationService.listEntities(),
          itemService.listEntities(),
          eventService.listEntities(),
          sessionService.listEntities(),
          storyArcService.listEntities(),
          noteService.listEntities(),
          campaignService.getCampaignsByUser(auth.currentUser?.uid || ''),
          worldService.getAccessibleWorlds(auth.currentUser?.uid || '')
        ]);

        // Process character data
        const pcCount = characters.filter((c: any) => c.characterType === 'PC' || c.isPlayerCharacter).length;
        const npcCount = characters.filter((c: any) => c.characterType === 'NPC' || !c.isPlayerCharacter).length;

        // Get the last updated date using our helper function
        const characterLastUpdated = getLastUpdatedDate(characters);

        // Get relationship counts
        const characterRelationships = await Promise.all(
          characters.map((c: any) => characterService.getRelationshipCount(c.id!))
        );
        const characterRelationshipCount = characterRelationships.reduce((sum: number, count: number) => sum + count, 0);

        // Get recently added characters (sorted by creation date)
        const recentCharacters = [...characters]
          .filter(c => c) // Filter out any null/undefined characters
          .sort((a: any, b: any) => {
            try {
              const aDate = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bDate = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bDate - aDate; // Descending order (newest first)
            } catch (error) {
              console.error('Error sorting characters in dashboard:', error);
              return 0;
            }
          })
          .slice(0, 5) // Get top 5 most recent
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
              console.error('Error mapping character in dashboard:', error);
              return {
                id: '',
                name: 'Error Character',
                createdAt: new Date(),
                type: 'Unknown'
              };
            }
          });

        // Update state with actual counts and metadata
        setTotalStats({
          characters: {
            count: characters.length,
            lastUpdated: characterLastUpdated,
            relationshipCount: characterRelationshipCount,
            typeBreakdown: [
              { type: 'PC', count: pcCount, label: 'Player Characters' },
              { type: 'NPC', count: npcCount, label: 'Non-Player Characters' }
            ],
            recentEntities: recentCharacters
          },
          factions: {
            count: factions.length,
            lastUpdated: getLastUpdatedDate(factions),
            relationshipCount: 0, // We'll implement this later
            typeBreakdown: [],
            recentEntities: [...factions]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((f: any) => ({
                id: f.id || '',
                name: f.name || 'Unnamed Faction',
                createdAt: f.createdAt ? new Date(f.createdAt) : new Date()
              }))
          },
          locations: {
            count: locations.length,
            lastUpdated: getLastUpdatedDate(locations),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...locations]
              .filter(l => l) // Filter out any null/undefined locations
              .sort((a: any, b: any) => {
                try {
                  const aDate = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const bDate = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return bDate - aDate;
                } catch (error) {
                  console.error('Error sorting locations in dashboard:', error);
                  return 0;
                }
              })
              .slice(0, 5)
              .map((l: any) => {
                try {
                  return {
                    id: l && l.id ? l.id : '',
                    name: l && l.name ? l.name : 'Unnamed Location',
                    createdAt: l && l.createdAt ? new Date(l.createdAt) : new Date()
                  };
                } catch (error) {
                  console.error('Error mapping location in dashboard:', error);
                  return {
                    id: '',
                    name: 'Error Location',
                    createdAt: new Date()
                  };
                }
              })
          },
          items: {
            count: items.length,
            lastUpdated: getLastUpdatedDate(items),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...items]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((i: any) => ({
                id: i.id || '',
                name: i.name || 'Unnamed Item',
                createdAt: i.createdAt ? new Date(i.createdAt) : new Date()
              }))
          },
          events: {
            count: events.length,
            lastUpdated: getLastUpdatedDate(events),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...events]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((e: any) => ({
                id: e.id || '',
                name: e.name || 'Unnamed Event',
                createdAt: e.createdAt ? new Date(e.createdAt) : new Date()
              }))
          },
          sessions: {
            count: sessions.length,
            lastUpdated: getLastUpdatedDate(sessions),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...sessions]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((s: any) => ({
                id: s.id || '',
                name: s.name || s.title || 'Unnamed Session',
                createdAt: s.createdAt ? new Date(s.createdAt) : new Date()
              }))
          },
          storyArcs: {
            count: storyArcs.length,
            lastUpdated: getLastUpdatedDate(storyArcs),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...storyArcs]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((s: any) => ({
                id: s.id || '',
                name: s.name || s.title || 'Unnamed Story Arc',
                createdAt: s.createdAt ? new Date(s.createdAt) : new Date()
              }))
          },
          notes: {
            count: notes.length,
            lastUpdated: getLastUpdatedDate(notes),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...notes]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((n: any) => ({
                id: n.id || '',
                name: n.title || n.name || 'Unnamed Note',
                createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
              }))
          },
          campaigns: {
            count: campaigns.length,
            lastUpdated: getLastUpdatedDate(campaigns),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...campaigns]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((c: any) => ({
                id: c.id || '',
                name: c.name || 'Unnamed Campaign',
                createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
              }))
          },
          worlds: {
            count: worlds.length,
            lastUpdated: getLastUpdatedDate(worlds),
            relationshipCount: 0,
            typeBreakdown: [],
            recentEntities: [...worlds]
              .sort((a: any, b: any) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((w: any) => ({
                id: w.id || '',
                name: w.name || 'Unnamed World',
                createdAt: w.createdAt ? new Date(w.createdAt) : new Date()
              }))
          }
        });
      } catch (err) {
        console.error('Error fetching entity counts:', err);
        setError('Failed to load entity counts. Please try again later.');

        // Set fallback mock data in case of error
        const currentDate = new Date(); // Create a single valid date instance
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(currentDate);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Create mock recent entities
        const mockRecentCharacters = [
          { id: 'char1', name: 'Aragorn', createdAt: currentDate, type: 'PC' },
          { id: 'char2', name: 'Gandalf', createdAt: yesterday, type: 'NPC' },
          { id: 'char3', name: 'Legolas', createdAt: twoDaysAgo, type: 'PC' }
        ];

        const mockRecentEntities = [
          { id: 'entity1', name: 'Sample Entity 1', createdAt: currentDate },
          { id: 'entity2', name: 'Sample Entity 2', createdAt: yesterday }
        ];

        setTotalStats({
          characters: {
            count: 4,
            lastUpdated: currentDate,
            relationshipCount: 3,
            typeBreakdown: [
              { type: 'PC', count: 3, label: 'Player Characters' },
              { type: 'NPC', count: 1, label: 'Non-Player Characters' }
            ],
            recentEntities: mockRecentCharacters
          },
          factions: { count: 3, lastUpdated: currentDate, relationshipCount: 2, typeBreakdown: [], recentEntities: mockRecentEntities },
          locations: { count: 3, lastUpdated: currentDate, relationshipCount: 2, typeBreakdown: [], recentEntities: mockRecentEntities },
          items: { count: 4, lastUpdated: currentDate, relationshipCount: 3, typeBreakdown: [], recentEntities: mockRecentEntities },
          events: { count: 3, lastUpdated: currentDate, relationshipCount: 3, typeBreakdown: [], recentEntities: mockRecentEntities },
          sessions: { count: 3, lastUpdated: currentDate, relationshipCount: 2, typeBreakdown: [], recentEntities: mockRecentEntities },
          storyArcs: { count: 2, lastUpdated: currentDate, relationshipCount: 2, typeBreakdown: [], recentEntities: mockRecentEntities },
          notes: { count: 0, lastUpdated: null, relationshipCount: 0, typeBreakdown: [], recentEntities: [] },
          campaigns: { count: 1, lastUpdated: currentDate, relationshipCount: 1, typeBreakdown: [], recentEntities: mockRecentEntities },
          worlds: { count: 1, lastUpdated: currentDate, relationshipCount: 0, typeBreakdown: [], recentEntities: mockRecentEntities }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntityCounts();
  }, [currentWorld, currentCampaign]);

  return (
    <Stack gap="xl">
      {/* Stat Cards Grid - Only keeping the entity selector tabs and entity count tiles */}
      <Tabs defaultValue="all">
        <Tabs.List>
          <Tabs.Tab value="all">{t('dashboard.tabs.all')}</Tabs.Tab>
          <Tabs.Tab value="characters">{t('dashboard.tabs.characters')}</Tabs.Tab>
          <Tabs.Tab value="world">{t('dashboard.tabs.world')}</Tabs.Tab>
          <Tabs.Tab value="narrative">{t('dashboard.tabs.narrative')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="md">
          {loading ? (
            <Center p="xl">
              <Loader size="lg" />
            </Center>
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
                {/* Characters & NPCs Group */}
                <StatCard
                  title={t('dashboard.entities.characters')}
                  value={totalStats.characters.count.toString()}
                  icon={<IconUsers style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="blue"
                  entityType={EntityType.CHARACTER}
                  typeBreakdown={totalStats.characters.typeBreakdown}
                  lastUpdated={totalStats.characters.lastUpdated}
                  relationshipCount={totalStats.characters.relationshipCount}
                  recentEntities={totalStats.characters.recentEntities}
                  onClick={() => navigate('/characters', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.factions')}
                  value={totalStats.factions.count.toString()}
                  icon={<IconUsersGroup style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="blue"
                  entityType={EntityType.FACTION}
                  lastUpdated={totalStats.factions.lastUpdated}
                  relationshipCount={totalStats.factions.relationshipCount}
                  recentEntities={totalStats.factions.recentEntities}
                  onClick={() => navigate('/factions', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />

                {/* World Elements Group */}
                <StatCard
                  title={t('dashboard.entities.locations')}
                  value={totalStats.locations.count.toString()}
                  icon={<IconMapPin style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="green"
                  entityType={EntityType.LOCATION}
                  lastUpdated={totalStats.locations.lastUpdated}
                  relationshipCount={totalStats.locations.relationshipCount}
                  recentEntities={totalStats.locations.recentEntities}
                  onClick={() => navigate('/locations', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.items')}
                  value={totalStats.items.count.toString()}
                  icon={<IconSword style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="green"
                  entityType={EntityType.ITEM}
                  lastUpdated={totalStats.items.lastUpdated}
                  relationshipCount={totalStats.items.relationshipCount}
                  recentEntities={totalStats.items.recentEntities}
                  onClick={() => navigate('/items', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.events')}
                  value={totalStats.events.count.toString()}
                  icon={<IconCalendarEvent style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.EVENT}
                  lastUpdated={totalStats.events.lastUpdated}
                  relationshipCount={totalStats.events.relationshipCount}
                  recentEntities={totalStats.events.recentEntities}
                  onClick={() => navigate('/events', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md" mt="md">
                {/* Narrative Group */}
                <StatCard
                  title={t('dashboard.entities.sessions')}
                  value={totalStats.sessions.count.toString()}
                  icon={<IconNotebook style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.SESSION}
                  lastUpdated={totalStats.sessions.lastUpdated}
                  relationshipCount={totalStats.sessions.relationshipCount}
                  recentEntities={totalStats.sessions.recentEntities}
                  onClick={() => navigate('/sessions', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.storyArcs')}
                  value={totalStats.storyArcs.count.toString()}
                  icon={<IconTimeline style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.STORY_ARC}
                  lastUpdated={totalStats.storyArcs.lastUpdated}
                  relationshipCount={totalStats.storyArcs.relationshipCount}
                  recentEntities={totalStats.storyArcs.recentEntities}
                  onClick={() => navigate('/story-arcs', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.notes')}
                  value={totalStats.notes.count.toString()}
                  icon={<IconBookmark style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.NOTE}
                  lastUpdated={totalStats.notes.lastUpdated}
                  relationshipCount={totalStats.notes.relationshipCount}
                  recentEntities={totalStats.notes.recentEntities}
                  onClick={() => navigate('/notes', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />

                {/* Campaign & World Group */}
                <StatCard
                  title={t('dashboard.entities.campaigns')}
                  value={totalStats.campaigns.count.toString()}
                  icon={<IconMap style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="orange"
                  entityType={EntityType.CAMPAIGN}
                  lastUpdated={totalStats.campaigns.lastUpdated}
                  relationshipCount={totalStats.campaigns.relationshipCount}
                  recentEntities={totalStats.campaigns.recentEntities}
                  onClick={() => navigate('/campaigns', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.worlds')}
                  value={totalStats.worlds.count.toString()}
                  icon={<IconWorld style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="cyan"
                  entityType={EntityType.RPG_WORLD}
                  lastUpdated={totalStats.worlds.lastUpdated}
                  relationshipCount={totalStats.worlds.relationshipCount}
                  recentEntities={totalStats.worlds.recentEntities}
                  onClick={() => navigate('/rpg-worlds', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
              </SimpleGrid>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="characters" pt="md">
          {loading ? (
            <Center p="xl">
              <Loader size="lg" />
            </Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 2 }} spacing="md">
              <StatCard
                title={t('dashboard.entities.characters')}
                value={totalStats.characters.count.toString()}
                icon={<IconUsers style={{ width: '1.5rem', height: '1.5rem' }} />}
                color="blue"
                entityType={EntityType.CHARACTER}
                typeBreakdown={totalStats.characters.typeBreakdown}
                lastUpdated={totalStats.characters.lastUpdated}
                relationshipCount={totalStats.characters.relationshipCount}
                recentEntities={totalStats.characters.recentEntities}
                onClick={() => navigate('/characters', {
                  state: {
                    from: location.pathname,
                    worldId: currentWorld?.id || '',
                    campaignId: currentCampaign?.id || ''
                  }
                })}
              />
              <StatCard
                title={t('dashboard.entities.factions')}
                value={totalStats.factions.count.toString()}
                icon={<IconUsersGroup style={{ width: '1.5rem', height: '1.5rem' }} />}
                color="blue"
                entityType={EntityType.FACTION}
                lastUpdated={totalStats.factions.lastUpdated}
                relationshipCount={totalStats.factions.relationshipCount}
                recentEntities={totalStats.factions.recentEntities}
                onClick={() => navigate('/factions', {
                  state: {
                    from: location.pathname,
                    worldId: currentWorld?.id || '',
                    campaignId: currentCampaign?.id || ''
                  }
                })}
              />
            </SimpleGrid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="world" pt="md">
          {loading ? (
            <Center p="xl">
              <Loader size="lg" />
            </Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 2 }} spacing="md">
              <StatCard
                title={t('dashboard.entities.locations')}
                value={totalStats.locations.count.toString()}
                icon={<IconMapPin style={{ width: '1.5rem', height: '1.5rem' }} />}
                color="green"
                entityType={EntityType.LOCATION}
                lastUpdated={totalStats.locations.lastUpdated}
                relationshipCount={totalStats.locations.relationshipCount}
                recentEntities={totalStats.locations.recentEntities}
                onClick={() => navigate('/locations', {
                  state: {
                    from: location.pathname,
                    worldId: currentWorld?.id || '',
                    campaignId: currentCampaign?.id || ''
                  }
                })}
              />
              <StatCard
                title={t('dashboard.entities.items')}
                value={totalStats.items.count.toString()}
                icon={<IconSword style={{ width: '1.5rem', height: '1.5rem' }} />}
                color="green"
                entityType={EntityType.ITEM}
                lastUpdated={totalStats.items.lastUpdated}
                relationshipCount={totalStats.items.relationshipCount}
                recentEntities={totalStats.items.recentEntities}
                onClick={() => navigate('/items', {
                  state: {
                    from: location.pathname,
                    worldId: currentWorld?.id || '',
                    campaignId: currentCampaign?.id || ''
                  }
                })}
              />
            </SimpleGrid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="narrative" pt="md">
          {loading ? (
            <Center p="xl">
              <Loader size="lg" />
            </Center>
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 2 }} spacing="md">
                <StatCard
                  title={t('dashboard.entities.events')}
                  value={totalStats.events.count.toString()}
                  icon={<IconCalendarEvent style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.EVENT}
                  lastUpdated={totalStats.events.lastUpdated}
                  relationshipCount={totalStats.events.relationshipCount}
                  recentEntities={totalStats.events.recentEntities}
                  onClick={() => navigate('/events', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.sessions')}
                  value={totalStats.sessions.count.toString()}
                  icon={<IconNotebook style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.SESSION}
                  lastUpdated={totalStats.sessions.lastUpdated}
                  relationshipCount={totalStats.sessions.relationshipCount}
                  recentEntities={totalStats.sessions.recentEntities}
                  onClick={() => navigate('/sessions', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 2 }} spacing="md" mt="md">
                <StatCard
                  title={t('dashboard.entities.storyArcs')}
                  value={totalStats.storyArcs.count.toString()}
                  icon={<IconTimeline style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.STORY_ARC}
                  lastUpdated={totalStats.storyArcs.lastUpdated}
                  relationshipCount={totalStats.storyArcs.relationshipCount}
                  recentEntities={totalStats.storyArcs.recentEntities}
                  onClick={() => navigate('/story-arcs', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
                <StatCard
                  title={t('dashboard.entities.notes')}
                  value={totalStats.notes.count.toString()}
                  icon={<IconBookmark style={{ width: '1.5rem', height: '1.5rem' }} />}
                  color="violet"
                  entityType={EntityType.NOTE}
                  lastUpdated={totalStats.notes.lastUpdated}
                  relationshipCount={totalStats.notes.relationshipCount}
                  recentEntities={totalStats.notes.recentEntities}
                  onClick={() => navigate('/notes', {
                    state: {
                      from: location.pathname,
                      worldId: currentWorld?.id || '',
                      campaignId: currentCampaign?.id || ''
                    }
                  })}
                />
              </SimpleGrid>
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default Dashboard;
