import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Group,
  Button,
  Select,
  MultiSelect,
  Slider,
  ActionIcon,
  Tooltip,
  Text,
  Stack,
  Loader,
  Center,
  TextInput,
  Paper
} from '@mantine/core';
import { VisualizationLayout } from './layout';
import {
  IconZoomIn,
  IconZoomOut,
  IconFocus,
  IconRefresh,
  IconDownload,
  IconFilter,
  IconLayoutGrid,
  IconSearch,
  IconBrain,
  IconAlertCircle
} from '@tabler/icons-react';
import { RelationshipType } from '../../models/Relationship';
import { EntityType } from '../../models/EntityType';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

// Define data interfaces
interface CharacterData extends DocumentData {
  id: string;
  name: string;
  imageURL?: string;
  campaignId: string;
}

interface LocationData extends DocumentData {
  id: string;
  name: string;
  imageURL?: string;
  campaignId: string;
}

// Import custom node components
import { CharacterNode } from './nodes/CharacterNode';
import { LocationNode } from './nodes/LocationNode';
import { ItemNode } from './nodes/ItemNode';
import { EventNode } from './nodes/EventNode';
import { CampaignNode } from './nodes/CampaignNode';
import { SessionNode } from './nodes/SessionNode';
import { NoteNode } from './nodes/NoteNode';

// Import custom edge components
import { RelationshipEdge } from './edges/RelationshipEdge';

/**
 * Mind map visualization props
 */
interface MindMapVisualizationProps {
  campaignId?: string;
  entityId?: string;
  entityType?: EntityType;
  title?: string;
  description?: string;
  height?: number | string;
  width?: number | string;
  onNodeClick?: (nodeId: string, nodeType: EntityType) => void;
  onEdgeClick?: (edgeId: string) => void;
}

/**
 * MindMapVisualization component - Interactive mind map visualization
 */
export function MindMapVisualization({
  campaignId,
  entityId,
  entityType,
  title = 'Mind Map',
  description,
  height = 600,
  width = '100%'
}: MindMapVisualizationProps) {
  const navigate = useNavigate();

  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // State for loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string[]>([]);
  const [edgeTypeFilter, setEdgeTypeFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Define custom node types (memoized to prevent React Flow performance warnings)
  const nodeTypes: NodeTypes = useMemo(() => ({
    character: CharacterNode,
    location: LocationNode,
    item: ItemNode,
    event: EventNode,
    campaign: CampaignNode,
    session: SessionNode,
    note: NoteNode
  }), []);

  // Define custom edge types (memoized to prevent React Flow performance warnings)
  const edgeTypes: EdgeTypes = useMemo(() => ({
    relationship: RelationshipEdge
  }), []);

  // Node type filter options
  const nodeTypeOptions = Object.values(EntityType).map(type => ({
    value: type,
    label: type.charAt(0) + type.slice(1).toLowerCase()
  }));

  // Edge type filter options
  const edgeTypeOptions = Object.values(RelationshipType).map(type => ({
    value: type,
    label: type.replace('_', ' ')
  }));

  // Search filter
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  }, []);

  // Load mind map data
  useEffect(() => {
    const loadMindMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!campaignId) {
          setError('No campaign selected');
          setLoading(false);
          return;
        }

        // Import Firebase modules
        const { db } = await import('../../firebase/config');
        const {
          collection,
          getDocs,
          query,
          where,
          doc,
          getDoc
        } = await import('firebase/firestore');



        // Fetch campaign data
        const campaignRef = doc(db, 'campaigns', campaignId);
        const campaignSnap = await getDoc(campaignRef);

        if (!campaignSnap.exists()) {
          setError('Campaign not found');
          setLoading(false);
          return;
        }

        // Define campaign data with proper type
        interface CampaignData {
          id: string;
          name: string;
          imageURL?: string;
          [key: string]: any; // For other DocumentData properties
        }

        const campaignData = {
          id: campaignSnap.id,
          ...campaignSnap.data()
        } as CampaignData;

        // Create campaign node
        const nodes: Node[] = [
          {
            id: campaignId,
            type: 'campaign',
            data: {
              label: campaignData.name,
              type: EntityType.CAMPAIGN,
              imageUrl: campaignData.imageURL || 'https://placehold.co/100x100?text=Campaign'
            },
            position: { x: 0, y: 0 }
          }
        ];

        const edges: Edge[] = [];

        // Fetch characters
        const charactersRef = collection(db, 'characters');
        const charactersQuery = query(charactersRef, where('campaignId', '==', campaignId));
        const charactersSnap = await getDocs(charactersQuery);

        // Add character nodes and edges
        charactersSnap.forEach((characterDoc) => {
          const index = charactersSnap.docs.indexOf(characterDoc);
          const characterData: CharacterData = {
            id: characterDoc.id,
            ...characterDoc.data() as DocumentData
          } as CharacterData;
          const angle = (index * (2 * Math.PI / charactersSnap.size));
          const radius = 200;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          nodes.push({
            id: characterDoc.id,
            type: 'character',
            data: {
              label: characterData.name,
              type: EntityType.CHARACTER,
              imageUrl: characterData.imageURL || 'https://placehold.co/100x100?text=Character'
            },
            position: { x, y }
          });

          edges.push({
            id: `edge-campaign-character-${index}`,
            source: campaignId,
            target: characterDoc.id,
            type: 'relationship',
            data: { type: RelationshipType.PART_OF },
            markerEnd: {
              type: MarkerType.ArrowClosed
            }
          });
        });

        // Fetch locations
        const locationsRef = collection(db, 'locations');
        const locationsQuery = query(locationsRef, where('campaignId', '==', campaignId));
        const locationsSnap = await getDocs(locationsQuery);

        // Add location nodes and edges
        locationsSnap.forEach((locationDoc) => {
          const index = locationsSnap.docs.indexOf(locationDoc);
          const locationData: LocationData = {
            id: locationDoc.id,
            ...locationDoc.data() as DocumentData
          } as LocationData;
          const angle = (index * (2 * Math.PI / locationsSnap.size)) + Math.PI; // Offset by 180 degrees
          const radius = 200;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          nodes.push({
            id: locationDoc.id,
            type: 'location',
            data: {
              label: locationData.name,
              type: EntityType.LOCATION,
              imageUrl: locationData.imageURL || 'https://placehold.co/100x100?text=Location'
            },
            position: { x, y }
          });

          edges.push({
            id: `edge-campaign-location-${index}`,
            source: campaignId,
            target: locationDoc.id,
            type: 'relationship',
            data: { type: RelationshipType.CONTAINS },
            markerEnd: {
              type: MarkerType.ArrowClosed
            }
          });
        });

        // If no data was found, use mock data for demonstration
        if (nodes.length <= 1) {
          nodes.push(
            {
              id: 'character-demo',
              type: 'character',
              data: {
                label: 'Demo Character',
                type: EntityType.CHARACTER,
                imageUrl: 'https://placehold.co/100x100?text=Character'
              },
              position: { x: -200, y: 100 }
            },
            {
              id: 'location-demo',
              type: 'location',
              data: {
                label: 'Demo Location',
                type: EntityType.LOCATION,
                imageUrl: 'https://placehold.co/100x100?text=Location'
              },
              position: { x: 200, y: 100 }
            }
          );

          edges.push(
            {
              id: 'edge-demo-1',
              source: campaignId,
              target: 'character-demo',
              type: 'relationship',
              data: { type: RelationshipType.PART_OF },
              markerEnd: {
                type: MarkerType.ArrowClosed
              }
            },
            {
              id: 'edge-demo-2',
              source: campaignId,
              target: 'location-demo',
              type: 'relationship',
              data: { type: RelationshipType.CONTAINS },
              markerEnd: {
                type: MarkerType.ArrowClosed
              }
            }
          );
        }

        setNodes(nodes);
        setEdges(edges);
      } catch (err) {
        console.error('Error loading mind map data:', err);
        setError('Failed to load mind map data: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadMindMapData();
  }, [campaignId, entityId, entityType]);

  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Navigate to entity detail page
    const type = node.data.type.toLowerCase();
    navigate(`/${type}s/${node.id}`);
  }, [navigate]);

  // Filter nodes and edges based on selected filters
  const filteredNodes = nodeTypeFilter.length > 0
    ? nodes.filter((node: Node) => nodeTypeFilter.includes(node.data.type))
    : nodes;

  const filteredEdges = edgeTypeFilter.length > 0
    ? edges.filter((edge: Edge) => edgeTypeFilter.includes(edge.data.type))
    : edges;

  // Use Mantine's useMediaQuery hook for responsive design
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  // Create controls component
  const controls = (
    <>
      {/* Controls for desktop */}
      {!isMobile && (
        <Group wrap="nowrap" gap="md">
          <TextInput
            placeholder="Search entities..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.currentTarget.value)}
            w={isTablet ? 150 : 200}
          />

          <MultiSelect
            placeholder="Filter by entity type"
            data={nodeTypeOptions}
            value={nodeTypeFilter}
            onChange={setNodeTypeFilter}
            clearable
            w={isTablet ? 150 : 200}
            comboboxProps={{ withinPortal: true }}
          />

          <MultiSelect
            placeholder="Filter by relationship"
            data={edgeTypeOptions}
            value={edgeTypeFilter}
            onChange={setEdgeTypeFilter}
            clearable
            w={isTablet ? 150 : 200}
            comboboxProps={{ withinPortal: true }}
          />
        </Group>
      )}

      {/* Controls for mobile */}
      {isMobile && (
        <Stack gap="xs">
          <TextInput
            placeholder="Search entities..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.currentTarget.value)}
            w="100%"
          />

          <Group grow gap="xs">
            <MultiSelect
              placeholder="Filter entities"
              data={nodeTypeOptions}
              value={nodeTypeFilter}
              onChange={setNodeTypeFilter}
              clearable
              comboboxProps={{ withinPortal: true }}
            />

            <MultiSelect
              placeholder="Filter relationships"
              data={edgeTypeOptions}
              value={edgeTypeFilter}
              onChange={setEdgeTypeFilter}
              clearable
              comboboxProps={{ withinPortal: true }}
            />
          </Group>
        </Stack>
      )}
    </>
  );

  return (
    <VisualizationLayout
      title={title}
      description={description}
      loading={loading}
      error={error}
      height={height}
      width={width}
      controls={controls}
      onRetry={() => window.location.reload()}
    >
      <Box h="100%" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={4}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          attributionPosition="bottom-left"
        >
          <Controls showInteractive={!isMobile} />
          {!isMobile && <MiniMap />}
          <Background />

          <Panel position="top-right">
            <Paper p="xs" withBorder shadow="sm" radius="sm">
              <Text size="xs" c="dimmed" fw={500}>
                Click on a node to view details
              </Text>
            </Paper>
          </Panel>
        </ReactFlow>
      </Box>
    </VisualizationLayout>
  );
}
