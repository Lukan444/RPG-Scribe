import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Box,
  ThemeIcon,
  Divider,
  Button,
  rem,
  useMantineTheme,
  Container
} from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import {
  IconWorld,
  IconUsers,
  IconMapPin,
  IconSword,
  IconCalendarEvent,
  IconShield,
  IconBook,
  IconNotes,
  IconMap,
  IconChevronRight,
  IconEye,
  IconEdit,
  IconTimeline,
  IconChevronLeft
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { RPGWorld } from '../../models/RPGWorld';

interface EntityStats {
  count: number;
  lastUpdated: Date | null;
  relationshipCount: number;
  typeBreakdown: Array<{ type: string; count: number; label: string }>;
  recentEntities: Array<{ id: string; name: string; createdAt: Date; type?: string }>;
}

interface RPGWorldCarouselProps {
  worlds: RPGWorld[];
  loading?: boolean;
  onViewWorld?: (worldId: string) => void;
  onEditWorld?: (worldId: string) => void;
  entityStats?: {
    characters: EntityStats;
    factions: EntityStats;
    locations: EntityStats;
    items: EntityStats;
    events: EntityStats;
    sessions: EntityStats;
    storyArcs: EntityStats;
    notes: EntityStats;
    campaigns: EntityStats;
  };
}

// Network node interface for the mind-map style layout
interface NetworkNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  color: string;
  x: number;
  y: number;
  onClick?: () => void;
  children?: NetworkNode[];
}

// Network node component
interface NetworkNodeComponentProps {
  node: NetworkNode;
  theme: any;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function NetworkNodeComponent({ node, theme, isExpanded, onToggle }: NetworkNodeComponentProps) {
  const isCenter = node.id === 'rpg-world';

  return (
    <Box
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      }}
    >
      <Group
        gap="xs"
        style={{
          padding: isCenter ? '12px 16px' : '8px 12px',
          borderRadius: theme.radius.lg,
          cursor: node.onClick ? 'pointer' : 'default',
          background: `linear-gradient(135deg, ${theme.colors[node.color]?.[7] || theme.colors.cyan[7]} 0%, ${theme.colors[node.color]?.[8] || theme.colors.cyan[8]} 100%)`,
          border: `2px solid ${theme.colors[node.color]?.[4] || theme.colors.cyan[4]}`,
          boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.4),
            0 0 30px ${theme.colors[node.color]?.[4] || theme.colors.cyan[4]}60,
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          transition: 'all 0.3s ease',
          minWidth: isCenter ? '140px' : '120px',
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={node.onClick}
        onMouseEnter={(e) => {
          if (node.onClick) {
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05) translateY(-2px)';
            e.currentTarget.style.boxShadow = `
              0 8px 25px rgba(0, 0, 0, 0.5),
              0 0 40px ${theme.colors[node.color]?.[4] || theme.colors.cyan[4]}80,
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          e.currentTarget.style.boxShadow = `
            0 4px 20px rgba(0, 0, 0, 0.4),
            0 0 30px ${theme.colors[node.color]?.[4] || theme.colors.cyan[4]}60,
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `;
        }}
      >
        <ThemeIcon
          size={isCenter ? "lg" : "sm"}
          variant="light"
          color={node.color}
          style={{
            flexShrink: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: `1px solid ${theme.colors[node.color]?.[3] || theme.colors.cyan[3]}`
          }}
        >
          {node.icon}
        </ThemeIcon>

        <Text
          size={isCenter ? "md" : "sm"}
          fw={800}
          c="white"
          style={{
            textAlign: 'center',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.5px'
          }}
        >
          {node.label}
        </Text>

        {node.count !== undefined && (
          <Badge
            size="sm"
            variant="filled"
            color={node.color}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              minWidth: '24px',
              height: '24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.3), 0 0 12px ${theme.colors[node.color]?.[4] || theme.colors.cyan[4]}60`,
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {node.count}
          </Badge>
        )}
      </Group>
    </Box>
  );
}

interface WorldCardProps {
  world: RPGWorld;
  onView: (worldId: string) => void;
  onEdit: (worldId: string) => void;
  entityStats?: {
    characters: EntityStats;
    factions: EntityStats;
    locations: EntityStats;
    items: EntityStats;
    events: EntityStats;
    sessions: EntityStats;
    storyArcs: EntityStats;
    notes: EntityStats;
    campaigns: EntityStats;
  };
}

// Enhanced connection line component with animations
interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  theme: any;
  curved?: boolean;
}

function ConnectionLine({ from, to, color, theme, curved = true }: ConnectionLineProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Create curved path for more organic appearance
  const curvePath = curved
    ? `M ${from.x} ${from.y} Q ${midX + (from.y - to.y) * 0.2} ${midY + (to.x - from.x) * 0.2} ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.colors[color]?.[6] || theme.colors.cyan[6]} stopOpacity="0.3" />
          <stop offset="50%" stopColor={theme.colors[color]?.[4] || theme.colors.cyan[4]} stopOpacity="0.8" />
          <stop offset="100%" stopColor={theme.colors[color]?.[6] || theme.colors.cyan[6]} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Main connection line */}
      <path
        d={curvePath}
        stroke={`url(#gradient-${color})`}
        strokeWidth="3"
        fill="none"
        style={{
          filter: `drop-shadow(0 0 6px ${theme.colors[color]?.[3] || theme.colors.cyan[3]})`,
        }}
      />

      {/* Animated flowing effect */}
      <path
        d={curvePath}
        stroke={theme.colors[color]?.[4] || theme.colors.cyan[4]}
        strokeWidth="2"
        fill="none"
        strokeDasharray="8,12"
        style={{
          animation: 'flowingData 3s linear infinite',
          opacity: 0.7
        }}
      />

      <style>
        {`
          @keyframes flowingData {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 20; }
          }
        `}
      </style>
    </svg>
  );
}

function WorldCard({ world, onView, onEdit, entityStats }: WorldCardProps) {
  const { t } = useTranslation(['ui', 'entities']);
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['campaigns', 'world-elements', 'narrative']);

  const handleEntityClick = (entityType: string) => {
    if (world.id) {
      navigate(`/rpg-worlds/${world.id}/${entityType}`);
    }
  };

  // Enhanced network layout based on visual reference - better positioning and organization
  const centerX = 300;
  const centerY = 220;

  // Central RPG World node - larger and more prominent
  const centralNode: NetworkNode = {
    id: 'rpg-world',
    label: 'RPG WORLD',
    icon: <IconWorld size={24} />,
    color: 'cyan',
    x: centerX,
    y: centerY
  };

  // Primary branch nodes positioned strategically around the center
  const primaryNodes: NetworkNode[] = [
    {
      id: 'campaigns',
      label: 'CAMPAIGNS',
      icon: <IconMap size={16} />,
      count: entityStats?.campaigns?.count || world.campaignCount || 0,
      color: 'blue',
      x: centerX - 180,
      y: centerY - 60,
      onClick: () => handleEntityClick('campaigns')
    },
    {
      id: 'characters',
      label: 'CHARACTERS',
      icon: <IconUsers size={16} />,
      count: entityStats?.characters?.count || world.characterCount || 0,
      color: 'green',
      x: centerX + 180,
      y: centerY - 60,
      onClick: () => handleEntityClick('characters')
    },
    {
      id: 'locations',
      label: 'LOCATIONS',
      icon: <IconMapPin size={16} />,
      count: entityStats?.locations?.count || world.locationCount || 0,
      color: 'orange',
      x: centerX + 180,
      y: centerY + 60,
      onClick: () => handleEntityClick('locations')
    },
    {
      id: 'factions',
      label: 'FACTIONS',
      icon: <IconShield size={16} />,
      count: entityStats?.factions?.count || world.factionCount || 0,
      color: 'yellow',
      x: centerX,
      y: centerY + 140,
      onClick: () => handleEntityClick('factions')
    }
  ];

  // Secondary nodes positioned more strategically based on visual reference
  const secondaryNodes: NetworkNode[] = [
    // Connected to Campaigns (left side)
    {
      id: 'sessions',
      label: 'SESSIONS',
      icon: <IconTimeline size={14} />,
      count: entityStats?.sessions?.count || world.sessionCount || 0,
      color: 'cyan',
      x: centerX - 320,
      y: centerY - 20,
      onClick: () => handleEntityClick('sessions')
    },
    {
      id: 'story-arcs',
      label: 'STORY ARCS',
      icon: <IconBook size={14} />,
      count: entityStats?.storyArcs?.count || 0,
      color: 'indigo',
      x: centerX - 240,
      y: centerY - 140,
      onClick: () => handleEntityClick('story-arcs')
    },
    // Connected to Locations (right side)
    {
      id: 'items',
      label: 'ITEMS',
      icon: <IconSword size={14} />,
      count: entityStats?.items?.count || world.itemCount || 0,
      color: 'purple',
      x: centerX + 320,
      y: centerY + 20,
      onClick: () => handleEntityClick('items')
    },
    // Connected to Factions (bottom area)
    {
      id: 'notes',
      label: 'NOTES',
      icon: <IconNotes size={14} />,
      count: entityStats?.notes?.count || world.noteCount || 0,
      color: 'gray',
      x: centerX - 120,
      y: centerY + 240,
      onClick: () => handleEntityClick('notes')
    },
    {
      id: 'events',
      label: 'EVENTS',
      icon: <IconCalendarEvent size={14} />,
      count: entityStats?.events?.count || world.eventCount || 0,
      color: 'red',
      x: centerX + 120,
      y: centerY + 240,
      onClick: () => handleEntityClick('events')
    }
  ];

  // Define connections between nodes
  const connections = [
    // Central to primary
    { from: centralNode, to: primaryNodes[0], color: 'blue' }, // campaigns
    { from: centralNode, to: primaryNodes[1], color: 'green' }, // characters
    { from: centralNode, to: primaryNodes[2], color: 'orange' }, // locations
    { from: centralNode, to: primaryNodes[3], color: 'yellow' }, // factions

    // Primary to secondary
    { from: primaryNodes[0], to: secondaryNodes[0], color: 'cyan' }, // campaigns -> sessions
    { from: primaryNodes[0], to: secondaryNodes[1], color: 'indigo' }, // campaigns -> story-arcs
    { from: primaryNodes[2], to: secondaryNodes[2], color: 'purple' }, // locations -> items
    { from: primaryNodes[3], to: secondaryNodes[3], color: 'gray' }, // factions -> notes
    { from: primaryNodes[3], to: secondaryNodes[4], color: 'red' }, // factions -> events
  ];

  const allNodes = [centralNode, ...primaryNodes, ...secondaryNodes];

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        height: '600px',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        background: `linear-gradient(135deg, ${theme.colors.dark[8]} 0%, ${theme.colors.dark[6]} 100%)`,
        border: `2px solid ${theme.colors.cyan[4]}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Enhanced Header Section with Background Image Support */}
      <Card.Section>
        <Box
          style={{
            height: '180px',
            background: world.imageURL
              ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${world.imageURL})`
              : `linear-gradient(135deg, ${theme.colors.cyan[6]} 0%, ${theme.colors.blue[6]} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderBottom: `2px solid ${theme.colors.cyan[4]}`
          }}
        >
          {/* Overlay for better text readability */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: world.imageURL
                ? 'linear-gradient(135deg, rgba(26, 27, 35, 0.7) 0%, rgba(45, 55, 72, 0.5) 100%)'
                : 'transparent',
              zIndex: 1
            }}
          />

          {/* Header Content */}
          <Box style={{ position: 'relative', zIndex: 2, padding: '20px' }}>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text
                  fw={800}
                  size="xxl"
                  c="white"
                  lineClamp={1}
                  style={{
                    marginBottom: '8px',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    fontSize: '28px'
                  }}
                >
                  {world.name}
                </Text>
                <Group gap="xs" style={{ marginBottom: '12px' }}>
                  <Badge
                    variant="light"
                    color="cyan"
                    size="md"
                    style={{
                      backgroundColor: 'rgba(56, 178, 172, 0.2)',
                      color: theme.colors.cyan[3],
                      border: `1px solid ${theme.colors.cyan[4]}`
                    }}
                  >
                    {world.system}
                  </Badge>
                  <Badge
                    variant="light"
                    color="blue"
                    size="md"
                    style={{
                      backgroundColor: 'rgba(66, 153, 225, 0.2)',
                      color: theme.colors.blue[3],
                      border: `1px solid ${theme.colors.blue[4]}`
                    }}
                  >
                    {world.setting}
                  </Badge>
                </Group>
                {world.description && (
                  <Text
                    size="sm"
                    c="gray.3"
                    lineClamp={2}
                    style={{
                      maxWidth: '400px',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    {world.description}
                  </Text>
                )}
              </Box>

              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  color="white"
                  size="xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    world.id && onView(world.id);
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <IconEye size={24} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="white"
                  size="xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    world.id && onEdit(world.id);
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <IconEdit size={24} />
                </ActionIcon>
              </Group>
            </Group>
          </Box>
        </Box>
      </Card.Section>

      {/* Network Mind Map Layout */}
      <Box
        style={{
          height: 'calc(100% - 180px)',
          position: 'relative',
          padding: '20px',
          overflow: 'hidden'
        }}
      >

        {/* Connection Lines */}
        {connections.map((connection, index) => (
          <ConnectionLine
            key={index}
            from={{ x: connection.from.x, y: connection.from.y }}
            to={{ x: connection.to.x, y: connection.to.y }}
            color={connection.color}
            theme={theme}
          />
        ))}

        {/* Network Nodes */}
        {allNodes.map((node) => (
          <NetworkNodeComponent
            key={node.id}
            node={node}
            theme={theme}
          />
        ))}
      </Box>
    </Card>
  );
}

export function RPGWorldCarousel({ worlds, loading = false, onViewWorld, onEditWorld, entityStats }: RPGWorldCarouselProps) {
  const { t } = useTranslation(['ui', 'entities']);
  const navigate = useNavigate();

  const handleViewWorld = (worldId: string) => {
    if (onViewWorld) {
      onViewWorld(worldId);
    } else {
      navigate(`/rpg-worlds/${worldId}`);
    }
  };

  const handleEditWorld = (worldId: string) => {
    if (onEditWorld) {
      onEditWorld(worldId);
    } else {
      navigate(`/rpg-worlds/${worldId}/edit`);
    }
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text ta="center" c="dimmed">
          Loading RPG Worlds...
        </Text>
      </Box>
    );
  }

  if (!worlds || worlds.length === 0) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed" mb="md">
          No RPG Worlds found. Create your first world to get started!
        </Text>
        <Button
          leftSection={<IconWorld size={16} />}
          onClick={() => navigate('/rpg-worlds/new')}
        >
          Create RPG World
        </Button>
      </Box>
    );
  }

  return (
    <Box style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <Carousel
        withIndicators
        withControls
        controlsOffset={0}
        controlSize={60}
        slideSize={{ base: '100%', sm: '50%', md: '33.333%', lg: '25%' }}
        slideGap="md"
        emblaOptions={{ align: 'start', slidesToScroll: 1 }}
        styles={{
          root: {
            width: '100%',
          },
          viewport: {
            width: '100%',
          },
          container: {
            width: '100%',
          },
          slide: {
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
          },
          control: {
            backgroundColor: 'rgba(56, 178, 172, 0.9)',
            border: '2px solid rgba(56, 178, 172, 0.6)',
            color: 'white',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            '&:hover': {
              backgroundColor: 'rgba(56, 178, 172, 1)',
              transform: 'translateY(-50%) scale(1.1)',
            },

          },
          indicator: {
            backgroundColor: 'rgba(56, 178, 172, 0.3)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',

          },
          indicators: {
            bottom: '-40px',
          },
        }}
      >
        {worlds.map((world) => (
          <Carousel.Slide key={world.id}>
            <WorldCard
              world={world}
              onView={handleViewWorld}
              onEdit={handleEditWorld}
              entityStats={entityStats}
            />
          </Carousel.Slide>
        ))}
      </Carousel>
    </Box>
  );
}
