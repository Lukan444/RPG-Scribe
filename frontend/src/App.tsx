import React, { useState } from 'react';
import {
  AppShell,
  Burger,
  Button,
  Group,
  Text,
  Title,
  Paper,
  Container,
  TextInput,
  PasswordInput,
  Stack,
  Divider,
  Anchor,
  Center,
  Box,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDice, IconUser, IconLock } from '@tabler/icons-react';
import './App.css';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login attempt with:', { email, password });
    // In a real app, you would handle authentication here
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group>
            <IconDice size={30} stroke={1.5} />
            <Title order={3}>RPG Scribe</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text>Application navbar</Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xs" py="xl">
          <Paper radius="md" p="xl" withBorder>
            <Text size="lg" fw={500} ta="center" mb="md">
              Welcome to RPG Scribe
            </Text>

            <Divider label="Login with email" labelPosition="center" my="lg" />

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <Stack>
                <TextInput
                  required
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  leftSection={<IconUser size={16} stroke={1.5} />}
                  radius="md"
                />

                <PasswordInput
                  required
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  leftSection={<IconLock size={16} stroke={1.5} />}
                  radius="md"
                />
              </Stack>

              <Group justify="space-between" mt="xl">
                <Anchor component="button" type="button" c="dimmed" size="xs">
                  Forgot password?
                </Anchor>
                <Button type="submit" radius="xl">
                  Login
                </Button>
              </Group>
            </form>
          </Paper>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
