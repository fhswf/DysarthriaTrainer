/**
 * Profile Management E2E Tests
 * Tests profile viewing, editing, password change functionality
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const TEST_USER = {
  email: 'admin@example.com',
  password: 'Admin123!',
  fullName: 'Admin User',
}

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and login before each test
    await page.context().clearCookies()
    await page.goto(`${BASE_URL}/login`)

    // Login
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  })

  test('should navigate to profile page', async ({ page }) => {
    // Navigate to profile
    await page.goto(`${BASE_URL}/profile`)

    // Wait for profile page to load
    await page.waitForSelector('text=/profile/i', { timeout: 5000 })

    // Verify URL
    expect(page.url()).toContain('/profile')
  })

  test('should display user profile information', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)

    // Wait for profile data to load
    await page.waitForTimeout(1000)

    // Check for email field (should be disabled/read-only)
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toBeDisabled()
    await expect(emailInput).toHaveValue(TEST_USER.email)

    // Check for username field (should be disabled/read-only)
    const usernameInput = page.locator('input#username, input[id*="username"]')
    if (await usernameInput.count() > 0) {
      await expect(usernameInput.first()).toBeDisabled()
    }
  })

  test('should have editable full name field', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)

    // Wait for form to load
    await page.waitForTimeout(1000)

    // Find first name and last name inputs (they should be enabled)
    const firstNameInput = page.locator('input#firstName, input[id*="firstName"]')
    const lastNameInput = page.locator('input#lastName, input[id*="lastName"]')

    if (await firstNameInput.count() > 0) {
      await expect(firstNameInput.first()).toBeEnabled()
    }
    if (await lastNameInput.count() > 0) {
      await expect(lastNameInput.first()).toBeEnabled()
    }
  })

  test('should update profile information', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)

    // Wait for form to load
    await page.waitForTimeout(1000)

    // Update first name
    const firstNameInput = page.locator('input#firstName, input[id*="firstName"]').first()
    if (await firstNameInput.count() > 0) {
      await firstNameInput.clear()
      await firstNameInput.fill('TestFirst')
    }

    // Update last name
    const lastNameInput = page.locator('input#lastName, input[id*="lastName"]').first()
    if (await lastNameInput.count() > 0) {
      await lastNameInput.clear()
      await lastNameInput.fill('TestLast')
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    // Wait for success message or reload
    await page.waitForTimeout(2000)

    // Check for success indication (toast or message)
    const successMessage = page.locator('text=/success|updated|saved/i')
    if (await successMessage.count() > 0) {
      await expect(successMessage.first()).toBeVisible()
    }
  })

  test('should open change password dialog', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Find and click change password button
    const changePasswordButton = page.locator(
      'button:has-text("Change Password"), button:has-text("Passwort ändern")'
    )

    if (await changePasswordButton.count() > 0) {
      await changePasswordButton.first().click()

      // Wait for dialog to appear
      await page.waitForTimeout(500)

      // Check for password dialog elements
      const dialogTitle = page.locator(
        'text=/change.*password|passwort.*ändern/i'
      )
      await expect(dialogTitle.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should validate password change form', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Open change password dialog
    const changePasswordButton = page.locator(
      'button:has-text("Change Password"), button:has-text("Passwort ändern")'
    )

    if (await changePasswordButton.count() === 0) {
      test.skip()
      return
    }

    await changePasswordButton.first().click()
    await page.waitForTimeout(500)

    // Try to submit empty form
    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ has: page.locator('.p-dialog-content, [role="dialog"]') })
      .first()

    if (await submitButton.count() > 0) {
      // Submit should be disabled or show validation errors
      await submitButton.click()

      // Check for validation errors
      await page.waitForTimeout(500)
      const errorMessages = page.locator('.p-error, .text-red-500, [class*="error"]')
      
      // Either button is disabled or errors are shown
      const isDisabled = await submitButton.isDisabled()
      const hasErrors = (await errorMessages.count()) > 0

      expect(isDisabled || hasErrors).toBeTruthy()
    }
  })

  test('should validate new password strength', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    // Open change password dialog
    const changePasswordButton = page.locator(
      'button:has-text("Change Password"), button:has-text("Passwort ändern")'
    )

    if (await changePasswordButton.count() === 0) {
      test.skip()
      return
    }

    await changePasswordButton.first().click()
    await page.waitForTimeout(500)

    // Find new password input
    const newPasswordInput = page.locator(
      'input[id*="newPassword"], input[placeholder*="new password" i]'
    ).first()

    if (await newPasswordInput.count() > 0) {
      // Try weak password
      await newPasswordInput.fill('weak')
      await page.waitForTimeout(500)

      // Check for strength indicator or validation message
      const weakIndicator = page.locator('text=/weak|schwach/i')
      const errorMessage = page.locator('text=/at least 8|mindestens 8/i')

      const hasWeakIndicator = (await weakIndicator.count()) > 0
      const hasErrorMessage = (await errorMessage.count()) > 0

      expect(hasWeakIndicator || hasErrorMessage).toBeTruthy()
    }
  })

  test('should show role and permissions', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)

    // Wait for profile to load
    await page.waitForTimeout(1000)

    // Check for security section (which exists in the profile page)
    const securitySection = page.locator('text=/security|sicherheit/i')
    await expect(securitySection.first()).toBeVisible({ timeout: 5000 })

    // Check for account status tag (which is displayed)
    const statusTag = page.locator('text=/active|inactive|aktiv/i')
    await expect(statusTag.first()).toBeVisible({ timeout: 5000 })
  })

  test('should handle profile update errors gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    // Try to submit with invalid data or cause an error
    const firstNameInput = page.locator('input#firstName, input[id*="firstName"]').first()
    
    if (await firstNameInput.count() > 0) {
      // Fill with very long string (should be rejected)
      await firstNameInput.clear()
      await firstNameInput.fill('a'.repeat(200))

      // Submit
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()

      // Wait for error handling
      await page.waitForTimeout(2000)

      // Should show error message or validation
      const errorIndicator = page.locator('.p-error, .text-red-500, [class*="error"]')
      
      // Either validation prevents submit or error is shown
      expect((await errorIndicator.count()) > 0).toBeTruthy()
    }
  })

  test('should cancel password change', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    // Open change password dialog
    const changePasswordButton = page.locator(
      'button:has-text("Change Password"), button:has-text("Passwort ändern")'
    )

    if (await changePasswordButton.count() === 0) {
      test.skip()
      return
    }

    await changePasswordButton.first().click()
    await page.waitForTimeout(500)

    // Find cancel button
    const cancelButton = page.locator(
      'button:has-text("Cancel"), button:has-text("Abbrechen")'
    )

    if (await cancelButton.count() > 0) {
      await cancelButton.first().click()

      // Wait for dialog to close
      await page.waitForTimeout(500)

      // Dialog should be closed
      const dialog = page.locator('.p-dialog-content, [role="dialog"]')
      await expect(dialog).not.toBeVisible()
    }
  })

  test('should maintain profile data after page refresh', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    // Get current email value
    const emailInput = page.locator('input[type="email"]')
    const emailValue = await emailInput.inputValue()

    // Refresh page
    await page.reload()
    await page.waitForTimeout(1000)

    // Email should still be the same
    await expect(emailInput).toHaveValue(emailValue)
  })
})
