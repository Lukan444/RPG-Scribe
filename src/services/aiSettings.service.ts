import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  AISettings, 
  PromptTemplate, 
  AIProvider, 
  DEFAULT_PROMPT_TEMPLATES,
  PromptContext,
  AIResponse 
} from '../types/ai';
import { UserPreferencesService } from './userPreferences.service';

/**
 * Service for managing AI settings and prompt templates
 */
export class AISettingsService {
  private userPreferencesService: UserPreferencesService;
  private promptTemplatesCollection = 'promptTemplates';

  constructor() {
    this.userPreferencesService = new UserPreferencesService();
  }

  /**
   * Get AI settings for a user
   * @param userId User ID
   * @returns AI settings or default settings if not found
   */
  async getAISettings(userId: string): Promise<AISettings> {
    try {
      const userPrefs = await this.userPreferencesService.getUserPreferences(userId);
      
      if (userPrefs.ai) {
        return userPrefs.ai;
      }

      // Return default AI settings
      return this.getDefaultAISettings();
    } catch (error) {
      console.error('Error getting AI settings:', error);
      return this.getDefaultAISettings();
    }
  }

  /**
   * Update AI settings for a user
   * @param userId User ID
   * @param aiSettings Partial AI settings to update
   * @returns True if successful
   */
  async updateAISettings(userId: string, aiSettings: Partial<AISettings>): Promise<boolean> {
    try {
      const currentPrefs = await this.userPreferencesService.getUserPreferences(userId);
      const defaultSettings = this.getDefaultAISettings();
      const updatedAISettings: AISettings = {
        ...defaultSettings,
        ...currentPrefs.ai,
        ...aiSettings,
        updatedAt: new Date()
      };

      return await this.userPreferencesService.updateUserPreferences(userId, {
        ai: updatedAISettings
      });
    } catch (error) {
      console.error('Error updating AI settings:', error);
      return false;
    }
  }

  /**
   * Get prompt templates for a user
   * @param userId User ID
   * @returns Array of prompt templates
   */
  async getPromptTemplates(userId: string): Promise<PromptTemplate[]> {
    try {
      const q = query(
        collection(db, this.promptTemplatesCollection),
        where('createdBy', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const userTemplates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromptTemplate[];

      // Combine user templates with default templates
      const defaultTemplates = this.getDefaultPromptTemplates(userId);
      return [...defaultTemplates, ...userTemplates];
    } catch (error) {
      console.error('Error getting prompt templates:', error);
      return this.getDefaultPromptTemplates(userId);
    }
  }

  /**
   * Create a new prompt template
   * @param userId User ID
   * @param template Prompt template data
   * @returns Created template with ID
   */
  async createPromptTemplate(userId: string, template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<PromptTemplate | null> {
    try {
      const templateData = {
        ...template,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.promptTemplatesCollection), templateData);
      
      return {
        id: docRef.id,
        ...template,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating prompt template:', error);
      return null;
    }
  }

  /**
   * Update a prompt template
   * @param templateId Template ID
   * @param updates Template updates
   * @returns True if successful
   */
  async updatePromptTemplate(templateId: string, updates: Partial<PromptTemplate>): Promise<boolean> {
    try {
      const docRef = doc(db, this.promptTemplatesCollection, templateId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating prompt template:', error);
      return false;
    }
  }

  /**
   * Delete a prompt template
   * @param templateId Template ID
   * @returns True if successful
   */
  async deletePromptTemplate(templateId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.promptTemplatesCollection, templateId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting prompt template:', error);
      return false;
    }
  }

  /**
   * Execute a prompt template with given context
   * @param context Prompt execution context
   * @returns AI response (mock implementation for now)
   */
  async executePrompt(context: PromptContext): Promise<AIResponse> {
    // This is a mock implementation
    // In a real implementation, this would call the actual AI service
    try {
      const template = await this.getPromptTemplateById(context.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Replace variables in template
      let processedPrompt = template.template;
      Object.entries(context.variables).forEach(([key, value]) => {
        processedPrompt = processedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Mock response
      return {
        id: `response_${Date.now()}`,
        content: `Mock AI response for prompt: "${template.name}"\n\nProcessed prompt:\n${processedPrompt}`,
        metadata: {
          model: 'mock-model',
          provider: 'openai',
          tokensUsed: 150,
          responseTime: 1200,
          timestamp: new Date()
        },
        context,
        success: true
      };
    } catch (error) {
      return {
        id: `error_${Date.now()}`,
        content: '',
        metadata: {
          model: 'mock-model',
          provider: 'openai',
          tokensUsed: 0,
          responseTime: 0,
          timestamp: new Date()
        },
        context,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a specific prompt template by ID
   * @param templateId Template ID
   * @returns Prompt template or null if not found
   */
  private async getPromptTemplateById(templateId: string): Promise<PromptTemplate | null> {
    try {
      const docRef = doc(db, this.promptTemplatesCollection, templateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as PromptTemplate;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting prompt template:', error);
      return null;
    }
  }

  /**
   * Get default AI settings
   * @returns Default AI settings
   */
  private getDefaultAISettings(): AISettings {
    return {
      enabled: false,
      defaultProvider: 'openai',
      models: {
        openai: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        anthropic: {
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        google: {
          provider: 'google',
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        local: {
          provider: 'local',
          model: 'local-model',
          endpoint: 'http://localhost:8080',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        custom: {
          provider: 'custom',
          model: 'custom-model',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      },
      promptTemplates: [],
      autoSuggestions: true,
      contextWindow: 4000,
      responseFormat: 'markdown',
      safetyFilters: true,
      customInstructions: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get default prompt templates with user ID
   * @param userId User ID
   * @returns Array of default prompt templates
   */
  private getDefaultPromptTemplates(userId: string): PromptTemplate[] {
    return DEFAULT_PROMPT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `default_${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    }));
  }
}

// Export singleton instance
export const aiSettingsService = new AISettingsService();
