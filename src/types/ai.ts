/**
 * AI and prompt-related type definitions for RPG Scribe
 */

/**
 * Prompt template categories for different use cases
 */
export type PromptCategory = 
  | 'character-generation'
  | 'world-building'
  | 'story-development'
  | 'session-planning'
  | 'npc-creation'
  | 'location-description'
  | 'item-creation'
  | 'dialogue-generation'
  | 'custom';

/**
 * AI model providers supported by the application
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local' | 'custom';

/**
 * Individual prompt template interface
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  template: string;
  variables: PromptVariable[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

/**
 * Variables that can be used in prompt templates
 */
export interface PromptVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'entity';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  entityType?: string; // For entity type
}

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  endpoint?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

/**
 * AI settings interface extending user preferences
 */
export interface AISettings {
  enabled: boolean;
  defaultProvider: AIProvider;
  models: Record<AIProvider, AIModelConfig>;
  promptTemplates: PromptTemplate[];
  autoSuggestions: boolean;
  contextWindow: number;
  responseFormat: 'text' | 'markdown' | 'json';
  safetyFilters: boolean;
  customInstructions: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Prompt execution context
 */
export interface PromptContext {
  templateId: string;
  variables: Record<string, any>;
  entityContext?: {
    type: string;
    id: string;
    data: any;
  };
  campaignContext?: {
    id: string;
    name: string;
  };
  userContext?: {
    id: string;
    preferences: any;
  };
}

/**
 * AI response interface
 */
export interface AIResponse {
  id: string;
  content: string;
  metadata: {
    model: string;
    provider: AIProvider;
    tokensUsed: number;
    responseTime: number;
    timestamp: Date;
  };
  context: PromptContext;
  success: boolean;
  error?: string;
}

/**
 * Default prompt templates for common RPG scenarios
 */
export const DEFAULT_PROMPT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Character Background Generator',
    description: 'Generate detailed character backgrounds and motivations',
    category: 'character-generation',
    template: `Create a detailed background for a {{characterClass}} named {{characterName}} in a {{setting}} campaign. 

Character Details:
- Race: {{race}}
- Class: {{characterClass}}
- Level: {{level}}

Please include:
1. Personal history and upbringing
2. Key motivations and goals
3. Important relationships
4. Notable achievements or failures
5. Personality traits and quirks

Setting: {{setting}}
Tone: {{tone}}`,
    variables: [
      { name: 'characterName', description: 'Character name', type: 'text', required: true },
      { name: 'characterClass', description: 'Character class', type: 'text', required: true },
      { name: 'race', description: 'Character race', type: 'text', required: true },
      { name: 'level', description: 'Character level', type: 'number', required: false, defaultValue: 1 },
      { name: 'setting', description: 'Campaign setting', type: 'text', required: true },
      { name: 'tone', description: 'Narrative tone', type: 'select', required: false, defaultValue: 'heroic', options: ['heroic', 'dark', 'comedic', 'mysterious', 'epic'] }
    ],
    isDefault: true,
    isActive: true,
    tags: ['character', 'background', 'generation']
  },
  {
    name: 'Location Description',
    description: 'Generate vivid descriptions for locations and environments',
    category: 'location-description',
    template: `Describe a {{locationType}} called "{{locationName}}" in detail.

Location Type: {{locationType}}
Setting: {{setting}}
Atmosphere: {{atmosphere}}
Size: {{size}}

Please include:
1. Visual appearance and architecture
2. Sounds, smells, and atmosphere
3. Notable features or landmarks
4. Inhabitants or creatures
5. Potential plot hooks or secrets

Make the description immersive and suitable for a {{setting}} campaign.`,
    variables: [
      { name: 'locationName', description: 'Name of the location', type: 'text', required: true },
      { name: 'locationType', description: 'Type of location', type: 'select', required: true, options: ['tavern', 'dungeon', 'city', 'forest', 'castle', 'temple', 'shop', 'wilderness'] },
      { name: 'setting', description: 'Campaign setting', type: 'text', required: true },
      { name: 'atmosphere', description: 'Desired atmosphere', type: 'select', required: false, defaultValue: 'neutral', options: ['welcoming', 'mysterious', 'dangerous', 'peaceful', 'bustling', 'eerie'] },
      { name: 'size', description: 'Location size', type: 'select', required: false, defaultValue: 'medium', options: ['small', 'medium', 'large', 'massive'] }
    ],
    isDefault: true,
    isActive: true,
    tags: ['location', 'description', 'environment']
  },
  {
    name: 'NPC Generator',
    description: 'Create interesting NPCs with personalities and motivations',
    category: 'npc-creation',
    template: `Create an NPC for a {{setting}} campaign with the following details:

Basic Info:
- Role: {{role}}
- Race: {{race}}
- Gender: {{gender}}
- Age: {{age}}

Please provide:
1. Name and physical description
2. Personality traits and mannerisms
3. Background and occupation
4. Goals and motivations
5. Relationships with other NPCs or factions
6. Potential plot hooks involving this NPC
7. Notable possessions or abilities

Setting: {{setting}}
Importance: {{importance}}`,
    variables: [
      { name: 'role', description: 'NPC role or occupation', type: 'text', required: true },
      { name: 'race', description: 'NPC race', type: 'text', required: false },
      { name: 'gender', description: 'NPC gender', type: 'select', required: false, options: ['male', 'female', 'non-binary', 'other'] },
      { name: 'age', description: 'Age category', type: 'select', required: false, options: ['young', 'adult', 'middle-aged', 'elderly'] },
      { name: 'setting', description: 'Campaign setting', type: 'text', required: true },
      { name: 'importance', description: 'NPC importance', type: 'select', required: false, defaultValue: 'minor', options: ['minor', 'moderate', 'major', 'critical'] }
    ],
    isDefault: true,
    isActive: true,
    tags: ['npc', 'character', 'generation']
  }
];
