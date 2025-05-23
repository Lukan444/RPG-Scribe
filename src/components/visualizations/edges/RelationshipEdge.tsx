import { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { Text } from '@mantine/core';
import { RelationshipType } from '../../../models/Relationship';

/**
 * RelationshipEdge component - Custom edge for relationships in visualizations
 */
export const RelationshipEdge = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Format relationship type for display
  const formatRelationshipType = (type: RelationshipType) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: getRelationshipColor(data?.type),
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={100}
        height={40}
        x={labelX - 50}
        y={labelY - 20}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            background: 'white',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 500,
            border: '1px solid #eee',
            textAlign: 'center',
            pointerEvents: 'all',
          }}
        >
          {data?.type ? formatRelationshipType(data.type) : 'Related to'}
        </div>
      </foreignObject>
    </>
  );
});

/**
 * Get color for relationship type
 */
function getRelationshipColor(type?: RelationshipType): string {
  switch (type) {
    case RelationshipType.OWNS:
      return '#ff9800';
    case RelationshipType.PART_OF:
      return '#2196f3';
    case RelationshipType.LOCATED_AT:
      return '#4caf50';
    case RelationshipType.RELATED_TO:
      return '#9c27b0';
    case RelationshipType.PARTICIPATED_IN:
      return '#f44336';
    case RelationshipType.OCCURRED_AT:
      return '#795548';
    case RelationshipType.CREATED:
      return '#00bcd4';
    case RelationshipType.RELATED_TO:
      return '#607d8b';
    default:
      return '#999';
  }
}
