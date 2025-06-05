# Test info

- Name: Tooltip Quality Assurance - Basic Testing >> should load within performance budget
- Location: D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:95:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

    at D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:21:16
```

# Test source

```ts
   1 | /**
   2 |  * Basic Quality Assurance Tests for "Recently Added" Tooltips
   3 |  * 
   4 |  * Simplified test suite to validate tooltip functionality across
   5 |  * different viewports and browsers without complex setup.
   6 |  */
   7 |
   8 | import { test, expect } from '@playwright/test';
   9 |
   10 | // Test configuration for different viewports
   11 | const VIEWPORTS = {
   12 |   desktop: { width: 1920, height: 1080 },
   13 |   tablet: { width: 768, height: 1024 },
   14 |   mobile: { width: 375, height: 667 }
   15 | };
   16 |
   17 | test.describe('Tooltip Quality Assurance - Basic Testing', () => {
   18 |   
   19 |   test.beforeEach(async ({ page }) => {
   20 |     // Navigate to the application
>  21 |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
   22 |     await page.waitForLoadState('networkidle');
   23 |   });
   24 |
   25 |   test('should display application without errors', async ({ page }) => {
   26 |     // Check if React app is loaded
   27 |     const reactRoot = await page.locator('#root').count();
   28 |     expect(reactRoot).toBeGreaterThan(0);
   29 |     
   30 |     // Check for console errors
   31 |     const errors: string[] = [];
   32 |     page.on('console', (msg) => {
   33 |       if (msg.type() === 'error') {
   34 |         errors.push(msg.text());
   35 |       }
   36 |     });
   37 |     
   38 |     // Wait a bit to catch any console errors
   39 |     await page.waitForTimeout(2000);
   40 |     
   41 |     // Filter out known non-critical errors
   42 |     const criticalErrors = errors.filter(error => 
   43 |       !error.includes('favicon') && 
   44 |       !error.includes('manifest') &&
   45 |       !error.includes('404')
   46 |     );
   47 |     
   48 |     expect(criticalErrors).toHaveLength(0);
   49 |   });
   50 |
   51 |   Object.entries(VIEWPORTS).forEach(([viewportName, viewport]) => {
   52 |     test(`should render correctly on ${viewportName} viewport`, async ({ page }) => {
   53 |       await page.setViewportSize(viewport);
   54 |       
   55 |       // Take screenshot for visual validation
   56 |       await page.screenshot({
   57 |         path: `test-results/viewport-${viewportName}-${Date.now()}.png`,
   58 |         fullPage: true
   59 |       });
   60 |       
   61 |       // Verify page is responsive
   62 |       const body = page.locator('body');
   63 |       const bodyBox = await body.boundingBox();
   64 |       
   65 |       expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
   66 |     });
   67 |   });
   68 |
   69 |   test('should handle navigation without errors', async ({ page }) => {
   70 |     // Test basic navigation
   71 |     const links = page.locator('a[href]');
   72 |     const linkCount = await links.count();
   73 |     
   74 |     if (linkCount > 0) {
   75 |       // Click first available link
   76 |       await links.first().click();
   77 |       await page.waitForLoadState('networkidle');
   78 |       
   79 |       // Verify no errors occurred
   80 |       const title = await page.title();
   81 |       expect(title).toBeTruthy();
   82 |     }
   83 |   });
   84 |
   85 |   test('should have accessible navigation', async ({ page }) => {
   86 |     // Test keyboard navigation
   87 |     await page.keyboard.press('Tab');
   88 |     
   89 |     // Verify focus is visible
   90 |     const focusedElement = page.locator(':focus');
   91 |     const focusedCount = await focusedElement.count();
   92 |     expect(focusedCount).toBeGreaterThan(0);
   93 |   });
   94 |
   95 |   test('should load within performance budget', async ({ page }) => {
   96 |     const startTime = Date.now();
   97 |     
   98 |     await page.goto('/');
   99 |     await page.waitForLoadState('networkidle');
  100 |     
  101 |     const loadTime = Date.now() - startTime;
  102 |     
  103 |     // Should load within 5 seconds
  104 |     expect(loadTime).toBeLessThan(5000);
  105 |   });
  106 | });
  107 |
  108 | test.describe('Tooltip Quality Assurance - Cross-Browser Compatibility', () => {
  109 |   
  110 |   test('should work consistently across browsers', async ({ page, browserName }) => {
  111 |     await page.goto('/');
  112 |     await page.waitForLoadState('networkidle');
  113 |     
  114 |     // Take browser-specific screenshot
  115 |     await page.screenshot({
  116 |       path: `test-results/browser-${browserName}-${Date.now()}.png`,
  117 |       fullPage: false
  118 |     });
  119 |     
  120 |     // Verify basic functionality works
  121 |     const title = await page.title();
```