import React, { ReactNode } from 'react';
import { RPGWorldProvider } from '../../contexts/RPGWorldContext';
import ErrorBoundary from './ErrorBoundary';
import { Center, Text, Button, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface RPGWorldContextWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A wrapper component that provides the RPGWorldProvider context
 * and handles errors gracefully with a fallback UI
 */
export function RPGWorldContextWrapper({
  children,
  fallback
}: RPGWorldContextWrapperProps) {
  const navigate = useNavigate();

  // Custom error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => {
    const isContextError = error.message.includes('useRPGWorld must be used within an RPGWorldProvider');

    return (
      <Center p="xl">
        <Stack align="center" gap="md" style={{ maxWidth: 500 }}>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Context Error"
            color="red"
            variant="filled"
          >
            {isContextError ? (
              <Text>
                RPG World context is not available. This usually happens when accessing a character
                directly without selecting a world first.
              </Text>
            ) : (
              <Text>{error.message}</Text>
            )}
          </Alert>

          <Stack gap="xs">
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={resetErrorBoundary}>
              Try Again
            </Button>
          </Stack>
        </Stack>
      </Center>
    );
  };

  // Create the fallback element with the ErrorFallback component
  const errorFallbackElement = (
    <ErrorFallback
      error={new Error('RPG World context error')}
      resetErrorBoundary={() => window.location.reload()}
    />
  );

  return (
    <ErrorBoundary fallback={errorFallbackElement}>
      <RPGWorldProvider>
        {children}
      </RPGWorldProvider>
    </ErrorBoundary>
  );
}

export default RPGWorldContextWrapper;
