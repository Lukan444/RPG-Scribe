# RPG Archivist UI Design Master Plan

## Overview

This document outlines the comprehensive UI design for the RPG Archivist application, including all major screens, navigation flows, and implementation details. This master plan serves as the definitive reference for UI development and ensures consistency across all components.

## Visual Design Language

The RPG Archivist UI follows a dark-themed, sci-fi/fantasy aesthetic with glowing teal accents and clean, information-rich layouts.

### Color Palette
- Primary Background: Deep dark blue/black (#0D1117)
- Secondary Background: Dark blue/gray panels (#1A2233)
- Primary Accent: Teal/turquoise (#1A9B9B)
- Secondary Accent: Gold/amber (#F6AD55)
- Text Primary: White (#FFFFFF)
- Text Secondary: Light gray (#A0AEC0)
- Success: Green (#48BB78)
- Warning: Amber (#F6AD55)
- Error: Red (#F56565)

### Typography
- Headings: Inter, sans-serif, bold
- Body: Inter, sans-serif, regular
- App Title: Serif font for "RPG Archivist" logo
- Monospace: JetBrains Mono for code snippets

### Iconography
- Feather icons for UI controls
- Custom RPG-themed icons for entity types
- Glowing teal effect for interactive elements
- Consistent sizing and padding

### Visual Effects
- Subtle glow effects on interactive elements using the teal accent color
- Card components with rounded corners (8px radius)
- Subtle borders or shadows to define card boundaries
- Outline maps and visualizations with glowing effect
- Dark mode as the default and primary design

### Card Design
- Clean, dark panels with subtle borders
- Consistent padding (16px-24px)
- Clear visual hierarchy with headings and content
- Information-dense but well-organized layouts

## UI Architecture

The RPG Archivist UI is built with a responsive design that adapts to different screen sizes and devices:

- **Desktop**: 3-pane layout (tree / list / editor) for screens ≥ 1280px
- **Tablet & Shield TV**: 2-pane layout
- **Mobile**: Stacked accordions

The application uses a sidebar/drawer navigation system that provides access to all major sections, with consistent navigation patterns and smart-links between related views.

## Screen Map

```
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Dashboard                                                                  │
 │ ────────────────────────────────────────────────────────────────────────── │
 │ • Outstanding Tasks (AI proposals, conflicts, missing‑fields)              │
 │ • Campaign Health gauge                                                    │
 │ • Recent Activity                                                          │
 │ • Quick Start  ── New World · New Campaign · New Session · Start Rec.      │
 │ • Live DB / WebSocket status dot                                           │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Data Hub  (hierarchy + editor)                                             │
 │ ────────────────────────────────────────────────────────────────────────── │
 │ Worlds                                                                     │
 │   ├─ Locations                                                             │
 │   ├─ Factions / Organizations                                              │
 │   ├─ Items (global artefacts)                                              │
 │   └─ Campaigns                                                             │
 │        └─ Sessions                                                         │
 │             ├─ Events / Notes                                              │
 │             └─ Transcripts                                                 │
 │                                                                              Tree node extras                                Editor Tabs
 │ Characters                                                                 │   ─────────────────────────────────   ────────────────────────────
 │   ├─ Inventory  (items owned)                                              │   context‑menu  [+] Add …          │ • Details      • Stat‑block
 │   ├─ Powers / Abilities                                                    │   drag to reorder / re‑parent      │ • Inventory    • Powers
 │   ├─ Stat‑block / Levels                                                   │   feather‑hex favicon on every     │ • Relationships           │
 │   └─ Relationships (to NPC, faction, etc.)                                 │   node reflects logo motif         │ • History / Notes         │
 │                                                                              (curved connectors visible)        │ • Images / Portraits      │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ AI Brain                                                                   │
 │ ────────────────────────────────────────────────────────────────────────── │
 │ 1. **Review Queue**   – Approve · Merge · Reject proposals                 │
 │ 2. **Story‑Telling Mode**                                                 │
 │    • System narrates summary of last session                              │
 │    • Asks follow‑up questions (voice or text) to fill blanks              │
 │    • Answers auto‑apply to Data Hub OR create new proposals               │
 │ 3. Generation Tools                                                       │
 │    • "Describe selected node" (lore expansion)                            │
 │    • "Create 5 NPCs for this town"                                        │
 │    • "Rewrite transcript line as short summary"                           │
 │                                                                          │
 │  (Voice I/O hook uses the same WebSocket as Live Play;                    │
 │   desktop = mic button, Shield TV = remote long‑press)                   │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Mind Map (2‑D / 3‑D)                                                      │
 │   • Centres on node selected in Data Hub                                  │
 │   • Glow colour = entity type                                             │
 │   • Quick actions:  View in Hub · Related Images · Go to Timeline         │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Timeline                                                                  │
 │   Toggle ▸  [ In‑Game ☐ | Real‑Life ☐ ]                                   │
 │   • Zoom wheel / d‑pad left‑right                                         │
 │   • Session pill ➞ open Session editor / Transcript                       │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Live Play  (recording HUD)                                                │
 │   • Turn order / Combat Tracker                                           │
 │   • Dice roller                                                           │
 │   • Live Transcript stream + AI highlights                                │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Transcripts Manager                                                       │
 │   • List  (status, duration, session link)                                │
 │   • Inline editor + speaker tags                                          │
 │   • Bulk approve "good‑enough" text                                       │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Image Library                                                             │
 │   • Grid  · Filter by entity type                                         │
 │   • Drag image onto a node in Data Hub to attach                          │
 │   • Upload / Delete (role‑based)                                          │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Analytics / Insights                                                      │
 │   • Relationship strength heat‑map                                        │
 │   • NPC screen‑time vs prominence                                         │
 │   • Session pacing (words per minute, talk‑time split)                    │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Search  (⌘/Ctrl + K  · TV long‑MENU)                                      │
 │   • Omni‑search  · Recent queries  · type filters                         │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Settings                                                                  │
 │   General | Appearance/Theme | Notifications                              │
 │   Integrations (LLM API key, Whisper, Image gen)                          │
 │   Audio / Transcription (input device, VAD)                               │
 │   Export & Import  (JSON, PDF report)                                     │
 │   User Profile  · Password                                                │
 └────────────────────────────────────────────────────────────────────────────┘
```

## Navigation Structure

### Sidebar / Drawer Order (Desktop & Shield TV)

1. Dashboard
2. Data Hub
3. Mind Map
4. Timeline
5. AI Brain
6. Live Play
7. Transcripts
8. Images
9. Analytics
10. Search (overlay, not route)
11. Settings

### Badge Counters

- AI Brain → pending proposals count
- Transcripts → unfinished edits
- Images → un-tagged uploads

### Navigation & Smart-Links

- `navigateTo(entityId, "hub" | "map" | "timeline" | "transcript" | "image")` — single helper used by every module
- Mind Map ↔ Data Hub stay bidirectionally in-sync
- AI Brain proposals auto-highlight the affected node in Data Hub when opened

## Implementation Plan

### Layer 1: React Components

**Technology**: @react-aria/treeview for accessible navigation

**Key Steps**:
1. Install react-aria-components
2. Create `<DataTree>` with `items={graph}` where graph is array of `{id, type, name, children}`
3. Supply `renderItem={({item}) => <TreeItem icon={Icon(item.type)} …/>}`

### Layer 2: Tailwind Design System

**Configuration**:
```js
// In tailwind.config.js
theme.extend.colors = {
  surface: {
    DEFAULT: '#0D1117',
    light: '#1A2233'
  },
  accent: {
    DEFAULT: '#1A9B9B',
    light: '#2CCACA',
    dark: '#0E7A7A'
  },
  secondary: '#F6AD55',
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0'
  },
  success: '#48BB78',
  warning: '#F6AD55',
  error: '#F56565',
  glow: 'var(--tw-shadow-color)'
}
```

**Key Steps**:
1. Use `bg-surface text-text-primary` globally
2. Card components: `bg-surface-light rounded-lg border border-accent/20`
3. Focus ring: `focus-visible:ring-2 ring-accent/70`
4. Glow effects: `hover:shadow-[0_0_15px_rgba(26,155,155,0.5)] transition-shadow`
5. Hex-feather background: `before:content-[''] before:absolute before:inset-0 before:bg-[url('/feather.svg')] before:opacity-5`
6. Interactive elements: `text-accent hover:text-accent-light transition-colors`
7. Buttons: `bg-accent hover:bg-accent-light text-white rounded px-4 py-2 transition-colors`

### Layer 3: Adaptive Layout

**Breakpoints**:
- Desktop ≥ 1280px = 3-pane (tree / list / editor)
- Tablet & Shield TV = 2-pane
- Phone = stacked accordions

**Implementation**:
- Use CSS Grid + media queries:
  ```css
  grid-cols-[280px_minmax(0,1fr)_minmax(0,400px)]
  ```
  Then collapse for smaller screens

### Layer 4: State Synchronization

- Global `selectedId` in React Context
- `navigateTo(id, view)` updates context + pushes route
- `useContext(DataHubCtx)` inside Mind Map & Timeline to center on active node

### Layer 5: Animations

- Tree expand/collapse with framer-motion height auto:
  ```jsx
  <motion.ul
    initial={{height: 0}}
    animate={{height: 'auto'}}
  >
  ```
- Cards glow on hover with Tailwind `transition-shadow`

### Layer 6: Testing

- Jest + React Testing Library for tree keyboard navigation
- Cypress for TV remote focus loop (arrow keys)
- Write expectations like:
  ```js
  expect(screen.getByRole('tree')).toHaveFocus();
  ```
  after ArrowDown

## Screen Details

### Dashboard

The Dashboard serves as the entry point to the application, providing an overview of the campaign state and quick access to common actions. It features a clean, card-based layout with key statistics and quick links.

**Key Components**:
- **Campaign Overview Card**: Grid layout showing key statistics (Sessions, Locations, Characters, Plot Points) with large, easy-to-read numbers and descriptive labels
- **Quick Links Card**: Vertical list of important links with icon + text format (Adventure Log, Character Library, World Atlas, Session Reports)
- **World Map Card**: Teal/turquoise outline map with glowing effect on dark background
- **Recent Sessions Table**: Clean tabular format with session name, date, duration, and participants columns
- **Outstanding Tasks panel**: AI proposals, conflicts, and missing fields
- **Campaign Health gauge**: Visual indicator showing overall campaign completeness
- **Live DB / WebSocket status indicator**: Small indicator showing connection status

### Data Hub

The Data Hub is the central repository for all campaign data, organized in a hierarchical tree structure with an integrated editor.

**Key Components**:
- Hierarchical tree view of all entities
- Context menu for adding, editing, and deleting entities
- Drag-and-drop functionality for reordering and reparenting entities
- Editor panel with tabs for different aspects of the selected entity
- Relationship visualization with curved connectors

### AI Brain

The AI Brain provides intelligent assistance for campaign management, including proposal review, storytelling, and generation tools.

**Key Components**:
- Review Queue for approving, merging, or rejecting AI proposals
- Story-Telling Mode for guided world-building with voice or text input
- Generation Tools for creating and expanding campaign elements
- Voice I/O integration with WebSocket for desktop and TV interfaces

### Mind Map

The Mind Map provides a visual representation of the campaign entities and their relationships, centered on the currently selected entity. It features a dark background with glowing teal/turquoise nodes and connections, creating an immersive, sci-fi aesthetic.

**Key Components**:
- **2D/3D visualization**: Toggle between 2D and 3D views of the entity network
- **Entity type color coding**: Different entity types (characters, locations, items) have distinct glow colors
- **Node design**: Hexagonal nodes with entity icons and labels, surrounded by a glowing aura
- **Connection visualization**: Curved, glowing lines showing relationships between entities
- **Quick action buttons**: View in Data Hub, Related Images, Go to Timeline
- **Zoom and pan controls**: Interactive navigation with mouse/touch/controller
- **Filtering options**: Filter by entity type, relationship type, or campaign
- **Focus mode**: Center on selected entity with expanding rings of connections
- **Search overlay**: Quick search functionality to find entities in the map

### Timeline

The Timeline displays events in chronological order, with options for viewing in-game or real-life timelines. It features a horizontal, scrollable timeline with glowing markers and session pills against a dark background.

**Key Components**:
- **Timeline toggle**: Switch between in-game fantasy calendar and real-life dates
- **Zoom controls**: Adjust the time scale with wheel/d-pad left-right navigation
- **Session pills**: Elongated, rounded rectangles representing game sessions with quick access to details and transcripts
- **Event markers**: Glowing dots or icons representing significant events with tooltips
- **Date indicators**: Clear date/time markers along the timeline axis
- **Campaign phases**: Visual separation of campaign arcs or chapters
- **Filtering options**: Filter events by type, character involvement, or location
- **Timeline scrubber**: Quick navigation control for jumping to specific dates
- **Export functionality**: Save timeline as image or include in campaign reports

### Live Play

The Live Play screen provides tools for running and recording game sessions, including combat tracking and transcription.

**Key Components**:
- Turn order / Combat Tracker for managing combat encounters
- Dice roller for virtual dice rolling
- Live Transcript stream with AI highlights for important moments
- Recording controls for starting, pausing, and stopping session recording

### Transcripts Manager

The Transcripts Manager allows for viewing, editing, and managing session transcripts. It features a clean, two-panel layout with a transcript list on the left and a detailed editor on the right, all with the consistent dark theme and teal accents.

**Key Components**:
- **Transcript list**: Sortable list of all transcripts with status indicators, duration, and session links
- **Speaker identification**: Color-coded speaker tags with character portraits where available
- **Inline editor**: Rich text editor for transcript content with formatting options
- **Timestamp markers**: Visual indicators of time progression throughout the session
- **AI-detected highlights**: Automatically identified important moments with glowing indicators
- **Bulk approval functionality**: Quick approval of "good-enough" text sections
- **Search functionality**: Find specific content within transcripts
- **Audio playback**: Synchronized audio playback with transcript text highlighting
- **Export options**: Save transcripts in different formats (PDF, TXT, DOCX)
- **Character linking**: Automatic linking of character names to character profiles

### Image Library

The Image Library provides a centralized repository for all campaign images, with filtering and organization tools. It features a responsive grid layout of image cards against the dark background, with teal accents for interactive elements.

**Key Components**:
- **Image grid**: Responsive grid layout of image cards with consistent spacing
- **Filtering system**: Filter images by entity type, tag, campaign, or upload date
- **Image cards**: Thumbnail previews with entity association indicators
- **Quick-view overlay**: Hover/focus effect with quick actions (view, edit, delete)
- **Drag-and-drop functionality**: Intuitive interface for attaching images to entities
- **Upload interface**: Clean, modern upload interface with progress indicators
- **Tagging system**: Comprehensive tagging for better organization and searchability
- **Bulk actions**: Select multiple images for batch operations
- **Image details panel**: Side panel showing full image details when selected
- **Role-based permissions**: Different capabilities based on user role
- **AI-assisted tagging**: Automatic tag suggestions based on image content

### Analytics / Insights

The Analytics / Insights screen provides visualizations and metrics for campaign analysis.

**Key Components**:
- Relationship strength heat-map showing character connections
- NPC screen-time vs prominence analysis
- Session pacing metrics including words per minute and talk-time split
- Export functionality for reports and visualizations

### Search

The Search functionality provides a global search across all campaign data.

**Key Components**:
- Omni-search with support for all entity types
- Recent queries list for quick access to previous searches
- Type filters for narrowing search results
- Keyboard shortcuts (⌘/Ctrl + K) and TV remote support (long-MENU)

### Settings

The Settings screen provides configuration options for the application.

**Key Components**:
- General settings for application behavior
- Appearance/Theme settings for customizing the UI
- Notifications settings for alerts and reminders
- Integrations settings for LLM API keys, Whisper, and image generation
- Audio/Transcription settings for input devices and voice activity detection
- Export & Import functionality for data backup and restoration
- User Profile and Password management

## Next Steps

1. **Implement Core Layout**: Create the responsive grid layout with sidebar navigation
2. **Develop Data Hub**: Implement the hierarchical tree view with editor panel
3. **Create Mind Map Integration**: Develop the bidirectional sync between Data Hub and Mind Map
4. **Implement AI Brain**: Build the proposal review and storytelling interfaces
5. **Develop Timeline**: Create the dual-calendar timeline view with session pills
6. **Implement Live Play**: Build the recording HUD with combat tracker and transcript stream
7. **Create Transcripts Manager**: Develop the transcript editing and management interface
8. **Implement Image Library**: Build the image grid with filtering and drag-and-drop
9. **Develop Analytics**: Create the relationship and pacing visualizations
10. **Implement Search**: Build the global search functionality with keyboard shortcuts
11. **Create Settings**: Develop the configuration interface with all required sections

## Conclusion

This UI Design Master Plan provides a comprehensive blueprint for implementing the RPG Archivist user interface. By following this plan, we can create a consistent, accessible, and user-friendly application that meets the needs of tabletop RPG players and game masters across desktop, tablet, and TV interfaces.
