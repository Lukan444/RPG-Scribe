'use client';

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Group,
  Text,
  Box,
  Collapse,
  ThemeIcon,
  UnstyledButton,
  Stack,
  Divider,
  NavLink,
  Tooltip,
} from '@mantine/core';
import {
  IconChevronRight,
  IconDashboard,
  IconDatabase,
  IconNetwork,
  IconBrain,
  IconDeviceGamepad2,
  IconPhoto,
  IconSettings,
  IconShieldLock,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import './SimpleNavbar.css';
import { ICON_SIZE, ENTITY_ICONS, getEntityColor, EntityType, ENTITY_CATEGORY_COLORS } from '../../constants/iconConfig';

// Define the navigation item interface
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  description?: string;
  children?: NavItem[];
  color?: string;
  requiresWorld?: boolean; // Flag to indicate this navigation requires world context
}

// NavItem component
interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isChildActive: boolean;
  onClick: (path?: string, item?: NavItem) => void;
}

interface NavItemComponentProps extends NavItemProps {
  collapsed?: boolean;
}

function NavItemComponent({ item, isActive, isChildActive, onClick, collapsed = false }: NavItemComponentProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [expanded, setExpanded] = useState(isActive || isChildActive);
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  const handleClick = () => {
    if (collapsed) {
      // When collapsed, clicking always navigates to the path
      if (item.path) {
        onClick(item.path, item);
      }
    } else {
      // Normal behavior when not collapsed
      if (hasChildren) {
        setExpanded(!expanded);
      } else if (item.path) {
        onClick(item.path, item);
      }
    }
  };

  const isItemActive = isActive || isChildActive || (item.path && isPathActive(item.path, currentPath));

  return (
    <Box mb="xs">
      <Tooltip
        label={item.label}
        position="right"
        disabled={!collapsed}
        withArrow
        color={item.color || "teal"}
        multiline
        w={200}
        transitionProps={{ duration: 200 }}
        aria-label={`Navigation item: ${item.label}`}
      >
        <UnstyledButton
          onClick={handleClick}
          className={`nav-link ${isItemActive ? 'active' : ''}`}
          title={item.description}
          style={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '8px 0' : undefined
          }}
          aria-expanded={hasChildren ? expanded : undefined}
          aria-haspopup={hasChildren ? "true" : undefined}
          aria-current={isItemActive ? "page" : undefined}
        >
          <Group justify={collapsed ? "center" : "space-between"} gap={0} style={{ width: '100%' }}>
            <Group gap={collapsed ? 0 : "xs"}>
              <ThemeIcon
                variant={isItemActive ? "filled" : "light"}
                size={30}
                color={item.color || "teal"}
                radius="xl"
                aria-hidden="true"
              >
                {item.icon}
              </ThemeIcon>
              {!collapsed && (
                <Text size="sm" fw={500}>
                  {item.label}
                </Text>
              )}
            </Group>
            {!collapsed && hasChildren && (
              <IconChevronRight
                className="chevron"
                style={{
                  transform: expanded ? 'rotate(90deg)' : 'none',
                }}
                stroke={1.5}
                aria-hidden="true"
              />
            )}
          </Group>
        </UnstyledButton>
      </Tooltip>

      {hasChildren && !collapsed && (
        <Collapse in={expanded}>
          <Box pl="36px" mt="4px">
            {item.children!.map((child) => {
              const childHasChildren = Array.isArray(child.children) && child.children.length > 0;

              if (childHasChildren) {
                // Render a nested NavItemComponent for items with children
                return (
                  <NavItemComponent
                    key={child.id}
                    item={child}
                    isActive={isPathActive(child.path, currentPath)}
                    isChildActive={child.children?.some(grandchild => isPathActive(grandchild.path, currentPath)) || false}
                    onClick={onClick}
                  />
                );
              } else {
                // Render a simple NavLink for items without children
                return (
                  <NavLink
                    key={child.id}
                    label={child.label}
                    description={child.description}
                    leftSection={
                      <ThemeIcon size="sm" variant="light" color={child.color || "gray"} aria-hidden="true">
                        {child.icon}
                      </ThemeIcon>
                    }
                    active={isPathActive(child.path, currentPath)}
                    onClick={() => child.path && onClick(child.path, child)}
                    variant="light"
                    className="child-nav-link"
                    aria-current={isPathActive(child.path, currentPath) ? "page" : undefined}
                  />
                );
              }
            })}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

// Check if a path is active
function isPathActive(path?: string, currentPath?: string) {
  if (!path) return false;
  const pathToCheck = currentPath || window.location.pathname;
  return pathToCheck === path || pathToCheck.startsWith(`${path}/`);
}

interface SimpleNavbarProps {
  collapsed?: boolean;
}

export function SimpleNavbar({ collapsed = false }: SimpleNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation(['ui', 'common']);
  const isAdmin = user?.role === 'admin';

  // Handle navigation
  const handleNavigation = (path?: string, item?: NavItem) => {
    if (path) {
      // Special handling for Live Play - check if we're in a world context
      if (path === '/live-play') {
        const currentPath = location.pathname;
        const worldIdMatch = currentPath.match(/\/rpg-worlds\/([^\/]+)/);

        if (worldIdMatch) {
          // We're in a world context, navigate to world-specific live-play
          const worldId = worldIdMatch[1];
          navigate(`/rpg-worlds/${worldId}/live-play`, {
            state: {
              from: location.pathname,
              timestamp: Date.now()
            }
          });
          return;
        } else {
          // No world context, redirect to dashboard
          navigate('/dashboard', {
            state: {
              from: location.pathname,
              timestamp: Date.now(),
              message: 'Please select an RPG World to use Live Play features.'
            }
          });
          return;
        }
      }

      // Normal navigation for other paths
      navigate(path, {
        state: {
          from: location.pathname,
          timestamp: Date.now()
        }
      });
    }
  };

  // Define main navigation items
  const mainNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: <IconDashboard size={ICON_SIZE} />,
      path: '/dashboard',
      description: 'View your RPG campaign overview and statistics',
    },
    {
      id: 'entity-manager',
      label: t('navigation.entityManager'),
      icon: <IconDatabase size={ICON_SIZE} />,
      path: '/entity-manager',
      description: 'Centralized management for all entity types',
      color: 'teal',
    },
    {
      id: 'game-content',
      label: t('navigation.gameContent'),
      icon: <IconDatabase size={ICON_SIZE} />,
      description: 'Manage all your RPG game content',
      children: [
        // Characters & NPCs Group
        {
          id: 'characters-group',
          label: t('navigation.charactersAndNpcs'),
          icon: (() => {
            const IconComponent = ENTITY_ICONS[EntityType.CHARACTER];
            return <IconComponent size={ICON_SIZE} />;
          })(),
          description: 'Manage characters and factions',
          color: ENTITY_CATEGORY_COLORS.CHARACTER_GROUP,
          children: [
            {
              id: 'characters',
              label: t('navigation.characters'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.CHARACTER];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/characters',
              description: 'Manage player characters and NPCs',
              color: getEntityColor(EntityType.CHARACTER),
            },
            {
              id: 'factions',
              label: t('navigation.factions'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.FACTION];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/factions',
              description: 'Manage organizations and groups',
              color: getEntityColor(EntityType.FACTION),
            },
          ],
        },
        // World Elements Group
        {
          id: 'world-elements-group',
          label: t('navigation.worldElements'),
          icon: (() => {
            const IconComponent = ENTITY_ICONS[EntityType.LOCATION];
            return <IconComponent size={ICON_SIZE} />;
          })(),
          description: 'Manage locations and items',
          color: ENTITY_CATEGORY_COLORS.WORLD_ELEMENTS_GROUP,
          children: [
            {
              id: 'locations',
              label: t('navigation.locations'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.LOCATION];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/locations',
              description: 'Create and organize locations',
              color: getEntityColor(EntityType.LOCATION),
            },
            {
              id: 'items',
              label: t('navigation.items'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.ITEM];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/items',
              description: 'Track magical items and treasures',
              color: getEntityColor(EntityType.ITEM),
            },
          ],
        },
        // Narrative Group
        {
          id: 'narrative-group',
          label: t('navigation.narrative'),
          icon: (() => {
            const IconComponent = ENTITY_ICONS[EntityType.STORY_ARC];
            return <IconComponent size={ICON_SIZE} />;
          })(),
          description: 'Manage story elements',
          color: ENTITY_CATEGORY_COLORS.NARRATIVE_GROUP,
          children: [
            {
              id: 'events',
              label: t('navigation.events'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.EVENT];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/events',
              description: 'Record important events and plot points',
              color: getEntityColor(EntityType.EVENT),
            },
            {
              id: 'sessions',
              label: t('navigation.sessions'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.SESSION];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/sessions',
              description: 'Plan and document your gaming sessions',
              color: getEntityColor(EntityType.SESSION),
            },
            {
              id: 'story-arcs',
              label: t('navigation.storyArcs'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.STORY_ARC];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/story-arcs',
              description: 'Create and manage story arcs',
              color: getEntityColor(EntityType.STORY_ARC),
            },
            {
              id: 'notes',
              label: t('navigation.notes'),
              icon: (() => {
                const IconComponent = ENTITY_ICONS[EntityType.NOTE];
                return <IconComponent size={ICON_SIZE} />;
              })(),
              path: '/notes',
              description: 'Keep campaign notes and information',
              color: getEntityColor(EntityType.NOTE),
            },
          ],
        },
      ],
    },
    {
      id: 'visualization',
      label: t('navigation.visualization'),
      icon: <IconNetwork size={ICON_SIZE} />,
      description: 'Visualize your campaign data',
      children: [
        {
          id: 'mindmap',
          label: t('navigation.mindMap'),
          icon: <IconNetwork size={ICON_SIZE} />,
          path: '/visualizations/mindmap',
          description: t('navigation.createInteractiveMindMaps'),
        },
        {
          id: 'timeline',
          label: t('navigation.timeline'),
          icon: (() => {
            const IconComponent = ENTITY_ICONS[EntityType.STORY_ARC];
            return <IconComponent size={ICON_SIZE} />;
          })(),
          path: '/visualizations/timeline',
          description: t('navigation.viewCampaignEventsChronologically'),
          color: getEntityColor(EntityType.STORY_ARC),
        },
        {
          id: 'relationshipweb',
          label: t('navigation.relationshipWeb'),
          icon: <IconNetwork size={ICON_SIZE} />,
          path: '/visualizations/relationshipweb',
          description: t('navigation.visualizeCharacterRelationships'),
        },
      ],
    },
    {
      id: 'tools',
      label: t('navigation.tools'),
      icon: <IconDeviceGamepad2 size={ICON_SIZE} />,
      description: 'Access RPG tools and utilities',
      children: [
        {
          id: 'ai-brain',
          label: t('navigation.aiBrain'),
          icon: <IconBrain size={ICON_SIZE} />,
          path: '/ai-brain',
          description: t('navigation.accessTheAiAssistant'),
        },
        {
          id: 'live-play',
          label: t('navigation.livePlay'),
          icon: <IconDeviceGamepad2 size={ICON_SIZE} />,
          path: '/live-play',
          description: t('navigation.toolsForRunningLiveGameSessions'),
          requiresWorld: true, // Custom flag to indicate this requires world context
        },
        {
          id: 'media',
          label: t('navigation.mediaLibrary'),
          icon: <IconPhoto size={ICON_SIZE} />,
          path: '/media',
          description: t('navigation.manageMediaFilesForCampaigns'),
        },
      ],
    },
    {
      id: 'settings',
      label: t('navigation.settings'),
      icon: <IconSettings size={ICON_SIZE} />,
      path: '/settings',
      description: 'Configure application settings',
    },
  ];

  // Define admin navigation items
  const adminNavItems: NavItem[] = [
    {
      id: 'admin',
      label: t('navigation.admin'),
      icon: <IconShieldLock size={ICON_SIZE} />,
      color: 'red',
      path: '/admin',
      description: 'Administrative tools and settings',
    },
  ];

  return (
    <Stack gap={collapsed ? 'md' : 'xs'}>
      {!collapsed && (
        <Text size="sm" fw={500} c="dimmed" mb="xs">
          {t('navigation.navigationTitle').toUpperCase()}
        </Text>
      )}

      {mainNavItems.map((item) => {
        const isActive = isPathActive(item.path);
        const isChildActive = item.children?.some(child => isPathActive(child.path)) || false;

        return (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={isActive}
            isChildActive={isChildActive}
            onClick={handleNavigation}
            collapsed={collapsed}
          />
        );
      })}

      {isAdmin && (
        <>
          {!collapsed ? (
            <Divider my="sm" label={t('navigation.admin')} labelPosition="center" />
          ) : (
            <Divider my="sm" />
          )}
          {adminNavItems.map((item) => {
            const isActive = isPathActive(item.path);
            const isChildActive = item.children?.some(child => isPathActive(child.path)) || false;

            return (
              <NavItemComponent
                key={item.id}
                item={item}
                isActive={isActive}
                isChildActive={isChildActive}
                onClick={handleNavigation}
                collapsed={collapsed}
              />
            );
          })}
        </>
      )}
    </Stack>
  );
}

export default SimpleNavbar;
