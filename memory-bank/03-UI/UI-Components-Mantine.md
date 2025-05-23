# UI Components in Mantine for RPG Archivist

## Overview

This document provides a comprehensive overview of the UI components in the RPG Archivist application using Mantine. It serves as a reference for developers implementing the UI components and ensures consistency across the application.

## Layout Components

### AppShell

- **Purpose**: Provides the overall layout of the application
- **Mantine Component**: `AppShell`
- **Sub-components**: 
  - `AppShell.Header`
  - `AppShell.Navbar`
  - `AppShell.Main`
  - `AppShell.Footer`
- **Example**:

```tsx
<AppShell
  header={{ height: 60 }}
  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
  padding="md"
>
  <AppShell.Header>
    {/* Header content */}
  </AppShell.Header>
  <AppShell.Navbar>
    {/* Navbar content */}
  </AppShell.Navbar>
  <AppShell.Main>
    {/* Main content */}
  </AppShell.Main>
</AppShell>
```

### Sidebar

- **Purpose**: Provides navigation for the application
- **Mantine Component**: `AppShell.Navbar` + `NavLink`
- **Features**: Collapsible, responsive, role-based navigation
- **Example**:

```tsx
<AppShell.Navbar p="md">
  <Stack gap="xs">
    <NavLink
      label="Dashboard"
      leftSection={<IconDashboard size="1rem" />}
      active={active === 'dashboard'}
      onClick={() => setActive('dashboard')}
    />
    <NavLink
      label="Data Hub"
      leftSection={<IconDatabase size="1rem" />}
      active={active === 'data-hub'}
      onClick={() => setActive('data-hub')}
    />
    {/* More navigation items */}
  </Stack>
</AppShell.Navbar>
```

### Header

- **Purpose**: Provides context and actions for the current page
- **Mantine Component**: `AppShell.Header` + `Group`
- **Features**: Sticky positioning, responsive design
- **Example**:

```tsx
<AppShell.Header>
  <Group h="100%" px="md">
    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
    <Group>
      <IconDice size={30} stroke={1.5} />
      <Title order={3}>RPG Archivist</Title>
    </Group>
    <Group ml="auto">
      <TextInput
        placeholder="Search..."
        leftSection={<IconSearch size="1rem" />}
        visibleFrom="sm"
      />
      <Menu>
        <Menu.Target>
          <ActionIcon>
            <IconUser size="1.2rem" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>Profile</Menu.Item>
          <Menu.Item>Settings</Menu.Item>
          <Menu.Item color="red">Logout</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  </Group>
</AppShell.Header>
```

### Footer

- **Purpose**: Provides copyright and additional links
- **Mantine Component**: `AppShell.Footer` + `Group`
- **Features**: Responsive design, always at bottom
- **Example**:

```tsx
<AppShell.Footer height={60} p="md">
  <Group justify="space-between">
    <Text size="sm">© 2025 RPG Archivist</Text>
    <Group gap="xs">
      <Anchor size="sm" href="#">Terms</Anchor>
      <Anchor size="sm" href="#">Privacy</Anchor>
      <Anchor size="sm" href="#">Contact</Anchor>
    </Group>
  </Group>
</AppShell.Footer>
```

## Entity Components

### EntityList

- **Purpose**: Displays a list of entities
- **Mantine Components**: `Stack`, `Card`, `Pagination`
- **Features**: Infinite scrolling, filtering, sorting, search
- **Example**:

```tsx
<Stack>
  <Group mb="md">
    <TextInput
      placeholder="Search entities..."
      leftSection={<IconSearch size="1rem" />}
    />
    <Select
      placeholder="Filter by type"
      data={[
        { value: 'all', label: 'All Types' },
        { value: 'character', label: 'Characters' },
        { value: 'location', label: 'Locations' },
        { value: 'item', label: 'Items' },
      ]}
    />
  </Group>
  
  {entities.map(entity => (
    <EntityCard key={entity.id} entity={entity} />
  ))}
  
  <Pagination total={10} />
</Stack>
```

### EntityCard

- **Purpose**: Displays a summary of an entity
- **Mantine Component**: `Card`
- **Features**: Responsive design, hover effects, action menu
- **Example**:

```tsx
<Card withBorder shadow="sm" radius="md" p="md">
  <Group>
    <Avatar size="lg" src={entity.imageUrl} alt={entity.name} />
    <div>
      <Text fw={500}>{entity.name}</Text>
      <Text size="sm" c="dimmed">{entity.type}</Text>
    </div>
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" ml="auto">
          <IconDotsVertical size="1rem" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconEdit size="1rem" />}>Edit</Menu.Item>
        <Menu.Item leftSection={<IconTrash size="1rem" />} color="red">Delete</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  <Text mt="sm" lineClamp={2}>{entity.description}</Text>
</Card>
```

### EntityDetail

- **Purpose**: Displays detailed information about an entity
- **Mantine Components**: `Tabs`, `Card`, `Stack`
- **Features**: Responsive design, tabbed interface, edit mode
- **Example**:

```tsx
<Card withBorder shadow="sm" radius="md" p={0}>
  <Card.Section p="md">
    <Group>
      <Avatar size="xl" src={entity.imageUrl} alt={entity.name} />
      <div>
        <Title order={3}>{entity.name}</Title>
        <Text size="sm" c="dimmed">{entity.type}</Text>
      </div>
      <Button ml="auto" leftSection={<IconEdit size="1rem" />}>Edit</Button>
    </Group>
  </Card.Section>
  
  <Tabs defaultValue="details">
    <Tabs.List>
      <Tabs.Tab value="details" leftSection={<IconInfoCircle size="1rem" />}>Details</Tabs.Tab>
      <Tabs.Tab value="relationships" leftSection={<IconUsers size="1rem" />}>Relationships</Tabs.Tab>
      <Tabs.Tab value="notes" leftSection={<IconNotes size="1rem" />}>Notes</Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="details" p="md">
      <Stack>
        {/* Details content */}
      </Stack>
    </Tabs.Panel>
    
    <Tabs.Panel value="relationships" p="md">
      {/* Relationships content */}
    </Tabs.Panel>
    
    <Tabs.Panel value="notes" p="md">
      {/* Notes content */}
    </Tabs.Panel>
  </Tabs>
</Card>
```

### EntityForm

- **Purpose**: Provides a form for creating or editing an entity
- **Mantine Components**: `TextInput`, `Textarea`, `Select`, `Button`
- **Features**: Validation, autosave, form state management
- **Example**:

```tsx
import { useForm } from '@mantine/form';

function EntityForm({ entity, onSubmit }) {
  const form = useForm({
    initialValues: {
      name: entity?.name || '',
      type: entity?.type || '',
      description: entity?.description || '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      type: (value) => (!value ? 'Type is required' : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Name"
          placeholder="Entity name"
          required
          {...form.getInputProps('name')}
        />
        
        <Select
          label="Type"
          placeholder="Select entity type"
          required
          data={[
            { value: 'character', label: 'Character' },
            { value: 'location', label: 'Location' },
            { value: 'item', label: 'Item' },
          ]}
          {...form.getInputProps('type')}
        />
        
        <Textarea
          label="Description"
          placeholder="Entity description"
          minRows={3}
          {...form.getInputProps('description')}
        />
        
        <Group justify="flex-end">
          <Button variant="outline" type="button">Cancel</Button>
          <Button type="submit">Save</Button>
        </Group>
      </Stack>
    </form>
  );
}
```

## Relationship Components

### RelationshipManager

- **Purpose**: Manages relationships between entities
- **Mantine Components**: `Tabs`, `Card`, `Stack`
- **Features**: Add, edit, delete relationships, filter by type

### RelationshipCard

- **Purpose**: Displays a summary of a relationship
- **Mantine Component**: `Card`
- **Features**: Responsive design, hover effects, action menu

### RelationshipForm

- **Purpose**: Provides a form for creating or editing a relationship
- **Mantine Components**: `Select`, `Textarea`, `Button`
- **Features**: Validation, entity search, relationship type suggestions

## Visualization Components

### MindMap

- **Purpose**: Provides a graph visualization of relationships
- **Integration**: Cytoscape.js with Mantine UI components
- **Features**: Interactive graph, zoom, pan, filtering, export

### Timeline

- **Purpose**: Provides a timeline visualization of events
- **Mantine Components**: Custom implementation with Mantine UI components
- **Features**: Interactive timeline, filtering, zooming, event details

### Analytics

- **Purpose**: Provides visualizations of analytics data
- **Integration**: Chart libraries with Mantine UI components
- **Features**: Interactive charts, filtering, export

## Form Components

### FormField

- **Purpose**: Provides a standardized form field
- **Mantine Components**: Various input components with consistent styling
- **Features**: Validation, error handling, focus management

### FormSection

- **Purpose**: Groups related form fields
- **Mantine Components**: `Paper`, `Stack`, `Title`
- **Features**: Collapsible, validation summary

### FormActions

- **Purpose**: Provides action buttons for a form
- **Mantine Component**: `Group`
- **Features**: Responsive design, loading state, confirmation dialogs

## Image Components

### ImageUploader

- **Purpose**: Provides image upload functionality
- **Mantine Component**: `Dropzone` from `@mantine/dropzone`
- **Features**: Drag and drop, image preview, cropping, progress indicator

### ImageGallery

- **Purpose**: Displays a gallery of images
- **Mantine Components**: `SimpleGrid`, `Image`, `Card`
- **Features**: Infinite scrolling, filtering, sorting, lightbox

### ImageViewer

- **Purpose**: Displays a full-size image
- **Mantine Components**: `Modal`, `Image`
- **Features**: Zoom, pan, rotate, download, share

## Authentication Components

### LoginForm

- **Purpose**: Provides login functionality
- **Mantine Components**: `TextInput`, `PasswordInput`, `Checkbox`, `Button`
- **Features**: Validation, error handling, remember me, forgot password

### RegisterForm

- **Purpose**: Provides registration functionality
- **Mantine Components**: `TextInput`, `PasswordInput`, `Checkbox`, `Button`
- **Features**: Validation, error handling, terms acceptance

### ForgotPasswordForm

- **Purpose**: Provides forgot password functionality
- **Mantine Components**: `TextInput`, `Button`
- **Features**: Validation, error handling, success message

### ResetPasswordForm

- **Purpose**: Provides password reset functionality
- **Mantine Components**: `PasswordInput`, `Button`
- **Features**: Validation, error handling, password strength indicator

## Utility Components

### Notification

- **Purpose**: Displays notifications to the user
- **Mantine Component**: `Notification` from `@mantine/notifications`
- **Features**: Different types (success, error, warning, info), auto-dismiss

### ConfirmDialog

- **Purpose**: Requests confirmation from the user
- **Mantine Components**: `Modal`, `Button`
- **Features**: Custom messages, destructive action warning

### LoadingIndicator

- **Purpose**: Indicates loading state
- **Mantine Components**: `Loader`, `Progress`, `Skeleton`
- **Features**: Different sizes, inline or overlay, progress indication

### ErrorBoundary

- **Purpose**: Catches and displays errors
- **Mantine Components**: `Alert`, `Button`
- **Features**: Detailed error information, retry functionality, error reporting

## Conclusion

This document provides a comprehensive overview of the UI components in the RPG Archivist application using Mantine. By following these component specifications, developers can create a consistent and user-friendly interface that meets the needs of tabletop RPG players and game masters.
