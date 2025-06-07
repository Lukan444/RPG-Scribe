/**
 * Session Bookmarks Component
 * 
 * Manages bookmarks and highlights for transcription sessions
 * Integrates with Timeline system and supports collaboration features
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Stack,
  Badge,
  TextInput,
  Textarea,
  Select,
  Card,
  Tooltip,
  Menu,
  Modal,
  ColorPicker,
  Divider,
  ScrollArea,
  Alert,
  Loader,
  Center,
  Tabs,
  Grid
} from '@mantine/core';
import {
  IconBookmark,
  IconBookmarkFilled,
  IconHighlight,
  IconEdit,
  IconTrash,
  IconShare,
  IconCopy,
  IconPlus,
  IconFilter,
  IconSearch,
  IconClock,
  IconUser,
  IconTag,
  IconStar,
  IconStarFilled,
  IconMessage,
  IconCheck,
  IconX,
  IconSwords
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { TranscriptionSegment } from '../../models/Transcription';

/**
 * Bookmark types
 */
export enum BookmarkType {
  IMPORTANT = 'important',
  FUNNY = 'funny',
  COMBAT = 'combat',
  ROLEPLAY = 'roleplay',
  DISCOVERY = 'discovery',
  DECISION = 'decision',
  CUSTOM = 'custom'
}

/**
 * Bookmark interface
 */
export interface SessionBookmark {
  id: string;
  segmentId: string;
  timestamp: number;
  title: string;
  description?: string;
  type: BookmarkType;
  color: string;
  tags: string[];
  isStarred: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  segment?: TranscriptionSegment;
  comments: BookmarkComment[];
}

/**
 * Bookmark comment interface
 */
export interface BookmarkComment {
  id: string;
  bookmarkId: string;
  text: string;
  createdBy: string;
  createdAt: Date;
}

/**
 * Session Bookmarks Props
 */
export interface SessionBookmarksProps {
  sessionId: string;
  transcriptionId: string;
  segments: TranscriptionSegment[];
  bookmarks?: SessionBookmark[];
  enableCollaboration?: boolean;
  enableComments?: boolean;
  enableSharing?: boolean;
  onBookmarkCreate?: (bookmark: Omit<SessionBookmark, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBookmarkUpdate?: (bookmarkId: string, updates: Partial<SessionBookmark>) => void;
  onBookmarkDelete?: (bookmarkId: string) => void;
  onBookmarkClick?: (bookmark: SessionBookmark) => void;
  onCommentAdd?: (bookmarkId: string, comment: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Bookmark type configurations
 */
const BOOKMARK_TYPES = {
  [BookmarkType.IMPORTANT]: { label: 'Important', color: '#e03131', icon: IconStar },
  [BookmarkType.FUNNY]: { label: 'Funny', color: '#fd7e14', icon: IconMessage },
  [BookmarkType.COMBAT]: { label: 'Combat', color: '#d6336c', icon: IconSwords },
  [BookmarkType.ROLEPLAY]: { label: 'Roleplay', color: '#7950f2', icon: IconUser },
  [BookmarkType.DISCOVERY]: { label: 'Discovery', color: '#12b886', icon: IconSearch },
  [BookmarkType.DECISION]: { label: 'Decision', color: '#1971c2', icon: IconCheck },
  [BookmarkType.CUSTOM]: { label: 'Custom', color: '#495057', icon: IconTag }
};

/**
 * Session Bookmarks Component
 */
export function SessionBookmarks({
  sessionId,
  transcriptionId,
  segments,
  bookmarks: initialBookmarks = [],
  enableCollaboration = true,
  enableComments = true,
  enableSharing = true,
  onBookmarkCreate,
  onBookmarkUpdate,
  onBookmarkDelete,
  onBookmarkClick,
  onCommentAdd,
  className,
  style
}: SessionBookmarksProps) {
  // State management
  const [bookmarks, setBookmarks] = useState<SessionBookmark[]>(initialBookmarks);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<BookmarkType | ''>('');
  const [starredOnly, setStarredOnly] = useState(false);

  // Modal state
  const [isCreateModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [isEditModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [selectedSegment, setSelectedSegment] = useState<TranscriptionSegment | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<SessionBookmark | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: BookmarkType.IMPORTANT,
    color: BOOKMARK_TYPES[BookmarkType.IMPORTANT].color,
    tags: [] as string[],
    isStarred: false
  });

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [activeCommentBookmark, setActiveCommentBookmark] = useState<string | null>(null);

  // Filter bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = [...bookmarks];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.description?.toLowerCase().includes(searchLower) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(bookmark => bookmark.type === typeFilter);
    }

    // Starred filter
    if (starredOnly) {
      filtered = filtered.filter(bookmark => bookmark.isStarred);
    }

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }, [bookmarks, searchTerm, typeFilter, starredOnly]);

  // Format timestamp
  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Create bookmark
  const createBookmark = useCallback((segment: TranscriptionSegment) => {
    setSelectedSegment(segment);
    setFormData({
      title: `Bookmark at ${formatTimestamp(segment.startTime)}`,
      description: segment.text.substring(0, 100) + (segment.text.length > 100 ? '...' : ''),
      type: BookmarkType.IMPORTANT,
      color: BOOKMARK_TYPES[BookmarkType.IMPORTANT].color,
      tags: [],
      isStarred: false
    });
    openCreateModal();
  }, [openCreateModal]);

  // Save bookmark
  const saveBookmark = async () => {
    if (!selectedSegment) return;

    const newBookmark: Omit<SessionBookmark, 'id' | 'createdAt' | 'updatedAt'> = {
      segmentId: selectedSegment.id,
      timestamp: selectedSegment.startTime,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      color: formData.color,
      tags: formData.tags,
      isStarred: formData.isStarred,
      createdBy: 'current-user', // TODO: Get from auth context
      segment: selectedSegment,
      comments: []
    };

    try {
      await onBookmarkCreate?.(newBookmark);
      
      // Add to local state
      const bookmark: SessionBookmark = {
        ...newBookmark,
        id: `bookmark_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setBookmarks(prev => [...prev, bookmark]);
      
      notifications.show({
        title: 'Success',
        message: 'Bookmark created successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      closeCreateModal();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create bookmark',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Edit bookmark
  const editBookmark = (bookmark: SessionBookmark) => {
    setEditingBookmark(bookmark);
    setFormData({
      title: bookmark.title,
      description: bookmark.description || '',
      type: bookmark.type,
      color: bookmark.color,
      tags: bookmark.tags,
      isStarred: bookmark.isStarred
    });
    openEditModal();
  };

  // Update bookmark
  const updateBookmark = async () => {
    if (!editingBookmark) return;

    const updates: Partial<SessionBookmark> = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      color: formData.color,
      tags: formData.tags,
      isStarred: formData.isStarred,
      updatedAt: new Date()
    };

    try {
      await onBookmarkUpdate?.(editingBookmark.id, updates);
      
      // Update local state
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.id === editingBookmark.id
          ? { ...bookmark, ...updates }
          : bookmark
      ));

      notifications.show({
        title: 'Success',
        message: 'Bookmark updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      closeEditModal();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update bookmark',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Delete bookmark
  const deleteBookmark = async (bookmarkId: string) => {
    try {
      await onBookmarkDelete?.(bookmarkId);
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      
      notifications.show({
        title: 'Success',
        message: 'Bookmark deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete bookmark',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Toggle star
  const toggleStar = async (bookmark: SessionBookmark) => {
    const updates = { isStarred: !bookmark.isStarred };
    await onBookmarkUpdate?.(bookmark.id, updates);
    
    setBookmarks(prev => prev.map(b =>
      b.id === bookmark.id ? { ...b, ...updates } : b
    ));
  };

  // Add comment
  const addComment = async (bookmarkId: string) => {
    if (!commentText.trim()) return;

    try {
      await onCommentAdd?.(bookmarkId, commentText.trim());
      
      // Add to local state
      const comment: BookmarkComment = {
        id: `comment_${Date.now()}`,
        bookmarkId,
        text: commentText.trim(),
        createdBy: 'current-user',
        createdAt: new Date()
      };

      setBookmarks(prev => prev.map(bookmark =>
        bookmark.id === bookmarkId
          ? { ...bookmark, comments: [...bookmark.comments, comment] }
          : bookmark
      ));

      setCommentText('');
      setActiveCommentBookmark(null);

      notifications.show({
        title: 'Success',
        message: 'Comment added successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add comment',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Get type options
  const typeOptions = Object.entries(BOOKMARK_TYPES).map(([key, config]) => ({
    value: key,
    label: config.label
  }));

  return (
    <Paper p="md" withBorder className={className} style={style}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Title order={4}>Session Bookmarks</Title>
          <Group gap="xs">
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                if (segments.length > 0) {
                  createBookmark(segments[0]);
                }
              }}
              disabled={segments.length === 0}
            >
              Add Bookmark
            </Button>
          </Group>
        </Group>

        {/* Search and Filters */}
        <Group grow>
          <TextInput
            placeholder="Search bookmarks..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
          <Select
            placeholder="Filter by type"
            data={[{ value: '', label: 'All Types' }, ...typeOptions]}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as BookmarkType | '')}
          />
          <Button
            variant={starredOnly ? 'filled' : 'light'}
            leftSection={starredOnly ? <IconStarFilled size={16} /> : <IconStar size={16} />}
            onClick={() => setStarredOnly(!starredOnly)}
          >
            Starred
          </Button>
        </Group>

        {/* Bookmarks List */}
        <ScrollArea style={{ height: 500 }}>
          {filteredBookmarks.length === 0 ? (
            <Center style={{ height: 200 }}>
              <Stack align="center" gap="md">
                <IconBookmark size={48} color="gray" />
                <Text c="dimmed">No bookmarks found</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="md">
              {filteredBookmarks.map((bookmark) => {
                const typeConfig = BOOKMARK_TYPES[bookmark.type];
                const IconComponent = typeConfig.icon;

                return (
                  <Card 
                    key={bookmark.id} 
                    withBorder 
                    p="md"
                    style={{ 
                      borderLeft: `4px solid ${bookmark.color}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => onBookmarkClick?.(bookmark)}
                  >
                    <Stack gap="sm">
                      {/* Bookmark Header */}
                      <Group justify="space-between">
                        <Group gap="sm">
                          <IconComponent size={16} color={bookmark.color} />
                          <Text fw={500}>{bookmark.title}</Text>
                          <Badge size="xs" variant="light">
                            {formatTimestamp(bookmark.timestamp)}
                          </Badge>
                          {bookmark.isStarred && (
                            <IconStarFilled size={14} color="gold" />
                          )}
                        </Group>
                        
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(bookmark);
                            }}
                          >
                            {bookmark.isStarred ? 
                              <IconStarFilled size={12} /> : 
                              <IconStar size={12} />
                            }
                          </ActionIcon>
                          <Menu>
                            <Menu.Target>
                              <ActionIcon size="sm" variant="subtle">
                                <IconEdit size={12} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editBookmark(bookmark);
                                }}
                              >
                                Edit
                              </Menu.Item>
                              {enableSharing && (
                                <Menu.Item leftSection={<IconShare size={14} />}>
                                  Share
                                </Menu.Item>
                              )}
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBookmark(bookmark.id);
                                }}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Group>

                      {/* Description */}
                      {bookmark.description && (
                        <Text size="sm" c="dimmed">
                          {bookmark.description}
                        </Text>
                      )}

                      {/* Tags */}
                      {bookmark.tags.length > 0 && (
                        <Group gap="xs">
                          {bookmark.tags.map((tag, index) => (
                            <Badge key={index} size="xs" variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </Group>
                      )}

                      {/* Segment Preview */}
                      {bookmark.segment && (
                        <Card withBorder p="xs" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            "{bookmark.segment.text}"
                          </Text>
                        </Card>
                      )}

                      {/* Comments */}
                      {enableComments && (
                        <Stack gap="xs">
                          {bookmark.comments.map((comment) => (
                            <Card key={comment.id} withBorder p="xs">
                              <Group justify="space-between">
                                <Text size="xs">{comment.text}</Text>
                                <Text size="xs" c="dimmed">
                                  {comment.createdBy}
                                </Text>
                              </Group>
                            </Card>
                          ))}
                          
                          {activeCommentBookmark === bookmark.id ? (
                            <Group gap="xs">
                              <TextInput
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(event) => setCommentText(event.currentTarget.value)}
                                style={{ flex: 1 }}
                                size="xs"
                              />
                              <ActionIcon
                                size="sm"
                                onClick={() => addComment(bookmark.id)}
                                disabled={!commentText.trim()}
                              >
                                <IconCheck size={12} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                onClick={() => {
                                  setActiveCommentBookmark(null);
                                  setCommentText('');
                                }}
                              >
                                <IconX size={12} />
                              </ActionIcon>
                            </Group>
                          ) : (
                            <Button
                              size="xs"
                              variant="subtle"
                              leftSection={<IconMessage size={12} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentBookmark(bookmark.id);
                              }}
                            >
                              Add Comment
                            </Button>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </ScrollArea>

        {/* Statistics */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {filteredBookmarks.length} of {bookmarks.length} bookmarks
          </Text>
          <Group gap="md">
            <Text size="sm" c="dimmed">
              Starred: {bookmarks.filter(b => b.isStarred).length}
            </Text>
            <Text size="sm" c="dimmed">
              Comments: {bookmarks.reduce((sum, b) => sum + b.comments.length, 0)}
            </Text>
          </Group>
        </Group>
      </Stack>

      {/* Create/Edit Modal */}
      <Modal
        opened={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          closeCreateModal();
          closeEditModal();
        }}
        title={isCreateModalOpen ? 'Create Bookmark' : 'Edit Bookmark'}
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            value={formData.title}
            onChange={(event) => setFormData(prev => ({
              ...prev,
              title: event.currentTarget.value
            }))}
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(event) => setFormData(prev => ({
              ...prev,
              description: event.currentTarget.value
            }))}
            minRows={2}
          />
          
          <Select
            label="Type"
            data={typeOptions}
            value={formData.type}
            onChange={(value) => {
              const type = value as BookmarkType;
              setFormData(prev => ({
                ...prev,
                type,
                color: BOOKMARK_TYPES[type].color
              }));
            }}
          />
          
          <Stack gap="xs">
            <Text size="sm" fw={500}>Color</Text>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color }))}
            />
          </Stack>
          
          <Group justify="flex-end">
            <Button 
              variant="light" 
              onClick={() => {
                closeCreateModal();
                closeEditModal();
              }}
            >
              Cancel
            </Button>
            <Button onClick={isCreateModalOpen ? saveBookmark : updateBookmark}>
              {isCreateModalOpen ? 'Create' : 'Update'} Bookmark
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
