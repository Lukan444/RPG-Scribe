import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Title,
  Text,
  Card,
  Group,
  Button,
  Badge,
  Tabs,
  Image,
  ActionIcon,
  Menu,
  Skeleton,
  Avatar,
  SimpleGrid,
  List,
  useMantineTheme,
  Paper
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../models/Character';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/Campaign';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/Location';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/Item';
import { EntityRelationshipsService } from '../../services/entityRelationships.service';
import { EntityType } from '../../models/EntityType';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUsers,
  IconMap2,
  IconSword,
  IconBackpack,
  IconRelationManyToMany,
  IconNotes
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

/**
 * Character page component
 */
const CharacterPage: React.FC = () => {
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { t } = useTranslation(['ui', 'common', 'entities']);

  const [loading, setLoading] = useState<boolean>(true);
  const [character, setCharacter] = useState<any | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentLocation, setCurrentLocation] = useState<any | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Services
  const campaignService = new CampaignService();

  // Load character data
  useEffect(() => {
    const loadCharacterData = async () => {
      if (!campaignId || !characterId || !user) return;

      setLoading(true);

      try {
        // Load campaign
        const campaignData = await campaignService.getById(campaignId);

        if (!campaignData) {
          navigate('/campaigns');
          return;
        }

        setCampaign(campaignData);

        // Load character
        const characterService = CharacterService.getInstance(campaignData.worldId, campaignId);
        const characterData = await characterService.getById(characterId);

        if (!characterData) {
          navigate(`/campaigns/${campaignId}/characters`);
          return;
        }

        setCharacter(characterData);
        setIsOwner(characterData.createdBy === user.id || campaignData.createdBy === user.id);

        // Load current location if available
        if (characterData.currentLocationId) {
          const locationService = LocationService.getInstance(campaignData.worldId, campaignId);
          const locationData = await locationService.getById(characterData.currentLocationId);
          setCurrentLocation(locationData);
        }

        // Load inventory items
        if (characterData.inventory && characterData.inventory.length > 0) {
          const itemService = ItemService.getInstance(campaignData.worldId, campaignId);
          const itemIds = characterData.inventory.map(item => item.id);
          const itemsData: any[] = [];

          for (const itemId of itemIds) {
            const item = await itemService.getById(itemId);
            if (item) {
              itemsData.push(item);
            }
          }

          setInventory(itemsData);
        }

        // Load relationships
        const relationshipsService = new EntityRelationshipsService(
          campaignId,
          campaignData?.worldId || ''
        );
        const relationshipsData = await relationshipsService.getEntityRelationships(characterId, EntityType.CHARACTER);
        setRelationships(relationshipsData);
      } catch (error) {
        console.error('Error loading character data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCharacterData();
  }, [campaignId, characterId, user, navigate]);

  // Delete character confirmation
  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: t('modals.titles.deleteCharacter'),
      centered: true,
      children: (
        <Text size="sm">
          {t('common:messages.deleteCharacterConfirm', 'Are you sure you want to delete this character? This action cannot be undone.')}
        </Text>
      ),
      labels: {
        confirm: t('modals.buttons.delete'),
        cancel: t('modals.buttons.cancel')
      },
      confirmProps: { color: 'red' },
      onConfirm: deleteCharacter,
    });
  };

  // Delete character
  const deleteCharacter = async () => {
    if (!campaignId || !characterId) return;

    try {
      const characterService = CharacterService.getInstance(campaign?.worldId || '', campaignId);
      await characterService.delete(characterId);
      navigate(`/campaigns/${campaignId}/characters`);
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Skeleton height={50} width="50%" mb="xl" />
        <Skeleton height={200} mb="xl" />
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="inventory">Inventory</Tabs.Tab>
            <Tabs.Tab value="relationships">Relationships</Tabs.Tab>
            <Tabs.Tab value="notes">Notes</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <SimpleGrid cols={2} spacing="md" mt="xl">
          <Skeleton height={300} />
          <Skeleton height={300} />
        </SimpleGrid>
      </Container>
    );
  }

  // Render not found state
  if (!character || !campaign) {
    return (
      <Container size="xl" py="xl">
        <Title order={1} mb="xl">{t('errors.characterNotFound')}</Title>
        <Text>{t('common:messages.characterNotFoundDescription', 'The character you are looking for does not exist or you do not have permission to view it.')}</Text>
        <Button component={Link} to={`/campaigns/${campaignId}/characters`} mt="xl">
          {t('navigation.backToCharacters')}
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Text size="sm" color="dimmed" mb="xs">
            <Link to={`/campaigns/${campaignId}`}>{campaign.name}</Link> / Characters
          </Text>
          <Title order={1}>{character.name}</Title>
        </div>

        {isOwner && (
          <Group>
            <Button
              component={Link}
              to={`/campaigns/${campaignId}/characters/${characterId}/edit`}
              leftSection={<IconEdit size={16} />}
            >
              {t('buttons.edit')}
            </Button>

            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="default" size="lg">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={openDeleteModal}>
                  {t('buttons.delete')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        )}
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Grid>
          <Grid.Col span={4}>
            <Image
              src={character.imageURL || 'https://via.placeholder.com/300x300?text=Character'}
              height={300}
              alt={character.name}
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={8}>
            <Group justify="space-between" mb="md">
              <div>
                <Badge color={character.type === 'PC' ? 'blue' : 'gray'} size="lg" mb="xs">
                  {character.type}
                </Badge>
                <Text size="xl" fw={700}>
                  {character.race} {character.class}
                </Text>
                <Text size="md">
                  Level {character.level} • {character.alignment}
                </Text>
                {character.playerId && (
                  <Text size="sm" color="dimmed">
                    Player: {character.playerId}
                  </Text>
                )}
              </div>

              {currentLocation && (
                <Card shadow="xs" padding="sm" radius="md" withBorder>
                  <Text size="sm" color="dimmed">Current Location</Text>
                  <Group>
                    <IconMap2 size={16} />
                    <Text>
                      <Link to={`/campaigns/${campaignId}/locations/${currentLocation.id}`}>
                        {currentLocation.name}
                      </Link>
                    </Text>
                  </Group>
                </Card>
              )}
            </Group>

            <Text size="sm" mb="md">{character.background}</Text>

            <Text>{character.description}</Text>
          </Grid.Col>
        </Grid>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconUsers size={16} />}>{t('tabs.overview')}</Tabs.Tab>
          <Tabs.Tab value="inventory" leftSection={<IconBackpack size={16} />}>{t('tabs.inventory')}</Tabs.Tab>
          <Tabs.Tab value="relationships" leftSection={<IconRelationManyToMany size={16} />}>{t('tabs.relationships')}</Tabs.Tab>
          <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>{t('tabs.notes')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Stats</Title>

                {character.stats ? (
                  <SimpleGrid cols={3} spacing="md">
                    {Object.entries(character.stats).map(([key, value]) => (
                      <Paper key={key} shadow="xs" p="md" withBorder>
                        <Text ta="center" size="sm" color="dimmed">{key.toUpperCase()}</Text>
                        <Text ta="center" fw={700} size="xl">{String(value)}</Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text color="dimmed">No stats available</Text>
                )}
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Background</Title>
                <Text>{character.background}</Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="inventory" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Inventory</Title>

            {isOwner && (
              <Button
                component={Link}
                to={`/campaigns/${campaignId}/characters/${characterId}/inventory/add`}
                variant="filled"
                color="blue"
              >
                Add Item
              </Button>
            )}
          </Group>

          <SimpleGrid cols={3} spacing="md">
            {inventory.map((item) => (
              <Card key={item.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Badge color="amber">{item.type}</Badge>
                  <Badge color="gray">{item.rarity}</Badge>
                </Group>

                <Title order={4} mb="xs">{item.name}</Title>

                <Text size="sm" color="dimmed" lineClamp={2}>
                  {item.description}
                </Text>

                {item.attunement && (
                  <Badge color="indigo" mt="xs">Requires Attunement</Badge>
                )}

                <Button
                  component={Link}
                  to={`/campaigns/${campaignId}/items/${item.id}`}
                  variant="light"
                  fullWidth
                  mt="md"
                >
                  View Item
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {inventory.length === 0 && (
            <Text color="dimmed" ta="center" py="xl">
              No items in inventory
            </Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="relationships" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Relationships</Title>

            {isOwner && (
              <Button
                component={Link}
                to={`/campaigns/${campaignId}/characters/${characterId}/relationships/add`}
                variant="filled"
                color="blue"
              >
                Add Relationship
              </Button>
            )}
          </Group>

          {relationships.length > 0 ? (
            <SimpleGrid cols={2} spacing="md">
              {relationships.map((relationship) => (
                <Card key={relationship.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Badge color="blue">{relationship.type}</Badge>
                    <Badge color="gray">{relationship.subtype}</Badge>
                  </Group>

                  <Group>
                    <Avatar
                      src={relationship.source.id === characterId ? relationship.target.imageURL : relationship.source.imageURL}
                      radius="xl"
                    />
                    <div>
                      <Text fw={500}>
                        {relationship.source.id === characterId ? relationship.target.name : relationship.source.name}
                      </Text>
                      <Text size="xs" color="dimmed">
                        {relationship.source.id === characterId ? relationship.target.type : relationship.source.type}
                      </Text>
                    </div>
                  </Group>

                  {relationship.properties && Object.keys(relationship.properties).length > 0 && (
                    <List size="sm" mt="md">
                      {Object.entries(relationship.properties).map(([key, value]) => (
                        <List.Item key={key}>
                          <Text size="sm">
                            <b>{key}:</b> {value?.toString()}
                          </Text>
                        </List.Item>
                      ))}
                    </List>
                  )}
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Text color="dimmed" ta="center" py="xl">
              No relationships found
            </Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="notes" pt="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Notes</Title>

            {isOwner && (
              <Button
                component={Link}
                to={`/campaigns/${campaignId}/characters/${characterId}/notes/edit`}
                variant="filled"
                color="blue"
              >
                Edit Notes
              </Button>
            )}
          </Group>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            {character.notes ? (
              <Text>{character.notes}</Text>
            ) : (
              <Text color="dimmed" ta="center" py="xl">
                No notes available
              </Text>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default CharacterPage;
