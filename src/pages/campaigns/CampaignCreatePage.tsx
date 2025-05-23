import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Breadcrumbs,
  Anchor,
  Stack,
  Alert,
  rem
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { CampaignForm } from '../../components/campaign/CampaignForm';
import { CampaignCreationParams, CampaignUpdateParams } from '../../models/Campaign';
import { CampaignService } from '../../services/campaign.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * Campaign Create Page
 */
export function CampaignCreatePage() {
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId?: string }>();
  const { currentUser } = useAuth();
  const campaignService = new CampaignService();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (values: CampaignCreationParams | CampaignUpdateParams) => {
    // Type assertion since we know this is a creation operation
    const creationValues = values as CampaignCreationParams;
    if (!currentUser) {
      setError('You must be logged in to create a Campaign');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create Campaign with createdBy field
      const campaignParams: CampaignCreationParams = {
        ...creationValues,
        createdBy: currentUser.uid
      };
      const newCampaign = await campaignService.createCampaign(campaignParams);

      // Show success notification
      notifications.show({
        title: 'Campaign Created',
        message: `${creationValues.name} has been created successfully`,
        color: 'green',
      });

      // Navigate to the new campaign
      if (worldId) {
        navigate(`/rpg-worlds/${worldId}/campaigns/${newCampaign.id}`);
      } else {
        navigate(`/campaigns/${newCampaign.id}`);
      }
    } catch (error) {
      console.error('Error creating Campaign:', error);
      setError('Failed to create Campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}`);
    } else {
      navigate('/campaigns');
    }
  };

  // Breadcrumb items
  const breadcrumbItems = worldId
    ? [
        { title: 'Home', href: '/' },
        { title: 'RPG Worlds', href: '/rpg-worlds' },
        { title: 'World Details', href: `/rpg-worlds/${worldId}` },
        { title: 'Create Campaign', href: `/rpg-worlds/${worldId}/campaigns/new` }
      ]
    : [
        { title: 'Home', href: '/' },
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Create Campaign', href: '/campaigns/new' }
      ];

  return (
    <Container size="md">
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
        <Title>Create New Campaign</Title>
        <Text color="dimmed">Create a new campaign to start your adventure</Text>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Campaign Form */}
        <CampaignForm
          worldId={worldId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={loading}
        />
      </Stack>
    </Container>
  );
}

export default CampaignCreatePage;