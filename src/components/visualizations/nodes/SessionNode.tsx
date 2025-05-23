import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Avatar, Group } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { EntityType } from '../../../models/Relationship';

/**
 * SessionNode component - Custom node for session entities in visualizations
 */
export const SessionNode = memo(({ data, isConnectable }: NodeProps) => {
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
          <Avatar color="violet" radius="xl" size="md">
            <IconClock size={20} />
          </Avatar>
        )}
        <Box>
          <Text fw={500} size="sm" truncate>
            {data.label}
          </Text>
          <Text size="xs" c="dimmed">
            Session
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
