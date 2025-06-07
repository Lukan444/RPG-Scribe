/**
 * Audio Capture Component
 * 
 * Handles browser microphone capture with WebRTC implementation
 * Supports real-time audio streaming and file upload capabilities
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Progress,
  Alert,
  Stack,
  Badge,
  Tooltip,
  Select,
  Switch,
  NumberInput,
  Divider
} from '@mantine/core';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconUpload,
  IconSettings,
  IconAlertTriangle,
  IconCheck,
  IconVolume
} from '@tabler/icons-react';
import { Dropzone } from '@mantine/dropzone';
import { AudioSourceType } from '../../models/Transcription';
import { createLiveTranscriptionLogger, LogCategory } from '../../utils/liveTranscriptionLogger';

/**
 * Audio capture configuration
 */
export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  enableNoiseReduction: boolean;
  enableEchoCancellation: boolean;
  enableAutoGainControl: boolean;
  chunkDuration: number; // Seconds
}

/**
 * Audio capture state
 */
export enum CaptureState {
  IDLE = 'idle',
  REQUESTING_PERMISSION = 'requesting_permission',
  RECORDING = 'recording',
  PAUSED = 'paused',
  PROCESSING = 'processing',
  ERROR = 'error'
}

/**
 * Audio capture props
 */
export interface AudioCaptureProps {
  onAudioChunk?: (chunk: ArrayBuffer, timestamp: number) => void;
  onAudioFile?: (file: File) => void;
  onStateChange?: (state: CaptureState) => void;
  onError?: (error: Error) => void;
  config?: Partial<AudioCaptureConfig>;
  disabled?: boolean;
  showFileUpload?: boolean;
  showAdvancedSettings?: boolean;
}

/**
 * Default audio configuration
 */
const DEFAULT_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  enableNoiseReduction: true,
  enableEchoCancellation: true,
  enableAutoGainControl: true,
  chunkDuration: 1 // 1 second chunks
};

/**
 * Audio Capture Component
 */
export function AudioCapture({
  onAudioChunk,
  onAudioFile,
  onStateChange,
  onError,
  config: configOverrides = {},
  disabled = false,
  showFileUpload = true,
  showAdvancedSettings = false
}: AudioCaptureProps) {
  // Logger
  const logger = createLiveTranscriptionLogger('AudioCapture');

  // State
  const [state, setState] = useState<CaptureState>(CaptureState.IDLE);
  const [config, setConfig] = useState<AudioCaptureConfig>({ ...DEFAULT_CONFIG, ...configOverrides });
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Log component initialization
  useEffect(() => {
    logger.info(LogCategory.UI, 'AudioCapture component initialized', {
      hasAudioChunkCallback: !!onAudioChunk,
      hasAudioFileCallback: !!onAudioFile,
      disabled,
      showFileUpload,
      showAdvancedSettings,
      config
    });
  }, []);

  // Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update state and notify parent
  const updateState = useCallback((newState: CaptureState) => {
    const previousState = state;
    setState(newState);

    logger.info(LogCategory.UI, 'Audio capture state changed', {
      previousState,
      newState,
      timestamp: new Date().toISOString()
    });

    onStateChange?.(newState);
  }, [onStateChange, state, logger]);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    logger.error(LogCategory.AUDIO, 'Audio capture error occurred', error, {
      currentState: state,
      selectedDeviceId,
      config
    });

    updateState(CaptureState.ERROR);
    onError?.(error);
  }, [updateState, onError, state, selectedDeviceId, config, logger]);

  // Get available audio devices
  const getAudioDevices = useCallback(async () => {
    const operationId = `enumerate-devices-${Date.now()}`;
    logger.startTiming(operationId, 'Enumerate audio devices');

    try {
      logger.debug(LogCategory.AUDIO, 'Enumerating audio devices');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      logger.info(LogCategory.AUDIO, 'Audio devices enumerated successfully', {
        totalDevices: devices.length,
        audioInputDevices: audioInputs.length,
        devices: audioInputs.map(device => ({
          deviceId: device.deviceId.slice(0, 8) + '...',
          label: device.label || 'Unknown Device',
          groupId: device.groupId
        }))
      });

      setAvailableDevices(audioInputs);

      if (audioInputs.length > 0 && !selectedDeviceId) {
        const defaultDevice = audioInputs[0];
        setSelectedDeviceId(defaultDevice.deviceId);
        logger.info(LogCategory.AUDIO, 'Auto-selected default audio device', {
          deviceId: defaultDevice.deviceId.slice(0, 8) + '...',
          label: defaultDevice.label || 'Unknown Device'
        });
      }

      logger.endTiming(operationId, {
        success: true,
        deviceCount: audioInputs.length
      });

    } catch (error) {
      logger.error(LogCategory.AUDIO, 'Failed to enumerate audio devices', error as Error);
      logger.endTiming(operationId, { success: false });
    }
  }, [selectedDeviceId, logger]);

  // Initialize audio context and analyser
  const initializeAudioContext = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: config.sampleRate
      });
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255); // Normalize to 0-1
        }
      };
      
      audioLevelIntervalRef.current = setInterval(updateAudioLevel, 100);
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }, [config.sampleRate]);

  // Start recording
  const startRecording = useCallback(async () => {
    const operationId = `start-recording-${Date.now()}`;
    logger.startTiming(operationId, 'Start audio recording');

    try {
      logger.info(LogCategory.AUDIO, 'Starting audio recording', {
        selectedDeviceId: selectedDeviceId ? selectedDeviceId.slice(0, 8) + '...' : 'default',
        config
      });

      updateState(CaptureState.REQUESTING_PERMISSION);

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          sampleRate: config.sampleRate,
          channelCount: config.channels,
          echoCancellation: config.enableEchoCancellation,
          noiseSuppression: config.enableNoiseReduction,
          autoGainControl: config.enableAutoGainControl
        }
      };

      logger.debug(LogCategory.AUDIO, 'Requesting microphone permission', { constraints });
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      logger.info(LogCategory.AUDIO, 'Microphone permission granted, stream acquired', {
        streamId: stream.id,
        audioTracks: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings()
      });

      // Log actual audio metrics
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        logger.logAudioMetrics({
          sampleRate: settings.sampleRate,
          channels: settings.channelCount,
          deviceId: settings.deviceId
        });
      }

      // Initialize audio context for level monitoring
      initializeAudioContext(stream);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      logger.debug(LogCategory.AUDIO, 'MediaRecorder created', {
        mimeType: mediaRecorder.mimeType,
        state: mediaRecorder.state
      });

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunk) {
          logger.debug(LogCategory.AUDIO, 'Audio chunk available', {
            chunkSize: event.data.size,
            timestamp: Date.now() - recordingStartTimeRef.current
          });

          event.data.arrayBuffer().then(buffer => {
            const timestamp = Date.now() - recordingStartTimeRef.current;
            logger.logAudioMetrics({
              bufferSize: buffer.byteLength,
              duration: timestamp
            });
            onAudioChunk(buffer, timestamp);
          });
        }
      };

      // Start recording with chunks
      const chunkInterval = config.chunkDuration * 1000;
      mediaRecorder.start(chunkInterval);

      recordingStartTimeRef.current = Date.now();
      updateState(CaptureState.RECORDING);

      logger.info(LogCategory.AUDIO, 'Recording started successfully', {
        chunkInterval,
        startTime: recordingStartTimeRef.current
      });

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - recordingStartTimeRef.current);
      }, 100);

      logger.endTiming(operationId, {
        success: true,
        chunkInterval,
        audioTracks: stream.getAudioTracks().length
      });

    } catch (error) {
      logger.error(LogCategory.AUDIO, 'Failed to start recording', error as Error, {
        selectedDeviceId,
        config
      });
      logger.endTiming(operationId, { success: false });
      handleError(new Error(`Failed to start recording: ${error}`));
    }
  }, [selectedDeviceId, config, updateState, handleError, onAudioChunk, initializeAudioContext, logger]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      updateState(CaptureState.PAUSED);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  }, [updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      updateState(CaptureState.RECORDING);
      
      // Resume duration tracking
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - recordingStartTimeRef.current);
      }, 100);
    }
  }, [updateState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    setRecordingDuration(0);
    setAudioLevel(0);
    updateState(CaptureState.IDLE);
  }, [updateState]);

  // Handle file upload
  const handleFileUpload = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/m4a'];
      if (!supportedTypes.some(type => file.type.includes(type.split('/')[1]))) {
        handleError(new Error('Unsupported audio file format'));
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        handleError(new Error('File size too large (max 100MB)'));
        return;
      }
      
      onAudioFile?.(file);
    }
  }, [onAudioFile, handleError]);

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Initialize devices on mount
  useEffect(() => {
    getAudioDevices();
  }, [getAudioDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>Audio Capture</Title>
          <Group gap="xs">
            <Badge 
              color={state === CaptureState.RECORDING ? 'red' : 
                     state === CaptureState.PAUSED ? 'yellow' : 'gray'}
              variant="filled"
            >
              {state.toUpperCase()}
            </Badge>
            {showAdvancedSettings && (
              <ActionIcon
                variant={showSettings ? 'filled' : 'light'}
                onClick={() => setShowSettings(!showSettings)}
              >
                <IconSettings size={16} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Recording Controls */}
        <Group justify="center">
          {state === CaptureState.IDLE && (
            <Button
              leftSection={<IconMicrophone size={16} />}
              onClick={startRecording}
              disabled={disabled}
              color="red"
              size="lg"
            >
              Start Recording
            </Button>
          )}
          
          {state === CaptureState.RECORDING && (
            <Group>
              <ActionIcon
                size="lg"
                color="yellow"
                onClick={pauseRecording}
              >
                <IconPlayerPause size={20} />
              </ActionIcon>
              <ActionIcon
                size="lg"
                color="gray"
                onClick={stopRecording}
              >
                <IconPlayerStop size={20} />
              </ActionIcon>
            </Group>
          )}
          
          {state === CaptureState.PAUSED && (
            <Group>
              <ActionIcon
                size="lg"
                color="green"
                onClick={resumeRecording}
              >
                <IconPlayerPlay size={20} />
              </ActionIcon>
              <ActionIcon
                size="lg"
                color="gray"
                onClick={stopRecording}
              >
                <IconPlayerStop size={20} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        {/* Recording Status */}
        {(state === CaptureState.RECORDING || state === CaptureState.PAUSED) && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Duration: {formatDuration(recordingDuration)}</Text>
              <Group gap="xs">
                <IconVolume size={16} />
                <Progress value={audioLevel * 100} size="sm" style={{ width: 100 }} />
              </Group>
            </Group>
          </Stack>
        )}

        {/* File Upload */}
        {showFileUpload && state === CaptureState.IDLE && (
          <>
            <Divider label="OR" labelPosition="center" />
            <Dropzone
              onDrop={handleFileUpload}
              accept={['audio/*']}
              maxSize={100 * 1024 * 1024} // 100MB
              disabled={disabled}
            >
              <Group justify="center" gap="xl" style={{ minHeight: 120, pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <IconCheck size={50} color="green" />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconAlertTriangle size={50} color="red" />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconUpload size={50} />
                </Dropzone.Idle>
                
                <div>
                  <Text size="xl" inline>
                    Drag audio files here or click to select
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Supports WAV, MP3, WebM, OGG, M4A (max 100MB)
                  </Text>
                </div>
              </Group>
            </Dropzone>
          </>
        )}

        {/* Advanced Settings */}
        {showSettings && (
          <Stack gap="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Title order={6}>Audio Settings</Title>
            
            <Select
              label="Microphone"
              value={selectedDeviceId}
              onChange={(value) => setSelectedDeviceId(value || '')}
              data={availableDevices.map(device => ({
                value: device.deviceId,
                label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
              }))}
            />
            
            <Group grow>
              <NumberInput
                label="Sample Rate (Hz)"
                value={config.sampleRate}
                onChange={(value) => setConfig(prev => ({ ...prev, sampleRate: Number(value) }))}
                min={8000}
                max={48000}
                step={1000}
              />
              <NumberInput
                label="Channels"
                value={config.channels}
                onChange={(value) => setConfig(prev => ({ ...prev, channels: Number(value) }))}
                min={1}
                max={2}
              />
            </Group>
            
            <Stack gap="xs">
              <Switch
                label="Noise Reduction"
                checked={config.enableNoiseReduction}
                onChange={(event) => setConfig(prev => ({ 
                  ...prev, 
                  enableNoiseReduction: event.currentTarget.checked 
                }))}
              />
              <Switch
                label="Echo Cancellation"
                checked={config.enableEchoCancellation}
                onChange={(event) => setConfig(prev => ({ 
                  ...prev, 
                  enableEchoCancellation: event.currentTarget.checked 
                }))}
              />
              <Switch
                label="Auto Gain Control"
                checked={config.enableAutoGainControl}
                onChange={(event) => setConfig(prev => ({ 
                  ...prev, 
                  enableAutoGainControl: event.currentTarget.checked 
                }))}
              />
            </Stack>
          </Stack>
        )}

        {/* Error Display */}
        {state === CaptureState.ERROR && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            Audio capture failed. Please check your microphone permissions and try again.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
