/**
 * Visual Regression Testing Utilities for Tooltip QA
 * 
 * Provides utilities for capturing and comparing tooltip screenshots
 * across different browsers and viewports.
 */

import { Page, expect } from '@playwright/test';
import { createHash } from 'crypto';

export interface ScreenshotOptions {
  name: string;
  selector?: string;
  fullPage?: boolean;
  threshold?: number;
  maxDiffPixels?: number;
}

export interface TooltipScreenshotOptions extends ScreenshotOptions {
  triggerSelector: string;
  tooltipSelector?: string;
  waitForAnimation?: boolean;
}

/**
 * Capture tooltip screenshot for visual regression testing
 */
export async function captureTooltipScreenshot(
  page: Page, 
  options: TooltipScreenshotOptions
): Promise<void> {
  const {
    name,
    triggerSelector,
    tooltipSelector = '[role="tooltip"]',
    waitForAnimation = true,
    threshold = 0.2,
    maxDiffPixels = 100
  } = options;

  // Hover over trigger element
  await page.hover(triggerSelector);
  
  // Wait for tooltip to appear
  await page.waitForSelector(tooltipSelector, { state: 'visible', timeout: 5000 });
  
  // Wait for animations to complete
  if (waitForAnimation) {
    await page.waitForTimeout(300);
  }
  
  // Get tooltip bounding box for focused screenshot
  const tooltipElement = page.locator(tooltipSelector);
  const boundingBox = await tooltipElement.boundingBox();
  
  if (!boundingBox) {
    throw new Error(`Tooltip not found with selector: ${tooltipSelector}`);
  }
  
  // Expand bounding box to include trigger element
  const triggerBox = await page.locator(triggerSelector).boundingBox();
  if (triggerBox) {
    const expandedBox = {
      x: Math.min(boundingBox.x, triggerBox.x) - 10,
      y: Math.min(boundingBox.y, triggerBox.y) - 10,
      width: Math.max(boundingBox.x + boundingBox.width, triggerBox.x + triggerBox.width) - Math.min(boundingBox.x, triggerBox.x) + 20,
      height: Math.max(boundingBox.y + boundingBox.height, triggerBox.y + triggerBox.height) - Math.min(boundingBox.y, triggerBox.y) + 20
    };
    
    // Capture screenshot with comparison
    await expect(page).toHaveScreenshot(`${name}.png`, {
      clip: expandedBox,
      threshold,
      maxDiffPixels
    });
  } else {
    // Fallback to tooltip-only screenshot
    await expect(tooltipElement).toHaveScreenshot(`${name}.png`, {
      threshold,
      maxDiffPixels
    });
  }
}

/**
 * Capture multiple tooltip states for comparison
 */
export async function captureTooltipStates(
  page: Page,
  triggerSelector: string,
  baseName: string
): Promise<void> {
  const tooltipSelector = '[role="tooltip"]';
  
  // Capture initial state (no tooltip)
  await expect(page).toHaveScreenshot(`${baseName}-initial.png`, {
    clip: await page.locator(triggerSelector).boundingBox() || undefined
  });
  
  // Capture hover state (with tooltip)
  await page.hover(triggerSelector);
  await page.waitForSelector(tooltipSelector, { state: 'visible' });
  await page.waitForTimeout(300); // Animation complete
  
  await captureTooltipScreenshot(page, {
    name: `${baseName}-hover`,
    triggerSelector
  });
  
  // Capture focus state (keyboard navigation)
  await page.mouse.move(0, 0); // Move mouse away
  await page.waitForSelector(tooltipSelector, { state: 'hidden' });
  
  await page.focus(triggerSelector);
  await page.waitForSelector(tooltipSelector, { state: 'visible' });
  
  await captureTooltipScreenshot(page, {
    name: `${baseName}-focus`,
    triggerSelector
  });
  
  // Reset state
  await page.keyboard.press('Escape');
  await page.waitForSelector(tooltipSelector, { state: 'hidden' });
}

/**
 * Compare tooltip appearance across viewports
 */
export async function compareTooltipAcrossViewports(
  page: Page,
  triggerSelector: string,
  viewports: Array<{ name: string; width: number; height: number }>
): Promise<void> {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500); // Allow layout to settle
    
    await captureTooltipScreenshot(page, {
      name: `tooltip-${viewport.name}`,
      triggerSelector
    });
  }
}

/**
 * Test tooltip positioning at viewport edges
 */
export async function testTooltipEdgePositioning(
  page: Page,
  triggerSelector: string
): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  // Test positions near edges
  const edgePositions = [
    { name: 'top-left', x: 50, y: 50 },
    { name: 'top-right', x: viewport.width - 50, y: 50 },
    { name: 'bottom-left', x: 50, y: viewport.height - 50 },
    { name: 'bottom-right', x: viewport.width - 50, y: viewport.height - 50 }
  ];
  
  for (const position of edgePositions) {
    // Move trigger element to edge position (if possible)
    await page.evaluate(({ selector, x, y }) => {
      const element = document.querySelector(selector);
      if (element && element instanceof HTMLElement) {
        element.style.position = 'fixed';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.zIndex = '9999';
      }
    }, { selector: triggerSelector, x: position.x, y: position.y });
    
    await page.waitForTimeout(100);
    
    await captureTooltipScreenshot(page, {
      name: `tooltip-edge-${position.name}`,
      triggerSelector
    });
  }
}

/**
 * Generate unique screenshot name based on test context
 */
export function generateScreenshotName(
  baseName: string,
  browserName: string,
  viewport: { width: number; height: number },
  additionalContext?: string
): string {
  const contextHash = createHash('md5')
    .update(`${browserName}-${viewport.width}x${viewport.height}-${additionalContext || ''}`)
    .digest('hex')
    .substring(0, 8);
  
  return `${baseName}-${browserName}-${viewport.width}x${viewport.height}-${contextHash}`;
}

/**
 * Validate tooltip positioning doesn't overflow viewport
 */
export async function validateTooltipPositioning(
  page: Page,
  tooltipSelector: string = '[role="tooltip"]'
): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  const tooltip = page.locator(tooltipSelector);
  await expect(tooltip).toBeVisible();
  
  const boundingBox = await tooltip.boundingBox();
  if (!boundingBox) return;
  
  // Check tooltip doesn't overflow viewport
  expect(boundingBox.x).toBeGreaterThanOrEqual(0);
  expect(boundingBox.y).toBeGreaterThanOrEqual(0);
  expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width);
  expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height);
}

/**
 * Test tooltip with different content lengths
 */
export async function testTooltipContentVariations(
  page: Page,
  triggerSelector: string,
  contentVariations: Array<{ name: string; data: any }>
): Promise<void> {
  for (const variation of contentVariations) {
    // Inject test data
    await page.evaluate((data) => {
      // Mock tooltip data for this variation
      window.testTooltipData = data;
    }, variation.data);
    
    // Refresh tooltip content
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await captureTooltipScreenshot(page, {
      name: `tooltip-content-${variation.name}`,
      triggerSelector
    });
  }
}

/**
 * Performance-aware screenshot capture
 */
export async function capturePerformanceAwareScreenshot(
  page: Page,
  options: TooltipScreenshotOptions & { maxLoadTime?: number }
): Promise<{ screenshot: Buffer; loadTime: number }> {
  const { maxLoadTime = 200, triggerSelector } = options;
  
  const startTime = Date.now();
  
  // Trigger tooltip
  await page.hover(triggerSelector);
  await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
  
  const loadTime = Date.now() - startTime;
  
  // Verify performance requirement
  expect(loadTime).toBeLessThan(maxLoadTime);
  
  // Capture screenshot
  await captureTooltipScreenshot(page, options);
  
  return {
    screenshot: await page.screenshot(),
    loadTime
  };
}
