import type { BootstrapOptions, BootstrapResult, ServiceName } from './serviceTypes'
import { registerService, getRegistryStats } from './serviceRegistry'

/**
 * Bootstrap all services in the correct order
 * This should be called early in the application lifecycle (main.ts)
 */
export async function bootstrapServices(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const startTime = performance.now()
  const initializedServices: ServiceName[] = []
  const failedServices: string[] = []
  const errors: Error[] = []

  // eslint-disable-next-line no-console
  console.log('🚀 Starting service bootstrap...')
  // eslint-disable-next-line no-console
  console.log('Options:', options)

  try {
    // ==========================================
    // Phase 1: Core Services (no dependencies)
    // ==========================================
    // eslint-disable-next-line no-console
    console.log('\n📦 Phase 1: Core Services')

    // 1. Config Service (FIRST - others depend on it)
    try {
      const { useConfigStore } = await import('@/stores/config/index')
      const config = useConfigStore()
      await config.initialize()
      registerService('config', config)
      initializedServices.push('config')
      // eslint-disable-next-line no-console
      console.log('  ✅ Config Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ Config Service failed:', err)
      failedServices.push('config')
      errors.push(err as Error)
      throw err // Config is critical - fail fast
    }

    // 2. Messaging Service (independent, needed by others for notifications)
    try {
      const { useMessagingStore } = await import('@/stores/messaging/index')
      const messaging = useMessagingStore()
      await messaging.initialize()
      registerService('messaging', messaging)
      initializedServices.push('messaging')
      // eslint-disable-next-line no-console
      console.log('  ✅ Messaging Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ Messaging Service failed:', err)
      failedServices.push('messaging')
      errors.push(err as Error)
      // Messaging is important but not critical - continue bootstrap
    }

    // 3. Localization Service (independent, used by UI components)
    try {
      const { useLocalizationStore } = await import('@/stores/localization/index')
      const localization = useLocalizationStore()
      await localization.init()
      registerService('localization', localization)
      initializedServices.push('localization')
      // eslint-disable-next-line no-console
      console.log('  ✅ Localization Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ Localization Service failed:', err)
      failedServices.push('localization')
      errors.push(err as Error)
      // Localization is important but not critical - continue bootstrap
    }

    // ==========================================
    // Phase 2: Infrastructure Services
    // ==========================================
    // eslint-disable-next-line no-console
    console.log('\n📦 Phase 2: Infrastructure Services')

    // 4. API Service (depends on config for settings, used by error/auth)
    try {
      const { useApiStore } = await import('@/stores/api/index')
      const api = useApiStore()
      // Register the API service - it initializes lazily on first use
      registerService('api', api)
      initializedServices.push('api')
      // eslint-disable-next-line no-console
      console.log('  ✅ API Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ API Service failed:', err)
      failedServices.push('api')
      errors.push(err as Error)
      // API is important but not critical - continue bootstrap
    }

    // 5. Error Service (depends on messaging for notifications)
    try {
      const { useErrorStore } = await import('@/stores/error/index')
      const errorService = useErrorStore()
      await errorService.ensureInitialized()
      registerService('error', errorService)
      initializedServices.push('error')
      // eslint-disable-next-line no-console
      console.log('  ✅ Error Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ Error Service failed:', err)
      failedServices.push('error')
      errors.push(err as Error)
      // Error service is important but not critical - continue bootstrap
    }

    // 6. Validation Service (independent, used by forms)
    try {
      const { useValidationStore } = await import('@/stores/validation/index')
      const validation = useValidationStore()
      // Register the validation service - it initializes lazily on first use
      registerService('validation', validation)
      initializedServices.push('validation')
      // eslint-disable-next-line no-console
      console.log('  ✅ Validation Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ Validation Service failed:', err)
      failedServices.push('validation')
      errors.push(err as Error)
      // Validation service is not critical - continue bootstrap
    }

    // ==========================================
    // Phase 3: Auth Service
    // ==========================================
    // eslint-disable-next-line no-console
    console.log('\n📦 Phase 3: Auth Service')

    // 7. Auth Service (depends on api, messaging)
    try {
      const { useAuthStore } = await import('@/stores/auth/index')
      const auth = useAuthStore()

      // Skip session initialization if we're on the logout page
      // This prevents hanging when tokens are blacklisted/expired
      const isLogoutPage =
        typeof window !== 'undefined' &&
        (window.location.pathname === '/v2/logout' || window.location.pathname === '/logout')

      if (!isLogoutPage) {
        await auth.initializeSession()
      } else {
        // eslint-disable-next-line no-console
        console.log('  ⏭️  Skipping session initialization (logout page)')
      }

      registerService('auth', auth)
      initializedServices.push('auth')
      // eslint-disable-next-line no-console
      console.log('  ✅ Auth Service')
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('  ❌ Auth Service failed:', err)
      failedServices.push('auth')
      errors.push(err as Error)
      // Auth service is important but not critical - continue bootstrap
    }

    // ==========================================
    // Phase 4: Integration Services (Optional)
    // ==========================================
    // eslint-disable-next-line no-console
    console.log('\n📦 Phase 4: Integration Services')
    // eslint-disable-next-line no-console
    console.log('  ℹ️  No services implemented yet - ready for integration')

    // Future: API-Error Integration
    // Future: Mock API Integration (optional)
    // Future: Performance Integration (optional)
    // Future: DevTools Integration (development only)

    // ==========================================
    // Bootstrap Complete
    // ==========================================
    const duration = performance.now() - startTime
    const success = failedServices.length === 0

    // eslint-disable-next-line no-console
    console.log(`\n${'='.repeat(50)}`)
    // eslint-disable-next-line no-console
    console.log(`✅ Bootstrap ${success ? 'SUCCEEDED' : 'COMPLETED WITH ERRORS'}`)
    // eslint-disable-next-line no-console
    console.log(`   Initialized: ${initializedServices.length} services`)
    // eslint-disable-next-line no-console
    console.log(`   Failed: ${failedServices.length} services`)
    // eslint-disable-next-line no-console
    console.log(`   Duration: ${Math.round(duration)}ms`)
    // eslint-disable-next-line no-console
    console.log(`${'='.repeat(50)}\n`)

    if (failedServices.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('⚠️  Failed services:', failedServices)
    }

    return {
      success,
      initializedServices,
      failedServices,
      errors,
      duration,
    }
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('💥 Fatal error during bootstrap:', err)

    return {
      success: false,
      initializedServices,
      failedServices: ['FATAL_ERROR'],
      errors: [err as Error],
      duration: performance.now() - startTime,
    }
  }
}

/**
 * Cleanup all services (for testing or app teardown)
 */
export async function cleanupServices(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🧹 Cleaning up V2 services...')

  // Import registry
  const { default: registry } = await import('./serviceRegistry')

  // Get all services
  const services = registry.getAll()

  // Cleanup each service that has a cleanup method
  for (const [name, service] of services) {
    if (service && typeof service.cleanup === 'function') {
      try {
        await service.cleanup()
        // eslint-disable-next-line no-console
        console.log(`  ✅ Cleaned up: ${name}`)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`  ❌ Failed to cleanup ${name}:`, err)
      }
    }
  }

  // Clear the registry
  registry.clear()

  // eslint-disable-next-line no-console
  console.log('✅ All services cleaned up')
}

/**
 * Get bootstrap status (for debugging)
 */
export function getBootstrapStatus() {
  return getRegistryStats()
}
