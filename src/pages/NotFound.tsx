import { Title, Text, Button, Container, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Container size="md" py={80}>
      <Title ta="center" fw={900} size="4rem">
        404
      </Title>
      <Text c="dimmed" size="lg" ta="center">
        The page you are looking for doesn't exist.
      </Text>
      <Group justify="center" mt="xl">
        <Button variant="filled" size="md" onClick={() => navigate('/')}>
          Take me back to home page
        </Button>
      </Group>
    </Container>
  );
}

export default NotFound;
