/**
 * Component Configuration Composable
 *
 * Enables components to work independently with built-in defaults while
 * allowing centralized config to override settings.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useComponentConfig } from '@/composables/useComponentConfig';
 *
 * interface ExerciseCardConfig {
 *   theme: 'light' | 'dark';
 *   layout: 'card' | 'list';
 *   showActions: boolean;
 * }
 *
 * const { config, reload, update } = useComponentConfig<ExerciseCardConfig>({
 *   componentId: 'exercise-card',
 *   defaults: {
 *     theme: 'light',
 *     layout: 'card',
 *     showActions: true
 *   }
 * });
 * </script>
 * ```
 */

import { ref, readonly, onMounted, type Ref } from 'vue'
import { useConfigStore } from '@/stores/config'

/**
 * Options for configuring a component's config behavior
 */
export interface ComponentConfigOptions<T extends object> {
  /**
   * Unique identifier for the component (e.g., 'exercise-card', 'user-profile')
   * Used as key in global config: config.components[componentId]
   */
  componentId: string

  /**
   * Default configuration values for the component
   * Component will work with these values even if global config is unavailable
   */
  defaults: T

  /**
   * Optional localStorage key for component-specific persistence
   * If not provided, uses global config persistence only
   */
  storageKey?: string

  /**
   * Whether to auto-load config on mount (default: true)
   */
  autoLoad?: boolean
}

/**
 * Return value from useComponentConfig
 */
export interface UseComponentConfigReturn<T extends object> {
  /**
   * Readonly reactive config object
   * Merges: component defaults < global config < user overrides
   */
  config: Readonly<Ref<T>>

  /**
   * Reload configuration from all sources
   */
  reload: () => Promise<void>

  /**
   * Update component config (saved to global config)
   * @param partial - Partial config to merge with existing
   */
  update: (partial: Partial<T>) => Promise<void>

  /**
   * Reset to component defaults (clears overrides)
   */
  reset: () => Promise<void>

  /**
   * Check if config has been loaded
   */
  isLoaded: Readonly<Ref<boolean>>

  /**
   * Loading state
   */
  isLoading: Readonly<Ref<boolean>>

  /**
   * Error state (if config load failed)
   */
  error: Readonly<Ref<Error | null>>
}

/**
 * Deep merge utility for config objects
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>]
      } else {
        // Replace primitives, arrays, or null values
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }

  return result
}

/**
 * Composable for component-level configuration with global override support
 *
 * Implements config hierarchy:
 * 1. Component defaults (lowest priority)
 * 2. Global config override (from config store)
 * 3. User-specific override (future: from database)
 *
 * @param options - Configuration options
 * @returns Reactive config object and control methods
 */
export function useComponentConfig<T extends object>(
  options: ComponentConfigOptions<T>
): UseComponentConfigReturn<T> {
  const { componentId, defaults, storageKey, autoLoad = true } = options

  // Reactive state
  const config = ref<T>({ ...defaults }) as Ref<T>
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Global config store (lazy loaded to avoid circular dependencies)
  let configStore: ReturnType<typeof useConfigStore> | null = null

  /**
   * Get config store instance (lazy initialization)
   */
  const getConfigStore = () => {
    if (!configStore) {
      try {
        configStore = useConfigStore()
      } catch (err) {
        // Config store not available - component will use defaults
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn(
            `[useComponentConfig:${componentId}] Config store not available, using defaults`,
            err
          )
        }
      }
    }
    return configStore
  }

  /**
   * Load configuration from all sources
   */
  const loadConfig = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // Start with component defaults
      let mergedConfig = { ...defaults }

      // Try to get global config override
      const store = getConfigStore()
      if (store) {
        try {
          // Ensure config is initialized
          await store.initialize()

          // Get component-specific config from global store
          const globalOverride = await store.get<Partial<T>>(`components.${componentId}`)

          if (globalOverride) {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.debug(
                `[useComponentConfig:${componentId}] Applying global override`,
                globalOverride
              )
            }
            mergedConfig = deepMerge(mergedConfig, globalOverride)
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn(
              `[useComponentConfig:${componentId}] Failed to load global config, using defaults`,
              err
            )
          }
        }
      }

      // Optional: Load from component-specific localStorage
      if (storageKey) {
        try {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const parsedStored = JSON.parse(stored) as Partial<T>
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.debug(
                `[useComponentConfig:${componentId}] Applying localStorage override`,
                parsedStored
              )
            }
            mergedConfig = deepMerge(mergedConfig, parsedStored)
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn(
              `[useComponentConfig:${componentId}] Failed to load from localStorage`,
              err
            )
          }
        }
      }

      // Update config
      config.value = mergedConfig
      isLoaded.value = true

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug(
          `[useComponentConfig:${componentId}] Config loaded successfully`,
          mergedConfig
        )
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      // eslint-disable-next-line no-console
      console.error(`[useComponentConfig:${componentId}] Error loading config`, err)
      // Keep defaults on error
      config.value = { ...defaults }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update component configuration
   * Saves to global config store for persistence
   */
  const update = async (partial: Partial<T>): Promise<void> => {
    try {
      // Merge with current config
      const updatedConfig = deepMerge(config.value, partial)
      config.value = updatedConfig

      // Save to global config store
      const store = getConfigStore()
      if (store) {
        await store.initialize()
        await store.set(`components.${componentId}`, updatedConfig)
        await store.save()
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug(
            `[useComponentConfig:${componentId}] Config updated and saved`,
            updatedConfig
          )
        }
      }

      // Optional: Save to component-specific localStorage
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(updatedConfig))
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      // eslint-disable-next-line no-console
      console.error(`[useComponentConfig:${componentId}] Error updating config`, err)
      throw err
    }
  }

  /**
   * Reset to component defaults
   */
  const reset = async (): Promise<void> => {
    try {
      config.value = { ...defaults }

      // Clear from global config
      const store = getConfigStore()
      if (store) {
        await store.initialize()
        await store.set(`components.${componentId}`, undefined)
        await store.save()
      }

      // Clear from localStorage
      if (storageKey) {
        localStorage.removeItem(storageKey)
      }

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug(`[useComponentConfig:${componentId}] Config reset to defaults`)
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      // eslint-disable-next-line no-console
      console.error(`[useComponentConfig:${componentId}] Error resetting config`, err)
      throw err
    }
  }

  // Auto-load on mount if enabled
  if (autoLoad) {
    onMounted(() => {
      void loadConfig()
    })
  }

  return {
    config: readonly(config) as Readonly<Ref<T>>,
    reload: loadConfig,
    update,
    reset,
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    error: readonly(error),
  }
}

/**
 * Type guard to check if a value is a valid component config
 */
export function isValidComponentConfig<T extends object>(value: unknown, schema: T): value is T {
  if (!value || typeof value !== 'object') {
    return false
  }

  // Check if all required keys from schema exist
  const schemaKeys = Object.keys(schema)
  const valueKeys = Object.keys(value)

  return schemaKeys.every((key) => valueKeys.includes(key))
}
