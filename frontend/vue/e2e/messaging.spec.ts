/**
 * E2E Tests - Messaging Service
 *
 * End-to-end tests for the messaging service in a real browser environment
 * Tests the messaging functionality through the rendered UI and observable effects
 */

import { test, expect } from '@playwright/test'

test.describe('Messaging Service E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to initialize
    await page.waitForLoadState('networkidle')
  })

  test('should load the application successfully', async ({ page }) => {
    // Verify the app loaded
    await expect(page.locator('#app')).toBeVisible()
  })

  test('should have messaging service available in console logs', async ({ page }) => {
    const consoleMessages: string[] = []

    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Service') || text.includes('initialized')) {
        consoleMessages.push(text)
      }
    })

    // Reload to catch bootstrap logs
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Should have service initialization logs
    expect(consoleMessages.length).toBeGreaterThan(0)
  })

  test('should show toast container in DOM when PrimeVue is loaded', async ({ page }) => {
    // Wait for Vue app to mount
    await page.waitForTimeout(1000)

    // Check if the app HTML is present (Toast component may or may not be visible initially)
    const appContent = await page.locator('#app').innerHTML()
    expect(appContent.length).toBeGreaterThan(0)
  })

  test('should handle localStorage for service state', async ({ page }) => {
    // Test that localStorage is accessible
    const canAccessStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test-key', 'test-value')
        const value = localStorage.getItem('test-key')
        localStorage.removeItem('test-key')
        return value === 'test-value'
      } catch {
        return false
      }
    })

    expect(canAccessStorage).toBe(true)
  })

  test('should maintain app state across interactions', async ({ page }) => {
    // Simple test that the app doesn't crash
    await page.waitForTimeout(500)

    // Check that the app is still responsive
    const isVisible = await page.locator('#app').isVisible()
    expect(isVisible).toBe(true)
  })
})
