/**
 * Global Setup for Tooltip Quality Assurance Tests
 * 
 * Prepares test data and environment for comprehensive tooltip testing
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up Tooltip Quality Assurance test environment...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Setup test data via API or UI interactions
    await setupTestData(page);
    
    // Verify test environment is ready
    await verifyTestEnvironment(page);
    
    console.log('✅ Test environment setup completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Setup test data for tooltip testing
 */
async function setupTestData(page: any) {
  console.log('📊 Setting up test data...');
  
  // Create test world with various entity counts
  await createTestWorld(page, {
    id: 'test-world-id',
    name: 'Tooltip Test World',
    characterCount: 15,
    locationCount: 8,
    factionCount: 5,
    itemCount: 12
  });
  
  // Create empty test world
  await createTestWorld(page, {
    id: 'empty-world-id',
    name: 'Empty Test World',
    characterCount: 0,
    locationCount: 0,
    factionCount: 0,
    itemCount: 0
  });
  
  // Create large dataset test world
  await createTestWorld(page, {
    id: 'large-dataset-world-id',
    name: 'Large Dataset Test World',
    characterCount: 150,
    locationCount: 80,
    factionCount: 45,
    itemCount: 200
  });
  
  // Create test campaign
  await createTestCampaign(page, {
    id: 'test-campaign-id',
    worldId: 'test-world-id',
    name: 'Tooltip Test Campaign',
    characterCount: 8,
    locationCount: 4,
    factionCount: 2,
    itemCount: 6
  });
  
  console.log('✅ Test data setup completed');
}

/**
 * Create test world with specified entity counts
 */
async function createTestWorld(page: any, worldData: any) {
  // This would typically interact with your API or database
  // For now, we'll use localStorage to mock the data
  
  await page.evaluate((data) => {
    const worlds = JSON.parse(localStorage.getItem('test-worlds') || '[]');
    
    // Remove existing world with same ID
    const filteredWorlds = worlds.filter((w: any) => w.id !== data.id);
    
    // Add new world data
    filteredWorlds.push({
      id: data.id,
      name: data.name,
      characterCount: data.characterCount,
      locationCount: data.locationCount,
      factionCount: data.factionCount,
      itemCount: data.itemCount,
      createdAt: new Date().toISOString(),
      // Generate recent entities for tooltip testing
      recentCharacters: generateRecentEntities('character', data.characterCount),
      recentLocations: generateRecentEntities('location', data.locationCount),
      recentFactions: generateRecentEntities('faction', data.factionCount),
      recentItems: generateRecentEntities('item', data.itemCount)
    });
    
    localStorage.setItem('test-worlds', JSON.stringify(filteredWorlds));
    
    function generateRecentEntities(type: string, count: number) {
      const entities = [];
      const now = Date.now();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        entities.push({
          id: `${type}-${i + 1}`,
          name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
          createdAt: new Date(now - (i * 24 * 60 * 60 * 1000)).toISOString(), // Spread over days
          type: type === 'character' ? (i % 2 === 0 ? 'PC' : 'NPC') : undefined
        });
      }
      
      return entities;
    }
  }, worldData);
}

/**
 * Create test campaign with specified entity counts
 */
async function createTestCampaign(page: any, campaignData: any) {
  await page.evaluate((data) => {
    const campaigns = JSON.parse(localStorage.getItem('test-campaigns') || '[]');
    
    // Remove existing campaign with same ID
    const filteredCampaigns = campaigns.filter((c: any) => c.id !== data.id);
    
    // Add new campaign data
    filteredCampaigns.push({
      id: data.id,
      worldId: data.worldId,
      name: data.name,
      characterCount: data.characterCount,
      locationCount: data.locationCount,
      factionCount: data.factionCount,
      itemCount: data.itemCount,
      createdAt: new Date().toISOString(),
      // Generate campaign-scoped recent entities
      recentCharacters: generateRecentEntities('character', data.characterCount),
      recentLocations: generateRecentEntities('location', data.locationCount),
      recentFactions: generateRecentEntities('faction', data.factionCount),
      recentItems: generateRecentEntities('item', data.itemCount)
    });
    
    localStorage.setItem('test-campaigns', JSON.stringify(filteredCampaigns));
    
    function generateRecentEntities(type: string, count: number) {
      const entities = [];
      const now = Date.now();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        entities.push({
          id: `campaign-${type}-${i + 1}`,
          name: `Campaign ${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
          createdAt: new Date(now - (i * 12 * 60 * 60 * 1000)).toISOString(), // Spread over hours
          type: type === 'character' ? (i % 2 === 0 ? 'PC' : 'NPC') : undefined
        });
      }
      
      return entities;
    }
  }, campaignData);
}

/**
 * Verify test environment is ready
 */
async function verifyTestEnvironment(page: any) {
  console.log('🔍 Verifying test environment...');
  
  // Check if React app is loaded
  const reactRoot = await page.locator('#root').count();
  if (reactRoot === 0) {
    throw new Error('React application not loaded');
  }
  
  // Check if test data is available
  const testWorlds = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('test-worlds') || '[]');
  });
  
  if (testWorlds.length === 0) {
    throw new Error('Test worlds not created');
  }
  
  // Verify tooltip components are available
  await page.goto('/rpg-worlds/test-world-id');
  await page.waitForLoadState('networkidle');
  
  const entityCountElements = await page.locator('[data-testid^="entity-count-"]').count();
  if (entityCountElements === 0) {
    console.warn('⚠️ Entity count elements not found - may affect tooltip tests');
  }
  
  console.log('✅ Test environment verification completed');
}

/**
 * Performance monitoring setup
 */
async function setupPerformanceMonitoring(page: any) {
  // Enable performance monitoring
  await page.addInitScript(() => {
    // Track tooltip performance metrics
    window.tooltipMetrics = {
      loadTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: []
    };
    
    // Override console methods to capture metrics
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string') {
        if (args[0].includes('cache hit')) {
          window.tooltipMetrics.cacheHits++;
        } else if (args[0].includes('cache miss')) {
          window.tooltipMetrics.cacheMisses++;
        }
      }
      originalLog.apply(console, args);
    };
    
    // Track errors
    window.addEventListener('error', (event) => {
      window.tooltipMetrics.errors.push({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        timestamp: Date.now()
      });
    });
  });
}

export default globalSetup;
