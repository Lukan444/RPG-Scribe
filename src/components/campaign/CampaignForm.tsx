import React, { useState, useEffect } from 'react';
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
  SegmentedControl,
  Tooltip,
  Tabs,
  Chip,
  Avatar,
  rem
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconUpload,
  IconBook,
  IconLock,
  IconWorld,
  IconCalendar,
  IconUsers,
  IconInfoCircle,
  IconSettings
} from '@tabler/icons-react';
import { Campaign, CampaignCreationParams, CampaignUpdateParams, CampaignStatus, CampaignPrivacy } from '../../models/Campaign';
import { RPGWorld } from '../../models/RPGWorld';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { useAuth } from '../../contexts/AuthContext';

// Campaign status options
const CAMPAIGN_STATUS_OPTIONS = [
  { value: CampaignStatus.PLANNING, label: 'Planning' },
  { value: CampaignStatus.ACTIVE, label: 'Active' },
  { value: CampaignStatus.PAUSED, label: 'Paused' },
  { value: CampaignStatus.COMPLETED, label: 'Completed' },
  { value: CampaignStatus.ABANDONED, label: 'Abandoned' },
  { value: CampaignStatus.ARCHIVED, label: 'Archived' }
];

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

// Tag options
const TAG_OPTIONS = [
  { value: 'homebrew', label: 'Homebrew' },
  { value: 'official', label: 'Official Adventure' },
  { value: 'oneshot', label: 'One-Shot' },
  { value: 'longterm', label: 'Long-Term' },
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
interface CampaignFormProps {
  worldId?: string;
  initialValues?: Partial<CampaignCreationParams>;
  onSubmit: (values: CampaignCreationParams | CampaignUpdateParams) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

// User interface for player selection
interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

/**
 * Campaign Form Component
 */
export function CampaignForm({
  worldId,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false
}: CampaignFormProps) {
  // State
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('basic');
  const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
  const [campaignBannerFile, setCampaignBannerFile] = useState<File | null>(null);
  const [worlds, setWorlds] = useState<RPGWorld[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<RPGWorld | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Services
  const rpgWorldService = new RPGWorldService();

  // Fetch RPG Worlds
  useEffect(() => {
    const fetchWorlds = async () => {
      if (!currentUser) return;

      try {
        const userWorlds = await rpgWorldService.getWorldsByUser(currentUser.uid);
        setWorlds(userWorlds);

        // If worldId is provided, find and set the selected world
        if (worldId) {
          const world = userWorlds.find(w => w.id === worldId);
          if (world) {
            setSelectedWorld(world);
          }
        }

        // If editing and initialValues has worldId, find and set the selected world
        if (isEditing && initialValues?.worldId) {
          const world = userWorlds.find(w => w.id === initialValues.worldId);
          if (world) {
            setSelectedWorld(world);
          }
        }
      } catch (error) {
        console.error('Error fetching RPG Worlds:', error);
      }
    };

    fetchWorlds();
  }, [currentUser, worldId, isEditing, initialValues?.worldId]);

  // Fetch available users
  useEffect(() => {
    // TODO: Implement user fetching from Firebase Auth
    // For now, just use a mock list
    setAvailableUsers([
      {
        id: currentUser?.uid || 'current-user',
        displayName: currentUser?.displayName || 'Current User',
        email: currentUser?.email || 'user@example.com',
        photoURL: currentUser?.photoURL || undefined
      },
      {
        id: 'user1',
        displayName: 'John Doe',
        email: 'john@example.com'
      },
      {
        id: 'user2',
        displayName: 'Jane Smith',
        email: 'jane@example.com'
      }
    ]);
  }, [currentUser]);

  // Form validation and state
  const form = useForm({
    initialValues: {
      // Core fields
      worldId: initialValues?.worldId || worldId || '',
      name: initialValues?.name || '',

      // Content fields
      description: initialValues?.description || '',
      setting: initialValues?.setting || '',
      system: initialValues?.system || '',
      systemVersion: initialValues?.systemVersion || '',

      // Status and timeline
      status: initialValues?.status || CampaignStatus.PLANNING,
      startDate: initialValues?.startDate || null,
      endDate: initialValues?.endDate || null,

      // Media and metadata
      imageURL: initialValues?.imageURL || '',
      bannerURL: initialValues?.bannerURL || '',
      tags: initialValues?.tags || [],

      // Configuration
      privacySetting: initialValues?.privacySetting || CampaignPrivacy.PRIVATE,

      // Player management
      playerIds: initialValues?.playerIds || [],
      gmIds: initialValues?.gmIds || []
    },
    validate: {
      worldId: (value: string) => (!value ? 'Please select an RPG World' : null),
      name: (value: string) => (value.trim().length < 3 ? 'Name must be at least 3 characters' : null),
      description: (value: string) => (value.trim().length < 10 ? 'Description must be at least 10 characters' : null)
    }
  });

  // Update form values when selected world changes
  useEffect(() => {
    if (selectedWorld && !isEditing) {
      form.setValues({
        ...form.values,
        setting: form.values.setting || selectedWorld.setting,
        system: form.values.system || selectedWorld.system,
        systemVersion: form.values.systemVersion || selectedWorld.systemVersion
      });
    }
  }, [selectedWorld, isEditing]);

  // Handle world selection
  const handleWorldChange = (worldId: string | null) => {
    if (worldId) {
      const world = worlds.find(w => w.id === worldId);
      setSelectedWorld(world || null);
      form.setFieldValue('worldId', worldId);
    } else {
      setSelectedWorld(null);
      form.setFieldValue('worldId', '');
    }
  };

  // Handle form submission
  const handleSubmit = form.onSubmit(async (values) => {
    // TODO: Handle image upload to storage and get URL
    // For now, just pass the existing imageURL and bannerURL
    onSubmit(values);
  });

  // Get world options for select
  const worldOptions = worlds.map(world => ({
    value: world.id!,
    label: world.name
  }));

  // Get user options for select
  const userOptions = availableUsers.map(user => ({
    value: user.id,
    label: user.displayName || user.email,
    // Store photoURL in a custom property that will be accessible in renderOption
    photoURL: user.photoURL
  }));

  return (
    <Paper p="md" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group justify="space-between">
            <Box>
              <Title order={3}>{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</Title>
              <Text c="dimmed" size="sm">
                {isEditing
                  ? 'Update your campaign details'
                  : 'Create a new campaign to start your adventure'}
              </Text>
            </Box>
            <IconBook style={{ width: '32px', height: '32px' }} color="var(--mantine-color-blue-6)" />
          </Group>

          <Divider />

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="basic" leftSection={<IconBook style={{ width: '16px', height: '16px' }} />}>
                Basic Information
              </Tabs.Tab>
              <Tabs.Tab value="media" leftSection={<IconUpload style={{ width: '16px', height: '16px' }} />}>
                Media
              </Tabs.Tab>
              <Tabs.Tab value="timeline" leftSection={<IconCalendar style={{ width: '16px', height: '16px' }} />}>
                Timeline
              </Tabs.Tab>
              <Tabs.Tab value="players" leftSection={<IconUsers style={{ width: '16px', height: '16px' }} />}>
                Players
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<IconSettings style={{ width: '16px', height: '16px' }} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <Stack gap="md">
                {/* World Selection (only if worldId is not provided) */}
                {!worldId && (
                  <Select
                    required
                    label="RPG World"
                    placeholder="Select an RPG World"
                    data={worldOptions}
                    value={form.values.worldId}
                    onChange={handleWorldChange}
                    error={form.errors.worldId}
                  />
                )}

                <TextInput
                  required
                  label="Campaign Name"
                  placeholder="Enter a name for your campaign"
                  {...form.getInputProps('name')}
                />

                <Textarea
                  required
                  label="Description"
                  placeholder="Describe your campaign"
                  minRows={3}
                  {...form.getInputProps('description')}
                />

                <TextInput
                  label="Setting"
                  placeholder="The setting of your campaign"
                  {...form.getInputProps('setting')}
                  description={selectedWorld ? `Inherited from world: ${selectedWorld.setting}` : ''}
                />

                <Group grow>
                  <Select
                    label="Game System"
                    placeholder="Select a game system"
                    data={GAME_SYSTEMS}
                    {...form.getInputProps('system')}
                    description={selectedWorld ? `Inherited from world: ${selectedWorld.system}` : ''}
                  />

                  <TextInput
                    label="System Version"
                    placeholder="e.g., 5th Edition, 2nd Edition"
                    {...form.getInputProps('systemVersion')}
                    description={selectedWorld?.systemVersion ? `Inherited from world: ${selectedWorld.systemVersion}` : ''}
                  />
                </Group>

                <MultiSelect
                  label="Tags"
                  placeholder="Select tags for your campaign"
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
                  label="Campaign Cover Image"
                  placeholder="Upload a cover image for your campaign"
                  accept="image/png,image/jpeg,image/webp"
                  leftSection={<IconUpload style={{ width: '14px', height: '14px' }} />}
                  value={campaignImageFile}
                  onChange={setCampaignImageFile}
                  description="This image will be displayed as the cover for your campaign"
                />

                <FileInput
                  label="Campaign Banner"
                  placeholder="Upload a banner image for your campaign"
                  accept="image/png,image/jpeg,image/webp"
                  leftSection={<IconUpload style={{ width: '14px', height: '14px' }} />}
                  value={campaignBannerFile}
                  onChange={setCampaignBannerFile}
                  description="This image will be displayed at the top of your campaign page"
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="md">
              <Stack gap="md">
                <Select
                  label="Campaign Status"
                  placeholder="Select the current status of your campaign"
                  data={CAMPAIGN_STATUS_OPTIONS}
                  {...form.getInputProps('status')}
                />

                <Group grow>
                  <DatePickerInput
                    label="Start Date"
                    placeholder="When did/will the campaign start?"
                    valueFormat="MMMM D, YYYY"
                    clearable
                    {...form.getInputProps('startDate')}
                  />

                  <DatePickerInput
                    label="End Date"
                    placeholder="When did/will the campaign end?"
                    valueFormat="MMMM D, YYYY"
                    clearable
                    minDate={form.values.startDate ? new Date(form.values.startDate) : undefined}
                    {...form.getInputProps('endDate')}
                  />
                </Group>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="players" pt="md">
              <Stack gap="md">
                <Box>
                  <Text fw={500} size="sm" mb="xs">Game Masters</Text>
                  <MultiSelect
                    data={userOptions}
                    placeholder="Select game masters"
                    searchable
                    {...form.getInputProps('gmIds')}
                  />
                  <Text size="xs" c="dimmed" mt="xs">
                    Game masters have full control over the campaign
                  </Text>
                </Box>

                <Box>
                  <Text fw={500} size="sm" mb="xs">Players</Text>
                  <MultiSelect
                    data={userOptions}
                    placeholder="Select players"
                    searchable
                    {...form.getInputProps('playerIds')}
                  />
                  <Text size="xs" c="dimmed" mt="xs">
                    Players can view the campaign and participate in sessions
                  </Text>
                </Box>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="md">
              <Stack gap="md">
                <Box>
                  <Group mb="xs">
                    <Text fw={500} size="sm">Privacy Setting</Text>
                    <Tooltip
                      label="Controls who can view this campaign"
                      position="top"
                    >
                      <IconInfoCircle style={{ width: '16px', height: '16px', opacity: 0.5 }} />
                    </Tooltip>
                  </Group>

                  <SegmentedControl
                    fullWidth
                    data={[
                      {
                        value: CampaignPrivacy.PRIVATE,
                        label: (
                          <Group gap="xs" wrap="nowrap">
                            <IconLock style={{ width: '16px', height: '16px' }} />
                            <Text>Private</Text>
                          </Group>
                        )
                      },
                      {
                        value: CampaignPrivacy.PUBLIC,
                        label: (
                          <Group gap="xs" wrap="nowrap">
                            <IconWorld style={{ width: '16px', height: '16px' }} />
                            <Text>Public</Text>
                          </Group>
                        )
                      }
                    ]}
                    {...form.getInputProps('privacySetting')}
                  />

                  <Text size="xs" c="dimmed" mt="xs">
                    {form.values.privacySetting === CampaignPrivacy.PRIVATE &&
                      'Only GMs and players can view this campaign'}
                    {form.values.privacySetting === CampaignPrivacy.PUBLIC &&
                      'Anyone can view this campaign and its public content'}
                  </Text>
                </Box>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Divider />

          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

export default CampaignForm;