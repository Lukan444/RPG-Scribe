import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Alert,
  Progress,
  Table,
  Badge,
  Accordion,
  ActionIcon,
  Tooltip,
  LoadingOverlay
} from '@mantine/core';
import {
  IconTrash,
  IconEye,
  IconAlertTriangle,
  IconCheck,
  IconRefresh,
  IconDatabase,
  IconTrash as IconBroom
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DuplicateCleanupService, DuplicateGroup, CleanupReport } from '../../services/duplicateCleanup.service';

export const DuplicateCleanupPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [cleanupReport, setCleanupReport] = useState<CleanupReport | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const duplicateService = new DuplicateCleanupService();

  const handleDetectDuplicates = async () => {
    setLoading(true);
    try {
      console.log('🔍 Detecting duplicates...');
      const groups = await duplicateService.detectAllDuplicates();
      setDuplicateGroups(groups);
      
      if (groups.length === 0) {
        notifications.show({
          title: 'No Duplicates Found',
          message: '✨ Your database is clean! No duplicate entities detected.',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        notifications.show({
          title: 'Duplicates Detected',
          message: `Found ${groups.length} duplicate groups with ${groups.reduce((sum, g) => sum + g.deleteEntities.length, 0)} duplicates to remove.`,
          color: 'orange',
          icon: <IconAlertTriangle size={16} />
        });
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      notifications.show({
        title: 'Detection Failed',
        message: 'Failed to detect duplicates. Check console for details.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetPreview = async () => {
    setLoading(true);
    try {
      const preview = await duplicateService.getCleanupPreview();
      setPreviewData(preview);
      setShowPreview(true);
      
      notifications.show({
        title: 'Preview Generated',
        message: `Preview shows ${preview.summary.totalDuplicatesToRemove} duplicates will be removed.`,
        color: 'blue',
        icon: <IconEye size={16} />
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      notifications.show({
        title: 'Preview Failed',
        message: 'Failed to generate cleanup preview.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (duplicateGroups.length === 0) {
      notifications.show({
        title: 'No Duplicates',
        message: 'No duplicates detected. Run detection first.',
        color: 'yellow'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🧹 Executing cleanup...');
      const report = await duplicateService.executeCleanup(duplicateGroups);
      setCleanupReport(report);
      setDuplicateGroups([]); // Clear since they're now cleaned up
      
      notifications.show({
        title: 'Cleanup Completed',
        message: `Successfully removed ${report.totalDuplicatesRemoved} duplicates!`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      console.error('Error executing cleanup:', error);
      notifications.show({
        title: 'Cleanup Failed',
        message: 'Failed to execute cleanup. Check console for details.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFullCleanup = async () => {
    setLoading(true);
    try {
      console.log('🚀 Performing full cleanup...');
      const report = await duplicateService.performFullCleanup();
      setCleanupReport(report);
      setDuplicateGroups([]);
      
      if (report.totalDuplicatesRemoved === 0) {
        notifications.show({
          title: 'Database Clean',
          message: '✨ No duplicates found! Your database is already clean.',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        notifications.show({
          title: 'Full Cleanup Completed',
          message: `Successfully removed ${report.totalDuplicatesRemoved} duplicates in one operation!`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
      }
    } catch (error) {
      console.error('Error in full cleanup:', error);
      notifications.show({
        title: 'Full Cleanup Failed',
        message: 'Failed to perform full cleanup. Check console for details.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={4}>
              <IconBroom size={20} style={{ marginRight: 8 }} />
              Duplicate Cleanup System
            </Title>
            <Text size="sm" c="dimmed">
              Detect and remove duplicate entities from the database
            </Text>
          </div>
        </Group>

        {/* Action Buttons */}
        <Group>
          <Button
            leftSection={<IconDatabase size={16} />}
            onClick={handleDetectDuplicates}
            disabled={loading}
            variant="light"
          >
            Detect Duplicates
          </Button>
          
          <Button
            leftSection={<IconEye size={16} />}
            onClick={handleGetPreview}
            disabled={loading || duplicateGroups.length === 0}
            variant="light"
            color="blue"
          >
            Preview Cleanup
          </Button>
          
          <Button
            leftSection={<IconTrash size={16} />}
            onClick={handleExecuteCleanup}
            disabled={loading || duplicateGroups.length === 0}
            color="orange"
          >
            Execute Cleanup
          </Button>
          
          <Button
            leftSection={<IconBroom size={16} />}
            onClick={handleFullCleanup}
            disabled={loading}
            color="red"
            variant="filled"
          >
            Full Cleanup (Detect + Clean)
          </Button>
        </Group>

        {/* Duplicate Groups Display */}
        {duplicateGroups.length > 0 && (
          <Alert icon={<IconAlertTriangle size={16} />} color="orange">
            <Text fw={500}>
              Found {duplicateGroups.length} duplicate groups with{' '}
              {duplicateGroups.reduce((sum, group) => sum + group.deleteEntities.length, 0)} duplicates to remove
            </Text>
            
            <Accordion mt="md">
              {duplicateGroups.map((group, index) => (
                <Accordion.Item key={index} value={`group-${index}`}>
                  <Accordion.Control>
                    <Group justify="space-between">
                      <Text>
                        {group.entityType}: {group.duplicateKey}
                      </Text>
                      <Badge color="red" size="sm">
                        {group.deleteEntities.length} duplicates
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="green">
                        ✅ Keep: {group.keepEntity.name || group.keepEntity.title || group.keepEntity.id}
                      </Text>
                      {group.deleteEntities.map((entity, idx) => (
                        <Text key={idx} size="sm" c="red">
                          🗑️ Delete: {entity.name || entity.title || entity.id}
                        </Text>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Alert>
        )}

        {/* Preview Data Display */}
        {showPreview && previewData && (
          <Alert icon={<IconEye size={16} />} color="blue">
            <Title order={5}>Cleanup Preview</Title>
            <Text size="sm">
              • Total duplicate groups: {previewData.summary.totalDuplicateGroups}
            </Text>
            <Text size="sm">
              • Total duplicates to remove: {previewData.summary.totalDuplicatesToRemove}
            </Text>
            <Text size="sm">
              • Unique entities after cleanup: {previewData.summary.totalEntitiesAfterCleanup}
            </Text>
            
            {Object.entries(previewData.summary.byEntityType).map(([type, data]: [string, any]) => (
              <Text key={type} size="sm">
                • {type}: Remove {data.duplicates}, Keep {data.willKeep}
              </Text>
            ))}
          </Alert>
        )}

        {/* Cleanup Report */}
        {cleanupReport && (
          <Alert icon={<IconCheck size={16} />} color="green">
            <Title order={5}>Cleanup Report</Title>
            <Text size="sm">
              ✅ Successfully removed {cleanupReport.totalDuplicatesRemoved} duplicates
            </Text>
            <Text size="sm">
              ✅ Kept {cleanupReport.entitiesKept} unique entities
            </Text>
            <Text size="sm">
              ✅ Processed {cleanupReport.duplicateGroupsFound} duplicate groups
            </Text>
            
            {cleanupReport.errors.length > 0 && (
              <div>
                <Text size="sm" c="red" fw={500}>Errors:</Text>
                {cleanupReport.errors.map((error, idx) => (
                  <Text key={idx} size="xs" c="red">• {error}</Text>
                ))}
              </div>
            )}
            
            <Table mt="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Entity Type</Table.Th>
                  <Table.Th>Duplicates Removed</Table.Th>
                  <Table.Th>Entities Kept</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(cleanupReport.cleanupDetails).map(([type, details]) => (
                  <Table.Tr key={type}>
                    <Table.Td>{type}</Table.Td>
                    <Table.Td>{details.duplicatesRemoved}</Table.Td>
                    <Table.Td>{details.kept}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};
