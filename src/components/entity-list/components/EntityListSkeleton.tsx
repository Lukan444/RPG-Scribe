/**
 * Entity List Skeleton
 * 
 * This component provides a standardized loading skeleton for entity lists.
 * It displays a skeleton based on the current view type.
 */

import React from 'react';
import {
  Paper,
  Skeleton,
  SimpleGrid,
  Stack,
  Group,
  Table,
  Box,
  Card
} from '@mantine/core';
import { EntityListViewType } from '../interfaces/EntityListConfig.interface';

/**
 * Entity list skeleton props
 */
interface EntityListSkeletonProps {
  viewType: EntityListViewType;
  itemCount?: number;
}

/**
 * Entity list skeleton component
 */
export function EntityListSkeleton({
  viewType,
  itemCount = 6
}: EntityListSkeletonProps) {
  // Render table skeleton
  const renderTableSkeleton = () => {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <Skeleton height={30} width={30} radius="md" />
              <Skeleton height={24} width={120} radius="md" />
              <Skeleton height={20} width={40} radius="md" />
            </Group>
            <Skeleton height={36} width={120} radius="md" />
          </Group>
          
          <Box>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th><Skeleton height={20} width="100%" radius="md" /></Table.Th>
                  <Table.Th><Skeleton height={20} width="100%" radius="md" /></Table.Th>
                  <Table.Th><Skeleton height={20} width="100%" radius="md" /></Table.Th>
                  <Table.Th><Skeleton height={20} width="100%" radius="md" /></Table.Th>
                  <Table.Th><Skeleton height={20} width="100%" radius="md" /></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: itemCount }).map((_, index) => (
                  <Table.Tr key={index}>
                    <Table.Td><Skeleton height={20} width="100%" radius="md" /></Table.Td>
                    <Table.Td><Skeleton height={20} width="100%" radius="md" /></Table.Td>
                    <Table.Td><Skeleton height={20} width="100%" radius="md" /></Table.Td>
                    <Table.Td><Skeleton height={20} width="100%" radius="md" /></Table.Td>
                    <Table.Td><Skeleton height={20} width={100} radius="md" /></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
          
          <Group justify="center">
            <Skeleton height={36} width={300} radius="md" />
          </Group>
        </Stack>
      </Paper>
    );
  };
  
  // Render grid skeleton
  const renderGridSkeleton = () => {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <Skeleton height={30} width={30} radius="md" />
              <Skeleton height={24} width={120} radius="md" />
              <Skeleton height={20} width={40} radius="md" />
            </Group>
            <Skeleton height={36} width={120} radius="md" />
          </Group>
          
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing="md">
            {Array.from({ length: itemCount }).map((_, index) => (
              <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Skeleton height={160} width="100%" />
                </Card.Section>
                
                <Group justify="space-between" mt="md" mb="xs">
                  <Skeleton height={20} width={120} radius="md" />
                  <Group gap="xs">
                    <Skeleton height={20} width={60} radius="md" />
                  </Group>
                </Group>
                
                <Skeleton height={16} width="100%" radius="md" mt="xs" />
                <Skeleton height={16} width="80%" radius="md" mt="xs" />
                
                <Group mt="md" justify="flex-end">
                  <Skeleton height={30} width={30} radius="md" />
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          
          <Group justify="center">
            <Skeleton height={36} width={300} radius="md" />
          </Group>
        </Stack>
      </Paper>
    );
  };
  
  // Render article skeleton
  const renderArticleSkeleton = () => {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <Skeleton height={30} width={30} radius="md" />
              <Skeleton height={24} width={120} radius="md" />
            </Group>
            <Skeleton height={36} width={120} radius="md" />
          </Group>
          
          <Skeleton height={1} width="100%" />
          
          <Stack gap="md">
            {Array.from({ length: itemCount }).map((_, index) => (
              <Paper key={index} withBorder p="md" radius="md">
                <Group>
                  <Skeleton height={80} width={80} radius="md" />
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Skeleton height={24} width="60%" radius="md" />
                    <Skeleton height={16} width="40%" radius="md" />
                    <Skeleton height={16} width="90%" radius="md" />
                    <Skeleton height={16} width="80%" radius="md" />
                  </Stack>
                  <Group>
                    <Skeleton height={30} width={30} radius="md" />
                    <Skeleton height={30} width={30} radius="md" />
                    <Skeleton height={30} width={30} radius="md" />
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
          
          <Group justify="center">
            <Skeleton height={36} width={300} radius="md" />
          </Group>
        </Stack>
      </Paper>
    );
  };
  
  // Render organize skeleton
  const renderOrganizeSkeleton = () => {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <Skeleton height={30} width={30} radius="md" />
              <Skeleton height={24} width={120} radius="md" />
            </Group>
            <Skeleton height={36} width={120} radius="md" />
          </Group>
          
          <Stack gap="md">
            {Array.from({ length: itemCount }).map((_, index) => (
              <Paper key={index} withBorder p="md" radius="md">
                <Group>
                  <Skeleton height={24} width={24} radius="md" />
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Skeleton height={24} width="60%" radius="md" />
                    <Skeleton height={16} width="40%" radius="md" />
                  </Stack>
                  <Group>
                    <Skeleton height={30} width={30} radius="md" />
                    <Skeleton height={30} width={30} radius="md" />
                    <Skeleton height={30} width={30} radius="md" />
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
          
          <Group justify="center">
            <Skeleton height={36} width={120} radius="md" />
          </Group>
        </Stack>
      </Paper>
    );
  };
  
  // Render skeleton based on view type
  switch (viewType) {
    case 'table':
      return renderTableSkeleton();
    case 'grid':
      return renderGridSkeleton();
    case 'article':
      return renderArticleSkeleton();
    case 'organize':
      return renderOrganizeSkeleton();
    default:
      return renderGridSkeleton();
  }
}
