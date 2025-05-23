# Relationship Counters

Relationship counters are visual indicators that display the number of relationships an entity has. They are implemented across all entity UI components to provide a consistent way to visualize relationship data.

## Features

- **Visual Indicators**: Badges that show the number of relationships an entity has
- **Interactive**: Click to navigate to the entity's relationships
- **Hover Details**: Hover to see a breakdown of relationships by entity type
- **Zero State**: Special indicator for entities with no relationships
- **Loading State**: Skeleton loader while fetching relationship counts
- **Batch Loading**: Efficient loading of relationship counts in batches
- **Caching**: Relationship counts are cached to reduce redundant fetches
- **Consistent Styling**: Proper aspect ratio and alignment across all contexts
- **Accessibility**: ARIA attributes and keyboard navigation support

## Components

### RelationshipCountBadge

The `RelationshipCountBadge` component is the standardized component for displaying relationship counts. It can be used in any context where you need to display the number of relationships an entity has.

```tsx
<RelationshipCountBadge
  entityId="entity-123"
  entityType={EntityType.CHARACTER}
  count={5}
  interactive={true}
  worldId="world-456"
  campaignId="campaign-789"
  size="sm"
  variant="filled"
  showIcon={true}
  tooltipPosition="top"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `entityId` | `string` | ID of the entity |
| `entityType` | `EntityType` | Type of the entity |
| `count` | `number` | Optional count of relationships (if not provided, it will be fetched) |
| `interactive` | `boolean` | Whether the badge is clickable |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | Size of the badge |
| `variant` | `'filled' \| 'outline' \| 'light' \| 'transparent' \| 'white' \| 'default' \| 'dot'` | Variant of the badge |
| `showIcon` | `boolean` | Whether to show an icon |
| `breakdownData` | `{ [key in EntityType]?: number } \| null` | Optional breakdown of relationships by entity type |
| `worldId` | `string` | ID of the world |
| `campaignId` | `string` | ID of the campaign |
| `onHover` | `() => void` | Callback when mouse enters the badge |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | Position of the tooltip |
| `color` | `string` | Optional color override (defaults to entity type color) |
| `style` | `React.CSSProperties` | Optional additional styles |
| `className` | `string` | Optional additional class names |

### Integration with Entity Components

#### EntityCard

The `EntityCard` component displays a relationship badge in the top-right corner of the card. It fetches the relationship count if not provided.

```tsx
<EntityCard
  id="entity-123"
  type={EntityType.CHARACTER}
  name="Gandalf"
  worldId="world-456"
  campaignId="campaign-789"
  showRelationshipCount={true}
/>
```

#### EntityTable

The `EntityTable` component displays a relationship badge in a dedicated column. It fetches relationship counts for all entities in batches.

```tsx
<EntityTable
  data={characters}
  columns={columns}
  entityType={EntityType.CHARACTER}
  worldId="world-456"
  campaignId="campaign-789"
  showRelationshipCounts={true}
/>
```

#### EntityCardGrid

The `EntityCardGrid` component displays a relationship badge next to the entity type badge. It fetches relationship counts for all entities in batches.

```tsx
<EntityCardGrid
  data={characters}
  entityType={EntityType.CHARACTER}
  worldId="world-456"
  campaignId="campaign-789"
  showRelationshipCounts={true}
/>
```

## Services

### RelationshipBreakdownService

The `RelationshipBreakdownService` is responsible for fetching relationship counts and breakdowns. It provides methods for getting the total count of relationships for an entity and a breakdown of those relationships by entity type.

```tsx
const breakdownService = RelationshipBreakdownService.getInstance(worldId, campaignId);
const result = await breakdownService.getRelationshipBreakdown(entityId, entityType);
console.log(`Total relationships: ${result.total}`);
console.log(`Breakdown: ${JSON.stringify(result.byType)}`);
```

## Performance Considerations

- **Batch Loading**: Relationship counts are loaded in batches to reduce the number of Firestore reads
- **Caching**: Relationship counts are cached to avoid redundant fetches
- **Lazy Loading**: Relationship breakdowns are only loaded when needed (on hover)
- **Skeleton Loaders**: Skeleton loaders are displayed while fetching relationship counts to provide a smooth user experience
- **Dynamic Icon Sizing**: Icons are sized proportionally to badge size for better performance
- **Conditional Rendering**: Circle badges are used for small counts, rounded rectangles for larger numbers

## Styling

Relationship badges use Mantine's Badge component with consistent styling:

- **Color**: Based on entity type for consistent visual language
- **Size**: Responsive sizing based on context (xs for cards, sm for tables, md for detail pages)
- **Icon**: Dynamic icon based on entity type with proper sizing
- **Tooltip**: Detailed tooltip showing relationships grouped by entity type
- **Aspect Ratio**: Proper aspect ratio maintained for all badge sizes
- **Alignment**: Consistent vertical alignment with text and other UI elements

## Accessibility

- **ARIA Labels**: Descriptive ARIA labels for screen readers (e.g., "5 relationships for this character")
- **Keyboard Navigation**: Full keyboard navigation support with Enter and Space key handlers
- **Focus Indicators**: Visual indicators for keyboard focus with proper contrast
- **Screen Reader Text**: Detailed descriptions for screen readers
- **Semantic HTML**: Proper semantic HTML elements for interactive badges (button vs div)
- **ARIA Attributes**: Appropriate ARIA attributes for tooltips and interactive elements
