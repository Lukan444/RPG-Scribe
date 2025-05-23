# AI-Assisted World Building

## Overview

The AI-Assisted World Building feature provides a comprehensive system for generating and managing world elements using AI assistance. This feature enables Game Masters to develop their RPG worlds more efficiently by leveraging AI to generate proposals for new world elements, enhance existing elements, and answer questions about the world.

## Key Components

### 1. Customizable Proposal Templates

The system includes a robust template management system that allows users to create, edit, and manage proposal templates for different entity types and purposes:

- **Enhanced Template Model**:
  - Support for entity-specific template categories (Entity Creation, Entity Update, Relationship Creation, World Building, Narrative, Analysis, Question)
  - Template variables with type information and default values
  - RPG system adherence level settings (Strict, Moderate, Loose, Custom)
  - Specialized world building modes (Enhancement, Suggestion, Analysis, Question, Narrative)
  - Template versioning and history tracking

- **Template Management UI**:
  - Multi-tab template editor with basic info, prompt template, system prompt, world building options, and variables/tags
  - Variable and tag management with visual representation
  - Default template selection for each entity type and category
  - Template testing and preview functionality

### 2. World Building Dashboard

The World Building Dashboard provides a central hub for managing world building activities:

- **Proposal Management**:
  - List of pending, approved, rejected, and modified proposals
  - Proposal details with entity type, description, and status
  - Approval workflow with options to approve, reject, or modify proposals
  - Filtering and sorting options for proposals

- **Question and Answer Interface**:
  - Ask questions about the world and receive AI-generated answers
  - View history of questions and answers
  - Filter and search questions by topic or status

- **History Tracking**:
  - Timeline of world building activities
  - Record of approved proposals and answered questions
  - Filtering and search options for history items

### 3. World Building Settings

The World Building Settings page provides configuration options for the AI-assisted world building system:

- **General Settings**:
  - Enable/disable AI-assisted world building
  - Configure default RPG system adherence level
  - Set proposal frequency and maximum proposals per session
  - Configure automatic proposal generation

- **RPG System Integration**:
  - Import RPG system rules and world background
  - Configure how strictly the AI should adhere to the system rules
  - Set custom world building guidelines

- **Template Management**:
  - Access to the template management interface
  - Create and manage templates for different entity types and purposes

### 4. Backend Enhancements

The backend has been enhanced to support the AI-assisted world building features:

- **Repository Methods**:
  - Support for enhanced templates with variables and categories
  - Template rendering with variable substitution
  - Default template selection by entity type and category
  - Flexible filtering options for template retrieval

- **API Endpoints**:
  - Template management endpoints (CRUD operations)
  - Proposal generation and management endpoints
  - Question and answer endpoints
  - World building settings endpoints

## Implementation Details

### Frontend Components

1. **ProposalTemplateManager**:
   - Comprehensive template management UI with multiple tabs
   - Support for all template properties including variables, tags, and world building options
   - Template list with filtering and sorting options
   - Template editor with validation and preview

2. **WorldBuildingDashboard**:
   - Central hub for world building activities
   - Tabs for proposals, questions, and history
   - Proposal cards with approval workflow
   - Question cards with answer functionality

3. **WorldBuildingSettings**:
   - Configuration options for AI-assisted world building
   - RPG system integration settings
   - Access to template management

### Backend Services

1. **ChangeProposalService**:
   - Enhanced to support template variables and categories
   - Added methods for template rendering and default template selection
   - Implemented flexible filtering options for template retrieval

2. **BrainService**:
   - Enhanced to support world building modes and adherence levels
   - Added methods for generating proposals based on templates
   - Implemented question answering functionality

3. **TemplateService**:
   - New service for managing proposal templates
   - Support for template rendering with variable substitution
   - Default template selection by entity type and category

## Usage Examples

### Creating a New Template

1. Navigate to the World Building Settings page
2. Select the Templates tab
3. Click "Create Template"
4. Fill in the basic information (name, description, entity type, category)
5. Define the prompt template with variables
6. Configure world building options (mode, adherence level)
7. Add variables and tags
8. Save the template

### Generating Proposals

1. Navigate to the World Building Dashboard
2. Click "Generate Proposals"
3. Select the entity type and template
4. Configure generation options
5. Click "Generate"
6. Review and approve/reject/modify the generated proposals

### Asking Questions

1. Navigate to the World Building Dashboard
2. Select the Questions tab
3. Click "Ask Question"
4. Enter your question about the world
5. Select relevant context (optional)
6. Click "Submit"
7. Review the AI-generated answer

## Future Enhancements

1. **Procedural Generation**:
   - Generate locations, NPCs, and items based on world context
   - Create interconnected elements with consistent relationships
   - Generate visual representations of generated elements

2. **Narrative Consistency Checking**:
   - Analyze world elements for consistency issues
   - Suggest corrections for inconsistencies
   - Provide explanations for suggested changes

3. **Enhanced Integration with Existing Elements**:
   - Generate proposals that connect to existing world elements
   - Analyze relationships between elements for gaps or opportunities
   - Suggest enhancements based on campaign events and session transcripts

## Conclusion

The AI-Assisted World Building feature provides a powerful tool for Game Masters to develop their RPG worlds with AI assistance. With customizable templates, a comprehensive dashboard, and flexible configuration options, users can tailor the AI's assistance to their specific needs and preferences. The system's support for different entity types, categories, and world building modes enables a wide range of world building activities, from creating new elements to enhancing existing ones and ensuring narrative consistency.
