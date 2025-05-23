# Key Findings and Implementation Plan

## Overview

This document outlines the key findings from our examination of the existing RPG Archivist documentation and how we'll implement these features in our Mantine migration. It serves as a comprehensive guide for the migration process, ensuring that all functionality is preserved while taking advantage of Mantine's features.

## Core Architecture

### Database Architecture

The RPG Archivist application uses Neo4j as its graph database, which is well-suited for the complex relationships between entities in a tabletop RPG campaign. We'll maintain this approach with some enhancements:

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

### Entity Model

The application manages several types of entities, each with specific properties and relationships:

1. **Campaign**
   - Properties: name, description, setting, system, start_date, status
   - Relationships: has many sessions, characters, locations, events, items

2. **Character**
   - Properties: name, race, class, level, background, alignment, description
   - Types: PC (Player Character), NPC (Non-Player Character)
   - Relationships: belongs to campaign, appears in sessions, has relationships with other characters

3. **Location**
   - Properties: name, type, description, geography, climate
   - Types: city, dungeon, wilderness, building, plane
   - Relationships: belongs to campaign, contains other locations, contains characters

4. **Event**
   - Properties: name, description, date, importance
   - Types: battle, social, discovery, plot point
   - Relationships: belongs to campaign, occurs at location, involves characters

5. **Item**
   - Properties: name, type, description, rarity, attunement
   - Types: weapon, armor, potion, scroll, wondrous item, artifact
   - Relationships: belongs to campaign, owned by character, found at location

6. **Session**
   - Properties: number, title, date_played, summary
   - Relationships: belongs to campaign, includes characters, locations, events
   - Metadata: player notes, DM notes, transcript, recordings

7. **Relationship**
   - Properties: type, description, strength
   - Types: ally, enemy, family, romantic, professional
   - Relationships: connects two entities (usually characters)

## Key Features

### Mind Map

The Mind Map module provides a visual representation of the relationships between entities in a campaign. It uses Cytoscape.js for visualization and includes the following features:

1. **Visualization**
   - Interactive graph visualization
   - Node and edge styling based on entity type
   - Zoom and pan controls
   - 2D and 3D visualization modes

2. **Controls**
   - Filtering by entity type
   - Search functionality
   - Layout options
   - View mode toggle (2D/3D)

3. **Details Panel**
   - Entity information display
   - Relationship details
   - Quick actions for entity management
   - Links to related entities

### Timeline

The Timeline module provides a chronological view of events and sessions in a campaign. It includes the following features:

1. **Visualization**
   - Chronological timeline display
   - Event and session markers
   - Timeline navigation controls
   - Filtering options

2. **Timeline Types**
   - In-game timeline (based on campaign world dates)
   - Real-life timeline (based on session dates)
   - Toggle between timeline types

3. **Details Panel**
   - Event/session information display
   - Participant list
   - Related entities
   - Quick actions for event/session management

### AI Brain

The AI Brain module provides intelligent assistance for campaign management. It includes the following features:

1. **Contextual Conversations**
   - AI-powered chat with campaign context
   - Natural language understanding and generation
   - Context-aware responses based on campaign data

2. **Database Proposals**
   - AI-generated suggestions for database updates
   - Approval workflow for user review
   - Automatic implementation of approved proposals

3. **Live Session Processing**
   - Real-time transcription of session audio
   - Automatic extraction of key moments
   - Generation of session summaries

4. **Session Highlights**
   - Identification of important moments in sessions
   - Categorization of highlights by type
   - Linking highlights to relevant entities

5. **Provider Integration**
   - Integration with LLM providers (Ollama, OpenAI)
   - Integration with STT providers (Vosk, Whisper)
   - Provider management and configuration

### Transcription

The Transcription module handles the conversion of spoken game sessions into searchable, analyzable text. It includes the following features:

1. **Audio Recording**
   - Multi-channel recording for different speakers
   - Noise reduction and audio enhancement
   - Automatic session segmentation

2. **Speech-to-Text Conversion**
   - Real-time transcription during sessions
   - Batch processing for uploaded recordings
   - Speaker diarization (identifying who is speaking)

3. **Transcript Enhancement**
   - Automatic punctuation and formatting
   - Entity recognition and linking
   - Dice roll detection and outcome recording

4. **Transcript Management**
   - Interactive transcript editor
   - Suggested corrections based on context
   - Bulk editing capabilities
   - Version history and change tracking

## Implementation with Mantine

### Project Setup

1. **Dependencies**
   - Install Mantine core and hooks: `@mantine/core`, `@mantine/hooks`
   - Install form handling: `@mantine/form`
   - Install additional packages: `@mantine/dates`, `@mantine/notifications`, `@mantine/dropzone`
   - Install icon library: `@tabler/icons-react`

2. **PostCSS Configuration**
   - Create `postcss.config.cjs` with Mantine preset
   - Configure CSS variables for breakpoints

3. **Theme Configuration**
   - Create a theme with primary (teal) and secondary (amber) colors
   - Configure typography, spacing, and radius
   - Set component defaults for consistent styling

### Best Practices

1. **Component Structure**
   - Use compound components for complex UI elements
   - Add `'use client'` directive when using hooks or compound components in Next.js
   - Use non-compound components in server components

2. **Styling Approach**
   - Use CSS modules for component-specific styles
   - Import Mantine styles before application styles
   - Use CSS variables for theme values
   - Use the `light-dark` function for theme-dependent styles

3. **Form Handling**
   - Use `@mantine/form` with uncontrolled mode for better performance
   - Use `form.getInputProps()` and `form.key()` for input binding
   - Implement validation with built-in validators or schema validation
   - Handle nested fields with dot notation (e.g., 'user.firstName')
   - Manage list fields with `form.insertListItem` and `form.removeListItem`

4. **State Management**
   - Use React Query or SWR for data fetching and caching
   - Implement context providers for global state
   - Use local state for component-specific state
   - Implement optimistic updates for better UX

### Module Implementation

1. **Mind Map Module**
   - Use Cytoscape.js for visualization
   - Implement controls with Mantine components (`ActionIcon`, `SegmentedControl`, etc.)
   - Create details panel with Mantine components (`Paper`, `Stack`, `Text`, etc.)
   - Implement search and filtering with Mantine components (`TextInput`, `Select`, etc.)

2. **Timeline Module**
   - Create custom timeline visualization with Mantine styling
   - Implement controls with Mantine components (`SegmentedControl`, `Button`, `Select`, etc.)
   - Create timeline items with Mantine components (`Paper`, `Text`, `Badge`, etc.)
   - Implement details panel with Mantine components (`Paper`, `Stack`, `Text`, etc.)

3. **AI Brain Module**
   - Implement tabs with Mantine's `Tabs` component
   - Create review queue with Mantine components (`Card`, `Stack`, `Button`, etc.)
   - Implement storytelling interface with Mantine components (`TextInput`, `Button`, `Paper`, etc.)
   - Create generation tools interface with Mantine components (`Card`, `Button`, `Group`, etc.)
   - Implement voice input/output with Mantine components (`ActionIcon`, `Paper`, etc.)

4. **Transcription Module**
   - Create recording interface with Mantine components (`ActionIcon`, `Progress`, `Badge`, etc.)
   - Implement transcript editor with Mantine components (`Textarea`, `Button`, `Group`, etc.)
   - Create speaker tagging with Mantine components (`Select`, `Badge`, etc.)
   - Implement entity linking with Mantine components (`Popover`, `Anchor`, etc.)

## Conclusion

This document provides a comprehensive overview of the key findings from our examination of the existing RPG Archivist documentation and how we'll implement these features in our Mantine migration. By following these guidelines, we can ensure that all functionality is preserved while taking advantage of Mantine's features to create a modern, maintainable, and user-friendly application.
