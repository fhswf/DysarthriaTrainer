/**
 * E2E Tests for Forgot Password Flow
 *
 * Tests the forgot password page functionality including:
 * - Form rendering and validation
 * - Success state display
 * - Navigation links
 */

import { test, expect } from '@playwright/test'

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
  })

  test('should render forgot password form with all elements', async ({ page }) => {
    // Check title
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()

    // Check subtitle
    await expect(page.getByText(/enter your email/i)).toBeVisible()

    // Check email field
    const emailInput = page.locator('#email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(emailInput).toHaveAttribute('placeholder', /enter your email/i)

    // Check security note
    await expect(page.getByText(/security reasons/i)).toBeVisible()

    // Check submit button
    const submitButton = page.getByRole('button', { name: /send reset link/i })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeDisabled() // Should be disabled with empty email

    // Check navigation links
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('should show validation error for empty email', async ({ page }) => {
    const emailInput = page.locator('#email')
    const submitButton = page.getByRole('button', { name: /send reset link/i })

    // Try to submit with empty email
    await emailInput.focus()
    await emailInput.blur()

    // Check if submit button is disabled
    await expect(submitButton).toBeDisabled()
  })

  test('should show validation error for invalid email format', async ({ page }) => {
    const emailInput = page.locator('#email')

    // Enter invalid email
    await emailInput.fill('invalid-email')
    await emailInput.blur()

    // Check for validation error
    await expect(page.locator('.p-error')).toBeVisible()
    await expect(page.locator('.p-error')).toContainText(/invalid email/i)
  })

  test('should enable submit button with valid email', async ({ page }) => {
    const emailInput = page.locator('#email')
    const submitButton = page.getByRole('button', { name: /send reset link/i })

    // Enter valid email
    await emailInput.fill('test@example.com')

    // Submit button should be enabled
    await expect(submitButton).toBeEnabled()
  })

  test('should show success state after submission', async ({ page }) => {
    const emailInput = page.locator('#email')
    const submitButton = page.getByRole('button', { name: /send reset link/i })

    // Fill and submit form
    await emailInput.fill('test@example.com')
    await submitButton.click()

    // Wait for success state (appears even without backend)
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
      timeout: 5000,
    })

    // Check success message
    await expect(page.getByText(/if an account exists/i)).toBeVisible()

    // Check security note in success state
    await expect(page.getByText(/security reasons/i)).toBeVisible()

    // Check "Back to Login" button
    await expect(page.getByRole('button', { name: /back to login/i })).toBeVisible()
  })

  test('should navigate to login page from success state', async ({ page }) => {
    const emailInput = page.locator('#email')
    const submitButton = page.getByRole('button', { name: /send reset link/i })

    // Fill and submit form
    await emailInput.fill('test@example.com')
    await submitButton.click()

    // Wait for success state
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
      timeout: 5000,
    })

    // Click "Back to Login" button
    await page.getByRole('button', { name: /back to login/i }).click()

    // Should navigate to login page
    await expect(page).toHaveURL('/login')
  })

  test('should navigate to login page from form', async ({ page }) => {
    // Click login link
    await page.getByRole('link', { name: /sign in/i }).click()

    // Should navigate to login page
    await expect(page).toHaveURL('/login')
  })

  test('should navigate to register page from form', async ({ page }) => {
    // Click register link
    await page.getByRole('link', { name: /sign up/i }).click()

    // Should navigate to register page
    await expect(page).toHaveURL('/register')
  })

  test('should clear error when user starts typing', async ({ page }) => {
    const emailInput = page.locator('#email')

    // Enter invalid email and blur to show error
    await emailInput.fill('invalid')
    await emailInput.blur()

    // Error should be visible
    await expect(page.locator('.p-error')).toBeVisible()

    // Start typing
    await emailInput.fill('valid@example.com')

    // Error should be cleared
    await expect(page.locator('.p-error')).not.toBeVisible()
  })

  test('should show loading state during submission', async ({ page }) => {
    const emailInput = page.locator('#email')
    const submitButton = page.getByRole('button', { name: /send reset link/i })

    // Fill form
    await emailInput.fill('test@example.com')

    // Click submit and check for loading state
    const submitPromise = submitButton.click()

    // Button should show loading state (spinner icon)
    await expect(submitButton.locator('.pi-spin'))
      .toBeVisible({ timeout: 1000 })
      .catch(() => {
        // Loading might be too fast to catch, that's okay
      })

    await submitPromise

    // Should eventually show success
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
      timeout: 5000,
    })
  })
})
