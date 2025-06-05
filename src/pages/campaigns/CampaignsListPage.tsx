import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Box,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
  rem
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconAlertCircle,
  IconBook
} from '@tabler/icons-react';
import { CampaignList } from '../../components/campaign/CampaignList';
import { Campaign, CampaignStatus } from '../../models/Campaign';
import { CampaignService } from '../../services/campaign.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Campaigns List Page
 */
export function CampaignsListPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const campaignService = new CampaignService();

  // State for Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSystem, setFilterSystem] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Get campaigns for the current user (use id instead of uid)
        const userCampaigns = await campaignService.getCampaignsByUser(currentUser.id);

        // Get public campaigns
        const publicCampaigns = await campaignService.getPublicCampaigns();

        // Combine and deduplicate
        const combinedCampaigns = [...userCampaigns];
        publicCampaigns.forEach(campaign => {
          if (!combinedCampaigns.some(c => c.id === campaign.id)) {
            combinedCampaigns.push(campaign);
          }
        });

        setCampaigns(combinedCampaigns);
        setFilteredCampaigns(combinedCampaigns);
      } catch (error) {
        console.error('Error fetching Campaigns:', error);
        setError('Failed to load Campaigns. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [currentUser]);

  // Filter and sort campaigns when search or filter changes
  useEffect(() => {
    let result = [...campaigns];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        campaign =>
          campaign.name.toLowerCase().includes(query) ||
          campaign.description.toLowerCase().includes(query) ||
          campaign.setting.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus) {
      result = result.filter(campaign => campaign.status === filterStatus);
    }

    // Apply system filter
    if (filterSystem) {
      result = result.filter(campaign => campaign.system === filterSystem);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA: any = a[sortBy as keyof Campaign];
      let valueB: any = b[sortBy as keyof Campaign];

      // Handle dates
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'startDate' || sortBy === 'endDate') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }

      // Handle strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Handle numbers and other types
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredCampaigns(result);
  }, [campaigns, searchQuery, filterStatus, filterSystem, sortBy, sortOrder]);

  // Get unique systems for filter
  const systems = [...new Set(campaigns.map(campaign => campaign.system).filter(Boolean))].map(system => ({
    value: system,
    label: system
  }));

  // Status options for filter
  const statusOptions = Object.values(CampaignStatus).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));

  // Handle create campaign
  const handleCreateCampaign = () => {
    navigate('/campaigns/new');
  };

  // Handle delete campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await campaignService.deleteCampaign(campaignId);
      setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
    } catch (error) {
      console.error('Error deleting Campaign:', error);
      setError('Failed to delete Campaign. Please try again.');
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', href: '/' },
    { title: 'Campaigns', href: '/campaigns' }
  ];

  return (
    <Container size="xl">
      <Stack gap="md">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <Anchor
              key={index}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.href);
              }}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        {/* Page Header */}
        <Group justify="space-between">
          <Box>
            <Title>Campaigns</Title>
            <Text color="dimmed">Manage your campaigns across all RPG worlds</Text>
          </Box>
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateCampaign}
          >
            Create Campaign
          </Button>
        </Group>

        {/* Search and Filters */}
        <Group grow>
          <TextInput
            placeholder="Search campaigns..."
            leftSection={<IconSearch style={{ width: '14px', height: '14px' }} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
          <Select
            placeholder="Filter by status"
            clearable
            data={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
          />
          <Select
            placeholder="Filter by system"
            clearable
            data={systems}
            value={filterSystem}
            onChange={setFilterSystem}
          />
          <Select
            placeholder="Sort by"
            data={[
              { value: 'name', label: 'Name' },
              { value: 'updatedAt', label: 'Last Updated' },
              { value: 'createdAt', label: 'Created Date' },
              { value: 'startDate', label: 'Start Date' },
              { value: 'status', label: 'Status' }
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value || 'updatedAt')}
          />
          <Select
            placeholder="Order"
            data={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' }
            ]}
            value={sortOrder}
            onChange={(value) => setSortOrder((value as 'asc' | 'desc') || 'desc')}
          />
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Campaign List */}
        <CampaignList
          campaigns={filteredCampaigns}
          isLoading={loading}
          error={error}
          onCreateCampaign={handleCreateCampaign}
          onDeleteCampaign={handleDeleteCampaign}
        />
      </Stack>
    </Container>
  );
}

export default CampaignsListPage;