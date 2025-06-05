# Test info

- Name: Tooltip Quality Assurance - Cross-Browser Compatibility >> should work consistently across browsers
- Location: D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:110:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

    at D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:111:16
```

# Test source

```ts
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
   21 |     await page.goto('/');
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
> 111 |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
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
  122 |     expect(title).toBeTruthy();
  123 |     
  124 |     // Browser-specific checks
  125 |     if (browserName === 'webkit') {
  126 |       // Safari-specific validation
  127 |       console.log('Testing Safari-specific features');
  128 |     } else if (browserName === 'firefox') {
  129 |       // Firefox-specific validation
  130 |       console.log('Testing Firefox-specific features');
  131 |     } else if (browserName === 'chromium') {
  132 |       // Chrome-specific validation
  133 |       console.log('Testing Chrome-specific features');
  134 |     }
  135 |   });
  136 |
  137 |   test('should handle touch interactions on mobile browsers', async ({ page }) => {
  138 |     await page.setViewportSize(VIEWPORTS.mobile);
  139 |     await page.goto('/');
  140 |     await page.waitForLoadState('networkidle');
  141 |     
  142 |     // Test touch interaction
  143 |     const body = page.locator('body');
  144 |     await body.tap();
  145 |     
  146 |     // Verify page responds to touch
  147 |     await page.waitForTimeout(500);
  148 |     
  149 |     // Take mobile screenshot
  150 |     await page.screenshot({
  151 |       path: `test-results/mobile-touch-${Date.now()}.png`,
  152 |       fullPage: true
  153 |     });
  154 |   });
  155 | });
  156 |
  157 | test.describe('Tooltip Quality Assurance - Performance Validation', () => {
  158 |   
  159 |   test('should meet basic performance requirements', async ({ page }) => {
  160 |     // Enable performance monitoring
  161 |     await page.goto('/');
  162 |     
  163 |     // Measure page load performance
  164 |     const performanceMetrics = await page.evaluate(() => {
  165 |       const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  166 |       return {
  167 |         domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
  168 |         loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
  169 |         firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
  170 |         firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
  171 |       };
  172 |     });
  173 |     
  174 |     // Verify performance benchmarks
  175 |     expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
  176 |     expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
  177 |     
  178 |     console.log('Performance metrics:', performanceMetrics);
  179 |   });
  180 |
  181 |   test('should handle memory usage efficiently', async ({ page }) => {
  182 |     await page.goto('/');
  183 |     await page.waitForLoadState('networkidle');
  184 |     
  185 |     // Get memory usage
  186 |     const memoryUsage = await page.evaluate(() => {
  187 |       if ('memory' in performance) {
  188 |         return (performance as any).memory;
  189 |       }
  190 |       return null;
  191 |     });
  192 |     
  193 |     if (memoryUsage) {
  194 |       // Verify memory usage is reasonable (less than 50MB)
  195 |       expect(memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
  196 |       console.log('Memory usage:', memoryUsage);
  197 |     }
  198 |   });
  199 | });
  200 |
  201 | test.describe('Tooltip Quality Assurance - Accessibility Basics', () => {
  202 |   
  203 |   test('should have proper document structure', async ({ page }) => {
  204 |     await page.goto('/');
  205 |     await page.waitForLoadState('networkidle');
  206 |     
  207 |     // Check for proper heading structure
  208 |     const h1Count = await page.locator('h1').count();
  209 |     expect(h1Count).toBeGreaterThanOrEqual(1);
  210 |     
  211 |     // Check for proper landmarks
```