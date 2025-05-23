import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Burger,
  Group,
  Title,
  ActionIcon,
  Menu,
  TextInput,
  useMantineColorScheme,
  useMantineTheme,
  rem,
  Image
} from '@mantine/core';
import { SafeAppShell } from '../common/SafeAppShell';
import {
  IconUser,
  IconSearch,
  IconSun,
  IconMoon,
  IconSettings,
  IconLogout
} from '@tabler/icons-react';
import { RPGWorldNavbar } from './RPGWorldNavbar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AppShellLayout component - Main layout for the application
 */
export function AppShellLayout() {
  const [opened, setOpened] = useState(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      <SafeAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <Image src="/logo192.png" alt="RPG Scribe Logo" width={30} height={30} />
            <Title order={3}>RPG Scribe</Title>
          </Group>

          <Group>
            <TextInput
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              visibleFrom="sm"
              w={200}
            />

            <ActionIcon
              variant="subtle"
              onClick={() => toggleColorScheme()}
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? (
                <IconSun size={20} stroke={1.5} />
              ) : (
                <IconMoon size={20} stroke={1.5} />
              )}
            </ActionIcon>

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" aria-label="User menu">
                  <IconUser size={20} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {user && (
                  <Menu.Label>{user.name || user.email}</Menu.Label>
                )}
                <Menu.Item
                  leftSection={<IconSettings style={{ width: '14px', height: '14px' }} />}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout style={{ width: '14px', height: '14px' }} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </SafeAppShell.Header>

      <SafeAppShell.Navbar p="md">
        <RPGWorldNavbar />
      </SafeAppShell.Navbar>

      <SafeAppShell.Main>
        <Outlet />
      </SafeAppShell.Main>
    </SafeAppShell>
  );
}
