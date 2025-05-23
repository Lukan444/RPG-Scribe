import React, { useState } from 'react';
import { Card, Title, Text, Stack, Select, Button, Group, Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconCheck, IconDeviceFloppy } from '@tabler/icons-react';
import { LanguageSelector } from '../settings/LanguageSelector';
import { useLanguage } from '../../contexts/language/LanguageContext';

/**
 * Component for language settings page
 */
export const LanguageSettings: React.FC = () => {
  const { t } = useTranslation(['ui', 'common']);
  const {
    transcriptionLanguage,
    setTranscriptionLanguage,
    aiLanguage,
    setAiLanguage,
    availableLanguages,
  } = useLanguage();

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const languageOptions = availableLanguages.map(lang => ({
    value: lang.code,
    label: `${lang.nativeName} (${lang.name})`
  }));

  const handleSaveSettings = () => {
    // Settings are automatically saved through the context
    // Show success message
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <Card withBorder p="lg">
      <Title order={3} mb="md">{t('settings.language.title')}</Title>
      <Text mb="lg">{t('settings.language.description')}</Text>

      <Stack gap="lg">
        {/* Interface Language */}
        <div>
          <Text fw={500} mb={5}>{t('settings.language.uiLanguage')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('settings.language.uiDescription')}</Text>
          <LanguageSelector variant="full" />
        </div>

        {/* Transcription Language */}
        <div>
          <Text fw={500} mb={5}>{t('settings.language.transcription')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('settings.language.transcriptionDescription')}</Text>
          <Select
            data={languageOptions}
            value={transcriptionLanguage}
            onChange={(value) => value && setTranscriptionLanguage(value as any)}
            clearable={false}
          />
        </div>

        {/* AI Language */}
        <div>
          <Text fw={500} mb={5}>{t('settings.language.ai')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('settings.language.aiDescription')}</Text>
          <Select
            data={languageOptions}
            value={aiLanguage}
            onChange={(value) => value && setAiLanguage(value as any)}
            clearable={false}
          />
        </div>

        {/* Save Success Alert */}
        {showSaveSuccess && (
          <Alert
            icon={<IconCheck style={{ width: '16px', height: '16px' }} />}
            title={t('notifications.success.saved')}
            color="green"
          >
            {t('settings.language.settingsSaved', 'Language settings have been saved successfully.')}
          </Alert>
        )}

        {/* Save Button */}
        <Group justify="flex-end" mt="md">
          <Button
            leftSection={<IconDeviceFloppy style={{ width: '16px', height: '16px' }} />}
            onClick={handleSaveSettings}
            variant="filled"
          >
            {t('buttons.save', { ns: 'common' })}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default LanguageSettings;