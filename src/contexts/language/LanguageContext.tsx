import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../../i18n/config';

interface LanguageContextType {
  interfaceLanguage: string;
  transcriptionLanguage: string;
  aiLanguage: string;
  setInterfaceLanguage: (language: string) => void;
  setTranscriptionLanguage: (language: string) => void;
  setAiLanguage: (language: string) => void;
  availableLanguages: typeof supportedLanguages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [interfaceLanguage, setInterfaceLanguage] = useState(() => {
    // Initialize from localStorage or i18n current language
    const savedLanguage = localStorage.getItem('rpg-scribe-language');
    return savedLanguage || i18n.language || 'en';
  });
  const [transcriptionLanguage, setTranscriptionLanguage] = useState(
    localStorage.getItem('rpg-scribe-transcription-language') || interfaceLanguage
  );
  const [aiLanguage, setAiLanguage] = useState(
    localStorage.getItem('rpg-scribe-ai-language') || interfaceLanguage
  );

  // Initialize language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('rpg-scribe-language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      console.log(`[LanguageProvider] Initializing language to: ${savedLanguage}`);
      i18n.changeLanguage(savedLanguage);
    } else if (!savedLanguage) {
      // If no saved language, save the current i18n language
      console.log(`[LanguageProvider] No saved language, using: ${i18n.language}`);
      localStorage.setItem('rpg-scribe-language', i18n.language);
      setInterfaceLanguage(i18n.language);
    }
  }, [i18n]);

  // Update interface language when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setInterfaceLanguage(lng);
      // Save interface language to localStorage when it changes
      localStorage.setItem('rpg-scribe-language', lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Save transcription language to localStorage
  useEffect(() => {
    localStorage.setItem('rpg-scribe-transcription-language', transcriptionLanguage);
  }, [transcriptionLanguage]);

  // Save AI language to localStorage
  useEffect(() => {
    localStorage.setItem('rpg-scribe-ai-language', aiLanguage);
  }, [aiLanguage]);

  const value = {
    interfaceLanguage,
    transcriptionLanguage,
    aiLanguage,
    setInterfaceLanguage: (language: string) => {
      i18n.changeLanguage(language);
    },
    setTranscriptionLanguage,
    setAiLanguage,
    availableLanguages: supportedLanguages,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;