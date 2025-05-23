# Modal Entity Form System Design Document

**Version**: 1.0  
**Date**: 2025-05-22  
**Status**: Design Phase  
**Reference Implementation**: FactionFormPage.tsx

## Executive Summary

This document outlines the design for a standardized Modal Entity Form System that will replace the current full-page forms with consistent, reusable modal-based forms across all RPG Scribe entities.

## Current State Analysis

### Existing Implementation (FactionFormPage.tsx)
- **Layout**: Full-page form with Container → Paper → Stack structure
- **Form Management**: @mantine/form with validation
- **Components**: Mantine 8 components (TextInput, Textarea, Select, MultiSelect, etc.)
- **Structure**: Linear form with dividers for sections
- **Navigation**: Route-based (/factions/new, /factions/:id/edit)
- **Submission**: Service-based with notifications

### Key Patterns Identified
```typescript
// Form structure pattern
const form = useForm({
  initialValues: { /* entity fields */ },
  validate: { /* validation rules */ }
});

// Section organization with dividers
<Divider label="Leadership & Membership" />
<Divider label="Location" />
<Divider label="Assets" />
<Divider label="Secret Information (GM Only)" />

// Relationship selectors
<Select data={characters.map(char => ({ value: char.id, label: char.name }))} />
<MultiSelect data={locations.map(loc => ({ value: loc.id, label: loc.name }))} />
```

## Modal Entity Form System Architecture

### Core Components

```typescript
// 1. Main Modal Form Component
interface ModalEntityFormProps<T> {
  entityType: EntityType;
  entityId?: string;
  worldId: string;
  campaignId?: string;
  opened: boolean;
  onClose: () => void;
  onSuccess?: (entity: T) => void;
  initialValues?: Partial<T>;
}

// 2. Form Configuration Interface
interface EntityFormConfig {
  title: string;
  tabs: FormTab[];
  validation: ValidationRules;
  relationships: RelationshipConfig[];
}

// 3. Form Tab Structure
interface FormTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  fields: FormField[];
  conditional?: (values: any) => boolean;
}
```

### Modal Layout Design

```
┌─────────────────────────────────────────────────────────────┐
│ Modal Header: [Icon] Entity Name                    [X]     │
├─────────────────────────────────────────────────────────────┤
│ Tab Navigation: [Basic] [Relationships] [Advanced] [GM]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Tab Content Area:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Form Fields (responsive grid)                           │ │
│ │ - Text inputs, selects, textareas                       │ │
│ │ - Relationship selectors                                │ │
│ │ - Image upload                                          │ │
│ │ - Custom field components                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Actions: [Cancel] [Save Draft] [Save & Close] [Save & New] │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Modal Sizing

```typescript
const modalSizes = {
  xs: '95%',   // Mobile
  sm: '80%',   // Small tablets
  md: '70%',   // Tablets
  lg: '60%',   // Desktop
  xl: '50%'    // Large desktop
};
```

## Tab Organization Strategy

### Standard Tab Structure

```typescript
const standardTabs = {
  basic: {
    id: 'basic',
    label: 'Basic Info',
    icon: <IconInfoCircle />,
    fields: ['name', 'description', 'type', 'image']
  },
  relationships: {
    id: 'relationships',
    label: 'Relationships',
    icon: <IconUsers />,
    fields: ['relatedEntities', 'connections']
  },
  advanced: {
    id: 'advanced',
    label: 'Advanced',
    icon: <IconSettings />,
    fields: ['customFields', 'metadata']
  },
  gm: {
    id: 'gm',
    label: 'GM Only',
    icon: <IconEyeOff />,
    fields: ['secretNotes', 'hiddenInfo'],
    conditional: (user) => user.role === 'GM'
  }
};
```

### Entity-Specific Tab Examples

```typescript
// Faction tabs (based on current implementation)
const factionTabs = [
  {
    id: 'basic',
    label: 'Basic Info',
    fields: ['name', 'description', 'factionType', 'motto', 'scope', 'resources']
  },
  {
    id: 'leadership',
    label: 'Leadership',
    fields: ['leaderId', 'leaderTitle', 'memberIds']
  },
  {
    id: 'location',
    label: 'Territory',
    fields: ['headquartersId', 'territoryIds']
  },
  {
    id: 'assets',
    label: 'Assets',
    fields: ['itemIds', 'goals']
  },
  {
    id: 'secrets',
    label: 'GM Secrets',
    fields: ['secretNotes', 'hiddenGoals']
  }
];
```

## Form Field Components

### Standardized Field Types

```typescript
// 1. Text Fields
<FormTextField
  name="name"
  label="Name"
  required
  placeholder="Enter name"
/>

// 2. Rich Text
<FormRichText
  name="description"
  label="Description"
  placeholder="Describe the entity"
/>

// 3. Entity Selectors
<FormEntitySelector
  name="leaderId"
  label="Leader"
  entityType="character"
  worldId={worldId}
  clearable
/>

// 4. Multi-Entity Selectors
<FormMultiEntitySelector
  name="memberIds"
  label="Members"
  entityType="character"
  worldId={worldId}
/>

// 5. Image Upload
<FormImageUploader
  name="imageURL"
  label="Image"
  accept="image/*"
/>
```

### Relationship Management Tab

```typescript
const RelationshipTab = () => (
  <Stack gap="md">
    <Title order={4}>Entity Relationships</Title>
    
    {/* Existing relationships */}
    <RelationshipList
      entityId={entityId}
      entityType={entityType}
      onEdit={handleEditRelationship}
      onDelete={handleDeleteRelationship}
    />
    
    {/* Add new relationship */}
    <RelationshipForm
      sourceEntityId={entityId}
      sourceEntityType={entityType}
      onAdd={handleAddRelationship}
    />
  </Stack>
);
```

## Implementation Strategy

### Phase 1: Core Infrastructure
```typescript
// 1. Create base modal component
export const ModalEntityForm = <T extends BaseEntity>({
  entityType,
  opened,
  onClose,
  ...props
}: ModalEntityFormProps<T>) => {
  return (
    <SafeModal
      opened={opened}
      onClose={onClose}
      size={{ base: '95%', sm: '80%', md: '70%', lg: '60%', xl: '50%' }}
      title={getModalTitle(entityType, props.entityId)}
    >
      <EntityFormContent {...props} />
    </SafeModal>
  );
};
```

### Phase 2: Form Configuration System
```typescript
// Entity-specific configurations
const entityConfigs: Record<EntityType, EntityFormConfig> = {
  [EntityType.FACTION]: factionFormConfig,
  [EntityType.CHARACTER]: characterFormConfig,
  [EntityType.LOCATION]: locationFormConfig,
  // ... other entities
};
```

### Phase 3: Integration with Existing Routes
```typescript
// Convert existing routes to modal-based
const FactionListPage = () => {
  const [formModal, setFormModal] = useState({ opened: false, entityId: null });
  
  return (
    <>
      <UnifiedEntityList
        onCreateNew={() => setFormModal({ opened: true, entityId: null })}
        onEdit={(id) => setFormModal({ opened: true, entityId: id })}
      />
      
      <ModalEntityForm
        entityType={EntityType.FACTION}
        opened={formModal.opened}
        entityId={formModal.entityId}
        onClose={() => setFormModal({ opened: false, entityId: null })}
      />
    </>
  );
};
```

## Migration Plan

### Step 1: Create Base Components (Week 1)
- [ ] ModalEntityForm base component
- [ ] FormTab component
- [ ] Standard form field components
- [ ] SafeModal integration

### Step 2: Faction Form Migration (Week 1-2)
- [ ] Convert FactionFormPage to modal configuration
- [ ] Implement faction-specific tabs
- [ ] Test modal functionality
- [ ] Update routing integration

### Step 3: Expand to Other Entities (Week 2-3)
- [ ] Character forms
- [ ] Location forms
- [ ] Item forms
- [ ] Event forms

### Step 4: Advanced Features (Week 3-4)
- [ ] Relationship management tab
- [ ] AI integration
- [ ] Form validation enhancements
- [ ] Performance optimization

## Success Metrics

- **Consistency**: All entity forms use the same modal structure
- **User Experience**: <2 seconds form load time, intuitive navigation
- **Development Efficiency**: 50% reduction in form development time
- **Maintainability**: Single source of truth for form patterns
- **Accessibility**: Full keyboard navigation and screen reader support

## Technical Considerations

### Performance
- Lazy load tab content
- Virtualize large entity lists
- Debounce validation
- Cache entity data

### Accessibility
- Focus management
- Keyboard navigation
- Screen reader support
- High contrast mode

### Mobile Responsiveness
- Touch-friendly controls
- Responsive modal sizing
- Optimized field layouts
- Gesture support

---

*This design document will be updated as implementation progresses and user feedback is incorporated.*
