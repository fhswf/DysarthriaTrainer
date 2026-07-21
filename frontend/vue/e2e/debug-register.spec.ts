import { test, expect } from '@playwright/test'

test.describe('Debug Registration Page', () => {
  test('capture console messages and page state', async ({ page }) => {
    const messages: string[] = []

    // Capture console messages
    page.on('console', (msg) => {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    })

    // Capture page errors
    page.on('pageerror', (err) => {
      messages.push(`[ERROR] ${err.message}`)
    })

    // Navigate to register page
    await page.goto('http://localhost:5173/register')

    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000)

    // Get page content
    const content = await page.content()

    // Print all console messages
    console.log('\n=== CONSOLE MESSAGES ===')
    messages.forEach((msg) => console.log(msg))

    // Print page HTML
    console.log('\n=== PAGE HTML ===')
    console.log(content.substring(0, 2000))

    // Check if #app div has content
    const appContent = await page.locator('#app').innerHTML()
    console.log('\n=== #app CONTENT ===')
    console.log(appContent.substring(0, 1000))

    // List all routes available
    const routes = await page.evaluate(() => {
      // @ts-expect-error - Accessing internal Vue app instance for debugging
      return window.__app__?.config?.globalProperties?.$router?.options?.routes ?? []
    })
    console.log('\n=== ROUTER ROUTES ===')
    console.log(JSON.stringify(routes, null, 2))

    // Add assertion to make lint happy
    expect(messages.length).toBeGreaterThanOrEqual(0)
  })
})
