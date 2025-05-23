import i18n from '../i18n/config';

/**
 * Test function to verify that critical translation keys are working
 */
export const testTranslations = () => {
  const criticalKeys = [
    // Navigation keys
    'navigation.dashboard',
    'navigation.entityManager',
    'navigation.characters',
    'navigation.settings',
    
    // Dashboard keys
    'dashboard.tabs.all',
    'dashboard.tabs.characters',
    'dashboard.tabs.world',
    'dashboard.tabs.narrative',
    'dashboard.entities.characters',
    'dashboard.entities.locations',
    
    // Pages keys
    'pages.characters.title',
    'pages.characters.errorLoadingCharacters',
    'pages.worlds.backToWorld',
    
    // Tables and UI keys
    'tables.headers.name',
    'tables.headers.type',
    'viewModes.table',
    'viewModes.grid',
    'tooltips.playerCharacters',
    'tooltips.totalCharacters',
    
    // Buttons and common keys
    'buttons.save',
    'buttons.edit',
    'buttons.delete',
    
    // Settings keys
    'settings.language.uiLanguage',
    'notifications.success.saved'
  ];

  const results = {
    working: [] as string[],
    missing: [] as string[],
    total: criticalKeys.length
  };

  criticalKeys.forEach(key => {
    const translation = i18n.t(key);
    if (translation === key) {
      // Translation key not found - returns the key itself
      results.missing.push(key);
      console.warn(`❌ Missing translation: ${key}`);
    } else {
      results.working.push(key);
      console.log(`✅ Working translation: ${key} = "${translation}"`);
    }
  });

  console.log('\n📊 Translation Test Results:');
  console.log(`✅ Working: ${results.working.length}/${results.total}`);
  console.log(`❌ Missing: ${results.missing.length}/${results.total}`);
  console.log(`📈 Coverage: ${Math.round((results.working.length / results.total) * 100)}%`);

  if (results.missing.length === 0) {
    console.log('🎉 All critical translation keys are working!');
  } else {
    console.log('⚠️ Some translation keys are still missing:', results.missing);
  }

  return results;
};

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  // Run test after i18n is initialized
  setTimeout(() => {
    if (i18n.isInitialized) {
      testTranslations();
    }
  }, 2000);
}
