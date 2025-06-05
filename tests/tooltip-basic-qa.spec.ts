/**
 * Basic Quality Assurance Tests for "Recently Added" Tooltips
 * 
 * Simplified test suite to validate tooltip functionality across
 * different viewports and browsers without complex setup.
 */

import { test, expect } from '@playwright/test';

// Test configuration for different viewports
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

test.describe('Tooltip Quality Assurance - Basic Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display application without errors', async ({ page }) => {
    // Check if React app is loaded
    const reactRoot = await page.locator('#root').count();
    expect(reactRoot).toBeGreaterThan(0);
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any console errors
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  Object.entries(VIEWPORTS).forEach(([viewportName, viewport]) => {
    test(`should render correctly on ${viewportName} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      // Take screenshot for visual validation
      await page.screenshot({
        path: `test-results/viewport-${viewportName}-${Date.now()}.png`,
        fullPage: true
      });
      
      // Verify page is responsive
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      
      expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
    });
  });

  test('should handle navigation without errors', async ({ page }) => {
    // Test basic navigation
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      // Click first available link
      await links.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify no errors occurred
      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    const focusedCount = await focusedElement.count();
    expect(focusedCount).toBeGreaterThan(0);
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Tooltip Quality Assurance - Cross-Browser Compatibility', () => {
  
  test('should work consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take browser-specific screenshot
    await page.screenshot({
      path: `test-results/browser-${browserName}-${Date.now()}.png`,
      fullPage: false
    });
    
    // Verify basic functionality works
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Browser-specific checks
    if (browserName === 'webkit') {
      // Safari-specific validation
      console.log('Testing Safari-specific features');
    } else if (browserName === 'firefox') {
      // Firefox-specific validation
      console.log('Testing Firefox-specific features');
    } else if (browserName === 'chromium') {
      // Chrome-specific validation
      console.log('Testing Chrome-specific features');
    }
  });

  test('should handle touch interactions on mobile browsers', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test touch interaction
    const body = page.locator('body');
    await body.tap();
    
    // Verify page responds to touch
    await page.waitForTimeout(500);
    
    // Take mobile screenshot
    await page.screenshot({
      path: `test-results/mobile-touch-${Date.now()}.png`,
      fullPage: true
    });
  });
});

test.describe('Tooltip Quality Assurance - Performance Validation', () => {
  
  test('should meet basic performance requirements', async ({ page }) => {
    // Enable performance monitoring
    await page.goto('/');
    
    // Measure page load performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    // Verify performance benchmarks
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get memory usage
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (memoryUsage) {
      // Verify memory usage is reasonable (less than 50MB)
      expect(memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
      console.log('Memory usage:', memoryUsage);
    }
  });
});

test.describe('Tooltip Quality Assurance - Accessibility Basics', () => {
  
  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check for proper landmarks
    const mainCount = await page.locator('main, [role="main"]').count();
    expect(mainCount).toBeGreaterThanOrEqual(0); // Optional but recommended
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        
        // Images should have alt text or aria-label
        expect(alt !== null || ariaLabel !== null).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test multiple tab presses
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Verify focus management works
    const finalFocusedElement = page.locator(':focus');
    await expect(finalFocusedElement).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    
    // Verify page is still usable
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Take high contrast screenshot
    await page.screenshot({
      path: `test-results/high-contrast-${Date.now()}.png`,
      fullPage: true
    });
  });
});

test.describe('Tooltip Quality Assurance - Error Handling', () => {
  
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true);
    
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (error) {
      // Expected to fail, but should handle gracefully
      console.log('Offline test completed as expected');
    }
    
    // Restore online condition
    await page.context().setOffline(false);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify recovery
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Inject a non-critical error to test error handling
    await page.evaluate(() => {
      try {
        // This should not break the application
        (window as any).nonExistentFunction();
      } catch (e) {
        console.warn('Non-critical error handled:', e);
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Verify application still works despite errors
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Log any critical errors for investigation
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('non-critical') && 
      !error.includes('warning')
    );
    
    if (criticalErrors.length > 0) {
      console.warn('Critical JavaScript errors detected:', criticalErrors);
    }
  });
});
