/**
 * AudioCapture Component Tests
 * 
 * Comprehensive test suite for the AudioCapture component
 * Tests audio recording, file upload, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { AudioCapture, CaptureState } from '../AudioCapture';

// Mock Web APIs
const mockMediaDevices = {
  getUserMedia: vi.fn(),
  enumerateDevices: vi.fn()
};

const mockMediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  ondataavailable: null,
  state: 'inactive'
}));

const mockAudioContext = vi.fn().mockImplementation(() => ({
  createAnalyser: vi.fn(() => ({
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn()
  })),
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn()
  })),
  close: vi.fn()
}));

// Setup global mocks
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

Object.defineProperty(global, 'MediaRecorder', {
  value: mockMediaRecorder,
  writable: true
});

Object.defineProperty(global, 'AudioContext', {
  value: mockAudioContext,
  writable: true
});

Object.defineProperty(global, 'webkitAudioContext', {
  value: mockAudioContext,
  writable: true
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('AudioCapture Component', () => {
  const mockOnAudioChunk = vi.fn();
  const mockOnAudioFile = vi.fn();
  const mockOnStateChange = vi.fn();
  const mockOnError = vi.fn();

  const defaultProps = {
    onAudioChunk: mockOnAudioChunk,
    onAudioFile: mockOnAudioFile,
    onStateChange: mockOnStateChange,
    onError: mockOnError
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockMediaDevices.getUserMedia.mockResolvedValue({
      getTracks: vi.fn(() => [{ stop: vi.fn() }])
    });
    
    mockMediaDevices.enumerateDevices.mockResolvedValue([
      {
        deviceId: 'device1',
        kind: 'audioinput',
        label: 'Default Microphone'
      },
      {
        deviceId: 'device2',
        kind: 'audioinput',
        label: 'USB Microphone'
      }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders audio capture component', () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Audio Capture')).toBeInTheDocument();
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
      expect(screen.getByText('IDLE')).toBeInTheDocument();
    });

    it('renders file upload when enabled', () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showFileUpload={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Drag audio files here or click to select')).toBeInTheDocument();
    });

    it('hides file upload when disabled', () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showFileUpload={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Drag audio files here or click to select')).not.toBeInTheDocument();
    });

    it('shows advanced settings when enabled', () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showAdvancedSettings={true} />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('Audio Recording', () => {
    it('starts recording when start button is clicked', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
          audio: {
            deviceId: undefined,
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      });

      expect(mockOnStateChange).toHaveBeenCalledWith(CaptureState.REQUESTING_PERMISSION);
    });

    it('handles recording state changes correctly', async () => {
      const mockStream = {
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledWith(CaptureState.RECORDING);
      });
    });

    it('handles microphone permission denied', async () => {
      const permissionError = new Error('Permission denied');
      mockMediaDevices.getUserMedia.mockRejectedValue(permissionError);

      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Failed to start recording')
          })
        );
      });
    });

    it('stops recording when stop button is clicked', async () => {
      const mockStream = {
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      // Start recording first
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
      });

      // Stop recording
      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledWith(CaptureState.IDLE);
      });
    });
  });

  describe('File Upload', () => {
    it('handles valid audio file upload', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showFileUpload={true} />
        </TestWrapper>
      );

      const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      const dropzone = screen.getByText('Drag audio files here or click to select').closest('div');

      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file]
          }
        });
      }

      await waitFor(() => {
        expect(mockOnAudioFile).toHaveBeenCalledWith(file);
      });
    });

    it('rejects unsupported file types', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showFileUpload={true} />
        </TestWrapper>
      );

      const file = new File(['text data'], 'test.txt', { type: 'text/plain' });
      const dropzone = screen.getByText('Drag audio files here or click to select').closest('div');

      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file]
          }
        });
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Unsupported audio file format'
          })
        );
      });
    });

    it('rejects files that are too large', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showFileUpload={true} />
        </TestWrapper>
      );

      // Create a mock file that's larger than 100MB
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.wav', { 
        type: 'audio/wav' 
      });
      
      Object.defineProperty(largeFile, 'size', {
        value: 101 * 1024 * 1024,
        writable: false
      });

      const dropzone = screen.getByText('Drag audio files here or click to select').closest('div');

      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [largeFile]
          }
        });
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'File size too large (max 100MB)'
          })
        );
      });
    });
  });

  describe('Advanced Settings', () => {
    it('shows settings panel when settings button is clicked', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showAdvancedSettings={true} />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Audio Settings')).toBeInTheDocument();
        expect(screen.getByLabelText('Sample Rate (Hz)')).toBeInTheDocument();
        expect(screen.getByLabelText('Channels')).toBeInTheDocument();
      });
    });

    it('updates audio configuration', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showAdvancedSettings={true} />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const sampleRateInput = screen.getByLabelText('Sample Rate (Hz)');
        fireEvent.change(sampleRateInput, { target: { value: '48000' } });
      });

      // Verify the configuration is updated when starting recording
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
          audio: expect.objectContaining({
            sampleRate: 48000
          })
        });
      });
    });

    it('toggles noise reduction setting', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showAdvancedSettings={true} />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const noiseReductionSwitch = screen.getByLabelText('Noise Reduction');
        fireEvent.click(noiseReductionSwitch);
      });

      // Start recording to verify setting is applied
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
          audio: expect.objectContaining({
            noiseSuppression: false
          })
        });
      });
    });
  });

  describe('Device Selection', () => {
    it('loads available audio devices', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showAdvancedSettings={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockMediaDevices.enumerateDevices).toHaveBeenCalled();
      });
    });

    it('uses selected device for recording', async () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} showAdvancedSettings={true} />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const deviceSelect = screen.getByLabelText('Microphone');
        fireEvent.change(deviceSelect, { target: { value: 'device2' } });
      });

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
          audio: expect.objectContaining({
            deviceId: { exact: 'device2' }
          })
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state when recording fails', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Device not found'));

      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('ERROR')).toBeInTheDocument();
        expect(screen.getByText(/Audio capture failed/)).toBeInTheDocument();
      });
    });

    it('handles disabled state correctly', () => {
      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} disabled={true} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      expect(startButton).toBeDisabled();
    });
  });

  describe('Audio Level Monitoring', () => {
    it('displays audio level indicator during recording', async () => {
      const mockStream = {
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      render(
        <TestWrapper>
          <AudioCapture {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('RECORDING')).toBeInTheDocument();
      });

      // Check for audio level indicator (progress bar)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });
});
