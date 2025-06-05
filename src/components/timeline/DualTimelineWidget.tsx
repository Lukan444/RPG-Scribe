/**
 * Dual Timeline Widget - Production-ready embeddable component
 * Reusable dual timeline component for integration throughout the application
 */

import React, { useMemo } from 'react';
import { Paper, Title, Text, Group, Badge, Stack, ActionIcon, Tooltip } from '@mantine/core';
import { IconTimeline, IconMaximize, IconSettings } from '@tabler/icons-react';
import { DualTimelineVisualization } from './DualTimelineVisualization';
import { DualTimelineProvider } from '../../contexts/DualTimelineContext';
import { DualTimelineConfig } from '../../types/dualTimeline.types';
import { createDefaultTimeConversion } from '../../services/timeConversion.service';

export interface DualTimelineWidgetProps {
  /** World ID for timeline context */
  worldId?: string;
  /** Campaign ID for timeline context */
  campaignId?: string;
  /** Widget title override */
  title?: string;
  /** Widget description override */
  description?: string;
  /** Widget height (default: 400px) */
  height?: number;
  /** Display mode for the timeline */
  displayMode?: 'dual' | 'real-world' | 'in-game';
  /** Show widget header */
  showHeader?: boolean;
  /** Show widget controls */
  showControls?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Enable editing capabilities */
  enableEditing?: boolean;
  /** Callback when timeline is maximized */
  onMaximize?: () => void;
  /** Callback when settings are opened */
  onSettings?: () => void;
  /** Callback when event is clicked */
  onEventClick?: (eventId: string, timeline: 'real-world' | 'in-game') => void;
  /** Callback when event is edited */
  onEventEdit?: (eventId: string) => void;
}

/**
 * Dual Timeline Widget Component
 * Production-ready embeddable dual timeline for use throughout the application
 */
export function DualTimelineWidget({
  worldId,
  campaignId,
  title = 'Campaign Timeline',
  description = 'Dual timeline visualization showing real-world and in-game events',
  height = 400,
  displayMode = 'dual',
  showHeader = true,
  showControls = true,
  compact = false,
  enableEditing = false,
  onMaximize,
  onSettings,
  onEventClick,
  onEventEdit
}: DualTimelineWidgetProps) {
  
  // Create dual timeline configuration
  const dualTimelineConfig = useMemo((): DualTimelineConfig => ({
    worldId: worldId || '',
    campaignId: campaignId || '',
    
    // Display configuration
    displayMode: displayMode,
    syncOptions: {
      syncScrolling: true,
      syncZoom: true,
      syncSelection: true,
      showConnections: true
    },
    
    // Timeline axes
    realWorldAxis: {
      id: 'real-world',
      label: 'Real World Timeline',
      timeSystem: 'real-world',
      visible: displayMode === 'dual' || displayMode === 'real-world',
      height: compact ? 200 : 300,
      color: '#1c7ed6',
      groups: [
        { id: 'sessions', title: 'Gaming Sessions', timeSystem: 'real-world' }
      ]
    },
    
    inGameAxis: {
      id: 'in-game',
      label: 'In-Game Timeline',
      timeSystem: 'in-game',
      visible: displayMode === 'dual' || displayMode === 'in-game',
      height: compact ? 200 : 300,
      color: '#51cf66',
      groups: [
        { id: 'events', title: 'Campaign Events', timeSystem: 'in-game' }
      ]
    },
    
    // Time conversion
    timeConversion: createDefaultTimeConversion(24).getConfig(),
    
    // Visual options
    showMarkers: !compact,
    showConflicts: !compact,
    enableEditing: enableEditing,
    height: height,
    
    // Connection visualization
    connectionStyle: 'lines',
    connectionOpacity: compact ? 0.4 : 0.6
  }), [worldId, campaignId, displayMode, height, compact, enableEditing]);

  const handleEventClick = (eventId: string, timeline: 'real-world' | 'in-game') => {
    onEventClick?.(eventId, timeline);
  };

  const handleEventEdit = (eventId: string) => {
    onEventEdit?.(eventId);
  };

  const handleMaximize = () => {
    onMaximize?.();
  };

  const handleSettings = () => {
    onSettings?.();
  };

  return (
    <Paper withBorder p={compact ? "sm" : "md"} h={height + (showHeader ? 80 : 0)}>
      <Stack gap={compact ? "xs" : "sm"} h="100%">
        {/* Widget Header */}
        {showHeader && (
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs" align="center">
                <IconTimeline size={20} color="var(--mantine-color-blue-6)" />
                <Title order={compact ? 5 : 4}>{title}</Title>
              </Group>
              {!compact && (
                <Text size="sm" c="dimmed" mt={2}>
                  {description}
                </Text>
              )}
            </div>
            
            {showControls && (
              <Group gap="xs">
                <Badge 
                  color={displayMode === 'dual' ? 'blue' : displayMode === 'real-world' ? 'cyan' : 'green'}
                  size="sm"
                >
                  {displayMode === 'dual' ? 'Dual View' : 
                   displayMode === 'real-world' ? 'Real World' : 'In-Game'}
                </Badge>
                
                {onSettings && (
                  <Tooltip label="Timeline Settings">
                    <ActionIcon 
                      variant="subtle" 
                      size="sm"
                      onClick={handleSettings}
                    >
                      <IconSettings size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                
                {onMaximize && (
                  <Tooltip label="Maximize Timeline">
                    <ActionIcon 
                      variant="subtle" 
                      size="sm"
                      onClick={handleMaximize}
                    >
                      <IconMaximize size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            )}
          </Group>
        )}

        {/* Dual Timeline Visualization */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <DualTimelineProvider config={dualTimelineConfig}>
            <DualTimelineVisualization
              config={dualTimelineConfig}
              onEventClick={handleEventClick}
              onEventEdit={handleEventEdit}
            />
          </DualTimelineProvider>
        </div>
      </Stack>
    </Paper>
  );
}

export default DualTimelineWidget;
