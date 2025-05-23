import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Tabs,
  Accordion,
  Group,
  Text,
  Button,
  ActionIcon,
  Menu,
  Divider,
  Badge,
  Loader,
  Alert,
  Box,
  Switch,
  ThemeIcon
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconRefresh,
  IconAlertCircle,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconBrain
} from '@tabler/icons-react';
import { EntityType, RelationshipService } from '../../services/relationship.service';
import { useHotkeys } from '@mantine/hooks';
import { getKeyboardShortcutsHelp } from '../../utils/accessibility';

interface RelationshipManagementProps {
  entityId: string;
  entityType: EntityType;
  worldId: string;
  campaignId: string;
}

/**
 * RelationshipManagement component - Manages entity relationships
 */
export function RelationshipManagement({
  entityId,
  entityType,
  worldId,
  campaignId
}: RelationshipManagementProps) {
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(false);

  // Initialize service
  const relationshipService = RelationshipService.getInstance(worldId, campaignId);

  // Load relationships
  const loadRelationships = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all relationships for the entity
      const allRelationships = await relationshipService.getAllEntityRelationships(
        entityId,
        entityType
      );

      setRelationships(allRelationships);
    } catch (err: any) {
      setError(err.message || 'Failed to load relationships');
      console.error('Error loading relationships:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load relationships on component mount
  useEffect(() => {
    loadRelationships();
  }, [entityId, entityType, worldId, campaignId]);

  // Register keyboard shortcuts
  useHotkeys([
    ['r', () => loadRelationships()],
    ['n', () => document.querySelector<HTMLButtonElement>('[data-add-relationship]')?.click()],
    ['f', () => document.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`)?.focus()]
  ]);

  // Define the type for the enhanced relationship
  interface EnhancedRelationship {
    id: string;
    sourceId: string;
    sourceType: EntityType;
    targetId: string;
    targetType: EntityType;
    relationshipType: string;
    description: string;
    strength: string;
    status: string;
    relatedEntityId: string;
    relatedEntityType: string;
    [key: string]: any;
  }

  // Group relationships by entity type
  const groupedRelationships = relationships.reduce((acc, rel) => {
    // Determine the related entity type and ID
    const relatedEntityType = rel.sourceId === entityId ? rel.targetType : rel.sourceType;
    const relatedEntityId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;

    // Initialize the group if it doesn't exist
    if (!acc[relatedEntityType]) {
      acc[relatedEntityType] = [];
    }

    // Add the relationship to the group
    acc[relatedEntityType].push({
      ...rel,
      relatedEntityId,
      relatedEntityType
    });

    return acc;
  }, {} as Record<string, EnhancedRelationship[]>);

  // Get icon for entity type
  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'character': return <IconUsers size={16} />;
      case 'location': return <IconMap size={16} />;
      case 'item': return <IconSword size={16} />;
      case 'event': return <IconCalendarEvent size={16} />;
      default: return null;
    }
  };

  // Get color for entity type
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'character': return 'teal';
      case 'location': return 'blue';
      case 'item': return 'yellow';
      case 'event': return 'violet';
      default: return 'gray';
    }
  };

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>Relationships</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={loadRelationships}
            loading={loading}
            aria-label="Refresh relationships"
          >
            Refresh
          </Button>
          <Menu position="bottom-end" withArrow>
            <Menu.Target>
              <Button
                leftSection={<IconPlus size={16} />}
                data-add-relationship
                aria-label="Add new relationship"
              >
                Add Relationship
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Add relationship with:</Menu.Label>
              <Menu.Item leftSection={<IconUsers size={16} />}>Character</Menu.Item>
              <Menu.Item leftSection={<IconMap size={16} />}>Location</Menu.Item>
              <Menu.Item leftSection={<IconSword size={16} />}>Item</Menu.Item>
              <Menu.Item leftSection={<IconCalendarEvent size={16} />}>Event</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)} mb="md">
        <Tabs.List aria-label="Filter relationships by entity type">
          <Tabs.Tab
            value="all"
            data-tab="all"
            aria-label="Show all relationships"
          >
            All
          </Tabs.Tab>
          <Tabs.Tab
            value="character"
            data-tab="character"
            aria-label="Show character relationships"
          >
            Characters
          </Tabs.Tab>
          <Tabs.Tab
            value="location"
            data-tab="location"
            aria-label="Show location relationships"
          >
            Locations
          </Tabs.Tab>
          <Tabs.Tab
            value="item"
            data-tab="item"
            aria-label="Show item relationships"
          >
            Items
          </Tabs.Tab>
          <Tabs.Tab
            value="event"
            data-tab="event"
            aria-label="Show event relationships"
          >
            Events
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {loading ? (
        <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader size="lg" />
        </Box>
      ) : relationships.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No relationships found. Create relationships to see them here.
        </Text>
      ) : (
        <Accordion multiple aria-label="Relationships grouped by entity type">
          {(Object.entries(groupedRelationships) as [string, EnhancedRelationship[]][])
            .filter(([type]) => activeTab === 'all' || type === activeTab)
            .map(([type, rels]) => (
              <Accordion.Item
                key={type}
                value={type}
                aria-label={`${type.charAt(0).toUpperCase() + type.slice(1)}s (${rels.length})`}
              >
                <Accordion.Control icon={getEntityTypeIcon(type)}>
                  <Group>
                    <Text>{type.charAt(0).toUpperCase() + type.slice(1)}s</Text>
                    <Badge color={getEntityTypeColor(type)}>{rels.length}</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {rels.map((rel: EnhancedRelationship) => (
                    <Box key={rel.id} mb="sm" p="sm" style={{ border: '1px solid #eee', borderRadius: '4px' }}>
                      <Group justify="space-between" mb="xs">
                        <Text fw={500}>{rel.description}</Text>
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            aria-label="Edit relationship"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            aria-label="Delete relationship"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Group gap="xs">
                        <Badge color={getEntityTypeColor(rel.relatedEntityType)}>
                          {rel.relatedEntityType}
                        </Badge>
                        <Badge color="gray" variant="outline">
                          {rel.relationshipType}
                        </Badge>
                        <Badge color="blue" variant="outline">
                          {rel.strength}
                        </Badge>
                      </Group>
                    </Box>
                  ))}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
        </Accordion>
      )}

      <Divider my="md" />

      {/* AI Suggestion Feature Preparation */}
      <Paper
        withBorder
        p="md"
        bg="rgba(0, 120, 223, 0.05)"
        radius="md"
        aria-labelledby="ai-suggestions-title"
        role="region"
      >
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon size="lg" radius="md" color="blue.6">
              <IconBrain size={20} />
            </ThemeIcon>
            <Title order={4} id="ai-suggestions-title">AI Relationship Suggestions</Title>
          </Group>
          <Switch
            label="Enable AI Suggestions"
            checked={aiSuggestionsEnabled}
            onChange={(event) => setAiSuggestionsEnabled(event.currentTarget.checked)}
            disabled={true}
            aria-label="Enable AI relationship suggestions (coming soon)"
          />
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          AI will analyze your campaign data and suggest potential relationships between entities.
          This feature is coming soon.
        </Text>

        <Box py="md" style={{ border: '1px dashed #ccc', borderRadius: '4px', padding: '16px' }}>
          <Text ta="center" c="dimmed" fs="italic">
            AI Relationship Suggestions (Coming Soon)
          </Text>
        </Box>

        <Group mt="md" justify="flex-end">
          <Button.Group>
            <Button variant="outline" color="red" disabled>
              <IconTrash size={16} />
              Reject
            </Button>
            <Button variant="outline" color="green" disabled>
              <IconPlus size={16} />
              Accept
            </Button>
          </Button.Group>
        </Group>
      </Paper>
    </Paper>
  );
}
