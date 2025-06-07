/**
 * Admin Access Guard Component
 * 
 * Restricts access to Live Session Transcription settings to admin users only
 * Provides appropriate access denied messages for non-admin users
 */

import React from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Alert,
  ThemeIcon,
  Center,
  Card
} from '@mantine/core';
import {
  IconShield,
  IconShieldX,
  IconLock,
  IconUserX,
  IconArrowLeft,
  IconHome,
  IconSettings
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Access guard props
 */
export interface AdminAccessGuardProps {
  children: React.ReactNode;
  feature?: string;
  description?: string;
}

/**
 * Admin Access Guard Component
 */
export function AdminAccessGuard({
  children,
  feature = 'Live Session Transcription Settings',
  description = 'This feature requires administrator privileges to access and configure.'
}: AdminAccessGuardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin access
  const hasAdminAccess = user?.role === 'admin';

  // If user has admin access, render children
  if (hasAdminAccess) {
    return <>{children}</>;
  }

  // Render access denied interface
  return (
    <Paper p="xl" withBorder radius="md" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Stack gap="xl" align="center">
        {/* Access Denied Icon */}
        <ThemeIcon
          size={80}
          radius="xl"
          color="red"
          variant="light"
        >
          <IconShieldX size={40} />
        </ThemeIcon>

        {/* Title and Description */}
        <Stack gap="md" align="center">
          <Title order={2} ta="center" c="red">
            Access Denied
          </Title>
          
          <Text size="lg" ta="center" c="dimmed">
            {feature}
          </Text>
          
          <Text size="sm" ta="center" c="dimmed" maw={400}>
            {description}
          </Text>
        </Stack>

        {/* User Role Information */}
        <Card withBorder p="md" w="100%">
          <Group justify="space-between">
            <Group gap="sm">
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconLock size={14} />
              </ThemeIcon>
              <Text size="sm" fw={500}>Current Role:</Text>
            </Group>
            <Text size="sm" c="dimmed" tt="capitalize">
              {user?.role || 'Unknown'}
            </Text>
          </Group>
        </Card>

        {/* Access Requirements */}
        <Alert
          icon={<IconShield size={16} />}
          title="Administrator Access Required"
          color="blue"
          variant="light"
          w="100%"
        >
          <Stack gap="xs">
            <Text size="sm">
              To access Live Session Transcription administrative settings, you need:
            </Text>
            <Stack gap={4} ml="md">
              <Text size="sm">• Administrator role privileges</Text>
              <Text size="sm">• System configuration permissions</Text>
              <Text size="sm">• API key management access</Text>
            </Stack>
            <Text size="sm" mt="xs">
              Please contact your system administrator to request access.
            </Text>
          </Stack>
        </Alert>

        {/* Role-Specific Messages */}
        {user?.role === 'gamemaster' && (
          <Alert
            icon={<IconUserX size={16} />}
            title="Game Master Access"
            color="orange"
            variant="light"
            w="100%"
          >
            <Text size="sm">
              As a Game Master, you can use Live Session Transcription features during gameplay, 
              but administrative configuration is restricted to system administrators.
            </Text>
          </Alert>
        )}

        {user?.role === 'player' && (
          <Alert
            icon={<IconUserX size={16} />}
            title="Player Access"
            color="orange"
            variant="light"
            w="100%"
          >
            <Text size="sm">
              As a Player, you can view transcriptions during sessions, but configuration 
              settings are managed by administrators and Game Masters.
            </Text>
          </Alert>
        )}

        {!user && (
          <Alert
            icon={<IconUserX size={16} />}
            title="Authentication Required"
            color="red"
            variant="light"
            w="100%"
          >
            <Text size="sm">
              You must be logged in with an administrator account to access this feature.
            </Text>
          </Alert>
        )}

        {/* Navigation Actions */}
        <Group gap="md">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          
          <Button
            variant="outline"
            leftSection={<IconHome size={16} />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          
          {user?.role === 'gamemaster' && (
            <Button
              variant="filled"
              leftSection={<IconSettings size={16} />}
              onClick={() => navigate('/admin?tab=general')}
            >
              General Settings
            </Button>
          )}
        </Group>

        {/* Contact Information */}
        <Card withBorder p="md" w="100%" bg="gray.0">
          <Stack gap="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" color="gray" variant="light">
                <IconShield size={14} />
              </ThemeIcon>
              <Text size="sm" fw={500}>Need Administrator Access?</Text>
            </Group>
            
            <Text size="xs" c="dimmed">
              Contact your system administrator or the person who set up RPG Scribe 
              to request administrator privileges for Live Session Transcription configuration.
            </Text>
            
            <Text size="xs" c="dimmed">
              Administrator features include API key management, provider configuration, 
              AI model selection, and system-wide transcription settings.
            </Text>
          </Stack>
        </Card>

        {/* Feature Availability by Role */}
        <Card withBorder p="md" w="100%">
          <Stack gap="md">
            <Text size="sm" fw={500} ta="center">
              Live Session Transcription Access by Role
            </Text>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="xs" color="green" variant="light">
                    <IconShield size={10} />
                  </ThemeIcon>
                  <Text size="xs">Administrator</Text>
                </Group>
                <Text size="xs" c="dimmed">Full configuration access</Text>
              </Group>
              
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="xs" color="blue" variant="light">
                    <IconSettings size={10} />
                  </ThemeIcon>
                  <Text size="xs">Game Master</Text>
                </Group>
                <Text size="xs" c="dimmed">Recording and session control</Text>
              </Group>
              
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="xs" color="orange" variant="light">
                    <IconUserX size={10} />
                  </ThemeIcon>
                  <Text size="xs">Player</Text>
                </Group>
                <Text size="xs" c="dimmed">View transcriptions only</Text>
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Paper>
  );
}

/**
 * Hook to check admin access
 */
export function useAdminAccess() {
  const { user } = useAuth();
  
  return {
    hasAdminAccess: user?.role === 'admin',
    userRole: user?.role,
    isAuthenticated: !!user
  };
}

/**
 * Higher-order component for admin access protection
 */
export function withAdminAccess<P extends object>(
  Component: React.ComponentType<P>,
  feature?: string,
  description?: string
) {
  return function AdminProtectedComponent(props: P) {
    return (
      <AdminAccessGuard feature={feature} description={description}>
        <Component {...props} />
      </AdminAccessGuard>
    );
  };
}
