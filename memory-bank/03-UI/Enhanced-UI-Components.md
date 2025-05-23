# Enhanced UI Components

This document describes the enhanced UI components that have been implemented to improve the visual appeal and user experience of the RPG Archivist application.

## EnhancedTooltip

The `EnhancedTooltip` component provides a consistent and visually appealing way to display tooltips throughout the application. It wraps the Material UI Tooltip component with custom styling and additional features, inspired by the 21st.dev Tooltip component design.

### Features

- Consistent styling with the application theme
- Support for rich content (not just text)
- Customizable delay and positioning
- Customizable maximum width
- Arrow indicator for better positioning context
- Backdrop blur effect for better readability
- Smooth animation
- Accessibility support
- Support for links within tooltips

### Usage

```tsx
import { EnhancedTooltip } from '../components/ui';

// Simple text tooltip
<EnhancedTooltip
  content="This is a tooltip with information about the button"
  side="top"
  delay={500}
  maxWidth={300}
>
  <Button>Hover Me</Button>
</EnhancedTooltip>

// Rich content tooltip
<EnhancedTooltip
  content={
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Character Creation
      </Typography>
      <Typography variant="body2">
        Create a new character for your campaign with our step-by-step wizard.
      </Typography>
      <Link href="#" underline="hover">Learn more</Link>
    </Box>
  }
  side="right"
  maxWidth={350}
>
  <IconButton>
    <HelpIcon />
  </IconButton>
</EnhancedTooltip>
```

## EnhancedEntityCard

The `EnhancedEntityCard` component provides a visually appealing way to display entities in the application. It includes background images that match the entity type, tooltips, and consistent styling.

### Features

- Type-specific background images that work for both fantasy and sci-fi settings
- Informative tooltips that explain the purpose of each card
- Support for tags to categorize entities
- Fallback to icons when no image is available
- Consistent styling with hover effects
- Responsive design that works on all screen sizes
- Customizable background opacity
- Support for elevation and variant options

### Usage

```tsx
import { EnhancedEntityCard } from '../components/ui';

<EnhancedEntityCard
  type="character"
  title="Thorne Ironheart"
  description="A stoic dwarven warrior with a troubled past and a heart of gold."
  image={characterImage}
  tooltip="Character cards display information about player characters and NPCs"
  tags={[
    { label: 'Dwarf', color: 'primary' },
    { label: 'Warrior', color: 'secondary' }
  ]}
  actions={
    <Button size="small" color="primary">View Details</Button>
  }
/>
```

### Entity Type Backgrounds

The component includes background images for the following entity types:

- `character` - Portrait frame design with fantasy and sci-fi elements
- `location` - Topographic map pattern with fantasy and sci-fi elements
- `item` - Inventory pattern with fantasy and sci-fi elements
- `event` - Timeline pattern with fantasy and sci-fi elements
- `campaign` - Storybook pattern with fantasy and sci-fi elements
- `session` - Tabletop pattern with fantasy and sci-fi elements
- `world` - Map pattern with fantasy and sci-fi elements
- `settings` - Control panel pattern with fantasy and sci-fi elements
- `worldBuilding` - Creation pattern with fantasy and sci-fi elements
- `aiBrain` - Neural network pattern with fantasy and sci-fi elements
- `mindMap` - Connection pattern with fantasy and sci-fi elements

## Implementation Details

### Background Images

The background images are stored in the `frontend/src/assets/images/placeholders/backgrounds/entity-tiles` directory. They are imported and exported through the `backgroundUrls.ts` file in that directory and made available through the `assets/index.ts` file.

If the background images are not available, you can run the `download-entity-backgrounds.ps1` script to download them.

### Tooltips

Tooltips are implemented using the `EnhancedTooltip` component, which provides a consistent look and feel across the application. The tooltips are designed to be informative and help users understand the purpose of each UI element.

### Demo Page

A demo page is available at `/demo/enhanced-cards` that showcases the `EnhancedEntityCard` component with different entity types, tooltips, and styling options.

## Future Enhancements

- Add animation options for card hover effects
- Add support for card actions with tooltips
- Add support for card badges (e.g., "New", "Updated")
- Add support for card status indicators (e.g., "Active", "Archived")
- Add support for card progress indicators (e.g., completion percentage)
- Add support for card notifications (e.g., unread messages, pending actions)

## Conclusion

The enhanced UI components provide a more visually appealing and user-friendly experience for the RPG Archivist application. They help users understand the purpose of each UI element and provide a consistent look and feel across the application.
