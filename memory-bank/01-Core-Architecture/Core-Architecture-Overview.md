# RPG Archivist Core Architecture Overview

## Introduction
This document provides an overview of the core architecture of the RPG Archivist application, including the database schema, API structure, and key components.

## Database Architecture

### Neo4j Graph Database
The RPG Archivist application uses Neo4j as its primary database, leveraging the graph database structure to represent complex relationships between entities.

### Core Entities
- **User**: Represents a user of the application with authentication details
- **RPGWorld**: Represents a game world with its own rules and settings
- **Campaign**: Represents a campaign within a world with its own storyline
- **Character**: Represents a character (PC or NPC) within a campaign
- **Location**: Represents a location within a world or campaign
- **Item**: Represents an item that can be owned by characters or found in locations
- **Session**: Represents a gaming session within a campaign
- **Event**: Represents an event that occurs within a campaign

### Relationship Types
- **CREATED_BY**: Links entities to their creator user
- **PART_OF**: Links entities to their parent entities (e.g., Campaign to World)
- **LOCATED_IN**: Links characters or items to locations
- **PARTICIPATED_IN**: Links characters to sessions
- **OWNS**: Links characters to items
- **RELATED_TO**: Links characters to other characters
- **OCCURRED_AT**: Links events to locations
- **INVOLVED**: Links events to characters

## API Architecture

### RESTful API Structure
The API follows RESTful principles with the following structure:
- `/api/auth`: Authentication endpoints
- `/api/users`: User management endpoints
- `/api/worlds`: RPG World management endpoints
- `/api/campaigns`: Campaign management endpoints
- `/api/characters`: Character management endpoints
- `/api/locations`: Location management endpoints
- `/api/items`: Item management endpoints
- `/api/sessions`: Session management endpoints
- `/api/events`: Event management endpoints
- `/api/relationships`: Relationship management endpoints
- `/api/images`: Image management endpoints
- `/api/providers`: Provider management endpoints

### Authentication
- JWT-based authentication with access and refresh tokens
- Role-based access control (Player, Game Master, Admin)
- Entity-based access control for fine-grained permissions

## Provider Architecture

### Provider Types
- **LLM (Language Model)**: Provides text generation and analysis
- **STT (Speech-to-Text)**: Provides audio transcription
- **IMG (Image Generation)**: Provides image generation and editing

### Provider Components
- **Provider Interface**: Defines the contract for each provider type
- **Provider Registry**: Manages the registration and discovery of providers
- **Provider Factory**: Creates provider instances based on configuration
- **Provider Router**: Routes requests to the appropriate provider
- **Provider Settings**: Manages provider configuration

### Community Providers
- **Ollama**: Open-source LLM provider
- **Vosk**: Open-source STT provider
- **Stable Diffusion**: Open-source IMG provider

### Premium Providers
- **OpenAI**: Premium LLM and IMG provider
- **Whisper**: Premium STT provider
- **DALL·E**: Premium IMG provider

## Frontend Architecture

### React Components
- **Layout Components**: Provide the overall structure of the application
- **Entity Components**: Provide CRUD operations for each entity type
- **Relationship Components**: Manage relationships between entities
- **Visualization Components**: Provide visualizations of data
- **Form Components**: Provide forms for data entry
- **Image Components**: Manage image upload, display, and selection

### State Management
- **React Context**: Provides global state for authentication and settings
- **React Query**: Provides data fetching and caching
- **Local State**: Provides component-specific state

### Routing
- **React Router**: Provides client-side routing
- **Protected Routes**: Restrict access to authenticated users
- **Role-Based Routes**: Restrict access based on user role

## Image Management Architecture

### Image Storage
- **File System**: Stores images on the server file system
- **Directory Structure**: Organizes images by entity type and ID
- **Thumbnails**: Generates thumbnails for better performance

### Image Access Control
- **Role-Based Access**: Restricts access based on user role
- **Entity-Based Access**: Restricts access based on entity ownership
- **Context-Based Filtering**: Shows images based on user context

### Image Components
- **ImageUploader**: Provides image upload with preview and cropping
- **ImageGallery**: Displays images with thumbnail support
- **ImageSelector**: Selects images based on entity type
- **ImageViewer**: Displays full-size images

## Conclusion
The RPG Archivist application has a robust architecture that leverages Neo4j's graph database capabilities to represent complex relationships between entities. The API follows RESTful principles and provides comprehensive endpoints for all entity types. The provider architecture enables the use of both community and premium AI services. The frontend architecture provides a responsive and intuitive user interface with comprehensive image management capabilities.
