# RPG Archivist Migration Plan: Material UI to Mantine

## Overview

This document outlines the comprehensive plan for migrating the RPG Archivist application from Material UI to Mantine. The migration will be done module by module, ensuring that each component is properly tested before moving on to the next.

## Why Migrate to Mantine?

Mantine offers several advantages over Material UI:

1. **Modern API**: Mantine has a more modern and consistent API design
2. **Performance**: Better performance with fewer re-renders
3. **Customization**: More flexible theming and styling system
4. **Accessibility**: Strong focus on accessibility out of the box
5. **TypeScript Support**: First-class TypeScript support
6. **Active Development**: Regular updates and improvements
7. **Fewer Dependencies**: Simpler dependency tree to avoid "dependency hell"

## Project Structure

The new project structure will follow a modular approach:

```
src/
├── components/         # Reusable components
│   ├── layout/         # Layout components
│   ├── ui/             # UI components
│   └── forms/          # Form components
├── contexts/           # Context providers
├── hooks/              # Custom hooks
├── pages/              # Page components
│   ├── Dashboard/
│   ├── DataHub/
│   ├── MindMap/
│   └── ...
├── services/           # API services
├── theme/              # Theme configuration
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Migration Strategy

### Phase 1: Setup and Core Components (1 week)

1. **Project Setup**
   - Install Mantine and dependencies
   - Configure PostCSS
   - Set up theme configuration

2. **Core Layout Components**
   - Implement AppShell (replaces Container/Box layout)
   - Implement Navbar (replaces Drawer)
   - Implement Header (replaces AppBar)
   - Implement routing with React Router

3. **Authentication Components**
   - Implement Login form
   - Implement Register form
   - Implement Forgot Password form
   - Implement Reset Password form
   - Set up authentication context

### Phase 2: Dashboard and Data Hub (2 weeks)

1. **Dashboard Components**
   - Implement Dashboard layout
   - Implement Stat Cards
   - Implement Recent Activity list
   - Implement Quick Start buttons

2. **Data Hub Components**
   - Implement Tree View
   - Implement Entity List
   - Implement Entity Editor
   - Implement Entity Form
   - Set up entity context

### Phase 3: Mind Map and Timeline (2 weeks)

1. **Mind Map Components**
   - Implement Mind Map visualization with Cytoscape.js
   - Implement Mind Map controls
   - Implement Mind Map details panel
   - Implement Mind Map legend

2. **Timeline Components**
   - Implement Timeline visualization
   - Implement Timeline controls
   - Implement Timeline items
   - Implement Timeline filters

### Phase 4: AI Brain and Live Play (2 weeks)

1. **AI Brain Components**
   - Implement Review Queue
   - Implement Story-Telling Mode
   - Implement Generation Tools
   - Implement Voice I/O integration

2. **Live Play Components**
   - Implement Recording HUD
   - Implement Combat Tracker
   - Implement Dice Roller
   - Implement Transcript Stream

### Phase 5: Transcripts and Image Library (2 weeks)

1. **Transcripts Components**
   - Implement Transcript List
   - Implement Transcript Editor
   - Implement Speaker Tags
   - Implement Bulk Approval

2. **Image Library Components**
   - Implement Image Grid
   - Implement Image Upload
   - Implement Image Details
   - Implement Image Tagging

### Phase 6: Analytics, Search, and Settings (1 week)

1. **Analytics Components**
   - Implement Relationship Heat Map
   - Implement NPC Screen-Time Analysis
   - Implement Session Pacing Metrics
   - Implement Export Functionality

2. **Search Components**
   - Implement Global Search
   - Implement Search Results
   - Implement Search Filters

3. **Settings Components**
   - Implement Settings Panels
   - Implement User Profile
   - Implement Theme Settings
   - Implement Export & Import

## Component Mapping

### Layout Components

| Material UI | Mantine | Status |
|-------------|---------|--------|
| `Box` | `Box` | ⬜ Not Started |
| `Container` | `Container` | ⬜ Not Started |
| `Grid` | `Grid` or `SimpleGrid` | ⬜ Not Started |
| `Stack` | `Stack` | ⬜ Not Started |
| `Paper` | `Paper` | ⬜ Not Started |
| `Drawer` | `Drawer` | ⬜ Not Started |
| `AppBar` | `AppShell.Header` | ⬜ Not Started |
| `Toolbar` | `Group` | ⬜ Not Started |
| `CssBaseline` | Not needed | ✅ Completed |
| `Hidden` | `@mantine/hooks` | ⬜ Not Started |

### Navigation Components

| Material UI | Mantine | Status |
|-------------|---------|--------|
| `Tabs` | `Tabs` | ⬜ Not Started |
| `Tab` | `Tabs.Tab` | ⬜ Not Started |
| `Breadcrumbs` | `Breadcrumbs` | ⬜ Not Started |
| `Link` | `Anchor` | ⬜ Not Started |
| `Menu` | `Menu` | ⬜ Not Started |
| `MenuItem` | `Menu.Item` | ⬜ Not Started |
| `BottomNavigation` | `NavLink` + custom styling | ⬜ Not Started |
| `Pagination` | `Pagination` | ⬜ Not Started |
| `Stepper` | `Stepper` | ⬜ Not Started |

### Inputs and Forms

| Material UI | Mantine | Status |
|-------------|---------|--------|
| `TextField` | `TextInput` | ⬜ Not Started |
| `Select` | `Select` | ⬜ Not Started |
| `Checkbox` | `Checkbox` | ⬜ Not Started |
| `Radio` | `Radio` | ⬜ Not Started |
| `Switch` | `Switch` | ⬜ Not Started |
| `Slider` | `Slider` | ⬜ Not Started |
| `Autocomplete` | `Autocomplete` | ⬜ Not Started |
| `Button` | `Button` | ⬜ Not Started |
| `IconButton` | `ActionIcon` | ⬜ Not Started |
| `ButtonGroup` | `Button.Group` | ⬜ Not Started |
| `FormControl` | `@mantine/form` | ⬜ Not Started |
| `FormHelperText` | Input `description` prop | ⬜ Not Started |
| `InputLabel` | Input `label` prop | ⬜ Not Started |
| `FormGroup` | `Group` | ⬜ Not Started |
| `FormControlLabel` | Not needed | ✅ Completed |
| `InputAdornment` | Input `leftSection`/`rightSection` | ⬜ Not Started |

### Data Display

| Material UI | Mantine | Status |
|-------------|---------|--------|
| `Typography` | `Text`, `Title` | ⬜ Not Started |
| `List` | `List` | ⬜ Not Started |
| `ListItem` | `List.Item` | ⬜ Not Started |
| `Table` | `Table` | ⬜ Not Started |
| `Avatar` | `Avatar` | ⬜ Not Started |
| `Badge` | `Badge` | ⬜ Not Started |
| `Chip` | `Badge` or `Chip` | ⬜ Not Started |
| `Divider` | `Divider` | ⬜ Not Started |
| `Icon` | `@tabler/icons-react` | ⬜ Not Started |
| `Tooltip` | `Tooltip` | ⬜ Not Started |

### Feedback

| Material UI | Mantine | Status |
|-------------|---------|--------|
| `Dialog` | `Modal` | ⬜ Not Started |
| `Snackbar` | `Notification` | ⬜ Not Started |
| `Alert` | `Alert` | ⬜ Not Started |
| `Backdrop` | `Overlay` | ⬜ Not Started |
| `CircularProgress` | `Loader` | ⬜ Not Started |
| `LinearProgress` | `Progress` | ⬜ Not Started |
| `Skeleton` | `Skeleton` | ⬜ Not Started |

## Theme Configuration

The theme configuration will be set up to match the design specifications from the UI Design Master Plan:

```tsx
// src/theme/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

// Primary accent: Teal/turquoise
const teal: MantineColorsTuple = [
  '#e6fcfc', // 0
  '#d0f7f7', // 1
  '#a3efef', // 2
  '#71e7e7', // 3
  '#4ce0e0', // 4
  '#35dcdc', // 5
  '#1A9B9B', // 6 - Primary
  '#0e7a7a', // 7
  '#006666', // 8
  '#004d4d'  // 9
];

// Secondary accent: Gold/amber
const amber: MantineColorsTuple = [
  '#fff8e1', // 0
  '#ffecb3', // 1
  '#ffe082', // 2
  '#ffd54f', // 3
  '#ffca28', // 4
  '#ffc107', // 5
  '#F6AD55', // 6 - Secondary
  '#ff8f00', // 7
  '#ff6f00', // 8
  '#ff5722'  // 9
];

export const theme = createTheme({
  colors: {
    teal,
    amber,
  },
  primaryColor: 'teal',
  primaryShade: 6,
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
      },
    },
  },
  other: {
    surface: {
      DEFAULT: '#0D1117',
      light: '#1A2233'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0'
    },
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#F56565',
  }
});
```

## Testing Strategy

1. **Component Tests**: Test each migrated component in isolation
2. **Integration Tests**: Test interactions between migrated components
3. **Visual Regression Tests**: Compare before/after screenshots
4. **Accessibility Tests**: Ensure accessibility is maintained or improved
5. **Performance Tests**: Measure performance improvements

## Implementation Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: Setup and Core Components | 1 week | TBD | TBD |
| Phase 2: Dashboard and Data Hub | 2 weeks | TBD | TBD |
| Phase 3: Mind Map and Timeline | 2 weeks | TBD | TBD |
| Phase 4: AI Brain and Live Play | 2 weeks | TBD | TBD |
| Phase 5: Transcripts and Image Library | 2 weeks | TBD | TBD |
| Phase 6: Analytics, Search, and Settings | 1 week | TBD | TBD |

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API differences between Material UI and Mantine | High | High | Thorough component mapping and testing |
| Styling inconsistencies | Medium | Medium | Comprehensive theme configuration |
| Performance issues | Medium | Low | Performance testing during migration |
| Accessibility regressions | High | Medium | Accessibility testing during migration |
| Timeline delays | Medium | Medium | Buffer time in schedule, prioritize critical components |

## Conclusion

This migration plan provides a comprehensive roadmap for transitioning the RPG Archivist application from Material UI to Mantine. By following this plan, we can ensure a smooth migration with minimal disruption to the application's functionality while improving performance, maintainability, and user experience.

## Next Steps

1. Set up the project with Mantine and its dependencies
2. Configure the theme to match the design specifications
3. Implement the core layout components
4. Begin migrating the authentication components
5. Proceed with the migration of the Dashboard and Data Hub modules
