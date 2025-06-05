import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Timeline Error Boundary Component
 * Catches and handles errors in the timeline component tree
 */
export class TimelineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Timeline Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container size="md" py="xl">
          <Stack gap="md">
            <Alert
              icon={<IconAlertTriangle size="1.5rem" />}
              title="Timeline Error"
              color="red"
              variant="light"
            >
              <Stack gap="sm">
                <Text>
                  An error occurred while loading the timeline. This might be due to:
                </Text>
                <Text component="ul" size="sm">
                  <li>Invalid configuration parameters</li>
                  <li>Network connectivity issues</li>
                  <li>Database access problems</li>
                  <li>Component rendering errors</li>
                </Text>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Stack gap="xs">
                    <Text fw={500} size="sm">Error Details:</Text>
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {this.state.error.message}
                    </Text>
                    {this.state.errorInfo?.componentStack && (
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </Stack>
                )}

                <Button
                  leftSection={<IconRefresh size="1rem" />}
                  onClick={this.handleRetry}
                  variant="light"
                  color="blue"
                  size="sm"
                >
                  Try Again
                </Button>
              </Stack>
            </Alert>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Timeline Configuration Error Component
 * Displays when timeline configuration is invalid
 */
export function TimelineConfigError({ 
  worldId, 
  campaignId, 
  onRetry 
}: { 
  worldId?: string; 
  campaignId?: string; 
  onRetry?: () => void; 
}) {
  return (
    <Alert
      icon={<IconAlertTriangle size="1rem" />}
      title="Timeline Configuration Error"
      color="orange"
      variant="light"
    >
      <Stack gap="sm">
        <Text>
          The timeline cannot be loaded due to missing or invalid configuration:
        </Text>
        <Text component="ul" size="sm">
          {!worldId && <li>World ID is missing</li>}
          {!campaignId && <li>Campaign ID is missing</li>}
        </Text>
        <Text size="sm" c="dimmed">
          Please ensure you have selected a valid world and campaign, or check the URL parameters.
        </Text>
        
        {onRetry && (
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={onRetry}
            variant="light"
            color="blue"
            size="sm"
          >
            Retry Configuration
          </Button>
        )}
      </Stack>
    </Alert>
  );
}

/**
 * Timeline Loading Error Component
 * Displays when timeline data loading fails
 */
export function TimelineLoadingError({ 
  error, 
  onRetry 
}: { 
  error?: string; 
  onRetry?: () => void; 
}) {
  return (
    <Alert
      icon={<IconAlertTriangle size="1rem" />}
      title="Timeline Loading Error"
      color="red"
      variant="light"
    >
      <Stack gap="sm">
        <Text>
          Failed to load timeline data from the database.
        </Text>
        {error && (
          <Text size="sm" c="dimmed">
            Error: {error}
          </Text>
        )}
        <Text size="sm" c="dimmed">
          This might be due to network issues or database connectivity problems.
        </Text>
        
        {onRetry && (
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={onRetry}
            variant="light"
            color="blue"
            size="sm"
          >
            Retry Loading
          </Button>
        )}
      </Stack>
    </Alert>
  );
}
