# API Connection Test Plan

This document outlines the testing strategy for verifying the connection between our frontend components and the backend API routes.

## Test Objectives

1. Verify that all entity types (Character, Location, Item, Event) can perform CRUD operations through the API
2. Verify that specialized queries work correctly
3. Verify that error handling works as expected
4. Verify that fallback to Firestore works when API calls fail

## Test Environment Setup

1. Configure the application to use the API by setting `API_CONFIG.USE_API = true`
2. Ensure the backend API server is running and accessible
3. Create a test database with sample data for testing
4. Set up mock server for testing error scenarios and fallback mechanisms

## Test Categories

### 1. CRUD Operations Tests

For each entity type (Character, Location, Item, Event), test the following operations:

#### Create Operation
- Test creating a new entity with valid data
- Test creating a new entity with invalid data (validation errors)
- Test creating a new entity with missing required fields
- Test creating a new entity with duplicate data (if applicable)

#### Read Operations
- Test retrieving a single entity by ID
- Test retrieving all entities
- Test retrieving entities with pagination
- Test retrieving non-existent entities

#### Update Operations
- Test updating an entity with valid data
- Test updating an entity with invalid data
- Test updating a non-existent entity
- Test partial updates (only updating specific fields)

#### Delete Operations
- Test deleting an existing entity
- Test deleting a non-existent entity
- Test deleting an entity with relationships (if applicable)

### 2. Specialized Queries Tests

For each entity type, test the specialized query methods:

#### Character
- Test `getCharactersByType`
- Test `getCharactersByPlayer`
- Test `getCharactersByLocation`

#### Location
- Test `getLocationsByType`
- Test `getLocationsByParent`

#### Item
- Test `getItemsByType`
- Test `getItemsByRarity`
- Test `getItemsByOwner`
- Test `getUnownedItems`

#### Event
- Test `getEventsByType`
- Test `getEventsByImportance`
- Test `getEventsByLocation`
- Test `getEventsBySession`
- Test `getEventsByDateRange`

### 3. Error Handling Tests

For each entity type, test the following error scenarios:

- Test network errors (server unreachable)
- Test authentication errors (401 Unauthorized)
- Test authorization errors (403 Forbidden)
- Test not found errors (404 Not Found)
- Test validation errors (400 Bad Request)
- Test server errors (500 Internal Server Error)

### 4. Fallback Mechanism Tests

For each entity type, test the fallback to Firestore when API calls fail:

- Test fallback when API server is unreachable
- Test fallback when API returns an error
- Test fallback when API times out

## Test Implementation Approach

We will implement the tests using Jest and React Testing Library. The tests will be organized as follows:

1. Unit tests for API service adapters
2. Unit tests for entity services
3. Integration tests for components that use the entity services

### Mock Server Setup

We will use MSW (Mock Service Worker) to mock the API responses for testing. This will allow us to:

- Simulate successful API responses
- Simulate error responses
- Simulate network errors
- Control the timing of responses (for testing timeouts)

### Test Data

We will create a set of test data for each entity type that will be used across all tests. This will ensure consistency and make it easier to verify the results.

## Test Execution Plan

1. Run unit tests for API service adapters
2. Run unit tests for entity services
3. Run integration tests for components
4. Run end-to-end tests for complete workflows

## Test Reporting

Test results will be collected and reported in the following formats:

1. Console output during test execution
2. HTML report for visual inspection
3. JSON report for integration with CI/CD pipelines

## Continuous Integration

Tests will be integrated into the CI/CD pipeline to ensure that API connections are working correctly before deployment.

## Test Maintenance

Tests should be updated whenever:

1. New API endpoints are added
2. Existing API endpoints are modified
3. Entity models are changed
4. Business logic related to API calls is modified

## Example Test Cases

Below are examples of test cases for each category:

### CRUD Operations Test Example (Character)

```typescript
describe('CharacterAPIService', () => {
  describe('CRUD operations', () => {
    test('should create a new character', async () => {
      // Test implementation
    });
    
    test('should retrieve a character by ID', async () => {
      // Test implementation
    });
    
    test('should update a character', async () => {
      // Test implementation
    });
    
    test('should delete a character', async () => {
      // Test implementation
    });
  });
});
```

### Specialized Queries Test Example (Character)

```typescript
describe('CharacterAPIService', () => {
  describe('specialized queries', () => {
    test('should retrieve characters by type', async () => {
      // Test implementation
    });
    
    test('should retrieve characters by player', async () => {
      // Test implementation
    });
    
    test('should retrieve characters by location', async () => {
      // Test implementation
    });
  });
});
```

### Error Handling Test Example (Character)

```typescript
describe('CharacterAPIService', () => {
  describe('error handling', () => {
    test('should handle network errors', async () => {
      // Test implementation
    });
    
    test('should handle authentication errors', async () => {
      // Test implementation
    });
    
    test('should handle not found errors', async () => {
      // Test implementation
    });
  });
});
```

### Fallback Mechanism Test Example (Character)

```typescript
describe('CharacterService', () => {
  describe('fallback mechanism', () => {
    test('should fall back to Firestore when API is unreachable', async () => {
      // Test implementation
    });
    
    test('should fall back to Firestore when API returns an error', async () => {
      // Test implementation
    });
  });
});
```
