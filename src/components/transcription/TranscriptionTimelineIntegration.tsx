/**
 * Transcription Timeline Integration Component
 * 
 * Integrates transcription events with the existing Timeline system
 * Supports real-time timeline updates from live transcription
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Stack,
  Badge,
  Card,
  Tooltip,
  Switch,
  Select,
  Divider,
  Alert,
  Loader,
  Center,
  Modal,
  Textarea,
  NumberInput,
  TextInput
} from '@mantine/core';
import {
  IconTimeline,
  IconCheck,
  IconX,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconAlertTriangle,
  IconClock,
  IconUsers,
  IconMapPin,
  IconSwords,
  IconMessage
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useTimeline } from '../../contexts/TimelineContext';
import { TimelineEventSuggestion, ExtractedEntity, SessionTranscription } from '../../models/Transcription';
import { RPGTimelineEvent, TimelineEventType } from '../../types/timeline.types';
import { EventType } from '../../models/EventType';
import { EntityType } from '../../models/EntityType';

/**
 * Timeline Integration Props
 */
export interface TranscriptionTimelineIntegrationProps {
  sessionId: string;
  campaignId: string;
  worldId: string;
  transcription?: SessionTranscription;
  eventSuggestions: TimelineEventSuggestion[];
  extractedEntities: ExtractedEntity[];
  enableRealTimeUpdates?: boolean;
  enableAutoApproval?: boolean;
  autoApprovalThreshold?: number;
  onEventApproved?: (eventId: string, timelineEventId: string) => void;
  onEventRejected?: (eventId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Event suggestion with approval status
 */
interface EventSuggestionWithStatus extends TimelineEventSuggestion {
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  timelineEventId?: string;
  rejectionReason?: string;
}

/**
 * Transcription event type mapping to timeline event types
 */
const TRANSCRIPTION_TO_TIMELINE_TYPE_MAP: Record<string, TimelineEventType> = {
  'combat': 'combat',
  'social': 'social',
  'exploration': 'exploration',
  'discovery': 'exploration',
  'decision': 'milestone',
  'quest': 'quest',
  'travel': 'world-event',
  'roleplay': 'social'
};

/**
 * Transcription Timeline Integration Component
 */
export function TranscriptionTimelineIntegration({
  sessionId,
  campaignId,
  worldId,
  transcription,
  eventSuggestions,
  extractedEntities,
  enableRealTimeUpdates = true,
  enableAutoApproval = false,
  autoApprovalThreshold = 0.9,
  onEventApproved,
  onEventRejected,
  className,
  style
}: TranscriptionTimelineIntegrationProps) {
  // Timeline context
  const { state: timelineState, actions: timelineActions } = useTimeline();

  // State management
  const [suggestions, setSuggestions] = useState<EventSuggestionWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(enableAutoApproval);
  const [confidenceThreshold, setConfidenceThreshold] = useState(autoApprovalThreshold);

  // Modal state
  const [editingSuggestion, setEditingSuggestion] = useState<EventSuggestionWithStatus | null>(null);
  const [isEditModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    eventType: 'custom' as TimelineEventType,
    importance: 5
  });

  // Update suggestions when props change
  useEffect(() => {
    const newSuggestions: EventSuggestionWithStatus[] = eventSuggestions.map(suggestion => {
      const existing = suggestions.find(s => s.id === suggestion.id);
      return {
        ...suggestion,
        status: existing?.status || 'pending',
        timelineEventId: existing?.timelineEventId,
        rejectionReason: existing?.rejectionReason
      };
    });

    setSuggestions(newSuggestions);
  }, [eventSuggestions]);

  // Auto-approval effect
  useEffect(() => {
    if (!autoApprovalEnabled) return;

    const highConfidenceSuggestions = suggestions.filter(
      suggestion => 
        suggestion.status === 'pending' && 
        suggestion.confidence >= confidenceThreshold
    );

    highConfidenceSuggestions.forEach(suggestion => {
      approveEventSuggestion(suggestion, true);
    });
  }, [suggestions, autoApprovalEnabled, confidenceThreshold]);

  // Convert transcription event to timeline event
  const convertToTimelineEvent = useCallback((
    suggestion: EventSuggestionWithStatus,
    customData?: Partial<RPGTimelineEvent>
  ): Omit<RPGTimelineEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> => {
    const timelineEventType = TRANSCRIPTION_TO_TIMELINE_TYPE_MAP[suggestion.eventType] || 'custom';
    
    // Calculate event date from session start and timestamp
    const sessionStartDate = transcription?.createdAt || new Date();
    const eventDate = new Date(sessionStartDate.getTime() + (suggestion.timestamp * 1000));

    return {
      title: customData?.title || suggestion.title,
      description: customData?.description || suggestion.description,
      startDate: eventDate,
      endDate: undefined,
      importance: customData?.importance || Math.round(suggestion.confidence * 10),
      eventType: customData?.eventType || timelineEventType,
      worldId,
      campaignId,
      entityId: sessionId,
      entityType: 'session' as any,
      tags: ['transcription', 'ai-generated', suggestion.eventType],
      participants: extractedEntities
        .filter(entity => entity.type === EntityType.CHARACTER)
        .map(entity => entity.existingEntityId || entity.id),
      location: extractedEntities
        .find(entity => entity.type === EntityType.LOCATION)?.name,
      gmNotes: `Auto-generated from transcription. Confidence: ${Math.round(suggestion.confidence * 100)}%`,
      playerVisible: true
    };
  }, [worldId, campaignId, sessionId, transcription, extractedEntities]);

  // Approve event suggestion
  const approveEventSuggestion = useCallback(async (
    suggestion: EventSuggestionWithStatus,
    isAutoApproval: boolean = false
  ) => {
    // Update status to processing
    setSuggestions(prev => prev.map(s =>
      s.id === suggestion.id ? { ...s, status: 'processing' } : s
    ));

    try {
      const timelineEventData = convertToTimelineEvent(suggestion);
      await timelineActions.createEvent(timelineEventData);

      // Generate a temporary ID for tracking
      const tempTimelineEventId = `timeline_${Date.now()}`;

      // Update suggestion status
      setSuggestions(prev => prev.map(s =>
        s.id === suggestion.id
          ? { ...s, status: 'approved', timelineEventId: tempTimelineEventId }
          : s
      ));

      onEventApproved?.(suggestion.id, tempTimelineEventId);

      notifications.show({
        title: 'Success',
        message: `Event ${isAutoApproval ? 'auto-' : ''}approved and added to timeline`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      console.error('Failed to approve event suggestion:', error);
      
      // Revert status
      setSuggestions(prev => prev.map(s =>
        s.id === suggestion.id ? { ...s, status: 'pending' } : s
      ));

      notifications.show({
        title: 'Error',
        message: 'Failed to add event to timeline',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  }, [convertToTimelineEvent, timelineActions, onEventApproved]);

  // Reject event suggestion
  const rejectEventSuggestion = useCallback((
    suggestion: EventSuggestionWithStatus,
    reason?: string
  ) => {
    setSuggestions(prev => prev.map(s =>
      s.id === suggestion.id 
        ? { ...s, status: 'rejected', rejectionReason: reason }
        : s
    ));

    onEventRejected?.(suggestion.id);

    notifications.show({
      title: 'Event Rejected',
      message: 'Event suggestion has been rejected',
      color: 'orange',
      icon: <IconX size={16} />
    });
  }, [onEventRejected]);

  // Edit event suggestion
  const editEventSuggestion = useCallback((suggestion: EventSuggestionWithStatus) => {
    setEditingSuggestion(suggestion);
    setEditFormData({
      title: suggestion.title,
      description: suggestion.description,
      eventType: TRANSCRIPTION_TO_TIMELINE_TYPE_MAP[suggestion.eventType] || 'custom',
      importance: Math.round(suggestion.confidence * 10)
    });
    openEditModal();
  }, [openEditModal]);

  // Save edited event
  const saveEditedEvent = useCallback(async () => {
    if (!editingSuggestion) return;

    try {
      const timelineEventData = convertToTimelineEvent(editingSuggestion, editFormData);
      await timelineActions.createEvent(timelineEventData);

      // Generate a temporary ID for tracking
      const tempTimelineEventId = `timeline_${Date.now()}`;

      setSuggestions(prev => prev.map(s =>
        s.id === editingSuggestion.id
          ? { ...s, status: 'approved', timelineEventId: tempTimelineEventId }
          : s
      ));

      onEventApproved?.(editingSuggestion.id, tempTimelineEventId);
      closeEditModal();

      notifications.show({
        title: 'Success',
        message: 'Custom event added to timeline',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      console.error('Failed to save edited event:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save event',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  }, [editingSuggestion, editFormData, convertToTimelineEvent, timelineActions, onEventApproved, closeEditModal]);

  // Get event type icon
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'combat': return <IconSwords size={16} />;
      case 'social': return <IconUsers size={16} />;
      case 'exploration': return <IconMapPin size={16} />;
      case 'discovery': return <IconMapPin size={16} />;
      case 'roleplay': return <IconMessage size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'processing': return 'blue';
      default: return 'gray';
    }
  };

  // Filter suggestions by status
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const approvedSuggestions = suggestions.filter(s => s.status === 'approved');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');

  return (
    <Paper p="md" withBorder className={className} style={style}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconTimeline size={20} />
            <Title order={4}>Timeline Integration</Title>
            <Badge variant="light">
              {pendingSuggestions.length} pending
            </Badge>
          </Group>
          
          <Group gap="xs">
            <Switch
              label="Auto-approve"
              checked={autoApprovalEnabled}
              onChange={(event) => setAutoApprovalEnabled(event.currentTarget.checked)}
              size="sm"
            />
            <ActionIcon variant="light" onClick={() => timelineActions.loadEvents()}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Auto-approval settings */}
        {autoApprovalEnabled && (
          <Card withBorder p="sm">
            <Group gap="md">
              <Text size="sm">Auto-approve events with confidence ≥</Text>
              <NumberInput
                value={Math.round(confidenceThreshold * 100)}
                onChange={(value) => setConfidenceThreshold((Number(value) || 90) / 100)}
                min={50}
                max={100}
                step={5}
                suffix="%"
                size="xs"
                style={{ width: 80 }}
              />
            </Group>
          </Card>
        )}

        {/* Statistics */}
        <Group gap="md">
          <Badge color="gray" variant="light">
            Total: {suggestions.length}
          </Badge>
          <Badge color="orange" variant="light">
            Pending: {pendingSuggestions.length}
          </Badge>
          <Badge color="green" variant="light">
            Approved: {approvedSuggestions.length}
          </Badge>
          <Badge color="red" variant="light">
            Rejected: {rejectedSuggestions.length}
          </Badge>
        </Group>

        <Divider />

        {/* Pending Suggestions */}
        {pendingSuggestions.length > 0 && (
          <Stack gap="sm">
            <Title order={5}>Pending Suggestions</Title>
            {pendingSuggestions.map((suggestion) => (
              <Card key={suggestion.id} withBorder p="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="sm">
                      {getEventTypeIcon(suggestion.eventType)}
                      <Text fw={500}>{suggestion.title}</Text>
                      <Badge size="xs" variant="light">
                        {suggestion.eventType}
                      </Badge>
                      <Badge 
                        size="xs" 
                        color={suggestion.confidence > 0.8 ? 'green' : 'yellow'}
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {suggestion.description}
                    </Text>
                  </Stack>
                  
                  <Group gap="xs">
                    <Tooltip label="Edit & Approve">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => editEventSuggestion(suggestion)}
                      >
                        <IconEdit size={12} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Quick Approve">
                      <ActionIcon
                        size="sm"
                        color="green"
                        variant="light"
                        onClick={() => approveEventSuggestion(suggestion)}
                      >
                        <IconCheck size={12} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Reject">
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="light"
                        onClick={() => rejectEventSuggestion(suggestion)}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {/* Approved/Rejected Summary */}
        {(approvedSuggestions.length > 0 || rejectedSuggestions.length > 0) && (
          <Stack gap="sm">
            <Title order={5}>Processed Suggestions</Title>
            {[...approvedSuggestions, ...rejectedSuggestions].map((suggestion) => (
              <Card key={suggestion.id} withBorder p="xs" style={{ opacity: 0.7 }}>
                <Group justify="space-between">
                  <Group gap="sm">
                    {getEventTypeIcon(suggestion.eventType)}
                    <Text size="sm">{suggestion.title}</Text>
                    <Badge 
                      size="xs" 
                      color={getStatusColor(suggestion.status)}
                      variant="filled"
                    >
                      {suggestion.status}
                    </Badge>
                  </Group>
                  {suggestion.timelineEventId && (
                    <Badge size="xs" variant="outline">
                      Timeline ID: {suggestion.timelineEventId.slice(-8)}
                    </Badge>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {/* Empty state */}
        {suggestions.length === 0 && (
          <Center style={{ height: 200 }}>
            <Stack align="center" gap="md">
              <IconTimeline size={48} color="gray" />
              <Text c="dimmed">No timeline events detected yet</Text>
              <Text size="sm" c="dimmed">
                Events will appear here as the AI analyzes the transcription
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>

      {/* Edit Event Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Timeline Event"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Event Title"
            value={editFormData.title}
            onChange={(event) => setEditFormData(prev => ({
              ...prev,
              title: event.currentTarget.value
            }))}
            required
          />
          
          <Textarea
            label="Description"
            value={editFormData.description}
            onChange={(event) => setEditFormData(prev => ({
              ...prev,
              description: event.currentTarget.value
            }))}
            minRows={3}
          />
          
          <Select
            label="Event Type"
            value={editFormData.eventType}
            onChange={(value) => setEditFormData(prev => ({
              ...prev,
              eventType: (value as TimelineEventType) || 'custom'
            }))}
            data={[
              { value: 'session', label: 'Session' },
              { value: 'combat', label: 'Combat' },
              { value: 'social', label: 'Social Encounter' },
              { value: 'exploration', label: 'Exploration' },
              { value: 'quest', label: 'Quest' },
              { value: 'milestone', label: 'Milestone' },
              { value: 'custom', label: 'Custom Event' }
            ]}
          />
          
          <NumberInput
            label="Importance (1-10)"
            value={editFormData.importance}
            onChange={(value) => setEditFormData(prev => ({
              ...prev,
              importance: Number(value) || 5
            }))}
            min={1}
            max={10}
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={saveEditedEvent}>
              Add to Timeline
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
