# Example Component Patterns

This document captures valuable implementation patterns from the example components in the RPG Scribe codebase. These patterns can be referenced when implementing new features or enhancing existing ones.

## Table of Contents

1. [UI Component Patterns](#ui-component-patterns)
   - [Entity List Views](#entity-list-views)
   - [Entity Detail Views](#entity-detail-views)
   - [Dashboard Patterns](#dashboard-patterns)
   - [Action Buttons and Controls](#action-buttons-and-controls)
2. [Data Handling Patterns](#data-handling-patterns)
   - [CRUD Operations](#crud-operations)
   - [Filtering and Sorting](#filtering-and-sorting)
   - [Pagination](#pagination)
   - [State Management](#state-management)
3. [Firestore Integration Patterns](#firestore-integration-patterns)
   - [Basic CRUD Operations](#basic-crud-operations)
   - [Dynamic Relationship Counting](#dynamic-relationship-counting)
   - [Transactions and Batch Operations](#transactions-and-batch-operations)
   - [Real-time Listeners](#real-time-listeners)
   - [Offline Persistence and Caching](#offline-persistence-and-caching)
4. [Mantine Component Usage](#mantine-component-usage)
   - [Layout Components](#layout-components)
   - [Data Display Components](#data-display-components)
   - [Input Components](#input-components)
   - [Feedback Components](#feedback-components)

## UI Component Patterns

### Entity List Views

#### Multiple View Types Pattern

From `CharacterListExample.tsx`, we can see how to implement multiple view types for the same data:

```tsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tabs.List>
    <Tabs.Tab value="table" leftSection={<IconList size={16} />}>
      Table View
    </Tabs.Tab>
    <Tabs.Tab value="grid" leftSection={<IconLayoutGrid size={16} />}>
      Grid View
    </Tabs.Tab>
    <Tabs.Tab value="article" leftSection={<IconArticle size={16} />}>
      Article View
    </Tabs.Tab>
    <Tabs.Tab value="organize" leftSection={<IconGripVertical size={16} />}>
      Organize
    </Tabs.Tab>
  </Tabs.List>

  <div style={{ marginTop: '1rem' }}>
    {activeTab === 'table' && (
      <EntityTable
        data={characters}
        columns={columns}
        entityType={EntityType.CHARACTER}
        onView={handleViewCharacter}
        onEdit={handleEditCharacter}
        onDelete={handleDeleteCharacter}
        filterOptions={filterOptions}
      />
    )}

    {activeTab === 'grid' && (
      <EntityCardGrid
        data={characters}
        entityType={EntityType.CHARACTER}
        onView={handleViewCharacter}
        onEdit={handleEditCharacter}
        onDelete={handleDeleteCharacter}
        filterOptions={filterOptions}
        renderBadge={renderCharacterBadge}
      />
    )}

    {/* Additional view types... */}
  </div>
</Tabs>
```

This pattern allows users to switch between different views of the same data, each optimized for different use cases.

#### Table View Customization

The `EntityTable` component can be customized with column definitions that include custom rendering:

```tsx
const columns = [
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    render: (character: any) => (
      <Group gap="sm">
        <Avatar
          src={character.imageURL}
          radius="xl"
          size="sm"
          alt={character.name}
        />
        <Text fw={500}>{character.name}</Text>
      </Group>
    )
  },
  {
    key: 'type',
    title: 'Type',
    sortable: true,
    render: (character: any) => (
      <Badge
        color={character.type === 'PC' ? 'blue' : 'gray'}
      >
        {character.type}
      </Badge>
    )
  },
  // Additional columns...
];
```

### Entity Detail Views

From `CampaignDetailExample.tsx`, we can see patterns for organizing entity detail pages:

#### Header with Actions

```tsx
<Group justify="space-between" mb="md">
  <Group>
    <ThemeIcon size="xl" radius="xl" color="blue">
      <IconWorld size={24} />
    </ThemeIcon>
    <div>
      <Title order={2}>Campaign Name</Title>
      <Text c="dimmed">A description of the campaign</Text>
    </div>
  </Group>

  <Group>
    <EntityActionButton
      entityType={EntityType.CAMPAIGN}
      primaryAction={{
        label: 'Edit Campaign',
        icon: <IconEdit size={16} />,
        onClick: () => console.log('Edit campaign')
      }}
      actions={[
        {
          label: 'Share Campaign',
          icon: <IconShare size={16} />,
          onClick: () => console.log('Share campaign')
        }
      ]}
    />
  </Group>
</Group>
```

#### Tabbed Content Organization

```tsx
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Tab value="overview" leftSection={<IconBook size={16} />}>
      Overview
    </Tabs.Tab>
    <Tabs.Tab value="characters" leftSection={<IconUser size={16} />}>
      Characters
    </Tabs.Tab>
    <Tabs.Tab value="locations" leftSection={<IconMapPin size={16} />}>
      Locations
    </Tabs.Tab>
    {/* Additional tabs... */}
  </Tabs.List>

  <Tabs.Panel value="overview" pt="md">
    {/* Overview content */}
  </Tabs.Panel>

  <Tabs.Panel value="characters" pt="md">
    {/* Characters content */}
  </Tabs.Panel>

  {/* Additional panels... */}
</Tabs>
```

### Dashboard Patterns

From various example components, we can extract dashboard patterns:

#### Stat Cards

```tsx
<SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
  <Paper withBorder p="md" radius="md">
    <Group>
      <ThemeIcon size="lg" radius="xl" color="blue">
        <IconUser size={24} />
      </ThemeIcon>
      <div>
        <Text c="dimmed" size="xs">Player Characters</Text>
        <Text fw={700} size="xl">{pcCount}</Text>
      </div>
    </Group>
  </Paper>

  {/* Additional stat cards... */}
</SimpleGrid>
```

### Action Buttons and Controls

#### Entity Action Button

The `EntityActionButton` component provides a consistent way to handle entity actions:

```tsx
<EntityActionButton
  entityType={EntityType.CHARACTER}
  primaryAction={{
    label: 'Create Character',
    icon: <IconPlus size={16} />,
    onClick: () => console.log('Create character')
  }}
  actions={[
    {
      label: 'Import Characters',
      icon: <IconUser size={16} />,
      onClick: () => console.log('Import characters')
    }
  ]}
  groupedActions={[
    {
      title: 'Generate',
      actions: [
        {
          label: 'Generate NPC',
          icon: <IconUser size={16} />,
          onClick: () => console.log('Generate NPC')
        },
        {
          label: 'Generate Party',
          icon: <IconUsers size={16} />,
          onClick: () => console.log('Generate party')
        }
      ]
    }
  ]}
/>
```

## Data Handling Patterns

### CRUD Operations

From `CharacterListExample.tsx` and `FirestoreServiceTest.tsx`, we can extract patterns for handling CRUD operations:

#### Delete Confirmation Dialog

```tsx
// State for delete confirmation
const [characterToDelete, setCharacterToDelete] = useState<any | null>(null);
const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false);
const [loading, setLoading] = useState(false);

// Handle delete character
const handleDeleteCharacter = (character: any) => {
  setCharacterToDelete(character);
  openConfirmDelete();
};

// Confirm delete character
const confirmDeleteCharacter = () => {
  if (characterToDelete) {
    setLoading(true);

    // API call to delete character
    characterService.delete(characterToDelete.id)
      .then(() => {
        setCharacters(characters.filter(c => c.id !== characterToDelete.id));
        closeConfirmDelete();
      })
      .catch(error => {
        console.error('Error deleting character:', error);
        // Show error notification
      })
      .finally(() => {
        setLoading(false);
      });
  }
};

// Confirmation dialog component
<ConfirmationDialog
  opened={confirmDeleteOpened}
  onClose={closeConfirmDelete}
  onConfirm={confirmDeleteCharacter}
  title="Delete Character"
  message={`Are you sure you want to delete ${characterToDelete?.name}? This action cannot be undone.`}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  type="delete"
  loading={loading}
/>
```

### Filtering and Sorting

From `CharacterListExample.tsx`, we can extract patterns for filtering and sorting:

#### Filter Options

```tsx
const filterOptions = [
  {
    label: 'Type',
    key: 'type',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Player Characters', value: 'PC' },
      { label: 'Non-Player Characters', value: 'NPC' }
    ]
  },
  {
    label: 'Race',
    key: 'race',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Human', value: 'Human' },
      { label: 'Elf', value: 'Elf' },
      { label: 'Dwarf', value: 'Dwarf' },
      { label: 'Halfling', value: 'Halfling' }
    ]
  }
];
```

## Firestore Integration Patterns

### Dynamic Relationship Counting

From `DynamicCountPage.tsx`, we can extract the pattern for dynamic relationship counting:

```tsx
// Cache for count queries
private countCache: Map<string, CountCacheEntry> = new Map();

// Generate cache key for count query
private generateCountCacheKey(queryName: string, constraints: QueryConstraint[]): string {
  return `${queryName}:${JSON.stringify(constraints)}`;
}

// Get count from cache or query
async getCount(
  queryName: string,
  constraints: QueryConstraint[] = [],
  options: CountOptions = {}
): Promise<number> {
  const {
    useCache = true,
    cacheTTL,
    forceServer = false,
    maxRetries = 3
  } = options;

  // Generate cache key
  const cacheKey = this.generateCountCacheKey(queryName, constraints);

  // Try to get from cache if enabled and not forcing server
  if (useCache && !forceServer) {
    const cachedCount = this.getCachedCount(cacheKey);
    if (cachedCount !== null) {
      return cachedCount;
    }
  }

  // Query count from Firestore
  try {
    const q = query(collection(db, this.collectionPath), ...constraints);
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;

    // Cache the result
    if (useCache) {
      this.setCachedCount(cacheKey, count, cacheTTL);
    }

    return count;
  } catch (error) {
    console.error(`Error getting count for ${queryName}:`, error);
    return 0;
  }
}
```

## Mantine Component Usage

### Layout Components

From various example components, we can extract patterns for using Mantine layout components:

#### Responsive Grid

```tsx
<SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
  {/* Grid items */}
</SimpleGrid>
```

#### Group with Space Between

```tsx
<Group justify="space-between" align="center">
  <Group>
    {/* Left content */}
  </Group>
  <Group>
    {/* Right content */}
  </Group>
</Group>
```

### Data Display Components

#### Badge with Custom Styling

```tsx
<Badge
  color={character.type === 'PC' ? 'blue' : 'gray'}
  variant="filled"
  size="sm"
  radius="sm"
>
  {character.type}
</Badge>
```

#### ThemeIcon for Entity Types

```tsx
<ThemeIcon
  size="lg"
  radius="xl"
  color={getEntityColor(entityType)}
  variant="light"
>
  <IconComponent size={rem(18)} />
</ThemeIcon>
```

These patterns provide a solid foundation for implementing consistent UI components throughout the RPG Scribe application.

### Input Components

#### Form with Multiple Inputs

```tsx
<form onSubmit={form.onSubmit(handleSubmit)}>
  <Stack gap="md">
    <TextInput
      label="Name"
      placeholder="Enter character name"
      required
      {...form.getInputProps('name')}
    />

    <Select
      label="Race"
      placeholder="Select race"
      data={races}
      required
      {...form.getInputProps('race')}
    />

    <Select
      label="Class"
      placeholder="Select class"
      data={classes}
      required
      {...form.getInputProps('class')}
    />

    <NumberInput
      label="Level"
      placeholder="Enter level"
      min={1}
      max={20}
      required
      {...form.getInputProps('level')}
    />

    <Select
      label="Type"
      placeholder="Select type"
      data={[
        { value: 'PC', label: 'Player Character' },
        { value: 'NPC', label: 'Non-Player Character' }
      ]}
      required
      {...form.getInputProps('type')}
    />

    <Textarea
      label="Description"
      placeholder="Enter character description"
      minRows={3}
      {...form.getInputProps('description')}
    />

    <Group justify="flex-end">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" loading={loading}>
        Save Character
      </Button>
    </Group>
  </Stack>
</form>
```

### Feedback Components

#### Loading States

```tsx
// Component-level loading
{loading ? (
  <Center p="xl">
    <Loader size="lg" />
  </Center>
) : (
  // Component content
)}

// Button loading state
<Button loading={loading} onClick={handleAction}>
  Save
</Button>

// Loading overlay
<Box pos="relative">
  <LoadingOverlay visible={loading} overlayBlur={2} />
  {/* Content */}
</Box>
```

#### Error Handling

```tsx
// Error state display
{error && (
  <Alert color="red" title="Error" mb="md">
    {error}
  </Alert>
)}

// Empty state
{data.length === 0 && !loading && (
  <Paper withBorder p="xl" radius="md">
    <Stack align="center" gap="md">
      <ThemeIcon size="xl" radius="xl" color="gray">
        <IconUser size={24} />
      </ThemeIcon>
      <Text fw={500} size="lg">No characters found</Text>
      <Text c="dimmed" ta="center">
        There are no characters in this campaign yet. Create your first character to get started.
      </Text>
      <Button leftSection={<IconPlus size={16} />} onClick={handleCreateCharacter}>
        Create Character
      </Button>
    </Stack>
  </Paper>
)}
```

## Drag and Drop Organization Pattern

From `TestComponents.tsx`, we can extract the pattern for drag-and-drop organization:

```tsx
<DragDropEntityOrganizer
  data={entities}
  entityType={EntityType.ITEM}
  onSaveOrder={async (newOrder) => {
    setLoading(true);
    try {
      // Save the new order to Firestore
      await Promise.all(
        newOrder.map((item, index) =>
          entityService.update(item.id!, { sortOrder: index })
        )
      );
      // Update local state
      setEntities(newOrder);
    } catch (error) {
      console.error('Error saving order:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  }}
  onView={(item) => navigate(`/items/${item.id}`)}
  onEdit={(item) => navigate(`/items/${item.id}/edit`)}
  onDelete={handleDeleteItem}
  renderItem={(item) => (
    <Group wrap="nowrap">
      <Avatar
        src={item.imageURL}
        radius="md"
        size="md"
        alt={item.name}
      />
      <div>
        <Text fw={500}>{item.name}</Text>
        <Text size="xs" c="dimmed">{item.description}</Text>
      </div>
    </Group>
  )}
/>
```

## Relationship Count Badge Pattern

From `RelationshipCountBadgeTest.tsx`, we can extract the pattern for relationship count badges:

```tsx
<RelationshipCountBadge
  entityId={entityId}
  entityType={entityType}
  count={count}
  worldId={worldId}
  campaignId={campaignId}
  size="md"
  variant="filled"
  interactive={true}
  showIcon={true}
  tooltipPosition="top"
/>
```

This component can be used in different contexts:

1. In entity cards:
```tsx
<Card withBorder p="md" radius="md">
  <Group justify="space-between">
    <Text fw={500}>{entity.name}</Text>
    <RelationshipCountBadge
      entityId={entity.id!}
      entityType={entity.entityType}
      count={entity.relationshipCount}
      worldId={worldId}
      campaignId={campaignId}
      size="sm"
    />
  </Group>
</Card>
```

2. In list items:
```tsx
<Group justify="space-between">
  <Group>
    <ThemeIcon size="sm" color={getEntityColor(entity.entityType)} variant="light">
      <IconComponent size={rem(14)} />
    </ThemeIcon>
    <Text>{entity.name}</Text>
  </Group>
  <RelationshipCountBadge
    entityId={entity.id!}
    entityType={entity.entityType}
    count={entity.relationshipCount}
    worldId={worldId}
    campaignId={campaignId}
    size="xs"
  />
</Group>
```

3. In navigation items:
```tsx
<Group justify="space-between">
  <Group>
    <IconComponent size={rem(16)} />
    <Text>{entityType}s</Text>
  </Group>
  <RelationshipCountBadge
    entityId="all"
    entityType={entityType}
    count={totalCount}
    worldId={worldId}
    campaignId={campaignId}
    size="xs"
    variant="filled"
    interactive={false}
    showIcon={false}
  />
</Group>
```

## Conclusion

These patterns extracted from the example components provide a comprehensive reference for implementing consistent UI components, data handling, and Firestore integration throughout the RPG Scribe application. By following these patterns, developers can ensure a cohesive user experience and maintainable codebase.

When implementing new features or enhancing existing ones, refer to these patterns to maintain consistency and leverage proven implementation techniques.
