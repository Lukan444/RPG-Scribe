import React from 'react';
import {
  Menu,
  Button,
  ActionIcon,
  Group,
  Text,
  Divider,
  ThemeIcon
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconCopy,
  IconShare,
  IconPlus,
  IconChevronDown,
  IconUser,
  IconMapPin,
  IconSword,
  IconCalendarEvent,
  IconBook,
  IconWorld
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface EntityActionButtonProps {
  entityType: any; // Accept any EntityType to handle different enum implementations
  variant?: 'icon' | 'button' | 'split';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  primaryAction?: Action;
  actions?: Action[];
  groupedActions?: {
    title: string;
    actions: Action[];
  }[];
  withLabels?: boolean;
}

export function EntityActionButton({
  entityType,
  variant = 'button',
  size = 'sm',
  color,
  primaryAction,
  actions = [],
  groupedActions = [],
  withLabels = false
}: EntityActionButtonProps) {
  // Get entity type color
  const getEntityColor = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return 'teal';
    if (entityTypeStr.includes('LOCATION')) return 'blue';
    if (entityTypeStr.includes('ITEM')) return 'yellow';
    if (entityTypeStr.includes('EVENT')) return 'violet';
    if (entityTypeStr.includes('SESSION')) return 'orange';
    if (entityTypeStr.includes('CAMPAIGN')) return 'red';
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'indigo';
    if (entityTypeStr.includes('NOTE')) return 'cyan';

    return 'gray';
  };

  // Get entity type icon
  const getEntityIcon = () => {
    // Convert entityType to string for comparison
    const entityTypeStr = entityType.toString().toUpperCase();

    if (entityTypeStr.includes('CHARACTER')) return <IconUser size={16} />;
    if (entityTypeStr.includes('LOCATION')) return <IconMapPin size={16} />;
    if (entityTypeStr.includes('ITEM')) return <IconSword size={16} />;
    if (entityTypeStr.includes('EVENT')) return <IconCalendarEvent size={16} />;
    if (entityTypeStr.includes('SESSION')) return <IconBook size={16} />;
    if (entityTypeStr.includes('CAMPAIGN')) return <IconWorld size={16} />;
    if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return <IconWorld size={16} />;
    if (entityTypeStr.includes('NOTE')) return <IconBook size={16} />;

    return <IconPlus size={16} />;
  };

  const buttonColor = color || getEntityColor();

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="filled"
            color={buttonColor}
            size={size}
          >
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {primaryAction && (
            <>
              <Menu.Item
                leftSection={primaryAction.icon}
                onClick={primaryAction.onClick}
                color={primaryAction.color}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </Menu.Item>
              <Menu.Divider />
            </>
          )}

          {actions.map((action, index) => (
            <Menu.Item
              key={index}
              leftSection={action.icon}
              onClick={action.onClick}
              color={action.color}
              disabled={action.disabled}
            >
              {action.label}
            </Menu.Item>
          ))}

          {groupedActions.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {(actions.length > 0 || groupIndex > 0) && <Menu.Divider />}
              <Menu.Label>{group.title}</Menu.Label>
              {group.actions.map((action, actionIndex) => (
                <Menu.Item
                  key={actionIndex}
                  leftSection={action.icon}
                  onClick={action.onClick}
                  color={action.color}
                  disabled={action.disabled}
                >
                  {action.label}
                </Menu.Item>
              ))}
            </React.Fragment>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  // Split button variant
  if (variant === 'split' && primaryAction) {
    return (
      <Group gap={0}>
        <Button
          leftSection={primaryAction.icon}
          color={buttonColor}
          size={size}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
        </Button>

        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Button
              color={buttonColor}
              size={size}
              px="xs"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              <IconChevronDown size={16} />
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            {actions.map((action, index) => (
              <Menu.Item
                key={index}
                leftSection={action.icon}
                onClick={action.onClick}
                color={action.color}
                disabled={action.disabled}
              >
                {action.label}
              </Menu.Item>
            ))}

            {groupedActions.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {(actions.length > 0 || groupIndex > 0) && <Menu.Divider />}
                <Menu.Label>{group.title}</Menu.Label>
                {group.actions.map((action, actionIndex) => (
                  <Menu.Item
                    key={actionIndex}
                    leftSection={action.icon}
                    onClick={action.onClick}
                    color={action.color}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Menu.Item>
                ))}
              </React.Fragment>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>
    );
  }

  // Default button variant
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button
          leftSection={getEntityIcon()}
          rightSection={<IconChevronDown size={16} />}
          color={buttonColor}
          size={size}
        >
          {(() => {
            // Format entity type name for display
            const entityTypeStr = entityType.toString();

            // Handle special cases
            if (entityTypeStr.toUpperCase().includes('RPGWORLD') || entityTypeStr.toUpperCase().includes('RPG_WORLD')) {
              return 'RPG World';
            }

            // Format normal cases - capitalize first letter
            return entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1).toLowerCase();
          })()} Actions
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {primaryAction && (
          <>
            <Menu.Item
              leftSection={primaryAction.icon}
              onClick={primaryAction.onClick}
              color={primaryAction.color}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </Menu.Item>
            <Menu.Divider />
          </>
        )}

        {actions.map((action, index) => (
          <Menu.Item
            key={index}
            leftSection={action.icon}
            onClick={action.onClick}
            color={action.color}
            disabled={action.disabled}
          >
            {action.label}
          </Menu.Item>
        ))}

        {groupedActions.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {(actions.length > 0 || groupIndex > 0) && <Menu.Divider />}
            <Menu.Label>{group.title}</Menu.Label>
            {group.actions.map((action, actionIndex) => (
              <Menu.Item
                key={actionIndex}
                leftSection={action.icon}
                onClick={action.onClick}
                color={action.color}
                disabled={action.disabled}
              >
                {action.label}
              </Menu.Item>
            ))}
          </React.Fragment>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

// Predefined action sets
export const getDefaultEntityActions = (
  entityType: any, // Accept any EntityType to handle different enum implementations
  entityId: string,
  onView?: () => void,
  onEdit?: () => void,
  onDelete?: () => void,
  onDuplicate?: () => void,
  onShare?: () => void
) => {
  const actions: Action[] = [];

  if (onView) {
    actions.push({
      label: `View ${entityType}`,
      icon: <IconEye size={16} />,
      onClick: onView
    });
  }

  if (onEdit) {
    actions.push({
      label: `Edit ${entityType}`,
      icon: <IconEdit size={16} />,
      onClick: onEdit
    });
  }

  if (onDuplicate) {
    actions.push({
      label: `Duplicate ${entityType}`,
      icon: <IconCopy size={16} />,
      onClick: onDuplicate
    });
  }

  if (onShare) {
    actions.push({
      label: `Share ${entityType}`,
      icon: <IconShare size={16} />,
      onClick: onShare
    });
  }

  const groupedActions = [];

  if (onDelete) {
    groupedActions.push({
      title: 'Danger Zone',
      actions: [
        {
          label: `Delete ${entityType}`,
          icon: <IconTrash size={16} />,
          onClick: onDelete,
          color: 'red'
        }
      ]
    });
  }

  return { actions, groupedActions };
};

export default EntityActionButton;