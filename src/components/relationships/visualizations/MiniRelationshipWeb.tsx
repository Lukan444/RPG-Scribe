import React, { useEffect, useRef } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';

export interface MiniRelationshipWebNode {
  id: string;
  name: string;
  type?: string;
  color?: string;
}

export interface MiniRelationshipWebLink {
  source: string;
  target: string;
  color?: string;
}

interface MiniRelationshipWebProps {
  nodes: MiniRelationshipWebNode[];
  links: MiniRelationshipWebLink[];
  width?: number;
  height?: number;
}

/**
 * MiniRelationshipWeb - Compact force-directed relationship graph.
 */
export const MiniRelationshipWeb: React.FC<MiniRelationshipWebProps> = ({
  nodes,
  links,
  width = 300,
  height = 300
}) => {
  const ref = useRef<ForceGraphMethods>();

  useEffect(() => {
    if (ref.current) {
      ref.current.d3Force('charge')?.strength(-120);
      ref.current.d3Force('link')?.distance(60);
    }
  }, [nodes, links]);

  return (
    <ForceGraph2D
      ref={ref}
      width={width}
      height={height}
      graphData={{ nodes, links }}
      nodeId="id"
      nodeLabel="name"
      nodeRelSize={4}
      linkColor={(link: any) => link.color || '#bbb'}
      nodeColor={(node: any) => node.color || '#1c7ed6'}
      aria-label="Mini Relationship Web"
    />
  );
};

export default MiniRelationshipWeb;
