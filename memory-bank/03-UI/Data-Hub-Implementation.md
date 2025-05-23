# Data Hub Implementation with Mantine

## Overview

This document outlines the implementation plan for the Data Hub module of the RPG Archivist application using Mantine. The Data Hub is the central repository for all campaign data, organized in a hierarchical tree structure with an integrated editor.

## Component Architecture

The Data Hub consists of the following main components:

1. **DataHubLayout**: The overall layout of the Data Hub module
2. **TreeView**: A hierarchical tree view of all entities
3. **EntityList**: A list of entities filtered by the selected tree node
4. **EntityEditor**: An editor for the selected entity
5. **EntityContext**: A context provider for managing the selected entity

### Component Hierarchy

```
DataHubLayout
├── TreeView
│   └── TreeItem (recursive)
├── EntityList
│   └── EntityCard
└── EntityEditor
    ├── EntityForm
    ├── RelationshipManager
    ├── NotesEditor
    └── ImageGallery
```

## Data Hub Layout

The Data Hub layout uses Mantine's `Grid` component to create a responsive layout that adapts to different screen sizes.

### Implementation

```tsx
// src/pages/DataHub/DataHubLayout.tsx
import { useState } from 'react';
import { Grid, Paper, useMantineTheme } from '@mantine/core';
import TreeView from './TreeView';
import EntityList from './EntityList';
import EntityEditor from './EntityEditor';
import { EntityProvider } from '../../contexts/EntityContext';

function DataHubLayout() {
  const theme = useMantineTheme();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  return (
    <EntityProvider>
      <Grid gutter="md" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Tree View - Hidden on mobile */}
        <Grid.Col span={{ base: 12, sm: 4, md: 3 }} style={{ height: '100%' }} visibleFrom="sm">
          <Paper
            p="md"
            withBorder
            style={{
              height: '100%',
              backgroundColor: theme.colors.dark[6],
              overflow: 'auto',
            }}
          >
            <TreeView
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
            />
          </Paper>
        </Grid.Col>

        {/* Entity List */}
        <Grid.Col span={{ base: 12, sm: 8, md: 4 }} style={{ height: '100%' }}>
          <Paper
            p="md"
            withBorder
            style={{
              height: '100%',
              backgroundColor: theme.colors.dark[6],
              overflow: 'auto',
            }}
          >
            <EntityList
              nodeId={selectedNodeId}
              selectedEntityId={selectedEntityId}
              onEntitySelect={setSelectedEntityId}
            />
          </Paper>
        </Grid.Col>

        {/* Entity Editor - Hidden on mobile and small tablets */}
        <Grid.Col span={{ base: 12, md: 5 }} style={{ height: '100%' }} visibleFrom="md">
          <Paper
            p="md"
            withBorder
            style={{
              height: '100%',
              backgroundColor: theme.colors.dark[6],
              overflow: 'auto',
            }}
          >
            <EntityEditor entityId={selectedEntityId} />
          </Paper>
        </Grid.Col>
      </Grid>
    </EntityProvider>
  );
}

export default DataHubLayout;
```

## Tree View Component

The Tree View component displays a hierarchical tree of entities. It uses a recursive structure to render nested tree items.

### Implementation

```tsx
// src/pages/DataHub/TreeView.tsx
import { useState } from 'react';
import { Text, Stack, Group, UnstyledButton, Box, Collapse, ActionIcon } from '@mantine/core';
import { IconChevronRight, IconChevronDown, IconFolder, IconFile } from '@tabler/icons-react';

interface TreeItemProps {
  id: string;
  label: string;
  children?: TreeItemProps[];
  level: number;
  selectedNodeId: string | null;
  onNodeSelect: (id: string) => void;
}

function TreeItem({ id, label, children, level, selectedNodeId, onNodeSelect }: TreeItemProps) {
  const [opened, setOpened] = useState(false);
  const hasChildren = children && children.length > 0;
  const isSelected = id === selectedNodeId;

  return (
    <Box>
      <UnstyledButton
        onClick={() => {
          onNodeSelect(id);
          if (hasChildren) {
            setOpened((o) => !o);
          }
        }}
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          paddingLeft: `${level * 20 + theme.spacing.md}px`,
          borderRadius: theme.radius.sm,
          color: isSelected ? theme.white : theme.colors.dark[0],
          backgroundColor: isSelected ? theme.colors.teal[6] : 'transparent',
          '&:hover': {
            backgroundColor: isSelected ? theme.colors.teal[7] : theme.colors.dark[5],
          },
        })}
      >
        <Group noWrap>
          {hasChildren ? (
            <ActionIcon variant="transparent" color="gray" size="sm">
              {opened ? <IconChevronDown size="1rem" /> : <IconChevronRight size="1rem" />}
            </ActionIcon>
          ) : (
            <Box ml="sm" />
          )}
          {hasChildren ? <IconFolder size="1rem" /> : <IconFile size="1rem" />}
          <Text size="sm">{label}</Text>
        </Group>
      </UnstyledButton>

      {hasChildren && (
        <Collapse in={opened}>
          {children.map((item) => (
            <TreeItem
              key={item.id}
              {...item}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

interface TreeViewProps {
  selectedNodeId: string | null;
  onNodeSelect: (id: string) => void;
}

function TreeView({ selectedNodeId, onNodeSelect }: TreeViewProps) {
  // Mock data - replace with actual data from API
  const treeData = [
    {
      id: 'worlds',
      label: 'Worlds',
      children: [
        {
          id: 'locations',
          label: 'Locations',
          children: [],
        },
        {
          id: 'factions',
          label: 'Factions / Organizations',
          children: [],
        },
        {
          id: 'items',
          label: 'Items',
          children: [],
        },
        {
          id: 'campaigns',
          label: 'Campaigns',
          children: [
            {
              id: 'sessions',
              label: 'Sessions',
              children: [
                {
                  id: 'events',
                  label: 'Events / Notes',
                  children: [],
                },
                {
                  id: 'transcripts',
                  label: 'Transcripts',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'characters',
      label: 'Characters',
      children: [
        {
          id: 'inventory',
          label: 'Inventory',
          children: [],
        },
        {
          id: 'powers',
          label: 'Powers / Abilities',
          children: [],
        },
        {
          id: 'statblock',
          label: 'Stat-block / Levels',
          children: [],
        },
        {
          id: 'relationships',
          label: 'Relationships',
          children: [],
        },
      ],
    },
  ];

  return (
    <Stack spacing="xs">
      <Text size="sm" fw={500} c="dimmed" mb="xs">
        DATA HIERARCHY
      </Text>
      
      {treeData.map((item) => (
        <TreeItem
          key={item.id}
          {...item}
          level={0}
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
        />
      ))}
    </Stack>
  );
}

export default TreeView;
```

## Entity List Component

The Entity List component displays a list of entities filtered by the selected tree node.

### Implementation

```tsx
// src/pages/DataHub/EntityList.tsx
import { useState } from 'react';
import { Stack, TextInput, Group, Select, Text, Button } from '@mantine/core';
import { IconSearch, IconPlus, IconFilter } from '@tabler/icons-react';
import EntityCard from './EntityCard';

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl?: string;
}

interface EntityListProps {
  nodeId: string | null;
  selectedEntityId: string | null;
  onEntitySelect: (id: string) => void;
}

function EntityList({ nodeId, selectedEntityId, onEntitySelect }: EntityListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Mock data - replace with actual data from API
  const entities: Entity[] = [
    {
      id: '1',
      name: 'Elara Moonwhisper',
      type: 'character',
      description: 'An elven sorceress with a mysterious past.',
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      name: 'Thorne Blackwood',
      type: 'character',
      description: 'A gruff human ranger with a heart of gold.',
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '3',
      name: 'Shadowvale',
      type: 'location',
      description: 'A dark forest shrouded in perpetual twilight.',
      imageUrl: 'https://via.placeholder.com/150',
    },
  ];

  // Filter entities based on search query and filter
  const filteredEntities = entities.filter((entity) => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || entity.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Stack spacing="md">
      <Group position="apart">
        <Text size="lg" fw={700}>
          {nodeId ? nodeId.charAt(0).toUpperCase() + nodeId.slice(1) : 'All Entities'}
        </Text>
        <Button leftIcon={<IconPlus size="1rem" />} size="sm">
          Add New
        </Button>
      </Group>

      <Group grow>
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size="1rem" />}
        />
        <Select
          placeholder="Filter by type"
          value={filter}
          onChange={(value) => setFilter(value || 'all')}
          data={[
            { value: 'all', label: 'All Types' },
            { value: 'character', label: 'Characters' },
            { value: 'location', label: 'Locations' },
            { value: 'item', label: 'Items' },
          ]}
          leftSection={<IconFilter size="1rem" />}
        />
      </Group>

      <Stack spacing="sm">
        {filteredEntities.length > 0 ? (
          filteredEntities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              isSelected={entity.id === selectedEntityId}
              onClick={() => onEntitySelect(entity.id)}
            />
          ))
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No entities found. Try adjusting your search or filter.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}

export default EntityList;
```

## Entity Card Component

The Entity Card component displays a summary of an entity in the entity list.

### Implementation

```tsx
// src/pages/DataHub/EntityCard.tsx
import { Card, Group, Text, Avatar, ActionIcon, Menu } from '@mantine/core';
import { IconDotsVertical, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl?: string;
}

interface EntityCardProps {
  entity: Entity;
  isSelected: boolean;
  onClick: () => void;
}

function EntityCard({ entity, isSelected, onClick }: EntityCardProps) {
  return (
    <Card
      withBorder
      padding="sm"
      radius="md"
      onClick={onClick}
      sx={(theme) => ({
        backgroundColor: isSelected ? theme.fn.rgba(theme.colors.teal[9], 0.2) : theme.colors.dark[7],
        borderColor: isSelected ? theme.colors.teal[6] : theme.colors.dark[5],
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: isSelected ? theme.fn.rgba(theme.colors.teal[9], 0.3) : theme.colors.dark[6],
        },
      })}
    >
      <Group position="apart" noWrap>
        <Group noWrap>
          <Avatar src={entity.imageUrl} radius="md" size="md" />
          <div>
            <Text size="sm" fw={500} lineClamp={1}>
              {entity.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {entity.description}
            </Text>
          </div>
        </Group>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <IconDotsVertical size="1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item icon={<IconEye size="1rem" />}>View</Menu.Item>
            <Menu.Item icon={<IconEdit size="1rem" />}>Edit</Menu.Item>
            <Menu.Item icon={<IconTrash size="1rem" />} color="red">
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}

export default EntityCard;
```

## Entity Editor Component

The Entity Editor component provides a form for editing the selected entity.

### Implementation

```tsx
// src/pages/DataHub/EntityEditor.tsx
import { useState } from 'react';
import { Tabs, Title, Text, Button, Group, Stack } from '@mantine/core';
import {
  IconInfoCircle,
  IconUsers,
  IconNotes,
  IconPhoto,
  IconEdit,
  IconDeviceFloppy,
  IconX,
} from '@tabler/icons-react';
import EntityForm from './EntityForm';
import RelationshipManager from './RelationshipManager';
import NotesEditor from './NotesEditor';
import ImageGallery from './ImageGallery';

interface EntityEditorProps {
  entityId: string | null;
}

function EntityEditor({ entityId }: EntityEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('details');

  // Mock data - replace with actual data from API
  const entity = entityId
    ? {
        id: entityId,
        name: 'Elara Moonwhisper',
        type: 'character',
        description: 'An elven sorceress with a mysterious past.',
        imageUrl: 'https://via.placeholder.com/150',
      }
    : null;

  if (!entity) {
    return (
      <Stack align="center" justify="center" style={{ height: '100%' }}>
        <Text c="dimmed">Select an entity to view or edit</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing="md">
      <Group position="apart">
        <Title order={3}>{entity.name}</Title>
        {isEditing ? (
          <Group>
            <Button
              leftIcon={<IconDeviceFloppy size="1rem" />}
              onClick={() => setIsEditing(false)}
              color="teal"
            >
              Save
            </Button>
            <Button
              leftIcon={<IconX size="1rem" />}
              onClick={() => setIsEditing(false)}
              variant="outline"
              color="red"
            >
              Cancel
            </Button>
          </Group>
        ) : (
          <Button
            leftIcon={<IconEdit size="1rem" />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="details" leftSection={<IconInfoCircle size="0.8rem" />}>
            Details
          </Tabs.Tab>
          <Tabs.Tab value="relationships" leftSection={<IconUsers size="0.8rem" />}>
            Relationships
          </Tabs.Tab>
          <Tabs.Tab value="notes" leftSection={<IconNotes size="0.8rem" />}>
            Notes
          </Tabs.Tab>
          <Tabs.Tab value="images" leftSection={<IconPhoto size="0.8rem" />}>
            Images
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xs">
          <EntityForm entity={entity} isEditing={isEditing} />
        </Tabs.Panel>

        <Tabs.Panel value="relationships" pt="xs">
          <RelationshipManager entityId={entity.id} isEditing={isEditing} />
        </Tabs.Panel>

        <Tabs.Panel value="notes" pt="xs">
          <NotesEditor entityId={entity.id} isEditing={isEditing} />
        </Tabs.Panel>

        <Tabs.Panel value="images" pt="xs">
          <ImageGallery entityId={entity.id} isEditing={isEditing} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default EntityEditor;
```

## Entity Form Component

The Entity Form component provides a form for editing the details of an entity.

### Implementation

```tsx
// src/pages/DataHub/EntityForm.tsx
import { TextInput, Textarea, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl?: string;
}

interface EntityFormProps {
  entity: Entity;
  isEditing: boolean;
}

function EntityForm({ entity, isEditing }: EntityFormProps) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: entity.name,
      type: entity.type,
      description: entity.description,
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      type: (value) => (!value ? 'Type is required' : null),
    },
  });

  return (
    <form>
      <Stack spacing="md">
        <TextInput
          label="Name"
          placeholder="Entity name"
          {...form.getInputProps('name')}
          key={form.key('name')}
          disabled={!isEditing}
        />

        <Select
          label="Type"
          placeholder="Select entity type"
          data={[
            { value: 'character', label: 'Character' },
            { value: 'location', label: 'Location' },
            { value: 'item', label: 'Item' },
            { value: 'event', label: 'Event' },
            { value: 'session', label: 'Session' },
          ]}
          {...form.getInputProps('type')}
          key={form.key('type')}
          disabled={!isEditing}
        />

        <Textarea
          label="Description"
          placeholder="Entity description"
          minRows={4}
          {...form.getInputProps('description')}
          key={form.key('description')}
          disabled={!isEditing}
        />
      </Stack>
    </form>
  );
}

export default EntityForm;
```

## Entity Context

The Entity Context provides global access to the selected entity and related functions.

### Implementation

```tsx
// src/contexts/EntityContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl?: string;
}

interface EntityContextType {
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  loading: boolean;
  error: string | null;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity,
        loading,
        error,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  return context;
}
```

## Conclusion

This implementation plan provides a comprehensive guide for creating the Data Hub module of the RPG Archivist application using Mantine. By following this plan, developers can create a consistent, responsive, and user-friendly interface for managing campaign data.
