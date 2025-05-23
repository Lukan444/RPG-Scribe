# RPG Scribe Cloud Functions

This directory contains the Cloud Functions for RPG Scribe, which handle the synchronization of entities with Vertex AI Vector Search.

## Overview

The Cloud Functions in this directory provide the following functionality:

1. **Automatic Entity Synchronization**: When an entity is created or updated in Firestore, it is automatically synchronized with Vertex AI Vector Search.
2. **Manual Entity Synchronization**: A callable function is provided to manually synchronize all entities of a specific type.
3. **Entity Deletion**: When an entity is deleted from Firestore, its embedding is removed from Vertex AI Vector Search.

## Architecture

The Cloud Functions follow the same architecture as the client-side Vector Database Integration:

1. **Abstraction Layer**: The functions use a clean abstraction layer for vector operations.
2. **Resilience Patterns**: Error handling, retries, and circuit breaker patterns are implemented.
3. **Logging and Monitoring**: Comprehensive logging is provided for debugging and monitoring.

## Functions

### `syncEntityToVectorSearch`

This function is triggered when an entity is created, updated, or deleted in Firestore. It extracts text content from the entity, generates an embedding using Vertex AI, and stores the embedding in Vertex AI Vector Search.

```typescript
// Triggered when an entity is created, updated, or deleted
exports.syncEntityToVectorSearch = functions.firestore
  .document("{collection}/{entityId}")
  .onWrite(async (change, context) => {
    // ...
  });
```

### `syncAllEntitiesOfType`

This callable function allows manual synchronization of all entities of a specific type. It can be used to synchronize existing entities or to force resynchronization of all entities.

```typescript
// Callable function to synchronize all entities of a specific type
exports.syncAllEntitiesOfType = functions.https.onCall(async (data, context) => {
    // ...
});
```

## Development

### Prerequisites

- Node.js 18 or later
- Firebase CLI
- Google Cloud SDK

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
firebase functions:config:set environment.name="development" vertex_ai.project_id="your-project-id"
```

### Local Development

1. Build the functions:

```bash
npm run build
```

2. Run the Firebase emulator:

```bash
npm run serve
```

### Deployment

1. Build the functions:

```bash
npm run build
```

2. Deploy the functions:

```bash
npm run deploy
```

## Configuration

The Cloud Functions use the following configuration:

- **Environment**: The current environment (development, staging, production).
- **Vertex AI**: Configuration for Vertex AI, including project ID, location, and embedding model.

Configuration is stored in Firebase Functions Config and can be accessed using `functions.config()`.

## Error Handling

The Cloud Functions implement comprehensive error handling:

1. **Retries**: Retryable errors are automatically retried with exponential backoff.
2. **Logging**: All errors are logged with context for debugging.
3. **Status Updates**: Entity synchronization status is updated in Firestore.

## Monitoring

The Cloud Functions include comprehensive logging for monitoring:

1. **Operation Logging**: Each operation is logged with context.
2. **Error Logging**: All errors are logged with stack traces.
3. **Performance Logging**: Performance metrics are logged for monitoring.

## Security

The Cloud Functions implement security best practices:

1. **Authentication**: Callable functions require authentication.
2. **Authorization**: Callable functions check user roles.
3. **Validation**: All input is validated before processing.
