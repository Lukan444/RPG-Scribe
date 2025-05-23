import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Group,
  Button,
  TextInput,
  Select,
  SimpleGrid,
  Loader,
  Center,
  Text,
  Badge
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconSortAscending
} from '@tabler/icons-react';
import { EntityList } from '../common/EntityList';
import { EntityType } from '../../models/EntityType';
import { Campaign } from '../../models/Campaign';
import { campaignService } from '../../services/api/campaign.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * CampaignList component - List of campaigns
 */
export function CampaignList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('updatedAt');

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        let campaignsData: Campaign[] = [];

        if (user) {
          campaignsData = await campaignService.getCampaignsByUserId(user.id);
        } else {
          campaignsData = await campaignService.getAllCampaigns();
        }

        setCampaigns(campaignsData);
        setFilteredCampaigns(campaignsData);
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError('Failed to load campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...campaigns];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        campaign =>
          campaign.name.toLowerCase().includes(query) ||
          campaign.description.toLowerCase().includes(query) ||
          campaign.setting.toLowerCase().includes(query) ||
          campaign.system.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter(campaign => campaign.status === statusFilter);
    }

    // Apply sorting
    if (sortBy) {
      result = result.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'updatedAt':
            return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
          case 'createdAt':
            return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
          case 'startDate':
            return (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0);
          default:
            return 0;
        }
      });
    }

    setFilteredCampaigns(result);
  }, [campaigns, searchQuery, statusFilter, sortBy]);

  // Handle search
  const handleSearch = () => {
    // Search is already applied in the useEffect
  };

  // Handle create campaign
  const handleCreateCampaign = () => {
    navigate('/campaigns/new');
  };

  // Handle view campaign
  const handleViewCampaign = (id: string) => {
    navigate(`/campaigns/${id}`);
  };

  // Handle edit campaign
  const handleEditCampaign = (id: string) => {
    navigate(`/campaigns/${id}/edit`);
  };

  // Handle delete campaign
  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await campaignService.deleteCampaign(id);
        setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      } catch (err) {
        console.error('Error deleting campaign:', err);
        alert('Failed to delete campaign. Please try again later.');
      }
    }
  };

  // Format campaigns for EntityList
  const formattedCampaigns = filteredCampaigns.map(campaign => ({
    id: campaign.id || '', // Ensure id is always a string
    type: EntityType.CAMPAIGN,
    name: campaign.name,
    description: campaign.description,
    imageUrl: campaign.imageURL,
    badges: [
      { label: campaign.status, color: getCampaignStatusColor(campaign.status) },
      { label: campaign.system, color: 'blue' }
    ],
    metadata: [
      { label: 'Setting', value: campaign.setting },
      { label: 'Sessions', value: campaign.sessionCount?.toString() || '0' },
      { label: 'Characters', value: campaign.characterCount?.toString() || '0' }
    ]
  }));

  // Status filter options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'planned', label: 'Planned' },
    { value: 'archived', label: 'Archived' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'createdAt', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'startDate', label: 'Start Date' }
  ];

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={2}>Campaigns</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateCampaign}
        >
          Create Campaign
        </Button>
      </Group>

      <Group mb="md">
        <TextInput
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flexGrow: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />

        <Select
          placeholder="Filter by Status"
          data={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
          value={statusFilter}
          onChange={setStatusFilter}
          leftSection={<IconFilter size={16} />}
          w={200}
          clearable
        />

        <Select
          placeholder="Sort by"
          data={sortOptions}
          value={sortBy}
          onChange={setSortBy}
          leftSection={<IconSortAscending size={16} />}
          w={200}
          clearable
        />
      </Group>

      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : error ? (
        <Center h={200}>
          <Text c="red">{error}</Text>
        </Center>
      ) : formattedCampaigns.length === 0 ? (
        <Center h={200}>
          <Box ta="center">
            <Text c="dimmed" mb="md">No campaigns found</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateCampaign}
            >
              Create Your First Campaign
            </Button>
          </Box>
        </Center>
      ) : (
        <EntityList
          entities={formattedCampaigns}
          onView={handleViewCampaign}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
          showFilters={false}
          showPagination={false}
          showAddButton={false}
          columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
        />
      )}
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
