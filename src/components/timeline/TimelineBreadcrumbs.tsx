/**
 * Timeline Breadcrumbs Component
 * Provides navigation breadcrumbs for timeline pages with context awareness
 */

import React from 'react';
import { Breadcrumbs, Anchor, Text, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconHome, IconWorld, IconBook, IconUser, IconCalendarEvent, IconMapPin, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { TimelineNavigationContext } from '../../services/timelineNavigation.service';

/**
 * Helper function to get entity icon
 */
const getEntityIcon = (entityType?: string) => {
  switch (entityType) {
    case 'character': return <IconUser size={14} />;
    case 'campaign': return <IconBook size={14} />;
    case 'session': return <IconCalendarEvent size={14} />;
    case 'location': return <IconMapPin size={14} />;
    default: return null;
  }
};

/**
 * Helper function to get entity type label
 */
const getEntityTypeLabel = (entityType?: string) => {
  switch (entityType) {
    case 'character': return 'Character';
    case 'campaign': return 'Campaign';
    case 'session': return 'Session';
    case 'event': return 'Event';
    case 'location': return 'Location';
    case 'npc': return 'NPC';
    default: return 'Entity';
  }
};

export interface TimelineBreadcrumbsProps {
  /** Timeline navigation context */
  context: TimelineNavigationContext;
  /** World name for display */
  worldName?: string;
  /** Campaign name for display */
  campaignName?: string;
  /** Entity name for display */
  entityName?: string;
  /** Return URL for back navigation */
  returnUrl?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Custom breadcrumb items */
  customItems?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
}

/**
 * Timeline Breadcrumbs Component
 * Provides contextual navigation breadcrumbs for timeline views
 */
export function TimelineBreadcrumbs({
  context,
  worldName,
  campaignName,
  entityName,
  returnUrl,
  showBackButton = true,
  customItems = []
}: TimelineBreadcrumbsProps) {
  const navigate = useNavigate();

  const handleBackNavigation = () => {
    if (returnUrl) {
      navigate(returnUrl);
    } else {
      navigate(-1);
    }
  };



  // Build breadcrumb items
  const breadcrumbItems = [];

  // Home
  breadcrumbItems.push(
    <Anchor key="home" onClick={() => navigate('/dashboard')} size="sm">
      <Group gap={4}>
        <IconHome size={14} />
        Dashboard
      </Group>
    </Anchor>
  );

  // World
  if (context.worldId && worldName) {
    breadcrumbItems.push(
      <Anchor 
        key="world" 
        onClick={() => navigate(`/rpg-worlds/${context.worldId}`)} 
        size="sm"
      >
        <Group gap={4}>
          <IconWorld size={14} />
          {worldName}
        </Group>
      </Anchor>
    );
  }

  // Campaign
  if (context.campaignId && campaignName) {
    breadcrumbItems.push(
      <Anchor 
        key="campaign" 
        onClick={() => navigate(`/rpg-worlds/${context.worldId}/campaigns/${context.campaignId}`)} 
        size="sm"
      >
        <Group gap={4}>
          <IconBook size={14} />
          {campaignName}
        </Group>
      </Anchor>
    );
  }

  // Entity (if coming from entity detail page)
  if (context.entityId && context.entityType && entityName) {
    const entityPath = context.worldId 
      ? `/rpg-worlds/${context.worldId}/${context.entityType}s/${context.entityId}`
      : `/${context.entityType}s/${context.entityId}`;
    
    breadcrumbItems.push(
      <Anchor 
        key="entity" 
        onClick={() => navigate(entityPath)} 
        size="sm"
      >
        <Group gap={4}>
          {getEntityIcon(context.entityType)}
          {entityName}
        </Group>
      </Anchor>
    );
  }

  // Custom items
  customItems.forEach((item, index) => {
    breadcrumbItems.push(
      <Anchor 
        key={`custom-${index}`} 
        onClick={item.onClick || (() => item.href && navigate(item.href))} 
        size="sm"
      >
        {item.label}
      </Anchor>
    );
  });

  // Current page (Timeline)
  breadcrumbItems.push(
    <Text key="current" size="sm" fw={500}>
      {context.entityType ? `${getEntityTypeLabel(context.entityType)} Timeline` : 'Timeline'}
    </Text>
  );

  return (
    <Group gap="md" align="center">
      {/* Back Button */}
      {showBackButton && (
        <Tooltip label="Go Back">
          <ActionIcon 
            variant="subtle" 
            size="sm"
            onClick={handleBackNavigation}
          >
            <IconArrowLeft size={16} />
          </ActionIcon>
        </Tooltip>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs separator="›" separatorMargin="xs">
        {breadcrumbItems}
      </Breadcrumbs>
    </Group>
  );
}

/**
 * Timeline Context Indicator
 * Shows current timeline context information
 */
export interface TimelineContextIndicatorProps {
  /** Timeline navigation context */
  context: TimelineNavigationContext;
  /** Display mode */
  displayMode?: 'dual' | 'real-world' | 'in-game';
  /** Show entity information */
  showEntity?: boolean;
  /** Compact mode */
  compact?: boolean;
}

export function TimelineContextIndicator({
  context,
  displayMode = 'dual',
  showEntity = true,
  compact = false
}: TimelineContextIndicatorProps) {
  const getDisplayModeColor = () => {
    switch (displayMode) {
      case 'dual': return 'blue';
      case 'real-world': return 'cyan';
      case 'in-game': return 'green';
      default: return 'gray';
    }
  };

  const getDisplayModeLabel = () => {
    switch (displayMode) {
      case 'dual': return 'Dual Timeline';
      case 'real-world': return 'Real World';
      case 'in-game': return 'In-Game';
      default: return 'Timeline';
    }
  };

  return (
    <Group gap="xs">
      {/* Display Mode Indicator */}
      <Group gap={4}>
        <Text size={compact ? "xs" : "sm"} c="dimmed">Mode:</Text>
        <Text size={compact ? "xs" : "sm"} fw={500} c={getDisplayModeColor()}>
          {getDisplayModeLabel()}
        </Text>
      </Group>

      {/* Entity Context */}
      {showEntity && context.entityType && context.entityId && (
        <Group gap={4}>
          <Text size={compact ? "xs" : "sm"} c="dimmed">Focus:</Text>
          <Group gap={2}>
            {getEntityIcon(context.entityType)}
            <Text size={compact ? "xs" : "sm"} fw={500}>
              {getEntityTypeLabel(context.entityType)}
            </Text>
          </Group>
        </Group>
      )}

      {/* World/Campaign Context */}
      {(context.worldId || context.campaignId) && (
        <Group gap={4}>
          <Text size={compact ? "xs" : "sm"} c="dimmed">Context:</Text>
          <Text size={compact ? "xs" : "sm"}>
            {context.campaignId ? 'Campaign' : 'World'} Timeline
          </Text>
        </Group>
      )}
    </Group>
  );
}

export default TimelineBreadcrumbs;
