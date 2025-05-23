import React, { useState } from 'react';
import { Tabs, Container, Title, Text, Paper, Box } from '@mantine/core';
import { IconLanguage, IconPalette, IconUser, IconBell, IconBrain } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LanguageSettings } from '../../components/language';

/**
 * Settings page component
 */
const SettingsPage: React.FC = () => {
  const { t } = useTranslation(['ui', 'common']);
  const [activeTab, setActiveTab] = useState<string | null>('language');

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="md">{t('settings.title')}</Title>
      <Text color="dimmed" mb="xl">
        {t('settings.description')}
      </Text>

      <Paper withBorder p="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="language" leftSection={<IconLanguage size={16} />}>
              {t('settings.categories.language')}
            </Tabs.Tab>
            <Tabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
              {t('settings.categories.appearance')}
            </Tabs.Tab>
            <Tabs.Tab value="account" leftSection={<IconUser size={16} />}>
              {t('settings.categories.account')}
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
              {t('settings.categories.notifications')}
            </Tabs.Tab>
            <Tabs.Tab value="ai" leftSection={<IconBrain size={16} />}>
              AI Settings
            </Tabs.Tab>
          </Tabs.List>

          <Box mt="md">
            <Tabs.Panel value="language">
              <LanguageSettings />
            </Tabs.Panel>

            <Tabs.Panel value="appearance">
              <Text>Appearance settings will be implemented soon.</Text>
            </Tabs.Panel>

            <Tabs.Panel value="account">
              <Text>Account settings will be implemented soon.</Text>
            </Tabs.Panel>

            <Tabs.Panel value="notifications">
              <Text>Notification settings will be implemented soon.</Text>
            </Tabs.Panel>

            <Tabs.Panel value="ai">
              <Text>AI settings will be implemented soon.</Text>
            </Tabs.Panel>
          </Box>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default SettingsPage;