# Core Layout Implementation with Mantine

## Overview

This document outlines the implementation plan for the core layout components of the RPG Archivist application using Mantine. The core layout includes the AppShell, Navbar, Header, and Main Content area, which form the foundation of the application's user interface.

## AppShell Component

The AppShell component provides the overall layout structure for the application. It includes the header, navbar, and main content area.

### Implementation

```tsx
// src/components/layout/AppLayout.tsx
import { useState } from 'react';
import { AppShell, Burger, Group, Title, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDice } from '@tabler/icons-react';
import Sidebar from './Sidebar';
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
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default AppLayout;
```

## Sidebar Component

The Sidebar component provides navigation for the application. It includes links to all major sections of the application.

### Implementation

```tsx
// src/components/layout/Sidebar.tsx
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

export function Sidebar() {
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

export default Sidebar;
```

## Router Configuration

The router configuration sets up the routes for the application and integrates with the AppLayout component.

### Implementation

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import DataHub from './pages/DataHub';
import MindMap from './pages/MindMap';
import Timeline from './pages/Timeline';
import AIBrain from './pages/AIBrain';
import LivePlay from './pages/LivePlay';
import Transcripts from './pages/Transcripts';
import Images from './pages/Images';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
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
          <Route path="data-hub" element={<DataHub />} />
          <Route path="mind-map" element={<MindMap />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="ai-brain" element={<AIBrain />} />
          <Route path="live-play" element={<LivePlay />} />
          <Route path="transcripts" element={<Transcripts />} />
          <Route path="images" element={<Images />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Page Components

Each page component represents a major section of the application. Here's an example of the Dashboard page component.

### Implementation

```tsx
// src/pages/Dashboard.tsx
import { Title, Text, Grid, Card, Group, Stack, Button, Badge } from '@mantine/core';
import { IconPlus, IconArrowRight } from '@tabler/icons-react';

function Dashboard() {
  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>
      
      <Grid>
        {/* Campaign Overview Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm">
            <Title order={4} mb="md">Campaign Overview</Title>
            <Grid>
              <Grid.Col span={6}>
                <Stack align="center" gap="xs">
                  <Text size="xl" fw={700}>12</Text>
                  <Text size="sm" c="dimmed">Sessions</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack align="center" gap="xs">
                  <Text size="xl" fw={700}>24</Text>
                  <Text size="sm" c="dimmed">Characters</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack align="center" gap="xs">
                  <Text size="xl" fw={700}>18</Text>
                  <Text size="sm" c="dimmed">Locations</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack align="center" gap="xs">
                  <Text size="xl" fw={700}>36</Text>
                  <Text size="sm" c="dimmed">Plot Points</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        {/* Quick Links Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm">
            <Title order={4} mb="md">Quick Actions</Title>
            <Group grow>
              <Button leftSection={<IconPlus size="1rem" />}>New World</Button>
              <Button leftSection={<IconPlus size="1rem" />}>New Campaign</Button>
            </Group>
            <Group grow mt="sm">
              <Button leftSection={<IconPlus size="1rem" />}>New Session</Button>
              <Button leftSection={<IconPlus size="1rem" />}>Start Recording</Button>
            </Group>
          </Card>
        </Grid.Col>
        
        {/* Recent Sessions Card */}
        <Grid.Col span={12}>
          <Card withBorder shadow="sm">
            <Group justify="space-between" mb="md">
              <Title order={4}>Recent Sessions</Title>
              <Button variant="subtle" rightSection={<IconArrowRight size="1rem" />}>View All</Button>
            </Group>
            <Stack>
              {[1, 2, 3].map((i) => (
                <Card key={i} withBorder p="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>Session {i}: The Dark Forest</Text>
                      <Text size="xs" c="dimmed">2023-05-{10 + i} • 3 hours</Text>
                    </div>
                    <Badge color="teal">Completed</Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
        
        {/* Outstanding Tasks Card */}
        <Grid.Col span={12}>
          <Card withBorder shadow="sm">
            <Title order={4} mb="md">Outstanding Tasks</Title>
            <Stack>
              {[1, 2, 3].map((i) => (
                <Card key={i} withBorder p="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>AI Proposal: New Character Relationship</Text>
                      <Text size="xs" c="dimmed">Suggested connection between Elara and Thorne</Text>
                    </div>
                    <Group>
                      <Button variant="outline" size="xs">Reject</Button>
                      <Button size="xs">Approve</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default Dashboard;
```

## Responsive Design

The layout is designed to be responsive across different screen sizes:

- **Desktop**: 3-pane layout (tree / list / editor) for screens ≥ 1280px
- **Tablet**: 2-pane layout
- **Mobile**: Stacked layout with collapsible navbar

### Implementation

The responsive behavior is handled by Mantine's AppShell component, which collapses the navbar on mobile devices and shows a burger menu to toggle it.

```tsx
<AppShell
  header={{ height: 60 }}
  navbar={{
    width: 300,
    breakpoint: 'sm', // Collapse navbar on screens smaller than 'sm'
    collapsed: { mobile: !opened }, // Control collapsed state
  }}
  padding="md"
>
  {/* ... */}
</AppShell>
```

## Theme Integration

The layout components integrate with the Mantine theme to ensure consistent styling.

### Implementation

```tsx
// Using theme values in components
import { useMantineTheme } from '@mantine/core';

function ThemedComponent() {
  const theme = useMantineTheme();
  
  return (
    <div style={{ 
      backgroundColor: theme.colors.dark[9],
      color: theme.white,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    }}>
      Themed content
    </div>
  );
}
```

## Accessibility Considerations

The layout components are designed with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Color contrast

### Implementation

```tsx
// Example of accessible navigation
<NavLink
  label="Dashboard"
  leftSection={<IconDashboard size="1.2rem" />}
  active={currentPath === '/dashboard'}
  onClick={() => navigate('/dashboard')}
  aria-current={currentPath === '/dashboard' ? 'page' : undefined}
  role="link"
/>
```

## Testing Strategy

The layout components should be tested to ensure they work correctly across different screen sizes and devices.

### Unit Tests

```tsx
// Example test for AppLayout component
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

test('renders app layout with header and sidebar', () => {
  render(
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
  
  expect(screen.getByText('RPG Archivist')).toBeInTheDocument();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Data Hub')).toBeInTheDocument();
  // ... more assertions
});
```

## Conclusion

This implementation plan provides a comprehensive guide for creating the core layout components of the RPG Archivist application using Mantine. By following this plan, developers can create a consistent, responsive, and accessible layout that forms the foundation of the application's user interface.
