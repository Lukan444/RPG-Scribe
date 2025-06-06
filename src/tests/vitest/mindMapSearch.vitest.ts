import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import { EntityType } from '../../models/EntityType';
import { RelationshipType } from '../../models/Relationship';
import { filterMindMapElements } from '../../components/visualizations/MindMapVisualization';

const nodes: Node[] = [
  {
    id: '1',
    type: 'character',
    data: { label: 'Alice', type: EntityType.CHARACTER },
    position: { x: 0, y: 0 }
  },
  {
    id: '2',
    type: 'location',
    data: { label: 'Town', type: EntityType.LOCATION },
    position: { x: 0, y: 0 }
  }
];

const edges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'relationship',
    data: { type: RelationshipType.CONTAINS }
  }
];

describe('MindMap search filtering', () => {
  it('filters nodes based on search query', () => {
    const { nodes: n, edges: e } = filterMindMapElements(nodes, edges, [], [], 'alice');
    expect(n).toHaveLength(1);
    expect(n[0].id).toBe('1');
    expect(e).toHaveLength(0);
  });

  it('returns all nodes when query is empty', () => {
    const { nodes: n, edges: e } = filterMindMapElements(nodes, edges, [], [], '');
    expect(n).toHaveLength(2);
    expect(e).toHaveLength(1);
  });
});
