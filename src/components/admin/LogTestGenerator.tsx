/**
 * Log Test Generator
 * 
 * Component to generate test logs for demonstrating the System Logs Dashboard
 */

import React from 'react';
import { Button, Group, Stack, Text, Paper } from '@mantine/core';
import { IconBug, IconInfoCircle, IconExclamationMark, IconAlertTriangle } from '@tabler/icons-react';
import { useSystemLogger } from '../../hooks/useSystemLogger';
import { SystemModule } from '../../services/systemLogger.service';
import { LogCategory } from '../../utils/liveTranscriptionLogger';

/**
 * Log Test Generator Component
 */
export function LogTestGenerator() {
  const uiLogger = useSystemLogger({
    module: SystemModule.UI_COMPONENTS,
    autoContext: true
  });
  const authLogger = useSystemLogger({
    module: SystemModule.AUTHENTICATION,
    autoContext: true
  });
  const dbLogger = useSystemLogger({
    module: SystemModule.DATABASE,
    autoContext: true
  });
  const transcriptionLogger = useSystemLogger({
    module: SystemModule.LIVE_TRANSCRIPTION,
    autoContext: true
  });

  /**
   * Generate debug logs
   */
  const generateDebugLogs = () => {
    uiLogger.debug(LogCategory.UI, 'Component rendered successfully', {
      component: 'LogTestGenerator',
      renderTime: Date.now()
    });

    dbLogger.debug(LogCategory.DATABASE, 'Database query executed', {
      query: 'SELECT * FROM users',
      executionTime: 45,
      resultCount: 12
    });

    transcriptionLogger.debug(LogCategory.AUDIO, 'Audio device enumerated', {
      deviceCount: 3,
      defaultDevice: 'Built-in Microphone'
    });
  };

  /**
   * Generate info logs
   */
  const generateInfoLogs = () => {
    authLogger.info(LogCategory.SERVICE, 'User authentication successful', {
      userId: 'user123',
      method: 'email',
      timestamp: new Date().toISOString()
    });

    uiLogger.info(LogCategory.UI, 'Navigation completed', {
      from: '/dashboard',
      to: '/admin',
      duration: 250
    });

    dbLogger.info(LogCategory.DATABASE, 'Data synchronization completed', {
      recordsUpdated: 15,
      syncDuration: 1200
    });
  };

  /**
   * Generate warning logs
   */
  const generateWarningLogs = () => {
    transcriptionLogger.warn(LogCategory.PERFORMANCE, 'Audio processing latency detected', {
      expectedLatency: 100,
      actualLatency: 350,
      threshold: 200
    });

    authLogger.warn(LogCategory.SERVICE, 'Rate limit approaching', {
      currentRequests: 95,
      limit: 100,
      resetTime: Date.now() + 60000
    });

    dbLogger.warn(LogCategory.DATABASE, 'Connection pool near capacity', {
      activeConnections: 18,
      maxConnections: 20
    });
  };

  /**
   * Generate error logs
   */
  const generateErrorLogs = () => {
    const networkError = new Error('Network request failed');
    networkError.stack = `Error: Network request failed
    at fetch (/api/users)
    at UserService.getUsers (userService.ts:45)
    at AdminPanel.loadUsers (AdminPanel.tsx:123)`;

    authLogger.error(LogCategory.SERVICE, 'Authentication failed', networkError, {
      attemptedEmail: 'user@example.com',
      errorCode: 'AUTH_FAILED',
      retryCount: 3
    });

    const dbError = new Error('Database connection timeout');
    dbError.stack = `Error: Database connection timeout
    at Connection.timeout (connection.ts:89)
    at DatabaseService.query (database.ts:156)
    at FirestoreService.getById (firestore.ts:78)`;

    dbLogger.error(LogCategory.DATABASE, 'Database operation failed', dbError, {
      operation: 'SELECT',
      table: 'campaigns',
      timeout: 5000
    });

    const transcriptionError = new Error('Microphone access denied');
    transcriptionError.stack = `Error: Microphone access denied
    at navigator.mediaDevices.getUserMedia
    at AudioCapture.startRecording (AudioCapture.tsx:234)
    at LiveTranscription.begin (LiveTranscription.tsx:89)`;

    transcriptionLogger.error(LogCategory.AUDIO, 'Audio capture failed', transcriptionError, {
      requestedConstraints: { audio: true },
      browserSupport: true,
      permissionState: 'denied'
    });
  };

  /**
   * Generate mixed logs
   */
  const generateMixedLogs = () => {
    // Simulate a user workflow with various log levels
    uiLogger.info(LogCategory.UI, 'User started admin session', {
      sessionId: `session_${Date.now()}`,
      userAgent: navigator.userAgent
    });

    authLogger.debug(LogCategory.SERVICE, 'Checking user permissions', {
      userId: 'admin123',
      requiredRole: 'admin'
    });

    dbLogger.info(LogCategory.DATABASE, 'Loading admin dashboard data', {
      queries: ['users', 'logs', 'settings'],
      cacheHit: false
    });

    transcriptionLogger.warn(LogCategory.PERFORMANCE, 'WebSocket connection unstable', {
      reconnectAttempts: 2,
      lastDisconnect: Date.now() - 5000
    });

    uiLogger.debug(LogCategory.UI, 'Rendering system logs dashboard', {
      logCount: 156,
      renderTime: 89
    });

    dbLogger.debug(LogCategory.DATABASE, 'Applying log filters', {
      filters: { module: 'LiveTranscription', level: 'ERROR' },
      resultCount: 3
    });
  };

  /**
   * Clear all logs
   */
  const clearAllLogs = () => {
    uiLogger.getLogs().length = 0; // This won't actually work, but demonstrates the intent
    // In reality, we'd call systemLogger.clearLogs()
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Text fw={500} size="lg">Log Test Generator</Text>
        <Text size="sm" c="dimmed">
          Generate test logs to demonstrate the System Logs Dashboard functionality
        </Text>

        <Group gap="md">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconBug size={16} />}
            onClick={generateDebugLogs}
          >
            Generate Debug Logs
          </Button>

          <Button
            variant="light"
            color="blue"
            leftSection={<IconInfoCircle size={16} />}
            onClick={generateInfoLogs}
          >
            Generate Info Logs
          </Button>

          <Button
            variant="light"
            color="yellow"
            leftSection={<IconExclamationMark size={16} />}
            onClick={generateWarningLogs}
          >
            Generate Warning Logs
          </Button>

          <Button
            variant="light"
            color="red"
            leftSection={<IconAlertTriangle size={16} />}
            onClick={generateErrorLogs}
          >
            Generate Error Logs
          </Button>
        </Group>

        <Group gap="md">
          <Button
            variant="filled"
            onClick={generateMixedLogs}
          >
            Generate Mixed Workflow
          </Button>

          <Button
            variant="outline"
            color="red"
            onClick={clearAllLogs}
          >
            Clear All Logs
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
