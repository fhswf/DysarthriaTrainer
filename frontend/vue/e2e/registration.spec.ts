/**
 * Registration E2E Tests
 * Tests the user registration flow
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${BASE_URL}/register`)
  })

  test('should display registration form', async ({ page }) => {
    // Check that all form fields are visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input#username')).toBeVisible()
    await expect(page.locator('input#full_name')).toBeVisible()
    // Password components wrap the actual input - use more specific selector
    await expect(page.locator('.p-password input').first()).toBeVisible()
    await expect(page.locator('.p-password input').nth(1)).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling anything
    await page.click('button[type="submit"]')

    // Wait for validation errors
    await page.waitForTimeout(500)

    // Should show error messages
    const errorMessages = page.locator('.p-error')
    await expect(errorMessages.first()).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    // Fill email and username
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input#username', 'testuser')

    // Try weak password - Password component wraps input
    const passwordInput = page.locator('#password').locator('input[type="password"]')
    await passwordInput.fill('weak')
    await passwordInput.blur()

    // Should show password requirement error
    await page.waitForTimeout(500)
    const passwordError = page.locator('.p-error').filter({ hasText: /password/i })
    await expect(passwordError.first()).toBeVisible()
  })

  test('should validate password confirmation match', async ({ page }) => {
    // Fill all fields but mismatch passwords
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input#username', 'testuser')
    const passwordInput = page.locator('#password').locator('input[type="password"]')
    await passwordInput.fill('Test123!@#')
    const confirmInput = page.locator('#confirmPassword').locator('input[type="password"]')
    await confirmInput.fill('Different123!@#')
    await confirmInput.blur()

    // Should show password mismatch error
    await page.waitForTimeout(500)
    const confirmError = page.locator('.p-error').filter({ hasText: /match/i })
    await expect(confirmError.first()).toBeVisible()
  })

  test('should successfully register with valid data', async ({ page }) => {
    // Generate unique email to avoid conflicts
    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`
    const username = `user${timestamp}`

    // Fill registration form
    await page.fill('input[type="email"]', email)
    await page.fill('input#username', username)
    await page.fill('input#full_name', 'Test User')
    const passwordInput = page.locator('#password').locator('input[type="password"]')
    await passwordInput.fill('Test123!@#')
    const confirmInput = page.locator('#confirmPassword').locator('input[type="password"]')
    await confirmInput.fill('Test123!@#')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for successful registration and navigation to login
    await page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/register') && response.status() === 201,
      { timeout: 10000 }
    )

    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain('/login')

    // Email should be pre-filled in login form
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue(email)
  })

  test('should show error for duplicate email', async ({ page }) => {
    // Try to register with existing email
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input#username', 'uniqueuser123')
    const passwordInput = page.locator('#password').locator('input[type="password"]')
    await passwordInput.fill('Test123!@#')
    const confirmInput = page.locator('#confirmPassword').locator('input[type="password"]')
    await confirmInput.fill('Test123!@#')

    // Submit form
    await page.click('button[type="submit"]')

    // Should show duplicate email error
    await page.waitForTimeout(2000)
    const errorMessage = page.locator('.p-error, .p-message-error')
    await expect(errorMessage.first()).toBeVisible()
  })

  test('should navigate to login page from link', async ({ page }) => {
    // Click login link
    await page.click('text=Log in')

    // Should navigate to login page
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 })
    expect(page.url()).toBe(`${BASE_URL}/login`)
  })
})
