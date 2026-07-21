import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getServiceAsync } from '@/services/serviceRegistry'
import type { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = []

// Automatically import all page components from the pages directory
const pagesContext = import.meta.glob('../pages/**/*.vue')

Object.keys(pagesContext).forEach((pagePath) => {
  const page = pagePath.match(/\.\/pages\/.+\/(?:app-?)?(.*)\.vue$/)

  const pageName = page && page.length > 1 ? page[1] : null

  if (pageName) {
    // Determine layout based on page name
    let layout = 'AppLayout'

    // Auth pages (login, register, forgot-password, etc.) use auth-layout
    const authPages = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email']
    if (authPages.includes(pageName.toLowerCase())) {
      layout = 'auth-layout'
    }

    // Dashboard and info pages use dashboard-layout (no navbar)
    const dashboardPages = [
      'dashboard',
      'profile',
      'training-profile',
      'exercise-practice',
      'exercise-selection',
      'about',
      'team',
      'license',
      'help',
      'contact',
      'terms',
      'privacy',
      'imprint',
    ]
    if (dashboardPages.includes(pageName.toLowerCase())) {
      layout = 'dashboard-layout'
    }

    // Determine if route requires authentication (all pages except auth pages)
    const requiresAuth = !authPages.includes(pageName.toLowerCase())

    const routerEntry: RouteRecordRaw = {
      path: `/${pageName.toLowerCase()}`,
      name: pageName,
      component: pagesContext[pagePath],
      props: true,
      meta: {
        layout,
        requiresAuth,
      },
    }

    routes.push(routerEntry)
  }
})

// Add practice session route with parameter
routes.push({
  path: '/practice/session/:exerciseId',
  name: 'practice-session',
  component: () => import('../pages/practice/PracticeSessionPage.vue'),
  props: true,
  meta: {
    layout: 'dashboard-layout',
    requiresAuth: true,
  },
})

// Add session analysis route with query parameter
routes.push({
  path: '/session-analysis',
  name: 'session-analysis',
  component: () => import('../pages/session-analysis/app-session-analysis.vue'),
  props: (route) => ({ sessionId: route.query.sessionId }),
  meta: {
    layout: 'dashboard-layout',
    requiresAuth: true,
  },
})

// Add session details route with query parameter
routes.push({
  path: '/session-details',
  name: 'session-details',
  component: () => import('../pages/session-details/SessionDetailsPage.vue'),
  props: (route) => ({ sessionId: route.query.sessionId }),
  meta: {
    layout: 'dashboard-layout',
    requiresAuth: true,
  },
})

// Add a default root route
routes.push({
  path: '/',
  name: 'home',
  redirect: '/dashboard',
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // If route doesn't require auth, allow access
  if (!requiresAuth) {
    next()
    return
  }

  // Check authentication status
  try {
    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth')
    const isAuthenticated = await auth.isAuthenticated()

    if (!isAuthenticated) {
      // Not authenticated, redirect to login with return URL
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    } else {
      // Authenticated, allow access
      next()
    }
  } catch (error) {
    console.error('Route guard error:', error)
    // On error, redirect to login to be safe
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})

export default router
