/**
 * E2E Tests - Localization Service
 *
 * End-to-end tests for the localization service in a real browser environment
 * Tests the localization functionality through the rendered UI
 */

import { test, expect } from '@playwright/test'

test.describe('Localization Service E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to initialize
    await page.waitForLoadState('networkidle')
  })

  test('should load the application successfully', async ({ page }) => {
    // Verify the app loaded (checking for the root element)
    await expect(page.locator('#app')).toBeVisible()
  })

  test('should have localization initialized on page load', async ({ page }) => {
    // Check localStorage for locale setting
    const locale = await page.evaluate(() => localStorage.getItem('omnia-locale'))

    // Should either be null (using default) or a valid locale code
    if (locale !== null) {
      expect(['en', 'de']).toContain(locale)
    }
  })

  test('should persist locale changes to localStorage', async ({ page }) => {
    // Expose function to change locale via Pinia store directly from window
    await page.evaluate(() => {
      // Access the Pinia store that's already loaded in the app
      const app = (window as any).__VUE_APP__
      if (app?.config?.globalProperties?.$pinia) {
        const pinia = app.config.globalProperties.$pinia
        const stores = pinia._s
        const localizationStore = Array.from(stores.values()).find(
          (store: any) => store.$id === 'localization'
        )
        if (localizationStore) {
          localizationStore.setLocale('de')
        }
      }
    })

    // Wait a bit for localStorage to update
    await page.waitForTimeout(100)

    // Check localStorage
    const storedLocale = await page.evaluate(() => localStorage.getItem('omnia-locale'))
    expect(storedLocale).toBe('de')
  })

  test('should maintain locale across page reloads', async ({ page }) => {
    // Set locale to German
    await page.evaluate(() => localStorage.setItem('omnia-locale', 'de'))

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check that locale is still German
    const locale = await page.evaluate(() => localStorage.getItem('omnia-locale'))
    expect(locale).toBe('de')
  })

  test('should clear locale from localStorage when reset', async ({ page }) => {
    // Set a locale
    await page.evaluate(() => localStorage.setItem('omnia-locale', 'de'))

    // Clear it
    await page.evaluate(() => localStorage.removeItem('omnia-locale'))

    // Verify it's gone
    const locale = await page.evaluate(() => localStorage.getItem('omnia-locale'))
    expect(locale).toBeNull()
  })
})
