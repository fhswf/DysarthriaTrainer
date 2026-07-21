/**
 * Login Debug Test
 * Detailed test with network monitoring to debug login issues
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Login Debug', () => {
  test('should capture network request details during login', async ({ page }) => {
    // Monitor all network requests
    const requests: Array<{
      url: string
      method: string
      headers: Record<string, string>
      postData: string | null
    }> = []
    const responses: Array<{
      url: string
      status: number
      statusText: string
      headers: Record<string, string>
      body: string
    }> = []

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
      })
    })

    page.on('response', async (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: response.ok()
          ? await response.text().catch(() => 'Unable to read body')
          : 'Error response',
      })
    })

    // Clear storage
    await page.context().clearCookies()

    // Navigate to login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    console.log('\n=== Initial page load complete ===\n')

    // Fill in login form
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'Admin123!')

    // Clear previous requests/responses
    requests.length = 0
    responses.length = 0

    // Submit form and wait a bit
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    // Filter for login requests
    const loginRequests = requests.filter((r) => r.url.includes('/auth/login'))
    const loginResponses = responses.filter((r) => r.url.includes('/auth/login'))

    console.log('\n=== LOGIN REQUESTS ===')
    loginRequests.forEach((req, i) => {
      console.log(`\nRequest ${i + 1}:`)
      console.log('URL:', req.url)
      console.log('Method:', req.method)
      console.log('Headers:', JSON.stringify(req.headers, null, 2))
      console.log('Body:', req.postData)
    })

    console.log('\n=== LOGIN RESPONSES ===')
    loginResponses.forEach((res, i) => {
      console.log(`\nResponse ${i + 1}:`)
      console.log('URL:', res.url)
      console.log('Status:', res.status, res.statusText)
      console.log('Headers:', JSON.stringify(res.headers, null, 2))
      console.log('Body (first 500 chars):', res.body.substring(0, 500))
    })

    // Check if we got a login request at all
    expect(loginRequests.length).toBeGreaterThan(0)

    // Check the login response
    if (loginResponses.length > 0) {
      const loginResponse = loginResponses[0]
      console.log('\n=== RESULT ===')
      console.log('Status:', loginResponse.status)

      if (loginResponse.status !== 200) {
        console.log('LOGIN FAILED!')
        console.log('Response body:', loginResponse.body)
      } else {
        console.log('LOGIN SUCCESSFUL!')
      }
    }

    // Log current URL
    console.log('\nCurrent URL after login:', page.url())
  })

  test('should compare browser request with curl request', async ({ page }) => {
    // First, let's see what the browser sends
    const capturedRequests: Array<{
      url: string
      method: string
      headers: Record<string, string>
      postData: string | null
    }> = []

    page.on('request', (request) => {
      if (request.url().includes('/auth/login')) {
        capturedRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
        })
      }
    })

    await page.context().clearCookies()
    await page.goto(`${BASE_URL}/login`)

    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'Admin123!')
    await page.click('button[type="submit"]')

    await page.waitForTimeout(2000)

    console.log('\n=== BROWSER REQUEST ===')
    if (capturedRequests.length > 0) {
      const browserRequest = capturedRequests[0]
      console.log('URL:', browserRequest.url)
      console.log('Method:', browserRequest.method)
      console.log('Content-Type:', browserRequest.headers['content-type'])
      console.log('Origin:', browserRequest.headers['origin'])
      console.log('Referer:', browserRequest.headers['referer'])
      console.log('Body:', browserRequest.postData)

      // Try to parse the body
      if (browserRequest.postData) {
        try {
          const bodyData = JSON.parse(browserRequest.postData)
          console.log('Parsed body:', JSON.stringify(bodyData, null, 2))
        } catch (_e) {
          console.log('Could not parse body as JSON')
        }
      }
    } else {
      console.log('No login request captured!')
    }

    // Add assertion to satisfy lint
    expect(capturedRequests.length).toBeGreaterThan(0)
  })

  test('should check API store initialization', async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    // Check if API config is correct by looking at the window location
    const windowInfo = await page.evaluate(() => {
      return {
        location: window.location.href,
        origin: window.location.origin,
      }
    })

    console.log('\n=== API Configuration ===')
    console.log('Window location:', windowInfo.location)
    console.log('Window origin:', windowInfo.origin)

    // Verify we're on the right page
    expect(windowInfo.location).toContain('/login')
    expect(windowInfo.origin).toBe(BASE_URL)
  })
})
