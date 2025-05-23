import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Text,
  Loader,
  Center
} from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { EntityForm } from '../../components/common/EntityForm';
import { EventService, Event } from '../../services/event.service';
import { EntityType } from '../../models/EntityType';
import '@mantine/dates/styles.css'; // Import date styles

/**
 * EventFormPage component - Form for creating and editing events
 *
 * Uses the EventService to save event data to Firestore
 * Supports both creation and editing modes
 * Uses the EntityForm component for form rendering and validation
 *
 * @see {@link https://mantine.dev/core/button/} - Mantine Button documentation
 * @see {@link https://mantine.dev/core/paper/} - Mantine Paper documentation
 */
export function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load event data if in edit mode
  useEffect(() => {
    const loadEvent = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        // For now, we'll use a hardcoded world and campaign ID
        const worldId = 'default-world';
        const campaignId = 'default-campaign';

        const eventService = EventService.getInstance(worldId, campaignId);
        const eventData = await eventService.getEntity(id);

        if (!eventData) {
          setError('Event not found');
          return;
        }

        setEvent(eventData);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, isEditMode]);

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSaving(true);
      // For now, we'll use a hardcoded world and campaign ID
      const worldId = 'default-world';
      const campaignId = 'default-campaign';

      const eventService = EventService.getInstance(worldId, campaignId);

      // Prepare event data
      const eventData: Partial<Event> = {
        name: values.name,
        description: values.description,
        type: values.type,
        importance: values.importance ? parseInt(values.importance) : undefined,
        isSecret: values.isSecret === 'true',
        worldId: worldId,
        campaignId: campaignId,
        createdBy: 'current-user-id', // This should come from auth context
        imageURL: values.imageURL,
        outcome: values.outcome,
        // Handle date - in a real implementation, we would use a proper date picker
        // and convert the date to a Firestore timestamp
        date: values.date ? new Date(values.date) : undefined,
        // For now, we'll just store the consequences as a string and split it by lines
        consequences: values.consequences ? values.consequences.split('\n').filter((line: string) => line.trim() !== '') : undefined
      };

      if (isEditMode && id) {
        // Update existing event
        await eventService.updateEntity(id, eventData);
        navigate(`/events/${id}`);
      } else {
        // Create new event
        const newEventId = await eventService.createEntity(eventData as Event);
        navigate(`/events/${newEventId}`);
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  // Form fields
  const formFields = [
    // Basic Information section
    { name: 'name', label: 'Name', type: 'text', required: true, section: 'Basic Information' },
    { name: 'type', label: 'Type', type: 'select', required: true, section: 'Basic Information',
      options: [
        { value: 'Battle', label: 'Battle' },
        { value: 'Social', label: 'Social' },
        { value: 'Discovery', label: 'Discovery' },
        { value: 'Plot Point', label: 'Plot Point' },
        { value: 'Quest', label: 'Quest' },
        { value: 'Travel', label: 'Travel' },
        { value: 'Other', label: 'Other' }
      ]
    },
    { name: 'importance', label: 'Importance', type: 'select', section: 'Basic Information',
      options: [
        { value: '1', label: '1 - Trivial' },
        { value: '2', label: '2' },
        { value: '3', label: '3 - Minor' },
        { value: '4', label: '4' },
        { value: '5', label: '5 - Moderate' },
        { value: '6', label: '6' },
        { value: '7', label: '7 - Major' },
        { value: '8', label: '8' },
        { value: '9', label: '9' },
        { value: '10', label: '10 - Critical' }
      ]
    },
    { name: 'isSecret', label: 'Is Secret', type: 'select', section: 'Basic Information',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    },
    { name: 'date', label: 'Date', type: 'text', section: 'Basic Information',
      description: 'Enter date in YYYY-MM-DD format'
    },
    { name: 'imageURL', label: 'Image URL', type: 'text', section: 'Basic Information' },

    // Description section
    { name: 'description', label: 'Description', type: 'textarea', section: 'Description' },

    // Outcome section
    { name: 'outcome', label: 'Outcome', type: 'textarea', section: 'Outcome',
      description: 'What happened as a result of this event?'
    },
    { name: 'consequences', label: 'Consequences', type: 'textarea', section: 'Outcome',
      description: 'Enter each consequence on a new line'
    }
  ];

  // Form sections
  const formSections = ['Basic Information', 'Description', 'Outcome'];

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
  if (error && isEditMode && !event) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  // Prepare initial values for the form
  const initialValues: Record<string, any> = event ? { ...event } : {
    type: 'Other',
    isSecret: 'false'
  };

  // Convert boolean values to strings for select inputs
  if (initialValues.isSecret !== undefined) {
    initialValues.isSecret = initialValues.isSecret.toString();
  }

  // Convert date to string format if it exists
  if (initialValues.date && typeof initialValues.date.toDate === 'function') {
    const date = initialValues.date.toDate();
    initialValues.date = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

  // Convert consequences array to string if it exists
  if (initialValues.consequences && Array.isArray(initialValues.consequences)) {
    initialValues.consequences = initialValues.consequences.join('\n');
  }

  // Convert importance to string if it exists
  if (initialValues.importance !== undefined) {
    initialValues.importance = initialValues.importance.toString();
  }

  return (
    <Container size="xl" py="xl">
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="xl">
          <div>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              component={Link}
              to={isEditMode ? `/events/${id}` : '/events'}
              mb="xs"
            >
              {isEditMode ? 'Back to Event' : 'Back to Events'}
            </Button>
            <Title order={1}>{isEditMode ? `Edit ${event?.name}` : 'Create New Event'}</Title>
          </div>

          {error && (
            <Text c="red">{error}</Text>
          )}
        </Group>

        <EntityForm
          entityType={EntityType.EVENT}
          initialValues={initialValues}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={() => navigate(isEditMode ? `/events/${id}` : '/events')}
          loading={saving}
          error={error}
          submitLabel={isEditMode ? 'Update Event' : 'Create Event'}
          sections={formSections}
        />
      </Paper>
    </Container>
  );
}

export default EventFormPage;
