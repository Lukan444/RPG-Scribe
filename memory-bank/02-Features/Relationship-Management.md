# Relationship Management in RPG Archivist

## Overview
This document provides a comprehensive overview of the relationship management features in the RPG Archivist application, consolidating information from various relationship-focused files.

## Relationship Types

### Character-Character Relationships
- **Friendship**: Represents a friendly relationship between characters
- **Rivalry**: Represents a competitive relationship between characters
- **Family**: Represents a familial relationship between characters
- **Romantic**: Represents a romantic relationship between characters
- **Professional**: Represents a professional relationship between characters
- **Mentor-Student**: Represents a teaching relationship between characters

### Character-Location Relationships
- **Home**: Represents a character's primary residence
- **Workplace**: Represents a character's place of work
- **Frequent**: Represents a location a character frequently visits
- **Origin**: Represents a character's place of origin
- **Temporary**: Represents a temporary stay at a location

### Item Relationships
- **Owned By**: Represents an item owned by a character
- **Located At**: Represents an item located at a specific location
- **Created By**: Represents an item created by a character
- **Used By**: Represents an item used by a character
- **Sought By**: Represents an item sought by a character

### Event-Location Relationships
- **Occurred At**: Represents an event that occurred at a specific location
- **Affected**: Represents a location affected by an event
- **Created**: Represents a location created by an event
- **Destroyed**: Represents a location destroyed by an event

## Implementation Details

### Character-Character Relationship UI
- **CharacterRelationships Component**: Manages character-character relationships
- **RelationshipForm**: Provides a form for creating and editing relationships
- **RelationshipList**: Displays a list of relationships for a character
- **RelationshipCard**: Displays details of a relationship
- **RelationshipTimeline**: Displays a timeline of relationship events
- **RelationshipAnalytics**: Provides analytics for character relationships

### Character-Location Relationship UI
- **CharacterLocations Component**: Manages character-location relationships
- **LocationForm**: Provides a form for creating and editing location relationships
- **LocationList**: Displays a list of locations for a character
- **LocationCard**: Displays details of a location relationship
- **LocationTimeline**: Displays a timeline of a character's presence at locations

### Item Relationship UI
- **ItemRelationships Component**: Manages item relationships
- **ItemOwnershipForm**: Provides a form for managing item ownership
- **ItemLocationForm**: Provides a form for managing item location
- **ItemList**: Displays a list of items for a character or location
- **ItemCard**: Displays details of an item relationship

### Event-Location Relationship UI
- **EventLocations Component**: Manages event-location relationships
- **EventForm**: Provides a form for creating and editing event-location relationships
- **EventList**: Displays a list of events for a location
- **EventCard**: Displays details of an event-location relationship
- **EventTimeline**: Displays a timeline of events at a location

## Mind Map Visualization

### Graph Visualization
- **CytoscapeComponent**: Provides a graph visualization of relationships
- **GraphControls**: Provides controls for manipulating the graph
- **GraphFilters**: Provides filters for the graph visualization
- **GraphExport**: Provides export functionality for the graph

### Filtering Options
- **Entity Type**: Filter by entity type (Character, Location, Item, Event)
- **Relationship Type**: Filter by relationship type
- **Relationship Strength**: Filter by relationship strength
- **Time Period**: Filter by time period
- **Campaign**: Filter by campaign
- **World**: Filter by world

## Relationship Analytics

### Character Analytics
- **Most Connected**: Identifies characters with the most relationships
- **Relationship Types**: Analyzes the distribution of relationship types
- **Relationship Strength**: Analyzes the strength of relationships
- **Relationship Changes**: Tracks changes in relationships over time

### Location Analytics
- **Most Visited**: Identifies locations with the most character visits
- **Event Frequency**: Analyzes the frequency of events at locations
- **Character Presence**: Tracks character presence at locations over time

### Item Analytics
- **Ownership Changes**: Tracks changes in item ownership over time
- **Location Changes**: Tracks changes in item location over time
- **Usage Patterns**: Analyzes patterns in item usage

## Relationship Templates

### Template Types
- **Party**: Creates relationships between party members
- **Family**: Creates relationships between family members
- **Organization**: Creates relationships between organization members
- **Conflict**: Creates relationships between opposing factions

### Template Implementation
- **TemplateSelector**: Provides a selector for relationship templates
- **TemplateForm**: Provides a form for customizing templates
- **TemplatePreview**: Provides a preview of the relationships to be created
- **TemplateApply**: Applies the template to create relationships

## Conclusion
The relationship management features in RPG Archivist provide a comprehensive system for managing complex relationships between entities in a tabletop RPG campaign. The UI components, mind map visualization, analytics, and templates work together to create a powerful tool for game masters and players to track and understand the relationships in their game world.
