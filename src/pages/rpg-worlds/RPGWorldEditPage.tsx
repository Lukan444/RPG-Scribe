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
import { RPGWorldForm } from '../../components/rpg-world/RPGWorldForm';
import { RPGWorld, RPGWorldUpdateParams } from '../../models/RPGWorld';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * RPG World Edit Page
 */
export function RPGWorldEditPage() {
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();
  const { currentUser } = useAuth();
  const rpgWorldService = new RPGWorldService();

  // State
  const [world, setWorld] = useState<RPGWorld | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch RPG World
  useEffect(() => {
    const fetchWorld = async () => {
      if (!worldId) {
        setError('No world ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedWorld = await rpgWorldService.getById(worldId);
        if (!fetchedWorld) {
          setError('RPG World not found');
          return;
        }

        setWorld(fetchedWorld);
      } catch (error) {
        console.error('Error fetching RPG World:', error);
        setError('Failed to load RPG World. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorld();
  }, [worldId]);

  // Handle form submission
  const handleSubmit = async (values: RPGWorldUpdateParams) => {
    if (!currentUser) {
      setError('You must be logged in to update an RPG World');
      return;
    }

    if (!worldId) {
      setError('No world ID provided');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Update RPG World
      await rpgWorldService.updateRPGWorld(worldId, values);

      // Show success notification
      notifications.show({
        title: 'RPG World Updated',
        message: `${values.name || world?.name} has been updated successfully`,
        color: 'green',
      });

      // Navigate back to the world
      navigate(`/rpg-worlds/${worldId}`);
    } catch (error) {
      console.error('Error updating RPG World:', error);
      setError('Failed to update RPG World. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/rpg-worlds/${worldId}`);
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', href: '/' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: world?.name || 'Loading...', href: `/rpg-worlds/${worldId}` },
    { title: 'Edit', href: `/rpg-worlds/${worldId}/edit` }
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
  if (error || !world) {
    return (
      <Container size="md">
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.slice(0, 2).map((item, index) => (
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
            {error || 'RPG World not found'}
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
        <Title>Edit RPG World</Title>
        <Text c="dimmed">Update your RPG world details</Text>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* RPG World Form */}
        <RPGWorldForm
          initialValues={world}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={submitting}
          isEditing
        />
      </Stack>
    </Container>
  );
}

export default RPGWorldEditPage;