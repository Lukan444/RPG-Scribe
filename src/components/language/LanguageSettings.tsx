import React from 'react';
import { Card, Title, Text, Stack, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
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

  const languageOptions = availableLanguages.map(lang => ({
    value: lang.code,
    label: `${lang.nativeName} (${lang.name})`
  }));

  return (
    <Card withBorder p="lg">
      <Title order={3} mb="md">{t('ui:settings.language.title')}</Title>
      <Text mb="lg">{t('ui:settings.language.description')}</Text>

      <Stack gap="lg">
        {/* Interface Language */}
        <div>
          <Text fw={500} mb={5}>{t('ui:settings.language.uiLanguage')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('ui:settings.language.uiDescription')}</Text>
          <LanguageSelector variant="full" />
        </div>

        {/* Transcription Language */}
        <div>
          <Text fw={500} mb={5}>{t('ui:settings.language.transcription')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('ui:settings.language.transcriptionDescription')}</Text>
          <Select
            data={languageOptions}
            value={transcriptionLanguage}
            onChange={(value) => value && setTranscriptionLanguage(value as any)}
            clearable={false}
          />
        </div>

        {/* AI Language */}
        <div>
          <Text fw={500} mb={5}>{t('ui:settings.language.ai')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('ui:settings.language.aiDescription')}</Text>
          <Select
            data={languageOptions}
            value={aiLanguage}
            onChange={(value) => value && setAiLanguage(value as any)}
            clearable={false}
          />
        </div>
      </Stack>
    </Card>
  );
};

export default LanguageSettings;