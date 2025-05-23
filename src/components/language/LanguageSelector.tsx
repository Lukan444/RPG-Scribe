import React, { useState, useEffect } from 'react';
import { Select, Group, Text, Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  supportedLanguages,
  getCurrentLanguage,
  changeLanguage,
  type SupportedLanguage
} from '../../i18n/config';

interface LanguageSelectorProps {
  compact?: boolean;
  onChange?: (language: string) => void;
}

/**
 * Language selector component that allows users to change the application language
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  onChange,
}) => {
  const { t } = useTranslation(['ui', 'common']);
  const [language, setLanguage] = useState<string>(getCurrentLanguage());

  // Update local state when i18n language changes
  useEffect(() => {
    const currentLang = getCurrentLanguage();
    setLanguage(currentLang);
  }, []);

  // Create data for the Select component
  const data = supportedLanguages.map(lang => ({
    value: lang.code,
    label: compact ? lang.nativeName : `${lang.nativeName} (${lang.name})`,
  }));

  const handleLanguageChange = async (value: string | null) => {
    if (value && value !== language) {
      try {
        setLanguage(value);
        await changeLanguage(value as SupportedLanguage);

        if (onChange) {
          onChange(value);
        }
      } catch (error) {
        console.error('Failed to change language:', error);
        // Revert local state on error
        setLanguage(getCurrentLanguage());
      }
    }
  };

  return (
    <Box>
      {!compact && (
        <Text size="sm" fw={500} mb={5}>
          {t('settings.language.uiLanguage')}
        </Text>
      )}
      <Select
        data={data}
        value={language}
        onChange={handleLanguageChange}
        size={compact ? 'xs' : 'sm'}
        clearable={false}
        aria-label={t('settings.language.uiLanguage')}
      />
    </Box>
  );
};

export default LanguageSelector;