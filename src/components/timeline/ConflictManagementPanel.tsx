/**
 * Conflict Management Panel Component
 * 
 * Provides interface for viewing, filtering, and managing timeline conflicts
 * with AI-ready framework for future integration.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  ActionIcon,
  Badge,
  Select,
  TextInput,
  Checkbox,
  Modal,
  Alert,
  Divider,
  ScrollArea,
  Tooltip,
  Progress,
  Card,
  Grid,
  Box
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconEye,
  IconRobot,
  IconCheck,
  IconX,
  IconClock,
  IconUsers,
  IconMapPin,
  IconExclamationMark,
  IconRefresh,
  IconDownload
} from '@tabler/icons-react';
import {
  TimelineConflict,
  ConflictType,
  ConflictSeverity,
  ConflictManagementState,
  AIConflictProposal
} from '../../types/timelineConflict.types';

/**
 * Conflict Management Panel Props
 */
interface ConflictManagementPanelProps {
  conflicts: TimelineConflict[];
  loading: boolean;
  onConflictSelect: (conflict: TimelineConflict) => void;
  onConflictResolve: (conflictId: string) => void;
  onSendToAI: (conflictId: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

/**
 * Conflict Card Component
 */
interface ConflictCardProps {
  conflict: TimelineConflict;
  selected: boolean;
  onSelect: (conflict: TimelineConflict) => void;
  onResolve: (conflictId: string) => void;
  onSendToAI: (conflictId: string) => void;
}

function ConflictCard({ conflict, selected, onSelect, onResolve, onSendToAI }: ConflictCardProps) {
  const severityColor = getSeverityColor(conflict.severity);
  const typeIcon = getConflictTypeIcon(conflict.type);

  return (
    <Card
      withBorder
      padding="md"
      style={{
        cursor: 'pointer',
        borderColor: selected ? 'var(--mantine-color-blue-5)' : undefined,
        backgroundColor: selected ? 'var(--mantine-color-blue-0)' : undefined
      }}
      onClick={() => onSelect(conflict)}
    >
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            {typeIcon}
            <Badge color={severityColor} variant="light">
              {conflict.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {conflict.type.replace('_', ' ')}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {conflict.metadata.detectedAt.toLocaleString()}
          </Text>
        </Group>

        {/* Title and Description */}
        <Box>
          <Text fw={500} size="sm" mb="xs">
            {conflict.title}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {conflict.description}
          </Text>
        </Box>

        {/* Affected Entities */}
        <Group gap="xs">
          <IconUsers size={14} />
          <Text size="xs">
            {conflict.affectedEvents.length} events, {conflict.affectedEntities.length} entities
          </Text>
        </Group>

        {/* Actions */}
        <Group justify="space-between">
          <Group gap="xs">
            <Tooltip label="View Details">
              <ActionIcon variant="light" size="sm">
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            {conflict.metadata.autoResolvable && (
              <Tooltip label="Auto-resolve">
                <ActionIcon 
                  variant="light" 
                  color="green" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve(conflict.id);
                  }}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
          
          <Button
            size="xs"
            variant="light"
            leftSection={<IconRobot size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onSendToAI(conflict.id);
            }}
            disabled={!!conflict.aiProposal}
          >
            {conflict.aiProposal ? 'AI Proposal Ready' : 'Send to AI'}
          </Button>
        </Group>

        {/* AI Proposal Status */}
        {conflict.aiProposal && (
          <Alert
            icon={<IconRobot size={16} />}
            title="AI Proposal Available"
            color="blue"
            variant="light"
          >
            <Text size="xs">
              {conflict.aiProposal.proposedSolutions.length} solutions proposed
              (Confidence: {Math.round(conflict.aiProposal.confidence * 100)}%)
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

/**
 * Conflict Management Panel Component
 */
export function ConflictManagementPanel({
  conflicts,
  loading,
  onConflictSelect,
  onConflictResolve,
  onSendToAI,
  onRefresh,
  onExport
}: ConflictManagementPanelProps) {
  const [state, setState] = useState<ConflictManagementState>({
    conflicts: [],
    selectedConflict: null,
    filters: {
      severity: [],
      type: [],
      resolved: null
    },
    sorting: {
      field: 'severity',
      direction: 'desc'
    },
    view: 'list',
    loading: false,
    error: null
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort conflicts
  const filteredConflicts = useMemo(() => {
    let filtered = conflicts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conflict =>
        conflict.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conflict.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply severity filter
    if (state.filters.severity.length > 0) {
      filtered = filtered.filter(conflict =>
        state.filters.severity.includes(conflict.severity)
      );
    }

    // Apply type filter
    if (state.filters.type.length > 0) {
      filtered = filtered.filter(conflict =>
        state.filters.type.includes(conflict.type)
      );
    }

    // Apply resolution filter
    if (state.filters.resolved !== null) {
      filtered = filtered.filter(conflict =>
        state.filters.resolved ? !!conflict.resolution : !conflict.resolution
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = state.sorting;
      let comparison = 0;

      switch (field) {
        case 'severity':
          const severityOrder = {
            [ConflictSeverity.CRITICAL]: 4,
            [ConflictSeverity.HIGH]: 3,
            [ConflictSeverity.MEDIUM]: 2,
            [ConflictSeverity.LOW]: 1
          };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'detectedAt':
          comparison = a.metadata.detectedAt.getTime() - b.metadata.detectedAt.getTime();
          break;
        case 'affectedEvents':
          comparison = a.affectedEvents.length - b.affectedEvents.length;
          break;
        default:
          comparison = 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [conflicts, searchQuery, state.filters, state.sorting]);

  // Conflict statistics
  const stats = useMemo(() => {
    const total = conflicts.length;
    const resolved = conflicts.filter(c => c.resolution).length;
    const critical = conflicts.filter(c => c.severity === ConflictSeverity.CRITICAL).length;
    const withAI = conflicts.filter(c => c.aiProposal).length;

    return { total, resolved, critical, withAI };
  }, [conflicts]);

  const handleConflictSelect = useCallback((conflict: TimelineConflict) => {
    setState(prev => ({ ...prev, selectedConflict: conflict }));
    onConflictSelect(conflict);
  }, [onConflictSelect]);

  const handleSeverityFilterChange = useCallback((severity: ConflictSeverity, checked: boolean) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        severity: checked
          ? [...prev.filters.severity, severity]
          : prev.filters.severity.filter(s => s !== severity)
      }
    }));
  }, []);

  const handleTypeFilterChange = useCallback((type: ConflictType, checked: boolean) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        type: checked
          ? [...prev.filters.type, type]
          : prev.filters.type.filter(t => t !== type)
      }
    }));
  }, []);

  const handleSortChange = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      sorting: {
        field: field as any,
        direction: prev.sorting.field === field && prev.sorting.direction === 'asc' ? 'desc' : 'asc'
      }
    }));
  }, []);

  return (
    <Paper withBorder p="md" h="100%">
      <Stack gap="md" h="100%">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconAlertTriangle size={24} />
            <Title order={4}>Conflict Management</Title>
            <Badge color="red" variant="light">
              {stats.total} conflicts
            </Badge>
          </Group>
          <Group>
            <Tooltip label="Refresh">
              <ActionIcon variant="light" onClick={onRefresh} loading={loading}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Export">
              <ActionIcon variant="light" onClick={onExport}>
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Statistics */}
        <Grid>
          <Grid.Col span={3}>
            <Card withBorder p="xs" ta="center">
              <Text size="lg" fw={700} c="red">
                {stats.critical}
              </Text>
              <Text size="xs" c="dimmed">Critical</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="xs" ta="center">
              <Text size="lg" fw={700} c="green">
                {stats.resolved}
              </Text>
              <Text size="xs" c="dimmed">Resolved</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="xs" ta="center">
              <Text size="lg" fw={700} c="blue">
                {stats.withAI}
              </Text>
              <Text size="xs" c="dimmed">AI Ready</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="xs" ta="center">
              <Text size="lg" fw={700}>
                {Math.round((stats.resolved / stats.total) * 100) || 0}%
              </Text>
              <Text size="xs" c="dimmed">Resolution Rate</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Group>
          <TextInput
            placeholder="Search conflicts..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="light"
            leftSection={<IconFilter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </Group>

        {/* Filter Panel */}
        {showFilters && (
          <Paper withBorder p="sm">
            <Stack gap="sm">
              <Text size="sm" fw={500}>Severity</Text>
              <Group>
                {Object.values(ConflictSeverity).map(severity => (
                  <Checkbox
                    key={severity}
                    label={severity.toUpperCase()}
                    checked={state.filters.severity.includes(severity)}
                    onChange={(e) => handleSeverityFilterChange(severity, e.currentTarget.checked)}
                  />
                ))}
              </Group>
              
              <Text size="sm" fw={500}>Type</Text>
              <Group>
                {Object.values(ConflictType).slice(0, 4).map(type => (
                  <Checkbox
                    key={type}
                    label={type.replace('_', ' ')}
                    checked={state.filters.type.includes(type)}
                    onChange={(e) => handleTypeFilterChange(type, e.currentTarget.checked)}
                  />
                ))}
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Sorting */}
        <Group>
          <Text size="sm">Sort by:</Text>
          {['severity', 'type', 'detectedAt', 'affectedEvents'].map(field => (
            <Button
              key={field}
              size="xs"
              variant={state.sorting.field === field ? 'filled' : 'light'}
              onClick={() => handleSortChange(field)}
              rightSection={
                state.sorting.field === field ? (
                  state.sorting.direction === 'asc' ? 
                    <IconSortAscending size={12} /> : 
                    <IconSortDescending size={12} />
                ) : null
              }
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </Button>
          ))}
        </Group>

        {/* Conflicts List */}
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap="sm">
            {loading ? (
              <Text ta="center" c="dimmed">Loading conflicts...</Text>
            ) : filteredConflicts.length === 0 ? (
              <Text ta="center" c="dimmed">No conflicts found</Text>
            ) : (
              filteredConflicts.map(conflict => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  selected={state.selectedConflict?.id === conflict.id}
                  onSelect={handleConflictSelect}
                  onResolve={onConflictResolve}
                  onSendToAI={onSendToAI}
                />
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

/**
 * Get severity color
 */
function getSeverityColor(severity: ConflictSeverity): string {
  const colors = {
    [ConflictSeverity.CRITICAL]: 'red',
    [ConflictSeverity.HIGH]: 'orange',
    [ConflictSeverity.MEDIUM]: 'yellow',
    [ConflictSeverity.LOW]: 'blue'
  };
  return colors[severity] || 'gray';
}

/**
 * Get conflict type icon
 */
function getConflictTypeIcon(type: ConflictType) {
  const icons = {
    [ConflictType.TIME_OVERLAP]: <IconClock size={16} />,
    [ConflictType.CHARACTER_AVAILABILITY]: <IconUsers size={16} />,
    [ConflictType.LOCATION_CAPACITY]: <IconMapPin size={16} />,
    [ConflictType.LOGICAL_INCONSISTENCY]: <IconExclamationMark size={16} />,
    [ConflictType.RESOURCE_CONFLICT]: <IconAlertTriangle size={16} />,
    [ConflictType.PREREQUISITE_MISSING]: <IconX size={16} />,
    [ConflictType.TIMELINE_PARADOX]: <IconAlertTriangle size={16} />,
    [ConflictType.ENTITY_STATE_CONFLICT]: <IconExclamationMark size={16} />
  };
  return icons[type] || <IconAlertTriangle size={16} />;
}

export default ConflictManagementPanel;
