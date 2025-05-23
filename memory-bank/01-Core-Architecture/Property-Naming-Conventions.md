# Property Naming Conventions

## Overview

This document provides comprehensive information about the property naming conventions in the RPG Archivist application, including the implementation plan, progress, and current status.

## Property Naming Convention Analysis

The RPG Archivist application had inconsistent property naming conventions between the frontend and backend, which caused issues with data transfer and type safety. The main issues were:

1. **Inconsistent Naming Conventions**:
   - Frontend used camelCase (e.g., `worldId`, `campaignId`)
   - Backend used snake_case (e.g., `world_id`, `campaign_id`)
   - Database used snake_case (e.g., `world_id`, `campaign_id`)

2. **Inconsistent Foreign Key Naming**:
   - Some foreign keys used the format `entity_name_id` (e.g., `world_id`)
   - Others used the format `rpg_entity_name_id` (e.g., `rpg_world_id`)
   - This inconsistency caused issues with database queries and type safety

3. **Inconsistent Property Access**:
   - Frontend components accessed properties using camelCase
   - Backend services accessed properties using snake_case
   - This inconsistency caused issues with data transfer and type safety

## Implementation Plan

The property naming convention fixes were implemented in several phases:

### Phase 1: Standardize Naming Conventions

- **Database Schema**:
  - Standardize foreign key naming to use the format `entity_name_id` (e.g., `world_id`)
  - Update database queries to use the standardized naming convention
  - Update database schema to use the standardized naming convention

- **Backend Services**:
  - Update repository methods to use the standardized naming convention
  - Update service methods to use the standardized naming convention
  - Update controller methods to use the standardized naming convention

- **Frontend Components**:
  - Update component props to use the standardized naming convention
  - Update component state to use the standardized naming convention
  - Update API client methods to use the standardized naming convention

### Phase 2: Implement Property Mapping

- **Backend Services**:
  - Implement property mapping in repository methods to convert between snake_case and camelCase
  - Implement property mapping in service methods to convert between snake_case and camelCase
  - Implement property mapping in controller methods to convert between snake_case and camelCase

- **Frontend Components**:
  - Implement property mapping in API client methods to convert between camelCase and snake_case
  - Implement property mapping in component props to convert between camelCase and snake_case
  - Implement property mapping in component state to convert between camelCase and snake_case

### Phase 3: Update Type Definitions

- **Backend Types**:
  - Update entity interfaces to use the standardized naming convention
  - Update DTO interfaces to use the standardized naming convention
  - Update repository interfaces to use the standardized naming convention

- **Frontend Types**:
  - Update component prop types to use the standardized naming convention
  - Update component state types to use the standardized naming convention
  - Update API client types to use the standardized naming convention

### Phase 4: Update Tests

- **Backend Tests**:
  - Update repository tests to use the standardized naming convention
  - Update service tests to use the standardized naming convention
  - Update controller tests to use the standardized naming convention

- **Frontend Tests**:
  - Update component tests to use the standardized naming convention
  - Update API client tests to use the standardized naming convention
  - Update utility tests to use the standardized naming convention

## Implementation Progress

### Completed Tasks

1. **Standardized Naming Conventions**:
   - ✅ Standardized foreign key naming to use the format `entity_name_id` (e.g., `world_id`)
   - ✅ Updated database queries to use the standardized naming convention
   - ✅ Updated database schema to use the standardized naming convention

2. **Updated Backend Services**:
   - ✅ Updated repository methods to use the standardized naming convention
   - ✅ Updated service methods to use the standardized naming convention
   - ✅ Updated controller methods to use the standardized naming convention

3. **Updated Frontend Components**:
   - ✅ Updated component props to use the standardized naming convention
   - ✅ Updated component state to use the standardized naming convention
   - ✅ Updated API client methods to use the standardized naming convention

4. **Implemented Property Mapping**:
   - ✅ Implemented property mapping in repository methods
   - ✅ Implemented property mapping in service methods
   - ✅ Implemented property mapping in controller methods
   - ✅ Implemented property mapping in API client methods

5. **Updated Type Definitions**:
   - ✅ Updated entity interfaces to use the standardized naming convention
   - ✅ Updated DTO interfaces to use the standardized naming convention
   - ✅ Updated repository interfaces to use the standardized naming convention
   - ✅ Updated component prop types to use the standardized naming convention
   - ✅ Updated component state types to use the standardized naming convention
   - ✅ Updated API client types to use the standardized naming convention

### Current Status

All property naming convention issues have been fixed, and the application now uses consistent naming conventions throughout. The following improvements have been made:

- **Consistent Naming**: The application now uses consistent naming conventions throughout, with snake_case in the backend and database, and camelCase in the frontend.
- **Automatic Conversion**: The application now automatically converts between snake_case and camelCase when transferring data between the frontend and backend.
- **Type Safety**: The application now has better type safety, with proper type definitions for all properties.
- **Maintainability**: The code is now more maintainable, with consistent naming conventions and fewer potential bugs.

## Specific Fixes Implemented

### Backend Fixes

1. **Repository Methods**:
   - Updated the `findByWorldId` method in the `CampaignRepository` to use `world_id` instead of `rpg_world_id`
   - Updated the `findByWorldId` method in the `CharacterRepository` to use `world_id` instead of `rpg_world_id`
   - Updated the `findByWorldId` method in the `LocationRepository` to use `world_id` instead of `rpg_world_id`
   - Updated the `findByWorldId` method in the `ItemRepository` to use `world_id` instead of `rpg_world_id`
   - Updated the `findByWorldId` method in the `EventRepository` to use `world_id` instead of `rpg_world_id`
   - Updated the `findByWorldId` method in the `SessionRepository` to use `world_id` instead of `rpg_world_id`

2. **Service Methods**:
   - Updated the `createCampaign` method in the `CampaignService` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateCampaign` method in the `CampaignService` to use `world_id` instead of `rpg_world_id`
   - Updated the `createCharacter` method in the `CharacterService` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateCharacter` method in the `CharacterService` to use `world_id` instead of `rpg_world_id`
   - Updated the `createLocation` method in the `LocationService` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateLocation` method in the `LocationService` to use `world_id` instead of `rpg_world_id`
   - Updated the `createItem` method in the `ItemService` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateItem` method in the `ItemService` to use `world_id` instead of `rpg_world_id`
   - Updated the `createEvent` method in the `EventService` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateEvent` method in the `EventService` to use `world_id` instead of `rpg_world_id`
   - Updated the `createSession` method in the `SessionService` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateSession` method in the `SessionService` to use `world_id` instead of `rpg_world_id`

3. **Controller Methods**:
   - Updated the `createCampaign` method in the `CampaignController` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateCampaign` method in the `CampaignController` to use `world_id` instead of `rpg_world_id`
   - Updated the `createCharacter` method in the `CharacterController` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateCharacter` method in the `CharacterController` to use `world_id` instead of `rpg_world_id`
   - Updated the `createLocation` method in the `LocationController` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateLocation` method in the `LocationController` to use `world_id` instead of `rpg_world_id`
   - Updated the `createItem` method in the `ItemController` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateItem` method in the `ItemController` to use `world_id` instead of `rpg_world_id`
   - Updated the `createEvent` method in the `EventController` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateEvent` method in the `EventController` to use `world_id` instead of `rpg_world_id`
   - Updated the `createSession` method in the `SessionController` to use `world_id` instead of `rpg_world_id`
   - Updated the `updateSession` method in the `SessionController` to use `world_id` instead of `rpg_world_id`

### Frontend Fixes

1. **API Client Methods**:
   - Updated the `getCampaignsByWorldId` method in the `CampaignService` to use `worldId` instead of `rpgWorldId`
   - Updated the `getCharactersByWorldId` method in the `CharacterService` to use `worldId` instead of `rpgWorldId`
   - Updated the `getLocationsByWorldId` method in the `LocationService` to use `worldId` instead of `rpgWorldId`
   - Updated the `getItemsByWorldId` method in the `ItemService` to use `worldId` instead of `rpgWorldId`
   - Updated the `getEventsByWorldId` method in the `EventService` to use `worldId` instead of `rpgWorldId`
   - Updated the `getSessionsByWorldId` method in the `SessionService` to use `worldId` instead of `rpgWorldId`

2. **Component Props**:
   - Updated the `CampaignForm` component to use `worldId` instead of `rpgWorldId`
   - Updated the `CharacterForm` component to use `worldId` instead of `rpgWorldId`
   - Updated the `LocationForm` component to use `worldId` instead of `rpgWorldId`
   - Updated the `ItemForm` component to use `worldId` instead of `rpgWorldId`
   - Updated the `EventForm` component to use `worldId` instead of `rpgWorldId`
   - Updated the `SessionForm` component to use `worldId` instead of `rpgWorldId`

3. **Component State**:
   - Updated the `CampaignForm` component state to use `worldId` instead of `rpgWorldId`
   - Updated the `CharacterForm` component state to use `worldId` instead of `rpgWorldId`
   - Updated the `LocationForm` component state to use `worldId` instead of `rpgWorldId`
   - Updated the `ItemForm` component state to use `worldId` instead of `rpgWorldId`
   - Updated the `EventForm` component state to use `worldId` instead of `rpgWorldId`
   - Updated the `SessionForm` component state to use `worldId` instead of `rpgWorldId`

## Best Practices

The following best practices were implemented to prevent future property naming convention issues:

1. **Use Consistent Naming Conventions**:
   - Use snake_case for database and backend properties
   - Use camelCase for frontend properties
   - Use automatic conversion between snake_case and camelCase

2. **Use Consistent Foreign Key Naming**:
   - Use the format `entity_name_id` for foreign keys (e.g., `world_id`)
   - Avoid using prefixes like `rpg_` for foreign keys
   - Use the same foreign key name in all related entities

3. **Use Type Definitions**:
   - Define interfaces for all entities with proper property names
   - Define DTOs for data transfer with proper property names
   - Use type mapping for converting between snake_case and camelCase

4. **Use Property Mapping**:
   - Implement property mapping in repository methods
   - Implement property mapping in service methods
   - Implement property mapping in controller methods
   - Implement property mapping in API client methods

5. **Use Consistent Property Access**:
   - Access properties using the correct naming convention for each layer
   - Use property mapping to convert between naming conventions
   - Use type definitions to ensure property names are correct

## Troubleshooting

If you encounter property naming convention issues:

1. **Check the Property Name**:
   - Make sure the property name follows the correct convention for its layer
   - Make sure the property name is consistent across all layers
   - Make sure the property name is properly mapped between layers

2. **Check the Type Definition**:
   - Make sure the type definition includes the property with the correct name
   - Make sure the type definition is used consistently across all layers
   - Make sure the type definition includes all required properties

3. **Check the Property Mapping**:
   - Make sure the property mapping converts the property name correctly
   - Make sure the property mapping is applied consistently
   - Make sure the property mapping handles all properties

4. **Check the Database Schema**:
   - Make sure the database schema uses the correct property names
   - Make sure the database schema is consistent with the type definitions
   - Make sure the database schema includes all required properties

5. **Check the API Endpoints**:
   - Make sure the API endpoints use the correct property names
   - Make sure the API endpoints are consistent with the type definitions
   - Make sure the API endpoints handle all required properties

## Next Steps

1. **Improve Property Mapping**:
   - Add more comprehensive property mapping for complex objects
   - Add property mapping for nested objects
   - Add property mapping for arrays of objects

2. **Add Property Validation**:
   - Add validation for property names
   - Add validation for property types
   - Add validation for property values

3. **Add Property Documentation**:
   - Add JSDoc comments for all properties
   - Add examples for complex properties
   - Add descriptions for property constraints

4. **Add Property Tests**:
   - Add tests for property mapping
   - Add tests for property validation
   - Add tests for property documentation
