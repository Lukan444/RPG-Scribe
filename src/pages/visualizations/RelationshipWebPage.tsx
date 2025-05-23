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
  SegmentedControl,
  Button
} from '@mantine/core';
import { IconAlertCircle, IconNetwork } from '@tabler/icons-react';
import { RelationshipWebVisualization } from '../../components/visualizations/RelationshipWebVisualization';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Campaign } from '../../models/Campaign';
import { Character } from '../../models/Character';
import { Location } from '../../models/Location';
import { Item } from '../../models/Item';
import { Event } from '../../models/Event';
import { EntityType } from '../../models/EntityType';

/**
 * RelationshipWebPage - Page component for the Relationship Web visualization
 */
export function RelationshipWebPage() {
  const { entityId, entityType } = useParams<{ entityId?: string; entityType?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>(entityType || 'campaign');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(entityId || null);
  const [entities, setEntities] = useState<any[]>([]);
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
        const q = query(campaignsRef, where('userId', '==', user.uid));
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
  }, [user, entityId, entityType]);

  // Fetch entities based on selected entity type and campaign
  useEffect(() => {
    const fetchEntities = async () => {
      if (!selectedCampaignId || !selectedEntityType) return;

      try {
        setLoading(true);
        setError(null);

        // Determine collection name based on entity type
        const collectionName = `${selectedEntityType}s`;
        const entitiesRef = collection(db, collectionName);
        const q = query(entitiesRef, where('campaignId', '==', selectedCampaignId));
        const querySnapshot = await getDocs(q);

        const entityData: any[] = [];
        querySnapshot.forEach((doc) => {
          entityData.push({ id: doc.id, ...doc.data() });
        });

        setEntities(entityData);

        // If no entity is selected and we have entities, select the first one
        if (!selectedEntityId && entityData.length > 0 && entityData[0].id) {
          setSelectedEntityId(entityData[0].id);
        }
      } catch (err) {
        console.error(`Error fetching ${selectedEntityType}s:`, err);
        setError(`Failed to load ${selectedEntityType}s. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [selectedCampaignId, selectedEntityType]);

  // Campaign selection options
  const campaignOptions = campaigns.map((campaign) => ({
    value: campaign.id || '',
    label: campaign.name
  }));

  // Entity selection options
  const entityOptions = entities.map((entity) => ({
    value: entity.id || '',
    label: entity.name
  }));

  // Entity type options
  const entityTypeOptions = [
    { value: 'campaign', label: 'Campaign' },
    { value: 'character', label: 'Character' },
    { value: 'location', label: 'Location' },
    { value: 'item', label: 'Item' },
    { value: 'event', label: 'Event' }
  ];

  // Map string entity type to EntityType enum
  const getEntityTypeEnum = (type: string): EntityType => {
    switch (type) {
      case 'campaign': return EntityType.CAMPAIGN;
      case 'character': return EntityType.CHARACTER;
      case 'location': return EntityType.LOCATION;
      case 'item': return EntityType.ITEM;
      case 'event': return EntityType.EVENT;
      default: return EntityType.CAMPAIGN;
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Relationship Web</Title>
              <Text c="dimmed">Visualize relationships between entities in your campaign</Text>
            </div>
            <IconNetwork size={40} color="blue" />
          </Group>
        </Paper>

        {loading ? (
          <Center h={200}>
            <Stack align="center">
              <Loader size="lg" />
              <Text c="dimmed" mt="md">Loading relationship data...</Text>
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
              <Text>You don't have any campaigns yet. Create a campaign to use the Relationship Web visualization.</Text>
              <Button variant="filled" color="yellow" onClick={() => navigate('/campaigns/new')}>
                Create Campaign
              </Button>
            </Stack>
          </Alert>
        ) : (
          <>
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Group align="flex-end">
                  <Select
                    label="Select Campaign"
                    placeholder="Choose a campaign"
                    data={campaignOptions}
                    value={selectedCampaignId}
                    onChange={setSelectedCampaignId}
                    w={300}
                  />
                </Group>

                <Group align="flex-end">
                  <SegmentedControl
                    value={selectedEntityType}
                    onChange={setSelectedEntityType}
                    data={entityTypeOptions}
                  />

                  <Select
                    label={`Select ${selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}`}
                    placeholder={`Choose a ${selectedEntityType}`}
                    data={entityOptions}
                    value={selectedEntityId}
                    onChange={setSelectedEntityId}
                    w={300}
                    disabled={entities.length === 0}
                  />
                </Group>
              </Stack>
            </Paper>

            <Tabs defaultValue="relationshipweb">
              <Tabs.List>
                <Tabs.Tab value="relationshipweb">Relationship Web</Tabs.Tab>
                <Tabs.Tab value="settings">Visualization Settings</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="relationshipweb" pt="md">
                {selectedEntityId ? (
                  <RelationshipWebVisualization
                    entityId={selectedEntityId}
                    entityType={getEntityTypeEnum(selectedEntityType) as EntityType}
                    height={600}
                  />
                ) : (
                  <Alert icon={<IconAlertCircle size="1rem" />} title="No Entity Selected" color="blue">
                    Please select an entity to visualize its relationships.
                  </Alert>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="settings" pt="md">
                <Paper p="md" withBorder>
                  <Title order={3}>Visualization Settings</Title>
                  <Text>Configure how the relationship web visualization appears and behaves.</Text>
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

export default RelationshipWebPage;
