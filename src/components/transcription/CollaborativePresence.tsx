/**
 * Collaborative Presence Component
 * 
 * Shows real-time user presence and activity in live transcription sessions
 * Uses Mantine 8 components for modern collaborative interface elements
 */

import React, { useState, useEffect } from 'react';
import {
  Group,
  Avatar,
  Text,
  Badge,
  Tooltip,
  Stack,
  Paper,
  ActionIcon,
  Indicator,
  Transition,
  AvatarGroup,
  Menu,
  Divider,
  ThemeIcon,
  Box,
  Progress,
  RingProgress
} from '@mantine/core';
import {
  IconMicrophone,
  IconEye,
  IconEdit,
  IconMessage,
  IconThumbUp,
  IconCrown,
  IconUser,
  IconUsers,
  IconDots,
  IconUserCheck,
  IconUserX,
  IconWifi,
  IconWifiOff
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

/**
 * User presence status
 */
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

/**
 * User activity type
 */
export enum ActivityType {
  VIEWING = 'viewing',
  EDITING = 'editing',
  COMMENTING = 'commenting',
  VOTING = 'voting',
  RECORDING = 'recording',
  IDLE = 'idle'
}

/**
 * User presence interface
 */
export interface UserPresence {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'gamemaster' | 'player' | 'supervisor' | 'observer';
  status: PresenceStatus;
  activity: ActivityType;
  lastSeen: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  isTyping?: boolean;
  currentSection?: string;
  permissions: {
    canRecord: boolean;
    canEdit: boolean;
    canVote: boolean;
    canComment: boolean;
  };
}

/**
 * Component props
 */
export interface CollaborativePresenceProps {
  /** List of users currently present */
  users: UserPresence[];
  /** Current user ID */
  currentUserId: string;
  /** Maximum avatars to show before grouping */
  maxAvatars?: number;
  /** Whether to show detailed presence info */
  showDetails?: boolean;
  /** Whether to show activity indicators */
  showActivity?: boolean;
  /** Whether to show connection quality */
  showConnectionQuality?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Callback when user is clicked */
  onUserClick?: (user: UserPresence) => void;
  /** Callback when user permissions change */
  onPermissionChange?: (userId: string, permission: string, value: boolean) => void;
}

/**
 * Collaborative Presence Component
 */
export function CollaborativePresence({
  users,
  currentUserId,
  maxAvatars = 5,
  showDetails = true,
  showActivity = true,
  showConnectionQuality = true,
  compact = false,
  onUserClick,
  onPermissionChange
}: CollaborativePresenceProps) {
  const [expandedUsers, { toggle: toggleExpanded }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<UserPresence | null>(null);

  // Filter and sort users
  const onlineUsers = users.filter(user => user.status !== PresenceStatus.OFFLINE);
  const sortedUsers = onlineUsers.sort((a, b) => {
    // Current user first, then by role, then by activity
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    
    const roleOrder = { gamemaster: 0, supervisor: 1, player: 2, observer: 3 };
    const roleComparison = roleOrder[a.role] - roleOrder[b.role];
    if (roleComparison !== 0) return roleComparison;
    
    const activityOrder = { recording: 0, editing: 1, commenting: 2, voting: 3, viewing: 4, idle: 5 };
    return activityOrder[a.activity] - activityOrder[b.activity];
  });

  const visibleUsers = expandedUsers ? sortedUsers : sortedUsers.slice(0, maxAvatars);
  const hiddenCount = Math.max(0, sortedUsers.length - maxAvatars);

  // Get status color
  const getStatusColor = (status: PresenceStatus): string => {
    switch (status) {
      case PresenceStatus.ONLINE: return 'green';
      case PresenceStatus.AWAY: return 'yellow';
      case PresenceStatus.BUSY: return 'red';
      default: return 'gray';
    }
  };

  // Get activity icon
  const getActivityIcon = (activity: ActivityType, size = 12) => {
    switch (activity) {
      case ActivityType.RECORDING: return <IconMicrophone size={size} />;
      case ActivityType.EDITING: return <IconEdit size={size} />;
      case ActivityType.COMMENTING: return <IconMessage size={size} />;
      case ActivityType.VOTING: return <IconThumbUp size={size} />;
      case ActivityType.VIEWING: return <IconEye size={size} />;
      default: return <IconUser size={size} />;
    }
  };

  // Get role icon
  const getRoleIcon = (role: string, size = 14) => {
    switch (role) {
      case 'gamemaster': return <IconCrown size={size} />;
      case 'supervisor': return <IconUserCheck size={size} />;
      default: return <IconUser size={size} />;
    }
  };

  // Get connection quality color
  const getConnectionColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'poor': return 'yellow';
      default: return 'red';
    }
  };

  // Get connection quality percentage
  const getConnectionPercentage = (quality: string): number => {
    switch (quality) {
      case 'excellent': return 100;
      case 'good': return 75;
      case 'poor': return 40;
      default: return 0;
    }
  };

  if (compact) {
    return (
      <Group gap="xs">
        <AvatarGroup spacing="sm">
          {visibleUsers.map(user => (
            <Tooltip
              key={user.id}
              label={`${user.name} (${user.role}) - ${user.activity}`}
              position="bottom"
            >
              <Indicator
                inline
                size={8}
                offset={2}
                position="bottom-end"
                color={getStatusColor(user.status)}
                processing={user.activity === ActivityType.RECORDING}
              >
                <Avatar
                  src={user.avatar}
                  size="sm"
                  radius="xl"
                  style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                  onClick={() => onUserClick?.(user)}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </Indicator>
            </Tooltip>
          ))}
        </AvatarGroup>
        
        {hiddenCount > 0 && (
          <Tooltip label={`${hiddenCount} more users`}>
            <Avatar size="sm" radius="xl" onClick={toggleExpanded} style={{ cursor: 'pointer' }}>
              +{hiddenCount}
            </Avatar>
          </Tooltip>
        )}
        
        <Text size="xs" c="dimmed">
          {onlineUsers.length} online
        </Text>
      </Group>
    );
  }

  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue">
              <IconUsers size={14} />
            </ThemeIcon>
            <Text size="sm" fw={500}>
              Participants ({onlineUsers.length})
            </Text>
          </Group>
          
          {hiddenCount > 0 && (
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={toggleExpanded}
            >
              <IconDots size={14} />
            </ActionIcon>
          )}
        </Group>

        {/* User List */}
        <Stack gap="xs">
          {visibleUsers.map(user => (
            <Group
              key={user.id}
              justify="space-between"
              p="xs"
              style={{
                borderRadius: 'var(--mantine-radius-sm)',
                backgroundColor: user.id === currentUserId ? 'var(--mantine-color-blue-0)' : 'transparent',
                cursor: onUserClick ? 'pointer' : 'default'
              }}
              onClick={() => onUserClick?.(user)}
            >
              <Group gap="sm">
                {/* Avatar with status */}
                <Indicator
                  inline
                  size={10}
                  offset={3}
                  position="bottom-end"
                  color={getStatusColor(user.status)}
                  processing={user.activity === ActivityType.RECORDING}
                >
                  <Avatar
                    src={user.avatar}
                    size="md"
                    radius="xl"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Indicator>

                {/* User info */}
                <Stack gap={2}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {user.name}
                      {user.id === currentUserId && (
                        <Text span size="xs" c="dimmed"> (you)</Text>
                      )}
                    </Text>
                    
                    {/* Role badge */}
                    <Badge
                      size="xs"
                      variant="light"
                      color={user.role === 'gamemaster' ? 'gold' : user.role === 'supervisor' ? 'blue' : 'gray'}
                      leftSection={getRoleIcon(user.role, 10)}
                    >
                      {user.role}
                    </Badge>
                  </Group>
                  
                  {showActivity && (
                    <Group gap="xs">
                      <ThemeIcon size="xs" variant="light" color="gray">
                        {getActivityIcon(user.activity, 10)}
                      </ThemeIcon>
                      <Text size="xs" c="dimmed">
                        {user.activity}
                        {user.currentSection && ` in ${user.currentSection}`}
                      </Text>
                      
                      {user.isTyping && (
                        <Badge size="xs" color="blue" variant="dot">
                          typing...
                        </Badge>
                      )}
                    </Group>
                  )}
                </Stack>
              </Group>

              {/* Connection quality and actions */}
              <Group gap="xs">
                {showConnectionQuality && (
                  <Tooltip label={`Connection: ${user.connectionQuality}`}>
                    <RingProgress
                      size={24}
                      thickness={3}
                      sections={[
                        {
                          value: getConnectionPercentage(user.connectionQuality),
                          color: getConnectionColor(user.connectionQuality)
                        }
                      ]}
                    />
                  </Tooltip>
                )}
                
                {/* Permission indicators */}
                <Group gap={2}>
                  {user.permissions.canRecord && (
                    <Tooltip label="Can record">
                      <ThemeIcon size="xs" variant="light" color="red">
                        <IconMicrophone size={8} />
                      </ThemeIcon>
                    </Tooltip>
                  )}
                  {user.permissions.canEdit && (
                    <Tooltip label="Can edit">
                      <ThemeIcon size="xs" variant="light" color="blue">
                        <IconEdit size={8} />
                      </ThemeIcon>
                    </Tooltip>
                  )}
                  {user.permissions.canVote && (
                    <Tooltip label="Can vote">
                      <ThemeIcon size="xs" variant="light" color="green">
                        <IconThumbUp size={8} />
                      </ThemeIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>
            </Group>
          ))}
        </Stack>

        {/* Show more button */}
        {hiddenCount > 0 && !expandedUsers && (
          <Group justify="center">
            <ActionIcon
              variant="light"
              onClick={toggleExpanded}
            >
              <Text size="xs">+{hiddenCount} more</Text>
            </ActionIcon>
          </Group>
        )}

        {/* Activity summary */}
        {showDetails && (
          <>
            <Divider />
            <Group justify="space-between">
              <Group gap="xs">
                {Object.values(ActivityType).map(activity => {
                  const count = users.filter(u => u.activity === activity && u.status !== PresenceStatus.OFFLINE).length;
                  if (count === 0) return null;
                  
                  return (
                    <Tooltip key={activity} label={`${count} ${activity}`}>
                      <Group gap={2}>
                        <ThemeIcon size="xs" variant="light">
                          {getActivityIcon(activity, 10)}
                        </ThemeIcon>
                        <Text size="xs" c="dimmed">{count}</Text>
                      </Group>
                    </Tooltip>
                  );
                })}
              </Group>
              
              <Text size="xs" c="dimmed">
                Last updated: {new Date().toLocaleTimeString()}
              </Text>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
