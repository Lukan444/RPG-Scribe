import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Anchor,
  Stack,
  Paper,
  Title,
  Container,
  Divider,
  Alert,
  LoadingOverlay,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconLock, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import SocialAuth from '../../components/auth/SocialAuth';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, user } = useAuth();
  const { t } = useTranslation(['ui', 'common']);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Check if there's a redirect path in the location state
  const from = location.state?.from?.pathname || '/dashboard';

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate(from);
    }
  }, [user, navigate, from]);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : t('validation.email', { ns: 'common' })),
      password: (value: string) => (value.length >= 6 ? null : t('validation.passwordTooShort', { ns: 'common' })),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      clearError(); // Clear any previous errors
      setLoginSuccess(false); // Reset success state

      await login(values.email, values.password);

      // Show success message briefly before redirecting
      setLoginSuccess(true);

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        navigate(from);
      }, 500);
    } catch (err) {
      // Error is handled by the auth context
      console.error(err);
      setLoginSuccess(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder pos="relative">
        {/* Loading overlay */}
        <LoadingOverlay visible={loading} />

        <Title order={2} ta="center" mb="md">
          {t('app.welcome', 'Welcome to RPG Scribe')}
        </Title>

        <SocialAuth title={t('auth.loginWith', 'Login with')} />

        <Divider label={t('auth.orLoginWithEmail', 'Or login with email')} labelPosition="center" my="lg" />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {/* Error alert */}
            {error && (
              <Alert
                icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />}
                title={t('auth.authenticationError', 'Authentication Error')}
                color="red"
                withCloseButton
                onClose={clearError}
              >
                {error}
              </Alert>
            )}

            {/* Success alert */}
            {loginSuccess && (
              <Alert
                icon={<IconCheck style={{ width: '16px', height: '16px' }} />}
                title={t('auth.loginSuccessful', 'Login Successful')}
                color="green"
              >
                {t('auth.loginSuccessMessage', 'You have successfully logged in. Redirecting...')}
              </Alert>
            )}

            <TextInput
              required
              label={t('auth.email', { ns: 'common' })}
              placeholder={t('auth.emailPlaceholder', 'your@email.com')}
              {...form.getInputProps('email')}
              leftSection={<IconUser style={{ width: '16px', height: '16px' }} />}
              radius="md"
              disabled={loading || loginSuccess}
            />

            <PasswordInput
              required
              label={t('auth.password', { ns: 'common' })}
              placeholder={t('auth.passwordPlaceholder', 'Your password')}
              {...form.getInputProps('password')}
              leftSection={<IconLock style={{ width: '16px', height: '16px' }} />}
              radius="md"
              disabled={loading || loginSuccess}
            />

            <Group justify="space-between">
              <Checkbox
                label={t('auth.rememberMe', { ns: 'common' })}
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.currentTarget.checked)}
                disabled={loading || loginSuccess}
              />
              <Anchor component={Link} to="/forgot-password" size="sm">
                {t('auth.forgotPassword', { ns: 'common' })}
              </Anchor>
            </Group>
          </Stack>

          <Group justify="space-between" mt="xl">
            <Anchor component={Link} to="/register" size="sm">
              {t('auth.noAccountRegister', "Don't have an account? Register")}
            </Anchor>
            <Button
              type="submit"
              radius="xl"
              loading={loading}
              disabled={loginSuccess}
            >
              {t('auth.login', { ns: 'common' })}
            </Button>
          </Group>
        </form>

        {/* Help text for authentication issues */}
        <Text size="xs" c="dimmed" ta="center" mt="xl">
          {t('auth.troubleLoggingIn', 'Having trouble logging in? Make sure pop-ups are enabled for this site.')}
        </Text>
      </Paper>
    </Container>
  );
}

export default Login;
