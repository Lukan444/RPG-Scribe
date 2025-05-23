import { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  PasswordInput,
  Button,
  Group,
  Anchor,
  Stack,
  Paper,
  Title,
  Container,
  Divider,
  Alert,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword, loading, error, clearError } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value: string) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value: string, values: { password: string }) =>
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (!token) {
        throw new Error('Reset token is missing');
      }

      // In Firebase, the token is the oobCode (one-time code)
      await resetPassword(token, values.password);
      setSubmitted(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  if (!token) {
    return (
      <Container size="xs" py="xl">
        <Paper radius="md" p="xl" withBorder>
          <Title order={2} ta="center" mb="md">
            Invalid Reset Link
          </Title>

          <Alert
            icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />}
            title="Error"
            color="red"
          >
            The password reset link is invalid or has expired. Please request a new password reset link.
          </Alert>

          <Group justify="center" mt="xl">
            <Anchor component={Link} to="/forgot-password">
              Request new reset link
            </Anchor>
          </Group>
        </Paper>
      </Container>
    );
  }

  if (submitted) {
    return (
      <Container size="xs" py="xl">
        <Paper radius="md" p="xl" withBorder>
          <Title order={2} ta="center" mb="md">
            Password Reset Successful
          </Title>

          <Alert
            icon={<IconCheck style={{ width: '16px', height: '16px' }} />}
            title="Success"
            color="teal"
          >
            Your password has been reset successfully. You will be redirected to the login page in a few seconds.
          </Alert>

          <Group justify="center" mt="xl">
            <Anchor component={Link} to="/login">
              Go to login
            </Anchor>
          </Group>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Reset Password
        </Title>

        <Text size="sm" ta="center" mb="md">
          Enter your new password below.
        </Text>

        <Divider my="lg" />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert
                icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />}
                title="Error"
                color="red"
                withCloseButton
                onClose={clearError}
              >
                {error}
              </Alert>
            )}

            <PasswordInput
              required
              label="New Password"
              placeholder="Your new password"
              {...form.getInputProps('password')}
              leftSection={<IconLock style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />

            <PasswordInput
              required
              label="Confirm New Password"
              placeholder="Confirm your new password"
              {...form.getInputProps('confirmPassword')}
              leftSection={<IconLock style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />
          </Stack>

          <Group justify="center" mt="xl">
            <Button type="submit" radius="xl" loading={loading}>
              Reset Password
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default ResetPassword;
