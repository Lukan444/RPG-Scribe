import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Pagination,
  Box,
  Skeleton,
} from '@mantine/core';
import { IconSearch, IconEye, IconDownload, IconFilter } from '@tabler/icons-react';
import { ActivityAction, ActivityLog } from '../../models/ActivityLog';
import { ActivityLogService } from '../../services/activityLog.service';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null | undefined>(null);
  const itemsPerPage = 10;

  // Initialize ActivityLogService
  const activityLogService = ActivityLogService.getInstance();

  // Convert enum to select options
  const actionOptions = Object.keys(ActivityAction).map((key) => ({
    value: key,
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  // Load logs from Firestore
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        let result;

        if (actionFilter) {
          // Filter by action
          result = await activityLogService.getLogsByAction(
            actionFilter as ActivityAction,
            itemsPerPage
          );
        } else if (searchTerm) {
          // Search logs
          result = await activityLogService.searchLogs(
            searchTerm,
            itemsPerPage
          );
        } else {
          // Get recent logs
          result = await activityLogService.getRecentLogs(itemsPerPage);
        }

        setLogs(result.data);
        setLastDoc(result.lastDoc);

        // Estimate total pages based on the number of logs returned
        // In a real app, you would get the total count from the server
        setTotalPages(Math.max(1, Math.ceil(result.data.length / itemsPerPage)));
      } catch (err) {
        console.error('Error loading activity logs:', err);
        setError('Failed to load activity logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [actionFilter, searchTerm]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Get badge color based on action
  const getActionColor = (action: ActivityAction): string => {
    switch (action) {
      case ActivityAction.LOGIN:
      case ActivityAction.SOCIAL_LOGIN:
        return 'green';
      case ActivityAction.LOGOUT:
        return 'gray';
      case ActivityAction.REGISTER:
        return 'blue';
      case ActivityAction.PASSWORD_RESET:
      case ActivityAction.EMAIL_VERIFICATION_REQUESTED:
      case ActivityAction.EMAIL_VERIFIED:
        return 'yellow';
      case ActivityAction.PROFILE_UPDATE:
        return 'cyan';
      case ActivityAction.ADMIN_ACTION:
        return 'red';
      case ActivityAction.DATA_CREATE:
        return 'teal';
      case ActivityAction.DATA_UPDATE:
        return 'indigo';
      case ActivityAction.DATA_DELETE:
        return 'orange';
      case ActivityAction.DATA_VIEW:
        return 'grape';
      default:
        return 'gray';
    }
  };

  // Handle page change
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    setLoading(true);

    try {
      let result;

      if (actionFilter) {
        // Filter by action
        result = await activityLogService.getLogsByAction(
          actionFilter as ActivityAction,
          itemsPerPage,
          lastDoc || undefined
        );
      } else if (searchTerm) {
        // Search logs
        result = await activityLogService.searchLogs(
          searchTerm,
          itemsPerPage,
          lastDoc || undefined
        );
      } else {
        // Get recent logs
        result = await activityLogService.getRecentLogs(itemsPerPage, lastDoc || undefined);
      }

      setLogs(result.data);
      setLastDoc(result.lastDoc);
    } catch (err) {
      console.error('Error loading more activity logs:', err);
      setError('Failed to load more activity logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setCurrentPage(1);
      // The useEffect will trigger the search
    }
  };

  // Export logs
  const handleExportLogs = async () => {
    try {
      // In a real app, you would implement proper CSV export
      const csvContent = [
        ['Time', 'User', 'Action', 'Details', 'IP Address'].join(','),
        ...logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.userName || 'Unknown',
          log.action,
          `"${log.details.replace(/"/g, '""')}"`,
          log.ipAddress || 'Unknown'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activity-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Failed to export logs. Please try again later.');
    }
  };

  // View log details
  const handleViewLogDetails = async (logId: string) => {
    try {
      const log = await activityLogService.get(logId);
      alert(`Log Details:\n\nUser: ${log.userName || 'Unknown'}\nAction: ${log.action}\nTime: ${formatDate(log.timestamp)}\nDetails: ${log.details}\nIP: ${log.ipAddress || 'Unknown'}`);
    } catch (err) {
      console.error('Error viewing log details:', err);
      alert('Failed to load log details. Please try again later.');
    }
  };

  return (
    <Container size="xl" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={2}>Activity Logs</Title>
          <Tooltip label="Export Logs">
            <ActionIcon color="blue" onClick={handleExportLogs}>
              <IconDownload size="1.2rem" />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Text color="dimmed" mb="xl">
          Monitor user activity and system events
        </Text>

        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Search logs..."
            leftSection={<IconSearch size="1rem" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            onKeyDown={handleSearch}
            style={{ width: '60%' }}
          />
          <Select
            placeholder="Filter by action"
            leftSection={<IconFilter size="1rem" />}
            clearable
            value={actionFilter}
            onChange={setActionFilter}
            data={actionOptions}
            style={{ width: '35%' }}
          />
        </Group>

        {loading ? (
          <Stack>
            <Skeleton height={40} radius="sm" />
            <Skeleton height={40} radius="sm" />
            <Skeleton height={40} radius="sm" />
            <Skeleton height={40} radius="sm" />
            <Skeleton height={40} radius="sm" />
          </Stack>
        ) : error ? (
          <Text color="red" ta="center" py="xl">
            {error}
          </Text>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>
                            {log.userName || 'Unknown'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {log.userEmail}
                          </Text>
                        </Stack>
                      </td>
                      <td>
                        <Badge color={getActionColor(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>{log.details}</td>
                      <td>{log.ipAddress || 'Unknown'}</td>
                      <td>
                        <Group gap="xs">
                          <Tooltip label="View Details">
                            <ActionIcon
                              color="blue"
                              onClick={() => handleViewLogDetails(log.id)}
                            >
                              <IconEye size="1rem" />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem' }}>
                      <Text color="dimmed" ta="center">
                        No activity logs found
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Box>
        )}

        {!loading && !error && logs.length > 0 && (
          <Group justify="center" mt="md">
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={handlePageChange}
            />
          </Group>
        )}
      </Paper>
    </Container>
  );
}

export default ActivityLogs;
