import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Alert,
  Breadcrumbs,
  Anchor,
  TextInput,
  Textarea,
  Select,
  TagsInput,
  Switch,
  FileInput,
  SegmentedControl,
  Tabs,
  Divider
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconAlertCircle,
  IconUpload,
  IconWorld,
  IconLock,
  IconUsers,
  IconGlobe,
  IconMap
} from '@tabler/icons-react';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { RPGWorld, RPGWorldCreationParams, RPGWorldUpdateParams, RPGWorldPrivacy } from '../../models/RPGWorld';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * RPGWorldFormPage component - Form for creating and editing RPG Worlds
 *
 * Uses the RPGWorldService to save RPG World data to Firestore
 * Supports both creation and editing modes
 *
 * @see {@link https://mantine.dev/core/button/} - Mantine Button documentation
 * @see {@link https://mantine.dev/core/paper/} - Mantine Paper documentation
 * @see {@link https://mantine.dev/form/use-form/} - Mantine useForm documentation
 */
export function RPGWorldFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [world, setWorld] = useState<RPGWorld | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('basic');

  // State for image uploads
  const [worldImageFile, setWorldImageFile] = useState<File | null>(null);
  const [worldMapFile, setWorldMapFile] = useState<File | null>(null);

  const { currentUser } = useAuth();

  // Game systems data
  const GAME_SYSTEMS = [
    { value: 'dnd5e', label: 'Dungeons & Dragons 5E' },
    { value: 'pathfinder2e', label: 'Pathfinder 2E' },
    { value: 'callOfCthulhu', label: 'Call of Cthulhu' },
    { value: 'starfinder', label: 'Starfinder' },
    { value: 'shadowrun', label: 'Shadowrun' },
    { value: 'warhammer', label: 'Warhammer Fantasy' },
    { value: 'warhammer40k', label: 'Warhammer 40K' },
    { value: 'savageWorlds', label: 'Savage Worlds' },
    { value: 'fateCore', label: 'Fate Core' },
    { value: 'cypher', label: 'Cypher System' },
    { value: 'other', label: 'Other' }
  ];

  // Genre options
  const GENRE_OPTIONS = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'sciFi', label: 'Science Fiction' },
    { value: 'horror', label: 'Horror' },
    { value: 'postApocalyptic', label: 'Post-Apocalyptic' },
    { value: 'superhero', label: 'Superhero' },
    { value: 'steampunk', label: 'Steampunk' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'western', label: 'Western' },
    { value: 'historical', label: 'Historical' },
    { value: 'urban', label: 'Urban Fantasy' },
    { value: 'other', label: 'Other' }
  ];

  // Initialize form
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      setting: '',
      system: '',
      systemVersion: '',
      genre: '',
      tags: [] as string[],
      sharedLore: false,
      privacySetting: RPGWorldPrivacy.PRIVATE.toString()
    },
    validate: {
      name: (value: string) => (value.trim().length < 3 ? 'Name must be at least 3 characters' : null),
      description: (value: string) => (value.trim().length < 10 ? 'Description must be at least 10 characters' : null)
    }
  });

  // Load world data if in edit mode
  useEffect(() => {
    const loadWorld = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);

        const worldService = new RPGWorldService();
        const worldData = await worldService.getById(id!);

        if (!worldData) {
          setError('RPG World not found');
          return;
        }

        setWorld(worldData);

        // Update form values
        form.setValues({
          name: worldData.name || '',
          description: worldData.description || '',
          setting: worldData.setting || '',
          system: worldData.system || '',
          systemVersion: worldData.systemVersion || '',
          genre: worldData.genre || '',
          tags: worldData.tags || [],
          sharedLore: worldData.sharedLore || false,
          privacySetting: (worldData.privacySetting || RPGWorldPrivacy.PRIVATE).toString()
        });
      } catch (err) {
        console.error('Error loading RPG World:', err);
        setError('Failed to load RPG World data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadWorld();
  }, [id, isEditMode, form]);

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    if (!currentUser?.id) {
      setError('You must be logged in to create or edit an RPG World');
      return;
    }

    try {
      setSaving(true);

      const worldService = new RPGWorldService();

      // TODO: Handle image uploads
      // For now, we'll just use the existing URLs or empty strings

      // Prepare world data
      const worldData: RPGWorldCreationParams | RPGWorldUpdateParams = {
        name: values.name,
        description: values.description,
        setting: values.setting,
        system: values.system,
        systemVersion: values.systemVersion,
        genre: values.genre,
        tags: values.tags,
        sharedLore: values.sharedLore,
        privacySetting: values.privacySetting as unknown as RPGWorldPrivacy,
        imageURL: world?.imageURL || '',
        worldMapURL: world?.worldMapURL || ''
      };

      if (isEditMode && id) {
        // Update existing world
        await worldService.update(id, worldData as RPGWorldUpdateParams);

        // Show success notification
        notifications.show({
          title: 'RPG World Updated',
          message: `${values.name} has been updated successfully`,
          color: 'green',
        });

        navigate(`/rpg-worlds/${id}`);
      } else {
        // Create new world
        const newWorld = await worldService.create(worldData as any, currentUser.id);

        // Show success notification
        notifications.show({
          title: 'RPG World Created',
          message: `${values.name} has been created successfully`,
          color: 'green',
        });

        navigate(`/rpg-worlds/${newWorld}`); // newWorld is the ID string
      }
    } catch (err) {
      console.error('Error saving RPG World:', err);
      setError('Failed to save RPG World. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: isEditMode ? `Edit ${world?.name || 'World'}` : 'Create New World', href: '#' }
  ];

  // If loading in edit mode
  if (loading && isEditMode) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // If error in edit mode
  if (error && isEditMode && !world) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg">
        {breadcrumbItems.map((item, index) => (
          <Anchor
            key={index}
            component={Link}
            to={item.href}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>

      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={16} />}
                  component={Link}
                  to={isEditMode ? `/rpg-worlds/${id}` : '/rpg-worlds'}
                  mb="xs"
                >
                  {isEditMode ? 'Back to World' : 'Back to Worlds'}
                </Button>
                <Title order={1}>{isEditMode ? `Edit ${world?.name}` : 'Create New RPG World'}</Title>
                <Text c="dimmed">
                  {isEditMode
                    ? 'Update your RPG world details'
                    : 'Create a new RPG world to organize your campaigns'}
                </Text>
              </div>

              <IconWorld size={32} color="var(--mantine-color-blue-6)" />
            </Group>

            <Divider />

            {/* Error Alert */}
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {error}
              </Alert>
            )}

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="basic" leftSection={<IconWorld size={16} />}>
                  Basic Information
                </Tabs.Tab>
                <Tabs.Tab value="media" leftSection={<IconMap size={16} />}>
                  Media
                </Tabs.Tab>
                <Tabs.Tab value="privacy" leftSection={<IconLock size={16} />}>
                  Privacy
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="basic" pt="md">
                <Stack gap="md">
                  <TextInput
                    required
                    label="World Name"
                    placeholder="Enter a name for your RPG world"
                    {...form.getInputProps('name')}
                  />

                  <Textarea
                    required
                    label="Description"
                    placeholder="Describe your RPG world"
                    minRows={3}
                    {...form.getInputProps('description')}
                  />

                  <TextInput
                    label="Setting"
                    placeholder="The setting of your RPG world"
                    {...form.getInputProps('setting')}
                  />

                  <Group grow>
                    <Select
                      label="Game System"
                      placeholder="Select a game system"
                      data={GAME_SYSTEMS}
                      {...form.getInputProps('system')}
                    />

                    <TextInput
                      label="System Version"
                      placeholder="e.g., 5th Edition, 2nd Edition"
                      {...form.getInputProps('systemVersion')}
                    />
                  </Group>

                  <Select
                    label="Genre"
                    placeholder="Select a genre"
                    data={GENRE_OPTIONS}
                    {...form.getInputProps('genre')}
                  />

                  <TagsInput
                    label="Tags"
                    placeholder="Add tags to categorize your world"
                    data={form.values.tags}
                    splitChars={[',']}
                    onChange={(values) => form.setFieldValue('tags', values)}
                    value={form.values.tags}
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="media" pt="md">
                <Stack gap="md">
                  <FileInput
                    label="World Image"
                    placeholder="Upload an image for your world"
                    accept="image/png,image/jpeg,image/gif"
                    leftSection={<IconUpload size={16} />}
                    value={worldImageFile}
                    onChange={setWorldImageFile}
                  />

                  {world?.imageURL && (
                    <div>
                      <Text size="sm" mb="xs">Current Image:</Text>
                      <img
                        src={world.imageURL}
                        alt="World"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                      />
                    </div>
                  )}

                  <FileInput
                    label="World Map"
                    placeholder="Upload a map for your world"
                    accept="image/png,image/jpeg,image/gif"
                    leftSection={<IconUpload size={16} />}
                    value={worldMapFile}
                    onChange={setWorldMapFile}
                  />

                  {world?.worldMapURL && (
                    <div>
                      <Text size="sm" mb="xs">Current Map:</Text>
                      <img
                        src={world.worldMapURL}
                        alt="World Map"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                      />
                    </div>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="privacy" pt="md">
                <Stack gap="md">
                  <SegmentedControl
                    fullWidth
                    data={[
                      {
                        label: (
                          <Group gap={5}>
                            <IconLock size={16} />
                            <span>Private</span>
                          </Group>
                        ),
                        value: RPGWorldPrivacy.PRIVATE.toString()
                      },
                      {
                        label: (
                          <Group gap={5}>
                            <IconUsers size={16} />
                            <span>Friends</span>
                          </Group>
                        ),
                        value: RPGWorldPrivacy.FRIENDS.toString()
                      },
                      {
                        label: (
                          <Group gap={5}>
                            <IconGlobe size={16} />
                            <span>Public</span>
                          </Group>
                        ),
                        value: RPGWorldPrivacy.PUBLIC.toString()
                      }
                    ]}
                    {...form.getInputProps('privacySetting')}
                  />

                  <Text size="sm" c="dimmed">
                    {form.values.privacySetting === RPGWorldPrivacy.PRIVATE.toString()
                      ? 'Only you can see this world'
                      : form.values.privacySetting === RPGWorldPrivacy.FRIENDS.toString()
                      ? 'Only you and your friends can see this world'
                      : 'Anyone can see this world'}
                  </Text>

                  <Switch
                    label="Shared Lore"
                    description="When enabled, lore is shared across all campaigns in this world"
                    {...form.getInputProps('sharedLore', { type: 'checkbox' })}
                  />
                </Stack>
              </Tabs.Panel>
            </Tabs>

            <Divider />

            <Group justify="space-between">
              <Button
                variant="default"
                onClick={() => navigate(isEditMode ? `/rpg-worlds/${id}` : '/rpg-worlds')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={saving}
              >
                {isEditMode ? 'Update World' : 'Create World'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default RPGWorldFormPage;
