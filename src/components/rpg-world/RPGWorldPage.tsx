import React from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  ThemeIcon,
  Stack,
  Button,
  ActionIcon,
  Menu,
  Breadcrumbs,
  Anchor,
  Divider,
  Box,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconArrowLeft,
  IconHome,
  IconChevronRight,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  title: string;
  path: string;
}

interface RPGWorldPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: {
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  };
  children?: React.ReactNode;
}

/**
 * A generic page component for RPG World elements
 */
export function RPGWorldPage({
  title,
  description = 'This page is under construction and will be available soon.',
  icon,
  breadcrumbs = [],
  actions = {
    canAdd: true,
    canEdit: true,
    canDelete: true,
  },
  children,
}: RPGWorldPageProps) {
  const navigate = useNavigate();

  // Generate breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', path: '/dashboard' },
    ...breadcrumbs,
    { title, path: '#' },
  ];

  // Handle action buttons
  const handleAdd = () => {
    navigate(`${window.location.pathname}/new`);
  };

  const handleEdit = () => {
    navigate(`${window.location.pathname}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${title}?`)) {
      // Delete logic here
      console.log(`Delete ${title}`);
      navigate('/dashboard');
    }
  };

  return (
    <Container size="lg" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg" separator={<IconChevronRight size="0.8rem" />}>
        {breadcrumbItems.map((item, index) => (
          <Anchor
            component={Link}
            to={item.path}
            key={index}
            c={index === breadcrumbItems.length - 1 ? 'dimmed' : undefined}
            underline={index === breadcrumbItems.length - 1 ? 'never' : 'always'}
            onClick={(e) => {
              if (index === breadcrumbItems.length - 1) {
                // Prevent navigation for the current page
                e.preventDefault();
              }
            }}
          >
            {index === 0 ? (
              <Group gap="xs">
                <IconHome size="0.8rem" />
                <span>{item.title}</span>
              </Group>
            ) : (
              item.title
            )}
          </Anchor>
        ))}
      </Breadcrumbs>

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="lg">
          <Group>
            {icon && (
              <ThemeIcon size={50} radius={25} color="teal">
                {icon}
              </ThemeIcon>
            )}
            <div>
              <Title order={1}>{title}</Title>
              {description && (
                <Text c="dimmed" size="lg" mt="xs">
                  {description}
                </Text>
              )}
            </div>
          </Group>

          <Group>
            {actions.canAdd && (
              <Button
                leftSection={<IconPlus size="1rem" />}
                onClick={handleAdd}
              >
                Add New
              </Button>
            )}

            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <ActionIcon variant="default" size="lg">
                  <IconDotsVertical size="1rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {actions.canEdit && (
                  <Menu.Item
                    leftSection={<IconEdit size="1rem" />}
                    onClick={handleEdit}
                  >
                    Edit
                  </Menu.Item>
                )}
                {actions.canDelete && (
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
          </Group>
        </Group>

        <Divider mb="lg" />

        {/* Page content */}
        {children ? (
          children
        ) : (
          <Stack align="center" gap="lg" py="xl">
            <Text c="dimmed" size="lg" ta="center" maw={600}>
              This page is under construction and will be available soon.
            </Text>

            <Group mt="md">
              <Button
                variant="outline"
                leftSection={<IconArrowLeft size="1rem" />}
                component={Link}
                to="/dashboard"
              >
                Return to Dashboard
              </Button>
            </Group>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}

export default RPGWorldPage;