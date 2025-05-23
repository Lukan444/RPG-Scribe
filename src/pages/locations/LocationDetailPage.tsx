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
  IconMapPin,
  IconUser,
  IconSword,
  IconNotes,
  IconHistory,
  IconDotsVertical,
  IconBuilding,
  IconMap
} from '@tabler/icons-react';
import { IconRelationship } from '../../components/icons';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { LocationService, Location } from '../../services/location.service';
import { RelationshipService, Relationship } from '../../services/relationship.service';
import { EntityType } from '../../models/EntityType';

/**
 * LocationDetailPage component - Displays detailed information about a location
 *
 * Uses the LocationService to fetch location data from Firestore
 * Displays location details, relationships, characters, items, and notes
 * Supports editing and deleting the location
 */
export function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [location, setLocation] = useState<Location | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);

  // Load location data
  useEffect(() => {
    const loadLocation = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // For now, we'll use a hardcoded world and campaign ID
        const worldId = 'default-world';
        const campaignId = 'default-campaign';

        const locationService = LocationService.getInstance(worldId, campaignId);
        const locationData = await locationService.getEntity(id);

        if (!locationData) {
          setError('Location not found');
          return;
        }

        setLocation(locationData);

        // Load relationships
        const relationshipService = RelationshipService.getInstance(worldId, campaignId);
        const relationshipsData = await relationshipService.getRelationshipsByEntity(id, EntityType.LOCATION);
        setRelationships(relationshipsData);

        // TODO: Load characters at this location
        // TODO: Load items at this location
      } catch (err) {
        console.error('Error loading location:', err);
        setError('Failed to load location data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLocation();
  }, [id]);

  // Handle delete location
  const handleDeleteLocation = () => {
    openConfirmDelete();
  };

  // Confirm delete location
  const confirmDeleteLocation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // For now, we'll use a hardcoded world and campaign ID
      const worldId = 'default-world';
      const campaignId = 'default-campaign';

      const locationService = LocationService.getInstance(worldId, campaignId);
      await locationService.deleteEntity(id);

      navigate('/locations');
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get color for location type
  const getLocationTypeColor = (locationType: string): string => {
    switch (locationType) {
      case 'Settlement':
        return 'blue';
      case 'Dungeon':
        return 'red';
      case 'Wilderness':
        return 'green';
      case 'Building':
        return 'yellow';
      case 'Landmark':
        return 'violet';
      default:
        return 'gray';
    }
  };

  // Get icon for location type
  const getLocationTypeIcon = (locationType: string) => {
    switch (locationType) {
      case 'Settlement':
        return <IconBuilding size={24} />;
      case 'Dungeon':
        return <IconMap size={24} />;
      case 'Wilderness':
        return <IconMapPin size={24} />;
      default:
        return <IconMapPin size={24} />;
    }
  };

  // If loading
  if (loading && !location) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error
  if (error && !location) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  // If location not found
  if (!location) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text>Location not found</Text>
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
            to="/locations"
            mb="xs"
          >
            Back to Locations
          </Button>
          <Title order={1}>{location.name}</Title>
        </div>

        <Group>
          <Button
            component={Link}
            to={`/locations/${id}/edit`}
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
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={handleDeleteLocation}>
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
                src={location.imageURL}
                size={150}
                radius={100}
                alt={location.name}
              >
                {getLocationTypeIcon(location.locationType)}
              </Avatar>

              <Title order={2}>{location.name}</Title>

              <Badge color={getLocationTypeColor(location.locationType)} size="lg">
                {location.locationType}
              </Badge>

              <Text c="dimmed" ta="center">
                {location.description || 'No description available.'}
              </Text>

              <Divider w="100%" />

              <Group grow w="100%">
                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{relationships.length}</Text>
                  <Text size="xs" c="dimmed">Relationships</Text>
                </Stack>

                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{characters.length}</Text>
                  <Text size="xs" c="dimmed">Characters</Text>
                </Stack>

                <Stack align="center" gap={5}>
                  <Text fw={700} size="lg">{items.length}</Text>
                  <Text size="xs" c="dimmed">Items</Text>
                </Stack>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="details" leftSection={<IconMapPin size={16} />}>
                  Details
                </Tabs.Tab>
                <Tabs.Tab value="characters" leftSection={<IconUser size={16} />}>
                  Characters
                </Tabs.Tab>
                <Tabs.Tab value="items" leftSection={<IconSword size={16} />}>
                  Items
                </Tabs.Tab>
                <Tabs.Tab value="relationships" leftSection={<IconRelationship size={16} />}>
                  Relationships
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
                      <Text fw={700}>Type</Text>
                      <Text>{location.locationType || 'N/A'}</Text>

                      <Text fw={700} mt="md">World</Text>
                      <Text>{location.worldId || 'N/A'}</Text>

                      <Text fw={700} mt="md">Campaign</Text>
                      <Text>{location.campaignId || 'N/A'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack gap="xs">
                      <Text fw={700}>Created By</Text>
                      <Text>{location.createdBy || 'N/A'}</Text>

                      <Text fw={700} mt="md">Created At</Text>
                      <Text>{location.createdAt ? new Date(location.createdAt.toDate()).toLocaleString() : 'N/A'}</Text>

                      <Text fw={700} mt="md">Updated At</Text>
                      <Text>{location.updatedAt ? new Date(location.updatedAt.toDate()).toLocaleString() : 'N/A'}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={12} mt="md">
                    <Text fw={700}>Description</Text>
                    <Text>{location.description || 'No description available.'}</Text>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="characters" pt="md">
                {characters.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {characters.map((character) => (
                      <Card key={character.id} withBorder shadow="sm" p="md">
                        <Group justify="space-between">
                          <Text fw={700}>{character.name || 'Unknown Character'}</Text>
                          <Badge>{character.type}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">
                          {character.description || 'No description available.'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No characters found at this location.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="items" pt="md">
                {items.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {items.map((item) => (
                      <Card key={item.id} withBorder shadow="sm" p="md">
                        <Text fw={700}>{item.name}</Text>
                        <Badge mt="xs">{item.type}</Badge>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No items found at this location.
                  </Text>
                )}
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
                    No relationships found for this location.
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="notes" pt="md">
                <Paper p="md" withBorder>
                  {location.notes ? (
                    <Text>{location.notes}</Text>
                  ) : (
                    <Text c="dimmed" ta="center">
                      No notes available for this location.
                    </Text>
                  )}
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="history" pt="md">
                <Text c="dimmed" ta="center" py="xl">
                  Location history will be implemented soon.
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
        title="Delete Location"
        message={`Are you sure you want to delete ${location.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteLocation}
      />
    </Container>
  );
}

export default LocationDetailPage;
