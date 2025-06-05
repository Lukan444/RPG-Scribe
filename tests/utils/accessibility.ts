/**
 * Accessibility Testing Utilities for Tooltip QA
 * 
 * Provides comprehensive accessibility testing for tooltip components
 * including ARIA compliance, keyboard navigation, and screen reader support.
 */

import { Page, expect } from '@playwright/test';

export interface AccessibilityTestOptions {
  triggerSelector: string;
  tooltipSelector?: string;
  expectedRole?: string;
  expectedAriaAttributes?: string[];
}

/**
 * Test tooltip keyboard accessibility
 */
export async function testTooltipKeyboardAccessibility(
  page: Page,
  options: AccessibilityTestOptions
): Promise<void> {
  const { triggerSelector, tooltipSelector = '[role="tooltip"]' } = options;
  
  // Test Tab navigation to trigger element
  await page.keyboard.press('Tab');
  
  // Verify trigger element receives focus
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toHaveAttribute('data-testid', triggerSelector.replace('[data-testid="', '').replace('"]', ''));
  
  // Verify tooltip appears on focus
  await expect(page.locator(tooltipSelector)).toBeVisible({ timeout: 3000 });
  
  // Test Escape key hides tooltip
  await page.keyboard.press('Escape');
  await expect(page.locator(tooltipSelector)).toBeHidden({ timeout: 2000 });
  
  // Test Enter/Space key shows tooltip
  await page.keyboard.press('Enter');
  await expect(page.locator(tooltipSelector)).toBeVisible({ timeout: 3000 });
  
  // Test Tab away hides tooltip
  await page.keyboard.press('Tab');
  await expect(page.locator(tooltipSelector)).toBeHidden({ timeout: 2000 });
}

/**
 * Test ARIA attributes and roles
 */
export async function testTooltipAriaCompliance(
  page: Page,
  options: AccessibilityTestOptions
): Promise<void> {
  const { 
    triggerSelector, 
    tooltipSelector = '[role="tooltip"]',
    expectedRole = 'tooltip',
    expectedAriaAttributes = ['aria-describedby']
  } = options;
  
  // Trigger tooltip
  await page.hover(triggerSelector);
  await page.waitForSelector(tooltipSelector, { state: 'visible' });
  
  // Test tooltip role
  const tooltip = page.locator(tooltipSelector);
  await expect(tooltip).toHaveAttribute('role', expectedRole);
  
  // Test trigger element ARIA attributes
  const trigger = page.locator(triggerSelector);
  
  for (const attribute of expectedAriaAttributes) {
    await expect(trigger).toHaveAttribute(attribute);
  }
  
  // Test aria-describedby relationship
  if (expectedAriaAttributes.includes('aria-describedby')) {
    const ariaDescribedBy = await trigger.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
    
    // Verify tooltip has matching ID
    const tooltipId = await tooltip.getAttribute('id');
    expect(tooltipId).toBe(ariaDescribedBy);
  }
  
  // Test tooltip is properly labeled
  const tooltipText = await tooltip.textContent();
  expect(tooltipText).toBeTruthy();
  expect(tooltipText!.trim().length).toBeGreaterThan(0);
}

/**
 * Test screen reader announcements
 */
export async function testScreenReaderAnnouncements(
  page: Page,
  triggerSelector: string
): Promise<void> {
  // Mock screen reader API
  await page.addInitScript(() => {
    window.screenReaderAnnouncements = [];
    
    // Mock speechSynthesis API
    window.speechSynthesis = {
      speak: (utterance: any) => {
        window.screenReaderAnnouncements.push({
          text: utterance.text,
          timestamp: Date.now()
        });
      },
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [],
      speaking: false,
      pending: false,
      paused: false
    } as any;
    
    // Mock ARIA live region announcements
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name: string, value: string) {
      if (name === 'aria-live' || name === 'aria-atomic') {
        window.screenReaderAnnouncements.push({
          text: `ARIA: ${name}=${value} on ${this.tagName}`,
          timestamp: Date.now()
        });
      }
      return originalSetAttribute.call(this, name, value);
    };
  });
  
  // Trigger tooltip
  await page.hover(triggerSelector);
  await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
  
  // Check for screen reader announcements
  const announcements = await page.evaluate(() => window.screenReaderAnnouncements);
  
  // Verify tooltip content was announced
  expect(announcements.length).toBeGreaterThan(0);
  
  const tooltipText = await page.locator('[role="tooltip"]').textContent();
  const hasTooltipAnnouncement = announcements.some((announcement: any) => 
    announcement.text.includes(tooltipText) || 
    announcement.text.includes('tooltip') ||
    announcement.text.includes('Recently Added')
  );
  
  expect(hasTooltipAnnouncement).toBeTruthy();
}

/**
 * Test high contrast mode compatibility
 */
export async function testHighContrastMode(
  page: Page,
  triggerSelector: string
): Promise<void> {
  // Enable high contrast mode simulation
  await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
  
  // Trigger tooltip
  await page.hover(triggerSelector);
  await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
  
  const tooltip = page.locator('[role="tooltip"]');
  
  // Verify tooltip is still visible in high contrast mode
  await expect(tooltip).toBeVisible();
  
  // Check computed styles for high contrast compatibility
  const computedStyle = await tooltip.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      border: style.border,
      outline: style.outline
    };
  });
  
  // Verify contrast is maintained
  expect(computedStyle.backgroundColor).not.toBe('transparent');
  expect(computedStyle.color).not.toBe(computedStyle.backgroundColor);
}

/**
 * Test reduced motion preferences
 */
export async function testReducedMotionSupport(
  page: Page,
  triggerSelector: string
): Promise<void> {
  // Enable reduced motion preference
  await page.emulateMedia({ reducedMotion: 'reduce' });
  
  // Trigger tooltip
  await page.hover(triggerSelector);
  
  // Measure animation duration
  const animationStart = Date.now();
  await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
  const animationDuration = Date.now() - animationStart;
  
  // Verify animation is reduced or instant
  expect(animationDuration).toBeLessThan(100); // Should be nearly instant with reduced motion
  
  // Check CSS animations are disabled
  const tooltip = page.locator('[role="tooltip"]');
  const animationProperties = await tooltip.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration
    };
  });
  
  // Verify animations are disabled or very short
  expect(animationProperties.animationDuration).toMatch(/^(0s|none)$/);
  expect(animationProperties.transitionDuration).toMatch(/^(0s|none)$/);
}

/**
 * Test focus management
 */
export async function testTooltipFocusManagement(
  page: Page,
  triggerSelector: string
): Promise<void> {
  // Test initial focus state
  await page.focus(triggerSelector);
  
  // Verify tooltip appears on focus
  await expect(page.locator('[role="tooltip"]')).toBeVisible();
  
  // Test focus remains on trigger
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toHaveAttribute('data-testid', triggerSelector.replace('[data-testid="', '').replace('"]', ''));
  
  // Test focus trap (tooltip shouldn't steal focus)
  await page.keyboard.press('Tab');
  
  // Verify focus moved to next element, not trapped in tooltip
  const newFocusedElement = page.locator(':focus');
  const isSameElement = await newFocusedElement.evaluate((el, selector) => {
    return el.matches(selector);
  }, triggerSelector);
  
  expect(isSameElement).toBeFalsy();
  
  // Verify tooltip is hidden when focus moves away
  await expect(page.locator('[role="tooltip"]')).toBeHidden({ timeout: 2000 });
}

/**
 * Test tooltip with assistive technology
 */
export async function testAssistiveTechnologySupport(
  page: Page,
  triggerSelector: string
): Promise<void> {
  // Simulate assistive technology environment
  await page.addInitScript(() => {
    // Mock JAWS/NVDA detection
    Object.defineProperty(navigator, 'userAgent', {
      value: navigator.userAgent + ' JAWS/2023',
      configurable: true
    });
    
    // Mock assistive technology APIs
    window.speechSynthesis = {
      speak: (utterance: any) => {
        console.log('AT: Speaking -', utterance.text);
      },
      cancel: () => console.log('AT: Speech cancelled'),
      pause: () => console.log('AT: Speech paused'),
      resume: () => console.log('AT: Speech resumed'),
      getVoices: () => [],
      speaking: false,
      pending: false,
      paused: false
    } as any;
  });
  
  // Test tooltip interaction with AT
  await page.focus(triggerSelector);
  await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
  
  // Verify tooltip content is accessible to AT
  const tooltip = page.locator('[role="tooltip"]');
  const tooltipContent = await tooltip.textContent();
  
  expect(tooltipContent).toBeTruthy();
  expect(tooltipContent).toContain('Recently Added');
  
  // Test AT navigation
  await page.keyboard.press('ArrowDown'); // Common AT navigation key
  await page.keyboard.press('ArrowUp');
  
  // Verify tooltip remains stable during AT navigation
  await expect(tooltip).toBeVisible();
}

/**
 * Comprehensive accessibility audit
 */
export async function runAccessibilityAudit(
  page: Page,
  triggerSelector: string
): Promise<void> {
  console.log('🔍 Running comprehensive accessibility audit...');
  
  // Test all accessibility aspects
  await testTooltipKeyboardAccessibility(page, { triggerSelector });
  await testTooltipAriaCompliance(page, { triggerSelector });
  await testScreenReaderAnnouncements(page, triggerSelector);
  await testHighContrastMode(page, triggerSelector);
  await testReducedMotionSupport(page, triggerSelector);
  await testTooltipFocusManagement(page, triggerSelector);
  await testAssistiveTechnologySupport(page, triggerSelector);
  
  console.log('✅ Accessibility audit completed successfully');
}
