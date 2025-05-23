import { useTranslation as useI18nTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage as i18nChangeLanguage, getCurrentLanguage } from '../i18n/config';

/**
 * Custom hook that extends the useTranslation hook from react-i18next
 * with additional functionality specific to RPG Scribe.
 */
export const useTranslation = (namespace?: string | string[]) => {
  // Use the original useTranslation hook
  const { t, i18n, ready } = useI18nTranslation(namespace);

  /**
   * Change the application language
   * @param language - The language code to change to
   * @returns A promise that resolves when the language change is complete
   */
  const changeLanguage = async (language: string) => {
    const isSupported = supportedLanguages.some(lang => lang.code === language);
    if (isSupported) {
      return i18nChangeLanguage(language as any);
    }
    console.warn(`Language ${language} is not supported.`);
    return Promise.reject(new Error(`Language ${language} is not supported.`));
  };

  /**
   * Get the current language
   * @returns The current language code
   */
  const getCurrentLanguageHook = () => {
    return getCurrentLanguage();
  };

  /**
   * Get all available languages
   * @returns An array containing all available languages
   */
  const getAvailableLanguages = () => {
    return supportedLanguages;
  };

  return {
    t,
    i18n,
    ready,
    changeLanguage,
    getCurrentLanguage: getCurrentLanguageHook,
    getAvailableLanguages,
  };
};

export default useTranslation;