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
  ActionIcon,
  Menu,
  Button,
  Image,
} from '@mantine/core';
import {
  IconChevronRight,
  IconDashboard,
  IconDatabase,
  IconNetwork,
  IconBrain,
  IconDeviceGamepad2,
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
  IconWorld,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import './RPGWorldNavbar.css';

// Use class names directly
const classes = {
  header: 'header',
  footer: 'footer',
  link: 'link',
  control: 'control',
  chevron: 'chevron',
  links: 'links',
  version: 'version',
  treeNode: 'tree-node',
  treeNodeContent: 'tree-node-content',
  treeNodeChildren: 'tree-node-children',
  actionButton: 'action-button',
};

// Define the tree node interface
interface TreeNodeData {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  description?: string;
  children?: TreeNodeData[];
  color?: string;
  actions?: {
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  };
}

interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  parentPath?: string;
}

function TreeNode({ node, level, parentPath = '' }: TreeNodeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  // Compute the full path for this node
  const nodePath = node.path || (parentPath ? `${parentPath}/${node.id}` : `/${node.id}`);

  // Check if this node or any of its children are active
  const isActive = currentPath === nodePath || currentPath.startsWith(nodePath + '/');
  const isChildActive = hasChildren && node.children!.some(child => {
    const childPath = child.path || `${nodePath}/${child.id}`;
    return currentPath === childPath || currentPath.startsWith(childPath + '/');
  });

  // State for expanded/collapsed
  const [expanded, setExpanded] = useState(isActive || isChildActive);

  // Handle node click
  const handleNodeClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (nodePath) {
      // Navigate to the path and prevent default behavior
      navigate(nodePath);
    }
  };

  // Handle action buttons
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to add page or open modal
    navigate(`${nodePath}/new`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to edit page or open modal
    navigate(`${nodePath}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete ${node.label}?`)) {
      // Delete logic here
      console.log(`Delete ${node.label}`);
    }
  };

  // Determine node type for styling
  const isWorld = level === 1;
  const isCampaign = level === 2;
  const isCampaignDetail = level === 3;

  // Get appropriate color based on node type
  const getNodeColor = () => {
    if (isWorld) return 'blue';
    if (isCampaign) return 'teal';
    if (isCampaignDetail) return 'gray';
    return node.color || 'teal';
  };

  // Get appropriate icon size based on node type
  const getIconSize = () => {
    if (isWorld) return 32;
    if (isCampaign) return 30;
    return 28;
  };

  // Get appropriate font weight based on node type
  const getFontWeight = () => {
    if (isWorld) return 700;
    if (isCampaign) return 600;
    return 500;
  };

  // Get appropriate background color based on node type and state
  const getBackgroundColor = () => {
    if (isActive || isChildActive) {
      return 'var(--mantine-color-dark-5)';
    }
    if (isWorld) {
      return 'var(--mantine-color-dark-7)';
    }
    return 'transparent';
  };

  // Get appropriate border style based on node type
  const getBorderStyle = () => {
    if (isWorld) {
      return {
        borderBottom: '1px solid var(--mantine-color-dark-4)',
        borderTop: '1px solid var(--mantine-color-dark-4)',
      };
    }
    if (isCampaign) {
      return {
        borderLeft: '2px solid var(--mantine-color-teal-7)',
      };
    }
    if (isCampaignDetail) {
      return {
        borderLeft: '1px solid var(--mantine-color-dark-4)',
      };
    }
    return {};
  };

  return (
    <div
      className={classes.treeNode}
      data-level={level}
      style={{
        marginLeft: level > 0 ? `${level * 12}px` : '0',
        ...getBorderStyle(),
      }}
    >
      <Tooltip
        label={node.description || `Navigate to ${node.label}`}
        position="right"
        withArrow
        arrowSize={6}
        transitionProps={{ duration: 200 }}
        openDelay={500}
        color="dark.8"
        w={220}
        multiline
        disabled={expanded}
      >
        <div className={classes.treeNodeContent}>
          <UnstyledButton
            onClick={handleNodeClick}
            className={classes.control}
            data-active={isActive || isChildActive || undefined}
            style={{
              width: 'calc(100% - 40px)',
              backgroundColor: getBackgroundColor(),
              padding: isWorld ? 'var(--mantine-spacing-sm) var(--mantine-spacing-md)' : undefined,
              marginTop: isWorld ? 'var(--mantine-spacing-xs)' : undefined,
              marginBottom: isWorld ? 'var(--mantine-spacing-xs)' : undefined,
              borderRadius: isWorld ? 'var(--mantine-radius-sm)' : undefined,
            }}
          >
            <Group justify="space-between" gap={0}>
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                <ThemeIcon
                  variant={isWorld || isCampaign ? "filled" : "light"}
                  size={getIconSize()}
                  color={getNodeColor()}
                  radius={isWorld ? 'md' : 'xl'}
                >
                  {node.icon}
                </ThemeIcon>
                <Box
                  ml="md"
                  style={{
                    fontWeight: getFontWeight(),
                    fontSize: isWorld ? 'var(--mantine-font-size-md)' : undefined,
                  }}
                >
                  {node.label}
                </Box>
              </Box>
              {hasChildren && (
                <IconChevronRight
                  className={classes.chevron}
                  stroke={1.5}
                  style={{
                    transform: expanded ? 'rotate(90deg)' : 'none',
                  }}
                />
              )}
            </Group>
          </UnstyledButton>

          {/* Action buttons */}
          {node.actions && (
            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  className={classes.actionButton}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDotsVertical size="1rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {node.actions.canAdd && (
                  <Menu.Item leftSection={<IconPlus size="1rem" />} onClick={handleAdd}>
                    Add New
                  </Menu.Item>
                )}
                {node.actions.canEdit && (
                  <Menu.Item leftSection={<IconEdit size="1rem" />} onClick={handleEdit}>
                    Edit
                  </Menu.Item>
                )}
                {node.actions.canDelete && (
                  <Menu.Item
                    leftSection={<IconTrash size="1rem" />}
                    onClick={handleDelete}
                    color="red"
                  >
                    Delete
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </div>
      </Tooltip>

      {/* Children nodes */}
      {hasChildren && (
        <Collapse in={expanded}>
          <div
            className={classes.treeNodeChildren}
            style={{
              paddingLeft: isCampaign ? 'var(--mantine-spacing-xs)' : undefined,
              backgroundColor: isCampaign ? 'var(--mantine-color-dark-7)' : undefined,
            }}
          >
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                parentPath={nodePath}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
}

export function RPGWorldNavbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  // Define mock RPG Worlds
  const mockRpgWorlds: TreeNodeData[] = [
    {
      id: 'rpg-world-1',
      label: 'Eldoria',
      icon: <IconWorld size="1.2rem" />,
      description: 'A dark fantasy world with rich lore and complex politics',
      path: '/rpg-worlds/eldoria',
      actions: {
        canEdit: true,
        canDelete: true,
      },
      children: [
        {
          id: 'campaign-1',
          label: 'Shadows of Eldoria',
          icon: <IconBook size="1.2rem" />,
          path: '/rpg-worlds/eldoria/campaigns/shadows-of-eldoria',
          description: 'A dark fantasy campaign set in a world where the boundaries between the living and the dead have blurred',
          actions: {
            canEdit: true,
            canDelete: true,
          },
          children: [
            {
              id: 'campaign-1-overview',
              label: 'Overview',
              icon: <IconBook size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/shadows-of-eldoria/overview',
              description: 'Campaign overview and summary',
            },
            {
              id: 'campaign-1-characters',
              label: 'Characters',
              icon: <IconUsers size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/shadows-of-eldoria/characters',
              description: 'Characters in this campaign',
              actions: {
                canAdd: true,
              },
            },
            {
              id: 'campaign-1-locations',
              label: 'Locations',
              icon: <IconMap size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/shadows-of-eldoria/locations',
              description: 'Locations in this campaign',
              actions: {
                canAdd: true,
              },
            },
            {
              id: 'campaign-1-sessions',
              label: 'Sessions',
              icon: <IconCalendarEvent size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/shadows-of-eldoria/sessions',
              description: 'Game sessions for this campaign',
              actions: {
                canAdd: true,
              },
            },
          ],
        },
        {
          id: 'campaign-2',
          label: 'Rise of the Dragon Lords',
          icon: <IconBook size="1.2rem" />,
          path: '/rpg-worlds/eldoria/campaigns/rise-of-the-dragon-lords',
          description: 'An epic campaign about the return of ancient dragons to the realm',
          actions: {
            canEdit: true,
            canDelete: true,
          },
          children: [
            {
              id: 'campaign-2-overview',
              label: 'Overview',
              icon: <IconBook size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/rise-of-the-dragon-lords/overview',
              description: 'Campaign overview and summary',
            },
            {
              id: 'campaign-2-characters',
              label: 'Characters',
              icon: <IconUsers size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/rise-of-the-dragon-lords/characters',
              description: 'Characters in this campaign',
              actions: {
                canAdd: true,
              },
            },
            {
              id: 'campaign-2-locations',
              label: 'Locations',
              icon: <IconMap size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/rise-of-the-dragon-lords/locations',
              description: 'Locations in this campaign',
              actions: {
                canAdd: true,
              },
            },
            {
              id: 'campaign-2-sessions',
              label: 'Sessions',
              icon: <IconCalendarEvent size="1.2rem" />,
              path: '/rpg-worlds/eldoria/campaigns/rise-of-the-dragon-lords/sessions',
              description: 'Game sessions for this campaign',
              actions: {
                canAdd: true,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'rpg-world-2',
      label: 'Aetheria',
      icon: <IconWorld size="1.2rem" />,
      description: 'A high-magic steampunk world with floating islands and airships',
      path: '/rpg-worlds/aetheria',
      actions: {
        canEdit: true,
        canDelete: true,
      },
      children: [
        {
          id: 'campaign-3',
          label: 'Sky Pirates of Aetheria',
          icon: <IconBook size="1.2rem" />,
          path: '/rpg-worlds/aetheria/campaigns/sky-pirates',
          description: 'A swashbuckling adventure among the floating islands of Aetheria',
          actions: {
            canEdit: true,
            canDelete: true,
          },
          children: [
            {
              id: 'campaign-3-overview',
              label: 'Overview',
              icon: <IconBook size="1.2rem" />,
              path: '/rpg-worlds/aetheria/campaigns/sky-pirates/overview',
              description: 'Campaign overview and summary',
            },
            {
              id: 'campaign-3-characters',
              label: 'Characters',
              icon: <IconUsers size="1.2rem" />,
              path: '/rpg-worlds/aetheria/campaigns/sky-pirates/characters',
              description: 'Characters in this campaign',
              actions: {
                canAdd: true,
              },
            },
            {
              id: 'campaign-3-locations',
              label: 'Locations',
              icon: <IconMap size="1.2rem" />,
              path: '/rpg-worlds/aetheria/campaigns/sky-pirates/locations',
              description: 'Locations in this campaign',
              actions: {
                canAdd: true,
              },
            },
            {
              id: 'campaign-3-sessions',
              label: 'Sessions',
              icon: <IconCalendarEvent size="1.2rem" />,
              path: '/rpg-worlds/aetheria/campaigns/sky-pirates/sessions',
              description: 'Game sessions for this campaign',
              actions: {
                canAdd: true,
              },
            },
          ],
        },
      ],
    },
  ];

  // Define the RPG World tree structure
  const rpgWorldTree: TreeNodeData = {
    id: 'rpg-worlds',
    label: 'RPG Worlds',
    icon: <IconWorld size="1.2rem" />,
    description: 'Manage your RPG worlds and campaigns',
    actions: {
      canAdd: true,
    },
    children: mockRpgWorlds,
  };

  // Define other navigation items
  const otherNavItems: TreeNodeData[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <IconDashboard size="1.2rem" />,
      path: '/dashboard',
      description: 'View your RPG campaign overview and statistics',
    },

    {
      id: 'visualization',
      label: 'Visualization',
      icon: <IconNetwork size="1.2rem" />,
      description: 'Visualize your campaign data in different formats',
      children: [
        {
          id: 'mindmap',
          label: 'Mind Map',
          icon: <IconNetwork size="1.2rem" />,
          path: '/visualizations/mindmap',
          description: 'Create interactive mind maps of campaign elements',
        },
        {
          id: 'timeline',
          label: 'Timeline',
          icon: <IconCalendarEvent size="1.2rem" />,
          path: '/visualizations/timeline',
          description: 'View campaign events in chronological order',
        },
        {
          id: 'relationshipweb',
          label: 'Relationship Web',
          icon: <IconNetwork size="1.2rem" />,
          path: '/visualizations/relationshipweb',
          description: 'Visualize character relationships and connections',
        },
      ],
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      icon: <IconBrain size="1.2rem" />,
      description: 'Use AI-powered tools to enhance your campaigns',
      children: [
        {
          id: 'ai-brain',
          label: 'AI Brain',
          icon: <IconBrain size="1.2rem" />,
          path: '/ai-brain',
          description: 'Access the AI assistant for campaign help',
        },
        {
          id: 'npc-generator',
          label: 'NPC Generator',
          icon: <IconUsers size="1.2rem" />,
          path: '/npc-generator',
          description: 'Generate detailed NPCs with personalities and backgrounds',
        },
        {
          id: 'plot-ideas',
          label: 'Plot Ideas',
          icon: <IconBook size="1.2rem" />,
          path: '/plot-ideas',
          description: 'Get AI-generated plot hooks and adventure ideas',
        },
      ],
    },
    {
      id: 'game-sessions',
      label: 'Game Sessions',
      icon: <IconDeviceGamepad2 size="1.2rem" />,
      description: 'Tools for running and documenting game sessions',
      children: [
        {
          id: 'live-play',
          label: 'Live Play',
          icon: <IconDeviceGamepad2 size="1.2rem" />,
          path: '/live-play',
          description: 'Tools for running live game sessions',
        },
        {
          id: 'transcripts',
          label: 'Transcripts',
          icon: <IconNotes size="1.2rem" />,
          path: '/transcripts',
          description: 'View and search through session transcripts',
        },
      ],
    },
    {
      id: 'media',
      label: 'Media',
      icon: <IconPhoto size="1.2rem" />,
      description: 'Manage media files for your campaigns',
      children: [
        {
          id: 'images',
          label: 'Images',
          icon: <IconPhoto size="1.2rem" />,
          path: '/images',
          description: 'Store and organize character portraits and scene images',
        },
        {
          id: 'maps',
          label: 'Maps',
          icon: <IconMap size="1.2rem" />,
          path: '/maps',
          description: 'Create and manage campaign maps and battle grids',
        },
        {
          id: 'audio',
          label: 'Audio',
          icon: <IconDeviceGamepad2 size="1.2rem" />,
          path: '/audio',
          description: 'Store music, ambient sounds, and voice recordings',
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <IconChartBar size="1.2rem" />,
      path: '/analytics',
      description: 'View statistics and insights about your campaigns',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <IconSettings size="1.2rem" />,
      path: '/settings',
      description: 'Configure application settings and preferences',
    },
  ];

  // Define admin navigation items
  const adminNavItems: TreeNodeData[] = [
    {
      id: 'admin-panel',
      label: 'Admin Panel',
      icon: <IconShieldLock size="1.2rem" />,
      color: 'red',
      description: 'Administrative tools and settings (admin only)',
      children: [
        {
          id: 'user-management',
          label: 'User Management',
          icon: <IconUsers size="1.2rem" />,
          path: '/admin',
          description: 'Manage users, roles, and permissions',
        },
        {
          id: 'activity-logs',
          label: 'Activity Logs',
          icon: <IconNotes size="1.2rem" />,
          path: '/admin/logs',
          description: 'View user activity and system logs',
        },
        {
          id: 'system-settings',
          label: 'System Settings',
          icon: <IconSettings size="1.2rem" />,
          path: '/admin/settings',
          description: 'Configure system-wide settings and defaults',
        },
      ],
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
        {/* RPG World Tree */}
        <Box mb="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500} c="dimmed">
              RPG WORLDS
            </Text>
            <Tooltip label="Create a new RPG world">
              <ActionIcon
                variant="filled"
                color="blue"
                size="md"
                radius="md"
                onClick={() => navigate('/rpg-worlds/new')}
              >
                <IconPlus size="1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
          <TreeNode node={rpgWorldTree} level={0} />
        </Box>

        <Divider my="sm" label="Tools & Navigation" labelPosition="center" />

        {/* Other Navigation Items */}
        {otherNavItems.map((item) => (
          <TreeNode key={item.id} node={item} level={0} />
        ))}
      </div>

      {/* Admin Navigation Items */}
      {isAdmin && (
        <>
          <Divider my="sm" label="Admin" labelPosition="center" />
          <div className={classes.links}>
            {adminNavItems.map((item) => (
              <TreeNode key={item.id} node={item} level={0} />
            ))}
          </div>
        </>
      )}
    </Stack>
  );
}

export default RPGWorldNavbar;