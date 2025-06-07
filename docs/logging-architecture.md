# RPG Scribe Logging Architecture

## Overview

RPG Scribe implements a dual logging system that separates user activity tracking from technical system diagnostics, following best practices for separation of concerns and maintainability.

## Logging Systems

### 1. Activity Logs (User Actions & Audit Trail)
**Purpose**: Track user actions for audit, compliance, and business intelligence
**Storage**: Firestore `activityLogs` collection
**Service**: `ActivityLogService`
**Access**: Admin Dashboard → Activity Logs tab

**Use Cases**:
- User authentication events (login, logout, password changes)
- Admin operations (user management, configuration changes)
- Content creation/modification (entity CRUD operations)
- Permission changes and role assignments
- Configuration saves initiated by users
- Business-critical user interactions

**Log Structure**:
```typescript
interface ActivityLog {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: ActivityAction;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

### 2. System Logs (Technical Operations & Diagnostics)
**Purpose**: Technical debugging, performance monitoring, and system health
**Storage**: In-memory with SystemLoggerService (can be extended to persistent storage)
**Service**: `SystemLoggerService` via `useTranscriptionLogger` hook
**Access**: Admin Dashboard → System Logs tab

**Use Cases**:
- Service initialization and lifecycle events
- API calls and external service interactions
- Performance metrics and timing data
- Error diagnostics and stack traces
- Database operations and cache management
- WebSocket connections and real-time streaming
- Audio processing pipeline events
- Provider configuration and fallback scenarios

**Log Structure**:
```typescript
interface SystemLogEntry {
  id: string;
  timestamp: Date;
  level: LiveTranscriptionLogLevel;
  module: SystemModule;
  category: LogCategory;
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  error?: Error;
  performanceData?: {
    operation: string;
    duration: number;
    metadata?: Record<string, any>;
  };
}
```

## Log Levels & Categories

### System Log Levels (Technical)
- **DEBUG**: Detailed diagnostic information for development
- **INFO**: General operational information
- **WARN**: Warning conditions that don't prevent operation
- **ERROR**: Error conditions that may affect functionality

### System Log Categories
- **SERVICE**: Service lifecycle, initialization, configuration
- **DATABASE**: Database operations, queries, transactions
- **AUDIO**: Audio capture, processing, device management
- **TRANSCRIPTION**: Speech-to-text processing, provider interactions
- **WEBSOCKET**: Real-time communication, streaming events
- **CONFIG**: Configuration loading, validation, updates
- **UI**: User interface events, component lifecycle
- **PERFORMANCE**: Timing data, metrics, optimization insights

## Implementation Guidelines

### When to Use Activity Logs
```typescript
// User-initiated configuration save
const activityLogService = ActivityLogService.getInstance();
await activityLogService.logActivity(
  user.id,
  user.name,
  user.email,
  ActivityAction.ADMIN_ACTION,
  'Updated Live Transcription configuration settings',
  '127.0.0.1',
  navigator.userAgent
);
```

### When to Use System Logs
```typescript
// Technical operation logging
const logger = useTranscriptionLogger();
logger.info(LogCategory.CONFIG, 'Live Transcription configuration saved successfully', {
  userId: user?.id,
  primaryProvider: config.speechRecognition.primaryProvider,
  fallbackEnabled: config.speechRecognition.enableFallback
});
```

### Dual Logging for Configuration Changes
For admin configuration changes, use BOTH systems:
1. **Activity Log**: Records WHO made the change and WHEN (audit trail)
2. **System Log**: Records WHAT changed and technical details (debugging)

## Best Practices

### 1. Structured Logging
- Always include relevant context in metadata
- Use consistent field names across similar operations
- Include user context when available
- Add performance timing for critical operations

### 2. Log Level Guidelines
- **DEBUG**: Verbose information for development only
- **INFO**: Normal operational events worth recording
- **WARN**: Unusual but recoverable conditions
- **ERROR**: Failures that require attention

### 3. Security Considerations
- Never log sensitive data (passwords, API keys, personal data)
- Sanitize user input before logging
- Use truncated IDs for privacy (e.g., `userId.slice(0, 8) + '...'`)
- Implement log retention policies

### 4. Performance Considerations
- Use appropriate log levels to control verbosity
- Implement log sampling for high-frequency events
- Consider async logging for performance-critical paths
- Monitor log storage and implement rotation

## Live Transcription Logging Examples

### Service Initialization
```typescript
logger.info(LogCategory.SERVICE, 'LiveTranscriptionService initialized', {
  sessionId,
  providers: ['vertex-ai', 'openai-whisper'],
  realTimeEnabled: config.enableRealTimeStreaming
});
```

### Audio Processing
```typescript
logger.debug(LogCategory.AUDIO, 'Audio chunk processed', {
  chunkSize: buffer.byteLength,
  timestamp,
  sessionId
});
```

### Error Handling
```typescript
logger.error(LogCategory.TRANSCRIPTION, 'Provider fallback triggered', error, {
  primaryProvider: 'vertex-ai',
  fallbackProvider: 'openai-whisper',
  sessionId
});
```

### Performance Monitoring
```typescript
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;
logger.logPerformance('Audio device enumeration', duration, {
  deviceCount: devices.length,
  success: true
});
```

## Monitoring & Alerting

### System Health Indicators
- Error rate by module and category
- Performance metrics for critical operations
- Service availability and response times
- Resource utilization patterns

### Alert Thresholds
- ERROR level logs require immediate attention
- WARN level spikes may indicate degraded performance
- Performance degradation beyond acceptable thresholds
- Service initialization failures

## Future Enhancements

### Planned Improvements
1. **Persistent System Logs**: Move from in-memory to database storage
2. **Log Aggregation**: Centralized logging with external services
3. **Real-time Monitoring**: Live dashboards and alerting
4. **Log Analytics**: Advanced querying and visualization
5. **Automated Remediation**: Self-healing based on log patterns

### Integration Opportunities
- External monitoring services (DataDog, New Relic)
- Error tracking platforms (Sentry, Bugsnag)
- Performance monitoring tools
- Business intelligence dashboards
