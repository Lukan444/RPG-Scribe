# Mind Map Implementation

## Overview

This document outlines the implementation of the Mind Map visualization component for the RPG Archivist Web application. The Mind Map is a key feature that allows users to visualize the relationships between entities in their RPG campaigns.

## Implementation Details

### 1. Visualization Libraries

We have implemented multiple visualization approaches to provide flexibility and robustness:

#### ReactFlow

- Used for the Network Graph and Hierarchy Tree visualizations
- Provides a flexible and interactive graph visualization
- Supports custom node and edge styling
- Includes built-in features like zooming, panning, and minimap
- Encountered issues with d3-zoom dependency (selection.interrupt is not a function)
- Created a ReactFlowWrapper component to patch the d3-zoom issue

#### Cytoscape.js

- Implemented as a more robust alternative to ReactFlow
- Powerful graph theory library with extensive visualization capabilities
- Supports multiple layout algorithms (force-directed, hierarchical, etc.)
- Includes built-in features for graph analysis and manipulation
- More stable and mature than ReactFlow
- Added as a new tab in the Mind Map page

#### SimpleMindMap

- A basic implementation using Material UI components
- Provides a simple, non-interactive visualization
- Serves as a fallback option if other visualizations fail

### 2. Graph Data Model

The graph data model is consistent across all visualization implementations:

```typescript
interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  properties?: Record<string, any>;
  imageUrl?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  properties?: Record<string, any>;
}
```

### 3. Integration with Neo4j

The Mind Map visualizations are integrated with Neo4j through the following components:

- **GraphService**: Provides methods for fetching graph data from the backend
- **GraphRepository**: Handles the actual Neo4j queries and data transformation
- **Neo4jGraphRepository**: Implements the GraphRepository interface for Neo4j

### 4. Features

The Mind Map visualizations include the following features:

- **Filtering**: Filter nodes and edges by type
- **Layouts**: Choose from multiple layout algorithms
- **Zooming and Panning**: Navigate the graph
- **Node Selection**: Click on nodes to view details
- **Edge Selection**: Click on edges to view details
- **Export**: Export the graph as an image
- **Refresh**: Refresh the graph layout

## Usage

The Mind Map is accessible from the Mind Map page, which includes tabs for different visualization options:

1. **Network Graph**: A force-directed graph visualization using ReactFlow
2. **Hierarchy Tree**: A hierarchical tree visualization using ReactFlow
3. **Simple Mind Map**: A basic visualization using Material UI
4. **Cytoscape Mind Map**: A robust visualization using Cytoscape.js

## Next Steps

1. **Performance Optimization**: Optimize the graph rendering for large datasets
2. **Advanced Filtering**: Add more advanced filtering options
3. **Graph Analysis**: Add graph analysis features (centrality, clustering, etc.)
4. **Custom Styling**: Allow users to customize the appearance of nodes and edges
5. **Saved Views**: Allow users to save and load custom graph views
