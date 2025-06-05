/**
 * Timeline Filters Component
 * 
 * Provides hierarchical filtering controls for timeline visualization
 * with world, campaign, session, and time frame selectors.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Group,
  Select,
  Text,
  Paper,
  Breadcrumbs,
  Anchor,
  Badge,
  ActionIcon,
  Tooltip,
  Button
} from '@mantine/core';
import {
  IconWorld,
  IconUsers,
  IconCalendar,
  IconClock,
  IconFilter,
  IconX,
  IconRefresh
} from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

// Import services for data fetching
import { RPGWorldService } from '../../services/rpgWorld.service';
import { CampaignService } from '../../services/campaign.service';
import { SessionService } from '../../services/session.service';
import { useAuth } from '../../contexts/AuthContext';

export interface TimelineFilterState {
  worldId?: string;
  campaignId?: string;
  sessionId?: string;
  timeFrame: 'last-week' | 'last-month' | 'last-3-months' | 'all-time' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  entityType?: string;
  entityId?: string;
}

export interface TimelineFiltersProps {
  filters: TimelineFilterState;
  onFiltersChange: (filters: TimelineFilterState) => void;
  showEntityContext?: boolean;
  entityContext?: {
    type: string;
    id: string;
    name: string;
  };
  onClearEntityContext?: () => void;
  loading?: boolean;
}

const TIME_FRAME_OPTIONS = [
  { value: 'last-week', label: 'Last Week' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' }
];

export function TimelineFilters({
  filters,
  onFiltersChange,
  showEntityContext = false,
  entityContext,
  onClearEntityContext,
  loading = false
}: TimelineFiltersProps) {
  const { t } = useTranslation(['timeline', 'common']);
  const { user } = useAuth();

  // State for dropdown options
  const [worlds, setWorlds] = useState<Array<{ value: string; label: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ value: string; label: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ value: string; label: string }>>([]);

  // Service instances
  const worldService = useMemo(() => new RPGWorldService(), []);
  const campaignService = useMemo(() => new CampaignService(), []);
  // Note: SessionService constructor is private, we'll use a different approach
  // const sessionService = useMemo(() => new SessionService(), []);

  // Load worlds on component mount
  useEffect(() => {
    const loadWorlds = async () => {
      if (!user?.id) {
        setWorlds([]);
        return;
      }

      try {
        // Use the actual worldService to get accessible worlds for the current user
        const worldList = await worldService.getAccessibleWorlds(user.id);
        const worldOptions = worldList.map((world: any) => ({
          value: world.id,
          label: world.name
        }));
        setWorlds(worldOptions);

        // Auto-select most recently edited world if no world is selected
        if (!filters.worldId && worldList.length > 0) {
          const mostRecentWorld = worldList.sort((a: any, b: any) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
          )[0];

          onFiltersChange({
            ...filters,
            worldId: mostRecentWorld.id
          });
        }
      } catch (error) {
        console.error('Error loading worlds:', error);
        // Fallback to empty array if error
        setWorlds([]);
      }
    };

    loadWorlds();
  }, [worldService, filters, onFiltersChange, user?.id]);

  // Load campaigns when world changes
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!filters.worldId) {
        setCampaigns([]);
        return;
      }

      try {
        // Use the actual campaignService to get campaigns
        const campaignList = await campaignService.getCampaignsByWorld(filters.worldId);
        const campaignOptions = [
          { value: 'all', label: 'All Campaigns' },
          ...campaignList.map((campaign: any) => ({
            value: campaign.id || '',
            label: campaign.name || ''
          }))
        ];
        setCampaigns(campaignOptions);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        setCampaigns([{ value: 'all', label: 'All Campaigns' }]);
      }
    };

    loadCampaigns();
  }, [filters.worldId, campaignService]);

  // Load sessions when campaign changes
  useEffect(() => {
    const loadSessions = async () => {
      if (!filters.campaignId || filters.campaignId === 'all') {
        setSessions([{ value: 'all', label: 'All Sessions' }]);
        return;
      }

      try {
        // For now, we'll use a mock implementation since SessionService is private
        const sessionList: any[] = []; // await sessionService.getSessionsByCampaign(filters.campaignId);
        const sessionOptions = [
          { value: 'all', label: 'All Sessions' },
          ...sessionList.map((session: any) => ({
            value: session.id || '',
            label: session.title || `Session ${session.sessionNumber || 'Untitled'}`
          }))
        ];
        setSessions(sessionOptions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([{ value: 'all', label: 'All Sessions' }]);
      }
    };

    loadSessions();
  }, [filters.campaignId]);

  // Handle filter changes
  const handleWorldChange = (worldId: string | null) => {
    onFiltersChange({
      ...filters,
      worldId: worldId || undefined,
      campaignId: undefined,
      sessionId: undefined
    });
  };

  const handleCampaignChange = (campaignId: string | null) => {
    onFiltersChange({
      ...filters,
      campaignId: campaignId === 'all' ? undefined : campaignId || undefined,
      sessionId: undefined
    });
  };

  const handleSessionChange = (sessionId: string | null) => {
    onFiltersChange({
      ...filters,
      sessionId: sessionId === 'all' ? undefined : sessionId || undefined
    });
  };

  const handleTimeFrameChange = (timeFrame: string | null) => {
    const newFilters = {
      ...filters,
      timeFrame: (timeFrame as TimelineFilterState['timeFrame']) || 'last-month'
    };

    // Clear custom dates if not custom time frame
    if (timeFrame !== 'custom') {
      newFilters.customStartDate = undefined;
      newFilters.customEndDate = undefined;
    }

    onFiltersChange(newFilters);
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: any) => {
    // Handle both Date objects and string values from DatePickerInput
    const date = value instanceof Date ? value : (value ? new Date(value) : null);
    onFiltersChange({
      ...filters,
      [field === 'start' ? 'customStartDate' : 'customEndDate']: date || undefined
    });
  };

  // Generate breadcrumb navigation
  const breadcrumbItems = useMemo(() => {
    const items = [];

    if (filters.worldId) {
      const world = worlds.find(w => w.value === filters.worldId);
      if (world) {
        items.push({
          title: world.label,
          icon: <IconWorld size={14} />,
          onClick: () => handleWorldChange(filters.worldId!)
        });
      }
    }

    if (filters.campaignId) {
      const campaign = campaigns.find(c => c.value === filters.campaignId);
      if (campaign) {
        items.push({
          title: campaign.label,
          icon: <IconUsers size={14} />,
          onClick: () => handleCampaignChange(filters.campaignId!)
        });
      }
    }

    if (filters.sessionId) {
      const session = sessions.find(s => s.value === filters.sessionId);
      if (session) {
        items.push({
          title: session.label,
          icon: <IconCalendar size={14} />,
          onClick: () => handleSessionChange(filters.sessionId!)
        });
      }
    }

    return items;
  }, [filters, worlds, campaigns, sessions]);

  // Reset filters
  const handleResetFilters = () => {
    onFiltersChange({
      timeFrame: 'last-month'
    });
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Entity Context Banner */}
        {showEntityContext && entityContext && (
          <Paper p="sm" bg="blue.0" withBorder>
            <Group justify="space-between">
              <Group gap="xs">
                <Badge color="blue" variant="light">
                  {entityContext.type}
                </Badge>
                <Text size="sm" fw={500}>
                  Showing events for: {entityContext.name}
                </Text>
              </Group>
              {onClearEntityContext && (
                <Tooltip label="Show all events">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={onClearEntityContext}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Paper>
        )}

        {/* Breadcrumb Navigation */}
        {breadcrumbItems.length > 0 && (
          <Breadcrumbs>
            {breadcrumbItems.map((item, index) => (
              <Anchor
                key={index}
                onClick={item.onClick}
                style={{ cursor: 'pointer' }}
              >
                <Group gap="xs">
                  {item.icon}
                  <Text size="sm">{item.title}</Text>
                </Group>
              </Anchor>
            ))}
          </Breadcrumbs>
        )}

        {/* Filter Controls */}
        <Group grow>
          {/* World Selector */}
          <Select
            label="RPG World"
            placeholder="Select a world"
            data={worlds}
            value={filters.worldId || null}
            onChange={handleWorldChange}
            leftSection={<IconWorld size={16} />}
            disabled={loading}
            searchable
            clearable
          />

          {/* Campaign Selector */}
          <Select
            label="Campaign"
            placeholder="All campaigns"
            data={campaigns}
            value={filters.campaignId || 'all'}
            onChange={handleCampaignChange}
            leftSection={<IconUsers size={16} />}
            disabled={loading || !filters.worldId}
            searchable
            clearable={false}
          />

          {/* Session Selector */}
          <Select
            label="Session"
            placeholder="All sessions"
            data={sessions}
            value={filters.sessionId || 'all'}
            onChange={handleSessionChange}
            leftSection={<IconCalendar size={16} />}
            disabled={loading || !filters.campaignId}
            searchable
            clearable={false}
          />
        </Group>

        {/* Time Frame Controls */}
        <Group grow>
          <Select
            label="Time Frame"
            data={TIME_FRAME_OPTIONS}
            value={filters.timeFrame}
            onChange={handleTimeFrameChange}
            leftSection={<IconClock size={16} />}
            disabled={loading}
          />

          {filters.timeFrame === 'custom' && (
            <>
              <DatePickerInput
                label="Start Date"
                placeholder="Select start date"
                value={filters.customStartDate || null}
                onChange={handleCustomDateChange.bind(null, 'start')}
                disabled={loading}
                maxDate={filters.customEndDate || new Date()}
              />
              <DatePickerInput
                label="End Date"
                placeholder="Select end date"
                value={filters.customEndDate || null}
                onChange={handleCustomDateChange.bind(null, 'end')}
                disabled={loading}
                minDate={filters.customStartDate || undefined}
                maxDate={new Date()}
              />
            </>
          )}
        </Group>

        {/* Filter Actions */}
        <Group justify="space-between">
          <Group gap="xs">
            <Badge variant="light" color="gray">
              <Group gap="xs">
                <IconFilter size={12} />
                <Text size="xs">
                  {filters.worldId ? 'Filtered' : 'No filters'}
                </Text>
              </Group>
            </Badge>
          </Group>

          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={handleResetFilters}
              disabled={loading}
            >
              Reset
            </Button>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}
