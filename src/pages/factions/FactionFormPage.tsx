import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Select,
  MultiSelect,
  Paper,
  Divider,
  Alert,
  Chip,
  FileInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUpload } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { FactionService } from '../../services/faction.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { Faction, FactionType, FactionRelationshipType } from '../../models/Faction';
import { Character } from '../../models/Character';
import { Location } from '../../models/Location';
import { Item } from '../../models/Item';
import { EntityType } from '../../models/EntityType';
import { ModelEntityType } from '../../models/ModelEntityType';

/**
 * Faction Form Page
 * Used for creating and editing factions
 */
export function FactionFormPage() {
  const { id, worldId = '' } = useParams<{ id?: string; worldId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEditMode = !!id;

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      factionType: FactionType.GUILD,
      motto: '',
      goals: [] as string[],
      resources: '',
      scope: '',
      leaderId: '',
      leaderTitle: '',
      memberIds: [] as string[],
      headquartersId: '',
      territoryIds: [] as string[],
      itemIds: [] as string[],
      secretNotes: '',
      hiddenGoals: [] as string[],
      imageURL: ''
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      factionType: (value) => (value ? null : 'Faction type is required')
    }
  });

  // Load faction data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!worldId) {
        setError('No world ID provided');
        return;
      }

      try {
        // Load characters, locations, items, and factions for select fields
        const characterService = CharacterService.getInstance(worldId, 'default-campaign');
        const locationService = LocationService.getInstance(worldId, 'default-campaign');
        const itemService = ItemService.getInstance(worldId, 'default-campaign');
        const factionService = FactionService.getInstance(worldId, 'default-campaign');

        const [charactersData, locationsData, itemsData, factionsData] = await Promise.all([
          characterService.listEntities(),
          locationService.listEntities(),
          itemService.listEntities(),
          factionService.listEntities()
        ]);

        // Add entityType to each character
        setCharacters(charactersData.map(character => ({
          ...character,
          entityType: EntityType.CHARACTER,
          characterType: character.type || 'Other'
        })));

        // Add entityType to each location
        setLocations(locationsData.map(location => ({
          ...location,
          entityType: EntityType.LOCATION,
          locationType: location.locationType || location.type || 'Other'
        })));

        // Add entityType to each item
        setItems(itemsData.map(item => ({
          ...item,
          entityType: EntityType.ITEM,
          itemType: item.type || 'Other'
        })));
        setFactions(factionsData);

        // If in edit mode, load faction data
        if (isEditMode && id) {
          setLoading(true);
          const faction = await factionService.getById(id);

          if (faction) {
            form.setValues({
              name: faction.name || '',
              description: faction.description || '',
              factionType: faction.factionType || FactionType.GUILD,
              motto: faction.motto || '',
              goals: faction.goals || [],
              resources: faction.resources || '',
              scope: faction.scope || '',
              leaderId: faction.leaderId || '',
              leaderTitle: faction.leaderTitle || '',
              memberIds: faction.memberIds || [],
              headquartersId: faction.headquartersId || '',
              territoryIds: faction.territoryIds || [],
              itemIds: faction.itemIds || [],
              secretNotes: faction.secretNotes || '',
              hiddenGoals: faction.hiddenGoals || [],
              imageURL: faction.imageURL || ''
            });
          } else {
            setError('Faction not found');
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId, id, isEditMode]);

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    if (!currentUser) {
      setError('You must be logged in to create or edit a faction');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const factionService = FactionService.getInstance(worldId, 'default-campaign');

      // Handle image upload if needed
      let imageURL = values.imageURL;
      if (imageFile) {
        // In a real implementation, you would upload the image to storage
        // and get the URL. For now, we'll just use a placeholder.
        imageURL = URL.createObjectURL(imageFile);
      }

      // Prepare faction data
      const factionData: Partial<Faction> = {
        name: values.name,
        description: values.description,
        factionType: values.factionType,
        motto: values.motto,
        goals: values.goals,
        resources: values.resources,
        scope: values.scope,
        leaderId: values.leaderId || undefined,
        leaderTitle: values.leaderTitle || undefined,
        memberIds: values.memberIds.length > 0 ? values.memberIds : undefined,
        headquartersId: values.headquartersId || undefined,
        territoryIds: values.territoryIds.length > 0 ? values.territoryIds : undefined,
        itemIds: values.itemIds.length > 0 ? values.itemIds : undefined,
        secretNotes: values.secretNotes || undefined,
        hiddenGoals: values.hiddenGoals.length > 0 ? values.hiddenGoals : undefined,
        imageURL: imageURL || undefined,
        entityType: EntityType.FACTION
      };

      if (isEditMode && id) {
        // Update existing faction
        await factionService.update(id, factionData);
        notifications.show({
          title: 'Success',
          message: 'Faction updated successfully',
          color: 'green'
        });
      } else {
        // Create new faction
        const newFaction = await factionService.createEntity({
          ...factionData as any,
          createdBy: currentUser.uid,
          worldId,
          campaignId: 'default-campaign'
        });

        notifications.show({
          title: 'Success',
          message: 'Faction created successfully',
          color: 'green'
        });

        // Navigate to the new faction
        if (newFaction) {
          navigate(`/rpg-worlds/${worldId}/factions/${newFaction}`);
          return;
        }
      }

      // Navigate back to factions list
      navigate(`/rpg-worlds/${worldId}/factions`);
    } catch (err) {
      console.error('Error saving faction:', err);
      setError('Failed to save faction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a goal
  const handleAddGoal = (goal: string) => {
    if (goal.trim()) {
      form.setFieldValue('goals', [...form.values.goals, goal.trim()]);
    }
  };

  // Handle adding a hidden goal
  const handleAddHiddenGoal = (goal: string): string => {
    if (goal.trim()) {
      form.setFieldValue('hiddenGoals', [...form.values.hiddenGoals, goal.trim()]);
      return goal.trim();
    }
    return '';
  };

  return (
    <Container size="md">
      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Title order={2}>{isEditMode ? 'Edit Faction' : 'Create New Faction'}</Title>

            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                {error}
              </Alert>
            )}

            <TextInput
              required
              label="Faction Name"
              placeholder="Enter faction name"
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Describe the faction"
              minRows={3}
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                required
                label="Faction Type"
                placeholder="Select faction type"
                data={Object.values(FactionType).map(type => ({
                  value: type,
                  label: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')
                }))}
                {...form.getInputProps('factionType')}
              />

              <TextInput
                label="Motto"
                placeholder="Faction motto or slogan"
                {...form.getInputProps('motto')}
              />
            </Group>

            <Group grow>
              <TextInput
                label="Scope"
                placeholder="Local, regional, global, etc."
                {...form.getInputProps('scope')}
              />

              <TextInput
                label="Resources"
                placeholder="Wealth, influence, military, etc."
                {...form.getInputProps('resources')}
              />
            </Group>

            <Divider label="Leadership & Membership" />

            <Group grow>
              <Select
                label="Leader"
                placeholder="Select faction leader"
                data={characters.map(character => ({
                  value: character.id || '',
                  label: character.name || 'Unnamed Character'
                }))}
                searchable
                clearable
                {...form.getInputProps('leaderId')}
              />

              <TextInput
                label="Leader Title"
                placeholder="King, Guildmaster, etc."
                {...form.getInputProps('leaderTitle')}
              />
            </Group>

            <MultiSelect
              label="Members"
              placeholder="Select faction members"
              data={characters.map(character => ({
                value: character.id || '',
                label: character.name || 'Unnamed Character'
              }))}
              searchable
              clearable
              {...form.getInputProps('memberIds')}
            />

            <Divider label="Location" />

            <Group grow>
              <Select
                label="Headquarters"
                placeholder="Select faction headquarters"
                data={locations.map(location => ({
                  value: location.id || '',
                  label: location.name || 'Unnamed Location'
                }))}
                searchable
                clearable
                {...form.getInputProps('headquartersId')}
              />
            </Group>

            <MultiSelect
              label="Territories"
              placeholder="Select faction territories"
              data={locations.map(location => ({
                value: location.id || '',
                label: location.name || 'Unnamed Location'
              }))}
              searchable
              clearable
              {...form.getInputProps('territoryIds')}
            />

            <Divider label="Assets" />

            <MultiSelect
              label="Items"
              placeholder="Select faction items"
              data={items.map(item => ({
                value: item.id || '',
                label: item.name || 'Unnamed Item'
              }))}
              searchable
              clearable
              {...form.getInputProps('itemIds')}
            />

            <FileInput
              label="Faction Image"
              placeholder="Upload faction image"
              accept="image/*"
              leftSection={<IconUpload size="1rem" />}
              value={imageFile}
              onChange={setImageFile}
            />

            <Divider label="Secret Information (GM Only)" />

            <Textarea
              label="Secret Notes"
              placeholder="Hidden information about the faction"
              minRows={3}
              {...form.getInputProps('secretNotes')}
            />

            <MultiSelect
              label="Hidden Goals"
              placeholder="Add hidden faction goals"
              data={form.values.hiddenGoals.map(goal => ({ value: goal, label: goal }))}
              searchable
              comboboxProps={{
                withinPortal: true,
                transitionProps: { transition: 'pop', duration: 200 },
                getCreateLabel: (query) => `+ Add "${query}"`,
                onCreate: handleAddHiddenGoal
              }}
              {...form.getInputProps('hiddenGoals')}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => navigate(`/rpg-worlds/${worldId}/factions`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEditMode ? 'Update Faction' : 'Create Faction'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default FactionFormPage;
