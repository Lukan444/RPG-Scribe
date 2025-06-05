/**
 * Visual Relationship Mapping Component
 * 
 * Renders connection lines and visual indicators for event relationships
 * across different entity rows in the timeline.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Group, Text, Tooltip, ActionIcon, Badge } from '@mantine/core';
import { IconArrowRight, IconArrowsLeftRight, IconCircleDot, IconEye, IconEyeOff } from '@tabler/icons-react';
import { EventRelationship, RelationshipType } from '../../types/timelineConflict.types';
import { RPGTimelineAction } from '../../adapters/timelineEditorAdapter';

/**
 * Relationship Line Props
 */
interface RelationshipLineProps {
  relationship: EventRelationship;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  visible: boolean;
  highlighted: boolean;
  onHover: (relationship: EventRelationship | null) => void;
  onClick: (relationship: EventRelationship) => void;
}

/**
 * Visual Relationship Mapping Props
 */
interface VisualRelationshipMappingProps {
  relationships: EventRelationship[];
  actions: RPGTimelineAction[];
  timelineContainer: HTMLElement | null;
  visible: boolean;
  highlightedEventId?: string;
  onRelationshipHover: (relationship: EventRelationship | null) => void;
  onRelationshipClick: (relationship: EventRelationship) => void;
}

/**
 * Relationship Line Component
 */
function RelationshipLine({
  relationship,
  sourcePosition,
  targetPosition,
  visible,
  highlighted,
  onHover,
  onClick
}: RelationshipLineProps) {
  const lineRef = useRef<SVGLineElement>(null);

  const lineStyle = useMemo(() => {
    const baseStyle = {
      stroke: getRelationshipColor(relationship.type),
      strokeWidth: highlighted ? 3 : Math.max(1, relationship.strength * 3),
      strokeOpacity: visible ? (highlighted ? 1 : 0.6) : 0,
      strokeDasharray: getRelationshipDashArray(relationship.type),
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };

    return baseStyle;
  }, [relationship, visible, highlighted]);

  const handleMouseEnter = useCallback(() => {
    onHover(relationship);
  }, [relationship, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick(relationship);
  }, [relationship, onClick]);

  if (!visible) return null;

  return (
    <g>
      <line
        ref={lineRef}
        x1={sourcePosition.x}
        y1={sourcePosition.y}
        x2={targetPosition.x}
        y2={targetPosition.y}
        style={lineStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      
      {/* Arrow marker for directional relationships */}
      {isDirectionalRelationship(relationship.type) && (
        <polygon
          points={getArrowPoints(sourcePosition, targetPosition)}
          fill={getRelationshipColor(relationship.type)}
          opacity={visible ? (highlighted ? 1 : 0.6) : 0}
          style={{ transition: 'all 0.3s ease' }}
        />
      )}
      
      {/* Relationship strength indicator */}
      {highlighted && (
        <circle
          cx={(sourcePosition.x + targetPosition.x) / 2}
          cy={(sourcePosition.y + targetPosition.y) / 2}
          r={4}
          fill={getRelationshipColor(relationship.type)}
          opacity={0.8}
        />
      )}
    </g>
  );
}

/**
 * Visual Relationship Mapping Component
 */
export function VisualRelationshipMapping({
  relationships,
  actions,
  timelineContainer,
  visible,
  highlightedEventId,
  onRelationshipHover,
  onRelationshipClick
}: VisualRelationshipMappingProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [actionPositions, setActionPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredRelationship, setHoveredRelationship] = useState<EventRelationship | null>(null);

  // Update action positions when timeline changes
  useEffect(() => {
    if (!timelineContainer || !visible) return;

    const updatePositions = () => {
      const newPositions = new Map<string, { x: number; y: number }>();
      
      actions.forEach(action => {
        // Find the DOM element for this action
        const actionElement = timelineContainer.querySelector(`[data-action-id="${action.id}"]`);
        if (actionElement) {
          const rect = actionElement.getBoundingClientRect();
          const containerRect = timelineContainer.getBoundingClientRect();
          
          newPositions.set(action.rpgEventId, {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
          });
        }
      });

      setActionPositions(newPositions);
    };

    updatePositions();

    // Update positions on scroll or resize
    const handleUpdate = () => updatePositions();
    timelineContainer.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    return () => {
      timelineContainer.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [timelineContainer, actions, visible]);

  // Filter relationships based on highlighted event
  const visibleRelationships = useMemo(() => {
    if (!highlightedEventId) return relationships;
    
    return relationships.filter(rel => 
      rel.sourceEventId === highlightedEventId || 
      rel.targetEventId === highlightedEventId
    );
  }, [relationships, highlightedEventId]);

  const handleRelationshipHover = useCallback((relationship: EventRelationship | null) => {
    setHoveredRelationship(relationship);
    onRelationshipHover(relationship);
  }, [onRelationshipHover]);

  if (!visible || !timelineContainer) return null;

  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 10
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'auto'
        }}
      >
        <defs>
          {/* Arrow markers for different relationship types */}
          <marker
            id="arrow-causes"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#e74c3c" />
          </marker>
          <marker
            id="arrow-enables"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#2ecc71" />
          </marker>
          <marker
            id="arrow-blocks"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#f39c12" />
          </marker>
        </defs>

        {visibleRelationships.map(relationship => {
          const sourcePos = actionPositions.get(relationship.sourceEventId);
          const targetPos = actionPositions.get(relationship.targetEventId);

          if (!sourcePos || !targetPos) return null;

          const isHighlighted = Boolean(hoveredRelationship?.id === relationship.id ||
                               (highlightedEventId &&
                                (relationship.sourceEventId === highlightedEventId ||
                                 relationship.targetEventId === highlightedEventId)));

          return (
            <RelationshipLine
              key={relationship.id}
              relationship={relationship}
              sourcePosition={sourcePos}
              targetPosition={targetPos}
              visible={visible}
              highlighted={isHighlighted}
              onHover={handleRelationshipHover}
              onClick={onRelationshipClick}
            />
          );
        })}
      </svg>

      {/* Relationship tooltip */}
      {hoveredRelationship && (
        <Tooltip
          label={
            <Box>
              <Text size="sm" fw={500}>
                {getRelationshipTypeLabel(hoveredRelationship.type)}
              </Text>
              <Text size="xs" c="dimmed">
                Strength: {Math.round(hoveredRelationship.strength * 100)}%
              </Text>
              {hoveredRelationship.description && (
                <Text size="xs" mt="xs">
                  {hoveredRelationship.description}
                </Text>
              )}
            </Box>
          }
          opened={true}
          position="top"
        >
          <Box />
        </Tooltip>
      )}
    </Box>
  );
}

/**
 * Get relationship color based on type
 */
function getRelationshipColor(type: RelationshipType): string {
  const colors = {
    [RelationshipType.CAUSES]: '#e74c3c',
    [RelationshipType.ENABLES]: '#2ecc71',
    [RelationshipType.BLOCKS]: '#f39c12',
    [RelationshipType.REQUIRES]: '#9b59b6',
    [RelationshipType.RELATED_TO]: '#3498db',
    [RelationshipType.FOLLOWS]: '#1abc9c',
    [RelationshipType.PRECEDES]: '#34495e',
    [RelationshipType.CONCURRENT]: '#95a5a6'
  };

  return colors[type] || '#95a5a6';
}

/**
 * Get relationship dash array for line styling
 */
function getRelationshipDashArray(type: RelationshipType): string {
  const patterns = {
    [RelationshipType.CAUSES]: 'none',
    [RelationshipType.ENABLES]: 'none',
    [RelationshipType.BLOCKS]: '5,5',
    [RelationshipType.REQUIRES]: '10,5',
    [RelationshipType.RELATED_TO]: '2,3',
    [RelationshipType.FOLLOWS]: 'none',
    [RelationshipType.PRECEDES]: 'none',
    [RelationshipType.CONCURRENT]: '1,2'
  };

  return patterns[type] || 'none';
}

/**
 * Check if relationship type is directional
 */
function isDirectionalRelationship(type: RelationshipType): boolean {
  return [
    RelationshipType.CAUSES,
    RelationshipType.ENABLES,
    RelationshipType.BLOCKS,
    RelationshipType.REQUIRES,
    RelationshipType.FOLLOWS,
    RelationshipType.PRECEDES
  ].includes(type);
}

/**
 * Get arrow points for directional relationships
 */
function getArrowPoints(source: { x: number; y: number }, target: { x: number; y: number }): string {
  const angle = Math.atan2(target.y - source.y, target.x - source.x);
  const arrowLength = 8;
  const arrowWidth = 4;

  const x1 = target.x - arrowLength * Math.cos(angle - Math.PI / 6);
  const y1 = target.y - arrowLength * Math.sin(angle - Math.PI / 6);
  const x2 = target.x - arrowLength * Math.cos(angle + Math.PI / 6);
  const y2 = target.y - arrowLength * Math.sin(angle + Math.PI / 6);

  return `${target.x},${target.y} ${x1},${y1} ${x2},${y2}`;
}

/**
 * Get relationship type label
 */
function getRelationshipTypeLabel(type: RelationshipType): string {
  const labels = {
    [RelationshipType.CAUSES]: 'Causes',
    [RelationshipType.ENABLES]: 'Enables',
    [RelationshipType.BLOCKS]: 'Blocks',
    [RelationshipType.REQUIRES]: 'Requires',
    [RelationshipType.RELATED_TO]: 'Related To',
    [RelationshipType.FOLLOWS]: 'Follows',
    [RelationshipType.PRECEDES]: 'Precedes',
    [RelationshipType.CONCURRENT]: 'Concurrent'
  };

  return labels[type] || 'Unknown';
}

export default VisualRelationshipMapping;
