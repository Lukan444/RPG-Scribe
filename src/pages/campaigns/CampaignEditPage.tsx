import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Breadcrumbs,
  Anchor,
  Stack,
  Alert,
  Skeleton,
  rem
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { CampaignForm } from '../../components/campaign/CampaignForm';
import { Campaign, CampaignUpdateParams } from '../../models/Campaign';
import { CampaignService } from '../../services/campaign.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * Campaign Edit Page
 */
export function CampaignEditPage() {
  const navigate = useNavigate();
  const { worldId, campaignId } = useParams<{ worldId?: string; campaignId: string }>();
  const { currentUser } = useAuth();
  const campaignService = new CampaignService();

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Campaign
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) {
        setError('No campaign ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedCampaign = await campaignService.getById(campaignId);
        if (!fetchedCampaign) {
          setError('Campaign not found');
          return;
        }

        setCampaign(fetchedCampaign);
      } catch (error) {
        console.error('Error fetching Campaign:', error);
        setError('Failed to load Campaign. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  // Handle form submission
  const handleSubmit = async (values: CampaignUpdateParams) => {
    if (!currentUser) {
      setError('You must be logged in to update a Campaign');
      return;
    }

    if (!campaignId) {
      setError('No campaign ID provided');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Update Campaign
      await campaignService.updateCampaign(campaignId, values);

      // Show success notification
      notifications.show({
        title: 'Campaign Updated',
        message: `${values.name || campaign?.name} has been updated successfully`,
        color: 'green',
      });

      // Navigate back to the campaign
      if (worldId) {
        navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}`);
      } else {
        navigate(`/campaigns/${campaignId}`);
      }
    } catch (error) {
      console.error('Error updating Campaign:', error);
      setError('Failed to update Campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}`);
    } else {
      navigate(`/campaigns/${campaignId}`);
    }
  };

  // Breadcrumb items
  const breadcrumbItems = worldId
    ? [
        { title: 'Home', href: '/' },
        { title: 'RPG Worlds', href: '/rpg-worlds' },
        { title: 'World Details', href: `/rpg-worlds/${worldId}` },
        { title: campaign?.name || 'Campaign', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}` },
        { title: 'Edit', href: `/rpg-worlds/${worldId}/campaigns/${campaignId}/edit` }
      ]
    : [
        { title: 'Home', href: '/' },
        { title: 'Campaigns', href: '/campaigns' },
        { title: campaign?.name || 'Campaign', href: `/campaigns/${campaignId}` },
        { title: 'Edit', href: `/campaigns/${campaignId}/edit` }
      ];

  // Show loading state
  if (loading) {
    return (
      <Container size="md">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.map((item, index) => (
              <Skeleton key={index} height={20} width={80} radius="xl" />
            ))}
          </Breadcrumbs>
          <Skeleton height={30} width={200} />
          <Skeleton height={20} width={300} />
          <Skeleton height={400} radius="md" />
        </Stack>
      </Container>
    );
  }

  // Show error state
  if (error || !campaign) {
    return (
      <Container size="md">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.slice(0, breadcrumbItems.length - 2).map((item, index) => (
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
          <Title>Error</Title>
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error || 'Campaign not found'}
          </Alert>
        </Stack>
      </Container>
    );
  }

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
        <Title>Edit Campaign</Title>
        <Text color="dimmed">Update your campaign details</Text>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Campaign Form */}
        <CampaignForm
          worldId={worldId}
          initialValues={campaign}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={submitting}
          isEditing
        />
      </Stack>
    </Container>
  );
}

export default CampaignEditPage;