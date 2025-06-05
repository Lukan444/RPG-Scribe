# Test info

- Name: Tooltip Quality Assurance - Accessibility Basics >> should have proper document structure
- Location: D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:203:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

    at D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:204:16
```

# Test source

```ts
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
> 204 |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  205 |     await page.waitForLoadState('networkidle');
  206 |     
  207 |     // Check for proper heading structure
  208 |     const h1Count = await page.locator('h1').count();
  209 |     expect(h1Count).toBeGreaterThanOrEqual(1);
  210 |     
  211 |     // Check for proper landmarks
  212 |     const mainCount = await page.locator('main, [role="main"]').count();
  213 |     expect(mainCount).toBeGreaterThanOrEqual(0); // Optional but recommended
  214 |     
  215 |     // Check for alt text on images
  216 |     const images = page.locator('img');
  217 |     const imageCount = await images.count();
  218 |     
  219 |     if (imageCount > 0) {
  220 |       for (let i = 0; i < Math.min(imageCount, 5); i++) {
  221 |         const img = images.nth(i);
  222 |         const alt = await img.getAttribute('alt');
  223 |         const ariaLabel = await img.getAttribute('aria-label');
  224 |         
  225 |         // Images should have alt text or aria-label
  226 |         expect(alt !== null || ariaLabel !== null).toBeTruthy();
  227 |       }
  228 |     }
  229 |   });
  230 |
  231 |   test('should support keyboard navigation', async ({ page }) => {
  232 |     await page.goto('/');
  233 |     await page.waitForLoadState('networkidle');
  234 |     
  235 |     // Test tab navigation
  236 |     await page.keyboard.press('Tab');
  237 |     
  238 |     // Verify focus is visible
  239 |     const focusedElement = page.locator(':focus');
  240 |     await expect(focusedElement).toBeVisible();
  241 |     
  242 |     // Test multiple tab presses
  243 |     for (let i = 0; i < 3; i++) {
  244 |       await page.keyboard.press('Tab');
  245 |       await page.waitForTimeout(100);
  246 |     }
  247 |     
  248 |     // Verify focus management works
  249 |     const finalFocusedElement = page.locator(':focus');
  250 |     await expect(finalFocusedElement).toBeVisible();
  251 |   });
  252 |
  253 |   test('should have proper color contrast', async ({ page }) => {
  254 |     await page.goto('/');
  255 |     await page.waitForLoadState('networkidle');
  256 |     
  257 |     // Test high contrast mode
  258 |     await page.emulateMedia({ colorScheme: 'dark' });
  259 |     await page.waitForTimeout(500);
  260 |     
  261 |     // Verify page is still usable
  262 |     const body = page.locator('body');
  263 |     await expect(body).toBeVisible();
  264 |     
  265 |     // Take high contrast screenshot
  266 |     await page.screenshot({
  267 |       path: `test-results/high-contrast-${Date.now()}.png`,
  268 |       fullPage: true
  269 |     });
  270 |   });
  271 | });
  272 |
  273 | test.describe('Tooltip Quality Assurance - Error Handling', () => {
  274 |   
  275 |   test('should handle network errors gracefully', async ({ page }) => {
  276 |     // Simulate offline condition
  277 |     await page.context().setOffline(true);
  278 |     
  279 |     try {
  280 |       await page.goto('/');
  281 |       await page.waitForLoadState('networkidle', { timeout: 5000 });
  282 |     } catch (error) {
  283 |       // Expected to fail, but should handle gracefully
  284 |       console.log('Offline test completed as expected');
  285 |     }
  286 |     
  287 |     // Restore online condition
  288 |     await page.context().setOffline(false);
  289 |     await page.goto('/');
  290 |     await page.waitForLoadState('networkidle');
  291 |     
  292 |     // Verify recovery
  293 |     const title = await page.title();
  294 |     expect(title).toBeTruthy();
  295 |   });
  296 |
  297 |   test('should handle JavaScript errors gracefully', async ({ page }) => {
  298 |     const jsErrors: string[] = [];
  299 |     
  300 |     page.on('pageerror', (error) => {
  301 |       jsErrors.push(error.message);
  302 |     });
  303 |     
  304 |     await page.goto('/');
```