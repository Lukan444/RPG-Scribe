'use client';

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Group,
  Code,
  Text,
  Box,
  Collapse,
  ThemeIcon,
  UnstyledButton,
  rem,
  Stack,
  Divider,
  Tooltip,
  Image,
} from '@mantine/core';
import {
  IconChevronRight,
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
  IconUsers,
  IconMap,
  IconSword,
  IconBook,
  IconCalendarEvent,
  IconNotes,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import './NestedNavbar.css';

// Use class names directly
const classes = {
  header: 'header',
  footer: 'footer',
  link: 'link',
  control: 'control',
  chevron: 'chevron',
  links: 'links',
  version: 'version',
};

interface NavbarLinkProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  links?: { label: string; path: string; description?: string }[];
  color?: string;
  description?: string;
}

function NavbarLink({ icon, label, path, links, color = 'teal', description }: NavbarLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const hasLinks = Array.isArray(links) && links.length > 0;
  const [opened, setOpened] = useState(
    hasLinks ? links.some(link => currentPath.startsWith(link.path)) : false
  );

  const isActive = path ? currentPath === path :
    hasLinks ? links.some(link => currentPath === link.path) : false;

  const items = (hasLinks ? links : []).map((link) => (
    <Tooltip
      key={link.path}
      label={link.description || `Navigate to ${link.label}`}
      position="right"
      withArrow
      arrowSize={6}
      transitionProps={{ duration: 200 }}
      openDelay={500}
      color="dark.8"
      w={220}
      multiline
    >
      <UnstyledButton
        className={classes.link}
        onClick={() => navigate(link.path)}
        data-active={currentPath === link.path || undefined}
      >
        <Text ml="30px" size="sm">
          {link.label}
        </Text>
      </UnstyledButton>
    </Tooltip>
  ));

  return (
    <>
      <Tooltip
        label={description || (hasLinks ? `Expand ${label} options` : `Navigate to ${label}`)}
        position="right"
        withArrow
        arrowSize={6}
        transitionProps={{ duration: 200 }}
        openDelay={500}
        color="dark.8"
        w={220}
        multiline
        disabled={opened} // Disable tooltip when menu is expanded
      >
        <UnstyledButton
          onClick={() => {
            if (hasLinks) {
              setOpened((o) => !o);
            } else if (path) {
              navigate(path);
            }
          }}
          className={classes.control}
          data-active={isActive || undefined}
        >
          <Group justify="space-between" gap={0}>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={30} color={color}>
                {icon}
              </ThemeIcon>
              <Box ml="md">{label}</Box>
            </Box>
            {hasLinks && (
              <IconChevronRight
                className={classes.chevron}
                stroke={1.5}
                style={{
                  transform: opened ? 'rotate(90deg)' : 'none',
                }}
              />
            )}
          </Group>
        </UnstyledButton>
      </Tooltip>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}

export function NestedNavbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const mainNavItems: NavbarLinkProps[] = [
    {
      label: 'Dashboard',
      icon: <IconDashboard size="1.2rem" />,
      path: '/dashboard',
      description: 'View your RPG campaign overview and statistics'
    },
    {
      label: 'Campaigns',
      icon: <IconBook size="1.2rem" />,
      description: 'Manage your RPG campaigns and adventures',
      links: [
        {
          label: 'All Campaigns',
          path: '/campaigns',
          description: 'Browse and manage all your RPG campaigns'
        },
        {
          label: 'Create New',
          path: '/campaigns/new',
          description: 'Start a new RPG campaign from scratch'
        },
      ]
    },
    {
      label: 'Game Content',
      icon: <IconDatabase size="1.2rem" />,
      description: 'Manage all your RPG game content and entities',
      links: [
        {
          label: 'Characters',
          path: '/characters',
          description: 'Manage player characters and NPCs in your campaigns'
        },
        {
          label: 'Locations',
          path: '/locations',
          description: 'Create and organize locations, dungeons, and maps'
        },
        {
          label: 'Items',
          path: '/items',
          description: 'Track magical items, weapons, and treasures'
        },
        {
          label: 'Events',
          path: '/events',
          description: 'Record important events and plot points'
        },
        {
          label: 'Sessions',
          path: '/sessions',
          description: 'Plan and document your gaming sessions'
        },
        {
          label: 'Notes',
          path: '/notes',
          description: 'Keep campaign notes and important information'
        },
      ]
    },
    {
      label: 'Visualization',
      icon: <IconNetwork size="1.2rem" />,
      description: 'Visualize your campaign data in different formats',
      links: [
        {
          label: 'Mind Map',
          path: '/mind-map',
          description: 'Create interactive mind maps of campaign elements'
        },
        {
          label: 'Timeline',
          path: '/timeline',
          description: 'View campaign events in chronological order'
        },
        {
          label: 'Relationship Web',
          path: '/relationships',
          description: 'Visualize character relationships and connections'
        },
      ]
    },
    {
      label: 'AI Tools',
      icon: <IconBrain size="1.2rem" />,
      description: 'Use AI-powered tools to enhance your campaigns',
      links: [
        {
          label: 'AI Brain',
          path: '/ai-brain',
          description: 'Access the AI assistant for campaign help'
        },
        {
          label: 'NPC Generator',
          path: '/npc-generator',
          description: 'Generate detailed NPCs with personalities and backgrounds'
        },
        {
          label: 'Plot Ideas',
          path: '/plot-ideas',
          description: 'Get AI-generated plot hooks and adventure ideas'
        },
      ]
    },
    {
      label: 'Game Sessions',
      icon: <IconDeviceGamepad2 size="1.2rem" />,
      description: 'Tools for running and documenting game sessions',
      links: [
        {
          label: 'Live Play',
          path: '/live-play',
          description: 'Tools for running live game sessions'
        },
        {
          label: 'Session Planner',
          path: '/session-planner',
          description: 'Plan upcoming game sessions and encounters'
        },
        {
          label: 'Transcripts',
          path: '/transcripts',
          description: 'View and search through session transcripts'
        },
      ]
    },
    {
      label: 'Media',
      icon: <IconPhoto size="1.2rem" />,
      description: 'Manage media files for your campaigns',
      links: [
        {
          label: 'Images',
          path: '/images',
          description: 'Store and organize character portraits and scene images'
        },
        {
          label: 'Maps',
          path: '/maps',
          description: 'Create and manage campaign maps and battle grids'
        },
        {
          label: 'Audio',
          path: '/audio',
          description: 'Store music, ambient sounds, and voice recordings'
        },
      ]
    },
    {
      label: 'Analytics',
      icon: <IconChartBar size="1.2rem" />,
      path: '/analytics',
      description: 'View statistics and insights about your campaigns'
    },
    {
      label: 'Settings',
      icon: <IconSettings size="1.2rem" />,
      path: '/settings',
      description: 'Configure application settings and preferences'
    },
  ];

  const adminNavItems: NavbarLinkProps[] = [
    {
      label: 'Admin Panel',
      icon: <IconShieldLock size="1.2rem" />,
      color: 'red',
      description: 'Administrative tools and settings (admin only)',
      links: [
        {
          label: 'User Management',
          path: '/admin',
          description: 'Manage users, roles, and permissions'
        },
        {
          label: 'Activity Logs',
          path: '/admin/logs',
          description: 'View user activity and system logs'
        },
        {
          label: 'System Settings',
          path: '/admin/settings',
          description: 'Configure system-wide settings and defaults'
        },
      ]
    },
  ];

  return (
    <Stack gap="xs">
      <Box className={classes.header}>
        <Group justify="space-between">
          <Group>
            <Image
              src="/logo.png"
              alt="RPG Scribe Logo"
              style={{
                height: 'clamp(24px, 2rem, 28px)',
                width: 'auto',
                objectFit: 'contain',
                maxWidth: '100%'
              }}
            />
          </Group>
          <Code fw={700} className={classes.version}>
            v1.0.0
          </Code>
        </Group>
      </Box>

      <div className={classes.links}>
        {mainNavItems.map((item) => (
          <NavbarLink
            key={item.label}
            icon={item.icon}
            label={item.label}
            path={item.path}
            links={item.links}
            color={item.color}
          />
        ))}
      </div>

      {isAdmin && (
        <>
          <Divider my="sm" label="Admin" labelPosition="center" />
          <div className={classes.links}>
            {adminNavItems.map((item) => (
              <NavbarLink
                key={item.label}
                icon={item.icon}
                label={item.label}
                path={item.path}
                links={item.links}
                color={item.color}
              />
            ))}
          </div>
        </>
      )}
    </Stack>
  );
}

export default NestedNavbar;