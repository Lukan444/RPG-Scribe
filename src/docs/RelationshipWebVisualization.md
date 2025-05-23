# RelationshipWebVisualization Component

The `RelationshipWebVisualization` component is a powerful visualization tool for displaying relationships between entities in your RPG campaign. It provides an interactive graph visualization that allows users to explore the connections between characters, locations, items, events, and other entities.

## Features

- **Real-time Data**: Connects to Firestore to fetch and display real relationship data
- **Interactive Visualization**: Users can click on nodes to navigate to entity details
- **Filtering**: Filter by entity type or relationship type
- **Layout Options**: Choose from different layout algorithms (force-directed, hierarchical, grid, circular)
- **Focus Mode**: Focus on direct relationships or view all relationships
- **Responsive Design**: Works on desktop and mobile devices

## Usage

```tsx
import { RelationshipWebVisualization } from '../components/visualizations/RelationshipWebVisualization';

// Display relationships for a specific entity
<RelationshipWebVisualization
  entityId="character-123"
  entityType={EntityType.CHARACTER}
  worldId="world-456"
  campaignId="campaign-789"
  title="Character Relationships"
  description="Visualize relationships for this character"
  height={600}
  width="100%"
/>

// Display all relationships in a campaign
<RelationshipWebVisualization
  worldId="world-456"
  campaignId="campaign-789"
  title="Campaign Relationships"
  description="Visualize all relationships in this campaign"
  height={600}
  width="100%"
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `entityId` | `string` | Optional ID of the central entity to visualize |
| `entityType` | `EntityType` | Optional type of the central entity |
| `worldId` | `string` | ID of the world (required if entityId is not provided) |
| `campaignId` | `string` | ID of the campaign (required if entityId is not provided) |
| `title` | `string` | Title of the visualization |
| `description` | `string` | Description of the visualization |
| `height` | `number \| string` | Height of the visualization container |
| `width` | `number \| string` | Width of the visualization container |
| `onNodeClick` | `(nodeId: string, nodeType: EntityType) => void` | Callback function when a node is clicked |
| `onEdgeClick` | `(edgeId: string) => void` | Callback function when an edge is clicked |
| `maxDepth` | `number` | Maximum depth of relationships to display (default: 1) |

## Data Flow

1. The component initializes and fetches the central entity data (if provided)
2. It sets up a real-time listener for relationships using Firestore's `onSnapshot`
3. When relationships are received, it fetches data for all related entities
4. The relationship and entity data is transformed into ReactFlow nodes and edges
5. The nodes are positioned using the selected layout algorithm
6. The visualization is rendered with the positioned nodes and edges
7. When relationships change in Firestore, the visualization updates automatically

## Performance Considerations

- The component uses pagination to limit the number of relationships fetched at once
- Entity data is cached to reduce redundant Firestore reads
- The component only fetches data for entities that are not already in the cache
- Layout calculations are optimized to handle large numbers of nodes and edges

## Customization

The component can be customized by:

- Changing the layout algorithm
- Filtering by entity type or relationship type
- Focusing on direct relationships
- Providing custom node click and edge click handlers

## Dependencies

- ReactFlow: For the graph visualization
- Mantine: For UI components
- Firebase/Firestore: For data fetching and real-time updates
- Dagre: For hierarchical layout algorithm
