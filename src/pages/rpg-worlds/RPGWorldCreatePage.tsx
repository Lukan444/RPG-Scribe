import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { RPGWorldForm } from '../../components/rpg-world/RPGWorldForm';
import { RPGWorldCreationParams, RPGWorldUpdateParams } from '../../models/RPGWorld';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { useAuth } from '../../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

/**
 * RPG World Create Page
 */
export function RPGWorldCreatePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const rpgWorldService = new RPGWorldService();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (values: RPGWorldCreationParams | RPGWorldUpdateParams) => {
    // Type assertion since we know this is a creation operation
    const creationValues = values as RPGWorldCreationParams;

    // Validate user authentication
    if (!currentUser) {
      setError('You must be logged in to create an RPG World');
      notifications.show({
        title: 'Authentication Error',
        message: 'You must be logged in to create an RPG World',
        color: 'red',
      });
      return;
    }

    // Handle both Firebase user (uid) and mock user (id)
    const userId = currentUser.uid || currentUser.id;
    if (!userId) {
      setError('User ID is missing. Please log out and log back in.');
      notifications.show({
        title: 'Authentication Error',
        message: 'User ID is missing. Please log out and log back in.',
        color: 'red',
      });
      return;
    }

    // Validate required fields
    if (!creationValues.name || creationValues.name.trim() === '') {
      setError('World name is required');
      return;
    }

    if (!creationValues.description || creationValues.description.trim() === '') {
      setError('World description is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Show loading notification
      const loadingNotificationId = notifications.show({
        title: 'Creating RPG World',
        message: 'Please wait while we create your new world...',
        color: 'blue',
        loading: true,
        autoClose: false,
      });

      // Create RPG World
      const newWorld = await rpgWorldService.createRPGWorld(creationValues, userId);

      // Close loading notification
      notifications.hide(loadingNotificationId);

      // Show success notification
      notifications.show({
        title: 'RPG World Created',
        message: `${creationValues.name} has been created successfully`,
        color: 'green',
      });

      // Navigate to the new world
      navigate(`/rpg-worlds/${newWorld.id}`);
    } catch (error) {
      console.error('Error creating RPG World:', error);

      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        const errorMessage = error.message;

        if (errorMessage.includes('not authenticated') || errorMessage.includes('User ID is required')) {
          setError('Authentication error: Please log out and log back in to continue');
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          setError('Permission error: You do not have permission to create an RPG World');
        } else {
          setError(`Failed to create RPG World: ${errorMessage}`);
        }

        notifications.show({
          title: 'Error Creating RPG World',
          message: errorMessage,
          color: 'red',
        });
      } else {
        setError('Failed to create RPG World. Please try again.');

        notifications.show({
          title: 'Error Creating RPG World',
          message: 'An unknown error occurred. Please try again.',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/rpg-worlds');
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', href: '/' },
    { title: 'RPG Worlds', href: '/rpg-worlds' },
    { title: 'Create New World', href: '/rpg-worlds/new' }
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
        <Title>Create New RPG World</Title>
        <Text color="dimmed">Create a new RPG world to organize your campaigns</Text>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* RPG World Form */}
        <RPGWorldForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={loading}
        />
      </Stack>
    </Container>
  );
}

export default RPGWorldCreatePage;