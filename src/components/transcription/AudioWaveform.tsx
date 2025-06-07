/**
 * Audio Waveform Component
 * 
 * Real-time audio waveform visualization using Mantine 8 components
 * Provides visual feedback for audio recording and playback
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Progress,
  Tooltip,
  Paper,
  Stack,
  Badge,
  RingProgress,
  ThemeIcon,
  Transition
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconWaveSquare,
  IconMicrophone,
  IconMicrophoneOff
} from '@tabler/icons-react';
import { useElementSize } from '@mantine/hooks';

/**
 * Waveform component props
 */
export interface AudioWaveformProps {
  /** Audio stream or file */
  audioSource?: MediaStream | HTMLAudioElement | null;
  /** Whether recording is active */
  isRecording?: boolean;
  /** Whether audio is playing */
  isPlaying?: boolean;
  /** Current playback time in seconds */
  currentTime?: number;
  /** Total duration in seconds */
  duration?: number;
  /** Volume level (0-1) */
  volume?: number;
  /** Whether to show controls */
  showControls?: boolean;
  /** Whether to show time display */
  showTime?: boolean;
  /** Whether to show volume indicator */
  showVolume?: boolean;
  /** Waveform color */
  color?: string;
  /** Height of the waveform */
  height?: number;
  /** Callback when play/pause is clicked */
  onPlayPause?: () => void;
  /** Callback when seeking */
  onSeek?: (time: number) => void;
  /** Callback when volume changes */
  onVolumeChange?: (volume: number) => void;
  /** Whether component is in compact mode */
  compact?: boolean;
}

/**
 * Audio Waveform Component
 */
export function AudioWaveform({
  audioSource,
  isRecording = false,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  volume = 1,
  showControls = true,
  showTime = true,
  showVolume = true,
  color = 'blue',
  height = 60,
  onPlayPause,
  onSeek,
  onVolumeChange,
  compact = false
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const { ref: containerRef, width } = useElementSize();

  // Waveform data state
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio analysis
  useEffect(() => {
    if (!audioSource || !(audioSource instanceof MediaStream)) {
      setIsInitialized(false);
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(audioSource);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsInitialized(true);
      
      return () => {
        audioContext.close();
      };
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
      setIsInitialized(false);
    }
  }, [audioSource]);

  // Animation loop for real-time waveform
  const animate = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate audio level
    const sum = dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / dataArray.length;
    setAudioLevel(average / 255);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw waveform
    const barWidth = canvas.width / dataArray.length;
    const barMaxHeight = canvas.height * 0.8;
    
    ctx.fillStyle = isRecording ? '#ff6b6b' : '#339af0';
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * barMaxHeight;
      const x = i * barWidth;
      const y = (canvas.height - barHeight) / 2;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
    
    // Update waveform data for static display
    if (isRecording) {
      setWaveformData(prev => {
        const newData = [...prev, average / 255];
        return newData.slice(-100); // Keep last 100 samples
      });
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isRecording]);

  // Start/stop animation
  useEffect(() => {
    if (isInitialized && (isRecording || isPlaying)) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, isRecording, isPlaying, animate]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle canvas click for seeking
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !duration) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const seekTime = (x / canvas.width) * duration;
    onSeek(seekTime);
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Paper
      ref={containerRef}
      withBorder
      p={compact ? "xs" : "sm"}
      radius="md"
      style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
    >
      <Stack gap={compact ? "xs" : "sm"}>
        {/* Header with status indicators */}
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon
              size={compact ? "sm" : "md"}
              color={isRecording ? 'red' : isPlaying ? 'blue' : 'gray'}
              variant="light"
            >
              {isRecording ? (
                <IconMicrophone size={compact ? 14 : 16} />
              ) : isPlaying ? (
                <IconWaveSquare size={compact ? 14 : 16} />
              ) : (
                <IconMicrophoneOff size={compact ? 14 : 16} />
              )}
            </ThemeIcon>
            
            <Text size={compact ? "xs" : "sm"} fw={500}>
              {isRecording ? 'Recording' : isPlaying ? 'Playing' : 'Ready'}
            </Text>
            
            {isRecording && (
              <Badge size="xs" color="red" variant="filled">
                LIVE
              </Badge>
            )}
          </Group>
          
          {showVolume && (
            <Group gap="xs">
              <Tooltip label={`Volume: ${Math.round(volume * 100)}%`}>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={volume > 0 ? 'blue' : 'gray'}
                >
                  {volume > 0 ? <IconVolume size={14} /> : <IconVolumeOff size={14} />}
                </ActionIcon>
              </Tooltip>
              
              {isRecording && (
                <RingProgress
                  size={compact ? 24 : 32}
                  thickness={3}
                  sections={[
                    { value: audioLevel * 100, color: audioLevel > 0.8 ? 'red' : audioLevel > 0.5 ? 'yellow' : 'green' }
                  ]}
                />
              )}
            </Group>
          )}
        </Group>
        
        {/* Waveform Canvas */}
        <Box style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={width || 400}
            height={compact ? 40 : height}
            style={{
              width: '100%',
              height: compact ? 40 : height,
              cursor: onSeek ? 'pointer' : 'default',
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--mantine-color-gray-1)'
            }}
            onClick={handleCanvasClick}
          />
          
          {/* Progress overlay */}
          {duration > 0 && (
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: 'rgba(51, 154, 240, 0.2)',
                borderRadius: 'var(--mantine-radius-sm)',
                pointerEvents: 'none'
              }}
            />
          )}
          
          {/* Current time indicator */}
          {duration > 0 && (
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: `${progressPercentage}%`,
                width: 2,
                height: '100%',
                backgroundColor: 'var(--mantine-color-blue-6)',
                pointerEvents: 'none'
              }}
            />
          )}
        </Box>
        
        {/* Controls and time display */}
        {(showControls || showTime) && (
          <Group justify="space-between">
            {showControls && (
              <Group gap="xs">
                <ActionIcon
                  variant="filled"
                  color={isPlaying ? 'blue' : 'gray'}
                  onClick={onPlayPause}
                  disabled={!onPlayPause}
                  size={compact ? "sm" : "md"}
                >
                  {isPlaying ? (
                    <IconPlayerPause size={compact ? 14 : 16} />
                  ) : (
                    <IconPlayerPlay size={compact ? 14 : 16} />
                  )}
                </ActionIcon>
              </Group>
            )}
            
            {showTime && (
              <Group gap="xs">
                <Text size={compact ? "xs" : "sm"} c="dimmed">
                  {formatTime(currentTime)}
                </Text>
                {duration > 0 && (
                  <>
                    <Text size={compact ? "xs" : "sm"} c="dimmed">/</Text>
                    <Text size={compact ? "xs" : "sm"} c="dimmed">
                      {formatTime(duration)}
                    </Text>
                  </>
                )}
              </Group>
            )}
          </Group>
        )}
        
        {/* Progress bar for non-canvas view */}
        {!compact && duration > 0 && (
          <Progress
            value={progressPercentage}
            color={color}
            size="sm"
            radius="xl"
            style={{ cursor: onSeek ? 'pointer' : 'default' }}
            onClick={(event) => {
              if (!onSeek) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const seekTime = (x / rect.width) * duration;
              onSeek(seekTime);
            }}
          />
        )}
      </Stack>
    </Paper>
  );
}
