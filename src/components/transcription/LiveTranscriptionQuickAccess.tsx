/**
 * Live Transcription Quick Access Component
 * 
 * Provides one-click access to live transcription functionality from the main header
 * Includes visual indicators for different states and role-based access control
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActionIcon,
  Tooltip,
  Badge,
  Group,
  Menu,
  Text,
  Divider,
  Loader,
  Indicator,
  Transition
} from '@mantine/core';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconSettings,
  IconHistory,
  IconUsers,
  IconAlertTriangle,
  IconCheck,
  IconWifi,
  IconWifiOff
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveTranscriptionAvailability } from '../../hooks/useLiveTranscriptionConfig';
import { LiveTranscriptionService, SessionState } from '../../services/LiveTranscriptionService';
import { SessionService } from '../../services/session.service';

/**
 * Transcription states with visual indicators
 */
export enum TranscriptionState {
  INACTIVE = 'inactive',
  RECORDING = 'recording', 
  PAUSED = 'paused',
  PROCESSING = 'processing',
  ERROR = 'error'
}

/**
 * Quick access component props
 */
export interface LiveTranscriptionQuickAccessProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Live Transcription Quick Access Component
 */
export function LiveTranscriptionQuickAccess({
  className,
  style
}: LiveTranscriptionQuickAccessProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAvailable, isEnabled, isMaintenanceMode, reason } = useLiveTranscriptionAvailability();
  
  // State management
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>(TranscriptionState.INACTIVE);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [activeSessions, setActiveSessions] = useState<number>(0);
  const [recentSessionId, setRecentSessionId] = useState<string | null>(null);
  const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false);

  // Services
  const [transcriptionService] = useState(() => new LiveTranscriptionService());

  // Check if user has permission to use transcription
  const hasTranscriptionPermission = user?.role === 'admin' || user?.role === 'gamemaster';
  const canViewTranscripts = hasTranscriptionPermission || user?.role === 'player';

  // Load recent session on mount
  useEffect(() => {
    const loadRecentSession = async () => {
      try {
        // For now, use a mock recent session ID
        // In production, this would fetch from the session service
        setRecentSessionId('mock-session-id');
      } catch (error) {
        console.error('Failed to load recent session:', error);
      }
    };

    loadRecentSession();
  }, []);

  // Initialize transcription service event handlers
  useEffect(() => {
    const handleStateChange = (state: SessionState) => {
      switch (state) {
        case SessionState.ACTIVE:
          setTranscriptionState(TranscriptionState.RECORDING);
          break;
        case SessionState.PAUSED:
          setTranscriptionState(TranscriptionState.PAUSED);
          break;
        case SessionState.STARTING:
        case SessionState.STOPPING:
          setTranscriptionState(TranscriptionState.PROCESSING);
          break;
        case SessionState.ERROR:
          setTranscriptionState(TranscriptionState.ERROR);
          break;
        default:
          setTranscriptionState(TranscriptionState.INACTIVE);
      }
    };

    const handleConnectionStateChange = (status: any) => {
      setConnectionStatus(status === 'connected' ? 'connected' : 
                         status === 'reconnecting' ? 'reconnecting' : 'disconnected');
    };

    const handleError = (error: Error) => {
      setTranscriptionState(TranscriptionState.ERROR);
      notifications.show({
        title: 'Transcription Error',
        message: error.message,
        color: 'red',
        icon: <IconAlertTriangle size={16} />
      });
    };

    // Configure transcription service
    const transcriptionServiceWithEvents = transcriptionService as any;
    transcriptionServiceWithEvents.events = {
      onStateChange: handleStateChange,
      onConnectionStateChange: handleConnectionStateChange,
      onError: handleError
    };

    return () => {
      transcriptionService.dispose();
    };
  }, [transcriptionService]);

  // Quick start transcription
  const quickStartTranscription = useCallback(async () => {
    if (!hasTranscriptionPermission) {
      notifications.show({
        title: 'Permission Denied',
        message: 'Only Game Masters can start live transcription sessions',
        color: 'red',
        icon: <IconAlertTriangle size={16} />
      });
      return;
    }

    if (!isAvailable) {
      notifications.show({
        title: 'Transcription Unavailable',
        message: reason || 'Live transcription is not available',
        color: 'orange',
        icon: <IconAlertTriangle size={16} />
      });
      return;
    }

    if (!recentSessionId) {
      // Navigate to create new session
      navigate('/sessions/new', {
        state: {
          autoStartTranscription: true
        }
      });
      return;
    }

    try {
      const id = await transcriptionService.startLiveSession(
        recentSessionId,
        'mock-campaign-id',
        'mock-world-id'
      );
      setSessionId(id);
      setActiveSessions(prev => prev + 1);
      
      // Navigate to live dashboard
      navigate(`/live-transcription/dashboard/${recentSessionId}`);
      
      notifications.show({
        title: 'Transcription Started',
        message: 'Live session transcription is now active',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);

      // Provide more helpful error messages
      let errorMessage = 'Could not start live transcription';
      if (error instanceof Error) {
        if (error.message.includes('Connection timeout') || error.message.includes('WebSocket')) {
          errorMessage = 'Live transcription started in batch mode. Real-time features require a WebSocket server.';
        } else if (error.message.includes('API key') || error.message.includes('credentials')) {
          errorMessage = 'Transcription service not configured. Please check your API credentials in Admin settings.';
        } else {
          errorMessage = error.message;
        }
      }

      notifications.show({
        title: 'Transcription Notice',
        message: errorMessage,
        color: errorMessage.includes('batch mode') ? 'yellow' : 'red',
        icon: <IconAlertTriangle size={16} />
      });
    }
  }, [hasTranscriptionPermission, isAvailable, reason, recentSessionId, transcriptionService, navigate]);

  // Pause/Resume transcription
  const togglePauseResume = useCallback(async () => {
    if (!sessionId) return;

    try {
      if (transcriptionState === TranscriptionState.RECORDING) {
        await transcriptionService.pauseSession();
        notifications.show({
          title: 'Transcription Paused',
          message: 'Session recording has been paused',
          color: 'yellow',
          icon: <IconPlayerPause size={16} />
        });
      } else if (transcriptionState === TranscriptionState.PAUSED) {
        await transcriptionService.resumeSession();
        notifications.show({
          title: 'Transcription Resumed',
          message: 'Session recording has been resumed',
          color: 'green',
          icon: <IconPlayerPlay size={16} />
        });
      }
    } catch (error) {
      console.error('Failed to toggle pause/resume:', error);
      notifications.show({
        title: 'Action Failed',
        message: 'Could not pause/resume transcription',
        color: 'red',
        icon: <IconAlertTriangle size={16} />
      });
    }
  }, [sessionId, transcriptionState, transcriptionService]);

  // Stop transcription
  const stopTranscription = useCallback(async () => {
    if (!sessionId) return;

    try {
      await transcriptionService.stopSession();
      setSessionId(null);
      setActiveSessions(prev => Math.max(0, prev - 1));
      
      notifications.show({
        title: 'Transcription Stopped',
        message: 'Session recording has been stopped',
        color: 'blue',
        icon: <IconPlayerStop size={16} />
      });
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      notifications.show({
        title: 'Stop Failed',
        message: 'Could not stop transcription',
        color: 'red',
        icon: <IconAlertTriangle size={16} />
      });
    }
  }, [sessionId, transcriptionService]);

  // Get icon based on state
  const getStateIcon = () => {
    switch (transcriptionState) {
      case TranscriptionState.RECORDING:
        return <IconMicrophone size={18} />;
      case TranscriptionState.PAUSED:
        return <IconPlayerPause size={18} />;
      case TranscriptionState.PROCESSING:
        return <Loader size={18} />;
      case TranscriptionState.ERROR:
        return <IconAlertTriangle size={18} />;
      default:
        return <IconMicrophoneOff size={18} />;
    }
  };

  // Get color based on state
  const getStateColor = () => {
    switch (transcriptionState) {
      case TranscriptionState.RECORDING:
        return 'red';
      case TranscriptionState.PAUSED:
        return 'orange';
      case TranscriptionState.PROCESSING:
        return 'blue';
      case TranscriptionState.ERROR:
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!hasTranscriptionPermission && !canViewTranscripts) {
      return 'Live Transcription (No Access)';
    }
    if (!hasTranscriptionPermission) {
      return 'View Transcriptions';
    }
    if (!isAvailable) {
      return `Live Transcription (${reason})`;
    }
    
    switch (transcriptionState) {
      case TranscriptionState.RECORDING:
        return 'Recording - Click to pause';
      case TranscriptionState.PAUSED:
        return 'Paused - Click to resume';
      case TranscriptionState.PROCESSING:
        return 'Processing audio...';
      case TranscriptionState.ERROR:
        return 'Error - Click to retry';
      default:
        return 'Start Live Transcription';
    }
  };

  // Handle primary click action
  const handlePrimaryClick = () => {
    if (!hasTranscriptionPermission && !canViewTranscripts) {
      return;
    }

    if (!hasTranscriptionPermission) {
      // Navigate to transcription history for viewing
      navigate('/live-transcription/history');
      return;
    }

    if (transcriptionState === TranscriptionState.INACTIVE) {
      quickStartTranscription();
    } else if (transcriptionState === TranscriptionState.RECORDING || transcriptionState === TranscriptionState.PAUSED) {
      togglePauseResume();
    } else if (transcriptionState === TranscriptionState.ERROR) {
      quickStartTranscription();
    }
  };

  // Don't render if user has no access at all
  if (!hasTranscriptionPermission && !canViewTranscripts) {
    return null;
  }

  return (
    <Group gap="xs" className={className} style={style}>
      {/* Connection Status Indicator */}
      {transcriptionState !== TranscriptionState.INACTIVE && (
        <Tooltip label={`Connection: ${connectionStatus}`}>
          <ActionIcon
            size="sm"
            variant="subtle"
            color={connectionStatus === 'connected' ? 'green' : connectionStatus === 'reconnecting' ? 'yellow' : 'red'}
          >
            {connectionStatus === 'connected' ? <IconWifi size={14} /> : <IconWifiOff size={14} />}
          </ActionIcon>
        </Tooltip>
      )}

      {/* Main Transcription Button */}
      <Menu opened={menuOpened} onClose={closeMenu} position="bottom-end">
        <Menu.Target>
          <Tooltip label={getTooltipText()}>
            <Indicator
              inline
              size={8}
              offset={4}
              position="top-end"
              color={getStateColor()}
              disabled={transcriptionState === TranscriptionState.INACTIVE}
              processing={transcriptionState === TranscriptionState.RECORDING}
            >
              <ActionIcon
                variant={transcriptionState === TranscriptionState.INACTIVE ? 'subtle' : 'filled'}
                color={getStateColor()}
                size="lg"
                onClick={handlePrimaryClick}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (hasTranscriptionPermission) {
                    openMenu();
                  }
                }}
                disabled={!hasTranscriptionPermission && !canViewTranscripts}
                style={{
                  animation: transcriptionState === TranscriptionState.RECORDING ? 
                    'pulse 2s infinite' : undefined
                }}
              >
                {getStateIcon()}
              </ActionIcon>
            </Indicator>
          </Tooltip>
        </Menu.Target>

        {hasTranscriptionPermission && (
          <Menu.Dropdown>
            <Menu.Label>Live Transcription</Menu.Label>
            
            {transcriptionState !== TranscriptionState.INACTIVE && (
              <>
                <Menu.Item
                  leftSection={<IconPlayerPause size={16} />}
                  onClick={togglePauseResume}
                  disabled={transcriptionState === TranscriptionState.PROCESSING}
                >
                  {transcriptionState === TranscriptionState.PAUSED ? 'Resume' : 'Pause'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPlayerStop size={16} />}
                  onClick={stopTranscription}
                  color="red"
                >
                  Stop Recording
                </Menu.Item>
                <Menu.Divider />
              </>
            )}
            
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={() => navigate('/admin?tab=transcription')}
            >
              Settings
            </Menu.Item>
            <Menu.Item
              leftSection={<IconHistory size={16} />}
              onClick={() => navigate('/live-transcription/history')}
            >
              View History
            </Menu.Item>
            
            {activeSessions > 0 && (
              <>
                <Menu.Divider />
                <Menu.Label>
                  <Group gap="xs">
                    <Text size="xs">Active Sessions</Text>
                    <Badge size="xs" color="green">{activeSessions}</Badge>
                  </Group>
                </Menu.Label>
              </>
            )}
          </Menu.Dropdown>
        )}
      </Menu>

      {/* Active Sessions Badge */}
      {activeSessions > 0 && (
        <Transition mounted={true} transition="scale" duration={200}>
          {(styles) => (
            <Badge
              size="xs"
              color="red"
              variant="filled"
              style={styles}
            >
              {activeSessions}
            </Badge>
          )}
        </Transition>
      )}
    </Group>
  );
}
