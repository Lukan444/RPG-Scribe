import React, { useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Center, Loader, Text, Stack } from '@mantine/core';
import i18n from '../../i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Wait for i18n to be ready
        if (i18n.isInitialized) {
          setIsReady(true);
          return;
        }

        // Wait for initialization
        await new Promise<void>((resolve, reject) => {
          if (i18n.isInitialized) {
            resolve();
            return;
          }

          const onInitialized = () => {
            i18n.off('initialized', onInitialized);
            resolve();
          };

          const onFailedLoading = (lng: string, ns: string, msg: string) => {
            console.error(`Failed to load ${lng}/${ns}: ${msg}`);
            i18n.off('failedLoading', onFailedLoading);
            reject(new Error(`Failed to load translations: ${msg}`));
          };

          i18n.on('initialized', onInitialized);
          i18n.on('failedLoading', onFailedLoading);

          // Timeout after 10 seconds
          setTimeout(() => {
            i18n.off('initialized', onInitialized);
            i18n.off('failedLoading', onFailedLoading);
            reject(new Error('i18n initialization timeout'));
          }, 10000);
        });

        console.log('[I18nProvider] i18n initialized successfully');
        setIsReady(true);
      } catch (err) {
        console.error('[I18nProvider] Failed to initialize i18n:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Still set ready to true to prevent infinite loading
        setIsReady(true);
      }
    };

    initializeI18n();
  }, []);

  if (error) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center">
          <Text color="red" fw={500}>Translation System Error</Text>
          <Text size="sm" color="dimmed">{error}</Text>
          <Text size="xs" color="dimmed">The application will continue with default text.</Text>
        </Stack>
      </Center>
    );
  }

  if (!isReady) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading translations...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};

export default I18nProvider;
