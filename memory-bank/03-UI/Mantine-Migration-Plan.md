# Material UI to Mantine Migration Plan

## Overview

This document outlines the comprehensive plan for migrating the RPG Archivist application from Material UI to Mantine. The migration will be done module by module, ensuring that each component is properly tested before moving on to the next.

## Why Mantine?

Mantine offers several advantages over Material UI:

1. **Modern API**: Mantine has a more modern and consistent API design
2. **Performance**: Better performance with fewer re-renders
3. **Customization**: More flexible theming and styling system
4. **Accessibility**: Strong focus on accessibility out of the box
5. **TypeScript Support**: First-class TypeScript support
6. **Active Development**: Regular updates and improvements
7. **Fewer Dependencies**: Simpler dependency tree to avoid "dependency hell"

## Mantine Setup

### Core Dependencies

```bash
npm install @mantine/core @mantine/hooks @mantine/form @mantine/dates @mantine/notifications @mantine/dropzone @mantine/carousel @mantine/spotlight @mantine/modals @mantine/nprogress @mantine/code-highlight
```

### Additional Dependencies

```bash
npm install @tabler/icons-react dayjs embla-carousel-react
```

### PostCSS Configuration

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### Theme Configuration

```tsx
// src/theme/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const teal: MantineColorsTuple = [
  '#e6fcfc',
  '#d0f7f7',
  '#a3efef',
  '#71e7e7',
  '#4ce0e0',
  '#35dcdc',
  '#1A9B9B',
  '#0e7a7a',
  '#006666',
  '#004d4d'
];

const amber: MantineColorsTuple = [
  '#fff8e1',
  '#ffecb3',
  '#ffe082',
  '#ffd54f',
  '#ffca28',
  '#ffc107',
  '#F6AD55',
  '#ff8f00',
  '#ff6f00',
  '#ff5722'
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

## Component Mapping: Material UI to Mantine

### Layout Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Box` | `Box` | Similar API |
| `Container` | `Container` | Similar API |
| `Grid` | `Grid` or `SimpleGrid` | Mantine offers both options |
| `Stack` | `Stack` | Similar API |
| `Paper` | `Paper` | Similar API |
| `Drawer` | `Drawer` | Similar API |
| `AppBar` | `AppShell.Header` | Part of AppShell |
| `Toolbar` | `Group` | Use Group for toolbar-like layouts |
| `CssBaseline` | Not needed | Mantine includes global styles |
| `Hidden` | `@mantine/hooks` | Use `useMediaQuery` hook |

### Navigation Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Tabs` | `Tabs` | Similar API |
| `Tab` | `Tabs.Tab` | Part of Tabs component |
| `Breadcrumbs` | `Breadcrumbs` | Similar API |
| `Link` | `Anchor` | For text links |
| `Menu` | `Menu` | Similar API |
| `MenuItem` | `Menu.Item` | Part of Menu component |
| `BottomNavigation` | `NavLink` + custom styling | Build with NavLink |
| `Pagination` | `Pagination` | Similar API |
| `Stepper` | `Stepper` | Similar API |

### Inputs and Forms

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `TextField` | `TextInput` | More focused API |
| `Select` | `Select` | Similar API |
| `Checkbox` | `Checkbox` | Similar API |
| `Radio` | `Radio` | Similar API |
| `Switch` | `Switch` | Similar API |
| `Slider` | `Slider` | Similar API |
| `Autocomplete` | `Autocomplete` | Similar API |
| `Button` | `Button` | Similar API |
| `IconButton` | `ActionIcon` | Dedicated component for icon buttons |
| `ButtonGroup` | `Button.Group` | Part of Button component |
| `FormControl` | `@mantine/form` | Use form library |
| `FormHelperText` | Input `description` prop | Part of input components |
| `InputLabel` | Input `label` prop | Part of input components |
| `FormGroup` | `Group` | Use Group for form layouts |
| `FormControlLabel` | Not needed | Labels are part of input components |
| `InputAdornment` | Input `leftSection`/`rightSection` | Part of input components |

### Data Display

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Typography` | `Text`, `Title` | Split into two components |
| `List` | `List` | Similar API |
| `ListItem` | `List.Item` | Part of List component |
| `Table` | `Table` | Similar API |
| `Avatar` | `Avatar` | Similar API |
| `Badge` | `Badge` | Similar API |
| `Chip` | `Badge` or `Chip` | Both available |
| `Divider` | `Divider` | Similar API |
| `Icon` | `@tabler/icons-react` | Use Tabler icons |
| `Tooltip` | `Tooltip` | Similar API |

### Feedback

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Dialog` | `Modal` | Similar API |
| `Snackbar` | `Notification` | Use `@mantine/notifications` |
| `Alert` | `Alert` | Similar API |
| `Backdrop` | `Overlay` | Similar API |
| `CircularProgress` | `Loader` | Similar API |
| `LinearProgress` | `Progress` | Similar API |
| `Skeleton` | `Skeleton` | Similar API |

### Surfaces

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Accordion` | `Accordion` | Similar API |
| `Card` | `Card` | Similar API |
| `CardContent` | `Card.Section` | Part of Card component |
| `CardHeader` | Custom with `Group` | Build with Group |
| `CardActions` | `Group` | Use Group for actions |
| `ExpansionPanel` | `Accordion` | Use Accordion instead |

### Utils

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `ClickAwayListener` | `@mantine/hooks` | Use `useClickOutside` hook |
| `Modal` | `Modal` | Similar API |
| `NoSsr` | Not needed | Handled differently |
| `Popover` | `Popover` | Similar API |
| `Popper` | `Popover` | Use Popover instead |
| `Portal` | `Portal` | Similar API |
| `Zoom` | `Transition` | Use Transition component |
| `Fade` | `Transition` | Use Transition component |
| `Grow` | `Transition` | Use Transition component |
| `Slide` | `Transition` | Use Transition component |

## Migration Strategy by Module

### 1. Core Layout Components

1. **AppShell**: Replace Material UI's Container/Box layout with Mantine's AppShell
2. **Navbar**: Replace Drawer with AppShell.Navbar
3. **Header**: Replace AppBar with AppShell.Header
4. **Footer**: Create custom footer with Box and Group

### 2. Authentication Module

1. **LoginForm**: Replace TextField with TextInput, Button remains similar
2. **RegisterForm**: Replace TextField with TextInput, Button remains similar
3. **ForgotPasswordForm**: Replace TextField with TextInput, Button remains similar
4. **ResetPasswordForm**: Replace TextField with TextInput, Button remains similar

### 3. Dashboard Module

1. **Dashboard Layout**: Replace Grid with Grid or SimpleGrid
2. **Stat Cards**: Replace Paper with Card
3. **Recent Activity**: Replace List with List
4. **Quick Start Buttons**: Replace Button with Button
5. **Status Indicators**: Replace Badge with Badge

### 4. Data Hub Module

1. **Tree View**: Use @mantine/core components with custom styling
2. **Editor Panel**: Replace Tabs with Tabs
3. **Form Fields**: Replace TextField with TextInput, Select with Select, etc.
4. **Action Buttons**: Replace Button with Button, IconButton with ActionIcon

### 5. Mind Map Module

1. **Visualization**: Keep Cytoscape.js integration
2. **Controls**: Replace IconButton with ActionIcon
3. **Filters**: Replace Select with Select
4. **Quick Actions**: Replace Button with ActionIcon

### 6. Timeline Module

1. **Timeline View**: Custom implementation with Mantine components
2. **Controls**: Replace Button with Button, IconButton with ActionIcon
3. **Filters**: Replace Select with Select
4. **Timeline Items**: Replace Paper with Card

### 7. AI Brain Module

1. **Review Queue**: Replace List with List
2. **Story-Telling Mode**: Replace TextField with TextInput, Button with Button
3. **Generation Tools**: Replace Card with Card, Button with Button

### 8. Live Play Module

1. **Recording HUD**: Replace Button with Button
2. **Combat Tracker**: Replace Table with Table
3. **Dice Roller**: Replace Button with Button
4. **Transcript Stream**: Replace List with List

### 9. Transcripts Manager Module

1. **Transcript List**: Replace List with List
2. **Inline Editor**: Replace TextField with Textarea
3. **Speaker Tags**: Replace Chip with Badge or Chip
4. **Action Buttons**: Replace Button with Button, IconButton with ActionIcon

### 10. Image Library Module

1. **Image Grid**: Replace Grid with SimpleGrid
2. **Filters**: Replace Select with Select
3. **Image Cards**: Replace Card with Card
4. **Upload Interface**: Replace Button with Button, use @mantine/dropzone

### 11. Analytics Module

1. **Visualizations**: Keep chart libraries, update containers
2. **Controls**: Replace Button with Button, Select with Select
3. **Data Tables**: Replace Table with Table

### 12. Search Module

1. **Search Input**: Replace TextField with TextInput
2. **Results List**: Replace List with List
3. **Filters**: Replace Chip with Badge or Chip

### 13. Settings Module

1. **Settings Panels**: Replace Tabs with Tabs
2. **Form Fields**: Replace TextField with TextInput, Select with Select, etc.
3. **Action Buttons**: Replace Button with Button

## Testing Strategy

1. **Component Tests**: Test each migrated component in isolation
2. **Integration Tests**: Test interactions between migrated components
3. **Visual Regression Tests**: Compare before/after screenshots
4. **Accessibility Tests**: Ensure accessibility is maintained or improved
5. **Performance Tests**: Measure performance improvements

## Implementation Timeline

1. **Phase 1: Core Layout and Authentication** (1 week)
2. **Phase 2: Dashboard and Data Hub** (2 weeks)
3. **Phase 3: Mind Map and Timeline** (2 weeks)
4. **Phase 4: AI Brain and Live Play** (2 weeks)
5. **Phase 5: Transcripts and Image Library** (2 weeks)
6. **Phase 6: Analytics, Search, and Settings** (1 week)

## Conclusion

This migration plan provides a comprehensive roadmap for transitioning from Material UI to Mantine. By following this plan, we can ensure a smooth migration with minimal disruption to the application's functionality while improving performance, maintainability, and user experience.
