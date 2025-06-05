import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Alert,
  Code,
  ScrollArea,
  Badge,
  Table,
  Loader
} from '@mantine/core';
import { IconDatabase, IconAlertTriangle, IconCheck, IconX, IconTrash } from '@tabler/icons-react';
import { DataIntegrityAudit, DataIntegrityReport } from '../../utils/dataIntegrityAudit';
import { BasicSampleDataService } from '../../services/basicSampleData.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * Data Integrity Audit Panel Component
 * Provides UI for running and displaying data integrity audit results
 */
export function DataIntegrityAuditPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<DataIntegrityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const { user } = useAuth();

  const runAudit = async () => {
    setIsRunning(true);
    setError(null);
    setReport(null);

    try {
      const audit = new DataIntegrityAudit();
      const auditReport = await audit.performAudit();
      setReport(auditReport);
      
      // Also log the detailed report to console
      const detailedReport = audit.generateReport(auditReport);
      console.log(detailedReport);
    } catch (err) {
      console.error('Audit failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const cleanDuplicates = async () => {
    if (!user) {
      notifications.show({
        title: 'Authentication Required',
        message: 'You must be logged in to clean duplicates.',
        color: 'red'
      });
      return;
    }

    setIsCleaningDuplicates(true);
    try {
      const sampleDataService = new BasicSampleDataService();
      const result = await sampleDataService.cleanDuplicates(user.uid);

      if (result.success) {
        notifications.show({
          title: 'Cleanup Successful',
          message: `Successfully removed ${result.duplicatesRemoved} duplicate entities!`,
          color: 'green',
          icon: <IconCheck size={16} />
        });

        // Refresh the audit report if it exists
        if (report) {
          runAudit();
        }
      } else {
        notifications.show({
          title: 'Cleanup Failed',
          message: result.error || 'Failed to clean duplicates',
          color: 'red',
          icon: <IconX size={16} />
        });
      }
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      notifications.show({
        title: 'Cleanup Error',
        message: 'An unexpected error occurred during cleanup',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const getDashboardCounts = () => {
    // These are the current dashboard counts we observed
    return {
      characters: 20,
      factions: 13,
      locations: 21,
      items: 24,
      events: 34,
      sessions: 14,
      story_arcs: 2,
      notes: 2,
      campaigns: 3,
      rpg_worlds: 7
    };
  };

  const dashboardCounts = getDashboardCounts();

  return (
    <Stack gap="md">
      <Box>
        <Title order={3}>Data Integrity Audit</Title>
        <Text color="dimmed">
          Comprehensive analysis of Firestore data integrity, duplicate detection, and consistency verification
        </Text>
      </Box>

      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>Data Integrity Management</Text>
            <Group>
              <Button
                leftSection={<IconDatabase style={{ width: '16px', height: '16px' }} />}
                onClick={runAudit}
                loading={isRunning}
                disabled={isRunning || isCleaningDuplicates}
                variant="light"
              >
                {isRunning ? 'Running Audit...' : 'Run Audit'}
              </Button>
              <Button
                leftSection={<IconTrash style={{ width: '16px', height: '16px' }} />}
                onClick={cleanDuplicates}
                loading={isCleaningDuplicates}
                disabled={isRunning || isCleaningDuplicates}
                color="red"
              >
                {isCleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
              </Button>
            </Group>
          </Group>

          {isRunning && (
            <Alert icon={<Loader size="sm" />} color="blue">
              Running comprehensive data integrity audit. This may take a few moments...
            </Alert>
          )}

          {isCleaningDuplicates && (
            <Alert icon={<Loader size="sm" />} color="orange">
              Cleaning duplicate entities from the database. This may take a few moments...
            </Alert>
          )}

          {error && (
            <Alert icon={<IconX style={{ width: '16px', height: '16px' }} />} color="red">
              <Text fw={500}>Audit Failed</Text>
              <Text size="sm">{error}</Text>
            </Alert>
          )}

          {report && (
            <Stack gap="md">
              {/* Summary */}
              <Alert icon={<IconCheck style={{ width: '16px', height: '16px' }} />} color="green">
                <Text fw={500}>Audit Complete</Text>
                <Text size="sm">
                  Found {report.summary.totalEntities} total entities, {report.summary.duplicatesFound} duplicates, 
                  and {report.summary.discrepanciesFound} discrepancies
                </Text>
              </Alert>

              {/* Collection Comparison Table */}
              <Box>
                <Title order={4} mb="sm">Collection Count Comparison</Title>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Collection</Table.Th>
                      <Table.Th>Dashboard Count</Table.Th>
                      <Table.Th>Actual Count</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Duplicates</Table.Th>
                      <Table.Th>Issues</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Object.entries(report.collections).map(([collectionName, collection]) => {
                      const dashboardCount = dashboardCounts[collectionName as keyof typeof dashboardCounts] || 0;
                      const actualCount = collection.actualCount;
                      const isMatch = dashboardCount === actualCount;
                      
                      return (
                        <Table.Tr key={collectionName}>
                          <Table.Td>
                            <Text fw={500}>{collectionName.replace('_', ' ').toUpperCase()}</Text>
                          </Table.Td>
                          <Table.Td>{dashboardCount}</Table.Td>
                          <Table.Td>{actualCount}</Table.Td>
                          <Table.Td>
                            <Badge color={isMatch ? 'green' : 'red'} variant="light">
                              {isMatch ? 'Match' : `Diff: ${actualCount - dashboardCount}`}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={collection.duplicates.length > 0 ? 'orange' : 'green'} variant="light">
                              {collection.duplicates.length}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={collection.issues.length > 0 ? 'red' : 'green'} variant="light">
                              {collection.issues.length}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>

              {/* Duplicates Details */}
              {report.summary.duplicatesFound > 0 && (
                <Box>
                  <Title order={4} mb="sm">Duplicate Entities Found</Title>
                  <Stack gap="xs">
                    {Object.entries(report.collections).map(([collectionName, collection]) => 
                      collection.duplicates.length > 0 && (
                        <Alert key={collectionName} icon={<IconAlertTriangle style={{ width: '16px', height: '16px' }} />} color="orange">
                          <Text fw={500}>{collectionName.toUpperCase()}</Text>
                          {collection.duplicates.map((dup, index) => (
                            <Text key={index} size="sm">
                              • "{dup.duplicateValue}": {dup.count} duplicates
                            </Text>
                          ))}
                        </Alert>
                      )
                    )}
                  </Stack>
                </Box>
              )}

              {/* Raw Report */}
              <Box>
                <Title order={4} mb="sm">Detailed Report (Console Output)</Title>
                <Text size="sm" color="dimmed" mb="xs">
                  Check the browser console for the complete detailed report
                </Text>
                <Code block>
                  Audit completed at: {report.timestamp}
                  Total entities: {report.summary.totalEntities}
                  Duplicates found: {report.summary.duplicatesFound}
                  See console for full details...
                </Code>
              </Box>
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

export default DataIntegrityAuditPanel;
