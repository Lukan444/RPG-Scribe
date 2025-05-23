# Project Brief

## Core Requirements & Goals

The primary goal of this project, "RPG-Archivist-Web2," appears to be a web application for managing and archiving information related to Role-Playing Games. Key functionalities likely include:

*   User authentication and management.
*   CRUD operations for various game-related entities (e.g., campaigns, characters, locations, items, notes, sessions).
*   Displaying relationships between these entities.
*   Potentially AI-enhanced features for content generation or analysis.
*   Data visualization (e.g., mind maps, timelines, relationship webs).

The immediate issue reported is that UI components are displaying mock/placeholder data instead of live data from the backend, which is said to be fully implemented. The project aims to resolve this data integration problem.

## Scope

*   **In Scope:**
    *   Diagnosing and fixing the UI data integration issue.
    *   Ensuring UI components correctly fetch and display data from the backend services.
    *   Understanding the existing data flow from backend to frontend.
*   **Out of Scope (initially, unless specified otherwise):**
    *   Backend bug fixing (assuming the backend is "fully implemented" as stated, though this might be revisited if frontend investigation points to backend issues).
    *   New feature development beyond fixing the data display.
    *   Major refactoring of existing components unless directly related to fixing the data flow.

## Success Criteria

*   UI components display live data fetched from the backend.
*   Placeholder or mock data is no longer used for primary data display in components that should show live data.
*   The cause of the data integration issue is identified and documented.