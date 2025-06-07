/**
 * Transcript Viewer Component
 * 
 * Advanced transcript viewer with search, filtering, and export capabilities
 * Follows Mantine 8 patterns and integrates with existing Timeline system
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
  Select,
  Switch,
  Divider,
  ScrollArea,
  Highlight,
  Card,
  Tooltip,
  Menu,
  Modal,
  Textarea,
  NumberInput,
  Loader,
  Center,
  Alert,
  Pagination
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconShare,
  IconBookmark,
  IconEdit,
  IconTrash,
  IconCopy,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconSettings,
  IconChevronDown,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { TranscriptionSegment, SpeakerInfo, SessionTranscription } from '../../models/Transcription';
import { TranscriptionService } from '../../services/transcription.service';
import { useTranscriptionLogger } from '../../hooks/useSystemLogger';
import { LogCategory } from '../../utils/liveTranscriptionLogger';

/**
 * Transcript Viewer Props
 */
export interface TranscriptViewerProps {
  transcriptionId?: string;
  transcription?: SessionTranscription;
  segments?: TranscriptionSegment[];
  speakers?: SpeakerInfo[];
  enableSearch?: boolean;
  enableFiltering?: boolean;
  enableBookmarks?: boolean;
  enableExport?: boolean;
  enableEditing?: boolean;
  showSpeakerLabels?: boolean;
  showTimestamps?: boolean;
  showConfidence?: boolean;
  autoScroll?: boolean;
  highlightTerms?: string[];
  onSegmentClick?: (segment: TranscriptionSegment) => void;
  onSegmentEdit?: (segment: TranscriptionSegment, newText: string) => void;
  onBookmarkAdd?: (segment: TranscriptionSegment) => void;
  onExport?: (format: 'txt' | 'json' | 'srt' | 'vtt') => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Search and filter state
 */
interface FilterState {
  searchTerm: string;
  speakerFilter: string;
  confidenceThreshold: number;
  timeRange: [number, number] | null;
  showInterim: boolean;
}

/**
 * Transcript Viewer Component
 */
export function TranscriptViewer({
  transcriptionId,
  transcription: initialTranscription,
  segments: initialSegments,
  speakers: initialSpeakers,
  enableSearch = true,
  enableFiltering = true,
  enableBookmarks = true,
  enableExport = true,
  enableEditing = false,
  showSpeakerLabels = true,
  showTimestamps = true,
  showConfidence = false,
  autoScroll = false,
  highlightTerms = [],
  onSegmentClick,
  onSegmentEdit,
  onBookmarkAdd,
  onExport,
  className,
  style
}: TranscriptViewerProps) {
  // State management
  const [transcription, setTranscription] = useState<SessionTranscription | null>(initialTranscription || null);
  const [segments, setSegments] = useState<TranscriptionSegment[]>(initialSegments || []);
  const [speakers, setSpeakers] = useState<SpeakerInfo[]>(initialSpeakers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    speakerFilter: '',
    confidenceThreshold: 0.5,
    timeRange: null,
    showInterim: false
  });

  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [segmentsPerPage] = useState(50);
  const [editingSegment, setEditingSegment] = useState<TranscriptionSegment | null>(null);
  const [editText, setEditText] = useState('');
  const [showFilters, { toggle: toggleFilters }] = useDisclosure(false);
  const [isEditModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

  // Services
  const [transcriptionService] = useState(() => new TranscriptionService());
  const logger = useTranscriptionLogger(transcriptionId);

  // Load transcription data
  useEffect(() => {
    if (transcriptionId && !initialTranscription) {
      loadTranscription();
    }
  }, [transcriptionId, initialTranscription]);

  const loadTranscription = async () => {
    if (!transcriptionId) return;

    setLoading(true);
    setError(null);

    try {
      logger.info(LogCategory.DATABASE, 'Loading transcription data', {
        transcriptionId
      });
      const data = await transcriptionService.getById(transcriptionId);
      if (data) {
        setTranscription(data);
        setSegments(data.segments || []);
        setSpeakers(data.speakers || []);
        logger.info(LogCategory.DATABASE, 'Transcription data loaded successfully', {
          transcriptionId,
          segmentCount: data.segments?.length || 0,
          speakerCount: data.speakers?.length || 0
        });
      } else {
        setError('Transcription not found');
        logger.warn(LogCategory.DATABASE, 'Transcription not found', {
          transcriptionId
        });
      }
    } catch (err) {
      logger.error(LogCategory.DATABASE, 'Failed to load transcription', err as Error, {
        transcriptionId
      });
      setError('Failed to load transcription');
    } finally {
      setLoading(false);
    }
  };

  // Filter segments based on current filters
  const filteredSegments = useMemo(() => {
    let filtered = [...segments];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(segment =>
        segment.text.toLowerCase().includes(searchLower) ||
        segment.speakerName?.toLowerCase().includes(searchLower)
      );
    }

    // Speaker filter
    if (filters.speakerFilter) {
      filtered = filtered.filter(segment =>
        segment.speakerId === filters.speakerFilter ||
        segment.speakerName === filters.speakerFilter
      );
    }

    // Confidence filter
    filtered = filtered.filter(segment =>
      segment.confidence >= filters.confidenceThreshold
    );

    // Time range filter
    if (filters.timeRange) {
      const [start, end] = filters.timeRange;
      filtered = filtered.filter(segment =>
        segment.startTime >= start && segment.endTime <= end
      );
    }

    // Interim filter
    if (!filters.showInterim) {
      filtered = filtered.filter(segment => !segment.isInterim);
    }

    return filtered.sort((a, b) => a.startTime - b.startTime);
  }, [segments, filters]);

  // Paginated segments
  const paginatedSegments = useMemo(() => {
    const startIndex = (currentPage - 1) * segmentsPerPage;
    const endIndex = startIndex + segmentsPerPage;
    return filteredSegments.slice(startIndex, endIndex);
  }, [filteredSegments, currentPage, segmentsPerPage]);

  // Total pages
  const totalPages = Math.ceil(filteredSegments.length / segmentsPerPage);

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

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  // Handle segment edit
  const handleSegmentEdit = (segment: TranscriptionSegment) => {
    setEditingSegment(segment);
    setEditText(segment.text);
    openEditModal();
  };

  // Save segment edit
  const saveSegmentEdit = async () => {
    if (!editingSegment || !editText.trim()) return;

    try {
      await onSegmentEdit?.(editingSegment, editText.trim());
      
      // Update local state
      setSegments(prev => prev.map(segment =>
        segment.id === editingSegment.id
          ? { ...segment, text: editText.trim() }
          : segment
      ));

      notifications.show({
        title: 'Success',
        message: 'Segment updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      closeEditModal();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update segment',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Handle export
  const handleExport = (format: 'txt' | 'json' | 'srt' | 'vtt') => {
    onExport?.(format);
  };

  // Copy segment to clipboard
  const copySegment = async (segment: TranscriptionSegment) => {
    try {
      await navigator.clipboard.writeText(segment.text);
      notifications.show({
        title: 'Copied',
        message: 'Segment copied to clipboard',
        color: 'blue',
        icon: <IconCopy size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy segment',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Get speaker options for filter
  const speakerOptions = useMemo(() => {
    const uniqueSpeakers = new Set<string>();
    segments.forEach(segment => {
      if (segment.speakerName) {
        uniqueSpeakers.add(segment.speakerName);
      } else if (segment.speakerId) {
        uniqueSpeakers.add(segment.speakerId);
      }
    });
    
    return [
      { value: '', label: 'All Speakers' },
      ...Array.from(uniqueSpeakers).map(speaker => ({
        value: speaker,
        label: speaker
      }))
    ];
  }, [segments]);

  if (loading) {
    return (
      <Paper p="md" withBorder className={className} style={style}>
        <Center style={{ height: 400 }}>
          <Loader size="lg" />
        </Center>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="md" withBorder className={className} style={style}>
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder className={className} style={style}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Title order={4}>Transcript Viewer</Title>
          <Group gap="xs">
            {enableFiltering && (
              <ActionIcon
                variant={showFilters ? 'filled' : 'light'}
                onClick={toggleFilters}
              >
                <IconFilter size={16} />
              </ActionIcon>
            )}
            {enableExport && (
              <Menu>
                <Menu.Target>
                  <ActionIcon variant="light">
                    <IconDownload size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => handleExport('txt')}>
                    Export as Text
                  </Menu.Item>
                  <Menu.Item onClick={() => handleExport('json')}>
                    Export as JSON
                  </Menu.Item>
                  <Menu.Item onClick={() => handleExport('srt')}>
                    Export as SRT
                  </Menu.Item>
                  <Menu.Item onClick={() => handleExport('vtt')}>
                    Export as WebVTT
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>

        {/* Search and Filters */}
        {enableSearch && (
          <TextInput
            placeholder="Search transcript..."
            leftSection={<IconSearch size={16} />}
            value={filters.searchTerm}
            onChange={(event) => setFilters(prev => ({
              ...prev,
              searchTerm: event.currentTarget.value
            }))}
          />
        )}

        {/* Advanced Filters */}
        {enableFiltering && showFilters && (
          <Card withBorder>
            <Stack gap="md">
              <Title order={6}>Filters</Title>
              <Group grow>
                <Select
                  label="Speaker"
                  data={speakerOptions}
                  value={filters.speakerFilter}
                  onChange={(value) => setFilters(prev => ({
                    ...prev,
                    speakerFilter: value || ''
                  }))}
                />
                <NumberInput
                  label="Min Confidence"
                  value={filters.confidenceThreshold}
                  onChange={(value) => setFilters(prev => ({
                    ...prev,
                    confidenceThreshold: Number(value) || 0.5
                  }))}
                  min={0}
                  max={1}
                  step={0.1}
                  decimalScale={1}
                />
              </Group>
              <Switch
                label="Show interim results"
                checked={filters.showInterim}
                onChange={(event) => setFilters(prev => ({
                  ...prev,
                  showInterim: event.currentTarget.checked
                }))}
              />
            </Stack>
          </Card>
        )}

        {/* Transcript Content */}
        <ScrollArea style={{ height: 500 }}>
          {paginatedSegments.length === 0 ? (
            <Center style={{ height: 200 }}>
              <Text c="dimmed">No transcript segments found</Text>
            </Center>
          ) : (
            <Stack gap="xs">
              {paginatedSegments.map((segment) => (
                <Card 
                  key={segment.id} 
                  withBorder 
                  p="sm"
                  style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                  onClick={() => onSegmentClick?.(segment)}
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      {/* Segment Header */}
                      <Group gap="sm">
                        {showTimestamps && (
                          <Badge size="xs" variant="light">
                            {formatTimestamp(segment.startTime)}
                          </Badge>
                        )}
                        {showSpeakerLabels && segment.speakerName && (
                          <Badge size="xs" color="blue">
                            {segment.speakerName}
                          </Badge>
                        )}
                        {showConfidence && (
                          <Badge 
                            size="xs" 
                            color={getConfidenceColor(segment.confidence)}
                          >
                            {Math.round(segment.confidence * 100)}%
                          </Badge>
                        )}
                        {segment.isInterim && (
                          <Badge size="xs" color="gray">
                            Interim
                          </Badge>
                        )}
                      </Group>

                      {/* Segment Text */}
                      <Highlight
                        highlight={[filters.searchTerm, ...highlightTerms].filter(Boolean)}
                        size="sm"
                      >
                        {segment.text}
                      </Highlight>
                    </Stack>

                    {/* Actions */}
                    <Group gap="xs">
                      <Tooltip label="Copy">
                        <ActionIcon 
                          size="sm" 
                          variant="subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            copySegment(segment);
                          }}
                        >
                          <IconCopy size={12} />
                        </ActionIcon>
                      </Tooltip>
                      {enableBookmarks && (
                        <Tooltip label="Bookmark">
                          <ActionIcon 
                            size="sm" 
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookmarkAdd?.(segment);
                            }}
                          >
                            <IconBookmark size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {enableEditing && (
                        <Tooltip label="Edit">
                          <ActionIcon 
                            size="sm" 
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentEdit(segment);
                            }}
                          >
                            <IconEdit size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}

        {/* Statistics */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {paginatedSegments.length} of {filteredSegments.length} segments
          </Text>
          {transcription && (
            <Group gap="md">
              <Text size="sm" c="dimmed">
                Duration: {formatTimestamp(transcription.audioDuration || 0)}
              </Text>
              <Text size="sm" c="dimmed">
                Speakers: {speakers.length}
              </Text>
              <Text size="sm" c="dimmed">
                Avg Confidence: {Math.round((transcription.averageConfidence || 0) * 100)}%
              </Text>
            </Group>
          )}
        </Group>
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Segment"
        size="md"
      >
        <Stack gap="md">
          <Textarea
            label="Segment Text"
            value={editText}
            onChange={(event) => setEditText(event.currentTarget.value)}
            minRows={3}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={saveSegmentEdit}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
