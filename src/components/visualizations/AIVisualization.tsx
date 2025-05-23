import { useState } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Button, 
  Stack, 
  Tabs, 
  Badge, 
  Card, 
  Avatar, 
  Divider, 
  ActionIcon, 
  Tooltip, 
  Box, 
  Center, 
  Loader 
} from '@mantine/core';
import { 
  IconBrain, 
  IconRefresh, 
  IconDownload, 
  IconPlus, 
  IconMessage, 
  IconRobot, 
  IconUser 
} from '@tabler/icons-react';
import { EntityType } from '../../models/Relationship';
import { AIProposalList } from '../ai/AIProposalList';

/**
 * AI Visualization props
 */
interface AIVisualizationProps {
  campaignId?: string;
  entityId?: string;
  entityType?: EntityType;
  title?: string;
  description?: string;
}

/**
 * AIVisualization component - AI-powered visualization and analysis
 * 
 * This is a placeholder component for future AI Brain integration.
 * It demonstrates the UI for AI visualization but doesn't have actual functionality yet.
 */
export function AIVisualization({
  campaignId,
  entityId,
  entityType,
  title = 'AI Brain',
  description
}: AIVisualizationProps) {
  const [activeTab, setActiveTab] = useState<string | null>('proposals');
  const [loading, setLoading] = useState(false);
  
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Box>
            <Title order={3}>{title}</Title>
            {description && <Text c="dimmed">{description}</Text>}
          </Box>
          
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setLoading(true);
                // In a real implementation, this would refresh the data
                setTimeout(() => setLoading(false), 500);
              }}
            >
              Refresh
            </Button>
          </Group>
        </Group>
        
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="proposals"
              leftSection={<IconBrain size={16} />}
            >
              AI Proposals
            </Tabs.Tab>
            <Tabs.Tab
              value="chat"
              leftSection={<IconMessage size={16} />}
            >
              AI Chat
            </Tabs.Tab>
            <Tabs.Tab
              value="insights"
              leftSection={<IconRobot size={16} />}
            >
              AI Insights
            </Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Panel value="proposals" pt="md">
            {loading ? (
              <Center h={200}>
                <Loader size="lg" />
              </Center>
            ) : (
              <AIProposalList
                campaignId={campaignId}
                entityId={entityId}
                entityType={entityType}
                title=""
              />
            )}
          </Tabs.Panel>
          
          <Tabs.Panel value="chat" pt="md">
            {loading ? (
              <Center h={200}>
                <Loader size="lg" />
              </Center>
            ) : (
              <Stack>
                <Card withBorder p="md">
                  <Stack>
                    <Group>
                      <Avatar color="blue" radius="xl">
                        <IconUser size={24} />
                      </Avatar>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>You</Text>
                        <Text>Can you suggest some interesting plot hooks for my campaign?</Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <Avatar color="violet" radius="xl">
                        <IconBrain size={24} />
                      </Avatar>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>AI Assistant</Text>
                        <Text>
                          Based on your campaign setting and existing characters, here are some plot hooks:
                        </Text>
                        <Text component="ol">
                          <li>The ancient artifact that the party discovered in the ruins could be sought after by a powerful rival faction.</li>
                          <li>One of the NPCs the party trusts could be revealed as a spy for the antagonist.</li>
                          <li>A mysterious illness begins affecting magic users in the region, and the source seems connected to recent events.</li>
                        </Text>
                        <Text>
                          Would you like me to develop any of these ideas further?
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Card>
                
                <Text c="dimmed" ta="center">
                  This is a placeholder for the AI Chat feature.
                </Text>
              </Stack>
            )}
          </Tabs.Panel>
          
          <Tabs.Panel value="insights" pt="md">
            {loading ? (
              <Center h={200}>
                <Loader size="lg" />
              </Center>
            ) : (
              <Stack>
                <Card withBorder p="md">
                  <Title order={4}>Campaign Analysis</Title>
                  <Text mt="xs">
                    Based on the current campaign data, here are some insights and suggestions:
                  </Text>
                  
                  <Divider my="md" label="Character Development" />
                  <Text>
                    Several characters lack detailed backgrounds and motivations. 
                    Consider expanding on their personal goals and connections to the world.
                  </Text>
                  
                  <Divider my="md" label="Plot Coherence" />
                  <Text>
                    The current events show good progression, but there are opportunities 
                    to strengthen the connections between side quests and the main storyline.
                  </Text>
                  
                  <Divider my="md" label="World Building" />
                  <Text>
                    The locations are well-described, but could benefit from more cultural 
                    and historical details to make them feel more lived-in.
                  </Text>
                </Card>
                
                <Text c="dimmed" ta="center">
                  This is a placeholder for the AI Insights feature.
                </Text>
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
}
