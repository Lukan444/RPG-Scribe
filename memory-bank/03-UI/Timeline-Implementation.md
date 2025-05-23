# Timeline Implementation with Mantine

## Overview

This document outlines the implementation plan for the Timeline module of the RPG Archivist application using Mantine. The Timeline provides a chronological visualization of events and sessions, allowing users to toggle between in-game and real-life timelines.

## Component Architecture

The Timeline consists of the following main components:

1. **TimelineLayout**: The overall layout of the Timeline module
2. **TimelineControls**: Controls for interacting with the timeline
3. **TimelineVisualization**: The main visualization component
4. **TimelineItem**: Component for individual timeline items
5. **TimelineDetails**: Details panel for the selected timeline item

### Component Hierarchy

```
TimelineLayout
├── TimelineControls
│   ├── TimelineTypeToggle (In-Game/Real-Life)
│   ├── ZoomControls
│   └── FilterControls
├── TimelineVisualization
│   └── TimelineItem
└── TimelineDetails
```

## Timeline Layout

The Timeline layout uses Mantine's `AppShell` component to create a responsive layout with a sidebar for details.

### Implementation

```tsx
// src/pages/Timeline/TimelineLayout.tsx
import { useState } from 'react';
import { AppShell, Navbar, useMantineTheme } from '@mantine/core';
import TimelineVisualization from './TimelineVisualization';
import TimelineControls from './TimelineControls';
import TimelineDetails from './TimelineDetails';

function TimelineLayout() {
  const theme = useMantineTheme();
  const [timelineType, setTimelineType] = useState<'in-game' | 'real-life'>('in-game');
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 300 }} p="md" hiddenBreakpoint="sm" hidden={!selectedItemId}>
          <TimelineDetails itemId={selectedItemId} />
        </Navbar>
      }
      styles={{
        main: {
          background: theme.colors.dark[9],
        },
      }}
    >
      <TimelineControls
        timelineType={timelineType}
        onTimelineTypeChange={setTimelineType}
        zoom={zoom}
        onZoomChange={setZoom}
        filter={filter}
        onFilterChange={setFilter}
      />
      <TimelineVisualization
        timelineType={timelineType}
        zoom={zoom}
        filter={filter}
        onItemSelect={setSelectedItemId}
      />
    </AppShell>
  );
}

export default TimelineLayout;
```

## Timeline Controls

The Timeline Controls component provides controls for interacting with the timeline.

### Implementation

```tsx
// src/pages/Timeline/TimelineControls.tsx
import { Group, SegmentedControl, ActionIcon, Select, Box, Text, Slider } from '@mantine/core';
import { IconZoomIn, IconZoomOut, IconFilter } from '@tabler/icons-react';

interface TimelineControlsProps {
  timelineType: 'in-game' | 'real-life';
  onTimelineTypeChange: (type: 'in-game' | 'real-life') => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

function TimelineControls({
  timelineType,
  onTimelineTypeChange,
  zoom,
  onZoomChange,
  filter,
  onFilterChange,
}: TimelineControlsProps) {
  return (
    <Box
      sx={(theme) => ({
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: theme.colors.dark[8],
        padding: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.dark[5]}`,
      })}
    >
      <Group position="apart">
        <Group>
          <Text size="sm" fw={500}>
            Timeline Type:
          </Text>
          <SegmentedControl
            value={timelineType}
            onChange={(value) => onTimelineTypeChange(value as 'in-game' | 'real-life')}
            data={[
              { label: 'In-Game', value: 'in-game' },
              { label: 'Real-Life', value: 'real-life' },
            ]}
          />
        </Group>

        <Group>
          <Text size="sm" fw={500}>
            Zoom:
          </Text>
          <ActionIcon
            variant="filled"
            color="gray"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
          >
            <IconZoomOut size="1.125rem" />
          </ActionIcon>
          <Text size="sm" w={40} ta="center">
            {Math.round(zoom * 100)}%
          </Text>
          <ActionIcon
            variant="filled"
            color="gray"
            onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
          >
            <IconZoomIn size="1.125rem" />
          </ActionIcon>
        </Group>

        <Group>
          <Text size="sm" fw={500}>
            Filter:
          </Text>
          <Select
            placeholder="Filter items"
            value={filter}
            onChange={(value) => onFilterChange(value || 'all')}
            data={[
              { value: 'all', label: 'All Items' },
              { value: 'sessions', label: 'Sessions Only' },
              { value: 'events', label: 'Events Only' },
              { value: 'characters', label: 'Character Involvement' },
            ]}
            icon={<IconFilter size="1rem" />}
            sx={{ width: 200 }}
          />
        </Group>
      </Group>
    </Box>
  );
}

export default TimelineControls;
```

## Timeline Visualization

The Timeline Visualization component displays the timeline with events and sessions.

### Implementation

```tsx
// src/pages/Timeline/TimelineVisualization.tsx
import { useRef, useEffect } from 'react';
import { Box, Stack } from '@mantine/core';
import TimelineItem from './TimelineItem';

interface TimelineItem {
  id: string;
  name: string;
  type: 'session' | 'event';
  description?: string;
  inGameDate?: string;
  date?: string;
  duration?: number;
  participants?: string[];
  involvedCharacters?: string[];
}

interface TimelineVisualizationProps {
  timelineType: 'in-game' | 'real-life';
  zoom: number;
  filter: string;
  onItemSelect: (id: string) => void;
}

function TimelineVisualization({
  timelineType,
  zoom,
  filter,
  onItemSelect,
}: TimelineVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with actual data from API
  const timelineData: TimelineItem[] = [
    {
      id: '1',
      name: 'Session 1: The Beginning',
      type: 'session',
      description: 'The party meets in a tavern and embarks on their first adventure.',
      inGameDate: '1422-05-15',
      date: '2023-01-10',
      duration: 180,
      participants: ['John', 'Sarah', 'Mike', 'Emily'],
      involvedCharacters: ['1', '2'],
    },
    {
      id: '2',
      name: 'The Dark Ritual',
      type: 'event',
      description: 'A mysterious ritual is performed in the forest.',
      inGameDate: '1422-05-20',
      date: '2023-01-15',
      involvedCharacters: ['1', '3'],
    },
    {
      id: '3',
      name: 'Session 2: Into the Forest',
      type: 'session',
      description: 'The party ventures into the forest to investigate strange occurrences.',
      inGameDate: '1422-05-25',
      date: '2023-01-24',
      duration: 210,
      participants: ['John', 'Sarah', 'Mike', 'Emily'],
      involvedCharacters: ['1', '2', '3'],
    },
    {
      id: '4',
      name: 'Discovery of the Ancient Artifact',
      type: 'event',
      description: 'The party discovers an ancient artifact with mysterious powers.',
      inGameDate: '1422-05-26',
      date: '2023-01-24',
      involvedCharacters: ['1', '2'],
    },
    {
      id: '5',
      name: 'Session 3: Return to Town',
      type: 'session',
      description: 'The party returns to town with the artifact.',
      inGameDate: '1422-06-01',
      date: '2023-02-07',
      duration: 195,
      participants: ['John', 'Sarah', 'Mike'],
      involvedCharacters: ['1', '2', '4'],
    },
  ];

  // Filter timeline data based on filter
  const filteredData = timelineData.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'sessions') return item.type === 'session';
    if (filter === 'events') return item.type === 'event';
    if (filter === 'characters') return item.involvedCharacters && item.involvedCharacters.length > 0;
    return true;
  });

  // Sort timeline data based on timeline type
  const sortedData = [...filteredData].sort((a, b) => {
    if (timelineType === 'in-game') {
      return (a.inGameDate || '').localeCompare(b.inGameDate || '');
    } else {
      return (a.date || '').localeCompare(b.date || '');
    }
  });

  return (
    <Box
      ref={containerRef}
      sx={(theme) => ({
        position: 'relative',
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xl * 2,
      })}
    >
      {/* Timeline axis */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          left: theme.spacing.xl,
          right: theme.spacing.xl,
          top: theme.spacing.xl,
          height: 2,
          backgroundColor: theme.colors.teal[6],
          opacity: 0.3,
        })}
      />

      {/* Timeline items */}
      <Stack
        spacing={theme.spacing.xl * 2}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {sortedData.map((item) => (
          <TimelineItem
            key={item.id}
            item={item}
            timelineType={timelineType}
            onSelect={() => onItemSelect(item.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default TimelineVisualization;
```

## Timeline Item

The Timeline Item component displays an individual item on the timeline.

### Implementation

```tsx
// src/pages/Timeline/TimelineItem.tsx
import { Box, Paper, Title, Text, Group, Badge, Button, Avatar, Stack } from '@mantine/core';
import { IconCalendar, IconClock, IconUsers, IconExternalLink } from '@tabler/icons-react';

interface TimelineItemProps {
  item: {
    id: string;
    name: string;
    type: 'session' | 'event';
    description?: string;
    inGameDate?: string;
    date?: string;
    duration?: number;
    participants?: string[];
    involvedCharacters?: string[];
  };
  timelineType: 'in-game' | 'real-life';
  onSelect: () => void;
}

function TimelineItem({ item, timelineType, onSelect }: TimelineItemProps) {
  const isSession = item.type === 'session';

  // Format date based on timeline type
  const formattedDate = timelineType === 'in-game'
    ? formatInGameDate(item.inGameDate || '')
    : formatRealDate(item.date || '');

  // Format duration
  const formattedDuration = formatDuration(item.duration || 0);

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        paddingLeft: theme.spacing.xl * 2,
        marginLeft: theme.spacing.xl,
      })}
    >
      {/* Date marker */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          left: -theme.spacing.xl - 8,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        })}
      >
        <Box
          sx={(theme) => ({
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: isSession ? theme.colors.teal[6] : theme.colors.amber[6],
            boxShadow: `0 0 10px ${isSession ? theme.colors.teal[6] : theme.colors.amber[6]}`,
          })}
        />
        <Text size="xs" c="dimmed" mt={4}>
          {formattedDate}
        </Text>
      </Box>

      {/* Content */}
      <Paper
        p="md"
        radius="md"
        withBorder
        shadow="sm"
        sx={(theme) => ({
          backgroundColor: theme.colors.dark[7],
          borderColor: isSession ? theme.colors.teal[9] : theme.colors.amber[9],
          borderWidth: 1,
          borderStyle: 'solid',
          width: isSession ? '100%' : '80%',
        })}
        onClick={onSelect}
      >
        <Group position="apart" mb={isSession ? 'xs' : 0}>
          <Title order={4}>{item.name}</Title>
          <Badge color={isSession ? 'teal' : 'yellow'}>
            {isSession ? 'Session' : 'Event'}
          </Badge>
        </Group>

        {item.description && (
          <Text size="sm" mb="xs">
            {item.description}
          </Text>
        )}

        {isSession && (
          <Box mt="md">
            <Group spacing="xl">
              <Group spacing="xs">
                <IconClock size="1rem" />
                <Text size="sm">{formattedDuration}</Text>
              </Group>
              <Group spacing="xs">
                <IconUsers size="1rem" />
                <Text size="sm">{item.participants?.join(', ')}</Text>
              </Group>
            </Group>
          </Box>
        )}

        <Group position="right" mt="md">
          <Button
            variant="subtle"
            size="xs"
            rightIcon={<IconExternalLink size="0.8rem" />}
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to details page
            }}
          >
            View Details
          </Button>
        </Group>
      </Paper>
    </Box>
  );
}

// Helper functions
function formatInGameDate(date: string): string {
  // Format in-game date (e.g., "15th of Mirtul, 1422")
  if (!date) return '';
  
  const [year, month, day] = date.split('-').map(Number);
  const months = [
    'Hammer', 'Alturiak', 'Ches', 'Tarsakh', 'Mirtul', 'Kythorn',
    'Flamerule', 'Eleasis', 'Eleint', 'Marpenoth', 'Uktar', 'Nightal'
  ];
  
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} of ${months[month - 1]}, ${year}`;
}

function formatRealDate(date: string): string {
  // Format real-life date (e.g., "Jan 10, 2023")
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(minutes: number): string {
  // Format duration (e.g., "3h 15m")
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default TimelineItem;
```

## Timeline Details

The Timeline Details component displays information about the selected timeline item.

### Implementation

```tsx
// src/pages/Timeline/TimelineDetails.tsx
import { Stack, Title, Text, Group, Badge, Button, Divider, Avatar } from '@mantine/core';
import { IconCalendar, IconClock, IconUsers, IconExternalLink } from '@tabler/icons-react';

interface TimelineDetailsProps {
  itemId: string | null;
}

function TimelineDetails({ itemId }: TimelineDetailsProps) {
  if (!itemId) {
    return (
      <Stack align="center" justify="center" style={{ height: '100%' }}>
        <Text c="dimmed">Select a timeline item to view details</Text>
      </Stack>
    );
  }

  // Mock data - replace with actual data from API
  const item = {
    id: itemId,
    name: 'Session 2: Into the Forest',
    type: 'session',
    description: 'The party ventures into the forest to investigate strange occurrences. They encounter several mysterious creatures and find clues leading to an ancient ritual site.',
    inGameDate: '1422-05-25',
    date: '2023-01-24',
    duration: 210,
    participants: ['John', 'Sarah', 'Mike', 'Emily'],
    involvedCharacters: [
      { id: '1', name: 'Elara Moonwhisper', role: 'Player Character' },
      { id: '2', name: 'Thorne Blackwood', role: 'Player Character' },
      { id: '3', name: 'Mysterious Druid', role: 'NPC' },
    ],
    locations: [
      { id: '1', name: 'Shadowvale Forest' },
      { id: '2', name: 'Ancient Ritual Site' },
    ],
    items: [
      { id: '1', name: 'Mysterious Map Fragment' },
    ],
    notes: 'The party found a fragment of an ancient map that seems to lead to a hidden temple. The mysterious druid warned them about dark forces gathering in the forest.',
  };

  const isSession = item.type === 'session';

  return (
    <Stack spacing="md">
      <Title order={3}>{item.name}</Title>
      <Badge size="lg" color={isSession ? 'teal' : 'yellow'}>
        {isSession ? 'Session' : 'Event'}
      </Badge>

      <Text>{item.description}</Text>

      <Divider />

      <Group>
        <IconCalendar size="1rem" />
        <Text size="sm">
          <strong>In-Game Date:</strong> {formatInGameDate(item.inGameDate)}
        </Text>
      </Group>

      <Group>
        <IconCalendar size="1rem" />
        <Text size="sm">
          <strong>Real Date:</strong> {formatRealDate(item.date)}
        </Text>
      </Group>

      {isSession && (
        <Group>
          <IconClock size="1rem" />
          <Text size="sm">
            <strong>Duration:</strong> {formatDuration(item.duration)}
          </Text>
        </Group>
      )}

      {isSession && (
        <Group>
          <IconUsers size="1rem" />
          <Text size="sm">
            <strong>Participants:</strong> {item.participants.join(', ')}
          </Text>
        </Group>
      )}

      <Divider label="Characters" labelPosition="center" />

      <Stack spacing="xs">
        {item.involvedCharacters.map((character) => (
          <Group key={character.id} position="apart">
            <Group>
              <Avatar radius="xl" size="sm" />
              <Text size="sm">{character.name}</Text>
            </Group>
            <Badge size="sm">{character.role}</Badge>
          </Group>
        ))}
      </Stack>

      <Divider label="Locations" labelPosition="center" />

      <Stack spacing="xs">
        {item.locations.map((location) => (
          <Text key={location.id} size="sm">
            {location.name}
          </Text>
        ))}
      </Stack>

      <Divider label="Items" labelPosition="center" />

      <Stack spacing="xs">
        {item.items.map((item) => (
          <Text key={item.id} size="sm">
            {item.name}
          </Text>
        ))}
      </Stack>

      {item.notes && (
        <>
          <Divider label="Notes" labelPosition="center" />
          <Text size="sm">{item.notes}</Text>
        </>
      )}

      <Button
        leftIcon={<IconExternalLink size="1rem" />}
        fullWidth
        mt="md"
      >
        {isSession ? 'View Session Details' : 'View Event Details'}
      </Button>

      {isSession && (
        <Button
          variant="outline"
          fullWidth
        >
          View Transcript
        </Button>
      )}
    </Stack>
  );
}

// Helper functions (same as in TimelineItem)
function formatInGameDate(date: string): string {
  if (!date) return '';
  
  const [year, month, day] = date.split('-').map(Number);
  const months = [
    'Hammer', 'Alturiak', 'Ches', 'Tarsakh', 'Mirtul', 'Kythorn',
    'Flamerule', 'Eleasis', 'Eleint', 'Marpenoth', 'Uktar', 'Nightal'
  ];
  
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} of ${months[month - 1]}, ${year}`;
}

function formatRealDate(date: string): string {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default TimelineDetails;
```

## Integration with Entity Context

The Timeline module integrates with the Entity Context to highlight entities involved in timeline items.

### Implementation

```tsx
// src/pages/Timeline/index.tsx
import { EntityProvider } from '../../contexts/EntityContext';
import TimelineLayout from './TimelineLayout';

function Timeline() {
  return (
    <EntityProvider>
      <TimelineLayout />
    </EntityProvider>
  );
}

export default Timeline;
```

## Conclusion

This implementation plan provides a comprehensive guide for creating the Timeline module of the RPG Archivist application using Mantine. By following this plan, developers can create an interactive and visually appealing timeline that helps users understand the chronology of events and sessions in their campaign.
