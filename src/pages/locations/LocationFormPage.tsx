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
import { LocationService, Location } from '../../services/location.service';
import { EntityType } from '../../models/EntityType';

/**
 * LocationFormPage component - Form for creating and editing locations
 *
 * Uses the LocationService to save location data to Firestore
 * Supports both creation and editing modes
 * Uses the EntityForm component for form rendering and validation
 */
export function LocationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load location data if in edit mode
  useEffect(() => {
    const loadLocation = async () => {
      if (!isEditMode) return;

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
      } catch (err) {
        console.error('Error loading location:', err);
        setError('Failed to load location data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLocation();
  }, [id, isEditMode]);

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSaving(true);
      // For now, we'll use a hardcoded world and campaign ID
      const worldId = 'default-world';
      const campaignId = 'default-campaign';

      const locationService = LocationService.getInstance(worldId, campaignId);

      // Prepare location data
      const locationData: Partial<Location> = {
        name: values.name,
        description: values.description,
        locationType: values.locationType,
        worldId: worldId,
        campaignId: campaignId,
        createdBy: 'current-user-id', // This should come from auth context
        imageURL: values.imageURL,
        notes: values.notes
      };

      if (isEditMode && id) {
        // Update existing location
        await locationService.updateEntity(id, locationData);
        navigate(`/locations/${id}`);
      } else {
        // Create new location
        const newLocationId = await locationService.createEntity(locationData as Location);
        navigate(`/locations/${newLocationId}`);
      }
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  // Form fields
  const formFields = [
    // Basic Information section
    { name: 'name', label: 'Name', type: 'text', required: true, section: 'Basic Information' },
    { name: 'locationType', label: 'Type', type: 'select', required: true, section: 'Basic Information',
      options: [
        { value: 'Settlement', label: 'Settlement' },
        { value: 'Dungeon', label: 'Dungeon' },
        { value: 'Wilderness', label: 'Wilderness' },
        { value: 'Building', label: 'Building' },
        { value: 'Landmark', label: 'Landmark' },
        { value: 'Other', label: 'Other' }
      ]
    },
    { name: 'imageURL', label: 'Image URL', type: 'text', section: 'Basic Information' },

    // Description section
    { name: 'description', label: 'Description', type: 'textarea', section: 'Description' },
    { name: 'notes', label: 'Notes', type: 'textarea', section: 'Description' }
  ];

  // Form sections
  const formSections = ['Basic Information', 'Description'];

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
  if (error && isEditMode && !location) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
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
              to={isEditMode ? `/locations/${id}` : '/locations'}
              mb="xs"
            >
              {isEditMode ? 'Back to Location' : 'Back to Locations'}
            </Button>
            <Title order={1}>{isEditMode ? `Edit ${location?.name}` : 'Create New Location'}</Title>
          </div>

          {error && (
            <Text c="red">{error}</Text>
          )}
        </Group>

        <EntityForm
          entityType={EntityType.LOCATION}
          initialValues={location || {
            locationType: 'Other'
          }}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={() => navigate(isEditMode ? `/locations/${id}` : '/locations')}
          loading={saving}
          error={error}
          submitLabel={isEditMode ? 'Update Location' : 'Create Location'}
          sections={formSections}
        />
      </Paper>
    </Container>
  );
}

export default LocationFormPage;
