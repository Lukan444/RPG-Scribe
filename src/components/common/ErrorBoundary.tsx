import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text, Button, Stack, Group, Paper, Center, Title } from '@mantine/core';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error with more detailed information
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Log additional details if the error is an object
    if (typeof error === 'object' && error !== null) {
      console.error('Error details:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        errorString: error.toString(),
        // Include other properties from the error object
        ...(Object.fromEntries(
          Object.entries(error).filter(([key]) =>
            !['name', 'message', 'stack'].includes(key)
          )
        ))
      });
    }
  }

  handleRefresh = (): void => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        (this.state.error?.message && this.state.error.message.includes('Loading chunk'));

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Center style={{ width: '100%', height: '100%', padding: '2rem' }}>
          <Paper p="xl" withBorder shadow="md" style={{ maxWidth: '500px' }}>
            <Stack align="center" gap="md">
              <IconAlertCircle size={48} color="red" />
              <Title order={3} c="red">
                {isChunkError ? 'Failed to load application resources' : 'Something went wrong'}
              </Title>
              <Text ta="center">
                {isChunkError
                  ? 'This could be due to a network issue or a recent application update. Please try refreshing the page.'
                  : 'An unexpected error occurred. Please try refreshing the page.'}
              </Text>

              {/* Display error details in development mode */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Paper p="xs" withBorder style={{ maxWidth: '100%', overflow: 'auto' }}>
                  <Text size="sm" fw={700} c="red">Error Details (Development Only):</Text>
                  <Text size="xs" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text size="xs" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', marginTop: '8px' }}>
                      {this.state.error.stack}
                    </Text>
                  )}
                </Paper>
              )}
              <Group>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  color="blue"
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Center>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;