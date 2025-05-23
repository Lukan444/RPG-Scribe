import React, { useState } from 'react';
import {
  Paper,
  Text,
  Group,
  Button,
  Stack,
  ThemeIcon,
  Box,
  Divider,
  LoadingOverlay,
  Modal,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconGripVertical,
  IconTrash,
  IconEdit,
  IconEye,
  IconDeviceFloppy,
  IconAlertCircle
} from '@tabler/icons-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult
} from '@hello-pangea/dnd';
import { useDisclosure } from '@mantine/hooks';
import { EntityType } from '../../models/EntityType';

interface DragDropEntityOrganizerProps<T> {
  data: T[];
  entityType: any; // Accept any EntityType to handle different enum implementations
  loading?: boolean;
  error?: string | null;
  onSaveOrder: (newOrder: T[]) => Promise<void> | void; // Accept both Promise<void> and void return types
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  idField?: string;
  nameField?: string;
  descriptionField?: string;
  renderItem?: (item: T) => React.ReactNode;
  title?: string;
}

export function DragDropEntityOrganizer<T extends { [key: string]: any }>({
  data,
  entityType,
  loading = false,
  error = null,
  onSaveOrder,
  onView,
  onEdit,
  onDelete,
  idField = 'id',
  nameField = 'name',
  descriptionField = 'description',
  renderItem,
  title
}: DragDropEntityOrganizerProps<T>) {
  const [items, setItems] = useState<T[]>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  // Get entity type color
  const getEntityColor = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return 'teal';
    if (entityTypeStr.includes('LOCATION')) return 'blue';
    if (entityTypeStr.includes('ITEM')) return 'yellow';
    if (entityTypeStr.includes('EVENT')) return 'violet';
    if (entityTypeStr.includes('SESSION')) return 'orange';
    if (entityTypeStr.includes('CAMPAIGN')) return 'red';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'indigo';
    if (entityTypeStr.includes('NOTE')) return 'cyan';

    return 'gray';
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
    setHasChanges(true);
  };

  // Handle save order
  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      const result = onSaveOrder(items);

      // Handle both Promise and void return types
      if (result instanceof Promise) {
        await result;
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (item: T) => {
    setItemToDelete(item);
    openConfirmModal();
  };

  // Handle delete
  const handleDelete = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete);
      closeConfirmModal();
    }
  };

  return (
    <Paper withBorder shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            {title || `Organize ${(() => {
              // Format entity type name for display
              const entityTypeStr = entityType.toString();

              // Handle special cases
              if (entityTypeStr.toUpperCase().includes('RPGWORLD') || entityTypeStr.toUpperCase().includes('RPG_WORLD')) {
                return 'RPG Worlds';
              }

              // Format normal cases - capitalize first letter and add 's'
              return entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1).toLowerCase() + 's';
            })()}`}
          </Text>

          {hasChanges && (
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSaveOrder}
              loading={isSaving}
              color={getEntityColor()}
            >
              Save Changes
            </Button>
          )}
        </Group>

        <Divider />

        <div style={{ position: 'relative', minHeight: '200px' }}>
          <LoadingOverlay visible={loading || isSaving} overlayProps={{ blur: 2 }} />

          {error ? (
            <Text c="red" ta="center" p="md">{error}</Text>
          ) : items.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No items found</Text>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="entities">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {items.map((item, index) => (
                      <Draggable
                        key={item[idField]}
                        draggableId={item[idField]}
                        index={index}
                      >
                        {(provided: DraggableProvided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            withBorder
                            p="md"
                            radius="md"
                            mb="sm"
                          >
                            <Group justify="space-between" wrap="nowrap">
                              <Group wrap="nowrap">
                                <Box
                                  {...provided.dragHandleProps}
                                  style={{ cursor: 'grab' }}
                                >
                                  <IconGripVertical size={18} />
                                </Box>

                                {renderItem ? (
                                  renderItem(item)
                                ) : (
                                  <div>
                                    <Text fw={500}>{item[nameField]}</Text>
                                    <Text size="sm" c="dimmed" lineClamp={1}>
                                      {item[descriptionField] || 'No description available'}
                                    </Text>
                                  </div>
                                )}
                              </Group>

                              <Group gap="xs">
                                {onView && (
                                  <Tooltip label="View">
                                    <ActionIcon
                                      variant="light"
                                      color={getEntityColor()}
                                      onClick={() => onView(item)}
                                    >
                                      <IconEye size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}

                                {onEdit && (
                                  <Tooltip label="Edit">
                                    <ActionIcon
                                      variant="light"
                                      color="blue"
                                      onClick={() => onEdit(item)}
                                    >
                                      <IconEdit size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}

                                {onDelete && (
                                  <Tooltip label="Delete">
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      onClick={() => handleDeleteConfirm(item)}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </Group>
                            </Group>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </Stack>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmModalOpened}
        onClose={closeConfirmModal}
        title={
          <Group>
            <ThemeIcon color="red" variant="light">
              <IconAlertCircle size={16} />
            </ThemeIcon>
            <Text>Confirm Deletion</Text>
          </Group>
        }
        centered
      >
        <Text size="sm">
          Are you sure you want to delete{' '}
          <Text span fw={500} inherit>
            {itemToDelete?.[nameField]}
          </Text>
          ? This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeConfirmModal}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
}

export default DragDropEntityOrganizer;