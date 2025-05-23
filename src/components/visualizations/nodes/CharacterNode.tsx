import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Avatar, Group } from '@mantine/core';
import { EntityType } from '../../../models/Relationship';

/**
 * CharacterNode component - Custom node for character entities in visualizations
 */
export const CharacterNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <Box
      style={{
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        width: '180px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <Group>
        <Avatar
          src={data.imageUrl}
          alt={data.label}
          radius="xl"
          size="md"
        />
        <Box>
          <Text fw={500} size="sm" truncate>
            {data.label}
          </Text>
          <Text size="xs" c="dimmed">
            Character
          </Text>
        </Box>
      </Group>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </Box>
  );
});
