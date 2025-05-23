# Mind Map Implementation with Mantine

## Overview

This document outlines the implementation plan for the Mind Map module of the RPG Archivist application using Mantine. The Mind Map provides a visual representation of the relationships between entities in the campaign, allowing users to explore and understand the connections between characters, locations, items, and events.

## Component Architecture

The Mind Map consists of the following main components:

1. **MindMapLayout**: The overall layout of the Mind Map module
2. **MindMapVisualization**: The main visualization component using Cytoscape.js
3. **MindMapControls**: Controls for interacting with the visualization
4. **MindMapLegend**: Legend explaining the node and edge types
5. **MindMapDetails**: Details panel for the selected node

### Component Hierarchy

```
MindMapLayout
├── MindMapControls
│   ├── ViewModeToggle (2D/3D)
│   ├── ZoomControls
│   ├── FilterControls
│   └── SearchInput
├── MindMapVisualization
│   └── CytoscapeComponent
├── MindMapLegend
└── MindMapDetails
```

## Dependencies

The Mind Map module requires the following dependencies:

```bash
npm install cytoscape react-cytoscapejs @mantine/core @mantine/hooks @tabler/icons-react
```

## Mind Map Layout

The Mind Map layout uses Mantine's `AppShell` component to create a responsive layout with a sidebar for controls and details.

### Implementation

```tsx
// src/pages/MindMap/MindMapLayout.tsx
import { useState } from 'react';
import { AppShell, Navbar, useMantineTheme } from '@mantine/core';
import MindMapVisualization from './MindMapVisualization';
import MindMapControls from './MindMapControls';
import MindMapDetails from './MindMapDetails';
import { useEntity } from '../../contexts/EntityContext';

function MindMapLayout() {
  const theme = useMantineTheme();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { selectedEntity } = useEntity();

  // Center on the selected entity if available
  const centerEntityId = selectedEntity?.id || null;

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 300 }} p="md" hiddenBreakpoint="sm" hidden={!selectedNodeId}>
          <MindMapDetails nodeId={selectedNodeId} />
        </Navbar>
      }
      styles={{
        main: {
          background: theme.colors.dark[9],
        },
      }}
    >
      <MindMapControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearch={(id) => setSelectedNodeId(id)}
      />
      <MindMapVisualization
        viewMode={viewMode}
        centerEntityId={centerEntityId}
        onNodeSelect={setSelectedNodeId}
      />
    </AppShell>
  );
}

export default MindMapLayout;
```

## Mind Map Controls

The Mind Map Controls component provides controls for interacting with the visualization.

### Implementation

```tsx
// src/pages/MindMap/MindMapControls.tsx
import { Group, SegmentedControl, ActionIcon, TextInput, Select, Box } from '@mantine/core';
import { IconSearch, IconZoomIn, IconZoomOut, IconFilter } from '@tabler/icons-react';

interface MindMapControlsProps {
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onSearch: (id: string) => void;
}

function MindMapControls({ viewMode, onViewModeChange, onSearch }: MindMapControlsProps) {
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
      })}
    >
      <Group>
        <SegmentedControl
          value={viewMode}
          onChange={(value) => onViewModeChange(value as '2d' | '3d')}
          data={[
            { label: '2D', value: '2d' },
            { label: '3D', value: '3d' },
          ]}
        />
        <Group spacing="xs">
          <ActionIcon variant="filled" color="gray">
            <IconZoomOut size="1.125rem" />
          </ActionIcon>
          <ActionIcon variant="filled" color="gray">
            <IconZoomIn size="1.125rem" />
          </ActionIcon>
        </Group>
      </Group>

      <Group>
        <Select
          placeholder="Filter by type"
          icon={<IconFilter size="1rem" />}
          data={[
            { value: 'all', label: 'All Types' },
            { value: 'character', label: 'Characters' },
            { value: 'location', label: 'Locations' },
            { value: 'item', label: 'Items' },
            { value: 'event', label: 'Events' },
          ]}
          sx={{ width: 200 }}
        />
        <TextInput
          placeholder="Search entities..."
          icon={<IconSearch size="1rem" />}
          sx={{ width: 250 }}
          onChange={(event) => {
            // In a real app, this would trigger a search and return results
            // For now, we'll just simulate selecting a node
            if (event.currentTarget.value === 'Elara') {
              onSearch('1');
            }
          }}
        />
      </Group>
    </Box>
  );
}

export default MindMapControls;
```

## Mind Map Visualization

The Mind Map Visualization component uses Cytoscape.js to render the graph visualization.

### Implementation

```tsx
// src/pages/MindMap/MindMapVisualization.tsx
import { useRef, useEffect, useState } from 'react';
import { Box, ActionIcon, Group } from '@mantine/core';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { IconEye, IconPhoto, IconTimeline } from '@tabler/icons-react';

// Define the entity type colors
const entityColors = {
  character: '#1A9B9B', // teal
  location: '#9B1A9B', // purple
  item: '#9B9B1A', // gold
  event: '#1A9B1A', // green
  session: '#1A1A9B', // blue
  default: '#1A9B9B', // default teal
};

interface MindMapVisualizationProps {
  viewMode: '2d' | '3d';
  centerEntityId: string | null;
  onNodeSelect: (id: string) => void;
}

function MindMapVisualization({ viewMode, centerEntityId, onNodeSelect }: MindMapVisualizationProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Mock data - replace with actual data from API
  const elements = [
    // Nodes
    { data: { id: '1', label: 'Elara Moonwhisper', type: 'character', color: entityColors.character } },
    { data: { id: '2', label: 'Thorne Blackwood', type: 'character', color: entityColors.character } },
    { data: { id: '3', label: 'Shadowvale', type: 'location', color: entityColors.location } },
    { data: { id: '4', label: 'Enchanted Amulet', type: 'item', color: entityColors.item } },
    { data: { id: '5', label: 'The Dark Ritual', type: 'event', color: entityColors.event } },
    
    // Edges
    { 
      data: { 
        id: 'e1', 
        source: '1', 
        target: '2', 
        label: 'Allies', 
        color: '#FFFFFF',
        sourceColor: entityColors.character,
        targetColor: entityColors.character
      } 
    },
    { 
      data: { 
        id: 'e2', 
        source: '1', 
        target: '3', 
        label: 'Lives in', 
        color: '#FFFFFF',
        sourceColor: entityColors.character,
        targetColor: entityColors.location
      } 
    },
    { 
      data: { 
        id: 'e3', 
        source: '1', 
        target: '4', 
        label: 'Possesses', 
        color: '#FFFFFF',
        sourceColor: entityColors.character,
        targetColor: entityColors.item
      } 
    },
    { 
      data: { 
        id: 'e4', 
        source: '1', 
        target: '5', 
        label: 'Participated in', 
        color: '#FFFFFF',
        sourceColor: entityColors.character,
        targetColor: entityColors.event
      } 
    },
    { 
      data: { 
        id: 'e5', 
        source: '2', 
        target: '3', 
        label: 'Visited', 
        color: '#FFFFFF',
        sourceColor: entityColors.character,
        targetColor: entityColors.location
      } 
    },
    { 
      data: { 
        id: 'e6', 
        source: '2', 
        target: '5', 
        label: 'Witnessed', 
        color: '#FFFFFF',
        sourceColor: entityColors.character,
        targetColor: entityColors.event
      } 
    },
  ];

  // Layout configuration
  const layout = {
    name: 'cose',
    animate: true,
    nodeDimensionsIncludeLabels: true,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 10000,
    nodeOverlap: 20,
    idealEdgeLength: 100,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
  };

  // Stylesheet for the graph
  const stylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'width': 50,
        'height': 50,
        'shape': 'hexagon',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 10,
        'border-width': 2,
        'border-color': 'data(color)',
        'text-outline-width': 2,
        'text-outline-color': '#0D1117',
        'color': '#FFFFFF',
        'font-size': 14,
        'font-weight': 'bold',
        'text-max-width': 100,
        'text-wrap': 'ellipsis',
        'text-overflow-wrap': 'anywhere',
        'shadow-blur': 15,
        'shadow-color': 'data(color)',
        'shadow-opacity': 0.5,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.7,
        'line-style': 'solid',
        'arrow-scale': 1.5,
        'label': 'data(label)',
        'font-size': 10,
        'text-outline-width': 2,
        'text-outline-color': '#0D1117',
        'color': '#FFFFFF',
      }
    },
    {
      selector: ':selected',
      style: {
        'border-width': 4,
        'border-color': '#FFFFFF',
        'shadow-blur': 25,
        'shadow-color': 'data(color)',
        'shadow-opacity': 0.8,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
        'z-index': 999,
      }
    },
    {
      selector: 'node:active',
      style: {
        'overlay-color': '#FFFFFF',
        'overlay-padding': 10,
        'overlay-opacity': 0.3,
      }
    },
  ];

  // Effect to center on the selected entity
  useEffect(() => {
    if (cyRef.current && centerEntityId) {
      const node = cyRef.current.getElementById(centerEntityId);
      if (node.length > 0) {
        cyRef.current.center(node);
        node.select();
        setSelectedNode(centerEntityId);
      }
    }
  }, [centerEntityId]);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', position: 'relative' }}>
      <CytoscapeComponent
        elements={elements}
        layout={layout}
        stylesheet={stylesheet}
        style={{ width: '100%', height: '100%' }}
        cy={(cy) => {
          cyRef.current = cy;
          
          cy.on('tap', 'node', (event) => {
            const node = event.target;
            setSelectedNode(node.id());
            onNodeSelect(node.id());
          });
          
          cy.on('tap', (event) => {
            if (event.target === cy) {
              setSelectedNode(null);
              onNodeSelect('');
            }
          });
        }}
      />

      {/* Quick action buttons for selected node */}
      {selectedNode && (
        <Group
          sx={(theme) => ({
            position: 'absolute',
            bottom: theme.spacing.md,
            right: theme.spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
          })}
        >
          <ActionIcon
            variant="filled"
            color="teal"
            radius="xl"
            size="lg"
            sx={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)' }}
          >
            <IconEye size="1.5rem" />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            color="teal"
            radius="xl"
            size="lg"
            sx={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)' }}
          >
            <IconPhoto size="1.5rem" />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            color="teal"
            radius="xl"
            size="lg"
            sx={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)' }}
          >
            <IconTimeline size="1.5rem" />
          </ActionIcon>
        </Group>
      )}
    </Box>
  );
}

export default MindMapVisualization;
```

## Mind Map Details

The Mind Map Details component displays information about the selected node.

### Implementation

```tsx
// src/pages/MindMap/MindMapDetails.tsx
import { Stack, Title, Text, Group, Avatar, Button, Divider, Badge } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';

interface MindMapDetailsProps {
  nodeId: string | null;
}

function MindMapDetails({ nodeId }: MindMapDetailsProps) {
  if (!nodeId) {
    return (
      <Stack align="center" justify="center" style={{ height: '100%' }}>
        <Text c="dimmed">Select a node to view details</Text>
      </Stack>
    );
  }

  // Mock data - replace with actual data from API
  const nodeData = {
    id: nodeId,
    name: 'Elara Moonwhisper',
    type: 'character',
    description: 'An elven sorceress with a mysterious past. She wields powerful arcane magic and is searching for ancient artifacts to unlock the secrets of her lineage.',
    imageUrl: 'https://via.placeholder.com/150',
    relationships: [
      { id: '2', name: 'Thorne Blackwood', type: 'Ally' },
      { id: '3', name: 'Shadowvale', type: 'Lives in' },
      { id: '4', name: 'Enchanted Amulet', type: 'Possesses' },
      { id: '5', name: 'The Dark Ritual', type: 'Participated in' },
    ],
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'teal';
      case 'location':
        return 'violet';
      case 'item':
        return 'yellow';
      case 'event':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <Stack spacing="md">
      <Group position="apart">
        <Group>
          <Avatar src={nodeData.imageUrl} size="lg" radius="md" />
          <div>
            <Title order={4}>{nodeData.name}</Title>
            <Badge color={getTypeColor(nodeData.type)}>
              {nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)}
            </Badge>
          </div>
        </Group>
      </Group>

      <Text size="sm">{nodeData.description}</Text>

      <Button
        variant="outline"
        leftIcon={<IconExternalLink size="1rem" />}
        fullWidth
      >
        View in Data Hub
      </Button>

      <Divider label="Relationships" labelPosition="center" />

      <Stack spacing="xs">
        {nodeData.relationships.map((rel) => (
          <Group key={rel.id} position="apart">
            <Text size="sm">{rel.name}</Text>
            <Badge size="sm" variant="outline">
              {rel.type}
            </Badge>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

export default MindMapDetails;
```

## Mind Map Legend

The Mind Map Legend component explains the node and edge types.

### Implementation

```tsx
// src/pages/MindMap/MindMapLegend.tsx
import { Paper, Stack, Group, Box, Text, useMantineTheme } from '@mantine/core';

function MindMapLegend() {
  const theme = useMantineTheme();

  const nodeTypes = [
    { type: 'Character', color: '#1A9B9B' },
    { type: 'Location', color: '#9B1A9B' },
    { type: 'Item', color: '#9B9B1A' },
    { type: 'Event', color: '#1A9B1A' },
    { type: 'Session', color: '#1A1A9B' },
  ];

  return (
    <Paper
      p="md"
      withBorder
      sx={(theme) => ({
        position: 'absolute',
        bottom: theme.spacing.md,
        left: theme.spacing.md,
        backgroundColor: theme.fn.rgba(theme.colors.dark[7], 0.9),
        backdropFilter: 'blur(4px)',
        zIndex: 100,
      })}
    >
      <Stack spacing="xs">
        <Text size="sm" fw={500}>Legend</Text>
        {nodeTypes.map((node) => (
          <Group key={node.type} spacing="xs">
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: node.color,
                borderRadius: '50%',
                boxShadow: `0 0 10px ${node.color}`,
              }}
            />
            <Text size="xs">{node.type}</Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export default MindMapLegend;
```

## Integration with Entity Context

The Mind Map module integrates with the Entity Context to center on the selected entity.

### Implementation

```tsx
// src/pages/MindMap/index.tsx
import { EntityProvider } from '../../contexts/EntityContext';
import MindMapLayout from './MindMapLayout';

function MindMap() {
  return (
    <EntityProvider>
      <MindMapLayout />
    </EntityProvider>
  );
}

export default MindMap;
```

## 3D Visualization (Optional)

For the 3D visualization mode, we can use a library like `react-force-graph-3d`. This would require additional implementation and is considered optional for the initial version.

## Conclusion

This implementation plan provides a comprehensive guide for creating the Mind Map module of the RPG Archivist application using Mantine and Cytoscape.js. By following this plan, developers can create an interactive and visually appealing graph visualization that helps users understand the relationships between entities in their campaign.
