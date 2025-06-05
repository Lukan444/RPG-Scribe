import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Paper,
  Tabs,
  Select,
  Group,
  Stack,
  Alert,
  Loader,
  Center,
  Button
} from '@mantine/core';
import { IconAlertCircle, IconNetwork } from '@tabler/icons-react';
import { MindMapVisualization } from '../../components/visualizations/MindMapVisualization';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Campaign } from '../../models/Campaign';
import { EntityType } from '../../models/EntityType';

/**
 * MindMapPage - Page component for the Mind Map visualization
 */
export function MindMapPage() {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(campaignId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns from Firebase
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError('You must be logged in to view campaigns');
          setLoading(false);
          return;
        }

        const campaignsRef = collection(db, 'campaigns');
        const q = query(campaignsRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);

        const campaignData: Campaign[] = [];
        querySnapshot.forEach((doc) => {
          campaignData.push({ id: doc.id, ...doc.data() } as Campaign);
        });

        setCampaigns(campaignData);

        // If no campaign is selected and we have campaigns, select the first one
        if (!selectedCampaignId && campaignData.length > 0 && campaignData[0].id) {
          setSelectedCampaignId(campaignData[0].id);
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, campaignId, selectedCampaignId]);

  // Campaign selection options
  const campaignOptions = campaigns.map((campaign) => ({
    value: campaign.id || '',
    label: campaign.name
  }));

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Mind Map Visualization</Title>
              <Text c="dimmed">Visualize your campaign elements and their relationships</Text>
            </div>
            <IconNetwork size={40} color="teal" />
          </Group>
        </Paper>

        {loading ? (
          <Center h={200}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading campaign data...</Text>
            </Stack>
          </Center>
        ) : error ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" withCloseButton onClose={() => setError(null)}>
            <Stack gap="md">
              <Text>{error}</Text>
              <Button variant="outline" color="red" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Stack>
          </Alert>
        ) : campaigns.length === 0 ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="No Campaigns" color="yellow">
            <Stack gap="md">
              <Text>You don't have any campaigns yet. Create a campaign to use the Mind Map visualization.</Text>
              <Button variant="filled" color="yellow" onClick={() => navigate('/campaigns/new')}>
                Create Campaign
              </Button>
            </Stack>
          </Alert>
        ) : (
          <>
            <Paper p="md" withBorder>
              <Group align="flex-end" gap="md">
                <Select
                  label="Select Campaign"
                  placeholder="Choose a campaign"
                  data={campaignOptions}
                  value={selectedCampaignId}
                  onChange={setSelectedCampaignId}
                  w={300}
                />
              </Group>
            </Paper>

            <Tabs defaultValue="mindmap">
              <Tabs.List>
                <Tabs.Tab value="mindmap">Mind Map</Tabs.Tab>
                <Tabs.Tab value="settings">Visualization Settings</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="mindmap" pt="md">
                {selectedCampaignId ? (
                  <MindMapVisualization
                    campaignId={selectedCampaignId}
                    entityType={EntityType.CAMPAIGN}
                    height={600}
                  />
                ) : (
                  <Alert icon={<IconAlertCircle size="1rem" />} title="No Campaign Selected" color="blue">
                    Please select a campaign to visualize.
                  </Alert>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="settings" pt="md">
                <Paper p="md" withBorder>
                  <Title order={3}>Visualization Settings</Title>
                  <Text>Configure how the mind map visualization appears and behaves.</Text>
                  {/* Settings controls will go here */}
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </>
        )}
      </Stack>
    </Container>
  );
}

export default MindMapPage;
