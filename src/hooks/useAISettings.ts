import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { aiSettingsService } from '../services/aiSettings.service';
import { AISettings, PromptTemplate } from '../types/ai';
import { notifications } from '@mantine/notifications';

/**
 * Custom hook for managing AI settings
 */
export const useAISettings = () => {
  const { user } = useAuth();
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load AI settings and prompt templates
   */
  const loadAISettings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [settings, templates] = await Promise.all([
        aiSettingsService.getAISettings(user.id),
        aiSettingsService.getPromptTemplates(user.id)
      ]);

      setAISettings(settings);
      setPromptTemplates(templates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI settings';
      setError(errorMessage);
      console.error('Error loading AI settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Update AI settings
   */
  const updateAISettings = useCallback(async (updates: Partial<AISettings>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const success = await aiSettingsService.updateAISettings(user.id, updates);
      
      if (success) {
        setAISettings(prev => prev ? { ...prev, ...updates } : null);
        notifications.show({
          title: 'Settings Updated',
          message: 'AI settings have been saved successfully',
          color: 'green'
        });
        return true;
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update AI settings';
      notifications.show({
        title: 'Update Failed',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    }
  }, [user?.id]);

  /**
   * Create a new prompt template
   */
  const createPromptTemplate = useCallback(async (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const newTemplate = await aiSettingsService.createPromptTemplate(user.id, template);
      
      if (newTemplate) {
        setPromptTemplates(prev => [...prev, newTemplate]);
        notifications.show({
          title: 'Template Created',
          message: `Prompt template "${template.name}" has been created`,
          color: 'green'
        });
        return newTemplate;
      } else {
        throw new Error('Failed to create template');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create prompt template';
      notifications.show({
        title: 'Creation Failed',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    }
  }, [user?.id]);

  /**
   * Update a prompt template
   */
  const updatePromptTemplate = useCallback(async (templateId: string, updates: Partial<PromptTemplate>) => {
    try {
      const success = await aiSettingsService.updatePromptTemplate(templateId, updates);
      
      if (success) {
        setPromptTemplates(prev => 
          prev.map(template => 
            template.id === templateId 
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          )
        );
        notifications.show({
          title: 'Template Updated',
          message: 'Prompt template has been updated successfully',
          color: 'green'
        });
        return true;
      } else {
        throw new Error('Failed to update template');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update prompt template';
      notifications.show({
        title: 'Update Failed',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    }
  }, []);

  /**
   * Delete a prompt template
   */
  const deletePromptTemplate = useCallback(async (templateId: string) => {
    try {
      const success = await aiSettingsService.deletePromptTemplate(templateId);
      
      if (success) {
        setPromptTemplates(prev => prev.filter(template => template.id !== templateId));
        notifications.show({
          title: 'Template Deleted',
          message: 'Prompt template has been deleted successfully',
          color: 'green'
        });
        return true;
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete prompt template';
      notifications.show({
        title: 'Deletion Failed',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    }
  }, []);

  /**
   * Execute a prompt template
   */
  const executePrompt = useCallback(async (templateId: string, variables: Record<string, any>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const context = {
        templateId,
        variables,
        userContext: {
          id: user.id,
          preferences: aiSettings
        }
      };

      const response = await aiSettingsService.executePrompt(context);
      
      if (response.success) {
        notifications.show({
          title: 'Prompt Executed',
          message: 'AI response generated successfully',
          color: 'green'
        });
      } else {
        throw new Error(response.error || 'Failed to execute prompt');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute prompt';
      notifications.show({
        title: 'Execution Failed',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    }
  }, [user?.id, aiSettings]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    loadAISettings();
  }, [loadAISettings]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadAISettings();
  }, [loadAISettings]);

  return {
    // State
    aiSettings,
    promptTemplates,
    loading,
    error,
    
    // Actions
    updateAISettings,
    createPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    executePrompt,
    refresh,
    
    // Computed values
    isAIEnabled: aiSettings?.enabled ?? false,
    hasTemplates: promptTemplates.length > 0,
    defaultTemplates: promptTemplates.filter(t => t.isDefault),
    customTemplates: promptTemplates.filter(t => !t.isDefault)
  };
};
