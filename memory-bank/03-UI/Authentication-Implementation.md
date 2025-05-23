# Authentication Implementation with Mantine

## Overview

This document outlines the implementation plan for the authentication components of the RPG Archivist application using Mantine. The authentication system includes login, registration, forgot password, and reset password functionality.

## Authentication Context

The authentication context provides global access to the authentication state and functions.

### Implementation

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Replace with actual API call to check authentication
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        setError('Failed to authenticate');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual API call
      // For demo purposes, we'll simulate a successful login
      const user = {
        id: '1',
        email,
        name: 'John Doe',
        role: 'admin',
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
    } catch (err) {
      setError('Failed to login');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual API call
      // For demo purposes, we'll simulate a successful registration
      const user = {
        id: '1',
        email,
        name,
        role: 'user',
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
    } catch (err) {
      setError('Failed to register');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual API call
      // For demo purposes, we'll just remove the user from localStorage
      localStorage.removeItem('user');
      
      setUser(null);
    } catch (err) {
      setError('Failed to logout');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual API call
      // For demo purposes, we'll just simulate a successful request
      console.log(`Password reset email sent to ${email}`);
    } catch (err) {
      setError('Failed to send password reset email');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual API call
      // For demo purposes, we'll just simulate a successful request
      console.log(`Password reset successful for token ${token}`);
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## Login Component

The login component provides a form for users to log in to the application.

### Implementation

```tsx
// src/pages/auth/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Box,
  Text,
  Anchor,
  Stack,
  Paper,
  Title,
  Container,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconLock } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Welcome to RPG Archivist
        </Title>

        <Divider label="Login with email" labelPosition="center" my="lg" />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
              leftSection={<IconUser size={16} stroke={1.5} />}
              radius="md"
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
              leftSection={<IconLock size={16} stroke={1.5} />}
              radius="md"
            />

            <Group justify="space-between">
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.currentTarget.checked)}
              />
              <Anchor component={Link} to="/forgot-password" size="sm">
                Forgot password?
              </Anchor>
            </Group>
          </Stack>

          {error && (
            <Text color="red" size="sm" mt="sm">
              {error}
            </Text>
          )}

          <Group justify="space-between" mt="xl">
            <Anchor component={Link} to="/register" size="sm">
              Don't have an account? Register
            </Anchor>
            <Button type="submit" radius="xl" loading={loading}>
              Login
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default Login;
```

## Register Component

The register component provides a form for users to create a new account.

### Implementation

```tsx
// src/pages/auth/Register.tsx
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Box,
  Text,
  Anchor,
  Stack,
  Paper,
  Title,
  Container,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconLock, IconMail } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    validate: {
      name: (value) => (value.length >= 2 ? null : 'Name must be at least 2 characters'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value, values) =>
        value === values.password ? null : 'Passwords do not match',
      terms: (value) => (value ? null : 'You must accept the terms and conditions'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await register(values.name, values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Create an Account
        </Title>

        <Divider label="Register with email" labelPosition="center" my="lg" />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              required
              label="Name"
              placeholder="Your name"
              {...form.getInputProps('name')}
              leftSection={<IconUser size={16} stroke={1.5} />}
              radius="md"
            />

            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
              leftSection={<IconMail size={16} stroke={1.5} />}
              radius="md"
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
              leftSection={<IconLock size={16} stroke={1.5} />}
              radius="md"
            />

            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              {...form.getInputProps('confirmPassword')}
              leftSection={<IconLock size={16} stroke={1.5} />}
              radius="md"
            />

            <Checkbox
              label="I agree to the terms and conditions"
              {...form.getInputProps('terms', { type: 'checkbox' })}
            />
          </Stack>

          {error && (
            <Text color="red" size="sm" mt="sm">
              {error}
            </Text>
          )}

          <Group justify="space-between" mt="xl">
            <Anchor component={Link} to="/login" size="sm">
              Already have an account? Login
            </Anchor>
            <Button type="submit" radius="xl" loading={loading}>
              Register
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default Register;
```

## Forgot Password Component

The forgot password component provides a form for users to request a password reset.

### Implementation

```tsx
// src/pages/auth/ForgotPassword.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TextInput,
  Button,
  Group,
  Text,
  Anchor,
  Stack,
  Paper,
  Title,
  Container,
  Divider,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

function ForgotPassword() {
  const { forgotPassword, loading, error } = useAuth();
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await forgotPassword(values.email);
      setSuccess(true);
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Forgot Password
        </Title>

        <Divider label="Reset your password" labelPosition="center" my="lg" />

        {success ? (
          <Alert title="Check your email" color="teal" icon={<IconAlertCircle />}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </Alert>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                required
                label="Email"
                placeholder="your@email.com"
                {...form.getInputProps('email')}
                leftSection={<IconMail size={16} stroke={1.5} />}
                radius="md"
              />
            </Stack>

            {error && (
              <Text color="red" size="sm" mt="sm">
                {error}
              </Text>
            )}

            <Group justify="space-between" mt="xl">
              <Anchor component={Link} to="/login" size="sm">
                Back to login
              </Anchor>
              <Button type="submit" radius="xl" loading={loading}>
                Send Reset Link
              </Button>
            </Group>
          </form>
        )}
      </Paper>
    </Container>
  );
}

export default ForgotPassword;
```

## Reset Password Component

The reset password component provides a form for users to set a new password after receiving a reset link.

### Implementation

```tsx
// src/pages/auth/ResetPassword.tsx
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  PasswordInput,
  Button,
  Group,
  Text,
  Anchor,
  Stack,
  Paper,
  Title,
  Container,
  Divider,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, loading, error } = useAuth();
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value, values) =>
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      return;
    }

    try {
      await resetPassword(token, values.password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  if (!token) {
    return (
      <Container size="xs" py="xl">
        <Paper radius="md" p="xl" withBorder>
          <Alert title="Invalid Token" color="red" icon={<IconAlertCircle />}>
            The password reset link is invalid or has expired. Please request a new password reset link.
          </Alert>
          <Group justify="center" mt="xl">
            <Anchor component={Link} to="/forgot-password">
              Request New Link
            </Anchor>
          </Group>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Reset Password
        </Title>

        <Divider label="Set a new password" labelPosition="center" my="lg" />

        {success ? (
          <Alert title="Password Reset Successful" color="teal" icon={<IconAlertCircle />}>
            Your password has been reset successfully. You will be redirected to the login page shortly.
          </Alert>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <PasswordInput
                required
                label="New Password"
                placeholder="Your new password"
                {...form.getInputProps('password')}
                leftSection={<IconLock size={16} stroke={1.5} />}
                radius="md"
              />

              <PasswordInput
                required
                label="Confirm New Password"
                placeholder="Confirm your new password"
                {...form.getInputProps('confirmPassword')}
                leftSection={<IconLock size={16} stroke={1.5} />}
                radius="md"
              />
            </Stack>

            {error && (
              <Text color="red" size="sm" mt="sm">
                {error}
              </Text>
            )}

            <Group justify="space-between" mt="xl">
              <Anchor component={Link} to="/login" size="sm">
                Back to login
              </Anchor>
              <Button type="submit" radius="xl" loading={loading}>
                Reset Password
              </Button>
            </Group>
          </form>
        )}
      </Paper>
    </Container>
  );
}

export default ResetPassword;
```

## Protected Route Component

The protected route component ensures that only authenticated users can access certain routes.

### Implementation

```tsx
// src/components/auth/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Center, Loader } from '@mantine/core';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

## Integration with App Component

The authentication components are integrated with the App component to provide global authentication state.

### Implementation

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
// ... other imports

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            {/* ... other routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

## Conclusion

This implementation plan provides a comprehensive guide for creating the authentication components of the RPG Archivist application using Mantine. By following this plan, developers can create a secure, user-friendly authentication system that integrates seamlessly with the rest of the application.
