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
import { CharacterService, Character } from '../../services/character.service';
import { EntityType } from '../../models/EntityType';
import { useRPGWorld } from '../../contexts/RPGWorldContext';
import { useAuth } from '../../contexts/AuthContext';

export function CharacterFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { currentWorld, currentCampaign } = useRPGWorld();
  const { currentUser } = useAuth();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load character data if in edit mode
  useEffect(() => {
    const loadCharacter = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);

        // Use the current world and campaign from context if available
        const worldId = currentWorld?.id || 'default-world';
        const campaignId = currentCampaign?.id || 'global';

        console.log(`Loading character with worldId: ${worldId}, campaignId: ${campaignId}`);

        const characterService = CharacterService.getInstance(worldId, campaignId);
        const characterData = await characterService.getEntity(id);

        if (!characterData) {
          setError('Character not found');
          return;
        }

        setCharacter(characterData);
      } catch (err) {
        console.error('Error loading character:', err);
        setError('Failed to load character data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [id, isEditMode, currentWorld, currentCampaign]);

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSaving(true);

      // Use the current world and campaign from context if available
      const worldId = currentWorld?.id || 'default-world';
      const campaignId = currentCampaign?.id || 'global';

      console.log(`Saving character with worldId: ${worldId}, campaignId: ${campaignId}`);

      const characterService = CharacterService.getInstance(worldId, campaignId);

      // Prepare character data
      const characterData: Partial<Character> = {
        name: values.name,
        description: values.description || '',
        race: values.race,
        class: values.class,
        // Convert level to number or undefined (not null)
        level: values.level ? parseInt(values.level) : undefined,
        // Only include fields that have values
        ...(values.background ? { background: values.background } : {}),
        ...(values.alignment ? { alignment: values.alignment } : {}),
        // Use characterType instead of type to match database schema
        characterType: values.type as 'PC' | 'NPC',
        isPlayerCharacter: values.type === 'PC',
        ...(values.appearance ? { appearance: values.appearance } : {}),
        ...(values.personality ? { personality: values.personality } : {}),
        ...(values.goals ? { goals: values.goals } : {}),
        ...(values.secrets ? { secrets: values.secrets } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
        status: values.status as 'alive' | 'dead' | 'unknown',
        ...(values.imageURL ? { imageURL: values.imageURL } : {}),
        ...(values.playerId ? { playerId: values.playerId } : {}),
        // Add required fields for Firestore
        worldId,
        campaignId,
        createdBy: currentUser?.uid || 'unknown-user', // Use the current user's ID
      };

      if (isEditMode && id) {
        // Update existing character
        await characterService.updateEntity(id, characterData);

        // Navigate to the appropriate character detail page based on context
        if (currentWorld?.id) {
          navigate(`/rpg-worlds/${currentWorld.id}/characters/${id}`);
        } else {
          navigate(`/characters/${id}`);
        }
      } else {
        // Create new character
        const newCharacterId = await characterService.createEntity(characterData as Character);

        // Navigate to the appropriate character detail page based on context
        if (currentWorld?.id) {
          navigate(`/rpg-worlds/${currentWorld.id}/characters/${newCharacterId}`);
        } else {
          navigate(`/characters/${newCharacterId}`);
        }
      }
    } catch (err) {
      console.error('Error saving character:', err);
      setError('Failed to save character. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  // Form fields
  const formFields = [
    // Basic Information section
    { name: 'name', label: 'Name', type: 'text', required: true, section: 'Basic Information' },
    {
      name: 'type', // Keep as 'type' in the form but map to 'characterType' in handleSubmit
      label: 'Character Type',
      type: 'select',
      required: true,
      section: 'Basic Information',
      description: 'Select whether this is a player character or non-player character',
      options: [
        { value: 'PC', label: 'Player Character' },
        { value: 'NPC', label: 'Non-Player Character' }
      ]
    },
    { name: 'race', label: 'Race', type: 'text', required: true, section: 'Basic Information' },
    { name: 'class', label: 'Class', type: 'text', required: true, section: 'Basic Information' },
    { name: 'level', label: 'Level', type: 'number', min: 1, max: 20, section: 'Basic Information' },
    { name: 'background', label: 'Background', type: 'text', section: 'Basic Information' },
    { name: 'alignment', label: 'Alignment', type: 'select', section: 'Basic Information',
      options: [
        { value: 'lawful_good', label: 'Lawful Good' },
        { value: 'neutral_good', label: 'Neutral Good' },
        { value: 'chaotic_good', label: 'Chaotic Good' },
        { value: 'lawful_neutral', label: 'Lawful Neutral' },
        { value: 'true_neutral', label: 'True Neutral' },
        { value: 'chaotic_neutral', label: 'Chaotic Neutral' },
        { value: 'lawful_evil', label: 'Lawful Evil' },
        { value: 'neutral_evil', label: 'Neutral Evil' },
        { value: 'chaotic_evil', label: 'Chaotic Evil' }
      ]
    },
    { name: 'status', label: 'Status', type: 'select', required: true, section: 'Basic Information',
      options: [
        { value: 'alive', label: 'Alive' },
        { value: 'dead', label: 'Dead' },
        { value: 'unknown', label: 'Unknown' }
      ]
    },
    { name: 'imageURL', label: 'Image URL', type: 'text', section: 'Basic Information' },

    // Description section
    { name: 'description', label: 'Description', type: 'textarea', section: 'Description' },
    { name: 'appearance', label: 'Appearance', type: 'textarea', section: 'Description' },
    { name: 'personality', label: 'Personality', type: 'textarea', section: 'Description' },
    { name: 'goals', label: 'Goals', type: 'textarea', section: 'Description' },
    { name: 'secrets', label: 'Secrets', type: 'textarea', section: 'Description' },
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
  if (error && isEditMode && !character) {
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
              to={
                isEditMode && id
                  ? currentWorld?.id
                    ? `/rpg-worlds/${currentWorld.id}/characters/${id}`
                    : `/characters/${id}`
                  : currentWorld?.id
                    ? `/rpg-worlds/${currentWorld.id}/characters`
                    : '/characters'
              }
              mb="xs"
            >
              {isEditMode ? 'Back to Character' : 'Back to Characters'}
            </Button>
            <Title order={1}>{isEditMode ? `Edit ${character?.name}` : 'Create New Character'}</Title>
          </div>

          {error && (
            <Text c="red">{error}</Text>
          )}
        </Group>

        <EntityForm
          entityType={EntityType.CHARACTER}
          initialValues={character || {
            type: 'NPC', // Form uses 'type' but we map to 'characterType' in handleSubmit
            status: 'alive',
            // Add default values for required fields
            worldId: currentWorld?.id || 'default-world',
            campaignId: currentCampaign?.id || 'global'
          }}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (isEditMode && id) {
              if (currentWorld?.id) {
                navigate(`/rpg-worlds/${currentWorld.id}/characters/${id}`);
              } else {
                navigate(`/characters/${id}`);
              }
            } else {
              if (currentWorld?.id) {
                navigate(`/rpg-worlds/${currentWorld.id}/characters`);
              } else {
                navigate('/characters');
              }
            }
          }}
          loading={saving}
          error={error}
          submitLabel={isEditMode ? 'Update Character' : 'Create Character'}
          sections={formSections}
        />
      </Paper>
    </Container>
  );
}

export default CharacterFormPage;
