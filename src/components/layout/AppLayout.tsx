'use client';

import { Burger, Group, Title, useMantineTheme, ActionIcon, Tooltip, Image } from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { SafeAppShell } from '../common/SafeAppShell';
import SimpleNavbar from './SimpleNavbar';
import UserMenu from './UserMenu';
import { AIGlobalSearchBar } from '../search/AIGlobalSearchBar';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AppLayout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [navbarCollapsed, setNavbarCollapsed] = useLocalStorage({
    key: 'navbar-collapsed',
    defaultValue: false,
  });
  const theme = useMantineTheme();
  const { t } = useTranslation(['ui', 'common']);

  const toggleNavbar = () => {
    setNavbarCollapsed(!navbarCollapsed);
  };

  return (
    <SafeAppShell
      header={{ height: 60 }}
      navbar={{
        width: navbarCollapsed ? 60 : 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      styles={{
        main: {
          background: theme.colors.dark[9],
          transition: 'padding-left 0.3s ease',
        },
        navbar: {
          backgroundColor: theme.colors.dark[6],
          // Add scrollbar styling for better mobile experience
          overflow: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.colors.dark[4]} ${theme.colors.dark[7]}`,
          // Custom properties for scrollbar styling
          '--scrollbar-width': '6px',
          '--scrollbar-track-background': theme.colors.dark[7],
          '--scrollbar-thumb-background': theme.colors.dark[4],
          '--scrollbar-thumb-radius': '3px',
          transition: 'width 0.3s ease',
        },
      }}
    >
      <SafeAppShell.Header>
        <Group h="100%" px="md" justify="space-between" gap="md">
          <Group gap="md">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              color={theme.colors.gray[5]}
            />
            <Group gap="xs">
              <Image
                src="/logo.png"
                alt="RPG Scribe Logo"
                style={{
                  height: 'clamp(30px, 2.5rem, 36px)',
                  width: 'auto',
                  objectFit: 'contain',
                  maxWidth: '100%'
                }}
              />
              <Title
                order={3}
                visibleFrom="sm"
                style={{
                  color: theme.white,
                  fontSize: 'clamp(1rem, 1.5vw, 1.25rem)'
                }}
              >
                RPG Scribe
              </Title>
            </Group>
          </Group>

          {/* AI Global Search Bar */}
          <AIGlobalSearchBar />

          <UserMenu />
        </Group>
      </SafeAppShell.Header>

      <SafeAppShell.Navbar p={navbarCollapsed ? 'xs' : 'md'}>
        <SimpleNavbar collapsed={navbarCollapsed} />

        <Tooltip
          label={navbarCollapsed ? t('navigation.expandMenu') : t('navigation.collapseMenu')}
          position="right"
          withArrow
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={toggleNavbar}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: navbarCollapsed ? '10px' : '20px',
              zIndex: 10,
            }}
          >
            {navbarCollapsed ? (
              <IconChevronRight size={18} />
            ) : (
              <IconChevronLeft size={18} />
            )}
          </ActionIcon>
        </Tooltip>
      </SafeAppShell.Navbar>

      <SafeAppShell.Main>
        <Outlet />
      </SafeAppShell.Main>
    </SafeAppShell>
  );
}

export default AppLayout;
