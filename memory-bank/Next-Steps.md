# Next Steps for RPG Archivist Migration

## Overview

This document outlines the immediate next steps for the migration of the RPG Archivist application from Material UI to Mantine. These steps are based on the comprehensive migration plan and are designed to be executed in sequence to ensure a smooth transition.

## Immediate Next Steps

### 1. Project Setup (Week 1)

#### 1.1. Install Mantine Dependencies

```bash
# Install core Mantine packages
npm install @mantine/core @mantine/hooks @mantine/form @mantine/dates @mantine/notifications @mantine/dropzone @mantine/carousel @mantine/spotlight @mantine/modals @mantine/nprogress @mantine/code-highlight

# Install additional dependencies
npm install @tabler/icons-react dayjs embla-carousel-react

# Install PostCSS dependencies
npm install --save-dev postcss postcss-preset-mantine postcss-simple-vars
```

#### 1.2. Configure PostCSS

Create a `postcss.config.cjs` file in the project root:

```js
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

#### 1.3. Create Theme Configuration

Create a `src/theme/theme.ts` file:

```tsx
import { createTheme, MantineColorsTuple } from '@mantine/core';

// Primary accent: Teal/turquoise
const teal: MantineColorsTuple = [
  '#e6fcfc', // 0
  '#d0f7f7', // 1
  '#a3efef', // 2
  '#71e7e7', // 3
  '#4ce0e0', // 4
  '#35dcdc', // 5
  '#1A9B9B', // 6 - Primary
  '#0e7a7a', // 7
  '#006666', // 8
  '#004d4d'  // 9
];

// Secondary accent: Gold/amber
const amber: MantineColorsTuple = [
  '#fff8e1', // 0
  '#ffecb3', // 1
  '#ffe082', // 2
  '#ffd54f', // 3
  '#ffca28', // 4
  '#ffc107', // 5
  '#F6AD55', // 6 - Secondary
  '#ff8f00', // 7
  '#ff6f00', // 8
  '#ff5722'  // 9
];

export const theme = createTheme({
  colors: {
    teal,
    amber,
  },
  primaryColor: 'teal',
  primaryShade: 6,
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
      },
    },
  },
  other: {
    surface: {
      DEFAULT: '#0D1117',
      light: '#1A2233'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0'
    },
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#F56565',
  }
});
```

#### 1.4. Update Application Entry Point

Update `src/index.tsx` to include Mantine styles and provider:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { theme } from './theme/theme';

// Import Mantine styles
import '@mantine/core/styles.css';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ColorSchemeScript />
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);

reportWebVitals();
```

### 2. Core Layout Components (Week 1-2)

#### 2.1. Create AppShell Component

Create a `src/components/layout/AppShell.tsx` file:

```tsx
import { useState } from 'react';
import { AppShell, Burger, Group, Title, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDice } from '@tabler/icons-react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: theme.colors.dark[9],
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          <Group>
            <IconDice size={30} stroke={1.5} />
            <Title order={3}>RPG Archivist</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg={theme.colors.dark[6]}>
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default AppLayout;
```

#### 2.2. Create Navbar Component

Create a `src/components/layout/Navbar.tsx` file:

```tsx
import { useState } from 'react';
import { NavLink, Stack, Text, useMantineTheme } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconDashboard,
  IconDatabase,
  IconNetwork,
  IconTimeline,
  IconBrain,
  IconDeviceGamepad2,
  IconFileText,
  IconPhoto,
  IconChartBar,
  IconSettings,
} from '@tabler/icons-react';

export function Navbar() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', icon: <IconDashboard size="1.2rem" />, path: '/dashboard' },
    { label: 'Data Hub', icon: <IconDatabase size="1.2rem" />, path: '/data-hub' },
    { label: 'Mind Map', icon: <IconNetwork size="1.2rem" />, path: '/mind-map' },
    { label: 'Timeline', icon: <IconTimeline size="1.2rem" />, path: '/timeline' },
    { label: 'AI Brain', icon: <IconBrain size="1.2rem" />, path: '/ai-brain' },
    { label: 'Live Play', icon: <IconDeviceGamepad2 size="1.2rem" />, path: '/live-play' },
    { label: 'Transcripts', icon: <IconFileText size="1.2rem" />, path: '/transcripts' },
    { label: 'Images', icon: <IconPhoto size="1.2rem" />, path: '/images' },
    { label: 'Analytics', icon: <IconChartBar size="1.2rem" />, path: '/analytics' },
    { label: 'Settings', icon: <IconSettings size="1.2rem" />, path: '/settings' },
  ];

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500} c="dimmed" mb="xs">
        NAVIGATION
      </Text>
      
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          label={item.label}
          leftSection={item.icon}
          active={currentPath === item.path}
          onClick={() => navigate(item.path)}
          variant="filled"
          color="teal"
        />
      ))}
    </Stack>
  );
}

export default Navbar;
```

#### 2.3. Update App Component with Routing

Update `src/App.tsx` to include routing:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/NotFound';

function App() {
  // Check if user is authenticated
  const isAuthenticated = true; // Replace with actual auth check

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes */}
        <Route path="/" element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* Add more routes as they are implemented */}
        </Route>
        
        {/* Not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 3. Authentication Components (Week 2)

#### 3.1. Create Authentication Context

Create a `src/contexts/AuthContext.tsx` file:

```tsx
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

  // Implement authentication functions
  // ...

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

#### 3.2. Create Login Component

Create a `src/pages/auth/Login.tsx` file:

```tsx
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

### 4. Testing Setup (Week 2)

#### 4.1. Install Testing Dependencies

```bash
# Install Jest and React Testing Library
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Install Cypress for end-to-end testing
npm install --save-dev cypress

# Install MSW for API mocking
npm install --save-dev msw

# Install Storybook for component documentation and testing
npx storybook init
```

#### 4.2. Configure Jest

Create a `jest.config.js` file in the project root:

```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
```

Create a `src/setupTests.ts` file:

```ts
import '@testing-library/jest-dom';
```

#### 4.3. Configure Cypress

Create a `cypress.json` file in the project root:

```json
{
  "baseUrl": "http://localhost:3000",
  "viewportWidth": 1280,
  "viewportHeight": 720
}
```

## Long-Term Roadmap

### Phase 1: Setup and Core Infrastructure (Week 1-2)

- Project Setup
- Core Layout Components
- Theme Configuration
- Authentication Infrastructure

### Phase 2: Authentication and User Management (Week 3)

- Authentication Components
- User Management
- Form Infrastructure

### Phase 3: Core Features - Data Hub and Mind Map (Week 4-5)

- Data Hub Components
- Mind Map Components
- Common Entity Components

### Phase 4: Campaign and Session Management (Week 6-7)

- Campaign Components
- Session Components
- Timeline Components

### Phase 5: Entity Management (Week 8-9)

- Character Components
- Location Components
- Event Components
- RPG World Components

### Phase 6: AI Features (Week 10-11)

- AI Brain Components
- Proposal Components
- Storytelling Components

### Phase 7: Content Management (Week 12-13)

- Transcript Components
- Image Components
- Content Analysis Components

### Phase 8: Search and Settings (Week 14)

- Search Components
- Settings Components

## Conclusion

This document outlines the immediate next steps for the migration of the RPG Archivist application from Material UI to Mantine. By following these steps, developers can ensure a smooth transition while maintaining code quality and user experience.
