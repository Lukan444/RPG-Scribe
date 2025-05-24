/**
 * Timeline Editor Component
 *
 * Interactive timeline editor with drag-and-drop functionality,
 * visual timeline entry creation and editing capabilities.
 */

import { useState, useCallback } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Box,
  Stack,
  Card,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Switch,
  Alert,
  Flex,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconClock,
  IconWorld,
  IconCalendarEvent,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { TimeUnit, TimelineEntryType } from '../../constants/timelineConstants';
import { TimelineEntryCreationParams } from '../../models/Timeline';
import { formatTimeGap } from '../../utils/timelineUtils';

/**
 * Timeline entry for editing
 */
interface EditableTimelineEntry {
  id: string;
  title: string;
  description?: string;
  sequence: number;
  entryType: TimelineEntryType;
  importance: number;

  // Time properties
  timeGapBefore?: {
    duration: number;
    unit: TimeUnit;
    description?: string;
  };
  duration?: {
    duration: number;
    unit: TimeUnit;
  };

  // Associated data
  associatedEntityId?: string;
  associatedEntityType?: string;
  locationId?: string;
  participants?: string[];

  // Validation
  hasConflicts?: boolean;
  validationStatus?: 'valid' | 'warning' | 'error';
  conflictTypes?: string[];
}

/**
 * Timeline editor props
 */
interface TimelineEditorProps {
  entries: EditableTimelineEntry[];
  onEntriesChange: (entries: EditableTimelineEntry[]) => void;
  onEntryCreate?: (params: TimelineEntryCreationParams) => Promise<string>;
  onEntryUpdate?: (id: string, updates: Partial<EditableTimelineEntry>) => Promise<boolean>;
  onEntryDelete?: (id: string) => Promise<boolean>;
  enableDragDrop?: boolean;
  showValidation?: boolean;
}

/**
 * Timeline Editor Component
 */
export function TimelineEditor({
  entries,
  onEntriesChange,
  onEntryCreate,
  onEntryUpdate,
  onEntryDelete,
  enableDragDrop = true,
  showValidation = true
}: TimelineEditorProps) {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditableTimelineEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form for creating/editing entries
  const form = useForm<TimelineEntryCreationParams>({
    initialValues: {
      entryType: TimelineEntryType.EVENT,
      associatedEntityId: '',
      associatedEntityType: 'EVENT',
      title: '',
      description: '',
      importance: 5,
      position: {
        sequence: entries.length,
        timeGapBefore: {
          duration: 1,
          unit: TimeUnit.HOURS
        }
      },
      duration: {
        duration: 30,
        unit: TimeUnit.MINUTES
      }
    },
    validate: {
      title: (value) => (value.length < 2 ? 'Title must be at least 2 characters' : null),
      associatedEntityId: (value) => (value.length < 1 ? 'Entity ID is required' : null),
    }
  });

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !enableDragDrop) return;

    const items = Array.from(entries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence: index
    }));

    onEntriesChange(updatedItems);
  }, [entries, onEntriesChange, enableDragDrop]);

  // Handle entry creation
  const handleCreateEntry = useCallback(async (values: TimelineEntryCreationParams) => {
    try {
      if (onEntryCreate) {
        const newId = await onEntryCreate(values);

        // Add to local state
        const newEntry: EditableTimelineEntry = {
          id: newId,
          title: values.title,
          description: values.description,
          sequence: values.position?.sequence || entries.length,
          entryType: values.entryType,
          importance: values.importance || 5,
          timeGapBefore: values.position?.timeGapBefore,
          duration: values.duration,
          associatedEntityId: values.associatedEntityId,
          associatedEntityType: values.associatedEntityType,
          locationId: values.locationId,
          participants: values.participants,
          validationStatus: 'valid'
        };

        onEntriesChange([...entries, newEntry]);
      }

      setIsCreateModalOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create timeline entry:', error);
    }
  }, [onEntryCreate, entries, onEntriesChange, form]);

  // Handle entry editing
  const handleEditEntry = useCallback(async (values: TimelineEntryCreationParams) => {
    if (!editingEntry || !onEntryUpdate) return;

    try {
      const updates: Partial<EditableTimelineEntry> = {
        title: values.title,
        description: values.description,
        entryType: values.entryType,
        importance: values.importance,
        timeGapBefore: values.position?.timeGapBefore,
        duration: values.duration,
        associatedEntityId: values.associatedEntityId,
        associatedEntityType: values.associatedEntityType,
        locationId: values.locationId,
        participants: values.participants
      };

      const success = await onEntryUpdate(editingEntry.id, updates);

      if (success) {
        // Update local state
        const updatedEntries = entries.map(entry =>
          entry.id === editingEntry.id ? { ...entry, ...updates } : entry
        );
        onEntriesChange(updatedEntries);
      }

      setIsEditModalOpen(false);
      setEditingEntry(null);
      form.reset();
    } catch (error) {
      console.error('Failed to update timeline entry:', error);
    }
  }, [editingEntry, onEntryUpdate, entries, onEntriesChange, form]);

  // Handle entry deletion
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!onEntryDelete) return;

    try {
      const success = await onEntryDelete(entryId);

      if (success) {
        const updatedEntries = entries.filter(entry => entry.id !== entryId);
        // Resequence remaining entries
        const resequencedEntries = updatedEntries.map((entry, index) => ({
          ...entry,
          sequence: index
        }));
        onEntriesChange(resequencedEntries);
      }
    } catch (error) {
      console.error('Failed to delete timeline entry:', error);
    }
  }, [onEntryDelete, entries, onEntriesChange]);

  // Open edit modal
  const openEditModal = useCallback((entry: EditableTimelineEntry) => {
    setEditingEntry(entry);
    form.setValues({
      entryType: entry.entryType,
      associatedEntityId: entry.associatedEntityId || '',
      associatedEntityType: entry.associatedEntityType || 'EVENT',
      title: entry.title,
      description: entry.description || '',
      importance: entry.importance,
      position: {
        sequence: entry.sequence,
        timeGapBefore: entry.timeGapBefore
      },
      duration: entry.duration,
      locationId: entry.locationId,
      participants: entry.participants
    });
    setIsEditModalOpen(true);
  }, [form]);

  // Get validation color
  const getValidationColor = (status?: string) => {
    switch (status) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'valid': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Title order={4}>Timeline Editor</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Entry
          </Button>
        </Group>

        {showValidation && entries.some(e => e.hasConflicts) && (
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
            Some timeline entries have validation conflicts. Review and resolve them for optimal timeline consistency.
          </Alert>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timeline-entries">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Stack>
                  {entries.map((entry, index) => (
                    <Draggable
                      key={entry.id}
                      draggableId={entry.id}
                      index={index}
                      isDragDisabled={!enableDragDrop}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          withBorder
                          shadow={snapshot.isDragging ? 'lg' : 'sm'}
                          p="md"
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1
                          }}
                        >
                          <Group justify="space-between" mb="sm">
                            <Group>
                              {enableDragDrop && (
                                <div {...provided.dragHandleProps}>
                                  <ActionIcon variant="subtle" size="sm">
                                    <IconGripVertical size={14} />
                                  </ActionIcon>
                                </div>
                              )}

                              <Badge color={getValidationColor(entry.validationStatus)}>
                                Seq: {entry.sequence}
                              </Badge>

                              <Badge color="blue">
                                {entry.entryType.replace('_', ' ')}
                              </Badge>

                              {entry.hasConflicts && (
                                <Badge color="red" leftSection={<IconAlertTriangle size={12} />}>
                                  Conflicts
                                </Badge>
                              )}
                            </Group>

                            <Group>
                              <Tooltip label="Edit Entry">
                                <ActionIcon
                                  variant="light"
                                  onClick={() => openEditModal(entry)}
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </Tooltip>

                              <Tooltip label="Delete Entry">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Group>

                          <Title order={6} mb="xs">{entry.title}</Title>

                          {entry.description && (
                            <Text size="sm" c="dimmed" mb="sm">{entry.description}</Text>
                          )}

                          <Group>
                            {entry.timeGapBefore && (
                              <Text size="xs" c="dimmed">
                                Gap: {formatTimeGap(entry.timeGapBefore)}
                              </Text>
                            )}

                            {entry.duration && (
                              <Text size="xs" c="dimmed">
                                Duration: {formatTimeGap(entry.duration)}
                              </Text>
                            )}

                            <Text size="xs" c="dimmed">
                              Importance: {entry.importance}/10
                            </Text>
                          </Group>

                          {entry.hasConflicts && entry.conflictTypes && (
                            <Alert color="red" mt="sm">
                              <Text size="xs">
                                Conflicts: {entry.conflictTypes.join(', ')}
                              </Text>
                            </Alert>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Stack>
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {entries.length === 0 && (
          <Card withBorder p="xl">
            <Stack align="center">
              <IconCalendarEvent size={48} color="gray" />
              <Text c="dimmed">No timeline entries yet</Text>
              <Text size="sm" c="dimmed">Click "Add Entry" to create your first timeline entry</Text>
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Create Entry Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Timeline Entry"
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleCreateEntry)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter entry title"
              required
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Description"
              placeholder="Enter entry description"
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                label="Entry Type"
                data={Object.values(TimelineEntryType).map(type => ({
                  value: type,
                  label: type.replace('_', ' ')
                }))}
                {...form.getInputProps('entryType')}
              />

              <NumberInput
                label="Importance"
                min={1}
                max={10}
                {...form.getInputProps('importance')}
              />
            </Group>

            <TextInput
              label="Associated Entity ID"
              placeholder="Enter entity ID"
              required
              {...form.getInputProps('associatedEntityId')}
            />

            <Group grow>
              <NumberInput
                label="Time Gap (Duration)"
                min={0}
                {...form.getInputProps('position.timeGapBefore.duration')}
              />

              <Select
                label="Time Unit"
                data={Object.values(TimeUnit).map(unit => ({
                  value: unit,
                  label: unit
                }))}
                {...form.getInputProps('position.timeGapBefore.unit')}
              />
            </Group>

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconDeviceFloppy size={16} />}>
                Create Entry
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Timeline Entry"
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleEditEntry)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter entry title"
              required
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Description"
              placeholder="Enter entry description"
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                label="Entry Type"
                data={Object.values(TimelineEntryType).map(type => ({
                  value: type,
                  label: type.replace('_', ' ')
                }))}
                {...form.getInputProps('entryType')}
              />

              <NumberInput
                label="Importance"
                min={1}
                max={10}
                {...form.getInputProps('importance')}
              />
            </Group>

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconDeviceFloppy size={16} />}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}
