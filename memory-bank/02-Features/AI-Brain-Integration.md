# AI Brain Integration

## Overview

This document provides comprehensive information about the AI Brain integration in the RPG Archivist application, including the implementation plan, progress, and current status.

## AI Brain Architecture

The AI Brain is a core feature of the RPG Archivist application that provides intelligent assistance for tabletop RPG campaigns. It consists of several components:

1. **Contextual Conversations**:
   - AI-powered chat with campaign context
   - Natural language understanding and generation
   - Context-aware responses based on campaign data

2. **Database Proposals**:
   - AI-generated suggestions for database updates
   - Approval workflow for user review
   - Automatic implementation of approved proposals

3. **Live Session Processing**:
   - Real-time transcription of session audio
   - Automatic extraction of key moments
   - Generation of session summaries

4. **Session Highlights**:
   - Identification of important moments in sessions
   - Categorization of highlights by type
   - Linking highlights to relevant entities

## Implementation Plan

The AI Brain integration was implemented in several phases:

### Phase 1: Backend Implementation

- **Brain Service**:
  - Create a robust BrainService for orchestrating AI functionality
  - Implement context gathering from the database
  - Add methods for generating responses and proposals
  - Implement security controls for AI-generated content

- **Live Session Processor**:
  - Create a LiveSessionProcessorService for real-time session processing
  - Implement audio transcription with STT providers
  - Add methods for extracting key moments from transcriptions
  - Implement session summary generation

- **Session Highlight Repository**:
  - Create a SessionHighlightRepository for storing session highlights
  - Implement methods for creating, reading, updating, and deleting highlights
  - Add methods for querying highlights by session, type, and entity
  - Implement methods for linking highlights to entities

- **API Controllers**:
  - Create controllers for AI Brain functionality
  - Implement endpoints for conversations, proposals, and highlights
  - Add validation and error handling
  - Implement authentication and authorization

### Phase 2: Frontend Implementation

- **Conversation Component**:
  - Create a ConversationComponent for AI chat
  - Implement message display and input
  - Add loading and error states
  - Implement context selection

- **Proposal Component**:
  - Create a ProposalComponent for reviewing and managing proposals
  - Implement proposal display and approval workflow
  - Add filtering and sorting
  - Implement proposal details and editing

- **Live Session Component**:
  - Create a LiveSessionComponent for displaying session highlights
  - Implement highlight display and filtering
  - Add timeline visualization
  - Implement highlight details and editing

- **Brain Page**:
  - Create a BrainPage that combines all components
  - Implement tab navigation
  - Add context selection
  - Implement responsive layout

### Phase 3: Integration with Providers

- **LLM Provider Integration**:
  - Integrate with LLM providers (Ollama, OpenAI)
  - Implement provider selection and configuration
  - Add fallback mechanisms
  - Implement streaming responses

- **STT Provider Integration**:
  - Integrate with STT providers (Vosk, Whisper)
  - Implement provider selection and configuration
  - Add fallback mechanisms
  - Implement real-time transcription

- **Provider Management**:
  - Create a provider management UI
  - Implement provider configuration
  - Add provider testing
  - Implement provider metrics

## Implementation Progress

### Completed Tasks

1. **Backend Implementation**:
   - ✅ Created a robust BrainService for orchestrating AI functionality
   - ✅ Implemented LiveSessionProcessorService for real-time session processing
   - ✅ Created SessionHighlightRepository for storing session highlights
   - ✅ Added API controllers for AI Brain and Live Session functionality
   - ✅ Implemented routes for all new endpoints
   - ✅ Updated database schema with new nodes and relationships

2. **Frontend Implementation**:
   - ✅ Created LiveSessionService for the frontend
   - ✅ Implemented ConversationComponent for AI chat
   - ✅ Created ProposalComponent for reviewing and managing proposals
   - ✅ Implemented LiveSessionComponent for displaying session highlights
   - ✅ Created BrainPage that combines all components
   - ✅ Updated routes to include the new page with parameters

3. **Integration with Providers**:
   - ✅ Integrated with LLM providers (Ollama, OpenAI)
   - ✅ Implemented STT provider integration (Vosk, Whisper)
   - ✅ Created provider management UI
   - ✅ Added provider configuration and testing

### Current Status

The AI Brain integration is complete, with all core functionality implemented. The application can now:

- Conduct contextual conversations with campaign data
- Generate and manage database proposals
- Process live session audio and extract highlights
- Display and manage session highlights
- Configure and manage AI providers

## Key Features

### Contextual Conversations

The AI Brain can engage in natural language conversations with users, taking into account the context of the campaign. This includes:

- **Campaign Context**: The AI has access to campaign data, including characters, locations, items, events, and sessions.
- **Natural Language Understanding**: The AI can understand and respond to natural language queries about the campaign.
- **Context-Aware Responses**: The AI generates responses that are relevant to the campaign context.
- **Multi-Turn Conversations**: The AI maintains context across multiple turns in a conversation.

### Database Proposals

The AI Brain can generate suggestions for database updates based on conversations and session processing. This includes:

- **Entity Creation**: The AI can propose creating new entities (characters, locations, items, events).
- **Entity Updates**: The AI can propose updating existing entities with new information.
- **Relationship Creation**: The AI can propose creating relationships between entities.
- **Approval Workflow**: Users can review, edit, and approve or reject proposals.
- **Automatic Implementation**: Approved proposals are automatically implemented in the database.

### Live Session Processing

The AI Brain can process live session audio in real-time, extracting key moments and generating summaries. This includes:

- **Audio Transcription**: The AI can transcribe session audio using STT providers.
- **Key Moment Extraction**: The AI can identify important moments in the session.
- **Entity Recognition**: The AI can recognize entities mentioned in the session.
- **Session Summary Generation**: The AI can generate summaries of sessions.
- **Timeline Visualization**: The AI can visualize the session timeline with highlights.

### Session Highlights

The AI Brain can identify and manage important moments in sessions. This includes:

- **Highlight Categorization**: The AI can categorize highlights by type (combat, roleplay, exploration, etc.).
- **Entity Linking**: The AI can link highlights to relevant entities.
- **Highlight Filtering**: Users can filter highlights by type, entity, and session.
- **Highlight Details**: Users can view and edit highlight details.
- **Highlight Timeline**: Users can view highlights on a timeline.

## Provider Architecture

The AI Brain uses a flexible provider architecture that allows for different AI providers to be used for different functions. This includes:

- **LLM Providers**: Ollama (default), OpenAI
- **STT Providers**: Vosk (default), Whisper
- **Provider Selection**: Users can select which provider to use for each function.
- **Provider Configuration**: Users can configure provider settings.
- **Provider Testing**: Users can test provider availability and functionality.
- **Provider Metrics**: Users can view provider usage metrics.

## Troubleshooting

If you encounter issues with the AI Brain:

1. **Check Provider Availability**:
   - Make sure the selected providers are available
   - Check provider configuration
   - Try using a different provider

2. **Check Database Connection**:
   - Make sure the database is running and accessible
   - Check database credentials
   - Verify that the database schema includes AI Brain entities

3. **Check Error Logs**:
   - Look for error messages in the console
   - Check the application logs for more detailed information
   - Look for specific provider errors

4. **Check Network Connectivity**:
   - Make sure the application has internet access (for cloud providers)
   - Check firewall settings
   - Verify that the application can connect to provider endpoints

## Next Steps

1. **Enhance Contextual Understanding**:
   - Improve context gathering from the database
   - Add more sophisticated natural language understanding
   - Implement better context management across conversations

2. **Improve Proposal Generation**:
   - Add more sophisticated proposal generation
   - Implement better entity recognition
   - Add support for more complex proposals

3. **Enhance Live Session Processing**:
   - Improve audio transcription accuracy
   - Add speaker identification
   - Implement better key moment extraction

4. **Add Advanced Features**:
   - Implement AI-generated images for entities
   - Add AI-generated maps for locations
   - Implement AI-generated music for sessions
   - Add AI-generated character voices
