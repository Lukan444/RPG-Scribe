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
  Pagination
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
  IconCalendar
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
import { LogTestGenerator } from './LogTestGenerator';

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
 * Items per page for pagination
 */
const ITEMS_PER_PAGE = 50;

/**
 * System Logs Dashboard Component
 */
export function SystemLogsDashboard({ className }: SystemLogsDashboardProps) {
  // State
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LogFilterOptions>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

  // Load logs on component mount
  useEffect(() => {
    loadLogs();
    
    // Subscribe to real-time log updates
    const unsubscribe = systemLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    return unsubscribe;
  }, []);

  // Apply filters when logs or filters change
  useEffect(() => {
    const filtered = systemLogger.getLogs(filters);
    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, filters]);

  /**
   * Load logs from the system logger
   */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const allLogs = systemLogger.getLogs();
      setLogs(allLogs);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load system logs',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
  const copyLogs = useCallback(async (selectedLogs?: SystemLogEntry[]) => {
    try {
      const logsToCopy = selectedLogs || filteredLogs;
      const logText = systemLogger.exportLogs(LogExportFormat.TXT, {
        ...filters,
        // If specific logs provided, don't apply additional filters
        ...(selectedLogs ? {} : filters)
      });
      
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
  }, [filteredLogs, filters]);

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
  const openLogDetail = useCallback((log: SystemLogEntry) => {
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
  }, [filters, logs]);

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
    <div className={className}>
      <Paper p="md" withBorder>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Title order={3}>System Logs Dashboard</Title>
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
          </Group>

          {/* Statistics Cards */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
            </Grid.Col>
          </Grid>

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

          {/* Log Test Generator (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <LogTestGenerator />
          )}

          {/* Filters */}
          <Paper p="md" withBorder>
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
          </Paper>

          {/* Logs Table */}
          <Paper withBorder>
            <Group justify="space-between" p="md" pb={0}>
              <Text fw={500}>
                Logs ({filteredLogs.length.toLocaleString()})
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Page {currentPage} of {totalPages}
                </Text>
              </Group>
            </Group>

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
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 40 }}></Table.Th>
                        <Table.Th style={{ width: 160 }}>Timestamp</Table.Th>
                        <Table.Th style={{ width: 80 }}>Level</Table.Th>
                        <Table.Th style={{ width: 120 }}>Module</Table.Th>
                        <Table.Th style={{ width: 100 }}>Category</Table.Th>
                        <Table.Th>Message</Table.Th>
                        <Table.Th style={{ width: 100 }}>Session</Table.Th>
                        <Table.Th style={{ width: 60 }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedLogs.map((log) => {
                        const logId = `${log.timestamp}-${log.component}-${log.message}`;
                        const isExpanded = expandedRows.has(logId);
                        const levelConfig = LOG_LEVEL_CONFIG[log.level];
                        const LevelIcon = levelConfig.icon;

                        return (
                          <React.Fragment key={logId}>
                            <Table.Tr
                              style={{
                                backgroundColor: log.level === LiveTranscriptionLogLevel.ERROR
                                  ? 'var(--mantine-color-red-0)'
                                  : log.level === LiveTranscriptionLogLevel.WARN
                                  ? 'var(--mantine-color-yellow-0)'
                                  : undefined
                              }}
                            >
                              <Table.Td>
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
                              </Table.Td>

                              <Table.Td>
                                <Text size="xs" c="dimmed">
                                  {new Date(log.timestamp).toLocaleString()}
                                </Text>
                              </Table.Td>

                              <Table.Td>
                                <Badge
                                  color={levelConfig.color}
                                  variant="light"
                                  leftSection={<LevelIcon size={12} />}
                                  size="sm"
                                >
                                  {levelConfig.label}
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Badge variant="outline" size="sm">
                                  {log.module}
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Badge
                                  color={CATEGORY_COLORS[log.category]}
                                  variant="dot"
                                  size="sm"
                                >
                                  {log.category}
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Text size="sm" lineClamp={2}>
                                  {log.message}
                                </Text>
                              </Table.Td>

                              <Table.Td>
                                {log.sessionId && (
                                  <Code>
                                    {log.sessionId.slice(0, 8)}...
                                  </Code>
                                )}
                              </Table.Td>

                              <Table.Td>
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
                              </Table.Td>
                            </Table.Tr>

                            {/* Expanded row content */}
                            <Table.Tr style={{ display: isExpanded ? 'table-row' : 'none' }}>
                              <Table.Td colSpan={8}>
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
                              </Table.Td>
                            </Table.Tr>
                          </React.Fragment>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      size="sm"
                    />
                  </Group>
                )}
              </>
            )}
          </Paper>
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
              <Badge
                color={LOG_LEVEL_CONFIG[selectedLog.level].color}
                variant="light"
                leftSection={React.createElement(LOG_LEVEL_CONFIG[selectedLog.level].icon, { size: 12 })}
              >
                {LOG_LEVEL_CONFIG[selectedLog.level].label}
              </Badge>
              <Badge variant="outline">{selectedLog.module}</Badge>
              <Badge
                color={CATEGORY_COLORS[selectedLog.category]}
                variant="dot"
              >
                {selectedLog.category}
              </Badge>
            </Group>

            <Divider />

            <div>
              <Text size="sm" fw={500} mb="xs">Timestamp:</Text>
              <Code>{new Date(selectedLog.timestamp).toLocaleString()}</Code>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Component:</Text>
              <Code>{selectedLog.component}</Code>
            </div>

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
