/**
 * Authentication Flow E2E Tests
 * Tests the complete authentication flow including login, redirect, and logout
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies()
    await page.goto(BASE_URL)
  })

  test('should redirect to login when accessing protected route unauthenticated', async ({
    page,
  }) => {
    // Try to access dashboard
    await page.goto(`${BASE_URL}/dashboard`)

    // Should redirect to login with redirect parameter
    await page.waitForURL(/\/login\?redirect=/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('redirect=')
  })

  test('should login and redirect to original destination', async ({ page }) => {
    // Navigate directly to login with redirect parameter
    await page.goto(`${BASE_URL}/login?redirect=/dashboard`)

    // Fill in login form
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'Admin123!')

    // Submit and wait for navigation
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
    expect(page.url()).toBe(`${BASE_URL}/dashboard`)
  })

  test('should show welcome message after successful login', async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`)

    // Fill in login form
    await page.fill('input[type="email"]', 'therapist@example.com')
    await page.fill('input[type="password"]', 'Therapist123!')
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 })

    // Check for success toast (PrimeVue toast message)
    // The message should contain "Welcome back" and the user's name
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible({ timeout: 3000 })
    await expect(toast).toContainText('Welcome back')
  })

  test('should allow logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'User123!')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 })

    // Click logout button (in navbar user menu)
    await page.click('[data-testid="user-menu-button"]')
    await page.click('[data-testid="logout-button"]')

    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 })
    await expect(page).toHaveURL(`${BASE_URL}/login`)

    // Should not be able to access protected routes
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('redirect=')
  })

  test('should remember login with "Remember Me" checkbox', async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`)

    // Fill in login form with Remember Me checked
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'Admin123!')
    await page.check('input[type="checkbox"]') // Remember Me
    await page.click('button[type="submit"]')

    // Wait for navigation
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })

    // Check that remember_me flag is set to true
    const rememberMeFlag = await page.evaluate(() => {
      return localStorage.getItem('auth_remember_me')
    })
    expect(rememberMeFlag).toBe('true')

    // Check that tokens are in localStorage
    const hasToken = await page.evaluate(() => {
      return !!localStorage.getItem('auth_token')
    })
    expect(hasToken).toBe(true)
  })

  test('should not remember login without "Remember Me" checkbox', async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`)

    // Fill in login form WITHOUT Remember Me
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'Admin123!')
    await page.click('button[type="submit"]')

    // Wait for navigation
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })

    // Check that remember_me flag is set to false
    const rememberMeFlag = await page.evaluate(() => {
      return localStorage.getItem('auth_remember_me')
    })
    expect(rememberMeFlag).toBe('false')

    // Tokens are still in localStorage (TokenManager only uses localStorage)
    const hasToken = await page.evaluate(() => {
      return !!localStorage.getItem('auth_token')
    })
    expect(hasToken).toBe(true)
  })

  test('should handle invalid credentials gracefully', async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`)

    // Fill in login form with wrong password
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Should show error message
    const errorMessage = page.locator('text=Invalid email or password')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })

    // Should still be on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`)
  })
})
