import React from 'react';
import {
  Table,
  ActionIcon,
  Menu,
  Group,
  Text,
  Paper,
  Title,
  Button,
  Center,
  Skeleton,
  rem
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconPlus
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

// Props interface
interface CampaignTableProps {
  items: any[];
  columns: {
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
  }[];
  basePath: string;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onCreateCampaign?: () => void;
}

/**
 * Campaign Table Component
 */
export function CampaignTable({
  items,
  columns,
  basePath,
  onDelete,
  isLoading = false,
  error = null,
  onCreateCampaign
}: CampaignTableProps) {
  // Render loading state
  if (isLoading) {
    return (
      <Paper p="md" withBorder>
        <Skeleton height={40} mb="md" />
        <Skeleton height={30} mb="sm" />
        <Skeleton height={30} mb="sm" />
        <Skeleton height={30} mb="sm" />
        <Skeleton height={30} mb="sm" />
      </Paper>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper p="md" withBorder>
        <Text color="red">{error}</Text>
      </Paper>
    );
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <div style={{ textAlign: 'center' }}>
            <Title order={3} mb="md">No Campaigns Found</Title>
            <Text mb="xl">Create your first campaign to get started</Text>
            <Button
              leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
              onClick={onCreateCampaign}
              component={Link}
              to={`${basePath}/new`}
            >
              Create Campaign
            </Button>
          </div>
        </Center>
      </Paper>
    );
  }

  // Render campaign list
  return (
    <Paper p="md" withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key}>{column.label}</Table.Th>
            ))}
            <Table.Th style={{ width: 80 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => (
            <Table.Tr key={item.id}>
              {columns.map((column) => (
                <Table.Td key={`${item.id}-${column.key}`}>
                  {column.render ? column.render(item) : item[column.key]}
                </Table.Td>
              ))}
              <Table.Td>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle">
                      <IconDotsVertical style={{ width: '16px', height: '16px' }} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEye style={{ width: '14px', height: '14px' }} />}
                      component={Link}
                      to={`${basePath}/${item.id}`}
                    >
                      View
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconEdit style={{ width: '14px', height: '14px' }} />}
                      component={Link}
                      to={`${basePath}/${item.id}/edit`}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash style={{ width: '14px', height: '14px' }} />}
                      onClick={() => onDelete(item.id)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

export default CampaignTable;
