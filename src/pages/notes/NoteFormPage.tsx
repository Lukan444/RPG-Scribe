import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Select,
  Checkbox,
  MultiSelect,
  Textarea,
  Paper,
  Alert,
  Breadcrumbs,
  Anchor,
  Loader,
  Box
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { RichTextEditor, Link as RichTextLink } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconDeviceFloppy,
  IconTrash
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { NoteService } from '../../services/note.service';
import { Note, NoteType } from '../../models/Note';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { EntityType } from '../../models/EntityType';
import { RelationshipService } from '../../services/relationship.service';

/**
 * Note Form Page
 * Form for creating and editing notes
 */
export function NoteFormPage(): JSX.Element {
  const { id, worldId } = useParams<{ id: string; worldId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEditMode = !!id;

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Form
  const form = useForm<Note>({
    initialValues: {
      name: '',
      title: '',
      content: '',
      noteType: NoteType.GENERAL,
      tags: [],
      isPrivate: false,
      relatedEntityId: '',
      relatedEntityType: '',
      createdBy: currentUser?.uid || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      entityType: EntityType.NOTE
    },
    validate: {
      title: (value) => (value && value.trim().length > 0 ? null : 'Title is required'),
      content: (value) => (value?.trim().length > 0 ? null : 'Content is required'),
      noteType: (value) => (value ? null : 'Note type is required')
    }
  });

  // Rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      RichTextLink,
      Placeholder.configure({ placeholder: 'Write your note content here...' })
    ],
    content: form.values.content,
    onUpdate: ({ editor }) => {
      form.setFieldValue('content', editor.getHTML());
    }
  });

  // Fetch note data if in edit mode
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!worldId) {
        setError('No world ID provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(worldId);
        setWorldName(world?.name || 'Unknown World');

        // Get available tags
        const noteService = NoteService.getInstance(worldId, 'default-campaign');
        const notes = await noteService.listEntities();
        const tags = new Set<string>();
        notes.forEach(note => {
          if (note.tags) {
            note.tags.forEach(tag => tags.add(tag));
          }
        });
        setAvailableTags(Array.from(tags));

        // If in edit mode, fetch note data
        if (isEditMode && id) {
          const note = await noteService.getById(id);
          if (note) {
            form.setValues({
              ...note,
              // Ensure dates are properly handled
              createdAt: note.createdAt || new Date(),
              updatedAt: new Date()
            });

            // Update editor content
            if (editor && note.content) {
              editor.commands.setContent(note.content);
            }
          } else {
            setError('Note not found');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId, id, isEditMode, editor, form]);

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>): Promise<void> => {
    if (!worldId) {
      setError('No world ID provided');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const noteService = NoteService.getInstance(worldId, 'default-campaign');

      // Ensure name is set from title
      if (values.title && !values.name) {
        values.name = values.title;
      }

      // Ensure entityType is set
      values.entityType = EntityType.NOTE;

      // Update the updatedAt field
      values.updatedAt = new Date();

      // Set createdBy if not already set
      if (!values.createdBy) {
        values.createdBy = currentUser?.uid || '';
      }

      if (isEditMode && id) {
        // Update existing note
        await noteService.update(id, values as Note);
        notifications.show({
          title: 'Note Updated',
          message: 'The note has been updated successfully',
          color: 'green'
        });
      } else {
        // Create new note
        values.createdAt = new Date();
        const noteId = await noteService.create(values as Note);
        notifications.show({
          title: 'Note Created',
          message: 'The note has been created successfully',
          color: 'green'
        });

        // Navigate to the new note
        navigate(`/rpg-worlds/${worldId}/notes/${noteId}`);
        return;
      }

      // Navigate back to the notes list
      navigate(`/rpg-worlds/${worldId}/notes`);
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = (): void => {
    navigate(`/rpg-worlds/${worldId}/notes`);
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Notes', href: `/rpg-worlds/${worldId}/notes` },
    { title: isEditMode ? 'Edit Note' : 'New Note', href: '#' }
  ];

  if (loading) {
    return (
      <Container size="md">
        <Stack align="center" justify="center" h="70vh">
          <Loader size="xl" />
          <Title order={3}>Loading...</Title>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md">
      <Stack gap="md">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <Anchor
              key={index}
              component={Link}
              to={item.href}
              c={index === breadcrumbItems.length - 1 ? 'dimmed' : undefined}
              underline={index === breadcrumbItems.length - 1 ? 'never' : 'always'}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        {/* Header */}
        <Title order={1}>{isEditMode ? 'Edit Note' : 'Create New Note'}</Title>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Form */}
        <Paper p="md" withBorder>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Title"
                placeholder="Enter note title"
                required
                {...form.getInputProps('title')}
              />

              <Select
                label="Note Type"
                placeholder="Select note type"
                data={[
                  { value: NoteType.GENERAL, label: 'General' },
                  { value: NoteType.LORE, label: 'Lore' },
                  { value: NoteType.QUEST, label: 'Quest' },
                  { value: NoteType.PLAYER, label: 'Player' },
                  { value: NoteType.DM, label: 'DM' },
                  { value: NoteType.SESSION, label: 'Session' }
                ]}
                required
                {...form.getInputProps('noteType')}
              />

              <MultiSelect
                label="Tags"
                placeholder="Select or create tags"
                data={availableTags}
                comboboxProps={{
                  withinPortal: true,
                  transitionProps: { transition: 'pop', duration: 200 },
                  getCreateLabel: (query) => `+ Add "${query}"`,
                  onCreate: (query) => {
                    setAvailableTags((current) => [...current, query]);
                    return query;
                  }
                }}
                searchable
                {...form.getInputProps('tags')}
              />

              <Box>
                <label className="mantine-InputWrapper-label mantine-TextInput-label">
                  Content
                </label>
                <RichTextEditor editor={editor}>
                  <RichTextEditor.Toolbar sticky stickyOffset={60}>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Bold />
                      <RichTextEditor.Italic />
                      <RichTextEditor.Underline />
                      <RichTextEditor.Strikethrough />
                      <RichTextEditor.ClearFormatting />
                      <RichTextEditor.Highlight />
                      <RichTextEditor.Code />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.H1 />
                      <RichTextEditor.H2 />
                      <RichTextEditor.H3 />
                      <RichTextEditor.H4 />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Blockquote />
                      <RichTextEditor.Hr />
                      <RichTextEditor.BulletList />
                      <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Link />
                      <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>
                  </RichTextEditor.Toolbar>

                  <RichTextEditor.Content />
                </RichTextEditor>
              </Box>

              <Checkbox
                label="Private Note (only visible to you)"
                {...form.getInputProps('isPrivate', { type: 'checkbox' })}
              />

              <Group justify="space-between">
                <Button
                  variant="outline"
                  leftSection={<IconArrowLeft size="1rem" />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Group>
                  {isEditMode && (
                    <Button
                      color="red"
                      leftSection={<IconTrash size="1rem" />}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this note?')) {
                          // Handle delete
                          if (id && worldId) {
                            const noteService = NoteService.getInstance(worldId, 'default-campaign');
                            noteService.delete(id)
                              .then(() => {
                                notifications.show({
                                  title: 'Note Deleted',
                                  message: 'The note has been deleted successfully',
                                  color: 'green'
                                });
                                navigate(`/rpg-worlds/${worldId}/notes`);
                              })
                              .catch(err => {
                                console.error('Error deleting note:', err);
                                setError('Failed to delete note. Please try again.');
                              });
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    type="submit"
                    leftSection={<IconDeviceFloppy size="1rem" />}
                    loading={saving}
                  >
                    {isEditMode ? 'Update Note' : 'Create Note'}
                  </Button>
                </Group>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}

export default NoteFormPage;
