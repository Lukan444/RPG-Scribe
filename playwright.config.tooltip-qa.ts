/**
 * Playwright Configuration for Tooltip Quality Assurance Testing
 * 
 * Optimized configuration for cross-browser and cross-viewport testing
 * of "Recently Added" tooltips with performance monitoring.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Test file pattern
  testMatch: '**/tooltip-quality-assurance.spec.ts',
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/tooltip-qa-report' }],
    ['json', { outputFile: 'test-results/tooltip-qa-results.json' }],
    ['junit', { outputFile: 'test-results/tooltip-qa-junit.xml' }],
    ['list']
  ],
  
  // Global test setup
  globalSetup: './tests/setup/global-setup.ts',
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Default navigation timeout
    navigationTimeout: 15000,
    
    // Default action timeout
    actionTimeout: 10000
  },

  // Configure projects for major browsers and viewports
  projects: [
    // Desktop Chrome - Primary testing browser
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Desktop Firefox
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Desktop Safari (WebKit)
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Desktop Edge
    {
      name: 'Desktop Edge',
      use: { 
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Smaller desktop resolution
    {
      name: 'Desktop Small',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },
    
    // Tablet landscape
    {
      name: 'Tablet Landscape',
      use: { 
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 }
      },
    },
    
    // Tablet portrait
    {
      name: 'Tablet Portrait',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }
      },
    },
    
    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 }
      },
    },
    
    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
    },
    
    // Ultra-wide desktop
    {
      name: 'Ultra-wide Desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1080 }
      },
    },
    
    // Accessibility testing with specific settings
    {
      name: 'Accessibility Testing',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Enable high contrast mode simulation
        colorScheme: 'dark',
        // Reduce motion for accessibility testing
        reducedMotion: 'reduce'
      },
    },
    
    // Performance testing configuration
    {
      name: 'Performance Testing',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Enable performance monitoring
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-memory-info',
            '--js-flags=--expose-gc'
          ]
        }
      },
    }
  ],

  // Development server configuration
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  
  // Output directory for test artifacts
  outputDir: 'test-results/tooltip-qa-artifacts',
  
  // Test metadata
  metadata: {
    testSuite: 'Tooltip Quality Assurance',
    version: '1.0.0',
    description: 'Comprehensive testing of Recently Added tooltips across browsers and viewports',
    tags: ['tooltips', 'cross-browser', 'responsive', 'accessibility', 'performance']
  }
});
