/**
 * Session Recovery Service
 * 
 * Handles automatic session recovery for live transcription sessions
 * Maintains session state during pauses and connection losses
 */

import { LiveTranscriptionSession, TranscriptionSegment } from '../../models/Transcription';
import { SessionState } from '../LiveTranscriptionService';

/**
 * Recovery state interface
 */
export interface RecoveryState {
  sessionId: string;
  transcriptionId: string;
  state: SessionState;
  lastActiveTimestamp: number;
  segmentQueue: TranscriptionSegment[];
  audioBuffer: ArrayBuffer[];
  connectionAttempts: number;
  maxConnectionAttempts: number;
  recoveryTimeout: number;
}

/**
 * Session recovery configuration
 */
export interface RecoveryConfig {
  maxConnectionAttempts: number;
  recoveryTimeoutMs: number;
  segmentQueueSize: number;
  audioBufferSize: number;
  heartbeatIntervalMs: number;
  autoRecoveryEnabled: boolean;
}

/**
 * Default recovery configuration
 */
const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxConnectionAttempts: 5,
  recoveryTimeoutMs: 30000, // 30 seconds
  segmentQueueSize: 100,
  audioBufferSize: 50,
  heartbeatIntervalMs: 5000, // 5 seconds
  autoRecoveryEnabled: true
};

/**
 * Session Recovery Service
 */
export class SessionRecoveryService {
  private static instance: SessionRecoveryService;
  private recoveryStates: Map<string, RecoveryState> = new Map();
  private config: RecoveryConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.startHeartbeat();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<RecoveryConfig>): SessionRecoveryService {
    if (!SessionRecoveryService.instance) {
      SessionRecoveryService.instance = new SessionRecoveryService(config);
    }
    return SessionRecoveryService.instance;
  }

  /**
   * Initialize recovery state for a session
   */
  public initializeRecovery(sessionId: string, transcriptionId: string): void {
    const recoveryState: RecoveryState = {
      sessionId,
      transcriptionId,
      state: SessionState.ACTIVE,
      lastActiveTimestamp: Date.now(),
      segmentQueue: [],
      audioBuffer: [],
      connectionAttempts: 0,
      maxConnectionAttempts: this.config.maxConnectionAttempts,
      recoveryTimeout: this.config.recoveryTimeoutMs
    };

    this.recoveryStates.set(sessionId, recoveryState);
    this.emit('recoveryInitialized', { sessionId, transcriptionId });
  }

  /**
   * Update session state
   */
  public updateSessionState(sessionId: string, state: SessionState): void {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return;

    recoveryState.state = state;
    recoveryState.lastActiveTimestamp = Date.now();

    if (state === SessionState.PAUSED) {
      this.emit('sessionPaused', { sessionId, timestamp: Date.now() });
    } else if (state === SessionState.ACTIVE) {
      this.emit('sessionResumed', { sessionId, timestamp: Date.now() });
      this.processQueuedSegments(sessionId);
    }
  }

  /**
   * Queue segment during pause or connection loss
   */
  public queueSegment(sessionId: string, segment: TranscriptionSegment): void {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return;

    // Add to queue if paused or connection lost
    if (recoveryState.state === SessionState.PAUSED || recoveryState.connectionAttempts > 0) {
      recoveryState.segmentQueue.push(segment);
      
      // Limit queue size
      if (recoveryState.segmentQueue.length > this.config.segmentQueueSize) {
        recoveryState.segmentQueue.shift();
      }

      this.emit('segmentQueued', { sessionId, segment, queueSize: recoveryState.segmentQueue.length });
    }
  }

  /**
   * Queue audio buffer during pause
   */
  public queueAudioBuffer(sessionId: string, buffer: ArrayBuffer): void {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return;

    if (recoveryState.state === SessionState.PAUSED) {
      recoveryState.audioBuffer.push(buffer);
      
      // Limit buffer size
      if (recoveryState.audioBuffer.length > this.config.audioBufferSize) {
        recoveryState.audioBuffer.shift();
      }

      this.emit('audioBuffered', { sessionId, bufferSize: recoveryState.audioBuffer.length });
    }
  }

  /**
   * Process queued segments when session resumes
   */
  private processQueuedSegments(sessionId: string): void {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return;

    const queuedSegments = [...recoveryState.segmentQueue];
    recoveryState.segmentQueue = [];

    if (queuedSegments.length > 0) {
      this.emit('processingQueuedSegments', { sessionId, count: queuedSegments.length });
      
      // Process segments in order
      queuedSegments.forEach(segment => {
        this.emit('segmentProcessed', { sessionId, segment });
      });
    }

    // Process queued audio buffers
    const queuedBuffers = [...recoveryState.audioBuffer];
    recoveryState.audioBuffer = [];

    if (queuedBuffers.length > 0) {
      this.emit('processingQueuedAudio', { sessionId, count: queuedBuffers.length });
      
      queuedBuffers.forEach(buffer => {
        this.emit('audioProcessed', { sessionId, buffer });
      });
    }
  }

  /**
   * Handle connection loss
   */
  public handleConnectionLoss(sessionId: string): void {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return;

    recoveryState.connectionAttempts++;
    this.emit('connectionLost', { sessionId, attempts: recoveryState.connectionAttempts });

    if (this.config.autoRecoveryEnabled && recoveryState.connectionAttempts <= recoveryState.maxConnectionAttempts) {
      this.attemptRecovery(sessionId);
    } else {
      this.emit('recoveryFailed', { sessionId, maxAttemptsReached: true });
    }
  }

  /**
   * Attempt session recovery
   */
  private async attemptRecovery(sessionId: string): Promise<void> {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return;

    this.emit('recoveryAttempt', { sessionId, attempt: recoveryState.connectionAttempts });

    try {
      // Simulate recovery attempt (in real implementation, this would reconnect to services)
      await new Promise(resolve => setTimeout(resolve, 1000 * recoveryState.connectionAttempts));
      
      // Reset connection attempts on successful recovery
      recoveryState.connectionAttempts = 0;
      recoveryState.lastActiveTimestamp = Date.now();
      
      this.emit('recoverySuccessful', { sessionId });
      this.processQueuedSegments(sessionId);
    } catch (error) {
      this.emit('recoveryAttemptFailed', { sessionId, error, attempt: recoveryState.connectionAttempts });
      
      if (recoveryState.connectionAttempts < recoveryState.maxConnectionAttempts) {
        // Retry with exponential backoff
        setTimeout(() => this.attemptRecovery(sessionId), 2000 * recoveryState.connectionAttempts);
      } else {
        this.emit('recoveryFailed', { sessionId, maxAttemptsReached: true });
      }
    }
  }

  /**
   * Get recovery state for a session
   */
  public getRecoveryState(sessionId: string): RecoveryState | null {
    return this.recoveryStates.get(sessionId) || null;
  }

  /**
   * Check if session needs recovery
   */
  public needsRecovery(sessionId: string): boolean {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (!recoveryState) return false;

    const timeSinceLastActive = Date.now() - recoveryState.lastActiveTimestamp;
    return timeSinceLastActive > recoveryState.recoveryTimeout;
  }

  /**
   * Clean up recovery state
   */
  public cleanupRecovery(sessionId: string): void {
    const recoveryState = this.recoveryStates.get(sessionId);
    if (recoveryState) {
      this.emit('recoveryCleanup', { sessionId, queuedSegments: recoveryState.segmentQueue.length });
      this.recoveryStates.delete(sessionId);
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.checkSessionHealth();
    }, this.config.heartbeatIntervalMs);
  }

  /**
   * Check health of all active sessions
   */
  private checkSessionHealth(): void {
    const now = Date.now();
    
    for (const [sessionId, recoveryState] of this.recoveryStates.entries()) {
      const timeSinceLastActive = now - recoveryState.lastActiveTimestamp;
      
      if (timeSinceLastActive > recoveryState.recoveryTimeout) {
        this.emit('sessionTimeout', { sessionId, timeSinceLastActive });
        
        if (this.config.autoRecoveryEnabled) {
          this.handleConnectionLoss(sessionId);
        }
      }
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in recovery service event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Dispose service
   */
  public dispose(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.recoveryStates.clear();
    this.eventListeners.clear();
  }
}
