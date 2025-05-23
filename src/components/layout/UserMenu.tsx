'use client';


import { useNavigate } from 'react-router-dom';
import {
  Menu,
  UnstyledButton,
  Group,
  Avatar,
  Text,
  rem,
  useMantineTheme
} from '@mantine/core';
import {
  IconChevronDown,
  IconLogout,
  IconSettings,
  IconUser,
  IconLanguage
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../settings/LanguageSelector';
import { useTranslation } from 'react-i18next';

function UserMenu() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation(['ui', 'common']);


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: 'pop-top-right' }}

      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            color: theme.white,
            borderRadius: theme.radius.sm,
          }}
        >
          <Group gap={7}>
            <Avatar
              src={user.photoURL}
              alt={user.name || 'User'}
              radius="xl"
              size={30}
              color="teal"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Text fw={500} size="sm" lh={1} mr={3}>
              {user.name || user.email || 'User'}
            </Text>
            <IconChevronDown style={{ width: '12px', height: '12px' }} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            <IconUser style={{ width: '16px', height: '16px' }} stroke={1.5} />
          }
          onClick={() => navigate('/profile')}
        >
          {t('profile', { ns: 'common' })}
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconSettings style={{ width: '16px', height: '16px' }} stroke={1.5} />
          }
          onClick={() => navigate('/settings')}
        >
          {t('navigation.settings')}
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconLanguage style={{ width: '16px', height: '16px' }} stroke={1.5} />
          }
        >
          <LanguageSelector variant="compact" />
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={
            <IconLogout style={{ width: '16px', height: '16px' }} stroke={1.5} />
          }
          onClick={handleLogout}
        >
          {t('signOut', { ns: 'common' })}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default UserMenu;
