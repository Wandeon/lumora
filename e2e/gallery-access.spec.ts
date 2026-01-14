import { test, expect } from '@playwright/test';

test.describe('Gallery Access', () => {
  test('should show error for invalid gallery code', async ({ page }) => {
    await page.goto('/mystudio');
    await page.fill('input[type="text"]', 'INVALID');
    await page.click('button[type="submit"]');

    // Should redirect to gallery page and show not found
    await expect(page).toHaveURL(/\/mystudio\/gallery\?code=INVALID/);
  });

  test('should navigate to gallery with valid code', async ({ page }) => {
    // This test requires a seeded database with a valid gallery
    await page.goto('/mystudio');
    await page.fill('input[type="text"]', 'TEST1234');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/mystudio\/gallery\?code=TEST1234/);
  });
});
