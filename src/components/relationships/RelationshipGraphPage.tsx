import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Button,
  Select,
  Checkbox,
  Slider,
  ColorSwatch,
  ActionIcon,
  Collapse,
  Paper,
  Divider,
  Badge,
  Skeleton,
  useMantineTheme
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/Campaign';
import { EntityRelationshipsService } from '../../services/entityRelationships.service';
import { EntityType } from '../../models/EntityType';
import { RelationshipVisualizationService, VisualizationGraph } from '../../services/relationshipVisualization.service';
import {
  IconSettings,
  IconRefresh,
  IconDownload,
  IconZoomIn,
  IconZoomOut,
  IconFocus,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * Relationship Graph Page component
 */
const RelationshipGraphPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const theme = useMantineTheme();
  const graphRef = useRef<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [graphData, setGraphData] = useState<VisualizationGraph>({ nodes: [], edges: [] });
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<EntityType[]>([
    EntityType.CHARACTER,
    EntityType.LOCATION,
    EntityType.ITEM,
    EntityType.EVENT
  ]);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>([
    'character-character',
    'character-location',
    'character-item',
    'location-location'
  ]);
  const [focusedNode, setFocusedNode] = useState<any | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [graphSettings, setGraphSettings] = useState({
    nodeSize: 8,
    linkWidth: 1.5,
    chargeStrength: -100,
    linkDistance: 100
  });

  // Services
  const campaignService = new CampaignService();

  // Load campaign and relationship data
  useEffect(() => {
    const loadData = async () => {
      if (!campaignId || !user) return;

      setLoading(true);

      try {
        // Load campaign
        const campaignData = await campaignService.getById(campaignId);

        if (!campaignData) {
          return;
        }

        setCampaign(campaignData);

        // Load relationship graph data
        const visualizationService = new RelationshipVisualizationService(campaignId);
        const graphData = await visualizationService.getVisualizationData(
          [], // All entities
          selectedEntityTypes.map(type => type.toString())
        );

        // Filter by relationship types
        if (selectedRelationshipTypes.length > 0) {
          graphData.edges = graphData.edges.filter(edge =>
            selectedRelationshipTypes.includes(edge.type)
          );

          // Only include nodes that have edges
          const nodeIds = new Set<string>();
          graphData.edges.forEach(edge => {
            nodeIds.add(edge.source);
            nodeIds.add(edge.target);
          });

          graphData.nodes = graphData.nodes.filter(node => nodeIds.has(node.id));
        }

        setGraphData(graphData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [campaignId, user, selectedEntityTypes, selectedRelationshipTypes]);

  // Handle entity type selection
  const handleEntityTypeChange = (type: EntityType) => {
    if (selectedEntityTypes.includes(type)) {
      setSelectedEntityTypes(selectedEntityTypes.filter(t => t !== type));
    } else {
      setSelectedEntityTypes([...selectedEntityTypes, type]);
    }
  };

  // Handle relationship type selection
  const handleRelationshipTypeChange = (type: string) => {
    if (selectedRelationshipTypes.includes(type)) {
      setSelectedRelationshipTypes(selectedRelationshipTypes.filter(t => t !== type));
    } else {
      setSelectedRelationshipTypes([...selectedRelationshipTypes, type]);
    }
  };

  // Handle node click
  const handleNodeClick = (node: any) => {
    setFocusedNode(node);

    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.5, 500);
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.5, 500);
    }
  };

  // Handle reset view
  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(500);
    }
  };

  // Handle download graph as image
  const handleDownloadImage = () => {
    if (graphRef.current) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${campaign?.name}-relationships.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  // Refresh graph data
  const refreshGraph = async () => {
    if (!campaignId) return;

    setLoading(true);

    try {
      const visualizationService = new RelationshipVisualizationService(campaignId);
      const graphData = await visualizationService.getVisualizationData(
        [], // All entities
        selectedEntityTypes.map(type => type.toString())
      );

      // Filter by relationship types
      if (selectedRelationshipTypes.length > 0) {
        graphData.edges = graphData.edges.filter(edge =>
          selectedRelationshipTypes.includes(edge.type)
        );

        // Only include nodes that have edges
        const nodeIds = new Set<string>();
        graphData.edges.forEach(edge => {
          nodeIds.add(edge.source);
          nodeIds.add(edge.target);
        });

        graphData.nodes = graphData.nodes.filter(node => nodeIds.has(node.id));
      }

      setGraphData(graphData);
    } catch (error) {
      console.error('Error refreshing graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading && !graphData.nodes.length) {
    return (
      <Container size="xl" py="xl">
        <Skeleton height={50} width="50%" mb="xl" />
        <Skeleton height={600} />
      </Container>
    );
  }

  // Prepare graph data for ForceGraph2D
  const graphDataFormatted = {
    nodes: graphData.nodes.map(node => ({
      ...node,
      id: node.id,
      name: node.label,
      val: graphSettings.nodeSize * (node.size || 1) / 10
    })),
    links: graphData.edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target,
      value: graphSettings.linkWidth * (edge.width || 1)
    }))
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Text size="sm" color="dimmed" mb="xs">
            <Link to={`/campaigns/${campaignId}`}>{campaign?.name}</Link> / Relationships
          </Text>
          <Title order={1}>Relationship Graph</Title>
        </div>

        <Group>
          <Button
            variant={settingsOpen ? "filled" : "outline"}
            leftSection={<IconSettings size={16} />}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            Settings
          </Button>

          <Button
            variant="outline"
            leftSection={<IconRefresh size={16} />}
            onClick={refreshGraph}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <Collapse in={settingsOpen}>
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Graph Settings</Title>
            <ActionIcon onClick={() => setSettingsOpen(false)}>
              <IconChevronUp size={16} />
            </ActionIcon>
          </Group>

          <Group align="start" gap="xl">
            <div style={{ flex: 1 }}>
              <Title order={4} mb="sm">Entity Types</Title>
              <Group mb="md">
                {Object.values(EntityType).map(type => (
                  <Checkbox
                    key={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    checked={selectedEntityTypes.includes(type)}
                    onChange={() => handleEntityTypeChange(type)}
                  />
                ))}
              </Group>

              <Title order={4} mb="sm">Relationship Types</Title>
              <Group mb="md">
                {[
                  'character-character',
                  'character-location',
                  'character-item',
                  'character-event',
                  'location-location',
                  'location-item',
                  'event-location',
                  'event-session'
                ].map(type => (
                  <Checkbox
                    key={type}
                    label={type}
                    checked={selectedRelationshipTypes.includes(type)}
                    onChange={() => handleRelationshipTypeChange(type)}
                  />
                ))}
              </Group>
            </div>

            <Divider orientation="vertical" />

            <div style={{ flex: 1 }}>
              <Title order={4} mb="sm">Appearance</Title>

              <Text size="sm" mb="xs">Node Size</Text>
              <Slider
                min={1}
                max={20}
                step={1}
                value={graphSettings.nodeSize}
                onChange={(value) => setGraphSettings({...graphSettings, nodeSize: value})}
                mb="md"
              />

              <Text size="sm" mb="xs">Link Width</Text>
              <Slider
                min={0.5}
                max={5}
                step={0.5}
                value={graphSettings.linkWidth}
                onChange={(value) => setGraphSettings({...graphSettings, linkWidth: value})}
                mb="md"
              />

              <Text size="sm" mb="xs">Charge Strength</Text>
              <Slider
                min={-500}
                max={0}
                step={10}
                value={graphSettings.chargeStrength}
                onChange={(value) => setGraphSettings({...graphSettings, chargeStrength: value})}
                mb="md"
              />

              <Text size="sm" mb="xs">Link Distance</Text>
              <Slider
                min={10}
                max={300}
                step={10}
                value={graphSettings.linkDistance}
                onChange={(value) => setGraphSettings({...graphSettings, linkDistance: value})}
                mb="md"
              />
            </div>
          </Group>
        </Card>
      </Collapse>

      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon size="lg" variant="filled" color="blue" onClick={handleZoomIn}>
            <IconZoomIn size={16} />
          </ActionIcon>
          <ActionIcon size="lg" variant="filled" color="blue" onClick={handleZoomOut}>
            <IconZoomOut size={16} />
          </ActionIcon>
          <ActionIcon size="lg" variant="filled" color="blue" onClick={handleResetView}>
            <IconFocus size={16} />
          </ActionIcon>
        </Group>

        <ActionIcon size="lg" variant="filled" color="green" onClick={handleDownloadImage}>
          <IconDownload size={16} />
        </ActionIcon>
      </Group>

      <div style={{ display: 'flex', height: '70vh' }}>
        <div style={{ flex: 3, position: 'relative' }}>
          <Card shadow="sm" style={{ height: '100%', overflow: 'hidden' }} padding={0} radius="md" withBorder>
            {graphDataFormatted.nodes.length > 0 ? (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphDataFormatted}
                nodeLabel="name"
                nodeColor={(node: any) => node.color || theme.colors.blue[6]}
                nodeRelSize={graphSettings.nodeSize}
                linkWidth={(link: any) => link.value}
                linkColor={(link: any) => link.color || theme.colors.gray[6]}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={0.8}
                linkCurvature={0.25}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.1}
                // d3Force props removed as they're not supported in this version
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => {
                  if (graphRef.current) {
                    graphRef.current.zoomToFit(500);
                  }
                }}
                width={window.innerWidth * 0.6}
                height={window.innerHeight * 0.7}
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Text color="dimmed">No relationships to display</Text>
              </div>
            )}
          </Card>
        </div>

        <div style={{ flex: 1, marginLeft: '1rem' }}>
          <Card shadow="sm" style={{ height: '100%', overflow: 'auto' }} padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">Details</Title>

            {focusedNode ? (
              <>
                <Title order={4}>{focusedNode.name}</Title>
                <Badge color={
                  focusedNode.type === 'character' ? 'blue' :
                  focusedNode.type === 'location' ? 'green' :
                  focusedNode.type === 'item' ? 'amber' :
                  focusedNode.type === 'event' ? 'orange' :
                  focusedNode.type === 'session' ? 'violet' : 'gray'
                } mb="md">
                  {focusedNode.type}
                </Badge>

                <Text size="sm" mb="md">
                  <Button
                    component={Link}
                    to={`/campaigns/${campaignId}/${focusedNode.type}s/${focusedNode.id}`}
                    variant="subtle"
                    size="xs"
                  >
                    View Details
                  </Button>
                </Text>

                <Divider my="md" />

                <Title order={5} mb="sm">Relationships</Title>

                {graphDataFormatted.links
                  .filter((link: any) => link.source === focusedNode.id || link.target === focusedNode.id)
                  .map((link: any, index: number) => {
                    const isSource = link.source === focusedNode.id;
                    const otherNode = isSource
                      ? graphDataFormatted.nodes.find((n: any) => n.id === link.target)
                      : graphDataFormatted.nodes.find((n: any) => n.id === link.source);

                    return (
                      <Paper key={index} shadow="xs" p="sm" withBorder mb="sm">
                        <Group justify="space-between">
                          <div>
                            <Text size="sm" fw={500}>{otherNode?.name}</Text>
                            <Text size="xs" color="dimmed">{otherNode?.type}</Text>
                          </div>
                          <Badge color="blue">{link.type}</Badge>
                        </Group>
                        {link.label && (
                          <Text size="xs" mt="xs">{link.label}</Text>
                        )}
                      </Paper>
                    );
                  })}

                {graphDataFormatted.links
                  .filter((link: any) => link.source === focusedNode.id || link.target === focusedNode.id)
                  .length === 0 && (
                  <Text color="dimmed" size="sm">No relationships found</Text>
                )}
              </>
            ) : (
              <Text color="dimmed">Select a node to view details</Text>
            )}
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default RelationshipGraphPage;
