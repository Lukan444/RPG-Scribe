# Component-by-Component Mapping: Material UI to Mantine

This document provides a detailed mapping of components from Material UI to their Mantine equivalents, organized by module. It serves as a reference for the migration process, ensuring that all functionality is preserved while taking advantage of Mantine's features.

## Core UI Components

### Layout Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Box` | `Box` | Similar API, but use CSS modules for styling |
| `Container` | `Container` | Similar API with responsive width |
| `Grid` | `Grid` or `SimpleGrid` | `Grid` for complex layouts, `SimpleGrid` for uniform grids |
| `Stack` | `Stack` | Similar API for vertical stacking |
| `Paper` | `Paper` | Similar API for surface elements |
| `Card` | `Card` | Use `Card.Section` for card sections |
| `Divider` | `Divider` | Similar API with label support |
| `Hidden` | `@mantine/hooks` | Use `useMediaQuery` hook instead |
| `CssBaseline` | Not needed | Mantine includes global styles |

### Navigation Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `AppBar` | `AppShell.Header` | Part of the `AppShell` component |
| `Drawer` | `AppShell.Navbar` or `Drawer` | Use `AppShell.Navbar` for permanent navigation, `Drawer` for temporary |
| `Tabs` | `Tabs` | Similar API with `Tabs.Tab` and `Tabs.Panel` |
| `Breadcrumbs` | `Breadcrumbs` | Similar API |
| `Link` | `Anchor` | For text links |
| `Menu` | `Menu` | Use `Menu.Target` and `Menu.Dropdown` |
| `MenuItem` | `Menu.Item` | Part of `Menu` component |
| `BottomNavigation` | `NavLink` + custom styling | Build with `NavLink` components |
| `Pagination` | `Pagination` | Similar API |
| `Stepper` | `Stepper` | Similar API with `Stepper.Step` |

### Input Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `TextField` | `TextInput` | For single-line text input |
| `TextField multiline` | `Textarea` | For multi-line text input |
| `Select` | `Select` | Similar API with improved styling |
| `Autocomplete` | `Autocomplete` | Similar API with improved filtering |
| `Checkbox` | `Checkbox` | Similar API |
| `Radio` | `Radio` | Use with `Radio.Group` |
| `Switch` | `Switch` | Similar API |
| `Slider` | `Slider` | Similar API with improved features |
| `Button` | `Button` | Similar API with more variants |
| `IconButton` | `ActionIcon` | Dedicated component for icon buttons |
| `ButtonGroup` | `Button.Group` | Part of `Button` component |
| `FormControl` | `@mantine/form` | Use form library |
| `FormHelperText` | Input `description` prop | Part of input components |
| `InputLabel` | Input `label` prop | Part of input components |
| `FormGroup` | `Group` | Use `Group` for form layouts |
| `InputAdornment` | Input `leftSection`/`rightSection` | Part of input components |

### Feedback Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Dialog` | `Modal` | Similar API with improved styling |
| `Snackbar` | `Notifications` | Use `@mantine/notifications` package |
| `Alert` | `Alert` | Similar API with more variants |
| `Backdrop` | `Overlay` | Similar API for overlay effects |
| `CircularProgress` | `Loader` | Similar API with more variants |
| `LinearProgress` | `Progress` | Similar API with more features |
| `Skeleton` | `Skeleton` | Similar API for loading states |
| `Tooltip` | `Tooltip` | Similar API with more positioning options |

### Data Display Components

| Material UI | Mantine | Notes |
|-------------|---------|-------|
| `Typography` | `Text`, `Title` | Use `Text` for paragraphs, `Title` for headings |
| `List` | `List` | Similar API with `List.Item` |
| `Table` | `Table` | Similar API with more features |
| `Avatar` | `Avatar` | Similar API with `Avatar.Group` |
| `Badge` | `Badge` | Similar API with more variants |
| `Chip` | `Badge` or `Chip` | Use `Badge` for labels, `Chip` for interactive elements |
| `Icon` | `@tabler/icons-react` | Use Tabler icons library |
| `Collapse` | `Collapse` | Similar API for expandable content |
| `Accordion` | `Accordion` | Use with `Accordion.Item` and `Accordion.Control` |

## Module-Specific Components

### Authentication Module

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Login Form | `TextInput`, `PasswordInput`, `Button` | Use `@mantine/form` for form handling |
| Register Form | `TextInput`, `PasswordInput`, `Button` | Use `@mantine/form` for form handling |
| Forgot Password Form | `TextInput`, `Button` | Use `@mantine/form` for form handling |
| Reset Password Form | `PasswordInput`, `Button` | Use `@mantine/form` for form handling |
| Auth Layout | `Center`, `Paper`, `Stack` | Create a centered layout for auth forms |

### Data Hub Module

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Tree View | `Tree` | Use for hierarchical data display |
| Entity List | `Table`, `Card`, `List` | Use for displaying entity lists |
| Entity Editor | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |
| Entity Form | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |
| Data Hub Layout | `AppShell`, `Grid` | Create a responsive layout |

### Mind Map Module

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Mind Map Visualization | Custom component with Cytoscape.js | Integrate Cytoscape.js with Mantine styling |
| Mind Map Controls | `ActionIcon`, `Button`, `SegmentedControl` | Create control panel with Mantine components |
| Mind Map Details | `Paper`, `Stack`, `Text` | Create details panel with Mantine components |
| Mind Map Legend | `Paper`, `Group`, `Text` | Create legend with Mantine components |

### Timeline Module

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Timeline Visualization | Custom component | Create custom timeline visualization with Mantine styling |
| Timeline Controls | `SegmentedControl`, `Button`, `Select` | Create control panel with Mantine components |
| Timeline Item | `Paper`, `Text`, `Badge` | Create timeline item component |
| Timeline Details | `Paper`, `Stack`, `Text` | Create details panel with Mantine components |

### AI Brain Module

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Review Queue | `Card`, `Stack`, `Button` | Create review queue with Mantine components |
| Story-Telling Mode | `Paper`, `TextInput`, `Button` | Create storytelling interface with Mantine components |
| Generation Tools | `Card`, `Button`, `Group` | Create generation tools interface |
| Voice I/O | `ActionIcon`, `Paper` | Create voice input/output interface |

### Campaign and Session Management

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Campaign List | `Table`, `Card`, `List` | Create campaign list with Mantine components |
| Campaign Detail | `Grid`, `Paper`, `Text` | Create campaign detail view |
| Campaign Form | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |
| Session List | `Table`, `Card`, `List` | Create session list with Mantine components |
| Session Detail | `Grid`, `Paper`, `Text` | Create session detail view |
| Session Form | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |
| Session Recording | `ActionIcon`, `Paper`, `Progress` | Create recording interface |

### Entity Management

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Character List | `Table`, `Card`, `List` | Create character list with Mantine components |
| Character Detail | `Grid`, `Paper`, `Text` | Create character detail view |
| Character Form | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |
| Location List | `Table`, `Card`, `List` | Create location list with Mantine components |
| Location Detail | `Grid`, `Paper`, `Text` | Create location detail view |
| Location Form | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |
| Event List | `Table`, `Card`, `List` | Create event list with Mantine components |
| Event Detail | `Grid`, `Paper`, `Text` | Create event detail view |
| Event Form | `TextInput`, `Textarea`, `Select`, etc. | Use `@mantine/form` for form handling |

### Content Management

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Transcript List | `Table`, `Card`, `List` | Create transcript list with Mantine components |
| Transcript Editor | `Textarea`, `Button`, `Group` | Create transcript editor interface |
| Image Grid | `SimpleGrid`, `Image`, `Card` | Create image grid with Mantine components |
| Image Upload | `Dropzone` from `@mantine/dropzone` | Use Mantine's dropzone for file uploads |
| Image Details | `Grid`, `Paper`, `Text` | Create image detail view |
| Content Analysis | `Paper`, `Text`, `Progress` | Create content analysis interface |

### Search and Settings

| Material UI | Mantine | Implementation |
|-------------|---------|----------------|
| Global Search | `TextInput`, `Paper`, `List` | Create global search interface |
| Search Results | `Table`, `Card`, `List` | Create search results display |
| Settings Dashboard | `Tabs`, `Paper`, `Stack` | Create settings dashboard |
| User Settings | `TextInput`, `Switch`, `Button` | Create user settings interface |
| LLM Settings | `TextInput`, `Select`, `Button` | Create LLM settings interface |
| Provider Settings | `TextInput`, `Select`, `Button` | Create provider settings interface |
| Transcript Settings | `TextInput`, `Select`, `Button` | Create transcript settings interface |

## Implementation Best Practices

1. **Use CSS Modules**: Replace Material UI's JSS-based styling with CSS modules for better performance and maintainability.

2. **Leverage Compound Components**: Use Mantine's compound component structure (e.g., `Tabs.Tab`, `Menu.Item`) for better organization.

3. **Add 'use client' Directive**: When using hooks or compound components in Next.js, add the 'use client' directive at the top of the file.

4. **Use @mantine/form**: Replace Material UI's form handling with Mantine's `useForm` hook for better form state management and validation.

5. **Implement Accessibility**: Ensure all components have proper accessibility attributes, especially for custom components.

6. **Use Responsive Design**: Leverage Mantine's responsive props and `@mantine/hooks` for responsive design.

7. **Optimize Performance**: Use Mantine's uncontrolled mode for forms and other optimizations for better performance.

8. **Consistent Theming**: Use Mantine's theme system consistently across all components for a unified look and feel.

## Conclusion

This component-by-component mapping provides a comprehensive guide for migrating from Material UI to Mantine. By following this mapping and the associated best practices, developers can ensure a smooth transition while preserving all functionality and improving the overall user experience.
