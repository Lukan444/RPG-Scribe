import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignIdFromParams } from '../../utils/routeUtils';
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Select,
  NumberInput,
  MultiSelect,
  Paper,
  Divider,
  Alert,
  FileInput,
  Chip,
  Table
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUpload, IconPlus, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { StoryArcService } from '../../services/storyArc.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { FactionService } from '../../services/faction.service';
import { SessionService } from '../../services/session.service';
import { StoryArc, StoryArcType, StoryArcStatus, Clue } from '../../models/StoryArc';
import { Character } from '../../models/Character';
import { Location } from '../../models/Location';
import { Item } from '../../models/Item';
import { Faction } from '../../models/Faction';
import { Session } from '../../models/Session';
import { EntityType } from '../../models/EntityType';
import { ModelEntityType } from '../../models/ModelEntityType';

/**
 * Story Arc Form Page
 * Used for creating and editing story arcs
 */
export function StoryArcFormPage() {
  const { id, worldId = '', campaignId } = useParams<{ id?: string; worldId: string; campaignId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEditMode = !!id;
  const currentCampaignId = getCampaignIdFromParams({ campaignId });

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [storyArcs, setStoryArcs] = useState<StoryArc[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [newClue, setNewClue] = useState<Partial<Clue>>({
    id: '',
    description: '',
    discovered: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      arcType: StoryArcType.MAIN_PLOT,
      status: StoryArcStatus.UPCOMING,
      parentArcId: '',
      startSessionId: '',
      endSessionId: '',
      relatedSessionIds: [] as string[],
      importance: 5,
      resolution: '',
      nextSteps: '',
      characterIds: [] as string[],
      locationIds: [] as string[],
      itemIds: [] as string[],
      factionIds: [] as string[],
      imageURL: ''
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      arcType: (value) => (value ? null : 'Story arc type is required'),
      status: (value) => (value ? null : 'Status is required'),
      importance: (value) => (value >= 1 && value <= 10 ? null : 'Importance must be between 1 and 10')
    }
  });

  // Load story arc data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!worldId) {
        setError('No world ID provided');
        return;
      }

      try {
        // Load related entities for select fields
        const characterService = CharacterService.getInstance(worldId, currentCampaignId);
        const locationService = LocationService.getInstance(worldId, currentCampaignId);
        const itemService = ItemService.getInstance(worldId, currentCampaignId);
        const factionService = FactionService.getInstance(worldId, currentCampaignId);
        const sessionService = SessionService.getInstance(worldId, currentCampaignId);
        const storyArcService = StoryArcService.getInstance(worldId, currentCampaignId);

        const [
          charactersData,
          locationsData,
          itemsData,
          factionsData,
          sessionsData,
          storyArcsData
        ] = await Promise.all([
          characterService.listEntities(),
          locationService.listEntities(),
          itemService.listEntities(),
          factionService.listEntities(),
          sessionService.listEntities(),
          storyArcService.listEntities()
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

        // Add entityType to each session
        setSessions(sessionsData.map(session => ({
          ...session,
          entityType: EntityType.SESSION,
          name: session.title || `Session #${session.number}`
        })));

        setStoryArcs(storyArcsData);

        // If in edit mode, load story arc data
        if (isEditMode && id) {
          setLoading(true);
          const storyArc = await storyArcService.getById(id);

          if (storyArc) {
            form.setValues({
              name: storyArc.name || '',
              description: storyArc.description || '',
              arcType: storyArc.arcType || StoryArcType.MAIN_PLOT,
              status: storyArc.status || StoryArcStatus.UPCOMING,
              parentArcId: storyArc.parentArcId || '',
              startSessionId: storyArc.startSessionId || '',
              endSessionId: storyArc.endSessionId || '',
              relatedSessionIds: storyArc.relatedSessionIds || [],
              importance: storyArc.importance || 5,
              resolution: storyArc.resolution || '',
              nextSteps: storyArc.nextSteps || '',
              characterIds: storyArc.characterIds || [],
              locationIds: storyArc.locationIds || [],
              itemIds: storyArc.itemIds || [],
              factionIds: storyArc.factionIds || [],
              imageURL: storyArc.imageURL || ''
            });

            if (storyArc.clues && storyArc.clues.length > 0) {
              setClues(storyArc.clues);
            }
          } else {
            setError('Story arc not found');
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
  }, [worldId, id, isEditMode, currentCampaignId]);

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    if (!currentUser) {
      setError('You must be logged in to create or edit a story arc');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storyArcService = StoryArcService.getInstance(worldId, currentCampaignId);

      // Handle image upload if needed
      let imageURL = values.imageURL;
      if (imageFile) {
        // In a real implementation, you would upload the image to storage
        // and get the URL. For now, we'll just use a placeholder.
        imageURL = URL.createObjectURL(imageFile);
      }

      // Prepare story arc data
      const storyArcData: Partial<StoryArc> = {
        name: values.name,
        description: values.description,
        arcType: values.arcType,
        status: values.status,
        parentArcId: values.parentArcId || undefined,
        startSessionId: values.startSessionId || undefined,
        endSessionId: values.endSessionId || undefined,
        relatedSessionIds: values.relatedSessionIds.length > 0 ? values.relatedSessionIds : undefined,
        importance: values.importance,
        resolution: values.resolution || undefined,
        nextSteps: values.nextSteps || undefined,
        characterIds: values.characterIds.length > 0 ? values.characterIds : undefined,
        locationIds: values.locationIds.length > 0 ? values.locationIds : undefined,
        itemIds: values.itemIds.length > 0 ? values.itemIds : undefined,
        factionIds: values.factionIds.length > 0 ? values.factionIds : undefined,
        clues: clues.length > 0 ? clues : undefined,
        imageURL: imageURL || undefined,
        entityType: EntityType.STORY_ARC
      };

      if (isEditMode && id) {
        // Update existing story arc
        await storyArcService.update(id, storyArcData);
        notifications.show({
          title: 'Success',
          message: 'Story arc updated successfully',
          color: 'green'
        });
      } else {
        // Create new story arc
        const newStoryArc = await storyArcService.createEntity({
          ...storyArcData as any,
          createdBy: currentUser.uid,
          worldId,
          campaignId: currentCampaignId
        });

        notifications.show({
          title: 'Success',
          message: 'Story arc created successfully',
          color: 'green'
        });

        // Navigate to the new story arc
        if (newStoryArc) {
          navigate(`/rpg-worlds/${worldId}/story-arcs/${newStoryArc}`);
          return;
        }
      }

      // Navigate back to story arcs list
      navigate(`/rpg-worlds/${worldId}/story-arcs`);
    } catch (err) {
      console.error('Error saving story arc:', err);
      setError('Failed to save story arc. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a clue
  const handleAddClue = () => {
    if (newClue.description?.trim()) {
      const clueId = `clue-${Date.now()}`;
      const clueToAdd: Clue = {
        id: clueId,
        description: newClue.description.trim(),
        discovered: newClue.discovered || false,
        sessionId: newClue.sessionId,
        locationId: newClue.locationId,
        characterId: newClue.characterId,
        itemId: newClue.itemId
      };

      setClues([...clues, clueToAdd]);
      setNewClue({
        id: '',
        description: '',
        discovered: false
      });
    }
  };

  // Handle removing a clue
  const handleRemoveClue = (clueId: string) => {
    setClues(clues.filter(clue => clue.id !== clueId));
  };

  return (
    <Container size="md">
      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Title order={2}>{isEditMode ? 'Edit Story Arc' : 'Create New Story Arc'}</Title>

            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                {error}
              </Alert>
            )}

            <TextInput
              required
              label="Story Arc Name"
              placeholder="Enter story arc name"
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Describe the story arc"
              minRows={3}
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                required
                label="Arc Type"
                placeholder="Select arc type"
                data={Object.values(StoryArcType).map(type => ({
                  value: type,
                  label: type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
                }))}
                {...form.getInputProps('arcType')}
              />

              <Select
                required
                label="Status"
                placeholder="Select status"
                data={Object.values(StoryArcStatus).map(status => ({
                  value: status,
                  label: status.charAt(0) + status.slice(1).toLowerCase()
                }))}
                {...form.getInputProps('status')}
              />
            </Group>

            <NumberInput
              label="Importance (1-10)"
              placeholder="Rate importance from 1 to 10"
              min={1}
              max={10}
              {...form.getInputProps('importance')}
            />

            <Select
              label="Parent Story Arc"
              placeholder="Select parent story arc (optional)"
              data={storyArcs
                .filter(arc => arc.id !== id) // Exclude current arc to prevent circular reference
                .map(arc => ({
                  value: arc.id || '',
                  label: arc.name || 'Unnamed Story Arc'
                })) as any}
              searchable
              clearable
              {...form.getInputProps('parentArcId')}
            />

            <Divider label="Timeline" />

            <Group grow>
              <Select
                label="Starting Session"
                placeholder="Select starting session"
                data={sessions.map(session => ({
                  value: session.id!,
                  label: `Session #${session.number}: ${session.title}`
                }))}
                searchable
                clearable
                {...form.getInputProps('startSessionId')}
              />

              <Select
                label="Ending Session"
                placeholder="Select ending session"
                data={sessions.map(session => ({
                  value: session.id!,
                  label: `Session #${session.number}: ${session.title}`
                }))}
                searchable
                clearable
                {...form.getInputProps('endSessionId')}
              />
            </Group>

            <MultiSelect
              label="Related Sessions"
              placeholder="Select related sessions"
              data={sessions.map(session => ({
                value: session.id!,
                label: `Session #${session.number}: ${session.title}`
              }))}
              searchable
              clearable
              {...form.getInputProps('relatedSessionIds')}
            />

            <Divider label="Clues & Mysteries" />

            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Discovered</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clues.map((clue) => (
                  <Table.Tr key={clue.id}>
                    <Table.Td>{clue.description}</Table.Td>
                    <Table.Td>{clue.discovered ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        leftSection={<IconTrash size="0.8rem" />}
                        onClick={() => handleRemoveClue(clue.id)}
                      >
                        Remove
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Td>
                    <TextInput
                      placeholder="New clue description"
                      value={newClue.description || ''}
                      onChange={(e) => setNewClue({...newClue, description: e.currentTarget.value})}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Chip
                      checked={newClue.discovered || false}
                      onChange={() => setNewClue({...newClue, discovered: !newClue.discovered})}
                    >
                      Discovered
                    </Chip>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      leftSection={<IconPlus size="0.8rem" />}
                      onClick={handleAddClue}
                      disabled={!newClue.description?.trim()}
                    >
                      Add Clue
                    </Button>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>

            <Divider label="Resolution & Next Steps" />

            <Textarea
              label="Resolution"
              placeholder="How was or will this arc be resolved?"
              minRows={3}
              {...form.getInputProps('resolution')}
            />

            <Textarea
              label="Next Steps"
              placeholder="GM notes on planned next events"
              minRows={3}
              {...form.getInputProps('nextSteps')}
            />

            <Divider label="Related Entities" />

            <MultiSelect
              label="Characters"
              placeholder="Select related characters"
              data={characters.map(character => ({
                value: character.id || '',
                label: character.name || 'Unnamed Character'
              })) as any}
              searchable
              clearable
              {...form.getInputProps('characterIds')}
            />

            <MultiSelect
              label="Locations"
              placeholder="Select related locations"
              data={locations.map(location => ({
                value: location.id || '',
                label: location.name || 'Unnamed Location'
              })) as any}
              searchable
              clearable
              {...form.getInputProps('locationIds')}
            />

            <MultiSelect
              label="Items"
              placeholder="Select related items"
              data={items.map(item => ({
                value: item.id || '',
                label: item.name || 'Unnamed Item'
              })) as any}
              searchable
              clearable
              {...form.getInputProps('itemIds')}
            />

            <MultiSelect
              label="Factions"
              placeholder="Select related factions"
              data={factions.map(faction => ({
                value: faction.id || '',
                label: faction.name || 'Unnamed Faction'
              })) as any}
              searchable
              clearable
              {...form.getInputProps('factionIds')}
            />

            <FileInput
              label="Story Arc Image"
              placeholder="Upload image"
              accept="image/*"
              leftSection={<IconUpload size="1rem" />}
              value={imageFile}
              onChange={setImageFile}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => navigate(`/rpg-worlds/${worldId}/story-arcs`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEditMode ? 'Update Story Arc' : 'Create Story Arc'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default StoryArcFormPage;
