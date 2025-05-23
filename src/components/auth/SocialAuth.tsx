import { Button, Group, Stack, Divider } from '@mantine/core';
import {
  IconBrandGoogle,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandGithub,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SocialAuthProps {
  title?: string;
}

function SocialAuth({ title = 'Or continue with' }: SocialAuthProps) {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithFacebook, loginWithTwitter, loginWithGithub, loading } = useAuth();

  // Define a type for Firebase auth errors
  interface FirebaseAuthError {
    code: string;
    message: string;
  }

  // Common error handler for social logins
  const handleSocialLoginError = (error: FirebaseAuthError, provider: string) => {
    console.error(`${provider} login failed:`, error);

    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      // User closed the popup, no need to show an error
      console.log('Login popup was closed by the user');
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Multiple popups were opened, no need to show an error
      console.log('Login popup request was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      // Popup was blocked by the browser
      console.error('Login popup was blocked by the browser. Please allow popups for this site.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      handleSocialLoginError(error as FirebaseAuthError, 'Google');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      navigate('/dashboard');
    } catch (error) {
      handleSocialLoginError(error as FirebaseAuthError, 'Facebook');
    }
  };

  const handleTwitterLogin = async () => {
    try {
      await loginWithTwitter();
      navigate('/dashboard');
    } catch (error) {
      handleSocialLoginError(error as FirebaseAuthError, 'Twitter');
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
      navigate('/dashboard');
    } catch (error) {
      handleSocialLoginError(error as FirebaseAuthError, 'GitHub');
    }
  };

  return (
    <Stack>
      <Divider label={title} labelPosition="center" my="md" />

      <Group grow>
        <Button
          leftSection={<IconBrandGoogle style={{ width: '16px', height: '16px' }} />}
          variant="default"
          onClick={handleGoogleLogin}
          loading={loading}
        >
          Google
        </Button>
        <Button
          leftSection={<IconBrandFacebook style={{ width: '16px', height: '16px' }} />}
          variant="default"
          onClick={handleFacebookLogin}
          loading={loading}
          color="blue"
        >
          Facebook
        </Button>
      </Group>

      <Group grow>
        <Button
          leftSection={<IconBrandTwitter style={{ width: '16px', height: '16px' }} />}
          variant="default"
          onClick={handleTwitterLogin}
          loading={loading}
          color="cyan"
        >
          Twitter
        </Button>
        <Button
          leftSection={<IconBrandGithub style={{ width: '16px', height: '16px' }} />}
          variant="default"
          onClick={handleGithubLogin}
          loading={loading}
          color="dark"
        >
          GitHub
        </Button>
      </Group>
    </Stack>
  );
}

export default SocialAuth;
