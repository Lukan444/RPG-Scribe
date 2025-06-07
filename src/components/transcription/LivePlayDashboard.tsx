/**
 * Live Play Dashboard Component
 * 
 * Main dashboard for live session transcription and AI assistant features
 * Integrates with existing Timeline system and Mantine 8 UI patterns
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
  Progress,
  Alert,
  Tabs,
  Grid,
  Card,
  Divider,
  Tooltip,
  Switch,
  Select,
  NumberInput,
  Collapse,
  ScrollArea,
  Loader,
  Center
} from '@mantine/core';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconSettings,
  IconTimeline,
  IconBrain,
  IconUsers,
  IconMapPin,
  IconSword,
  IconAlertTriangle,
  IconCheck,
  IconVolume,
  IconWifi,
  IconWifiOff,
  IconRefresh,
  IconDownload,
  IconUpload
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { AudioCapture, CaptureState } from './AudioCapture';
import { LiveTranscriptionService, SessionState } from '../../services/LiveTranscriptionService';
import { TranscriptionSegment, ExtractedEntity, TimelineEventSuggestion } from '../../models/Transcription';
import { DualTimelineWidget } from '../timeline/DualTimelineWidget';
import { useTimeline } from '../../contexts/TimelineContext';
import { useTranscriptionLogger } from '../../hooks/useSystemLogger';
import { LogCategory } from '../../utils/liveTranscriptionLogger';

/**
 * Live Play Dashboard Props
 */
export interface LivePlayDashboardProps {
  sessionId: string;
  campaignId: string;
  worldId: string;
  onSessionEnd?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Real-time session statistics
 */
interface SessionStats {
  duration: number;
  segmentCount: number;
  speakerCount: number;
  entityCount: number;
  eventCount: number;
  averageConfidence: number;
  audioLevel: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

/**
 * Live Play Dashboard Component
 */
export function LivePlayDashboard({
  sessionId,
  campaignId,
  worldId,
  onSessionEnd,
  onError,
  className,
  style
}: LivePlayDashboardProps) {
  // State management
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
  const [captureState, setCaptureState] = useState<CaptureState>(CaptureState.IDLE);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [realtimeSegments, setRealtimeSegments] = useState<TranscriptionSegment[]>([]);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [eventSuggestions, setEventSuggestions] = useState<TimelineEventSuggestion[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    duration: 0,
    segmentCount: 0,
    speakerCount: 0,
    entityCount: 0,
    eventCount: 0,
    averageConfidence: 0,
    audioLevel: 0,
    connectionStatus: 'disconnected'
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>('live');
  const [showSettings, { toggle: toggleSettings }] = useDisclosure(false);
  const [showTimeline, { toggle: toggleTimeline }] = useDisclosure(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showConfidenceThreshold, setShowConfidenceThreshold] = useState(0.7);

  // Services
  const [transcriptionService] = useState(() => new LiveTranscriptionService());
  const { state: timelineState, actions: timelineActions } = useTimeline();
  const logger = useTranscriptionLogger(sessionId);

  // Initialize transcription service
  useEffect(() => {
    const handleStateChange = (state: SessionState) => {
      setSessionState(state);
    };

    const handleSegmentReceived = (segment: TranscriptionSegment) => {
      if (segment.confidence >= showConfidenceThreshold) {
        setRealtimeSegments(prev => [...prev, segment]);
        
        // Update stats
        setSessionStats(prev => ({
          ...prev,
          segmentCount: prev.segmentCount + 1,
          averageConfidence: (prev.averageConfidence * prev.segmentCount + segment.confidence) / (prev.segmentCount + 1)
        }));
      }
    };

    const handleError = (error: Error) => {
      logger.error(LogCategory.TRANSCRIPTION, 'Transcription error occurred', error, {
        sessionId,
        campaignId,
        worldId,
        sessionState,
        captureState
      });
      onError?.(error);
    };

    const handleConnectionStateChange = (state: any) => {
      setSessionStats(prev => ({
        ...prev,
        connectionStatus: state === 'connected' ? 'connected' : 
                         state === 'reconnecting' ? 'reconnecting' : 'disconnected'
      }));
    };

    // Configure transcription service
    const transcriptionServiceWithEvents = transcriptionService as any;
    transcriptionServiceWithEvents.events = {
      onStateChange: handleStateChange,
      onSegmentReceived: handleSegmentReceived,
      onError: handleError,
      onConnectionStateChange: handleConnectionStateChange
    };

    return () => {
      transcriptionService.dispose();
    };
  }, [transcriptionService, showConfidenceThreshold, onError]);

  // Start live session
  const startLiveSession = useCallback(async () => {
    try {
      logger.info(LogCategory.SERVICE, 'Starting live transcription session', {
        sessionId,
        campaignId,
        worldId
      });
      const id = await transcriptionService.startLiveSession(sessionId, campaignId, worldId);
      setTranscriptionId(id);
      logger.info(LogCategory.SERVICE, 'Live transcription session started successfully', {
        transcriptionId: id
      });
    } catch (error) {
      logger.error(LogCategory.SERVICE, 'Failed to start live session', error as Error, {
        sessionId,
        campaignId,
        worldId
      });
      onError?.(error as Error);
    }
  }, [transcriptionService, sessionId, campaignId, worldId, onError, logger]);

  // Stop live session
  const stopLiveSession = useCallback(async () => {
    try {
      logger.info(LogCategory.SERVICE, 'Stopping live transcription session', {
        transcriptionId
      });
      await transcriptionService.stopSession();
      setTranscriptionId(null);
      onSessionEnd?.();
      logger.info(LogCategory.SERVICE, 'Live transcription session stopped successfully');
    } catch (error) {
      logger.error(LogCategory.SERVICE, 'Failed to stop live session', error as Error, {
        transcriptionId
      });
      onError?.(error as Error);
    }
  }, [transcriptionService, onSessionEnd, onError, transcriptionId, logger]);

  // Handle audio chunk processing
  const handleAudioChunk = useCallback(async (chunk: ArrayBuffer, timestamp: number) => {
    if (sessionState === SessionState.ACTIVE) {
      try {
        logger.debug(LogCategory.AUDIO, 'Processing audio chunk', {
          chunkSize: chunk.byteLength,
          timestamp,
          sessionState
        });
        await transcriptionService.processAudioChunk(chunk, timestamp);
      } catch (error) {
        logger.error(LogCategory.AUDIO, 'Failed to process audio chunk', error as Error, {
          chunkSize: chunk.byteLength,
          timestamp,
          sessionState
        });
      }
    }
  }, [transcriptionService, sessionState, logger]);

  // Handle audio capture state changes
  const handleCaptureStateChange = useCallback((state: CaptureState) => {
    setCaptureState(state);
    
    if (state === CaptureState.RECORDING && sessionState === SessionState.IDLE) {
      startLiveSession();
    } else if (state === CaptureState.IDLE && sessionState === SessionState.ACTIVE) {
      stopLiveSession();
    }
  }, [sessionState, startLiveSession, stopLiveSession]);

  // Update session duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionState === SessionState.ACTIVE) {
      interval = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (state: SessionState): string => {
    switch (state) {
      case SessionState.ACTIVE: return 'green';
      case SessionState.PAUSED: return 'yellow';
      case SessionState.ERROR: return 'red';
      default: return 'gray';
    }
  };

  // Get connection status color
  const getConnectionColor = (status: string): string => {
    switch (status) {
      case 'connected': return 'green';
      case 'reconnecting': return 'yellow';
      default: return 'red';
    }
  };

  return (
    <Paper p="md" withBorder className={className} style={style}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="md">
            <Title order={3}>Live Play Dashboard</Title>
            <Badge 
              color={getStatusColor(sessionState)}
              variant="filled"
              leftSection={sessionState === SessionState.ACTIVE ? 
                <IconMicrophone size={12} /> : 
                <IconMicrophoneOff size={12} />
              }
            >
              {sessionState.toUpperCase()}
            </Badge>
            <Badge 
              color={getConnectionColor(sessionStats.connectionStatus)}
              variant="light"
              leftSection={sessionStats.connectionStatus === 'connected' ? 
                <IconWifi size={12} /> : 
                <IconWifiOff size={12} />
              }
            >
              {sessionStats.connectionStatus.toUpperCase()}
            </Badge>
          </Group>
          
          <Group gap="xs">
            <Tooltip label="Timeline View">
              <ActionIcon
                variant={showTimeline ? 'filled' : 'light'}
                onClick={toggleTimeline}
              >
                <IconTimeline size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Settings">
              <ActionIcon
                variant={showSettings ? 'filled' : 'light'}
                onClick={toggleSettings}
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Session Statistics */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Duration</Text>
              <Text size="lg" fw={600}>{formatDuration(sessionStats.duration)}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Segments</Text>
              <Text size="lg" fw={600}>{sessionStats.segmentCount}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Entities</Text>
              <Text size="lg" fw={600}>{extractedEntities.length}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Confidence</Text>
              <Text size="lg" fw={600}>
                {Math.round(sessionStats.averageConfidence * 100)}%
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Card withBorder>
            <Title order={5} mb="md">Settings</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label="Auto-scroll transcript"
                  checked={autoScroll}
                  onChange={(event) => setAutoScroll(event.currentTarget.checked)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Confidence Threshold"
                  value={showConfidenceThreshold}
                  onChange={(value) => setShowConfidenceThreshold(Number(value) || 0.7)}
                  min={0}
                  max={1}
                  step={0.1}
                  decimalScale={1}
                />
              </Grid.Col>
            </Grid>
          </Card>
        </Collapse>

        {/* Audio Capture */}
        <AudioCapture
          onAudioChunk={handleAudioChunk}
          onStateChange={handleCaptureStateChange}
          onError={onError}
          showFileUpload={false}
          showAdvancedSettings={true}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'live')}>
          <Tabs.List>
            <Tabs.Tab value="live" leftSection={<IconMicrophone size={16} />}>
              Live Transcript
            </Tabs.Tab>
            <Tabs.Tab value="entities" leftSection={<IconBrain size={16} />}>
              AI Analysis
            </Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconTimeline size={16} />}>
              Timeline Events
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="live" pt="md">
            <Card withBorder style={{ height: 400 }}>
              <ScrollArea style={{ height: '100%' }}>
                {realtimeSegments.length === 0 ? (
                  <Center style={{ height: '100%' }}>
                    <Stack align="center" gap="md">
                      <IconMicrophone size={48} color="gray" />
                      <Text c="dimmed">Start recording to see live transcript</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {realtimeSegments.map((segment, index) => (
                      <Group key={segment.id} align="flex-start" gap="sm">
                        <Badge size="xs" variant="light">
                          {Math.floor(segment.startTime / 60)}:{(segment.startTime % 60).toFixed(0).padStart(2, '0')}
                        </Badge>
                        <Text size="sm" style={{ flex: 1 }}>
                          {segment.text}
                        </Text>
                        <Badge 
                          size="xs" 
                          color={segment.confidence > 0.8 ? 'green' : segment.confidence > 0.6 ? 'yellow' : 'red'}
                        >
                          {Math.round(segment.confidence * 100)}%
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="entities" pt="md">
            <Card withBorder style={{ height: 400 }}>
              <ScrollArea style={{ height: '100%' }}>
                {extractedEntities.length === 0 ? (
                  <Center style={{ height: '100%' }}>
                    <Stack align="center" gap="md">
                      <IconBrain size={48} color="gray" />
                      <Text c="dimmed">AI will extract entities as you speak</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {extractedEntities.map((entity, index) => (
                      <Group key={entity.id} justify="space-between">
                        <Group gap="sm">
                          <Badge variant="light">{entity.type}</Badge>
                          <Text size="sm">{entity.name}</Text>
                        </Group>
                        <Badge 
                          size="xs" 
                          color={entity.confidence > 0.8 ? 'green' : 'yellow'}
                        >
                          {Math.round(entity.confidence * 100)}%
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="events" pt="md">
            <Card withBorder style={{ height: 400 }}>
              <ScrollArea style={{ height: '100%' }}>
                {eventSuggestions.length === 0 ? (
                  <Center style={{ height: '100%' }}>
                    <Stack align="center" gap="md">
                      <IconTimeline size={48} color="gray" />
                      <Text c="dimmed">Timeline events will appear here</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {eventSuggestions.map((event, index) => (
                      <Card key={event.id} withBorder p="sm">
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500}>{event.title}</Text>
                          <Badge size="xs">{event.eventType}</Badge>
                        </Group>
                        <Text size="xs" c="dimmed" mb="xs">
                          {event.description}
                        </Text>
                        <Group justify="space-between">
                          <Badge 
                            size="xs" 
                            color={event.confidence > 0.8 ? 'green' : 'yellow'}
                          >
                            {Math.round(event.confidence * 100)}% confidence
                          </Badge>
                          <Group gap="xs">
                            <Button size="xs" variant="light" color="green">
                              Approve
                            </Button>
                            <Button size="xs" variant="light" color="red">
                              Reject
                            </Button>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Card>
          </Tabs.Panel>
        </Tabs>

        {/* Timeline Integration */}
        {showTimeline && (
          <>
            <Divider label="Timeline Integration" labelPosition="center" />
            <DualTimelineWidget
              worldId={worldId}
              campaignId={campaignId}
              title="Live Session Timeline"
              description="Real-time timeline updates from transcription"
              height={300}
              displayMode="dual"
              enableEditing={false}
              compact={true}
            />
          </>
        )}
      </Stack>
    </Paper>
  );
}
