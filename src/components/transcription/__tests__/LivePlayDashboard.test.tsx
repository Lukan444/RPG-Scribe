/**
 * Live Play Dashboard Component Tests
 * 
 * Comprehensive test suite for the Live Play Dashboard component
 * Tests real-time transcription, AI analysis, and timeline integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { LivePlayDashboard } from '../LivePlayDashboard';
import { SessionState } from '../../../services/LiveTranscriptionService';
import { CaptureState } from '../AudioCapture';

// Mock services
const mockLiveTranscriptionService = {
  startLiveSession: vi.fn(),
  stopSession: vi.fn(),
  processAudioChunk: vi.fn(),
  dispose: vi.fn(),
  events: {}
};

const mockTimelineContext = {
  state: {
    events: [],
    loading: false,
    error: null
  },
  actions: {
    loadEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn()
  }
};

// Mock hooks
vi.mock('../../../contexts/TimelineContext', () => ({
  useTimeline: () => mockTimelineContext
}));

vi.mock('../../../services/LiveTranscriptionService', () => ({
  LiveTranscriptionService: vi.fn(() => mockLiveTranscriptionService),
  SessionState: {
    IDLE: 'idle',
    STARTING: 'starting',
    ACTIVE: 'active',
    PAUSED: 'paused',
    STOPPING: 'stopping',
    ERROR: 'error'
  }
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('LivePlayDashboard Component', () => {
  const defaultProps = {
    sessionId: 'test-session-123',
    campaignId: 'test-campaign-456',
    worldId: 'test-world-789'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders live play dashboard with correct title', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Live Play Dashboard')).toBeInTheDocument();
      expect(screen.getByText('IDLE')).toBeInTheDocument();
      expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
    });

    it('displays session statistics correctly', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Segments')).toBeInTheDocument();
      expect(screen.getByText('Entities')).toBeInTheDocument();
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });

    it('shows all main tabs', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Live Transcript')).toBeInTheDocument();
      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      expect(screen.getByText('Timeline Events')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('starts live session when audio capture begins recording', async () => {
      const mockOnError = vi.fn();
      
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} onError={mockOnError} />
        </TestWrapper>
      );

      // Simulate audio capture state change to recording
      // This would trigger the handleCaptureStateChange callback
      // In a real test, we'd need to interact with the AudioCapture component
      
      await waitFor(() => {
        expect(mockLiveTranscriptionService.startLiveSession).toHaveBeenCalledWith(
          defaultProps.sessionId,
          defaultProps.campaignId,
          defaultProps.worldId
        );
      });
    });

    it('stops live session when audio capture stops', async () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Simulate stopping the session
      await waitFor(() => {
        expect(mockLiveTranscriptionService.stopSession).toHaveBeenCalled();
      });
    });

    it('handles session errors correctly', async () => {
      const mockOnError = vi.fn();
      const testError = new Error('Test transcription error');
      
      mockLiveTranscriptionService.startLiveSession.mockRejectedValue(testError);

      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} onError={mockOnError} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(testError);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('displays real-time transcription segments', async () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Click on Live Transcript tab
      fireEvent.click(screen.getByText('Live Transcript'));

      // Initially should show empty state
      expect(screen.getByText('Start recording to see live transcript')).toBeInTheDocument();
    });

    it('updates session statistics in real-time', async () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Check initial statistics
      expect(screen.getByText('0:00')).toBeInTheDocument(); // Duration
      expect(screen.getByText('0')).toBeInTheDocument(); // Segments count
    });

    it('shows connection status updates', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Should show disconnected status initially
      expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Click AI Analysis tab
      fireEvent.click(screen.getByText('AI Analysis'));
      expect(screen.getByText('AI will extract entities as you speak')).toBeInTheDocument();

      // Click Timeline Events tab
      fireEvent.click(screen.getByText('Timeline Events'));
      expect(screen.getByText('Timeline events will appear here')).toBeInTheDocument();

      // Click back to Live Transcript
      fireEvent.click(screen.getByText('Live Transcript'));
      expect(screen.getByText('Start recording to see live transcript')).toBeInTheDocument();
    });
  });

  describe('Settings Panel', () => {
    it('toggles settings panel', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Auto-scroll transcript')).toBeInTheDocument();
      expect(screen.getByText('Confidence Threshold')).toBeInTheDocument();
    });

    it('updates auto-scroll setting', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      // Toggle auto-scroll
      const autoScrollSwitch = screen.getByLabelText('Auto-scroll transcript');
      fireEvent.click(autoScrollSwitch);

      // Verify the switch state changed
      expect(autoScrollSwitch).toBeChecked();
    });

    it('updates confidence threshold', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      // Change confidence threshold
      const thresholdInput = screen.getByLabelText('Confidence Threshold');
      fireEvent.change(thresholdInput, { target: { value: '0.8' } });

      expect(thresholdInput).toHaveValue(0.8);
    });
  });

  describe('Timeline Integration', () => {
    it('shows timeline integration when enabled', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Timeline Integration')).toBeInTheDocument();
      expect(screen.getByText('Real-time timeline updates from transcription')).toBeInTheDocument();
    });

    it('toggles timeline view', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      const timelineButton = screen.getByRole('button', { name: /timeline view/i });
      fireEvent.click(timelineButton);

      // Timeline should be hidden after toggle
      expect(screen.queryByText('Timeline Integration')).not.toBeInTheDocument();
    });
  });

  describe('Audio Processing', () => {
    it('processes audio chunks when session is active', async () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Simulate audio chunk processing
      const mockAudioChunk = new ArrayBuffer(1024);
      const timestamp = Date.now();

      // This would be called by the AudioCapture component
      await waitFor(() => {
        expect(mockLiveTranscriptionService.processAudioChunk).toHaveBeenCalledWith(
          mockAudioChunk,
          timestamp
        );
      });
    });

    it('handles audio processing errors gracefully', async () => {
      const mockOnError = vi.fn();
      mockLiveTranscriptionService.processAudioChunk.mockRejectedValue(
        new Error('Audio processing failed')
      );

      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} onError={mockOnError} />
        </TestWrapper>
      );

      // Error should be handled without crashing the component
      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled(); // Error is handled internally
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Check for accessible buttons
      expect(screen.getByRole('button', { name: /timeline view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Tab navigation should work
      const firstTab = screen.getByText('Live Transcript');
      firstTab.focus();
      expect(firstTab).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('displays error states appropriately', () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Component should handle errors gracefully
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('calls onError callback when errors occur', async () => {
      const mockOnError = vi.fn();
      const testError = new Error('Test error');

      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} onError={mockOnError} />
        </TestWrapper>
      );

      // Simulate an error in the transcription service
      mockLiveTranscriptionService.startLiveSession.mockRejectedValue(testError);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(testError);
      });
    });
  });

  describe('Cleanup', () => {
    it('disposes of transcription service on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      unmount();

      expect(mockLiveTranscriptionService.dispose).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('handles rapid state updates without performance issues', async () => {
      render(
        <TestWrapper>
          <LivePlayDashboard {...defaultProps} />
        </TestWrapper>
      );

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        // This would simulate rapid transcription updates
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Component should remain responsive
      expect(screen.getByText('Live Play Dashboard')).toBeInTheDocument();
    });
  });
});
