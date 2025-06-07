/**
 * System Logs Dashboard
 * 
 * Comprehensive admin logging panel for debugging across the entire RPG Scribe application
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Group,
  Button,
  Select,
  TextInput,
  Badge,
  Table,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Modal,
  Text,
  Stack,
  Grid,
  Card,
  RingProgress,
  Alert,
  Collapse,
  Code,
  Divider,
  Menu,
  Loader,
  Center,
  Pagination,
  Tabs
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconRefresh,
  IconTrash,
  IconCopy,
  IconDownload,
  IconSearch,
  IconFilter,
  IconChevronDown,
  IconChevronRight,
  IconAlertTriangle,
  IconInfoCircle,
  IconBug,
  IconExclamationMark,
  IconDotsVertical,
  IconFileText,
  IconFileSpreadsheet,
  IconJson,
  IconEye,
  IconCalendar,
  IconDatabaseOff,
  IconCpu,
  IconUser
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  SystemLoggerService,
  SystemLogEntry,
  SystemModule,
  LogFilterOptions,
  LogExportFormat,
  systemLogger
} from '../../services/systemLogger.service';
import { LiveTranscriptionLogLevel, LogCategory } from '../../utils/liveTranscriptionLogger';
import { ActivityLogService } from '../../services/activityLog.service';
import { ActivityLog, ActivityAction } from '../../models/ActivityLog';
import classes from './SystemLogsDashboard.module.css';

/**
 * Log types for unified dashboard
 */
export enum LogType {
  SYSTEM = 'SYSTEM',
  ACTIVITY = 'ACTIVITY'
}

/**
 * Unified log entry interface
 */
export interface UnifiedLogEntry {
  id: string;
  type: LogType;
  timestamp: string;
  level?: LiveTranscriptionLogLevel;
  module?: SystemModule;
  category?: LogCategory;
  action?: ActivityAction;
  message: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  error?: Error;
  details?: string;
  // Additional properties for compatibility
  component?: string;
  worldId?: string;
  campaignId?: string;
}

/**
 * Props for the System Logs Dashboard
 */
interface SystemLogsDashboardProps {
  className?: string;
}

/**
 * Log level colors and icons
 */
const LOG_LEVEL_CONFIG = {
  [LiveTranscriptionLogLevel.DEBUG]: {
    color: 'gray',
    icon: IconBug,
    label: 'DEBUG'
  },
  [LiveTranscriptionLogLevel.INFO]: {
    color: 'blue',
    icon: IconInfoCircle,
    label: 'INFO'
  },
  [LiveTranscriptionLogLevel.WARN]: {
    color: 'yellow',
    icon: IconExclamationMark,
    label: 'WARN'
  },
  [LiveTranscriptionLogLevel.ERROR]: {
    color: 'red',
    icon: IconAlertTriangle,
    label: 'ERROR'
  }
};

/**
 * Category colors
 */
const CATEGORY_COLORS: Record<LogCategory, string> = {
  [LogCategory.SERVICE]: 'blue',
  [LogCategory.AUDIO]: 'green',
  [LogCategory.TRANSCRIPTION]: 'purple',
  [LogCategory.DATABASE]: 'orange',
  [LogCategory.UI]: 'cyan',
  [LogCategory.WEBSOCKET]: 'pink',
  [LogCategory.PERFORMANCE]: 'teal'
};

/**
 * Activity Action colors
 */
const ACTIVITY_ACTION_COLORS: Record<ActivityAction, string> = {
  [ActivityAction.LOGIN]: 'green',
  [ActivityAction.LOGOUT]: 'red',
  [ActivityAction.REGISTER]: 'blue',
  [ActivityAction.PASSWORD_RESET]: 'orange',
  [ActivityAction.PROFILE_UPDATE]: 'cyan',
  [ActivityAction.EMAIL_VERIFICATION_REQUESTED]: 'yellow',
  [ActivityAction.EMAIL_VERIFIED]: 'green',
  [ActivityAction.SOCIAL_LOGIN]: 'grape',
  [ActivityAction.ADMIN_ACTION]: 'violet',
  [ActivityAction.DATA_CREATE]: 'teal',
  [ActivityAction.DATA_UPDATE]: 'blue',
  [ActivityAction.DATA_DELETE]: 'red',
  [ActivityAction.DATA_VIEW]: 'gray'
};

/**
 * Items per page for pagination
 */
const ITEMS_PER_PAGE = 50;

/**
 * Convert SystemLogEntry to UnifiedLogEntry
 */
const systemLogToUnified = (log: SystemLogEntry): UnifiedLogEntry => ({
  id: `system-${log.timestamp}-${log.component}`,
  type: LogType.SYSTEM,
  timestamp: log.timestamp,
  level: log.level,
  module: log.module,
  category: log.category,
  message: log.message,
  sessionId: log.sessionId,
  userId: log.userId,
  userName: log.userName,
  metadata: log.metadata,
  error: log.error,
  component: log.component,
  worldId: log.worldId,
  campaignId: log.campaignId
});

/**
 * Convert ActivityLog to UnifiedLogEntry
 */
const activityLogToUnified = (log: ActivityLog): UnifiedLogEntry => ({
  id: `activity-${log.id}`,
  type: LogType.ACTIVITY,
  timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
  action: log.action,
  message: log.details,
  userId: log.userId,
  userName: log.userName || undefined,
  userEmail: log.userEmail || undefined,
  ipAddress: log.ipAddress || undefined,
  details: log.details
});

/**
 * Detect if we're using mock database services
 */
const detectMockServices = (): boolean => {
  // Check if we're in test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // Check for demo/mock Firebase configuration
  const isDemoConfig = process.env.REACT_APP_FIREBASE_PROJECT_ID === 'demo-project' ||
                      process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('test') ||
                      process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('mock');

  // Check if Firebase is using emulator
  const isEmulator = window.location.hostname === 'localhost' &&
                    (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true');

  return isDemoConfig || isEmulator;
};

/**
 * System Logs Dashboard Component
 */
export function SystemLogsDashboard({ className }: SystemLogsDashboardProps) {
  // State
  const [activeLogType, setActiveLogType] = useState<LogType>(LogType.SYSTEM);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [unifiedLogs, setUnifiedLogs] = useState<UnifiedLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UnifiedLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LogFilterOptions>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<UnifiedLogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMockMode] = useState(detectMockServices());

  // Services
  const activityLogService = ActivityLogService.getInstance();

  // Modals
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

  // Load logs on component mount
  useEffect(() => {
    loadLogs();

    // Log mock detection status
    if (isMockMode) {
      systemLogger.log(
        SystemModule.DATABASE,
        LiveTranscriptionLogLevel.WARN,
        LogCategory.SERVICE,
        'Mock database services detected - application is running in development/test mode',
        {
          environment: process.env.NODE_ENV,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          hostname: window.location.hostname,
          useEmulator: process.env.REACT_APP_USE_FIREBASE_EMULATOR
        }
      );
    } else {
      systemLogger.log(
        SystemModule.DATABASE,
        LiveTranscriptionLogLevel.INFO,
        LogCategory.SERVICE,
        'Production database services active',
        {
          environment: process.env.NODE_ENV,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
        }
      );
    }

    // Subscribe to real-time system log updates
    const unsubscribe = systemLogger.subscribe((updatedSystemLogs) => {
      setSystemLogs(updatedSystemLogs);
    });

    return unsubscribe;
  }, [isMockMode]);

  // Combine logs when system logs or activity logs change
  useEffect(() => {
    const combinedLogs: UnifiedLogEntry[] = [];

    // Always include system logs
    combinedLogs.push(...systemLogs.map(systemLogToUnified));

    // Always include activity logs
    combinedLogs.push(...activityLogs.map(activityLogToUnified));

    // Sort by timestamp (newest first)
    combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setUnifiedLogs(combinedLogs);
  }, [systemLogs, activityLogs]);

  // Apply filters when unified logs or filters change
  useEffect(() => {
    let filtered = unifiedLogs;

    // Filter by log type
    filtered = filtered.filter(log => log.type === activeLogType);

    // Apply other filters based on log type
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        (log.userName && log.userName.toLowerCase().includes(searchLower)) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(searchLower))
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [unifiedLogs, filters, activeLogType]);

  /**
   * Load logs from both system logger and activity log service
   */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Load system logs
      const allSystemLogs = systemLogger.getLogs();
      setSystemLogs(allSystemLogs);

      // Load activity logs
      const activityResult = await activityLogService.getRecentLogs(100);
      setActivityLogs(activityResult.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load logs',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [activityLogService]);

  /**
   * Clear all logs with confirmation
   */
  const clearLogs = useCallback(() => {
    modals.openConfirmModal({
      title: 'Clear All Logs',
      children: (
        <Text size="sm">
          Are you sure you want to clear all system logs? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Clear Logs', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        systemLogger.clearLogs();
        notifications.show({
          title: 'Success',
          message: 'All system logs have been cleared',
          color: 'green'
        });
      }
    });
  }, []);

  /**
   * Copy logs to clipboard
   */
  const copyLogs = useCallback(async (selectedLogs?: UnifiedLogEntry[]) => {
    try {
      const logsToCopy = selectedLogs || filteredLogs;

      // Convert unified logs to text format
      const logText = logsToCopy.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const type = log.type;
        const level = log.level ? LOG_LEVEL_CONFIG[log.level].label : log.action || 'INFO';
        const module = log.module || log.userName || 'UNKNOWN';
        const message = log.message;

        return `[${timestamp}] [${type}] [${level}] [${module}] ${message}`;
      }).join('\n');

      await navigator.clipboard.writeText(logText);
      notifications.show({
        title: 'Success',
        message: `${logsToCopy.length} log entries copied to clipboard`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy logs to clipboard',
        color: 'red'
      });
    }
  }, [filteredLogs]);

  /**
   * Export logs to file
   */
  const exportLogs = useCallback((format: LogExportFormat) => {
    try {
      const exportData = systemLogger.exportLogs(format, filters);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `rpg-scribe-logs-${timestamp}.${format}`;
      
      const blob = new Blob([exportData], { 
        type: format === LogExportFormat.JSON ? 'application/json' : 'text/plain' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      notifications.show({
        title: 'Success',
        message: `Logs exported as ${filename}`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to export logs',
        color: 'red'
      });
    }
  }, [filters]);

  /**
   * Toggle row expansion
   */
  const toggleRowExpansion = useCallback((logId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }, []);

  /**
   * Open log detail modal
   */
  const openLogDetail = useCallback((log: UnifiedLogEntry) => {
    setSelectedLog(log);
    openDetailModal();
  }, [openDetailModal]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<LogFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Get log statistics
   */
  const logStats = useMemo(() => {
    return systemLogger.getLogStatistics(filters);
  }, [filters, systemLogs]);

  /**
   * Get paginated logs
   */
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, currentPage]);

  /**
   * Total pages for pagination
   */
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  return (
    <div className={`${classes.dashboard} ${className || ''}`}>
      <Paper p="md" withBorder>
        <Stack gap="md">
          {/* Header */}
          <div className={classes.header}>
            <Group align="center" gap="md">
              <Title order={3}>System Logs Dashboard</Title>
              {isMockMode && (
                <div className={classes.mockIndicator}>
                  <IconDatabaseOff size={14} />
                  Mock Mode
                </div>
              )}
            </Group>
            <Group gap="xs">
              <Tooltip label="Refresh logs">
                <ActionIcon
                  variant="light"
                  onClick={loadLogs}
                  loading={loading}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Clear all logs">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={clearLogs}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Copy filtered logs">
                <ActionIcon
                  variant="light"
                  onClick={() => copyLogs()}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
              
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="light">
                    <IconDownload size={16} />
                  </ActionIcon>
                </Menu.Target>
                
                <Menu.Dropdown>
                  <Menu.Label>Export Format</Menu.Label>
                  <Menu.Item
                    leftSection={<IconJson size={14} />}
                    onClick={() => exportLogs(LogExportFormat.JSON)}
                  >
                    JSON
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileSpreadsheet size={14} />}
                    onClick={() => exportLogs(LogExportFormat.CSV)}
                  >
                    CSV
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileText size={14} />}
                    onClick={() => exportLogs(LogExportFormat.TXT)}
                  >
                    Text
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </div>

          {/* Log Type Tabs */}
          <Tabs value={activeLogType} onChange={(value) => setActiveLogType(value as LogType)}>
            <Tabs.List>
              <Tabs.Tab value={LogType.SYSTEM} leftSection={<IconCpu size={16} />}>
                System Logs
              </Tabs.Tab>
              <Tabs.Tab value={LogType.ACTIVITY} leftSection={<IconUser size={16} />}>
                Activity Logs
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {/* Statistics Cards */}
          <div className={classes.statsContainer}>
            <Card withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Total Logs
                    </Text>
                    <Text fw={700} size="xl">
                      {logStats.total.toLocaleString()}
                    </Text>
                  </div>
                  <RingProgress
                    size={60}
                    thickness={8}
                    sections={[
                      { value: 100, color: 'blue' }
                    ]}
                    label={
                      <Text c="blue" fw={700} ta="center" size="xs">
                        100%
                      </Text>
                    }
                  />
                </Group>
              </Card>

            <Card withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Error Rate
                    </Text>
                    <Text fw={700} size="xl" c={logStats.errorRate > 10 ? 'red' : 'green'}>
                      {logStats.errorRate.toFixed(1)}%
                    </Text>
                  </div>
                  <RingProgress
                    size={60}
                    thickness={8}
                    sections={[
                      { 
                        value: Math.min(logStats.errorRate, 100), 
                        color: logStats.errorRate > 10 ? 'red' : 'green' 
                      }
                    ]}
                    label={
                      <Text 
                        c={logStats.errorRate > 10 ? 'red' : 'green'} 
                        fw={700} 
                        ta="center" 
                        size="xs"
                      >
                        {logStats.byLevel[LiveTranscriptionLogLevel.ERROR]}
                      </Text>
                    }
                  />
                </Group>
              </Card>

            <Card withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Warnings
                    </Text>
                    <Text fw={700} size="xl" c="yellow">
                      {logStats.byLevel[LiveTranscriptionLogLevel.WARN]}
                    </Text>
                  </div>
                  <IconExclamationMark size={24} color="orange" />
                </Group>
              </Card>

            <Card withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Active Modules
                    </Text>
                    <Text fw={700} size="xl">
                      {Object.keys(logStats.byModule).length}
                    </Text>
                  </div>
                  <IconInfoCircle size={24} color="blue" />
                </Group>
              </Card>
          </div>

          {/* Recent Errors Alert */}
          {logStats.recentErrors.length > 0 && (
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Recent Errors Detected"
              color="red"
              variant="light"
            >
              <Text size="sm">
                {logStats.recentErrors.length} error(s) found in recent logs.
                Check the error logs below for details.
              </Text>
            </Alert>
          )}



          {/* Filters */}
          <div className={classes.filtersSection}>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Filters</Text>
              <Button
                variant="light"
                size="xs"
                onClick={clearFilters}
                disabled={Object.keys(filters).length === 0}
              >
                Clear Filters
              </Button>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Module"
                  placeholder="All modules"
                  data={Object.values(SystemModule).map(module => ({
                    value: module,
                    label: module
                  }))}
                  value={filters.modules?.[0] || null}
                  onChange={(value) => updateFilters({
                    modules: value ? [value as SystemModule] : undefined
                  })}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Log Level"
                  placeholder="All levels"
                  data={Object.values(LiveTranscriptionLogLevel)
                    .filter(level => typeof level === 'number')
                    .map(level => ({
                      value: level.toString(),
                      label: LOG_LEVEL_CONFIG[level as LiveTranscriptionLogLevel].label
                    }))}
                  value={filters.levels?.[0]?.toString() || null}
                  onChange={(value) => updateFilters({
                    levels: value ? [parseInt(value) as LiveTranscriptionLogLevel] : undefined
                  })}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Category"
                  placeholder="All categories"
                  data={Object.values(LogCategory).map(category => ({
                    value: category,
                    label: category
                  }))}
                  value={filters.categories?.[0] || null}
                  onChange={(value) => updateFilters({
                    categories: value ? [value as LogCategory] : undefined
                  })}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  label="Search"
                  placeholder="Search logs..."
                  leftSection={<IconSearch size={16} />}
                  value={filters.searchText || ''}
                  onChange={(event) => updateFilters({
                    searchText: event.currentTarget.value || undefined
                  })}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DatePickerInput
                  label="Start Date"
                  placeholder="Select start date"
                  value={filters.startDate || null}
                  onChange={(date) => updateFilters({
                    startDate: date ? new Date(date) : undefined
                  })}
                  clearable
                  leftSection={<IconCalendar size={16} />}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DatePickerInput
                  label="End Date"
                  placeholder="Select end date"
                  value={filters.endDate || null}
                  onChange={(date) => updateFilters({
                    endDate: date ? new Date(date) : undefined
                  })}
                  clearable
                  leftSection={<IconCalendar size={16} />}
                />
              </Grid.Col>
            </Grid>
          </div>

          {/* Logs Table */}
          <div className={classes.logsTableContainer}>
            <div className={classes.paginationContainer}>
              <Text fw={500}>
                Logs ({filteredLogs.length.toLocaleString()})
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Page {currentPage} of {totalPages}
                </Text>
              </Group>
            </div>

            {loading ? (
              <Center p="xl">
                <Loader />
              </Center>
            ) : filteredLogs.length === 0 ? (
              <Center p="xl">
                <Stack align="center" gap="md">
                  <IconSearch size={48} color="gray" />
                  <Text c="dimmed">No logs found matching the current filters</Text>
                </Stack>
              </Center>
            ) : (
              <>
                <ScrollArea>
                  <table className={classes.logsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th style={{ width: 160 }}>Timestamp</th>
                        <th style={{ width: 80 }}>{activeLogType === LogType.ACTIVITY ? 'Action' : 'Level'}</th>
                        <th style={{ width: 120 }}>{activeLogType === LogType.ACTIVITY ? 'User' : 'Module'}</th>
                        <th style={{ width: 100 }}>{activeLogType === LogType.ACTIVITY ? 'IP Address' : 'Category'}</th>
                        <th>Message</th>
                        <th style={{ width: 100 }}>Session</th>
                        <th style={{ width: 60 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log) => {
                        const logId = log.id;
                        const isExpanded = expandedRows.has(logId);

                        // Handle different log types
                        const isSystemLog = log.type === LogType.SYSTEM;
                        const isActivityLog = log.type === LogType.ACTIVITY;

                        // Get appropriate styling
                        let rowClassName = '';
                        if (isSystemLog && log.level === LiveTranscriptionLogLevel.ERROR) {
                          rowClassName = classes.errorRow;
                        } else if (isSystemLog && log.level === LiveTranscriptionLogLevel.WARN) {
                          rowClassName = classes.warningRow;
                        }

                        return (
                          <React.Fragment key={logId}>
                            <tr className={rowClassName}>
                              <td>
                                <ActionIcon
                                  variant="subtle"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(logId)}
                                >
                                  {isExpanded ? (
                                    <IconChevronDown size={14} />
                                  ) : (
                                    <IconChevronRight size={14} />
                                  )}
                                </ActionIcon>
                              </td>

                              <td>
                                <Text size="xs" c="dimmed">
                                  {new Date(log.timestamp).toLocaleString()}
                                </Text>
                              </td>

                              <td>
                                {isSystemLog && log.level ? (
                                  <Badge
                                    color={LOG_LEVEL_CONFIG[log.level].color}
                                    variant="light"
                                    leftSection={React.createElement(LOG_LEVEL_CONFIG[log.level].icon, { size: 12 })}
                                    size="sm"
                                  >
                                    {LOG_LEVEL_CONFIG[log.level].label}
                                  </Badge>
                                ) : isActivityLog && log.action ? (
                                  <Badge
                                    color={ACTIVITY_ACTION_COLORS[log.action]}
                                    variant="light"
                                    size="sm"
                                  >
                                    {log.action}
                                  </Badge>
                                ) : null}
                              </td>

                              <td>
                                {isSystemLog && log.module ? (
                                  <Badge variant="outline" size="sm">
                                    {log.module}
                                  </Badge>
                                ) : isActivityLog && log.userName ? (
                                  <Text size="sm" truncate>
                                    {log.userName}
                                  </Text>
                                ) : null}
                              </td>

                              <td>
                                {isSystemLog && log.category ? (
                                  <Badge
                                    color={CATEGORY_COLORS[log.category]}
                                    variant="dot"
                                    size="sm"
                                  >
                                    {log.category}
                                  </Badge>
                                ) : isActivityLog && log.ipAddress ? (
                                  <Text size="xs" c="dimmed">
                                    {log.ipAddress}
                                  </Text>
                                ) : null}
                              </td>

                              <td>
                                <Text size="sm" lineClamp={2}>
                                  {log.message}
                                </Text>
                              </td>

                              <td>
                                {log.sessionId && (
                                  <Code>
                                    {log.sessionId.slice(0, 8)}...
                                  </Code>
                                )}
                              </td>

                              <td>
                                <Group gap={4}>
                                  <Tooltip label="View details">
                                    <ActionIcon
                                      variant="subtle"
                                      size="sm"
                                      onClick={() => openLogDetail(log)}
                                    >
                                      <IconEye size={14} />
                                    </ActionIcon>
                                  </Tooltip>

                                  <Tooltip label="Copy log">
                                    <ActionIcon
                                      variant="subtle"
                                      size="sm"
                                      onClick={() => copyLogs([log])}
                                    >
                                      <IconCopy size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </td>
                            </tr>

                            {/* Expanded row content */}
                            <tr className={classes.expandedRow} style={{ display: isExpanded ? 'table-row' : 'none' }}>
                              <td colSpan={8}>
                                <Collapse in={isExpanded}>
                                  <Paper p="md" bg="gray.0">
                                    <Stack gap="sm">
                                      {/* Basic info */}
                                      <Group>
                                        <Text size="sm" fw={500}>Component:</Text>
                                        <Code>{log.component}</Code>
                                        {log.userId && (
                                          <>
                                            <Text size="sm" fw={500}>User:</Text>
                                            <Code>{log.userName || log.userId}</Code>
                                          </>
                                        )}
                                        {log.worldId && (
                                          <>
                                            <Text size="sm" fw={500}>World:</Text>
                                            <Code>{log.worldId}</Code>
                                          </>
                                        )}
                                        {log.campaignId && (
                                          <>
                                            <Text size="sm" fw={500}>Campaign:</Text>
                                            <Code>{log.campaignId}</Code>
                                          </>
                                        )}
                                      </Group>

                                      {/* Metadata */}
                                      {log.metadata && (
                                        <div>
                                          <Text size="sm" fw={500} mb="xs">Metadata:</Text>
                                          <Code block>
                                            {JSON.stringify(log.metadata, null, 2)}
                                          </Code>
                                        </div>
                                      )}

                                      {/* Error details */}
                                      {log.error && (
                                        <div>
                                          <Text size="sm" fw={500} mb="xs" c="red">Error Details:</Text>
                                          <Code block c="red">
                                            {log.error.message}
                                            {log.error.stack && (
                                              <>
                                                {'\n\nStack Trace:\n'}
                                                {log.error.stack}
                                              </>
                                            )}
                                          </Code>
                                        </div>
                                      )}
                                    </Stack>
                                  </Paper>
                                </Collapse>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={classes.paginationContainer}>
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      size="sm"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Stack>
      </Paper>

      {/* Log Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title="Log Details"
        size="lg"
      >
        {selectedLog && (
          <Stack gap="md">
            <Group>
              {selectedLog.level && (
                <Badge
                  color={LOG_LEVEL_CONFIG[selectedLog.level].color}
                  variant="light"
                  leftSection={React.createElement(LOG_LEVEL_CONFIG[selectedLog.level].icon, { size: 12 })}
                >
                  {LOG_LEVEL_CONFIG[selectedLog.level].label}
                </Badge>
              )}
              {selectedLog.action && (
                <Badge
                  color={ACTIVITY_ACTION_COLORS[selectedLog.action]}
                  variant="light"
                >
                  {selectedLog.action}
                </Badge>
              )}
              {selectedLog.module && (
                <Badge variant="outline">{selectedLog.module}</Badge>
              )}
              {selectedLog.category && (
                <Badge
                  color={CATEGORY_COLORS[selectedLog.category]}
                  variant="dot"
                >
                  {selectedLog.category}
                </Badge>
              )}
            </Group>

            <Divider />

            <div>
              <Text size="sm" fw={500} mb="xs">Timestamp:</Text>
              <Code>{new Date(selectedLog.timestamp).toLocaleString()}</Code>
            </div>

            {selectedLog.component && (
              <div>
                <Text size="sm" fw={500} mb="xs">Component:</Text>
                <Code>{selectedLog.component}</Code>
              </div>
            )}

            <div>
              <Text size="sm" fw={500} mb="xs">Message:</Text>
              <Text>{selectedLog.message}</Text>
            </div>

            {selectedLog.sessionId && (
              <div>
                <Text size="sm" fw={500} mb="xs">Session ID:</Text>
                <Code>{selectedLog.sessionId}</Code>
              </div>
            )}

            {selectedLog.userId && (
              <div>
                <Text size="sm" fw={500} mb="xs">User:</Text>
                <Code>{selectedLog.userName || selectedLog.userId}</Code>
              </div>
            )}

            {selectedLog.worldId && (
              <div>
                <Text size="sm" fw={500} mb="xs">World ID:</Text>
                <Code>{selectedLog.worldId}</Code>
              </div>
            )}

            {selectedLog.campaignId && (
              <div>
                <Text size="sm" fw={500} mb="xs">Campaign ID:</Text>
                <Code>{selectedLog.campaignId}</Code>
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <Text size="sm" fw={500} mb="xs">Metadata:</Text>
                <Code block>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </Code>
              </div>
            )}

            {selectedLog.error && (
              <div>
                <Text size="sm" fw={500} mb="xs" c="red">Error Details:</Text>
                <Code block c="red">
                  {selectedLog.error.message}
                  {selectedLog.error.stack && (
                    <>
                      {'\n\nStack Trace:\n'}
                      {selectedLog.error.stack}
                    </>
                  )}
                </Code>
              </div>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                leftSection={<IconCopy size={16} />}
                onClick={() => copyLogs([selectedLog])}
              >
                Copy Log
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
