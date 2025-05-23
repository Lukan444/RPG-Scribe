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
import { ItemService, Item } from '../../services/item.service';
import { EntityType } from '../../models/EntityType';

/**
 * ItemFormPage component - Form for creating and editing items
 *
 * Uses the ItemService to save item data to Firestore
 * Supports both creation and editing modes
 * Uses the EntityForm component for form rendering and validation
 *
 * @see {@link https://mantine.dev/core/button/} - Mantine Button documentation
 * @see {@link https://mantine.dev/core/paper/} - Mantine Paper documentation
 */
export function ItemFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load item data if in edit mode
  useEffect(() => {
    const loadItem = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        // For now, we'll use a hardcoded world and campaign ID
        const worldId = 'default-world';
        const campaignId = 'default-campaign';

        const itemService = ItemService.getInstance(worldId, campaignId);
        const itemData = await itemService.getEntity(id);

        if (!itemData) {
          setError('Item not found');
          return;
        }

        setItem(itemData);
      } catch (err) {
        console.error('Error loading item:', err);
        setError('Failed to load item data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, isEditMode]);

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSaving(true);
      // For now, we'll use a hardcoded world and campaign ID
      const worldId = 'default-world';
      const campaignId = 'default-campaign';

      const itemService = ItemService.getInstance(worldId, campaignId);

      // Prepare item data
      const itemData: Partial<Item> = {
        name: values.name,
        description: values.description,
        type: values.type,
        rarity: values.rarity,
        attunement: values.attunement === 'true',
        worldId: worldId,
        campaignId: campaignId,
        createdBy: 'current-user-id', // This should come from auth context
        imageURL: values.imageURL,
        properties: values.properties
      };

      // Handle magical properties
      if (values.magicalDescription) {
        // Create a structured object for magical properties
        itemData.magicalProperties = {
          description: values.magicalDescription,
          charges: values.charges ? parseInt(values.charges) : undefined,
          maxCharges: values.maxCharges ? parseInt(values.maxCharges) : undefined,
          rechargeable: values.rechargeable === 'true'
        };
      } else {
        // Ensure magicalProperties is undefined if no description is provided
        itemData.magicalProperties = undefined;
      }

      if (isEditMode && id) {
        // Update existing item
        await itemService.updateEntity(id, itemData);
        navigate(`/items/${id}`);
      } else {
        // Create new item
        const newItemId = await itemService.createEntity(itemData as Item);
        navigate(`/items/${newItemId}`);
      }
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item. Please try again later.');
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
        { value: 'Weapon', label: 'Weapon' },
        { value: 'Armor', label: 'Armor' },
        { value: 'Potion', label: 'Potion' },
        { value: 'Scroll', label: 'Scroll' },
        { value: 'Wondrous', label: 'Wondrous Item' },
        { value: 'Artifact', label: 'Artifact' },
        { value: 'Other', label: 'Other' }
      ]
    },
    { name: 'rarity', label: 'Rarity', type: 'select', section: 'Basic Information',
      options: [
        { value: 'Common', label: 'Common' },
        { value: 'Uncommon', label: 'Uncommon' },
        { value: 'Rare', label: 'Rare' },
        { value: 'Very Rare', label: 'Very Rare' },
        { value: 'Legendary', label: 'Legendary' },
        { value: 'Artifact', label: 'Artifact' }
      ]
    },
    { name: 'attunement', label: 'Requires Attunement', type: 'select', section: 'Basic Information',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    },
    { name: 'imageURL', label: 'Image URL', type: 'text', section: 'Basic Information' },

    // Description section
    { name: 'description', label: 'Description', type: 'textarea', section: 'Description' },
    { name: 'properties', label: 'Properties', type: 'textarea', section: 'Description',
      description: 'Special properties of the item (e.g., damage, armor class, etc.)'
    },

    // Magical Properties section
    { name: 'magicalDescription', label: 'Magical Description', type: 'textarea', section: 'Magical Properties',
      description: 'Description of the magical properties of the item'
    },
    { name: 'charges', label: 'Charges', type: 'number', min: 0, section: 'Magical Properties' },
    { name: 'maxCharges', label: 'Max Charges', type: 'number', min: 0, section: 'Magical Properties' },
    { name: 'rechargeable', label: 'Rechargeable', type: 'select', section: 'Magical Properties',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    }
  ];

  // Form sections
  const formSections = ['Basic Information', 'Description', 'Magical Properties'];

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
  if (error && isEditMode && !item) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Text c="red">{error}</Text>
        </Center>
      </Container>
    );
  }

  // Prepare initial values for the form
  const defaultValues = {
    type: 'Other',
    attunement: 'false',
    rechargeable: 'false',
    magicalDescription: '',
    charges: undefined,
    maxCharges: undefined
  };

  // Merge item data with default values if item exists
  const initialValues = item ? { ...defaultValues, ...item } : defaultValues;

  // Convert boolean values to strings for select inputs
  if (initialValues.attunement !== undefined) {
    initialValues.attunement = String(initialValues.attunement);
  }

  // Extract magical properties for the form
  if (item && item.magicalProperties) {
    if (typeof item.magicalProperties === 'object') {
      initialValues.magicalDescription = item.magicalProperties.description;
      initialValues.charges = item.magicalProperties.charges;
      initialValues.maxCharges = item.magicalProperties.maxCharges;

      if (item.magicalProperties.rechargeable !== undefined) {
        initialValues.rechargeable = String(item.magicalProperties.rechargeable);
      }
    } else if (typeof item.magicalProperties === 'string') {
      initialValues.magicalDescription = item.magicalProperties;
    }
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
              to={isEditMode ? `/items/${id}` : '/items'}
              mb="xs"
            >
              {isEditMode ? 'Back to Item' : 'Back to Items'}
            </Button>
            <Title order={1}>{isEditMode ? `Edit ${item?.name}` : 'Create New Item'}</Title>
          </div>

          {error && (
            <Text c="red">{error}</Text>
          )}
        </Group>

        <EntityForm
          entityType={EntityType.ITEM}
          initialValues={initialValues}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={() => navigate(isEditMode ? `/items/${id}` : '/items')}
          loading={saving}
          error={error}
          submitLabel={isEditMode ? 'Update Item' : 'Create Item'}
          sections={formSections}
        />
      </Paper>
    </Container>
  );
}

export default ItemFormPage;
