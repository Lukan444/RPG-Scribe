import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Avatar,
  Tabs,
  Grid,
  Stack,
  Button,
  ActionIcon,
  Menu,
  Loader,
  Center,
  Divider,
  List,
  ThemeIcon,
  Card,
  SimpleGrid
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconUser,
  IconMapPin,
  IconSword,
  IconNotes,
  IconUsers as IconRelationship,
  IconHistory,
  IconDotsVertical,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { CharacterService, Character } from '../../services/character.service';
import { RelationshipService, Relationship } from '../../services/relationship.service';
import { EntityType } from '../../models/EntityType';
import { useRPGWorld } from '../../contexts/RPGWorldContext';
import { RelationshipCountBadge } from '../../components/relationships/badges';

export function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorld, currentCampaign } = useRPGWorld();

  const [character, setCharacter] = useState<Character | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);

  // Load character data
  useEffect(() => {
    const loadCharacter = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // If we don't have a current world, try to get the worldId from the character itself
        let worldId = currentWorld?.id;
        let campaignId = currentCampaign?.id || 'global';

        // First attempt to load the character using the current context
        if (worldId) {
          console.log(`Loading character with worldId from context: ${worldId}`);

          const characterService = CharacterService.getInstance(worldId, campaignId);
          const characterData = await characterService.getEntity(id);

          if (characterData) {
            setCharacter(characterData);

            // Load relationships
            const relationshipService = RelationshipService.getInstance(worldId, campaignId);
            const relationshipsData = await relationshipService.getRelationshipsByEntity(id, EntityType.CHARACTER);
            setRelationships(relationshipsData);

            setLoading(false);
            return;
          }
        }

        // If we don't have a worldId or the character wasn't found, try to get it directly
        console.log('Attempting to load character directly without world context');

        // Use a default worldId as fallback
        const fallbackWorldId = 'default-world';
        const characterService = CharacterService.getInstance(fallbackWorldId, campaignId);

        // Try to get the character directly
        const characterData = await characterService.getEntity(id);

        if (!characterData) {
          setError('Character not found');
          return;
        }

        // If we found the character, use its worldId for subsequent operations
        worldId = characterData.worldId || fallbackWorldId;
        campaignId = characterData.campaignId || campaignId;

        console.log(`Found character with worldId: ${worldId}, campaignId: ${campaignId}`);

        setCharacter(characterData);

        // Load relationships using the character's worldId
        const relationshipService = RelationshipService.getInstance(worldId, campaignId);
        const relationshipsData = await relationshipService.getRelationshipsByEntity(id, EntityType.CHARACTER);
        setRelationships(relationshipsData);
      } catch (err) {
        console.error('Error loading character:', err);
        setError('Failed to load character data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [id, currentWorld, currentCampaign]);

  // Handle delete character
  const handleDeleteCharacter = () => {
    openConfirmDelete();
  };

  // Confirm delete character
  const confirmDeleteCharacter = async () => {
    if (!id || !character) return;

    try {
      setLoading(true);

      // Use the character's worldId if available, otherwise fall back to context or default
      const worldId = character.worldId || currentWorld?.id || 'default-world';
      const campaignId = character.campaignId || currentCampaign?.id || 'global';

      console.log(`Deleting character with worldId: ${worldId}, campaignId: ${campaignId}`);

      const characterService = CharacterService.getInstance(worldId, campaignId);
      await characterService.deleteEntity(id);

      // Navigate to the appropriate characters list based on context
      if (currentWorld?.id) {
        navigate(`/rpg-worlds/${currentWorld.id}/characters`);
      } else if (character.worldId) {
        navigate(`/rpg-worlds/${character.worldId}/characters`);
      } else {
        navigate('/characters');
      }
    } catch (err) {
      console.error('Error deleting character:', err);
      setError('Failed to delete character. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // If loading
  if (loading && !character) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && !character) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  // If character not found
  if (!character) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text>Character not found</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            component={Link}
            to={
              currentWorld?.id
                ? `/rpg-worlds/${currentWorld.id}/characters`
                : character?.worldId
                  ? `/rpg-worlds/${character.worldId}/characters`
                  : '/characters'
            }
            mb="xs"
          >
            Back to Characters
          </Button>
          <Title order={1}>{character.name}</Title>
        </div>

        <Group>
          <Button
            component={Link}
            to={
              currentWorld?.id
                ? `/rpg-worlds/${currentWorld.id}/characters/${id}/edit`
                : character?.worldId
                  ? `/rpg-worlds/${character.worldId}/characters/${id}/edit`
                  : `/characters/${id}/edit`
            }
            leftSection={<IconEdit size={16} />}
          >
            Edit
          </Button>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="default" size="lg">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={handleDeleteCharacter}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Stack align="center" gap="md">
              <Avatar
                src={character.imageURL}
                size={150}
                radius={100}
                alt={character.name}
              />

              <Title order={2}>{character.name}</Title>

              <Group gap={5}>
                <Badge color={character.type === 'PC' ? 'blue' : 'gray'} size="lg">
                  {character.type}
                </Badge>

                {character.level && (
                  <Badge color="cyan" size="lg">
                    Level {character.level}
                  </Badge>
                )}
              </Group>

              <Text size="lg">
                {character.race} {character.class}
              </Text>

              <Text c="dimmed" ta="center">
                {character.description || 'No description available.'}
              </Text>

              <Divider w="100%" />

              <Group grow w="100%">
                <Stack align="center" gap={5}>
                  <Group justify="center">
                    <RelationshipCountBadge
                      entityId={id || ''}
                      entityType={EntityType.CHARACTER}
                      count={relationships.length}
                      worldId={character?.worldId || currentWorld?.id || ''}
                      campaignId={character?.campaignId || currentCampaign?.id || ''}
                      size="md"
                      variant="filled"
                      interactive={true}
                      tooltipPosition="top"
                    />
                  </Group>
                  <Text size="xs" c="dimmed">Relationships</Text>
                </Stack>

                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{character.status === 'alive' ? 'Alive' : character.status === 'dead' ? 'Dead' : 'Unknown'}</Text>
                  <Text size="xs" c="dimmed">Status</Text>
                </Stack>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="details" leftSection={<IconUser size={16} />}>
                  Details
                </Tabs.Tab>
                <Tabs.Tab value="relationships" leftSection={<IconRelationship size={16} />}>
                  Relationships
                  <RelationshipCountBadge
                    entityId={id || ''}
                    entityType={EntityType.CHARACTER}
                    count={relationships.length}
                    worldId={character?.worldId || currentWorld?.id || ''}
                    campaignId={character?.campaignId || currentCampaign?.id || ''}
                    size="xs"
                    variant="filled"
                    interactive={false}
                    tooltipPosition="top"
                    style={{ marginLeft: '5px' }}
                  />
                </Tabs.Tab>
                <Tabs.Tab value="inventory" leftSection={<IconSword size={16} />}>
                  Inventory
                </Tabs.Tab>
                <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>
                  Notes
                </Tabs.Tab>
                <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                  History
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Race</Text>
                      <Text>{character.race || 'N/A'}</Text>

                      <Text fw={700} mt="md">Class</Text>
                      <Text>{character.class || 'N/A'}</Text>

                      <Text fw={700} mt="md">Level</Text>
                      <Text>{character.level || 'N/A'}</Text>

                      <Text fw={700} mt="md">Background</Text>
                      <Text>{character.background || 'N/A'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Alignment</Text>
                      <Text>{character.alignment || 'N/A'}</Text>

                      <Text fw={700} mt="md">Status</Text>
                      <Text>{character.status || 'Unknown'}</Text>

                      <Text fw={700} mt="md">Current Location</Text>
                      <Text>{character.currentLocation?.name || 'Unknown'}</Text>

                      <Text fw={700} mt="md">Player</Text>
                      <Text>{character.playerId ? 'Player Character' : 'NPC'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={12} mt="md">
                    <Text fw={700}>Appearance</Text>
                    <Text>{character.appearance || 'No appearance details available.'}</Text>

                    <Text fw={700} mt="md">Personality</Text>
                    <Text>{character.personality || 'No personality details available.'}</Text>

                    <Text fw={700} mt="md">Goals</Text>
                    <Text>{character.goals || 'No goals specified.'}</Text>

                    <Text fw={700} mt="md">Secrets</Text>
                    <Text>{character.secrets || 'No secrets specified.'}</Text>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="relationships" pt="md">
                {relationships.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {relationships.map((relationship) => (
                      <Card key={relationship.id} withBorder shadow="sm" p="md">
                        <Group justify="space-between">
                          <Text fw={700}>{relationship.targetEntity?.name || 'Unknown Entity'}</Text>
                          <Badge>{relationship.type}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">
                          {relationship.description || 'No description available.'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No relationships found for this character.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="inventory" pt="md">
                {character.inventory && character.inventory.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {character.inventory.map((item) => (
                      <Card key={item.id} withBorder shadow="sm" p="md">
                        <Text fw={700}>{item.name}</Text>
                        <Badge mt="xs">{item.type}</Badge>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No items in inventory.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="notes" pt="md">
                <Paper p="md" withBorder>
                  {character.notes ? (
                    <Text>{character.notes}</Text>
                  ) : (
                    <Text c="dimmed" ta="center">
                      No notes available for this character.
                    </Text>
                  )}
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="history" pt="md">
                <Text c="dimmed" ta="center" py="xl">
                  Character history will be implemented soon.
                </Text>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        title="Delete Character"
        message={`Are you sure you want to delete ${character.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteCharacter}
      />
    </Container>
  );
}

export default CharacterDetailPage;
