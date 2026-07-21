import { test, expect } from '@playwright/test'

test.describe('Practice Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should complete a practice session flow', async ({ page }) => {
    // Navigate to practice session
    await page.goto('/practice/session/test-exercise')

    // Wait for session to initialize
    await expect(page.locator('h1')).toContainText('Pronunciation Practice')

    // Check recording controls are visible
    await expect(page.locator('text=Start Recording')).toBeVisible()

    // Check session progress is visible
    await expect(page.locator('text=Progress')).toBeVisible()

    // Check item navigation is visible
    await expect(page.locator('text=Hello')).toBeVisible()

    // Start recording
    await page.click('button:has-text("Start Recording")')

    // Wait for recording indicator
    await expect(page.locator('.pi-stop')).toBeVisible()

    // Check recording duration is updating
    await page.waitForTimeout(2000)
    const durationText = await page.locator('text=/\\d+:\\d+/').textContent()
    expect(durationText).toMatch(/\d+:\d+/)

    // Navigate to next item
    await page.click('button:has-text("Next")')

    // Check current item changed
    await expect(page.locator('text=World')).toBeVisible()

    // Navigate to last item
    await page.click('button:has-text("Next")')

    // Mark complete
    await page.click('button:has-text("Mark Complete")')

    // Confirm completion
    await expect(page.locator('text=Complete Session?')).toBeVisible()
    await page.click('button:has-text("Yes, Complete")')

    // Wait for summary dialog
    await expect(page.locator('text=Session Complete!')).toBeVisible({ timeout: 10000 })

    // Check statistics are displayed
    await expect(page.locator('text=Total items practiced')).toBeVisible()
    await expect(page.locator('text=Total practice time')).toBeVisible()
  })

  test('should allow session abandonment', async ({ page }) => {
    await page.goto('/practice/session/test-exercise')

    // Wait for session to load
    await expect(page.locator('h1')).toContainText('Pronunciation Practice')

    // Start recording
    await page.click('button:has-text("Start Recording")')
    await page.waitForTimeout(1000)

    // Try to abandon
    await page.click('button:has-text("Abandon Session")')

    // Confirm abandon dialog
    await expect(page.locator('text=Abandon Session?')).toBeVisible()
    await expect(page.locator('text=unsaved progress')).toBeVisible()

    // Confirm abandonment
    await page.click('button:has-text("Yes, Abandon")')

    // Should redirect to exercises
    await expect(page).toHaveURL(/.*exercises/)
  })

  test('should navigate with keyboard shortcuts', async ({ page }) => {
    await page.goto('/practice/session/test-exercise')

    await expect(page.locator('text=Hello')).toBeVisible()

    // Press right arrow to go next
    await page.keyboard.press('ArrowRight')

    // Should show warning (item not complete)
    await expect(page.locator('text=Complete current item first')).toBeVisible()

    // Mark item as complete (simulate timestamp)
    // In real test, would need to record audio first

    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft')

    // Should stay on first item (can't go back from first)
    await expect(page.locator('text=Hello')).toBeVisible()
  })

  test('should show quality indicators during recording', async ({ page }) => {
    await page.goto('/practice/session/test-exercise')

    // Start recording
    await page.click('button:has-text("Start Recording")')

    // Wait for quality indicator
    await page.waitForTimeout(500)

    // Check quality elements are visible
    await expect(page.locator('text=Audio Quality')).toBeVisible()

    // Check quality bar exists
    const qualityBar = page.locator('.h-2.bg-gray-200')
    await expect(qualityBar).toBeVisible()
  })

  test('should handle permission denial gracefully', async ({ page }) => {
    // Block microphone permission
    await page.context().grantPermissions([])

    await page.goto('/practice/session/test-exercise')

    // Try to start recording
    await page.click('button:has-text("Start Recording")')

    // Should show permission error
    await expect(page.locator('text=Microphone Access Required')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Allow Microphone')).toBeVisible()
  })

  test('should display progress statistics correctly', async ({ page }) => {
    await page.goto('/practice/session/test-exercise')

    // Check initial progress
    await expect(page.locator('text=0%')).toBeVisible()
    await expect(page.locator('text=0 of')).toBeVisible()

    // Check statistics cards
    await expect(page.locator('text=Total')).toBeVisible()
    await expect(page.locator('text=Completed')).toBeVisible()
    await expect(page.locator('text=Duration')).toBeVisible()
    await expect(page.locator('text=Remaining')).toBeVisible()
  })

  test('should prevent navigation with unsaved progress', async ({ page }) => {
    await page.goto('/practice/session/test-exercise')

    // Start recording to create progress
    await page.click('button:has-text("Start Recording")')
    await page.waitForTimeout(1000)

    // Try to navigate back
    await page.click('button:has-text("Back")')

    // Should show abandon dialog
    await expect(page.locator('text=Abandon Session?')).toBeVisible()

    // Cancel
    await page.click('button:has-text("No, Continue")')

    // Should still be on practice page
    await expect(page.locator('h1')).toContainText('Pronunciation Practice')
  })

  test('should display item quick jump grid', async ({ page }) => {
    await page.goto('/practice/session/test-exercise')

    // Check quick jump grid exists
    const jumpGrid = page.locator('.grid.grid-cols-4')
    await expect(jumpGrid).toBeVisible()

    // Should have buttons for each item
    const itemButtons = jumpGrid.locator('button')
    const count = await itemButtons.count()
    expect(count).toBeGreaterThan(0)

    // First item should be highlighted (current)
    const firstButton = itemButtons.first()
    await expect(firstButton).toHaveClass(/border-blue-500/)
  })
})
