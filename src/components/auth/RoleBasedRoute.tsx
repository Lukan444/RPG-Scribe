import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Loader, Text, Paper, Container } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

function RoleBasedRoute({
  children,
  allowedRoles,
  fallbackPath = '/dashboard'
}: RoleBasedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role - temporarily disabled for testing
  console.log('RoleBasedRoute - User role:', user.role, 'Allowed roles:', allowedRoles);

  // Temporarily allow all users to access admin routes for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment && !allowedRoles.includes(user.role)) {
    // If user doesn't have the required role, show access denied or redirect
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder>
          <Text ta="center" size="lg" fw={500} c="red">
            Access Denied
          </Text>
          <Text ta="center" mt="md">
            You don't have permission to access this page.
          </Text>
          <Center mt="xl">
            <Navigate to={fallbackPath} replace />
          </Center>
        </Paper>
      </Container>
    );
  }

  // Render children if authenticated and has the required role
  return <>{children}</>;
}

export default RoleBasedRoute;
