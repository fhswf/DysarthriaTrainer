/**
 * Basic Login Test
 * Simple test to verify login functionality works
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Basic Login', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies()
    await page.goto(`${BASE_URL}/login`)
  })

  test('should display login form', async ({ page }) => {
    // Check that login page is displayed
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should login successfully with admin account', async ({ page }) => {
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'Admin123!')

    // Click submit button
    await page.click('button[type="submit"]')

    // Wait for URL change (should navigate away from login)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })

    // Check that we're no longer on login page
    expect(page.url()).not.toContain('/login')
    console.log('Navigated to:', page.url())
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in login form with wrong password
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'WrongPassword!')

    // Click submit button
    await page.click('button[type="submit"]')

    // Should still be on login page
    await page.waitForTimeout(2000) // Give time for error to appear
    expect(page.url()).toContain('/login')

    // Should show error message
    const errorText = page.locator('text=/Invalid email or password/i')
    await expect(errorText).toBeVisible({ timeout: 3000 })
  })
})
