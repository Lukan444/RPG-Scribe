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
  Paper,
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
  SegmentedControl,
  Badge
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
  IconUser,
  IconMapPin,
  IconSword,
  IconCalendarEvent,
  IconNotes,
  IconUsers,
  IconTimeline
} from '@tabler/icons-react';
import { RelationshipType } from '../../models/Relationship';
import { EntityType } from '../../models/EntityType';
import { RelationshipService, Relationship } from '../../services/relationship.service';
import { EntityType as ServiceEntityType } from '../../services/relationship.service';
import { CharacterService } from '../../services/character.service';
import { LocationService } from '../../services/location.service';
import { ItemService } from '../../services/item.service';
import { EventService } from '../../services/event.service';
import { transformRelationshipsToReactFlow, EntityData, getRelationshipColor } from '../../utils/relationshipUtils';
import { convertToServiceEntityType, convertToModelEntityType, getEntityTypeName, getEntityTypeColor } from '../../utils/entityTypeConverter';

// Import custom node components
import { CharacterNode } from './nodes/CharacterNode';
import { LocationNode } from './nodes/LocationNode';
import { ItemNode } from './nodes/ItemNode';
import { EventNode } from './nodes/EventNode';
import { NoteNode } from './nodes/NoteNode';
import { FactionNode } from './nodes/FactionNode';
import { SessionNode } from './nodes/SessionNode';

// Import custom edge components
import { RelationshipEdge } from './edges/RelationshipEdge';

/**
 * Relationship web visualization props
 */
interface RelationshipWebVisualizationProps {
  entityId?: string;
  entityType?: EntityType;
  worldId?: string;
  campaignId?: string;
  title?: string;
  description?: string;
  height?: number | string;
  width?: number | string;
  onNodeClick?: (nodeId: string, nodeType: EntityType) => void;
  onEdgeClick?: (edgeId: string) => void;
  maxDepth?: number;
}

/**
 * RelationshipWebVisualization component - Interactive relationship web visualization
 *
 * Displays a network visualization of relationships between entities in a campaign.
 * Fetches real relationship data from Firestore using the RelationshipService.
 * Supports filtering by entity type and relationship type, as well as different layout algorithms.
 *
 * @param entityId - Optional ID of the central entity to visualize
 * @param entityType - Optional type of the central entity
 * @param worldId - ID of the world (required if entityId is not provided)
 * @param campaignId - ID of the campaign (required if entityId is not provided)
 * @param title - Title of the visualization
 * @param description - Description of the visualization
 * @param height - Height of the visualization container
 * @param width - Width of the visualization container
 * @param onNodeClick - Callback function when a node is clicked
 * @param onEdgeClick - Callback function when an edge is clicked
 * @param maxDepth - Maximum depth of relationships to display (default: 1)
 */
export function RelationshipWebVisualization({
  entityId,
  entityType,
  worldId = 'default-world',
  campaignId = 'default-campaign',
  title = 'Relationship Web',
  description,
  height = 600,
  width = '100%',
  onNodeClick,
  onEdgeClick,
  maxDepth = 1
}: RelationshipWebVisualizationProps) {
  const navigate = useNavigate();

  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // State for loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [centralEntity, setCentralEntity] = useState<EntityData | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [entityDataMap, setEntityDataMap] = useState<Record<string, EntityData>>({});

  // State for filters
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string[]>([]);
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState<string>('all');
  const [layoutType, setLayoutType] = useState<string>('force');

  // Define custom node types
  const nodeTypes: NodeTypes = {
    character: CharacterNode,
    location: LocationNode,
    item: ItemNode,
    event: EventNode,
    note: NoteNode,
    faction: FactionNode,
    session: SessionNode
  };

  // Define custom edge types
  const edgeTypes: EdgeTypes = {
    relationship: RelationshipEdge
  };

  /**
   * Fetch entity data based on entity type and ID
   *
   * @param entityId - Entity ID
   * @param entityType - Entity type
   * @param worldId - World ID
   * @param campaignId - Campaign ID
   * @returns Entity data or null if not found
   */
  const fetchEntityData = useCallback(async (
    entityId: string,
    entityType: ServiceEntityType,
    worldId: string,
    campaignId: string
  ): Promise<EntityData | undefined> => {
    // Convert from service EntityType to model EntityType
    let modelEntityType: EntityType;

    try {
      // Use the utility function to convert between EntityType implementations
      modelEntityType = convertToModelEntityType(entityType);
    } catch (error) {
      console.warn(`Unsupported entity type: ${entityType}`);
      return undefined;
    }

    try {
      switch (modelEntityType) {
        case EntityType.CHARACTER:
          const characterService = CharacterService.getInstance(worldId, campaignId);
          const character = await characterService.getEntity(entityId);
          if (character) {
            return {
              id: character.id!,
              name: character.name || 'Unknown Character',
              type: modelEntityType,
              imageURL: character.imageURL,
              description: character.description
            };
          }
          break;
        case EntityType.LOCATION:
          const locationService = LocationService.getInstance(worldId, campaignId);
          const location = await locationService.getEntity(entityId);
          if (location) {
            return {
              id: location.id!,
              name: location.name,
              type: modelEntityType,
              imageURL: location.imageURL,
              description: location.description
            };
          }
          break;
        case EntityType.ITEM:
          const itemService = ItemService.getInstance(worldId, campaignId);
          const item = await itemService.getEntity(entityId);
          if (item) {
            return {
              id: item.id!,
              name: item.name,
              type: modelEntityType,
              imageURL: item.imageURL,
              description: item.description
            };
          }
          break;
        case EntityType.EVENT:
          const eventService = EventService.getInstance(worldId, campaignId);
          const event = await eventService.getEntity(entityId);
          if (event) {
            return {
              id: event.id!,
              name: event.name,
              type: modelEntityType,
              imageURL: event.imageURL,
              description: event.description
            };
          }
          break;
        // Add other entity types as needed
      }
      return undefined;
    } catch (error) {
      console.error(`Error fetching entity data for ${entityType} ${entityId}:`, error);
      return undefined;
    }
  }, []);

  /**
   * Process relationships and update the visualization
   *
   * @param relationships - Array of relationships
   * @param centralEntityData - Optional central entity data
   */
  const processRelationships = useCallback(async (
    relationships: Relationship[],
    centralEntityData?: EntityData
  ) => {
    try {
      // Build entity data map for related entities
      const entityMap: Record<string, EntityData> = { ...entityDataMap };

      // Helper function to add entity to map
      const addEntityToMap = (id: string, serviceType: ServiceEntityType) => {
        if (!entityMap[id] && id !== entityId) {
          try {
            // Convert from service EntityType to model EntityType using the utility function
            const type = convertToModelEntityType(serviceType);

            entityMap[id] = {
              id,
              name: 'Loading...',
              type
            };
          } catch (error) {
            console.warn(`Unsupported entity type: ${serviceType}`);
            return;
          }
        }
      };

      // Add all related entities to the map
      for (const relationship of relationships) {
        addEntityToMap(relationship.sourceId, relationship.sourceType);
        addEntityToMap(relationship.targetId, relationship.targetType);
      }

      // Fetch entity data for all related entities
      const entityIds = Object.keys(entityMap).filter(id =>
        entityMap[id].name === 'Loading...'
      );

      // Batch fetch entities by type
      const characterIds = entityIds.filter(id =>
        entityMap[id].type === EntityType.CHARACTER
      );
      const locationIds = entityIds.filter(id =>
        entityMap[id].type === EntityType.LOCATION
      );
      const itemIds = entityIds.filter(id =>
        entityMap[id].type === EntityType.ITEM
      );
      const eventIds = entityIds.filter(id =>
        entityMap[id].type === EntityType.EVENT
      );

      // Fetch characters
      if (characterIds.length > 0) {
        const characterService = CharacterService.getInstance(worldId, campaignId);
        for (const id of characterIds) {
          try {
            const character = await characterService.getEntity(id);
            if (character) {
              entityMap[id] = {
                id: character.id!,
                name: character.name || 'Unknown Character',
                type: EntityType.CHARACTER,
                imageURL: character.imageURL,
                description: character.description
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch character ${id}:`, err);
          }
        }
      }

      // Fetch locations
      if (locationIds.length > 0) {
        const locationService = LocationService.getInstance(worldId, campaignId);
        for (const id of locationIds) {
          try {
            const location = await locationService.getEntity(id);
            if (location) {
              entityMap[id] = {
                id: location.id!,
                name: location.name,
                type: EntityType.LOCATION,
                imageURL: location.imageURL,
                description: location.description
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch location ${id}:`, err);
          }
        }
      }

      // Fetch items
      if (itemIds.length > 0) {
        const itemService = ItemService.getInstance(worldId, campaignId);
        for (const id of itemIds) {
          try {
            const item = await itemService.getEntity(id);
            if (item) {
              entityMap[id] = {
                id: item.id!,
                name: item.name,
                type: EntityType.ITEM,
                imageURL: item.imageURL,
                description: item.description
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch item ${id}:`, err);
          }
        }
      }

      // Fetch events
      if (eventIds.length > 0) {
        const eventService = EventService.getInstance(worldId, campaignId);
        for (const id of eventIds) {
          try {
            const event = await eventService.getEntity(id);
            if (event) {
              entityMap[id] = {
                id: event.id!,
                name: event.name,
                type: EntityType.EVENT,
                imageURL: event.imageURL,
                description: event.description
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch event ${id}:`, err);
          }
        }
      }

      // Add other entity types as needed

      setEntityDataMap(entityMap);

      // Transform relationships to ReactFlow format
      const { nodes: flowNodes, edges: flowEdges } = transformRelationshipsToReactFlow(
        relationships,
        centralEntityData,
        entityMap
      );

      // Apply layout to nodes
      const { nodes: layoutedNodes } = VisualizationLayout.applyLayout(flowNodes, flowEdges, layoutType);

      setNodes(layoutedNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error processing relationships:', error);
      setError('Failed to process relationship data');
    }
  }, [entityId, worldId, campaignId, entityDataMap, layoutType]);

  // Load relationship web data with real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadRelationshipWebData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize services
        const relationshipService = RelationshipService.getInstance(worldId, campaignId);

        // If we have an entity ID and type, fetch the central entity data
        let centralEntityData: EntityData | undefined = undefined;
        if (entityId && entityType) {
          // Convert EntityType from model to service format
          const serviceEntityType = convertToServiceEntityType(entityType);
          centralEntityData = await fetchEntityData(entityId, serviceEntityType, worldId, campaignId);

          if (!centralEntityData) {
            throw new Error(`Entity not found: ${entityId}`);
          }

          setCentralEntity(centralEntityData);
        }

        // Set up real-time listener for relationships
        if (entityId && entityType) {
          // Convert EntityType from model to service format
          const serviceEntityType = convertToServiceEntityType(entityType);
          // Listen for relationships for the specific entity
          unsubscribe = relationshipService.subscribeToEntityRelationships(
            entityId,
            serviceEntityType,
            (relationships) => {
              setRelationships(relationships);
              processRelationships(relationships, centralEntityData);
              setLoading(false);
            },
            (error) => {
              console.error('Error in relationship subscription:', error);
              setError('Failed to subscribe to relationship updates');
              setLoading(false);
            }
          );
        } else {
          // Listen for all relationships in the campaign
          unsubscribe = relationshipService.subscribeToAllRelationships(
            (relationships) => {
              setRelationships(relationships);
              processRelationships(relationships, centralEntityData);
              setLoading(false);
            },
            (error) => {
              console.error('Error in relationship subscription:', error);
              setError('Failed to subscribe to relationship updates');
              setLoading(false);
            }
          );
        }
      } catch (err) {
        console.error('Error loading relationship web data:', err);
        setError('Failed to load relationship web data');
        setLoading(false);
      }
    };

    loadRelationshipWebData();

    // Clean up subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [entityId, entityType, worldId, campaignId, fetchEntityData, processRelationships]);

  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data.type);
    } else {
      // Navigate to entity detail page
      const type = node.data.type.toLowerCase();
      navigate(`/${type}s/${node.id}`);
    }
  }, [navigate, onNodeClick]);

  // Handle edge click
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (onEdgeClick) {
      onEdgeClick(edge.id);
    }
  }, [onEdgeClick]);

  // Filter nodes and edges based on selected filters
  const filteredNodes = nodeTypeFilter.length > 0
    ? nodes.filter((node: Node) => nodeTypeFilter.includes(node.data.type))
    : nodes;

  const filteredEdges = relationshipTypeFilter.length > 0
    ? edges.filter((edge: Edge) => relationshipTypeFilter.includes(edge.data.type))
    : edges;

  // Apply focus mode
  const focusedElements = () => {
    if (focusMode === 'all' || !entityId) {
      return { nodes: filteredNodes, edges: filteredEdges };
    }

    // Get connected nodes
    const connectedEdges = filteredEdges.filter(
      (edge: Edge) => edge.source === entityId || edge.target === entityId
    );

    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(entityId);

    connectedEdges.forEach((edge: Edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const connectedNodes = filteredNodes.filter((node: Node) => connectedNodeIds.has(node.id));

    return { nodes: connectedNodes, edges: connectedEdges };
  };

  const { nodes: displayedNodes, edges: displayedEdges } = focusedElements();

  // Node type filter options
  const nodeTypeOptions = Object.values(EntityType).map(type => ({
    value: type,
    label: type.charAt(0) + type.slice(1).toLowerCase()
  }));

  // Relationship type filter options
  const relationshipTypeOptions = Object.values(RelationshipType).map(type => ({
    value: type,
    label: type.replace('_', ' ')
  }));

  // Layout options
  const layoutOptions = [
    { value: 'force', label: 'Force' },
    { value: 'dagre', label: 'Hierarchical' },
    { value: 'grid', label: 'Grid' },
    { value: 'circular', label: 'Circular' }
  ];

  // Focus mode options
  const focusModeOptions = [
    { value: 'all', label: 'All Relationships' },
    { value: 'direct', label: 'Direct Relationships' }
  ];

  // Create header controls
  const headerControls = (
    <Group>
      <Select
        placeholder="Layout"
        data={layoutOptions}
        value={layoutType}
        onChange={(value) => setLayoutType(value || 'force')}
        leftSection={<IconLayoutGrid size={16} />}
        w={150}
        comboboxProps={{ withinPortal: true }}
      />

      <SegmentedControl
        data={focusModeOptions}
        value={focusMode}
        onChange={setFocusMode}
        color="blue"
      />
    </Group>
  );

  // Create filter controls
  const filterControls = (
    <Group>
      <MultiSelect
        placeholder="Filter Entities"
        data={nodeTypeOptions}
        value={nodeTypeFilter}
        onChange={setNodeTypeFilter}
        leftSection={<IconFilter size={16} />}
        w={200}
        comboboxProps={{ withinPortal: true }}
      />

      <MultiSelect
        placeholder="Filter Relationships"
        data={relationshipTypeOptions}
        value={relationshipTypeFilter}
        onChange={setRelationshipTypeFilter}
        leftSection={<IconFilter size={16} />}
        w={250}
        comboboxProps={{ withinPortal: true }}
      />
    </Group>
  );

  // Combine controls
  const controls = (
    <Stack gap="md">
      {headerControls}
      {filterControls}
    </Stack>
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
          nodes={displayedNodes}
          edges={displayedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.2}
          maxZoom={4}
        >
          <Controls />
          <MiniMap />
          <Background />

          <Panel position="top-right">
            <Group>
              <Tooltip label="Zoom In">
                <ActionIcon variant="light" color="blue">
                  <IconZoomIn size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Zoom Out">
                <ActionIcon variant="light" color="blue">
                  <IconZoomOut size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Fit View">
                <ActionIcon variant="light" color="blue">
                  <IconFocus size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Refresh">
                <ActionIcon variant="light" color="blue">
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Export">
                <ActionIcon variant="light" color="blue">
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Panel>

          <Panel position="bottom-left">
            <Paper p="xs" withBorder shadow="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <Group>
                <Group gap={5}>
                  <IconUser size={16} color="#4ecdc4" />
                  <Text size="xs" fw={500}>Character</Text>
                </Group>

                <Group gap={5}>
                  <IconMapPin size={16} color="#ffcb77" />
                  <Text size="xs" fw={500}>Location</Text>
                </Group>

                <Group gap={5}>
                  <IconSword size={16} color="#ff6b6b" />
                  <Text size="xs" fw={500}>Item</Text>
                </Group>

                <Group gap={5}>
                  <IconCalendarEvent size={16} color="#c77dff" />
                  <Text size="xs" fw={500}>Event</Text>
                </Group>
              </Group>
            </Paper>
          </Panel>
        </ReactFlow>
      </Box>
    </VisualizationLayout>
  );
}
