import React, { useState } from 'react';
import { Card, Title, Text, Stack, Select, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../settings/LanguageSelector';

// Mock data for transcription and AI languages
// In a real implementation, these would come from your backend or configuration
const TRANSCRIPTION_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const AI_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
];

/**
 * Component for language settings page
 */
export const LanguageSettings: React.FC = () => {
  const { t } = useTranslation(['ui', 'common']);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en');
  const [aiLanguage, setAiLanguage] = useState('en');

  const handleSave = () => {
    // In a real implementation, this would save the settings to your backend
    console.log('Saving language settings:', {
      transcriptionLanguage,
      aiLanguage,
    });

    // You would typically show a success notification here
  };

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
            data={TRANSCRIPTION_LANGUAGES}
            value={transcriptionLanguage}
            onChange={(value) => value && setTranscriptionLanguage(value)}
            clearable={false}
          />
        </div>

        {/* AI Language */}
        <div>
          <Text fw={500} mb={5}>{t('ui:settings.language.ai')}</Text>
          <Text size="sm" color="dimmed" mb="xs">{t('ui:settings.language.aiDescription')}</Text>
          <Select
            data={AI_LANGUAGES}
            value={aiLanguage}
            onChange={(value) => value && setAiLanguage(value)}
            clearable={false}
          />
        </div>

        <Group justify="flex-end">
          <Button onClick={handleSave}>{t('actions.save', { ns: 'common' })}</Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default LanguageSettings;