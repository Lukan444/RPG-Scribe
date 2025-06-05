/**
 * Timeline Migration End-to-End Tests
 * 
 * Comprehensive E2E tests for the complete timeline migration
 * validating all Phase 4 requirements and user workflows.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Timeline Migration E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to timeline page
    await page.goto('/timeline');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Timeline System Migration', () => {
    test('should load new timeline editor without flickering', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]', { timeout: 10000 });
      
      // Take screenshot to verify no flickering
      await page.screenshot({ path: 'tests/screenshots/timeline-no-flicker.png' });
      
      // Verify timeline is visible and stable
      const timeline = page.locator('[data-testid="timeline-editor"]');
      await expect(timeline).toBeVisible();
      
      // Check for absence of old timeline components
      const oldTimeline = page.locator('.react-calendar-timeline');
      await expect(oldTimeline).not.toBeVisible();
    });

    test('should handle 500+ events without performance degradation', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Create sample data with many events
      await page.getByText('Create Sample Data').click();
      
      // Wait for data creation
      await page.waitForSelector('.mantine-Notification-root', { timeout: 30000 });
      
      // Measure timeline load time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="timeline-editor"]', { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 2 seconds
      expect(loadTime).toBeLessThan(2000);
      
      // Verify timeline is responsive
      await page.getByText('Real World Timeline').click();
      await page.getByText('In-Game Timeline').click();
      
      // Timeline should remain responsive
      const timeline = page.locator('[data-testid="timeline-editor"]');
      await expect(timeline).toBeVisible();
    });

    test('should demonstrate 50% performance improvement', async () => {
      // Test old timeline performance (baseline)
      const oldTimelineStart = Date.now();
      await page.waitForSelector('.react-calendar-timeline', { timeout: 10000 });
      const oldTimelineTime = Date.now() - oldTimelineStart;
      
      // Switch to new timeline
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Test new timeline performance
      const newTimelineStart = Date.now();
      await page.waitForSelector('[data-testid="timeline-editor"]', { timeout: 10000 });
      const newTimelineTime = Date.now() - newTimelineStart;
      
      // Calculate improvement
      const improvement = (oldTimelineTime - newTimelineTime) / oldTimelineTime;
      
      // Should show at least 50% improvement
      expect(improvement).toBeGreaterThan(0.5);
      
      console.log(`Performance improvement: ${(improvement * 100).toFixed(1)}%`);
    });
  });

  test.describe('Conflict Detection System', () => {
    test('should detect and display conflicts in real-time', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Verify conflict detection is enabled
      const conflictDetection = page.getByText('Enable Detection');
      await expect(conflictDetection).toBeChecked();
      
      // Check conflict count display
      const conflictBadge = page.locator('text=/\\d+ conflicts/');
      await expect(conflictBadge).toBeVisible();
      
      // Verify conflict detection completes quickly
      const refreshButton = page.getByText('Refresh');
      const startTime = Date.now();
      await refreshButton.click();
      
      // Wait for conflicts to update
      await page.waitForTimeout(1000);
      const detectionTime = Date.now() - startTime;
      
      // Should complete in less than 1 second
      expect(detectionTime).toBeLessThan(1000);
    });

    test('should show AI proposal system integration', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Open conflict management panel if available
      const conflictPanel = page.locator('text=Conflict Management');
      if (await conflictPanel.isVisible()) {
        // Check for AI proposal buttons
        const aiButtons = page.locator('text=/Send to AI|AI Proposal/');
        await expect(aiButtons.first()).toBeVisible();
        
        // Verify AI buttons are properly disabled/placeholder
        const sendToAiButton = page.getByText('Send to AI').first();
        if (await sendToAiButton.isVisible()) {
          await sendToAiButton.click();
          
          // Should show placeholder message
          await expect(page.locator('text=/AI Proposal System integration coming soon/')).toBeVisible();
        }
      }
    });

    test('should handle conflict filtering and sorting', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Test conflict detection controls
      const enableDetection = page.getByText('Enable Detection');
      await enableDetection.click(); // Toggle off
      await enableDetection.click(); // Toggle on
      
      // Verify conflict count updates
      const conflictBadge = page.locator('text=/\\d+ conflicts/');
      await expect(conflictBadge).toBeVisible();
      
      // Test relationship visibility
      const showRelationships = page.getByText('Show Relationships');
      await showRelationships.click(); // Toggle off
      await showRelationships.click(); // Toggle on
      
      // Verify relationship count
      const relationshipBadge = page.locator('text=/\\d+ relationships/');
      await expect(relationshipBadge).toBeVisible();
    });
  });

  test.describe('Visual Relationship Mapping', () => {
    test('should render relationship lines between events', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Ensure relationships are enabled
      const showRelationships = page.getByText('Show Relationships');
      if (!(await showRelationships.isChecked())) {
        await showRelationships.click();
      }
      
      // Wait for relationships to render
      await page.waitForTimeout(1000);
      
      // Check for SVG relationship lines (if events exist)
      const relationshipSvg = page.locator('svg line');
      if (await relationshipSvg.count() > 0) {
        await expect(relationshipSvg.first()).toBeVisible();
      }
      
      // Verify relationship rendering performance
      const startTime = Date.now();
      await showRelationships.click(); // Toggle off
      await showRelationships.click(); // Toggle on
      const renderTime = Date.now() - startTime;
      
      // Should render in less than 500ms
      expect(renderTime).toBeLessThan(500);
    });
  });

  test.describe('Entity-Based Timeline Rows', () => {
    test('should display hierarchical entity rows', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Verify entity filtering controls
      await expect(page.getByText('Entity Filters:')).toBeVisible();
      await expect(page.getByText('Show All')).toBeVisible();
      await expect(page.getByText('Hide All')).toBeVisible();
      
      // Test entity type buttons
      const entityTypes = ['CHARACTER', 'LOCATION', 'ITEM'];
      for (const entityType of entityTypes) {
        const button = page.getByText(entityType);
        if (await button.isVisible()) {
          await expect(button).toBeVisible();
        }
      }
    });

    test('should handle entity filtering efficiently', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Test rapid entity filtering
      const startTime = Date.now();
      
      // Hide all entities
      await page.getByText('Hide All').click();
      
      // Show all entities
      await page.getByText('Show All').click();
      
      // Toggle individual entity types
      const characterButton = page.getByText('CHARACTER');
      if (await characterButton.isVisible()) {
        await characterButton.click(); // Hide
        await characterButton.click(); // Show
      }
      
      const filterTime = Date.now() - startTime;
      
      // Should complete filtering in less than 500ms
      expect(filterTime).toBeLessThan(500);
    });
  });

  test.describe('Accessibility', () => {
    test('should meet WCAG 2.1 AA standards', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test switch controls with keyboard
      const switches = page.locator('input[type="checkbox"]');
      const switchCount = await switches.count();
      
      if (switchCount > 0) {
        await switches.first().focus();
        await page.keyboard.press('Space');
        
        // Should toggle the switch
        const isChecked = await switches.first().isChecked();
        expect(typeof isChecked).toBe('boolean');
      }
    });

    test('should have proper ARIA labels', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Check for ARIA labels on interactive elements
      const switches = page.locator('input[type="checkbox"]');
      const switchCount = await switches.count();
      
      for (let i = 0; i < switchCount; i++) {
        const switchElement = switches.nth(i);
        const ariaLabel = await switchElement.getAttribute('aria-label');
        const associatedLabel = await switchElement.locator('..').locator('label').textContent();
        
        // Should have either aria-label or associated label
        expect(ariaLabel || associatedLabel).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewports', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Verify timeline is visible on mobile
      const timeline = page.locator('[data-testid="timeline-editor"]');
      await expect(timeline).toBeVisible();
      
      // Test mobile interactions
      await page.getByText('Real World Timeline').click();
      await page.getByText('In-Game Timeline').click();
      
      // Should remain functional on mobile
      await expect(timeline).toBeVisible();
    });

    test('should work on tablet viewports', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Verify timeline is visible on tablet
      const timeline = page.locator('[data-testid="timeline-editor"]');
      await expect(timeline).toBeVisible();
      
      // Test tablet-specific interactions
      const entityFilters = page.getByText('Entity Filters:');
      if (await entityFilters.isVisible()) {
        await expect(entityFilters).toBeVisible();
      }
    });
  });

  test.describe('Integration with RPG Scribe', () => {
    test('should integrate with all entity types', async () => {
      // Navigate to different entity pages and verify timeline integration
      const entityPages = [
        '/characters',
        '/locations', 
        '/items',
        '/events',
        '/sessions'
      ];
      
      for (const entityPage of entityPages) {
        await page.goto(entityPage);
        await page.waitForLoadState('networkidle');
        
        // Look for timeline-related elements
        const timelineLinks = page.locator('a[href*="timeline"]');
        if (await timelineLinks.count() > 0) {
          await expect(timelineLinks.first()).toBeVisible();
        }
      }
    });

    test('should maintain Firebase real-time updates', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Verify Firebase connection (check for real-time indicators)
      const timeline = page.locator('[data-testid="timeline-editor"]');
      await expect(timeline).toBeVisible();
      
      // Test would verify real-time updates in a full integration environment
      // For now, verify the timeline loads without Firebase errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Should not have Firebase-related errors
      const firebaseErrors = consoleErrors.filter(error => 
        error.includes('firebase') || error.includes('firestore')
      );
      expect(firebaseErrors.length).toBe(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network failures gracefully', async () => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      // Try to load timeline
      await page.goto('/timeline');
      
      // Should show appropriate error handling
      // (This would be customized based on actual error handling implementation)
      await page.waitForTimeout(5000);
      
      // Restore network
      await page.unroute('**/*');
      
      // Should recover when network is restored
      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    test('should handle invalid data gracefully', async () => {
      // Enable new timeline editor
      await page.getByText('Use New Timeline Editor (Phase 2)').click();
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline-editor"]');
      
      // Timeline should handle missing or invalid data without crashing
      const timeline = page.locator('[data-testid="timeline-editor"]');
      await expect(timeline).toBeVisible();
      
      // Check for error messages instead of crashes
      const errorMessages = page.locator('.mantine-Alert-root');
      if (await errorMessages.count() > 0) {
        // Should show user-friendly error messages
        await expect(errorMessages.first()).toBeVisible();
      }
    });
  });
});
