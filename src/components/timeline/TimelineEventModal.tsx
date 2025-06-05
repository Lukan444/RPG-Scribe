import React, { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Switch,
  Button,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  MultiSelect,
  ActionIcon,
  Divider
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconTrash, IconCalendarEvent, IconAlertTriangle } from '@tabler/icons-react';
import { RPGTimelineEvent, TimelineEventType, TimelineEventFormData } from '../../types/timeline.types';
import { EntityType } from '../../models/EntityType';

interface TimelineEventModalProps {
  opened: boolean;
  onClose: () => void;
  event: RPGTimelineEvent | null;
  mode: 'create' | 'edit';
  onSave: (eventData: Partial<RPGTimelineEvent>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'session', label: 'Session' },
  { value: 'quest', label: 'Quest' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'character-event', label: 'Character Event' },
  { value: 'world-event', label: 'World Event' },
  { value: 'combat', label: 'Combat' },
  { value: 'social', label: 'Social Encounter' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'custom', label: 'Custom Event' }
];

const ENTITY_TYPE_OPTIONS = [
  { value: 'character', label: 'Character' },
  { value: 'session', label: 'Session' },
  { value: 'location', label: 'Location' },
  { value: 'item', label: 'Item' },
  { value: 'faction', label: 'Faction' },
  { value: 'quest', label: 'Quest' }
];

const IMPORTANCE_LABELS = {
  1: 'Trivial',
  2: 'Minor',
  3: 'Low',
  4: 'Below Average',
  5: 'Average',
  6: 'Above Average',
  7: 'Important',
  8: 'Very Important',
  9: 'Critical',
  10: 'Legendary'
};

export function TimelineEventModal({
  opened,
  onClose,
  event,
  mode,
  onSave,
  onDelete
}: TimelineEventModalProps) {
  const form = useForm<TimelineEventFormData>({
    initialValues: {
      title: '',
      description: '',
      startDate: new Date(),
      endDate: undefined,
      isRange: false,
      importance: 5,
      eventType: 'custom',
      entityId: '',
      entityType: undefined,
      tags: [],
      participants: [],
      location: '',
      gmNotes: '',
      playerVisible: true
    },
    validate: {
      title: (value) => (value.trim().length < 1 ? 'Title is required' : null),
      startDate: (value) => (!value ? 'Start date is required' : null),
      endDate: (value, values) => {
        if (values.isRange && !value) {
          return 'End date is required for range events';
        }
        if (values.isRange && value && value <= values.startDate) {
          return 'End date must be after start date';
        }
        return null;
      },
      importance: (value) => {
        if (value < 1 || value > 10) {
          return 'Importance must be between 1 and 10';
        }
        return null;
      }
    }
  });

  // Populate form when event changes
  useEffect(() => {
    if (event && mode === 'edit') {
      form.setValues({
        title: event.title,
        description: event.description || '',
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        isRange: !!event.endDate,
        importance: event.importance,
        eventType: event.eventType,
        entityId: event.entityId || '',
        entityType: event.entityType,
        tags: event.tags || [],
        participants: event.participants || [],
        location: event.location || '',
        gmNotes: event.gmNotes || '',
        playerVisible: event.playerVisible
      });
    } else if (mode === 'create') {
      form.reset();
      if (event) {
        // Pre-populate with some values from the template event
        form.setValues({
          ...form.values,
          startDate: new Date(event.startDate),
          entityId: event.entityId || '',
          entityType: event.entityType
        });
      }
    }
  }, [event, mode]);

  const handleSubmit = async (values: TimelineEventFormData) => {
    try {
      const eventData: Partial<RPGTimelineEvent> = {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        startDate: values.startDate,
        endDate: values.isRange ? values.endDate : undefined,
        importance: values.importance,
        eventType: values.eventType,
        entityId: values.entityId || undefined,
        entityType: values.entityType,
        tags: values.tags.length > 0 ? values.tags : undefined,
        participants: values.participants.length > 0 ? values.participants : undefined,
        location: values.location?.trim() || undefined,
        gmNotes: values.gmNotes?.trim() || undefined,
        playerVisible: values.playerVisible
      };

      await onSave(eventData);
      form.reset();
    } catch (error) {
      console.error('Error saving event:', error);
      // TODO: Show error notification
    }
  };

  const handleDelete = async () => {
    if (event && onDelete && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await onDelete(event.id);
        form.reset();
      } catch (error) {
        console.error('Error deleting event:', error);
        // TODO: Show error notification
      }
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getImportanceColor = (importance: number): string => {
    if (importance >= 9) return 'red';
    if (importance >= 7) return 'orange';
    if (importance >= 5) return 'yellow';
    if (importance >= 3) return 'blue';
    return 'gray';
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group>
          <IconCalendarEvent size={20} />
          <Title order={3}>
            {mode === 'create' ? 'Create Timeline Event' : 'Edit Timeline Event'}
          </Title>
        </Group>
      }
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit((values) => handleSubmit(values as TimelineEventFormData))}>
        <Stack gap="md">
          {/* Basic Information */}
          <TextInput
            label="Event Title"
            placeholder="Enter event title"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="Enter event description"
            rows={3}
            {...form.getInputProps('description')}
          />

          {/* Date and Time */}
          <Group grow>
            <DateTimePicker
              label="Start Date & Time"
              placeholder="Select start date and time"
              required
              {...form.getInputProps('startDate')}
            />
          </Group>

          <Switch
            label="This event has a duration (range event)"
            description="Enable if this event spans a period of time"
            {...form.getInputProps('isRange', { type: 'checkbox' })}
          />

          {form.values.isRange && (
            <DateTimePicker
              label="End Date & Time"
              placeholder="Select end date and time"
              required={form.values.isRange}
              {...form.getInputProps('endDate')}
            />
          )}

          <Divider />

          {/* Event Properties */}
          <Group grow>
            <Select
              label="Event Type"
              placeholder="Select event type"
              data={EVENT_TYPE_OPTIONS}
              {...form.getInputProps('eventType')}
            />

            <div>
              <Group gap="xs" mb="xs">
                <Text size="sm" fw={500}>Importance</Text>
                <Badge 
                  color={getImportanceColor(form.values.importance)}
                  variant="light"
                  size="sm"
                >
                  {IMPORTANCE_LABELS[form.values.importance as keyof typeof IMPORTANCE_LABELS]}
                </Badge>
              </Group>
              <NumberInput
                placeholder="1-10"
                min={1}
                max={10}
                {...form.getInputProps('importance')}
              />
            </div>
          </Group>

          {/* Entity Association */}
          <Group grow>
            <Select
              label="Entity Type"
              placeholder="Select entity type"
              data={ENTITY_TYPE_OPTIONS}
              clearable
              {...form.getInputProps('entityType')}
            />

            <TextInput
              label="Entity ID"
              placeholder="Enter entity ID"
              description="ID of the associated character, session, etc."
              {...form.getInputProps('entityId')}
            />
          </Group>

          {/* Additional Details */}
          <MultiSelect
            label="Tags"
            placeholder="Add tags"
            data={[]} // TODO: Load from existing tags
            searchable
            {...form.getInputProps('tags')}
          />

          <Group grow>
            <MultiSelect
              label="Participants"
              placeholder="Select participants"
              data={[]} // TODO: Load from characters
              searchable
              {...form.getInputProps('participants')}
            />

            <TextInput
              label="Location"
              placeholder="Enter location"
              {...form.getInputProps('location')}
            />
          </Group>

          <Textarea
            label="GM Notes"
            placeholder="Private notes for the GM"
            rows={2}
            {...form.getInputProps('gmNotes')}
          />

          <Switch
            label="Visible to Players"
            description="Whether this event is visible to players"
            {...form.getInputProps('playerVisible', { type: 'checkbox' })}
          />

          <Divider />

          {/* Actions */}
          <Group justify="space-between">
            <div>
              {mode === 'edit' && onDelete && (
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleDelete}
                >
                  Delete Event
                </Button>
              )}
            </div>

            <Group>
              <Button variant="light" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconCalendarEvent size={16} />}>
                {mode === 'create' ? 'Create Event' : 'Save Changes'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
