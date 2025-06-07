/**
 * Live Transcription Configuration Hook
 * 
 * React hook for accessing and managing Live Transcription configuration
 * Provides real-time configuration updates and centralized state management
 */

import { useState, useEffect, useCallback } from 'react';
import { LiveTranscriptionConfigService, ConfigChangeEvent } from '../services/liveTranscriptionConfig.service';
import { LiveTranscriptionConfig } from '../components/admin/LiveTranscriptionSettings';

/**
 * Configuration hook return type
 */
export interface UseLiveTranscriptionConfigReturn {
  config: LiveTranscriptionConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (newConfig: LiveTranscriptionConfig) => Promise<boolean>;
  updateConfigSection: (section: keyof LiveTranscriptionConfig, sectionConfig: any) => Promise<boolean>;
  getConfigValue: (path: string) => Promise<any>;
  setConfigValue: (path: string, value: any) => Promise<boolean>;
  refreshConfig: () => Promise<void>;
  isEnabled: boolean;
  isMaintenanceMode: boolean;
}

/**
 * Hook options
 */
export interface UseLiveTranscriptionConfigOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  watchChanges?: boolean;
}

/**
 * Live Transcription Configuration Hook
 */
export function useLiveTranscriptionConfig(
  options: UseLiveTranscriptionConfigOptions = {}
): UseLiveTranscriptionConfigReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    watchChanges = true
  } = options;

  const [config, setConfig] = useState<LiveTranscriptionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const configService = LiveTranscriptionConfigService.getInstance();

  // Load configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedConfig = await configService.getConfig();
      setConfig(loadedConfig);
    } catch (err) {
      console.error('Error loading Live Transcription configuration:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [configService]);

  // Refresh configuration
  const refreshConfig = useCallback(async () => {
    configService.clearCache();
    await loadConfig();
  }, [configService, loadConfig]);

  // Update entire configuration
  const updateConfig = useCallback(async (newConfig: LiveTranscriptionConfig): Promise<boolean> => {
    try {
      const success = await configService.saveConfig(newConfig);
      if (success) {
        setConfig(newConfig);
      }
      return success;
    } catch (err) {
      console.error('Error updating configuration:', err);
      setError('Failed to update configuration');
      return false;
    }
  }, [configService]);

  // Update configuration section
  const updateConfigSection = useCallback(async (
    section: keyof LiveTranscriptionConfig,
    sectionConfig: any
  ): Promise<boolean> => {
    try {
      const success = await configService.updateConfigSection(section, sectionConfig);
      if (success && config) {
        setConfig(prev => prev ? { ...prev, [section]: sectionConfig } : null);
      }
      return success;
    } catch (err) {
      console.error(`Error updating configuration section ${section}:`, err);
      setError(`Failed to update ${section} configuration`);
      return false;
    }
  }, [configService, config]);

  // Get specific configuration value
  const getConfigValue = useCallback(async (path: string): Promise<any> => {
    try {
      return await configService.getConfigValue(path);
    } catch (err) {
      console.error(`Error getting configuration value ${path}:`, err);
      return undefined;
    }
  }, [configService]);

  // Set specific configuration value
  const setConfigValue = useCallback(async (path: string, value: any): Promise<boolean> => {
    try {
      const success = await configService.setConfigValue(path, value);
      if (success) {
        // Update local state
        const keys = path.split('.');
        setConfig(prev => {
          if (!prev) return null;
          
          const newConfig = { ...prev };
          let current: any = newConfig;
          
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
          return newConfig;
        });
      }
      return success;
    } catch (err) {
      console.error(`Error setting configuration value ${path}:`, err);
      setError(`Failed to update ${path}`);
      return false;
    }
  }, [configService]);

  // Handle configuration changes
  const handleConfigChange = useCallback((event: ConfigChangeEvent) => {
    console.log('Configuration changed:', event);
    // Optionally refresh configuration on external changes
    if (watchChanges) {
      loadConfig();
    }
  }, [watchChanges, loadConfig]);

  // Initial load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Set up change listener
  useEffect(() => {
    if (watchChanges) {
      configService.addChangeListener(handleConfigChange);
      return () => {
        configService.removeChangeListener(handleConfigChange);
      };
    }
  }, [watchChanges, handleConfigChange, configService]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshConfig();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshConfig]);

  // Computed values
  const isEnabled = config?.system?.enabled ?? false;
  const isMaintenanceMode = config?.system?.maintenanceMode ?? false;

  return {
    config,
    loading,
    error,
    updateConfig,
    updateConfigSection,
    getConfigValue,
    setConfigValue,
    refreshConfig,
    isEnabled,
    isMaintenanceMode
  };
}

/**
 * Hook for specific configuration sections
 */
export function useLiveTranscriptionConfigSection<T>(
  section: keyof LiveTranscriptionConfig
): {
  sectionConfig: T | null;
  loading: boolean;
  error: string | null;
  updateSection: (newConfig: T) => Promise<boolean>;
} {
  const { config, loading, error, updateConfigSection } = useLiveTranscriptionConfig();

  const sectionConfig = config ? (config[section] as T) : null;

  const updateSection = useCallback(async (newConfig: T): Promise<boolean> => {
    return await updateConfigSection(section, newConfig);
  }, [updateConfigSection, section]);

  return {
    sectionConfig,
    loading,
    error,
    updateSection
  };
}

/**
 * Hook for checking if Live Transcription is available
 */
export function useLiveTranscriptionAvailability(): {
  isAvailable: boolean;
  isEnabled: boolean;
  isMaintenanceMode: boolean;
  loading: boolean;
  reason?: string;
} {
  const { config, loading, isEnabled, isMaintenanceMode } = useLiveTranscriptionConfig({
    watchChanges: true
  });

  let isAvailable = false;
  let reason: string | undefined;

  if (config) {
    if (isMaintenanceMode) {
      reason = 'Live Transcription is currently in maintenance mode';
    } else if (!isEnabled) {
      reason = 'Live Transcription is disabled by administrator';
    } else if (!config.speechRecognition.vertexAI.apiKey && !config.speechRecognition.openAIWhisper.apiKey) {
      reason = 'No speech recognition providers configured';
    } else {
      // Live transcription is available even without WebSocket (batch mode)
      isAvailable = true;

      // Check if real-time features are available
      const hasWebSocketConfig = config.realTimeFeatures.webSocketServer.url &&
                                 config.realTimeFeatures.webSocketServer.url.trim() !== '' &&
                                 process.env.REACT_APP_ENABLE_REALTIME_TRANSCRIPTION === 'true';

      if (!hasWebSocketConfig) {
        console.log('Real-time transcription disabled - using batch mode');
      }
    }
  }

  return {
    isAvailable,
    isEnabled,
    isMaintenanceMode,
    loading,
    reason
  };
}

/**
 * Hook for getting speech recognition settings
 */
export function useSpeechRecognitionConfig() {
  return useLiveTranscriptionConfigSection('speechRecognition');
}

/**
 * Hook for getting AI assistant settings
 */
export function useAIAssistantConfig() {
  return useLiveTranscriptionConfigSection('aiAssistant');
}

/**
 * Hook for getting collaboration settings
 */
export function useCollaborationConfig() {
  return useLiveTranscriptionConfigSection('collaboration');
}

/**
 * Hook for getting real-time features settings
 */
export function useRealTimeFeaturesConfig() {
  return useLiveTranscriptionConfigSection('realTimeFeatures');
}

/**
 * Hook for getting audio processing settings
 */
export function useAudioProcessingConfig() {
  return useLiveTranscriptionConfigSection('audioProcessing');
}
