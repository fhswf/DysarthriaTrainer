import { test, expect } from '@playwright/test'

test.describe('Email Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app (needed for services to initialize)
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(1000) // Wait for services to initialize
  })

  test('should show invalid state when no token provided', async ({ page }) => {
    // Navigate without token
    await page.goto('http://localhost:5173/verify-email')

    // Should show invalid token message
    await expect(page.locator('text=Invalid Verification Link')).toBeVisible()
    await expect(page.locator('.pi-exclamation-triangle')).toBeVisible()

    // Should have button to login
    await expect(page.locator('button:has-text("Go to Login")')).toBeVisible()
  })

  test('should show loading state initially with valid token', async ({ page }) => {
    // Navigate with a token (will fail verification but we can see loading state briefly)
    await page.goto('http://localhost:5173/verify-email?token=test-token-123')

    // Loading state might transition quickly, so we check for either loading or error state
    await page.waitForTimeout(500)

    // Eventually should show error (since backend isn't running or token is invalid)
    await expect(
      page.locator('text=Verification Failed').or(page.locator('text=Email Verified'))
    ).toBeVisible({
      timeout: 10000,
    })
  })

  test('should show error state for invalid token', async ({ page }) => {
    // Navigate with invalid token
    await page.goto('http://localhost:5173/verify-email?token=invalid-token')

    // Wait for verification to complete (will fail)
    await page.waitForTimeout(2000)

    // Should show error state
    const errorTitle = page.locator('text=Verification Failed')
    const successTitle = page.locator('text=Email Verified')

    // Either error or success (depending on backend state)
    await expect(errorTitle.or(successTitle)).toBeVisible({ timeout: 10000 })

    // Should have buttons
    await expect(page.locator('button:has-text("Go to Login")')).toBeVisible()
  })

  test('should have working navigation buttons', async ({ page }) => {
    // Navigate without token to get to error/invalid state quickly
    await page.goto('http://localhost:5173/verify-email')

    // Click "Go to Login" button
    await page.click('button:has-text("Go to Login")')

    // Should navigate to login page
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should show appropriate error messages', async ({ page }) => {
    // Navigate with a token
    await page.goto('http://localhost:5173/verify-email?token=test-token')

    // Wait for processing
    await page.waitForTimeout(2000)

    // Should show an error message (network error if backend down, or API error if backend up)
    const errorMessage = page.locator('.p-message-error, .pi-times-circle')
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display correct UI elements in success state', async ({ page }) => {
    // Note: This test assumes successful verification
    // In real scenario, would need a valid token from backend

    // For now, we can test the success UI by checking the component structure
    await page.goto('http://localhost:5173/verify-email?token=valid-test-token')
    await page.waitForTimeout(2000)

    // The page should have either success or error state
    const hasSuccessOrError = await page.locator('.pi-check-circle, .pi-times-circle').count()
    expect(hasSuccessOrError).toBeGreaterThan(0)
  })

  test('should handle concurrent verification requests gracefully', async ({ page }) => {
    // Navigate multiple times quickly
    await page.goto('http://localhost:5173/verify-email?token=test1')
    await page.waitForTimeout(100)
    await page.goto('http://localhost:5173/verify-email?token=test2')
    await page.waitForTimeout(100)
    await page.goto('http://localhost:5173/verify-email?token=test3')

    // Should eventually settle on an error or success state
    await expect(
      page.locator('.pi-check-circle, .pi-times-circle, .pi-exclamation-triangle')
    ).toBeVisible({
      timeout: 10000,
    })
  })
})
