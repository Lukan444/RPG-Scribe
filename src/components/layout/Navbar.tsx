'use client';

import { NavLink, Stack, Text, Divider } from '@mantine/core';
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
  IconShieldLock,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

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

  // Check if user has admin role
  const isAdmin = user?.role === 'admin';

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

      {isAdmin && (
        <>
          <Divider my="sm" label="Admin" labelPosition="center" />
          <NavLink
            label="Admin Panel"
            leftSection={<IconShieldLock size="1.2rem" />}
            active={currentPath === '/admin'}
            onClick={() => navigate('/admin')}
            variant="filled"
            color="red"
          />
        </>
      )}
    </Stack>
  );
}

export default Navbar;
