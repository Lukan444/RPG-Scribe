import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import {
  Container, Title, Group, Button, TextInput, Select, Table, Badge,
  Paper, Stack, Text, Avatar, ActionIcon, Menu, Alert, Breadcrumbs,
  Anchor, SimpleGrid, Card, Tabs
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconFilter, IconEye, IconEdit, IconTrash,
  IconDotsVertical, IconNote, IconLock, IconLockOpen, IconLink, IconTag,
  IconAlertCircle
} from '@tabler/icons-react';
import { Note, NoteType } from '../../models/Note';
import { NoteService } from '../../services/note.service';
import { EntityType } from '../../models/EntityType';
import { getCampaignIdFromParams } from '../../utils/routeUtils';

/**
 * Global Note List Page
 * Displays a list of all notes across all worlds
 */
export function NoteListPage() {
  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState<string | null>('all');
  const [viewMode, setViewMode] = useState<string>('grid');

  const navigate = useNavigate();
  const location = useLocation();

  // Get params at the component level
  const params = useParams();
  const campaignId = getCampaignIdFromParams(params);

  // Fetch notes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use empty string for worldId to get global notes
        const worldId = '';

        // Get notes
        const noteService = NoteService.getInstance(worldId, campaignId);
        const allNotes = await noteService.listEntities();
        setNotes(allNotes);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  // Filter notes based on search, type, and privacy
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' ||
      (note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = !selectedType ||
      (note.noteType === selectedType);

    const matchesPrivacy = showPrivate === 'all' ||
      (showPrivate === 'public' && !note.isPrivate) ||
      (showPrivate === 'private' && note.isPrivate);

    return matchesSearch && matchesType && matchesPrivacy;
  });

  // Handle create note
  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  // Handle view note
  const handleViewNote = (noteId: string): void => {
    if (!noteId) {
      console.error('Note ID is undefined');
      return;
    }
    navigate(`/notes/${noteId}`);
  };

  // Handle edit note
  const handleEditNote = (event: React.MouseEvent, noteId: string): void => {
    if (!noteId) {
      console.error('Note ID is undefined');
      return;
    }
    event.stopPropagation();
    navigate(`/notes/${noteId}/edit`);
  };

  // Handle delete note
  const handleDeleteNote = async (event: React.MouseEvent, noteId: string): Promise<void> => {
    if (!noteId) {
      console.error('Note ID is undefined');
      return;
    }
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        // Use empty string for worldId to delete from global notes
        const worldId = '';

        const noteService = NoteService.getInstance(worldId, campaignId);
        await noteService.delete(noteId);

        // Update local state
        setNotes(notes.filter(n => n.id !== noteId));

        notifications.show({
          title: 'Note Deleted',
          message: 'The note has been deleted successfully',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete note. Please try again.',
          color: 'red',
        });
      }
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Notes', href: '/notes' },
  ];

  // Show loading state
  if (loading && notes.length === 0) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.map((item, index) => (
              <Skeleton key={index} height={20} width={80} radius="xl" />
            ))}
          </Breadcrumbs>
          <Skeleton height={50} width="100%" radius="md" />
          <Skeleton height={300} width="100%" radius="md" />
        </Stack>
      </Container>
    );
  }

  // Show error state
  if (error && notes.length === 0) {
    return (
      <Container size="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
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
        <Group justify="space-between">
          <Title order={1}>All Notes</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreateNote}
          >
            Create Note
          </Button>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Group>
          <TextInput
            placeholder="Search notes..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: NoteType.GENERAL, label: 'General' },
              { value: NoteType.LORE, label: 'Lore' },
              { value: NoteType.QUEST, label: 'Quest' },
              { value: NoteType.PLAYER, label: 'Player' },
              { value: NoteType.DM, label: 'DM' },
              { value: NoteType.SESSION, label: 'Session' }
            ]}
            value={selectedType}
            onChange={setSelectedType}
            leftSection={<IconFilter size="1rem" />}
            clearable
          />
          <Select
            placeholder="Privacy"
            data={[
              { value: 'all', label: 'All Notes' },
              { value: 'public', label: 'Public Only' },
              { value: 'private', label: 'Private Only' }
            ]}
            value={showPrivate}
            onChange={setShowPrivate}
            leftSection={showPrivate === 'private' ? <IconLock size="1rem" /> : <IconLockOpen size="1rem" />}
          />
        </Group>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onChange={(value) => setViewMode(value || 'grid')}>
          <Tabs.List>
            <Tabs.Tab value="grid">Grid View</Tabs.Tab>
            <Tabs.Tab value="table">Table View</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconNote size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                No notes found. Create your first note to get started.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={handleCreateNote}
              >
                Create Note
              </Button>
            </Stack>
          </Paper>
        ) : viewMode === 'table' ? (
          <Table striped highlightOnHover tabularNums stickyHeader stickyHeaderOffset={60}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Privacy</Table.Th>
                <Table.Th>Related Entity</Table.Th>
                <Table.Th>World</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredNotes.map((note) => (
                <Table.Tr
                  key={note.id}
                  onClick={() => note.id && handleViewNote(note.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        radius="xl"
                        size="sm"
                        color={getNoteTypeColor(note.noteType)}
                      >
                        <IconNote size="0.8rem" />
                      </Avatar>
                      {note.title}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getNoteTypeColor(note.noteType)}>
                      {formatNoteType(note.noteType)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {note.isPrivate ? (
                      <Badge color="red" leftSection={<IconLock size="0.8rem" />}>
                        Private
                      </Badge>
                    ) : (
                      <Badge color="green" leftSection={<IconLockOpen size="0.8rem" />}>
                        Public
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {note.relatedEntityId ? (
                      <Group gap={4}>
                        <IconLink size="0.8rem" />
                        <Text size="sm">{note.relatedEntityType}</Text>
                      </Group>
                    ) : (
                      'None'
                    )}
                  </Table.Td>
                  <Table.Td>{note.worldId || 'Unknown'}</Table.Td>
                  <Table.Td>
                    {formatDate(note.createdAt)}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          note.id && handleViewNote(note.id);
                        }}
                      >
                        <IconEye size="1rem" />
                      </ActionIcon>
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDotsVertical size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={(e) => note.id && handleEditNote(e, note.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={(e) => note.id && handleDeleteNote(e, note.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                withBorder
                padding="lg"
                radius="md"
                onClick={() => note.id && handleViewNote(note.id)}
                style={{ cursor: 'pointer' }}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{note.title}</Text>
                  <Badge color={getNoteTypeColor(note.noteType)}>
                    {formatNoteType(note.noteType)}
                  </Badge>
                </Group>

                <Group mb="md">
                  {note.isPrivate ? (
                    <Badge color="red" leftSection={<IconLock size="0.8rem" />}>
                      Private
                    </Badge>
                  ) : (
                    <Badge color="green" leftSection={<IconLockOpen size="0.8rem" />}>
                      Public
                    </Badge>
                  )}
                  <Text size="xs" c="dimmed">
                    {formatDate(note.createdAt)}
                  </Text>
                </Group>

                <Text size="sm" c="dimmed" mb="md" lineClamp={3}>
                  {stripHtml(note.content)}
                </Text>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <Group mb="xs" gap="xs">
                    <IconTag size="0.8rem" />
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} size="xs" variant="light">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge size="xs" variant="light">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </Group>
                )}

                <Group mt="md" justify="flex-end">
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size="1rem" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size="1rem" />}
                        onClick={(e) => note.id && handleEditNote(e, note.id)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={(e) => note.id && handleDeleteNote(e, note.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}

/**
 * Get color based on note type
 * @param noteType Type of note
 * @returns Color string for Mantine components
 */
function getNoteTypeColor(noteType: string): string {
  switch (noteType) {
    case NoteType.GENERAL: return 'blue';
    case NoteType.LORE: return 'indigo';
    case NoteType.QUEST: return 'green';
    case NoteType.PLAYER: return 'orange';
    case NoteType.DM: return 'red';
    case NoteType.SESSION: return 'violet';
    default: return 'gray';
  }
}

/**
 * Format note type for display (capitalize first letter)
 * @param noteType Type of note
 * @returns Formatted note type string
 */
function formatNoteType(noteType: string): string {
  return noteType.charAt(0) + noteType.slice(1).toLowerCase();
}

/**
 * Format a date for display
 * @param date Date to format (can be Date, Firestore Timestamp, string, or null)
 * @returns Formatted date string
 */
function formatDate(date: Date | { toDate: () => Date } | string | null | undefined): string {
  if (!date) return 'Unknown';

  try {
    // Handle Firestore Timestamp
    if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }

    // Handle Date object
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }

    // Handle string date
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString();
      }
    }

    return 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Strip HTML tags from content
 * @param html HTML content to strip
 * @returns Plain text content
 */
function stripHtml(html: string | undefined): string {
  if (!html) return '';

  try {
    // Create a temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Return text content
    return temp.textContent || temp.innerText || '';
  } catch (error) {
    console.error('Error stripping HTML:', error);
    return '';
  }
}

// Skeleton component for loading state
function Skeleton({ height, width, radius }: { height: number, width: number | string, radius: string }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        backgroundColor: 'var(--mantine-color-gray-2)',
      }}
    />
  );
}

export default NoteListPage;
