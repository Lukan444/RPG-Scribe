import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Tabs,
  Image,
  Badge,
  Paper,
  Grid,
  Stack,
  Divider,
  ActionIcon,
  Menu,
  LoadingOverlay,
  Alert,
  Card,
  Avatar,
  SimpleGrid
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCalendar,
  IconDeviceGamepad2,
  IconMap,
  IconUsers,
  IconMapPin,
  IconBook,
  IconAlertCircle,
  IconClock,
  IconNote
} from '@tabler/icons-react';
import { Campaign } from '../../models/Campaign';
import { campaignService } from '../../services/api/campaign.service';
import { EntityType } from '../../models/Relationship';
import { EntityList } from '../common/EntityList';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import CampaignSessions from '../campaign/CampaignSessions';
import CampaignCharacters from '../campaign/CampaignCharacters';
import CampaignLocations from '../campaign/CampaignLocations';
import CampaignNotes from '../campaign/CampaignNotes';

/**
 * CampaignDetail component - Detailed view of a campaign
 */
export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const campaignData = await campaignService.getCampaignById(id);

        if (!campaignData) {
          setError('Campaign not found');
          return;
        }

        setCampaign(campaignData);
      } catch (err) {
        console.error('Error loading campaign:', err);
        setError('Failed to load campaign data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id]);

  // Handle edit campaign
  const handleEditCampaign = () => {
    if (id) {
      navigate(`/campaigns/${id}/edit`);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await campaignService.deleteCampaign(id);
        navigate('/campaigns');
      } catch (err) {
        console.error('Error deleting campaign:', err);
        alert('Failed to delete campaign. Please try again later.');
      }
    }
  };

  // Check if user can edit
  const canEdit = user && campaign && (user.id === campaign.createdBy);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />

      {error ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      ) : campaign ? (
        <>
          {/* Campaign Header */}
          <Paper p="md" withBorder mb="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                {campaign.imageURL ? (
                  <Image
                    src={campaign.imageURL}
                    alt={campaign.name}
                    radius="md"
                    height={200}
                    fit="cover"
                  />
                ) : (
                  <Box
                    h={200}
                    bg="gray.2"
                    style={{
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text c="dimmed">No image</Text>
                  </Box>
                )}
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 9 }}>
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Title order={2}>{campaign.name}</Title>
                    <Group gap="xs" mt="xs">
                      <Badge color={getCampaignStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge color="blue">{campaign.system}</Badge>
                    </Group>
                  </Box>

                  {canEdit && (
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={handleEditCampaign}
                        >
                          Edit Campaign
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={handleDeleteCampaign}
                        >
                          Delete Campaign
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>

                <Text mt="md">{campaign.description}</Text>

                <Grid mt="md">
                  {campaign.setting && (
                    <Grid.Col span={6}>
                      <Group gap="xs">
                        <IconMap size={16} />
                        <Text fw={500}>Setting:</Text>
                        <Text>{campaign.setting}</Text>
                      </Group>
                    </Grid.Col>
                  )}

                  {campaign.startDate && (
                    <Grid.Col span={6}>
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text fw={500}>Started:</Text>
                        <Text>{formatDate(campaign.startDate)}</Text>
                      </Group>
                    </Grid.Col>
                  )}

                  {campaign.endDate && (
                    <Grid.Col span={6}>
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text fw={500}>Ended:</Text>
                        <Text>{formatDate(campaign.endDate)}</Text>
                      </Group>
                    </Grid.Col>
                  )}

                  <Grid.Col span={6}>
                    <Group gap="xs">
                      <IconDeviceGamepad2 size={16} />
                      <Text fw={500}>System:</Text>
                      <Text>{campaign.system}</Text>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Campaign Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="md">
              <Tabs.Tab value="overview" leftSection={<IconBook size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="sessions" leftSection={<IconClock size={16} />}>
                Sessions
              </Tabs.Tab>
              <Tabs.Tab value="characters" leftSection={<IconUsers size={16} />}>
                Characters
              </Tabs.Tab>
              <Tabs.Tab value="locations" leftSection={<IconMapPin size={16} />}>
                Locations
              </Tabs.Tab>
              <Tabs.Tab value="notes" leftSection={<IconNote size={16} />}>
                Notes
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview">
              <CampaignOverview campaign={campaign} />
            </Tabs.Panel>

            <Tabs.Panel value="sessions">
              <CampaignSessions campaignId={campaign.id || ''} />
            </Tabs.Panel>

            <Tabs.Panel value="characters">
              <CampaignCharacters campaignId={campaign.id || ''} />
            </Tabs.Panel>

            <Tabs.Panel value="locations">
              <CampaignLocations campaignId={campaign.id || ''} />
            </Tabs.Panel>

            <Tabs.Panel value="notes">
              <CampaignNotes campaignId={campaign.id || ''} />
            </Tabs.Panel>
          </Tabs>
        </>
      ) : null}
    </Box>
  );
}

/**
 * CampaignOverview component - Overview tab content
 */
function CampaignOverview({ campaign }: { campaign: Campaign }) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      <Paper p="md" withBorder>
        <Title order={4} mb="md">Campaign Summary</Title>
        <Text>{campaign.description}</Text>

        {/* Additional campaign details would go here */}
      </Paper>

      <Paper p="md" withBorder>
        <Title order={4} mb="md">Recent Activity</Title>
        <Text c="dimmed">No recent activity</Text>

        {/* Recent activity would go here */}
      </Paper>
    </SimpleGrid>
  );
}

// Note: These components have been moved to their own files in the campaign directory

// Note: This component has been moved to its own file in the campaign directory

/**
 * Get color for campaign status
 */
function getCampaignStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'green';
    case 'completed':
      return 'blue';
    case 'planned':
      return 'yellow';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}
