/**
 * Test-specific i18n configuration
 * Loads translations synchronously for testing
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files directly
import enCommon from '../../../public/locales/en/common.json';
import enEntities from '../../../public/locales/en/entities.json';
import enTimeline from '../../../public/locales/en/timeline.json';
import enUI from '../../../public/locales/en/ui.json';

// Create test i18n instance
const testI18n = i18n.createInstance();

testI18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    
    // Load resources directly
    resources: {
      en: {
        common: enCommon,
        entities: enEntities,
        timeline: enTimeline,
        ui: enUI
      }
    },
    
    defaultNS: 'ui',
    ns: ['common', 'entities', 'timeline', 'ui'],
    
    interpolation: {
      escapeValue: false
    },
    
    react: {
      useSuspense: false
    }
  });

export default testI18n;
