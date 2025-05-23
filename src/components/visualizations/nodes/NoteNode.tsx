import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Avatar, Group } from '@mantine/core';
import { IconNote } from '@tabler/icons-react';
import { EntityType } from '../../../models/Relationship';

/**
 * NoteNode component - Custom node for note entities in visualizations
 */
export const NoteNode = memo(({ data, isConnectable }: NodeProps) => {
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
        {data.imageUrl ? (
          <Avatar
            src={data.imageUrl}
            alt={data.label}
            radius="xl"
            size="md"
          />
        ) : (
          <Avatar color="yellow" radius="xl" size="md">
            <IconNote size={20} />
          </Avatar>
        )}
        <Box>
          <Text fw={500} size="sm" truncate>
            {data.label}
          </Text>
          <Text size="xs" c="dimmed">
            Note
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
