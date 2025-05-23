import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock, IconAlertCircle, IconAt, IconId } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import SocialAuth from '../../components/auth/SocialAuth';

function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value: string) => (value.length >= 2 ? null : 'Name must be at least 2 characters'),
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value: string, values: { password: string }) =>
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await register(values.name, values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Create an Account
        </Title>

        <SocialAuth title="Register with" />

        <Divider label="Or register with email" labelPosition="center" my="lg" />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert
                icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />}
                title="Registration Error"
                color="red"
                withCloseButton
                onClose={clearError}
              >
                {error}
              </Alert>
            )}

            <TextInput
              required
              label="Name"
              placeholder="Your name"
              {...form.getInputProps('name')}
              leftSection={<IconId style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />

            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
              leftSection={<IconAt style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
              leftSection={<IconLock style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />

            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              {...form.getInputProps('confirmPassword')}
              leftSection={<IconLock style={{ width: '16px', height: '16px' }} />}
              radius="md"
            />
          </Stack>

          <Group justify="space-between" mt="xl">
            <Anchor component={Link} to="/login" size="sm">
              Already have an account? Login
            </Anchor>
            <Button type="submit" radius="xl" loading={loading}>
              Register
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default Register;
