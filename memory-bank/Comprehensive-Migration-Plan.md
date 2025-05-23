# Comprehensive Migration Plan: Material UI to Mantine

## Overview

This document outlines a comprehensive plan for migrating the RPG Archivist application from Material UI to Mantine. The plan is based on a thorough analysis of both the old project structure and Mantine's best practices, ensuring that all features are preserved while improving the architecture and avoiding dependency issues.

## Project Structure

The new project structure will follow a modular approach, organized by feature:

```
src/
├── assets/            # Static assets (images, fonts, etc.)
│   └── images/        # Images including placeholders
├── components/        # Reusable components
│   ├── auth/          # Authentication components
│   ├── brain/         # AI Brain components
│   ├── campaigns/     # Campaign components
│   ├── characters/    # Character components
│   ├── common/        # Common UI components
│   ├── data-hub/      # Data Hub components
│   ├── events/        # Event components
│   ├── forms/         # Form components
│   ├── images/        # Image handling components
│   ├── layouts/       # Layout components
│   ├── locations/     # Location components
│   ├── mind-map/      # Mind Map components
│   ├── navigation/    # Navigation components
│   ├── proposals/     # Proposal components
│   ├── search/        # Search components
│   ├── sessions/      # Session components
│   ├── settings/      # Settings components
│   ├── storytelling/  # Storytelling components
│   ├── timeline/      # Timeline components
│   ├── transcripts/   # Transcript components
│   └── ui/            # Basic UI components
├── contexts/          # Context providers
├── hooks/             # Custom hooks
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   ├── brain/         # AI Brain pages
│   ├── campaigns/     # Campaign pages
│   ├── characters/    # Character pages
│   ├── data-hub/      # Data Hub pages
│   ├── events/        # Event pages
│   ├── locations/     # Location pages
│   ├── mind-map/      # Mind Map pages
│   ├── proposals/     # Proposal pages
│   ├── rpg-worlds/    # RPG World pages
│   ├── search/        # Search pages
│   ├── sessions/      # Session pages
│   ├── settings/      # Settings pages
│   ├── storytelling/  # Storytelling pages
│   ├── timeline/      # Timeline pages
│   └── user/          # User pages
├── services/          # API services
├── store/             # State management
├── theme/             # Theme configuration
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## Migration Strategy

### Phase 1: Setup and Core Infrastructure (1 week)

1. **Project Setup**
   - Install Mantine and dependencies
   - Configure PostCSS for Mantine
   - Set up theme configuration with CSS variables
   - Configure routing with React Router

2. **Core Layout Components**
   - Implement AppShell (replaces Container/Box layout)
   - Implement Navbar (replaces Drawer)
   - Implement Header (replaces AppBar)
   - Implement responsive layout

3. **Theme Configuration**
   - Define color palette based on the original design
   - Set up typography, spacing, and other theme variables
   - Configure component defaults

4. **Authentication Infrastructure**
   - Set up authentication context
   - Implement protected routes
   - Configure API client with authentication

### Phase 2: Authentication and User Management (1 week)

1. **Authentication Components**
   - Implement Login form
   - Implement Register form
   - Implement Forgot Password form
   - Implement Reset Password form

2. **User Management**
   - Implement Profile page
   - Implement Settings page
   - Implement user preferences

3. **Form Infrastructure**
   - Set up form handling with @mantine/form
   - Implement form validation utilities
   - Create reusable form components

### Phase 3: Core Features - Data Hub and Mind Map (2 weeks)

1. **Data Hub Components**
   - Implement Tree View
   - Implement Entity List
   - Implement Entity Editor
   - Implement Entity Form
   - Set up entity context

2. **Mind Map Components**
   - Implement Mind Map visualization with Cytoscape.js
   - Implement Mind Map controls
   - Implement Mind Map details panel
   - Implement Mind Map legend

3. **Common Entity Components**
   - Implement entity card components
   - Implement entity form components
   - Implement entity detail components

### Phase 4: Campaign and Session Management (2 weeks)

1. **Campaign Components**
   - Implement Campaign List
   - Implement Campaign Detail
   - Implement Campaign Create/Edit forms
   - Implement Campaign Dashboard

2. **Session Components**
   - Implement Session List
   - Implement Session Detail
   - Implement Session Create/Edit forms
   - Implement Session Recording

3. **Timeline Components**
   - Implement Timeline visualization
   - Implement Timeline controls
   - Implement Timeline items
   - Implement Timeline filters

### Phase 5: Entity Management (2 weeks)

1. **Character Components**
   - Implement Character List
   - Implement Character Detail
   - Implement Character Create/Edit forms
   - Implement Character Relationships

2. **Location Components**
   - Implement Location List
   - Implement Location Detail
   - Implement Location Create/Edit forms
   - Implement Location Map

3. **Event Components**
   - Implement Event List
   - Implement Event Detail
   - Implement Event Create/Edit forms
   - Implement Event Timeline

4. **RPG World Components**
   - Implement RPG World List
   - Implement RPG World Detail
   - Implement RPG World Create/Edit forms
   - Implement World Building Dashboard

### Phase 6: AI Features (2 weeks)

1. **AI Brain Components**
   - Implement Review Queue
   - Implement Story-Telling Mode
   - Implement Generation Tools
   - Implement Voice I/O integration

2. **Proposal Components**
   - Implement Proposal List
   - Implement Proposal Detail
   - Implement Proposal Review
   - Implement Proposal Management

3. **Storytelling Components**
   - Implement Storytelling Dashboard
   - Implement Storytelling Tools
   - Implement Storytelling Prompts
   - Implement Storytelling History

### Phase 7: Content Management (2 weeks)

1. **Transcript Components**
   - Implement Transcript List
   - Implement Transcript Editor
   - Implement Speaker Tags
   - Implement Transcript Processing

2. **Image Components**
   - Implement Image Grid
   - Implement Image Upload
   - Implement Image Details
   - Implement Image Tagging

3. **Content Analysis Components**
   - Implement Content Analysis Dashboard
   - Implement Content Analysis Tools
   - Implement Content Analysis Reports
   - Implement Content Analysis Visualization

### Phase 8: Search and Settings (1 week)

1. **Search Components**
   - Implement Global Search
   - Implement Search Results
   - Implement Search Filters
   - Implement Advanced Search

2. **Settings Components**
   - Implement Settings Dashboard
   - Implement LLM Settings
   - Implement Provider Settings
   - Implement Transcript Settings
   - Implement User Settings

## Component Mapping

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

## Styling Migration

### From Material UI Styling to Mantine CSS

1. **CSS Modules**
   - Create `.module.css` files for component-specific styles
   - Use CSS variables for theme values
   - Use the `light-dark` function for theme-dependent styles

2. **Global Styles**
   - Create a global CSS file for app-wide styles
   - Import Mantine core styles: `@mantine/core/styles.css`
   - Define global CSS variables

3. **Theme Configuration**
   - Use `createTheme` to define the theme
   - Set component defaults with `components` property
   - Use `MantineProvider` to provide the theme

## Form Handling Migration

### From Material UI Forms to @mantine/form

1. **Form Initialization**
   - Use `useForm` hook to initialize forms
   - Set `mode: 'uncontrolled'` for better performance
   - Define initial values and validation rules

2. **Form Validation**
   - Use inline validation functions
   - Use schema validation with Zod, Yup, or Joi
   - Use built-in validators like `isNotEmpty`, `isEmail`, etc.

3. **Form Submission**
   - Use `form.onSubmit` to handle form submission
   - Handle validation errors
   - Implement form reset functionality

## Testing Strategy

1. **Component Tests**
   - Test each migrated component in isolation
   - Verify component behavior matches the original
   - Test component interactions

2. **Integration Tests**
   - Test interactions between migrated components
   - Verify page behavior matches the original
   - Test form submission and validation

3. **End-to-End Tests**
   - Test critical user flows
   - Verify application behavior matches the original
   - Test responsive design

## Implementation Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: Setup and Core Infrastructure | 1 week | TBD | TBD |
| Phase 2: Authentication and User Management | 1 week | TBD | TBD |
| Phase 3: Core Features - Data Hub and Mind Map | 2 weeks | TBD | TBD |
| Phase 4: Campaign and Session Management | 2 weeks | TBD | TBD |
| Phase 5: Entity Management | 2 weeks | TBD | TBD |
| Phase 6: AI Features | 2 weeks | TBD | TBD |
| Phase 7: Content Management | 2 weeks | TBD | TBD |
| Phase 8: Search and Settings | 1 week | TBD | TBD |

## Database Integration

The RPG Archivist application previously used Neo4j as its database, which is well-suited for the graph-based relationships between entities. We'll maintain this approach with some enhancements:

### Database Architecture

1. **Graph Database (Neo4j)**
   - Store entity relationships
   - Support complex graph queries
   - Enable visualization of connections

2. **Data Access Layer**
   - Implement repository pattern
   - Create service layer for business logic
   - Add caching for performance optimization

3. **API Integration**
   - Create RESTful endpoints for CRUD operations
   - Implement GraphQL for complex queries
   - Set up WebSocket connections for real-time updates

4. **State Management**
   - Use React Query or SWR for data fetching and caching
   - Implement optimistic updates for better UX
   - Handle offline support with local storage

## Entity Management Details

The Entity Management module handles various entity types that make up a campaign:

### Core Entities

1. **Campaign**
   - Properties: name, description, setting, system, start_date, status
   - Relationships: has many sessions, characters, locations, events, items
   - UI Components: `Card`, `Tabs`, `TextInput`, `Select`, `DatePicker`

2. **Character**
   - Properties: name, race, class, level, background, alignment, description
   - Types: PC (Player Character), NPC (Non-Player Character)
   - Relationships: belongs to campaign, appears in sessions, has relationships with other characters
   - UI Components: `Card`, `Avatar`, `Tabs`, `TextInput`, `Select`, `Textarea`

3. **Location**
   - Properties: name, type, description, geography, climate
   - Types: city, dungeon, wilderness, building, plane
   - Relationships: belongs to campaign, contains other locations, contains characters
   - UI Components: `Card`, `Image`, `Tabs`, `TextInput`, `Select`, `Textarea`

4. **Event**
   - Properties: name, description, date, importance
   - Types: battle, social, discovery, plot point
   - Relationships: belongs to campaign, occurs at location, involves characters
   - UI Components: `Card`, `Timeline`, `Tabs`, `TextInput`, `Select`, `Textarea`

5. **Item**
   - Properties: name, type, description, rarity, attunement
   - Types: weapon, armor, potion, scroll, wondrous item, artifact
   - Relationships: belongs to campaign, owned by character, found at location
   - UI Components: `Card`, `Image`, `Tabs`, `TextInput`, `Select`, `Textarea`

6. **Session**
   - Properties: number, title, date_played, summary
   - Relationships: belongs to campaign, includes characters, locations, events
   - UI Components: `Card`, `Timeline`, `Tabs`, `TextInput`, `DatePicker`, `Textarea`

7. **Relationship**
   - Properties: type, description, strength
   - Types: ally, enemy, family, romantic, professional
   - Relationships: connects two entities (usually characters)
   - UI Components: `Card`, `Select`, `Slider`, `Textarea`

## Transcription Module Details

The Transcription Module converts spoken game sessions into searchable, analyzable text:

### Key Features

1. **Audio Recording**
   - Multi-channel recording for different speakers
   - Noise reduction and audio enhancement
   - UI Components: `ActionIcon`, `Progress`, `Badge`

2. **Speech-to-Text Conversion**
   - Real-time transcription during sessions
   - Speaker diarization (identifying who is speaking)
   - UI Components: `Paper`, `Text`, `Avatar`

3. **Transcript Enhancement**
   - Automatic punctuation and formatting
   - Entity recognition and linking
   - UI Components: `Badge`, `Popover`, `Anchor`

4. **Transcript Management**
   - Interactive transcript editor
   - Scene and chapter marking
   - UI Components: `Textarea`, `Tabs`, `Button`, `Select`

## AI Brain Details

The AI Brain module analyzes data from all other modules to provide insights and assistance:

### Key Features

1. **Data Analysis**
   - Dialogue pattern recognition
   - Character development tracking
   - Plot thread identification
   - UI Components: `Paper`, `Text`, `Progress`, custom visualizations

2. **Proposal Generation**
   - Character development suggestions
   - Plot hook recommendations
   - UI Components: `Card`, `Stack`, `Button`, `Badge`

3. **Storytelling Assistance**
   - NPC dialogue generation
   - Scene description enhancement
   - UI Components: `TextInput`, `Button`, `Paper`, `ActionIcon`

4. **Game Master Support**
   - Session preparation assistance
   - Player engagement optimization
   - UI Components: `Card`, `List`, `Button`, `Progress`

## Conclusion

This comprehensive migration plan provides a detailed roadmap for transitioning the RPG Archivist application from Material UI to Mantine. By following this plan, we can ensure that all features from the original application are preserved while improving the architecture, performance, and user experience. The detailed specifications for database integration, entity management, transcription, and AI Brain modules will guide the implementation of these complex features.
