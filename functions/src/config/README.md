# Environment Configuration System

This document provides comprehensive documentation for the environment configuration system used in RPG Scribe's Firebase Functions.

## Overview

The environment configuration system provides a flexible way to configure the application for different environments (development, staging, production). It supports:

- Environment-specific configurations
- Secure credential storage
- Feature flags
- Configuration validation
- Configuration caching

## Configuration Structure

The configuration is structured into several sections:

### Vertex AI Configuration

Controls the Vertex AI integration settings:

```typescript
interface VertexAIConfig {
  environment: string;       // Environment name
  projectId: string;         // Google Cloud project ID
  location: string;          // Google Cloud region
  indexEndpoint: string;     // Vertex AI index endpoint
  embeddingModel: string;    // Embedding model name
  namespace: string;         // Namespace for vector index
  apiEndpoint: string;       // API endpoint
  maxRetries: number;        // Maximum number of retries for API calls
  timeoutMs: number;         // Timeout in milliseconds for API calls
}
```

### Security Configuration

Controls security settings:

```typescript
interface SecurityConfig {
  allowedIPs: string[];      // List of allowed IP addresses or CIDR ranges
  allowedOrigins: string[];  // List of allowed origins
  enableRateLimiting: boolean; // Whether to enable rate limiting
  maxRequestsPerMinute: number; // Maximum number of requests per minute
  enableSecurityLogging: boolean; // Whether to log security events
}
```

### Cost Management Configuration

Controls cost management settings:

```typescript
interface CostConfig {
  dailyBudget: number;       // Daily budget in USD
  alertThresholdPercent: number; // Alert threshold as percentage of budget
  enableUsageTracking: boolean; // Whether to enable usage tracking
  enableCostAllocationByUser: boolean; // Whether to enable cost allocation by user
  enableCostAllocationByWorld: boolean; // Whether to enable cost allocation by world
}
```

### Feature Flags Configuration

Controls feature flags:

```typescript
interface FeatureFlagsConfig {
  enableVertexAI: boolean;   // Whether to enable Vertex AI integration
  enableVectorSearch: boolean; // Whether to enable vector search
  enableRelationshipInference: boolean; // Whether to enable AI-powered relationship inference
  enableContentGeneration: boolean; // Whether to enable AI-powered content generation
  enableSessionAnalysis: boolean; // Whether to enable AI-powered session analysis
}
```

## Default Configurations

The system provides default configurations for development, staging, and production environments. These defaults are used as a fallback if no custom configuration is provided.

## Configuration Sources

The configuration system uses multiple sources for configuration values, in the following order of precedence:

1. Firebase Functions Config (highest precedence)
2. Default configuration for the current environment
3. Default configuration for development (lowest precedence)

## Usage

### Getting the Current Environment

```typescript
import { getCurrentEnvironment } from './config/environment-config';

const environment = getCurrentEnvironment();
console.log(`Current environment: ${environment}`);
```

### Getting the Environment Configuration

```typescript
import { getEnvironmentConfig } from './config/environment-config';

const config = getEnvironmentConfig();
console.log(`Project ID: ${config.vertexAI.projectId}`);
```

### Forcing a Configuration Refresh

```typescript
import { getEnvironmentConfig } from './config/environment-config';

const config = getEnvironmentConfig(true); // Force refresh
```

### Accessing Secure Credentials

```typescript
import { getSecureCredential } from './config/environment-config';

async function getApiKey() {
  const apiKey = await getSecureCredential('apiKey');
  return apiKey;
}
```

### Setting Secure Credentials

```typescript
import { setSecureCredential } from './config/environment-config';

async function updateApiKey(newApiKey: string) {
  await setSecureCredential('apiKey', newApiKey);
}
```

## Configuration Validation

The configuration system validates the configuration to ensure that required values are present and valid. If validation fails, an error is thrown with details about the validation failure.

## Configuration Caching

The configuration is cached for 5 minutes to improve performance. You can force a refresh by passing `true` to the `getEnvironmentConfig` function.

## Secure Credential Storage

Secure credentials are stored in Firestore in the `secureCredentials` collection. Each environment has its own document with credentials stored as key-value pairs.

## Setting Up Firebase Functions Config

To set up the Firebase Functions Config, use the Firebase CLI:

```bash
# Set Vertex AI configuration
firebase functions:config:set vertex_ai.project_id="your-project-id" vertex_ai.location="us-central1" vertex_ai.embedding_model="textembedding-gecko@latest"

# Set security configuration
firebase functions:config:set security.allowed_origins="https://app.rpgscribe.com,https://*.rpgscribe.com" security.enable_rate_limiting="true" security.max_requests_per_minute="30"

# Set feature flags
firebase functions:config:set feature_flags.enable_vertex_ai="true" feature_flags.enable_vector_search="true"
```

## Best Practices

1. **Environment Isolation**: Keep configurations for different environments completely isolated.
2. **Secure Credentials**: Never store sensitive credentials in the code or in Firebase Functions Config. Use the secure credential storage system instead.
3. **Feature Flags**: Use feature flags to control the availability of features in different environments.
4. **Validation**: Always validate configuration values to prevent runtime errors.
5. **Documentation**: Keep this documentation up to date as the configuration system evolves.

## Troubleshooting

### Configuration Not Updating

If configuration changes are not being applied, try:

1. Force a configuration refresh: `getEnvironmentConfig(true)`
2. Verify that the Firebase Functions Config has been updated: `firebase functions:config:get`
3. Redeploy the functions: `firebase deploy --only functions`

### Missing Secure Credentials

If secure credentials are missing:

1. Check that the credential exists in Firestore
2. Verify that the credential key is correct
3. Check that the application has permission to access Firestore

## Security Considerations

1. **Least Privilege**: Use the principle of least privilege when configuring service accounts.
2. **Environment Isolation**: Keep production credentials separate from development and staging.
3. **Credential Rotation**: Rotate credentials regularly.
4. **Audit Logging**: Enable security logging to track access to secure resources.
