# Provider Architecture in RPG Archivist

## Overview
This document provides a comprehensive overview of the provider architecture in the RPG Archivist application, consolidating information from various provider-focused files.

## Provider Types

### LLM (Language Model) Providers
- **Purpose**: Provide text generation and analysis
- **Capabilities**: Text completion, chat completion, embeddings
- **Use Cases**: AI Brain, storytelling assistance, content analysis

### STT (Speech-to-Text) Providers
- **Purpose**: Provide audio transcription
- **Capabilities**: Audio transcription, speaker identification, word-level timestamps
- **Use Cases**: Session recording, transcription, analysis

### IMG (Image Generation) Providers
- **Purpose**: Provide image generation and editing
- **Capabilities**: Image generation, image editing, image variations
- **Use Cases**: Character portraits, location images, item illustrations

## Provider Architecture Components

### Provider Interface
- **BaseProvider**: Abstract base class for all providers
- **LLMProvider**: Interface for language model providers
- **STTProvider**: Interface for speech-to-text providers
- **IMGProvider**: Interface for image generation providers

### Provider Registry
- **ProviderRegistry**: Manages the registration and discovery of providers
- **registerProvider**: Registers a provider with the registry
- **getProvider**: Gets a provider by name
- **getProvidersByKind**: Gets providers by kind (LLM, STT, IMG)
- **getDefaultProvider**: Gets the default provider for a kind

### Provider Factory
- **ProviderFactory**: Creates provider instances based on configuration
- **createProvider**: Creates a provider instance
- **createProviders**: Creates all provider instances
- **getProviderConfig**: Gets the configuration for a provider

### Provider Router
- **ProviderRouter**: Routes requests to the appropriate provider
- **getLLMProvider**: Gets the LLM provider to use for a request
- **getSTTProvider**: Gets the STT provider to use for a request
- **getIMGProvider**: Gets the IMG provider to use for a request
- **routeRequest**: Routes a request to the appropriate provider

## Community Providers

### Ollama (LLM)
- **Models**: Llama, Mistral, Phi, Gemma
- **Capabilities**: Text completion, chat completion
- **Configuration**: API URL, model name, parameters

### Vosk (STT)
- **Models**: Vosk small, Vosk medium, Vosk large
- **Capabilities**: Audio transcription, word-level timestamps
- **Configuration**: API URL, model name, language

### Stable Diffusion (IMG)
- **Models**: Stable Diffusion 1.5, 2.0, XL
- **Capabilities**: Image generation, image editing
- **Configuration**: API URL, model name, parameters

## Premium Providers

### OpenAI (LLM)
- **Models**: GPT-3.5, GPT-4
- **Capabilities**: Text completion, chat completion, embeddings
- **Configuration**: API key, model name, parameters

### Whisper (STT)
- **Models**: Whisper small, medium, large
- **Capabilities**: Audio transcription, language detection
- **Configuration**: API key, model name, parameters

### DALL·E (IMG)
- **Models**: DALL·E 2, DALL·E 3
- **Capabilities**: Image generation, image editing, image variations
- **Configuration**: API key, model name, parameters

## Provider Management UI

### Provider Settings Page
- **ProviderSettingsPage**: Main page for provider settings
- **ProviderTabs**: Tabs for different provider kinds (LLM, STT, IMG)
- **ProviderList**: List of providers for a kind
- **ProviderCard**: Card displaying provider information
- **ProviderConfig**: Dialog for configuring a provider
- **ProviderMetrics**: Display of provider usage metrics

### Provider Service
- **ProviderService**: Frontend service for provider management
- **getProviders**: Gets all providers
- **getProvidersByKind**: Gets providers by kind
- **getDefaultProvider**: Gets the default provider for a kind
- **setDefaultProvider**: Sets the default provider for a kind
- **updateProviderConfig**: Updates a provider's configuration
- **testProvider**: Tests a provider's availability

## Subscription-Aware Provider Settings

### Subscription Tiers
- **Free**: Access to community providers only
- **Basic**: Access to community providers and basic premium features
- **Pro**: Access to all providers and features
- **Enterprise**: Custom provider configuration and support

### Feature Flags
- **isPremiumFeature**: Checks if a feature is premium
- **hasAccess**: Checks if a user has access to a feature
- **getAvailableProviders**: Gets providers available to a user
- **getAvailableModels**: Gets models available to a user

### UI Implementation
- **SubscriptionBadge**: Displays subscription tier on provider cards
- **UpgradePrompt**: Prompts users to upgrade for premium features
- **FeatureComparison**: Compares features across subscription tiers
- **SubscriptionSettings**: Settings for managing subscription

## Dual-Model Approach

### Concept
- **Community Model**: Always available, runs locally
- **Premium Model**: Available with subscription, runs in the cloud
- **Fallback Mechanism**: Uses community model if premium model is unavailable

### Implementation
- **ModelSelector**: Selects the appropriate model based on user preferences and subscription
- **FallbackStrategy**: Implements fallback logic for when a model is unavailable
- **ModelComparison**: Provides comparison between community and premium models
- **UserPreferences**: Stores user preferences for model selection

## Provider API

### Provider Endpoints
- **GET /api/providers**: Gets all providers
- **GET /api/providers/:kind**: Gets providers by kind
- **GET /api/providers/:kind/:name**: Gets a specific provider
- **PUT /api/providers/:kind/:name**: Updates a provider's configuration
- **POST /api/providers/:kind/:name/test**: Tests a provider's availability
- **GET /api/providers/defaults**: Gets default providers
- **PUT /api/providers/defaults/:kind**: Sets the default provider for a kind

### Provider Settings Endpoints
- **GET /api/provider-settings**: Gets provider settings
- **PUT /api/provider-settings**: Updates provider settings
- **GET /api/provider-settings/user**: Gets user-specific provider settings
- **PUT /api/provider-settings/user**: Updates user-specific provider settings

## Conclusion
The provider architecture in RPG Archivist provides a flexible and extensible system for integrating AI services into the application. The architecture supports both community and premium providers, with a dual-model approach that ensures availability while offering premium features to subscribers. The provider management UI provides an intuitive interface for configuring and managing providers, with subscription-aware settings that guide users to the appropriate subscription tier for their needs.
