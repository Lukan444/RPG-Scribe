import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enCommon from './locales/en/common.json';
import enEntities from './locales/en/entities.json';
import enUI from './locales/en/ui.json';

import plCommon from './locales/pl/common.json';
import plEntities from './locales/pl/entities.json';
import plUI from './locales/pl/ui.json';

// Define supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' }
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

// Define namespaces
export const namespaces = ['common', 'entities', 'ui'] as const;
export type Namespace = typeof namespaces[number];

// Translation resources
const resources = {
  en: {
    common: enCommon,
    entities: enEntities,
    ui: enUI
  },
  pl: {
    common: plCommon,
    entities: plEntities,
    ui: plUI
  }
};

// Initialize i18next
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language settings
    lng: 'en', // Default language
    fallbackLng: 'en',
    supportedLngs: supportedLanguages.map(lang => lang.code),

    // Namespace settings
    defaultNS: 'common',
    ns: namespaces,

    // Resources
    resources,

    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'rpg-scribe-language'
    },

    // Interpolation options
    interpolation: {
      escapeValue: false // React already escapes values
    },

    // React options
    react: {
      useSuspense: false // Disable suspense for better error handling
    },

    // Development options
    debug: process.env.NODE_ENV === 'development',

    // Backend options (for loading translations from server)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/{{lng}}/{{ns}}.json'
    },

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',

    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    }
  });

// Export configured i18n instance
export default i18n;

// Helper functions
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
  localStorage.setItem('rpg-scribe-language', language);
};

export const getLanguageName = (code: SupportedLanguage): string => {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language?.name || code;
};

export const getNativeLanguageName = (code: SupportedLanguage): string => {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language?.nativeName || code;
};

// Type-safe translation function
export const t = (key: string, options?: any) => i18n.t(key, options);

// Language validation
export const isValidLanguage = (code: string): code is SupportedLanguage => {
  return supportedLanguages.some(lang => lang.code === code);
};

// Get browser language with fallback
export const getBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0];
  return isValidLanguage(browserLang) ? browserLang : 'en';
};

// Initialize language from user preference or browser
export const initializeLanguage = (): void => {
  const savedLanguage = localStorage.getItem('rpg-scribe-language');

  if (savedLanguage && isValidLanguage(savedLanguage)) {
    i18n.changeLanguage(savedLanguage);
  } else {
    const browserLanguage = getBrowserLanguage();
    i18n.changeLanguage(browserLanguage);
    localStorage.setItem('rpg-scribe-language', browserLanguage);
  }
};
