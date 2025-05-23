import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Paper,
  Stack,
  Alert,
  Breadcrumbs,
  Anchor,
  Loader,
  ActionIcon,
  Tooltip,
  Box
} from '@mantine/core';
import {
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconLock,
  IconLockOpen,
  IconTag,
  IconLink,
  IconCalendarTime
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { NoteService } from '../../services/note.service';
import { Note, NoteType } from '../../models/Note';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { EntityType } from '../../models/EntityType';

/**
 * Note Detail Page
 * Displays detailed information about a note
 */
export function NoteDetailPage(): JSX.Element {
  const { id, worldId } = useParams<{ id: string; worldId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string>('');

  // Fetch note data
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!id || !worldId) {
        setError('Invalid note or world ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get world name
        const rpgWorldService = new RPGWorldService();
        const world = await rpgWorldService.getById(worldId);
        setWorldName(world?.name || 'Unknown World');

        // Get note
        const noteService = NoteService.getInstance(worldId, 'default-campaign');
        const fetchedNote = await noteService.getById(id);
        
        if (fetchedNote) {
          setNote(fetchedNote);
        } else {
          setError('Note not found');
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, worldId]);

  // Handle edit
  const handleEdit = (): void => {
    navigate(`/rpg-worlds/${worldId}/notes/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async (): Promise<void> => {
    if (!id || !worldId) {
      setError('Invalid note or world ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const noteService = NoteService.getInstance(worldId, 'default-campaign');
        await noteService.delete(id);
        
        notifications.show({
          title: 'Note Deleted',
          message: 'The note has been deleted successfully',
          color: 'green'
        });
        
        navigate(`/rpg-worlds/${worldId}/notes`);
      } catch (err) {
        console.error('Error deleting note:', err);
        setError('Failed to delete note. Please try again.');
      }
    }
  };

  // Handle back
  const handleBack = (): void => {
    navigate(`/rpg-worlds/${worldId}/notes`);
  };

  // Format date
  const formatDate = (date: any): string => {
    if (!date) return 'Unknown';
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    // Format date
    try {
      return new Date(date).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get note type color
  const getNoteTypeColor = (noteType: string): string => {
    switch (noteType) {
      case NoteType.GENERAL: return 'blue';
      case NoteType.LORE: return 'indigo';
      case NoteType.QUEST: return 'green';
      case NoteType.PLAYER: return 'orange';
      case NoteType.DM: return 'red';
      case NoteType.SESSION: return 'violet';
      default: return 'gray';
    }
  };

  // Format note type
  const formatNoteType = (noteType: string): string => {
    return noteType.charAt(0) + noteType.slice(1).toLowerCase();
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: worldName, href: `/rpg-worlds/${worldId}` },
    { title: 'Notes', href: `/rpg-worlds/${worldId}/notes` },
    { title: note?.title || 'Note Details', href: '#' }
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

  // Check if user can view private note
  const canViewPrivateNote = !note?.isPrivate || note?.createdBy === currentUser?.uid;

  if (note?.isPrivate && !canViewPrivateNote) {
    return (
      <Container size="md">
        <Stack gap="md">
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
          
          <Alert icon={<IconAlertCircle size="1rem" />} title="Access Denied" color="red">
            This is a private note that you don't have permission to view.
          </Alert>
          
          <Button
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={handleBack}
          >
            Back to Notes
          </Button>
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

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {note && (
          <>
            {/* Header */}
            <Group justify="space-between">
              <Title order={1}>{note.title}</Title>
              <Group>
                <Button
                  variant="outline"
                  leftSection={<IconArrowLeft size="1rem" />}
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Tooltip label="Edit Note">
                  <ActionIcon
                    variant="filled"
                    color="blue"
                    onClick={handleEdit}
                    size="lg"
                  >
                    <IconEdit size="1.2rem" />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete Note">
                  <ActionIcon
                    variant="filled"
                    color="red"
                    onClick={handleDelete}
                    size="lg"
                  >
                    <IconTrash size="1.2rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {/* Note Metadata */}
            <Group>
              <Badge color={getNoteTypeColor(note.noteType)}>
                {formatNoteType(note.noteType)}
              </Badge>
              {note.isPrivate ? (
                <Badge color="red" leftSection={<IconLock size="0.8rem" />}>
                  Private
                </Badge>
              ) : (
                <Badge color="green" leftSection={<IconLockOpen size="0.8rem" />}>
                  Public
                </Badge>
              )}
            </Group>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <Group>
                <IconTag size="1rem" />
                {note.tags.map((tag, index) => (
                  <Badge key={index} variant="light">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}

            {/* Related Entity */}
            {note.relatedEntityId && note.relatedEntityType && (
              <Group>
                <IconLink size="1rem" />
                <Text>
                  Related to: {note.relatedEntityType}
                </Text>
              </Group>
            )}

            {/* Timestamps */}
            <Group>
              <IconCalendarTime size="1rem" />
              <Text size="sm" c="dimmed">
                Created: {formatDate(note.createdAt)}
              </Text>
              <Text size="sm" c="dimmed">
                Updated: {formatDate(note.updatedAt)}
              </Text>
            </Group>

            {/* Note Content */}
            <Paper p="md" withBorder>
              <Box
                dangerouslySetInnerHTML={{ __html: note.content }}
                className="rich-text-content"
              />
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
}

export default NoteDetailPage;
