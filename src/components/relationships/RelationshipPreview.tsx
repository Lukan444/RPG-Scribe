import React from 'react';
import { Paper, Group, Avatar, Text, Stack, Badge } from '@mantine/core';
import { EntityRelationship } from '../../services/entityRelationships.service';

interface RelationshipPreviewProps {
  relationships: EntityRelationship[];
  entityId: string;
  title?: string;
}

/**
 * RelationshipPreview - Display a list of related entities with avatars and type badges.
 */
export const RelationshipPreview: React.FC<RelationshipPreviewProps> = ({
  relationships,
  entityId,
  title = 'Relationships'
}) => {
  return (
    <Paper withBorder shadow="sm" p="md">
      <Stack gap="sm">
        <Text fw={500}>{title}</Text>
        {relationships.length === 0 ? (
          <Text size="sm" c="dimmed">
            No relationships found
          </Text>
        ) : (
          relationships.map((rel) => {
            const other = rel.source.id === entityId ? rel.target : rel.source;
            return (
              <Group key={rel.id} gap="sm">
                <Avatar src={other.imageURL} radius="xl" size="sm" />
                <div>
                  <Text size="sm">{other.name}</Text>
                  <Badge color="gray" size="xs">
                    {other.type}
                  </Badge>
                </div>
              </Group>
            );
          })
        )}
      </Stack>
    </Paper>
  );
};

export default RelationshipPreview;
