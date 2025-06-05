import React, { useState } from 'react';
import { 
  Paper, 
  Title, 
  Button, 
  Stack, 
  Text, 
  Alert, 
  Group,
  Progress,
  List,
  Badge
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDatabase, IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { BasicSampleDataService } from '../../services/basicSampleData.service';

interface SampleDataCreatorProps {
  onDataCreated?: () => void;
}

export function SampleDataCreator({ onDataCreated }: SampleDataCreatorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSampleData = async () => {
    if (!user) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please log in to create sample data',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const sampleDataService = new BasicSampleDataService();
      
      // Get the correct user ID
      const userId = user.uid || user.id;
      console.log('🔍 User object:', user);
      console.log('🔍 Using user ID:', userId);

      if (!userId) {
        throw new Error('User ID not found');
      }

      // Check existing data first
      setProgress(10);
      const existingData = await sampleDataService.checkExistingData(userId);

      setProgress(30);

      // Create sample data
      const result = await sampleDataService.createBasicSampleData(userId);
      
      setProgress(100);
      
      if (result.success) {
        setResult(result);
        notifications.show({
          title: 'Sample Data Created Successfully',
          message: `Created ${result.entitiesCreated} entities`,
          color: 'green'
        });
        
        if (onDataCreated) {
          onDataCreated();
        }
      } else {
        setError(result.error || 'Unknown error occurred');
        notifications.show({
          title: 'Error Creating Sample Data',
          message: result.error || 'Unknown error occurred',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      notifications.show({
        title: 'Error Creating Sample Data',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Group align="center">
          <IconDatabase size={24} />
          <Title order={4}>Sample Data Creator</Title>
        </Group>
        
        <Text size="sm" c="dimmed">
          Create comprehensive sample data for testing the RPG Scribe application. 
          This will create a world, campaign, characters, locations, events, sessions, items, and factions.
        </Text>

        {loading && (
          <Stack gap="xs">
            <Text size="sm">Creating sample data...</Text>
            <Progress value={progress} animated />
          </Stack>
        )}

        {error && (
          <Alert color="red" title="Error" icon={<IconX size={16} />}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert color="green" title="Success" icon={<IconCheck size={16} />}>
            <Stack gap="xs">
              <Text>Sample data created successfully!</Text>
              <List size="sm">
                <List.Item>World ID: <Badge variant="light">{result.worldId}</Badge></List.Item>
                <List.Item>Campaign ID: <Badge variant="light">{result.campaignId}</Badge></List.Item>
                <List.Item>Total Entities: <Badge variant="light">{result.entitiesCreated}</Badge></List.Item>
              </List>
            </Stack>
          </Alert>
        )}

        <Group>
          <Button
            leftSection={<IconDatabase size={16} />}
            onClick={handleCreateSampleData}
            loading={loading}
            disabled={loading}
          >
            Create Sample Data
          </Button>
          
          {(result || error) && (
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={handleReset}
            >
              Reset
            </Button>
          )}
        </Group>

        <Alert color="blue" title="What will be created:" variant="light">
          <List size="sm">
            <List.Item>1 RPG World: "The Forgotten Realms of Aethermoor"</List.Item>
            <List.Item>1 Campaign: "The Shattered Crown Chronicles"</List.Item>
            <List.Item>2 Characters: Lyra Moonwhisper, Thorin Ironforge</List.Item>
            <List.Item>2 Locations: Silverbrook Village, The Sundered Peaks</List.Item>
            <List.Item>4 Events: Heroes Meet, Crown Discovery, Dragon Battle, Alliance</List.Item>
            <List.Item>2 Sessions: Call to Adventure, Journey to Peaks</List.Item>
            <List.Item>4 Items: Crown Fragment, Silverleaf Bow, Forge Hammer, Healing Potion</List.Item>
            <List.Item>2 Factions: Order of Silver Dawn, Shadow Cult</List.Item>
          </List>
        </Alert>
      </Stack>
    </Paper>
  );
}
