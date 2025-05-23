import React from 'react';
import { Paper, Box, Title, Text, Group, Stack, LoadingOverlay, Center, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

interface VisualizationLayoutProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number | string;
  width?: number | string;
  icon?: React.ReactNode;
  controls?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * VisualizationLayout - Consistent layout for visualization components
 */
export function VisualizationLayout({
  title,
  description,
  loading = false,
  error = null,
  height = 600,
  width = '100%',
  icon,
  controls,
  onRetry,
  children
}: VisualizationLayoutProps) {
  // Determine if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Paper p={isMobile ? "xs" : "md"} withBorder shadow="sm">
      <Box pos="relative" h={height}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

        {error ? (
          <Center h="100%">
            <Stack align="center" gap="md">
              <IconAlertCircle size={32} color="red" />
              <Text c="red" ta="center" fw={500}>{error}</Text>
              {onRetry && (
                <Button variant="outline" color="blue" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <>
            <Stack gap="md" mb="md">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4}>{title}</Title>
                  {description && <Text c="dimmed" size="sm">{description}</Text>}
                </div>
                {icon && <div>{icon}</div>}
              </Group>

              {controls && (
                <div>{controls}</div>
              )}
            </Stack>

            <Box style={{ height: typeof height === 'number' ? height - 100 : '80%', width }}>
              {children}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

/**
 * Apply layout to nodes and edges
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @param layoutType - Type of layout to apply
 * @returns Object containing nodes with updated positions
 */
VisualizationLayout.applyLayout = (
  nodes: Node[],
  edges: Edge[],
  layoutType: string = 'force'
): { nodes: Node[] } => {
  if (!nodes.length) return { nodes };

  // Create a copy of the nodes to avoid mutating the original
  const layoutedNodes = [...nodes];

  switch (layoutType) {
    case 'dagre':
    case 'hierarchical':
      return applyHierarchicalLayout(layoutedNodes, edges);
    case 'grid':
      return applyGridLayout(layoutedNodes);
    case 'circular':
      return applyCircularLayout(layoutedNodes);
    case 'force':
    default:
      return applyForceDirectedLayout(layoutedNodes, edges);
  }
};

/**
 * Apply hierarchical layout to nodes and edges using dagre
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns Object containing nodes with updated positions
 */
function applyHierarchicalLayout(nodes: Node[], edges: Edge[]): { nodes: Node[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 80 });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90, // Center the node (width / 2)
          y: nodeWithPosition.y - 40, // Center the node (height / 2)
        },
      };
    }),
  };
}

/**
 * Apply grid layout to nodes
 *
 * @param nodes - Array of nodes
 * @returns Object containing nodes with updated positions
 */
function applyGridLayout(nodes: Node[]): { nodes: Node[] } {
  const nodeCount = nodes.length;
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const spacing = 250;

  return {
    nodes: nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...node,
        position: {
          x: col * spacing,
          y: row * spacing,
        },
      };
    }),
  };
}

/**
 * Apply circular layout to nodes
 *
 * @param nodes - Array of nodes
 * @returns Object containing nodes with updated positions
 */
function applyCircularLayout(nodes: Node[]): { nodes: Node[] } {
  const nodeCount = nodes.length;
  const radius = Math.max(nodeCount * 30, 200);
  const angleStep = (2 * Math.PI) / nodeCount;

  return {
    nodes: nodes.map((node, index) => {
      const angle = index * angleStep;
      return {
        ...node,
        position: {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        },
      };
    }),
  };
}

/**
 * Apply force-directed layout to nodes
 * This is a simplified implementation that places nodes in a grid
 * with some randomness to simulate a force-directed layout
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns Object containing nodes with updated positions
 */
function applyForceDirectedLayout(nodes: Node[], edges: Edge[]): { nodes: Node[] } {
  // For simplicity, we'll use a grid layout with some randomness
  const nodeCount = nodes.length;
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const spacing = 250;

  return {
    nodes: nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...node,
        position: {
          x: col * spacing + (Math.random() - 0.5) * 100,
          y: row * spacing + (Math.random() - 0.5) * 100,
        },
      };
    }),
  };
}

export default VisualizationLayout;