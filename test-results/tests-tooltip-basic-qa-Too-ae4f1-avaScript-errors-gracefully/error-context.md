# Test info

- Name: Tooltip Quality Assurance - Error Handling >> should handle JavaScript errors gracefully
- Location: D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:297:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

    at D:\AI Projects\RPG-Archivist-Web2\tests\tooltip-basic-qa.spec.ts:304:16
```

# Test source

```ts
  204 |     await page.goto('/');
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
> 304 |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  305 |     await page.waitForLoadState('networkidle');
  306 |     
  307 |     // Inject a non-critical error to test error handling
  308 |     await page.evaluate(() => {
  309 |       try {
  310 |         // This should not break the application
  311 |         (window as any).nonExistentFunction();
  312 |       } catch (e) {
  313 |         console.warn('Non-critical error handled:', e);
  314 |       }
  315 |     });
  316 |     
  317 |     await page.waitForTimeout(1000);
  318 |     
  319 |     // Verify application still works despite errors
  320 |     const title = await page.title();
  321 |     expect(title).toBeTruthy();
  322 |     
  323 |     // Log any critical errors for investigation
  324 |     const criticalErrors = jsErrors.filter(error => 
  325 |       !error.includes('non-critical') && 
  326 |       !error.includes('warning')
  327 |     );
  328 |     
  329 |     if (criticalErrors.length > 0) {
  330 |       console.warn('Critical JavaScript errors detected:', criticalErrors);
  331 |     }
  332 |   });
  333 | });
  334 |
```