import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TextInput,
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
import { IconAt, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

function ForgotPassword() {
  const { forgotPassword, loading, error, clearError } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  if (submitted) {
    return (
      <Container size="xs" py="xl">
        <Paper radius="md" p="xl" withBorder>
          <Title order={2} ta="center" mb="md">
            Password Reset Email Sent
          </Title>

          <Alert
            icon={<IconCheck style={{ width: '16px', height: '16px' }} />}
            title="Check your email"
            color="teal"
          >
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </Alert>

          <Group justify="center" mt="xl">
            <Anchor component={Link} to="/login">
              Return to login
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
          Forgot Password
        </Title>

        <Text size="sm" ta="center" mb="md">
          Enter your email address and we'll send you a link to reset your password.
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

            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
              leftSection={<IconAt style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />
          </Stack>

          <Group justify="space-between" mt="xl">
            <Anchor component={Link} to="/login" size="sm">
              Back to login
            </Anchor>
            <Button type="submit" radius="xl" loading={loading}>
              Send Reset Link
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default ForgotPassword;
