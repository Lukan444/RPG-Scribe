import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Switch,
  Button,
  Group,
  Stack,
  Box,
  Paper,
  Title,
  Text,
  Divider,
  FileInput,
  Progress,
  SegmentedControl,
  Tooltip,
  Tabs,
  rem
} from '@mantine/core';
import {
  IconUpload,
  IconWorld,
  IconLock,
  IconUsers,
  IconWorld as IconGlobe,
  IconMap,
  IconInfoCircle
} from '@tabler/icons-react';
import { RPGWorldCreationParams, RPGWorldUpdateParams, RPGWorldPrivacy } from '../../models/RPGWorld';
import { uploadImage } from '../../services/storage.service';

// Game systems options
const GAME_SYSTEMS = [
  { value: 'dnd5e', label: 'Dungeons & Dragons 5E' },
  { value: 'pathfinder2e', label: 'Pathfinder 2E' },
  { value: 'callOfCthulhu', label: 'Call of Cthulhu' },
  { value: 'warhammer', label: 'Warhammer Fantasy' },
  { value: 'starfinder', label: 'Starfinder' },
  { value: 'shadowrun', label: 'Shadowrun' },
  { value: 'savageWorlds', label: 'Savage Worlds' },
  { value: 'fateCore', label: 'Fate Core' },
  { value: 'blades', label: 'Blades in the Dark' },
  { value: 'cypher', label: 'Cypher System' },
  { value: 'other', label: 'Other' }
];

// Genre options
const GENRES = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sciFi', label: 'Science Fiction' },
  { value: 'horror', label: 'Horror' },
  { value: 'postApocalyptic', label: 'Post-Apocalyptic' },
  { value: 'superhero', label: 'Superhero' },
  { value: 'steampunk', label: 'Steampunk' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'historical', label: 'Historical' },
  { value: 'modern', label: 'Modern' },
  { value: 'urban', label: 'Urban Fantasy' },
  { value: 'western', label: 'Western' },
  { value: 'other', label: 'Other' }
];

// Tag options
const TAG_OPTIONS = [
  { value: 'homebrew', label: 'Homebrew' },
  { value: 'official', label: 'Official Setting' },
  { value: 'campaign', label: 'Campaign Ready' },
  { value: 'oneshot', label: 'One-Shot' },
  { value: 'beginner', label: 'Beginner Friendly' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'linear', label: 'Linear' },
  { value: 'political', label: 'Political' },
  { value: 'combat', label: 'Combat Heavy' },
  { value: 'roleplay', label: 'Roleplay Heavy' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'horror', label: 'Horror' },
  { value: 'comedy', label: 'Comedy' }
];

// Props interface
interface RPGWorldFormProps {
  initialValues?: Partial<RPGWorldCreationParams>;
  onSubmit: (values: RPGWorldCreationParams | RPGWorldUpdateParams) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

/**
 * RPG World Form Component
 */
export function RPGWorldForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false
}: RPGWorldFormProps) {
  // State for image uploads
  const [worldImageFile, setWorldImageFile] = useState<File | null>(null);
  const [worldMapFile, setWorldMapFile] = useState<File | null>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [mapUploadProgress, setMapUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('basic');

  // Form validation and state
  const form = useForm({
    initialValues: {
      // Basic information
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      setting: initialValues?.setting || '',
      system: initialValues?.system || '',
      systemVersion: initialValues?.systemVersion || '',
      genre: initialValues?.genre || 'fantasy',
      tags: initialValues?.tags || [],

      // Media
      imageURL: initialValues?.imageURL || '',
      worldMapURL: initialValues?.worldMapURL || '',

      // Configuration
      sharedLore: initialValues?.sharedLore ?? true,
      privacySetting: initialValues?.privacySetting || RPGWorldPrivacy.PRIVATE
    },
    validate: {
      name: (value: string) => {
        if (!value || value.trim() === '') return 'World name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return null;
      },
      description: (value: string) => {
        if (!value || value.trim() === '') return 'Description is required';
        if (value.trim().length < 10) return 'Description must be at least 10 characters';
        if (value.trim().length > 2000) return 'Description must be less than 2000 characters';
        return null;
      },
      setting: (value: string) => {
        if (!value || value.trim() === '') return 'Setting is required';
        if (value.trim().length < 3) return 'Setting must be at least 3 characters';
        if (value.trim().length > 500) return 'Setting must be less than 500 characters';
        return null;
      },
      system: (value: string) => {
        if (!value || value.trim() === '') return 'Please select a game system';
        return null;
      },
      systemVersion: (value: string) => {
        if (value && value.trim().length > 50) return 'System version must be less than 50 characters';
        return null;
      },
      tags: (value: string[]) => {
        if (value && value.length > 10) return 'You can select up to 10 tags';
        return null;
      }
    }
  });

  // Handle form submission
  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const errors = form.validate();
      if (errors.hasErrors) {
        return;
      }

      setUploadError(null);

      if (worldImageFile) {
        const path = `worlds/${Date.now()}_${worldImageFile.name}`;
        values.imageURL = await uploadImage(worldImageFile, path, setImageUploadProgress);
      }

      if (worldMapFile) {
        const path = `worlds/${Date.now()}_${worldMapFile.name}`;
        values.worldMapURL = await uploadImage(worldMapFile, path, setMapUploadProgress);
      }

      onSubmit(values);
    } catch (error) {
      console.error('Error in form submission:', error);
      setUploadError('Failed to upload images');
    }
  });

  return (
    <Paper p="md" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group justify="space-between">
            <Box>
              <Title order={3}>{isEditing ? 'Edit RPG World' : 'Create New RPG World'}</Title>
              <Text c="dimmed" size="sm">
                {isEditing
                  ? 'Update your RPG world details'
                  : 'Create a new RPG world to organize your campaigns'}
              </Text>
            </Box>
            <IconWorld style={{ width: '32px', height: '32px' }} color="var(--mantine-color-blue-6)" />
          </Group>

          <Divider />

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="basic" leftSection={<IconWorld style={{ width: '16px', height: '16px' }} />}>
                Basic Information
              </Tabs.Tab>
              <Tabs.Tab value="media" leftSection={<IconMap style={{ width: '16px', height: '16px' }} />}>
                Media
              </Tabs.Tab>
              <Tabs.Tab value="config" leftSection={<IconLock style={{ width: '16px', height: '16px' }} />}>
                Configuration
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
                  required
                  label="Setting"
                  placeholder="The setting of your RPG world"
                  {...form.getInputProps('setting')}
                />

                <Group grow>
                  <Select
                    required
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
                  data={GENRES}
                  {...form.getInputProps('genre')}
                />

                <MultiSelect
                  label="Tags"
                  placeholder="Select tags for your world"
                  data={TAG_OPTIONS}
                  searchable
                  clearable
                  {...form.getInputProps('tags')}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="media" pt="md">
              <Stack gap="md">
                <FileInput
                  label="World Cover Image"
                  placeholder="Upload a cover image for your world"
                  accept="image/png,image/jpeg,image/webp"
                  leftSection={<IconUpload style={{ width: '14px', height: '14px' }} />}
                  value={worldImageFile}
                  onChange={setWorldImageFile}
                  description="This image will be displayed as the cover for your world"
                />
                {imageUploadProgress > 0 && (
                  <Progress value={imageUploadProgress} size="xs" />
                )}

                <FileInput
                  label="World Map"
                  placeholder="Upload a map for your world"
                  accept="image/png,image/jpeg,image/webp"
                  leftSection={<IconUpload style={{ width: '14px', height: '14px' }} />}
                  value={worldMapFile}
                  onChange={setWorldMapFile}
                  description="A map of your world that players can explore"
                />
                {mapUploadProgress > 0 && (
                  <Progress value={mapUploadProgress} size="xs" />
                )}
                {uploadError && <Text c="red" size="sm">{uploadError}</Text>}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="config" pt="md">
              <Stack gap="md">
                <Box>
                  <Group mb="xs">
                    <Text fw={500} size="sm">Privacy Setting</Text>
                    <Tooltip
                      label="Controls who can view this world and its contents"
                      position="top"
                    >
                      <IconInfoCircle style={{ width: '16px', height: '16px', opacity: 0.5 }} />
                    </Tooltip>
                  </Group>

                  <SegmentedControl
                    fullWidth
                    data={[
                      {
                        value: RPGWorldPrivacy.PRIVATE,
                        label: (
                          <Group gap="xs" wrap="nowrap">
                            <IconLock style={{ width: '16px', height: '16px' }} />
                            <Text>Private</Text>
                          </Group>
                        )
                      },
                      {
                        value: RPGWorldPrivacy.SHARED,
                        label: (
                          <Group gap="xs" wrap="nowrap">
                            <IconUsers style={{ width: '16px', height: '16px' }} />
                            <Text>Shared</Text>
                          </Group>
                        )
                      },
                      {
                        value: RPGWorldPrivacy.PUBLIC,
                        label: (
                          <Group gap="xs" wrap="nowrap">
                            <IconGlobe style={{ width: '16px', height: '16px' }} />
                            <Text>Public</Text>
                          </Group>
                        )
                      }
                    ]}
                    {...form.getInputProps('privacySetting')}
                  />

                  <Text size="xs" color="dimmed" mt="xs">
                    {form.values.privacySetting === RPGWorldPrivacy.PRIVATE &&
                      'Only you and invited GMs can view this world'}
                    {form.values.privacySetting === RPGWorldPrivacy.SHARED &&
                      'Players in campaigns can view world-level information'}
                    {form.values.privacySetting === RPGWorldPrivacy.PUBLIC &&
                      'Anyone can view this world and its public content'}
                  </Text>
                </Box>

                <Switch
                  label="Shared Lore"
                  description="When enabled, lore entries are shared across all campaigns in this world"
                  {...form.getInputProps('sharedLore', { type: 'checkbox' })}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Divider />

          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Update World' : 'Create World'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

export default RPGWorldForm;