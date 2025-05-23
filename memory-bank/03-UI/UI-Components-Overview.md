# UI Components Overview in RPG Archivist

## Overview
This document provides a comprehensive overview of the UI components in the RPG Archivist application, consolidating information from various UI-focused files.

> **Note**: This document has been updated to align with the comprehensive UI Design Master Plan. See `UI-Design-Master-Plan.md` for the complete design specifications and `UI-Components-Technical-Specification.md` for detailed technical implementation details.

## Layout Components

### AppLayout
- **Purpose**: Provides the overall layout of the application
- **Components**: Sidebar, Header, Main Content Area, Footer
- **Features**: Responsive design, collapsible sidebar, dark mode support

### Sidebar
- **Purpose**: Provides navigation for the application
- **Components**: Logo, User Info, Navigation Links, Collapse Button
- **Features**: Collapsible, responsive, role-based navigation

### Header
- **Purpose**: Provides context and actions for the current page
- **Components**: Page Title, Actions, Search, User Menu
- **Features**: Sticky positioning, responsive design

### Footer
- **Purpose**: Provides copyright and additional links
- **Components**: Copyright Text, Links, Version Info
- **Features**: Responsive design, always at bottom

## Entity Components

### EntityList
- **Purpose**: Displays a list of entities
- **Components**: List Items, Pagination, Filters, Sort Controls
- **Features**: Infinite scrolling, filtering, sorting, search

### EntityCard
- **Purpose**: Displays a summary of an entity
- **Components**: Image, Title, Description, Actions
- **Features**: Responsive design, hover effects, action menu

### EntityDetail
- **Purpose**: Displays detailed information about an entity
- **Components**: Header, Tabs, Content Sections, Related Entities
- **Features**: Responsive design, tabbed interface, edit mode

### EntityForm
- **Purpose**: Provides a form for creating or editing an entity
- **Components**: Form Fields, Validation, Submit Button, Cancel Button
- **Features**: Validation, autosave, form state management

## Relationship Components

### RelationshipManager
- **Purpose**: Manages relationships between entities
- **Components**: Relationship List, Relationship Form, Relationship Card
- **Features**: Add, edit, delete relationships, filter by type

### RelationshipCard
- **Purpose**: Displays a summary of a relationship
- **Components**: Entity Images, Relationship Type, Description, Actions
- **Features**: Responsive design, hover effects, action menu

### RelationshipForm
- **Purpose**: Provides a form for creating or editing a relationship
- **Components**: Entity Selectors, Relationship Type Selector, Description Field
- **Features**: Validation, entity search, relationship type suggestions

### RelationshipTimeline
- **Purpose**: Displays a timeline of relationship events
- **Components**: Timeline Items, Filters, Zoom Controls
- **Features**: Interactive timeline, filtering, zooming

## Visualization Components

### MindMap
- **Purpose**: Provides a graph visualization of relationships
- **Components**: Graph, Controls, Filters, Legend
- **Features**: Interactive graph, zoom, pan, filtering, export
- **New Features**:
  - 2D/3D visualization toggle
  - Entity type color coding with glow effects
  - Quick action buttons (View in Hub, Related Images, Go to Timeline)
  - Bidirectional sync with Data Hub

### Timeline
- **Purpose**: Provides a timeline visualization of events
- **Components**: Timeline Items, Filters, Zoom Controls
- **Features**: Interactive timeline, filtering, zooming, event details
- **New Features**:
  - Toggle between in-game and real-life timelines
  - Session pills for quick access to session details
  - Event markers with tooltips
  - Zoom wheel / d-pad left-right navigation

### Map
- **Purpose**: Provides a map visualization of locations
- **Components**: Map, Markers, Controls, Filters
- **Features**: Interactive map, zoom, pan, filtering, location details

### Analytics
- **Purpose**: Provides visualizations of analytics data
- **Components**: Charts, Graphs, Tables, Filters
- **Features**: Interactive charts, filtering, export
- **New Features**:
  - Relationship strength heat-map
  - NPC screen-time vs prominence analysis
  - Session pacing metrics (words per minute, talk-time split)
  - Export functionality for reports

## Form Components

### FormField
- **Purpose**: Provides a standardized form field
- **Components**: Label, Input, Error Message, Help Text
- **Features**: Validation, error handling, focus management

### FormSection
- **Purpose**: Groups related form fields
- **Components**: Section Title, Form Fields, Collapse Button
- **Features**: Collapsible, validation summary

### FormActions
- **Purpose**: Provides action buttons for a form
- **Components**: Submit Button, Cancel Button, Additional Actions
- **Features**: Responsive design, loading state, confirmation dialogs

### FormValidation
- **Purpose**: Provides form validation
- **Components**: Validation Rules, Error Messages, Validation Summary
- **Features**: Field-level validation, form-level validation, custom rules

## Image Components

### ImageUploader
- **Purpose**: Provides image upload functionality
- **Components**: File Input, Preview, Crop Tool, Upload Button
- **Features**: Drag and drop, image preview, cropping, progress indicator

### ImageGallery
- **Purpose**: Displays a gallery of images
- **Components**: Image Grid, Pagination, Filters, Sort Controls
- **Features**: Infinite scrolling, filtering, sorting, lightbox

### ImageSelector
- **Purpose**: Selects images for an entity
- **Components**: Image Grid, Search, Filters, Selected Images
- **Features**: Multi-select, search, filtering, preview

### ImageViewer
- **Purpose**: Displays a full-size image
- **Components**: Image, Controls, Metadata
- **Features**: Zoom, pan, rotate, download, share

## Authentication Components

### LoginForm
- **Purpose**: Provides login functionality
- **Components**: Email Field, Password Field, Submit Button, Remember Me
- **Features**: Validation, error handling, remember me, forgot password

### RegisterForm
- **Purpose**: Provides registration functionality
- **Components**: Name Field, Email Field, Password Field, Submit Button
- **Features**: Validation, error handling, terms acceptance

### ForgotPasswordForm
- **Purpose**: Provides forgot password functionality
- **Components**: Email Field, Submit Button
- **Features**: Validation, error handling, success message

### ResetPasswordForm
- **Purpose**: Provides password reset functionality
- **Components**: Password Field, Confirm Password Field, Submit Button
- **Features**: Validation, error handling, password strength indicator

## Utility Components

### Notification
- **Purpose**: Displays notifications to the user
- **Components**: Message, Icon, Actions, Close Button
- **Features**: Different types (success, error, warning, info), auto-dismiss

### ConfirmDialog
- **Purpose**: Requests confirmation from the user
- **Components**: Message, Confirm Button, Cancel Button
- **Features**: Custom messages, destructive action warning

### LoadingIndicator
- **Purpose**: Indicates loading state
- **Components**: Spinner, Progress Bar, Skeleton
- **Features**: Different sizes, inline or overlay, progress indication

### ErrorBoundary
- **Purpose**: Catches and displays errors
- **Components**: Error Message, Retry Button, Report Button
- **Features**: Detailed error information, retry functionality, error reporting

## Provider Components

### ProviderCard
- **Purpose**: Displays information about a provider
- **Components**: Provider Icon, Name, Description, Status, Actions
- **Features**: Status indicator, action menu, subscription badge

### ProviderConfig
- **Purpose**: Configures a provider
- **Components**: Form Fields, Test Button, Save Button
- **Features**: Validation, test functionality, subscription-aware fields

### ProviderMetrics
- **Purpose**: Displays provider usage metrics
- **Components**: Charts, Graphs, Tables, Filters
- **Features**: Interactive charts, filtering, date range selection

### ProviderList
- **Purpose**: Displays a list of providers
- **Components**: Provider Cards, Filters, Sort Controls
- **Features**: Filtering by kind, sorting, search

## AI Brain Components

### ReviewQueue
- **Purpose**: Provides a queue of AI-generated proposals for review
- **Components**: Proposal Cards, Filters, Sort Controls
- **Features**: Approve, Merge, Reject actions, filtering by type

### StoryTellingMode
- **Purpose**: Provides a guided storytelling experience
- **Components**: Session Summary, Follow-up Questions, Voice Input
- **Features**: System narrates summary of last session, asks follow-up questions, answers auto-apply to Data Hub

### GenerationTools
- **Purpose**: Provides tools for generating content
- **Components**: Tool Cards, Input Form, Results
- **Features**: "Describe selected node", "Create NPCs", "Rewrite transcript line as summary"

## Live Play Components

### RecordingHUD
- **Purpose**: Provides a heads-up display for recording sessions
- **Components**: Recording Controls, Turn Order, Dice Roller, Live Transcript
- **Features**: Start/stop recording, turn tracking, dice rolling, live transcription

### CombatTracker
- **Purpose**: Tracks combat encounters
- **Components**: Initiative Order, Character Stats, Action Buttons
- **Features**: Initiative tracking, HP tracking, condition tracking

### DiceRoller
- **Purpose**: Provides virtual dice rolling
- **Components**: Dice Selection, Roll Button, Results
- **Features**: Different dice types, multiple dice, roll history

### TranscriptManager
- **Purpose**: Manages session transcripts
- **Components**: Transcript List, Inline Editor, Speaker Tags
- **Features**: List view with status and duration, inline editing, bulk approval

## Conclusion
The UI components in RPG Archivist provide a comprehensive set of building blocks for creating a rich and interactive user interface. The components are designed to be reusable, responsive, and accessible, with a focus on providing a consistent user experience across the application. The component architecture allows for easy extension and customization, enabling the application to evolve and grow over time.

The new components from the UI Design Master Plan enhance the application with advanced features like AI-assisted storytelling, live session recording, and sophisticated visualizations. These components are designed to work together seamlessly, providing a cohesive and intuitive user experience for tabletop RPG players and game masters.
