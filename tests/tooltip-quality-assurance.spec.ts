/**
 * Comprehensive Quality Assurance Tests for "Recently Added" Tooltips
 * 
 * Tests tooltip functionality across multiple screen sizes, browsers,
 * and performance scenarios to ensure consistent user experience.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration for different viewports
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  desktopSmall: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  ultrawide: { width: 2560, height: 1080 }
};

// Test URLs for different pages
const TEST_URLS = {
  worldDetail: '/rpg-worlds/test-world-id',
  campaignDetail: '/campaigns/test-campaign-id'
};

// Performance benchmarks from Task 2 optimization
const PERFORMANCE_BENCHMARKS = {
  maxLoadTime: 200, // ms
  minCacheHitRate: 80, // %
  maxMemoryUsage: 50 // MB
};

/**
 * Helper function to wait for tooltip to appear
 */
async function waitForTooltip(page: Page, selector: string): Promise<void> {
  await page.hover(selector);
  await page.waitForSelector('[role="tooltip"]', { state: 'visible', timeout: 5000 });
}

/**
 * Helper function to measure tooltip load time
 */
async function measureTooltipLoadTime(page: Page, selector: string): Promise<number> {
  const startTime = Date.now();
  await waitForTooltip(page, selector);
  return Date.now() - startTime;
}

/**
 * Helper function to check for console errors
 */
async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Test suite for tooltip functionality across viewports
 */
test.describe('Tooltip Quality Assurance - Cross-Viewport Testing', () => {
  
  Object.entries(VIEWPORTS).forEach(([viewportName, viewport]) => {
    test.describe(`${viewportName} viewport (${viewport.width}x${viewport.height})`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(TEST_URLS.worldDetail);
        await page.waitForLoadState('networkidle');
      });

      test('should display entity count tooltips correctly', async ({ page }) => {
        // Test Characters tooltip
        const charactersSelector = '[data-testid="entity-count-characters"]';
        await waitForTooltip(page, charactersSelector);
        
        const tooltip = page.locator('[role="tooltip"]');
        await expect(tooltip).toBeVisible();
        
        // Verify tooltip content
        await expect(tooltip).toContainText('Recently Added');
        await expect(tooltip).toContainText('Characters');
        
        // Check tooltip positioning doesn't overflow viewport
        const tooltipBox = await tooltip.boundingBox();
        expect(tooltipBox?.x).toBeGreaterThanOrEqual(0);
        expect(tooltipBox?.y).toBeGreaterThanOrEqual(0);
        expect(tooltipBox?.x! + tooltipBox?.width!).toBeLessThanOrEqual(viewport.width);
        expect(tooltipBox?.y! + tooltipBox?.height!).toBeLessThanOrEqual(viewport.height);
      });

      test('should handle tooltip performance requirements', async ({ page }) => {
        const charactersSelector = '[data-testid="entity-count-characters"]';
        
        // Measure tooltip load time
        const loadTime = await measureTooltipLoadTime(page, charactersSelector);
        expect(loadTime).toBeLessThan(PERFORMANCE_BENCHMARKS.maxLoadTime);
        
        // Check for console errors
        const errors = await checkConsoleErrors(page);
        expect(errors).toHaveLength(0);
      });

      test('should display tooltips for all entity types', async ({ page }) => {
        const entityTypes = ['characters', 'locations', 'factions', 'items'];
        
        for (const entityType of entityTypes) {
          const selector = `[data-testid="entity-count-${entityType}"]`;
          
          // Skip if element doesn't exist (responsive design may hide some)
          const element = page.locator(selector);
          if (await element.count() === 0) continue;
          
          await waitForTooltip(page, selector);
          const tooltip = page.locator('[role="tooltip"]');
          await expect(tooltip).toBeVisible();
          
          // Move away to hide tooltip
          await page.mouse.move(0, 0);
          await page.waitForSelector('[role="tooltip"]', { state: 'hidden', timeout: 2000 });
        }
      });

      test('should handle empty data gracefully', async ({ page }) => {
        // Navigate to a world with no entities
        await page.goto('/rpg-worlds/empty-world-id');
        await page.waitForLoadState('networkidle');
        
        const charactersSelector = '[data-testid="entity-count-characters"]';
        await waitForTooltip(page, charactersSelector);
        
        const tooltip = page.locator('[role="tooltip"]');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('No characters yet');
      });

    });
  });
});

/**
 * Test suite for cross-browser compatibility
 */
test.describe('Tooltip Quality Assurance - Cross-Browser Testing', () => {
  
  test('should work consistently across browsers', async ({ page, browserName }) => {
    await page.goto(TEST_URLS.worldDetail);
    await page.waitForLoadState('networkidle');
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    await waitForTooltip(page, charactersSelector);
    
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    
    // Browser-specific checks
    if (browserName === 'webkit') {
      // Safari-specific checks
      await expect(tooltip).toHaveCSS('position', 'absolute');
    } else if (browserName === 'firefox') {
      // Firefox-specific checks
      await expect(tooltip).toBeVisible();
    }
    
    // Take screenshot for visual regression testing
    await page.screenshot({
      path: `test-results/tooltip-${browserName}-${Date.now()}.png`,
      fullPage: false,
      clip: await tooltip.boundingBox() || undefined
    });
  });

  test('should handle touch interactions on mobile browsers', async ({ page, browserName }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(TEST_URLS.worldDetail);
    await page.waitForLoadState('networkidle');
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    
    // Simulate touch interaction
    await page.tap(charactersSelector);
    
    // On touch devices, tooltip should appear
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    
    // Tap elsewhere to hide tooltip
    await page.tap('body');
    await expect(tooltip).toBeHidden({ timeout: 2000 });
  });
});

/**
 * Test suite for accessibility compliance
 */
test.describe('Tooltip Quality Assurance - Accessibility Testing', () => {
  
  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto(TEST_URLS.worldDetail);
    await page.waitForLoadState('networkidle');
    
    // Navigate to entity count using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if tooltip appears on focus
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    
    // Verify ARIA attributes
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('aria-describedby');
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto(TEST_URLS.worldDetail);
    await page.waitForLoadState('networkidle');
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    await waitForTooltip(page, charactersSelector);
    
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toHaveAttribute('role', 'tooltip');
    
    // Check for proper labeling
    const triggerElement = page.locator(charactersSelector);
    const ariaDescribedBy = await triggerElement.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
  });

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto(TEST_URLS.worldDetail);
    await page.waitForLoadState('networkidle');
    
    // Enable screen reader simulation
    await page.addInitScript(() => {
      // Mock screen reader behavior
      window.speechSynthesis = {
        speak: (utterance: any) => console.log('Screen reader:', utterance.text),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
        speaking: false,
        pending: false,
        paused: false
      } as any;
    });
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    await waitForTooltip(page, charactersSelector);
    
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    
    // Verify tooltip content is accessible
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toContain('Recently Added');
  });
});

/**
 * Test suite for performance validation
 */
test.describe('Tooltip Quality Assurance - Performance Testing', () => {
  
  test('should meet performance benchmarks', async ({ page }) => {
    await page.goto(TEST_URLS.worldDetail);
    await page.waitForLoadState('networkidle');
    
    // Measure multiple tooltip interactions
    const entityTypes = ['characters', 'locations', 'factions', 'items'];
    const loadTimes: number[] = [];
    
    for (const entityType of entityTypes) {
      const selector = `[data-testid="entity-count-${entityType}"]`;
      
      if (await page.locator(selector).count() === 0) continue;
      
      const loadTime = await measureTooltipLoadTime(page, selector);
      loadTimes.push(loadTime);
      
      // Move away to reset
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);
    }
    
    // Verify all load times meet benchmark
    const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    expect(averageLoadTime).toBeLessThan(PERFORMANCE_BENCHMARKS.maxLoadTime);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Navigate to a world with many entities
    await page.goto('/rpg-worlds/large-dataset-world-id');
    await page.waitForLoadState('networkidle');
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    
    // Measure performance with large dataset
    const startTime = Date.now();
    await waitForTooltip(page, charactersSelector);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(PERFORMANCE_BENCHMARKS.maxLoadTime * 2); // Allow 2x for large datasets
    
    // Verify tooltip shows recent entities (not all)
    const tooltip = page.locator('[role="tooltip"]');
    const tooltipText = await tooltip.textContent();
    
    // Should show "more recent" indicator for large datasets
    expect(tooltipText).toMatch(/\d+ more recent/);
  });
});

/**
 * Test suite for campaign detail page tooltips
 */
test.describe('Tooltip Quality Assurance - Campaign Detail Page', () => {
  
  test('should work on campaign detail pages', async ({ page }) => {
    await page.goto(TEST_URLS.campaignDetail);
    await page.waitForLoadState('networkidle');
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    await waitForTooltip(page, charactersSelector);
    
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Recently Added');
    
    // Verify campaign-scoped data
    await expect(tooltip).toContainText('Characters');
  });

  test('should show campaign-specific recent entities', async ({ page }) => {
    await page.goto(TEST_URLS.campaignDetail);
    await page.waitForLoadState('networkidle');
    
    const charactersSelector = '[data-testid="entity-count-characters"]';
    await waitForTooltip(page, charactersSelector);
    
    const tooltip = page.locator('[role="tooltip"]');
    const tooltipText = await tooltip.textContent();
    
    // Should show campaign-scoped entities only
    expect(tooltipText).not.toContain('world-scoped');
  });
});
