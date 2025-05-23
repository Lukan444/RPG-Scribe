import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Avatar,
  Stack,
  Alert,
  Divider,
  FileInput,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconUser,
  IconCheck,
  IconAlertCircle,
  IconUpload,
  IconAt,
  IconShield,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { user, loading, error, updateUserProfile, verifyEmail, clearError } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      displayName: user?.name || '',
    },
    validate: {
      displayName: (value: string) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
    },
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      form.setValues({
        displayName: user.name || '',
      });
    }
  }, [user, form]);

  // Create a preview URL for the selected avatar file
  useEffect(() => {
    if (avatarFile) {
      const objectUrl = URL.createObjectURL(avatarFile);
      setAvatarPreview(objectUrl);

      // Free memory when this component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [avatarFile]);

  const handleProfileUpdate = async (values: typeof form.values) => {
    try {
      clearError();
      setSuccessMessage(null);

      // Convert the avatar file to a data URL if it exists
      let photoURL = user?.photoURL;
      if (avatarFile) {
        const reader = new FileReader();
        photoURL = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(avatarFile);
        });
      }

      await updateUserProfile({
        displayName: values.displayName,
        photoURL,
      });

      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      clearError();
      setSuccessMessage(null);
      await verifyEmail();
      setVerificationSent(true);
      setSuccessMessage('Verification email sent. Please check your inbox.');
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Paper p="md" withBorder>
          <Text>Please log in to view your profile.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Your Profile
        </Title>

        {error && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Error"
            color="red"
            withCloseButton
            onClose={clearError}
            mb="md"
          >
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert
            icon={<IconCheck size="1rem" />}
            title="Success"
            color="green"
            withCloseButton
            onClose={() => setSuccessMessage(null)}
            mb="md"
          >
            {successMessage}
          </Alert>
        )}

        <Group mb="md" justify="center">
          <Stack align="center" gap="xs">
            <Avatar
              src={avatarPreview || user.photoURL}
              alt={user.name || 'User'}
              size={120}
              radius={120}
              color="blue"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Group gap="xs">
              <Badge color={user.emailVerified ? 'green' : 'yellow'}>
                {user.emailVerified ? 'Verified' : 'Unverified'}
              </Badge>
              <Badge color="blue">{user.role}</Badge>
            </Group>
          </Stack>
        </Group>

        <Divider label="Account Information" labelPosition="center" my="md" />

        <Stack gap="xs" mb="md">
          <Group gap="xs">
            <IconAt size="1rem" />
            <Text size="sm">{user.email}</Text>
          </Group>
          <Group gap="xs">
            <IconShield size="1rem" />
            <Text size="sm">Provider: {user.providerId}</Text>
          </Group>
        </Stack>

        {!user.emailVerified && (
          <Group justify="center" mb="md">
            <Button
              onClick={handleVerifyEmail}
              loading={loading}
              disabled={verificationSent}
              color="yellow"
              variant="light"
            >
              {verificationSent ? 'Verification Email Sent' : 'Verify Email'}
            </Button>
          </Group>
        )}

        <Divider label="Edit Profile" labelPosition="center" my="md" />

        <form onSubmit={form.onSubmit(handleProfileUpdate)}>
          <Stack>
            <TextInput
              required
              label="Display Name"
              placeholder="Your name"
              leftSection={<IconUser size="1rem" />}
              {...form.getInputProps('displayName')}
            />

            <FileInput
              label="Profile Picture"
              placeholder="Upload new profile picture"
              accept="image/png,image/jpeg,image/gif"
              leftSection={<IconUpload size="1rem" />}
              value={avatarFile}
              onChange={setAvatarFile}
              clearable
            />

            <Group justify="right" mt="md">
              <Button type="submit" loading={loading}>
                Update Profile
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default Profile;
