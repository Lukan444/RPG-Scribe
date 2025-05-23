import React, { useCallback, useRef } from 'react';
import { Select, Group, Text, Stack } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  supportedLanguages,
  changeLanguage,
  getCurrentLanguage,
  SupportedLanguage
} from '../../i18n/config';

interface LanguageSelectorProps {
  variant?: 'full' | 'compact';
  label?: string;
  description?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'full',
  label,
  description
}) => {
  const { t } = useTranslation(['ui', 'common']);
  const currentLanguage = getCurrentLanguage();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Prepare select options
  const languageOptions = supportedLanguages.map(lang => ({
    value: lang.code,
    label: `${lang.nativeName} (${lang.name})`
  }));

  // Debounced language change to prevent rapid successive changes
  const debouncedLanguageChange = useCallback(async (value: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await changeLanguage(value as SupportedLanguage);
        console.log(`Language changed to: ${value}`);
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    }, 300); // 300ms debounce delay
  }, []);

  // Handle language change
  const handleLanguageChange = async (value: string | null) => {
    if (value && value !== currentLanguage) {
      await debouncedLanguageChange(value);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Compact variant for header/toolbar
  if (variant === 'compact') {
    return (
      <Select
        value={currentLanguage}
        onChange={handleLanguageChange}
        data={languageOptions}
        leftSection={<IconLanguage size={16} />}
        placeholder={t('settings.language.uiLanguage')}
        size="sm"
        style={{ minWidth: 150 }}
        comboboxProps={{
          withinPortal: true,
          transitionProps: { duration: 200 },
          dropdownPadding: 8,
          offset: 5,
          position: 'bottom-start',
          middlewares: {
            flip: true,
            shift: true
          }
        }}
        searchable={false}
        clearable={false}
      />
    );
  }

  // Full variant for settings page
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <IconLanguage size={20} />
        <Text fw={500} size="sm">
          {label || t('settings.language.uiLanguage')}
        </Text>
      </Group>

      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}

      <Select
        value={currentLanguage}
        onChange={handleLanguageChange}
        data={languageOptions}
        placeholder={t('settings.language.uiLanguage')}
        description={t('settings.language.uiDescription')}
        comboboxProps={{
          withinPortal: true,
          transitionProps: { duration: 200 },
          dropdownPadding: 8,
          offset: 5
        }}
        searchable={false}
        clearable={false}
      />
    </Stack>
  );
};

// Hook for using language selector functionality
export const useLanguageSelector = () => {
  const { t } = useTranslation(['ui', 'common']);
  const currentLanguage = getCurrentLanguage();

  const getLanguageDisplayName = (code: SupportedLanguage) => {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? `${language.nativeName} (${language.name})` : code;
  };

  const getCurrentLanguageDisplayName = () => {
    return getLanguageDisplayName(currentLanguage);
  };

  return {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    getLanguageDisplayName,
    getCurrentLanguageDisplayName,
    t
  };
};

export default LanguageSelector;
