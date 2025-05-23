import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  SimpleGrid,
  Paper,
  Card,
  Badge,
  Image,
  Grid,
  Stack,
  Divider,
  RingProgress,
  Center,
  Loader,
  Alert
} from '@mantine/core';
import {
  IconPlus,
  IconUsers,
  IconMapPin,
  IconBook,
  IconClock,
  IconNote,
  IconAlertCircle,
  IconChartBar,
  IconCalendarEvent
} from '@tabler/icons-react';
import { Campaign } from '../../models/Campaign';
import { campaignService } from '../../services/api/campaign.service';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

/**
 * CampaignDashboard component - Dashboard view for campaigns
 */
export function CampaignDashboard() {
  const { user } = useAuth();
  
  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSessions: 0,
    totalCharacters: 0,
    totalLocations: 0
  });
  
  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const campaignsData = await campaignService.getCampaignsByUserId(user.id);
        setCampaigns(campaignsData);
        
        // Get recent campaigns (last 3 updated)
        const sorted = [...campaignsData].sort((a, b) => 
          (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
        );
        setRecentCampaigns(sorted.slice(0, 3));
        
        // Get active campaigns
        const active = campaignsData.filter(c => c.status === 'active');
        setActiveCampaigns(active);
        
        // Calculate stats
        const totalSessions = campaignsData.reduce((sum, campaign) => 
          sum + (campaign.sessionCount || 0), 0
        );
        
        const totalCharacters = campaignsData.reduce((sum, campaign) => 
          sum + (campaign.characterCount || 0), 0
        );
        
        const totalLocations = campaignsData.reduce((sum, campaign) => 
          sum + (campaign.locationCount || 0), 0
        );
        
        setStats({
          totalCampaigns: campaignsData.length,
          activeCampaigns: active.length,
          totalSessions,
          totalCharacters,
          totalLocations
        });
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError('Failed to load campaign data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, [user]);
  
  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red">
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={2}>Campaign Dashboard</Title>
        <Button
          component={Link}
          to="/campaigns/new"
          leftSection={<IconPlus size={16} />}
        >
          Create Campaign
        </Button>
      </Group>
      
      {/* Stats Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} mb="xl">
        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={<IconBook size={24} />}
          color="blue"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon={<IconChartBar size={24} />}
          color="green"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={<IconClock size={24} />}
          color="violet"
        />
        <StatCard
          title="Characters"
          value={stats.totalCharacters}
          icon={<IconUsers size={24} />}
          color="orange"
        />
        <StatCard
          title="Locations"
          value={stats.totalLocations}
          icon={<IconMapPin size={24} />}
          color="teal"
        />
      </SimpleGrid>
      
      <Grid gutter="md">
        {/* Recent Campaigns */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Recent Campaigns</Title>
              <Button
                component={Link}
                to="/campaigns"
                variant="subtle"
                size="sm"
              >
                View All
              </Button>
            </Group>
            
            {recentCampaigns.length === 0 ? (
              <Text c="dimmed">No campaigns found</Text>
            ) : (
              <Stack>
                {recentCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </Stack>
            )}
          </Paper>
        </Grid.Col>
        
        {/* Upcoming Sessions */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Title order={4} mb="md">Upcoming Sessions</Title>
            
            <Text c="dimmed">No upcoming sessions</Text>
            
            {/* Upcoming sessions would go here */}
          </Paper>
        </Grid.Col>
        
        {/* Campaign Status Distribution */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder h="100%">
            <Title order={4} mb="md">Campaign Status</Title>
            
            <Center>
              <CampaignStatusChart campaigns={campaigns} />
            </Center>
          </Paper>
        </Grid.Col>
        
        {/* Active Campaigns */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Title order={4} mb="md">Active Campaigns</Title>
            
            {activeCampaigns.length === 0 ? (
              <Text c="dimmed">No active campaigns</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {activeCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} compact />
                ))}
              </SimpleGrid>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

/**
 * StatCard component - Card for displaying a statistic
 */
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <Paper p="md" withBorder>
      <Group>
        <Box style={{ color }} mr="xs">
          {icon}
        </Box>
        <Box>
          <Text size="lg" fw={700}>
            {value}
          </Text>
          <Text size="sm" c="dimmed">
            {title}
          </Text>
        </Box>
      </Group>
    </Paper>
  );
}

/**
 * CampaignCard component - Card for displaying a campaign
 */
function CampaignCard({ 
  campaign, 
  compact = false 
}: { 
  campaign: Campaign; 
  compact?: boolean;
}) {
  return (
    <Card p="sm" withBorder component={Link} to={`/campaigns/${campaign.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Group>
        {campaign.imageURL && !compact && (
          <Image
            src={campaign.imageURL}
            alt={campaign.name}
            width={60}
            height={60}
            radius="md"
          />
        )}
        
        <Box style={{ flex: 1 }}>
          <Group justify="space-between" wrap="nowrap">
            <Text fw={500} truncate>
              {campaign.name}
            </Text>
            <Badge color={getCampaignStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </Group>
          
          {!compact && (
            <Text size="sm" c="dimmed" lineClamp={1}>
              {campaign.description}
            </Text>
          )}
          
          <Group gap="xs" mt={4}>
            <Text size="xs" c="dimmed">
              {campaign.system}
            </Text>
            {campaign.updatedAt && (
              <Text size="xs" c="dimmed">
                Updated: {formatDate(campaign.updatedAt)}
              </Text>
            )}
          </Group>
        </Box>
      </Group>
    </Card>
  );
}

/**
 * CampaignStatusChart component - Chart for campaign status distribution
 */
function CampaignStatusChart({ campaigns }: { campaigns: Campaign[] }) {
  // Count campaigns by status
  const statusCounts = campaigns.reduce((acc, campaign) => {
    acc[campaign.status] = (acc[campaign.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Prepare data for the chart
  const total = campaigns.length;
  const data = [
    { status: 'active', count: statusCounts['active'] || 0, color: 'green' },
    { status: 'planned', count: statusCounts['planned'] || 0, color: 'yellow' },
    { status: 'completed', count: statusCounts['completed'] || 0, color: 'blue' },
    { status: 'archived', count: statusCounts['archived'] || 0, color: 'gray' }
  ];
  
  if (total === 0) {
    return <Text c="dimmed">No campaigns to display</Text>;
  }
  
  return (
    <Box>
      <RingProgress
        size={180}
        thickness={20}
        label={
          <Text ta="center" fw={700} size="xl">
            {total}
          </Text>
        }
        sections={data.map(item => ({
          value: (item.count / total) * 100,
          color: item.color
        }))}
      />
      
      <Stack mt="md" gap="xs">
        {data.map(item => (
          <Group key={item.status} gap="xs">
            <Box w={12} h={12} style={{ backgroundColor: item.color, borderRadius: '50%' }} />
            <Text size="sm">
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}:
            </Text>
            <Text size="sm" fw={500}>
              {item.count}
            </Text>
          </Group>
        ))}
      </Stack>
    </Box>
  );
}

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
