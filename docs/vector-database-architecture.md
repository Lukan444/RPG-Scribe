# Vector Database Integration Architecture for RPG Scribe

**Version**: 1.0  
**Date**: 2025-05-22  
**Status**: Design Phase  

## Executive Summary

This document outlines the comprehensive architecture for integrating Google's Vertex AI Vector Search capabilities into RPG Scribe, enabling semantic search, AI-powered relationship inference, and enhanced content discovery across all RPG entities.

## Architecture Overview

### Hybrid Data Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Firestore     │    │   Vertex AI Vector   │    │   Application       │
│   (Entity Data) │◄──►│   Search (Embeddings)│◄──►│   Layer             │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
         │                        │                           │
         │                        │                           │
         ▼                        ▼                           ▼
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Entity CRUD   │    │   Vector Operations  │    │   Search & AI       │
│   Relationships │    │   Similarity Search  │    │   Features          │
│   Metadata      │    │   Embedding Storage  │    │   User Interface    │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### Core Components

1. **Entity Data Layer (Firestore)**
   - Primary storage for all RPG entities
   - Relationship management
   - User permissions and metadata
   - Vector embedding references

2. **Vector Search Layer (Vertex AI)**
   - High-dimensional embedding storage
   - Semantic similarity search
   - AI-powered content discovery
   - Scalable vector operations

3. **Abstraction Layer**
   - Unified API for vector operations
   - Provider-agnostic interfaces
   - Fallback mechanisms
   - Performance optimization

## Entity-to-Vector Mapping Strategy

### Reference-Based Approach

```typescript
// Firestore Entity Document
interface EntityWithVectorRef {
  id: string;
  title: string;
  description: string;
  // ... other entity fields
  
  // Vector references
  vectorRefs: {
    title: string;        // Vertex AI vector ID for title embedding
    description: string;  // Vertex AI vector ID for description embedding
    combined: string;     // Vertex AI vector ID for combined content
  };
  
  // Vector metadata
  vectorMetadata: {
    lastUpdated: Timestamp;
    embeddingModel: string;
    schemaVersion: number;
  };
}
```

### Vertex AI Index Structure

```
Index: rpg-scribe-entities-{environment}
├── Namespace: characters
├── Namespace: locations  
├── Namespace: items
├── Namespace: events
├── Namespace: factions
├── Namespace: notes
└── Namespace: campaigns
```

## Synchronization Architecture

### Event-Driven Synchronization

```typescript
// Firestore Trigger → Cloud Function → Vertex AI Update
export const onEntityUpdate = functions.firestore
  .document('entities/{entityType}/{entityId}')
  .onWrite(async (change, context) => {
    const entity = change.after.data();
    
    // Generate embeddings
    const embeddings = await generateEntityEmbeddings(entity);
    
    // Update Vertex AI Vector Search
    await updateVectorIndex(entity.id, embeddings);
    
    // Update entity with vector references
    await updateEntityVectorRefs(entity.id, embeddings.refs);
  });
```

### Batch Processing Pipeline

```
Entity Updates → Queue → Batch Processor → Vertex AI Bulk Update
     │              │           │                    │
     ▼              ▼           ▼                    ▼
[Real-time]    [Cloud Tasks] [Functions]     [Vector Index]
```

## Resilience and Fallback Strategy

### Circuit Breaker Pattern

```typescript
class VectorSearchService {
  private circuitBreaker: CircuitBreaker;
  
  async semanticSearch(query: string): Promise<SearchResult[]> {
    return this.circuitBreaker.execute(async () => {
      // Primary: Vertex AI Vector Search
      return await this.vertexAISearch(query);
    }, {
      fallback: async () => {
        // Fallback: Keyword search in Firestore
        return await this.keywordSearch(query);
      }
    });
  }
}
```

### Fallback Chain

1. **Primary**: Vertex AI Vector Search
2. **Secondary**: Cached vector results
3. **Tertiary**: Firestore keyword search
4. **Final**: Basic text filtering

## Performance Optimization

### Caching Strategy

```typescript
interface CacheConfig {
  // Multi-level caching
  browser: {
    ttl: 300000;     // 5 minutes
    maxSize: 100;    // 100 queries
  };
  
  server: {
    ttl: 3600000;    // 1 hour
    maxSize: 1000;   // 1000 queries
  };
  
  embeddings: {
    ttl: 86400000;   // 24 hours
    maxSize: 10000;  // 10k embeddings
  };
}
```

### Dimension Optimization

- **Base Dimensions**: 768 (text-embedding-ada-002)
- **Optimized Dimensions**: 384 (PCA reduction)
- **Cost Reduction**: ~50% storage and compute costs
- **Quality Threshold**: >95% similarity preservation

## Security and Privacy

### Data Protection

```typescript
interface SecurityConfig {
  // Entity-level security
  applyEntityPermissions: true;
  
  // Data minimization
  excludeFields: ['privateNotes', 'playerSecrets'];
  
  // Encryption in transit
  tlsRequired: true;
  
  // Access control
  serviceAccountAuth: true;
  rateLimiting: {
    requestsPerMinute: 100;
    burstLimit: 20;
  };
}
```

## Schema Evolution Strategy

### Progressive Enhancement

```typescript
interface EntitySchemaV1 {
  id: string;
  title: string;
  description: string;
  // No vector fields
}

interface EntitySchemaV2 extends EntitySchemaV1 {
  vectorRefs?: VectorReferences;     // Optional for backward compatibility
  vectorMetadata?: VectorMetadata;   // Optional for backward compatibility
  schemaVersion: number;             // Required for migration tracking
}
```

### Migration Path

1. **Phase 1**: Add optional vector fields to existing entities
2. **Phase 2**: Background processing to generate embeddings
3. **Phase 3**: Enable vector search features progressively
4. **Phase 4**: Full vector-enhanced experience

## Cost Optimization

### Strategies

1. **Dimension Reduction**: 768 → 384 dimensions (~50% cost reduction)
2. **Selective Embedding**: Only embed content-rich entities
3. **Batch Processing**: Reduce API call overhead
4. **Caching**: Minimize redundant operations
5. **Query Optimization**: Pre-filter before vector search

### Budget Controls

```typescript
interface CostControls {
  dailyBudget: 50;           // $50/day limit
  alertThreshold: 0.8;       // Alert at 80% of budget
  emergencyShutoff: 0.95;    // Stop at 95% of budget
  
  optimizations: {
    dimensionReduction: true;
    aggressiveCaching: true;
    batchProcessing: true;
  };
}
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create Vertex AI project and indexes
- [ ] Implement basic embedding generation
- [ ] Set up Firestore schema extensions
- [ ] Create abstraction layer interfaces

### Phase 2: Core Integration (Weeks 3-4)
- [ ] Implement synchronization pipeline
- [ ] Create vector search service
- [ ] Add fallback mechanisms
- [ ] Implement caching strategy

### Phase 3: Features (Weeks 5-6)
- [ ] Semantic search UI
- [ ] AI-powered relationship suggestions
- [ ] Content similarity features
- [ ] Performance optimization

### Phase 4: Production (Weeks 7-8)
- [ ] Security hardening
- [ ] Cost optimization
- [ ] Monitoring and alerting
- [ ] Documentation and training

## Success Metrics

- **Search Quality**: >90% user satisfaction with semantic search
- **Performance**: <500ms average response time
- **Availability**: >99.9% uptime with fallback systems
- **Cost Efficiency**: <$100/month for typical usage
- **Adoption**: >80% of users engaging with AI features

## Next Steps

1. **Create Vertex AI Project**: Set up Google Cloud project and enable APIs
2. **Implement Entity Models**: Extend existing models with vector fields
3. **Build Embedding Service**: Create service for generating embeddings
4. **Develop Synchronization**: Implement Firestore → Vertex AI sync
5. **Create Search Interface**: Build semantic search UI components

---

*This architecture document will be updated as implementation progresses and requirements evolve.*
