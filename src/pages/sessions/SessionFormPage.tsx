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
  NumberInput,
  MultiSelect,
  Paper,
  Divider,
  Alert,
  Checkbox
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCalendarEvent, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { SessionService } from '../../services/session.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { EventService } from '../../services/event.service';
import { Session } from '../../models/Session';
import { Character } from '../../models/Character';
import { Location } from '../../models/Location';
import { Event } from '../../models/Event';
import { EntityType } from '../../models/EntityType';
import { ModelEntityType } from '../../models/ModelEntityType';
import { EventType } from '../../models/EventType';
import { mapEntitiesToComboboxItems } from '../../utils/comboboxUtils';

/**
 * Session Form Page
 * Used for creating and editing sessions
 */
export function SessionFormPage() {
  const { id, worldId = '' } = useParams<{ id?: string; worldId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEditMode = !!id;

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Form
  const form = useForm({
    initialValues: {
      title: '',
      number: 1,
      datePlayed: null as Date | null,
      status: 'planned',
      summary: '',
      notes: '',
      dmNotes: '',
      duration: 240, // 4 hours default
      participants: [] as string[],
      locations: [] as string[],
      events: [] as string[]
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : 'Title is required'),
      number: (value) => (value > 0 ? null : 'Session number must be positive'),
      datePlayed: (value) => (value ? null : 'Date is required')
    }
  });

  // Load session data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!worldId) {
        setError('No world ID provided');
        return;
      }

      try {
        // Load characters, locations, and events for select fields
        const characterService = CharacterService.getInstance(worldId, 'default-campaign');
        const locationService = LocationService.getInstance(worldId, 'default-campaign');
        const eventService = EventService.getInstance(worldId, 'default-campaign');

        const [charactersData, locationsData, eventsData] = await Promise.all([
          characterService.listEntities(),
          locationService.listEntities(),
          eventService.listEntities()
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

        // Add entityType to each event
        setEvents(eventsData.map(event => ({
          ...event,
          entityType: EntityType.EVENT,
          eventType: event.type ? (event.type as EventType) : EventType.OTHER,
          timelinePosition: event.timelinePosition || 0
        })));

        // If in edit mode, load session data
        if (isEditMode && id) {
          setLoading(true);
          const sessionService = SessionService.getInstance(worldId, 'default-campaign');
          const session = await sessionService.getById(id);

          if (session) {
            // Convert participant IDs to string array
            const participantIds = session.participants?.map(p => p.id) || [];

            // Convert location IDs to string array
            const locationIds = session.locations?.map(l => l.id) || [];

            // Convert event IDs to string array
            const eventIds = session.events?.map(e => e.id) || [];

            form.setValues({
              title: session.title || '',
              number: session.number || 1,
              datePlayed: session.datePlayed ? new Date(session.datePlayed) : null,
              status: session.status || 'planned',
              summary: session.summary || '',
              notes: session.notes || '',
              dmNotes: session.dmNotes || '',
              duration: session.duration || 240,
              participants: participantIds,
              locations: locationIds,
              events: eventIds
            });
          } else {
            setError('Session not found');
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
      setError('You must be logged in to create or edit a session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessionService = SessionService.getInstance(worldId, 'default-campaign');

      // Prepare session data
      const sessionData: Partial<Session> = {
        title: values.title,
        number: values.number,
        datePlayed: values.datePlayed,
        status: values.status as 'planned' | 'completed' | 'cancelled',
        summary: values.summary,
        notes: values.notes,
        dmNotes: values.dmNotes,
        duration: values.duration,
        // Convert participant IDs to participant objects
        participants: values.participants.map(id => {
          const character = characters.find(c => c.id === id);
          return {
            id,
            name: character?.name || 'Unknown Character'
          };
        }),
        // Convert location IDs to location objects
        locations: values.locations.map(id => {
          const location = locations.find(l => l.id === id);
          return {
            id,
            name: location?.name || 'Unknown Location',
            type: location?.locationType || 'Unknown'
          };
        }),
        // Convert event IDs to event objects
        events: values.events.map(id => {
          const event = events.find(e => e.id === id);
          return {
            id,
            name: event?.name || 'Unknown Event',
            type: event?.eventType || 'Unknown'
          };
        })
      };

      if (isEditMode && id) {
        // Update existing session
        // Cast the status to the expected type to fix the type mismatch
        const typedSessionData = {
          ...sessionData,
          status: sessionData.status as 'planned' | 'completed' | 'cancelled'
        };
        await sessionService.update(id, typedSessionData);
        notifications.show({
          title: 'Success',
          message: 'Session updated successfully',
          color: 'green'
        });
      } else {
        // Create new session
        const newSession = await sessionService.create({
          ...sessionData as any,
          createdBy: currentUser.uid,
          worldId,
          campaignId: 'default-campaign'
        });

        notifications.show({
          title: 'Success',
          message: 'Session created successfully',
          color: 'green'
        });

        // Navigate to the new session
        if (newSession) {
          navigate(`/rpg-worlds/${worldId}/sessions/${newSession}`);
          return;
        }
      }

      // Navigate back to sessions list
      navigate(`/rpg-worlds/${worldId}/sessions`);
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Failed to save session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md">
      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Title order={2}>{isEditMode ? 'Edit Session' : 'Create New Session'}</Title>

            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                {error}
              </Alert>
            )}

            <TextInput
              required
              label="Session Title"
              placeholder="Enter session title"
              {...form.getInputProps('title')}
            />

            <Group grow>
              <NumberInput
                required
                label="Session Number"
                placeholder="Session #"
                min={1}
                {...form.getInputProps('number')}
              />

              <DatePickerInput
                required
                label="Date Played"
                placeholder="Select date"
                valueFormat="MMMM DD, YYYY"
                clearable
                {...form.getInputProps('datePlayed')}
              />
            </Group>

            <Group grow>
              <Select
                label="Status"
                placeholder="Select status"
                data={[
                  { value: 'planned', label: 'Planned' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                {...form.getInputProps('status')}
              />

              <NumberInput
                label="Duration (minutes)"
                placeholder="Duration in minutes"
                min={0}
                step={30}
                {...form.getInputProps('duration')}
              />
            </Group>

            <Divider label="Content" />

            <Textarea
              label="Summary"
              placeholder="Brief summary of the session"
              minRows={3}
              {...form.getInputProps('summary')}
            />

            <Textarea
              label="Player Notes"
              placeholder="Notes visible to players"
              minRows={4}
              {...form.getInputProps('notes')}
            />

            <Textarea
              label="DM Notes"
              placeholder="Private notes for the DM"
              minRows={4}
              {...form.getInputProps('dmNotes')}
            />

            <Divider label="Relationships" />

            <MultiSelect
              label="Participants"
              placeholder="Select characters who participated"
              data={mapEntitiesToComboboxItems(characters)}
              searchable
              clearable
              {...form.getInputProps('participants')}
            />

            <MultiSelect
              label="Locations"
              placeholder="Select locations visited"
              data={mapEntitiesToComboboxItems(locations)}
              searchable
              clearable
              {...form.getInputProps('locations')}
            />

            <MultiSelect
              label="Events"
              placeholder="Select events that occurred"
              data={mapEntitiesToComboboxItems(events)}
              searchable
              clearable
              {...form.getInputProps('events')}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => navigate(`/rpg-worlds/${worldId}/sessions`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEditMode ? 'Update Session' : 'Create Session'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default SessionFormPage;
