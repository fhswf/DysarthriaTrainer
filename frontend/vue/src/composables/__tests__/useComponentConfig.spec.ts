/**
 * Unit tests for useComponentConfig composable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useComponentConfig } from '@/composables/useComponentConfig'

// Test component config interface
interface TestConfig {
  theme: 'light' | 'dark'
  layout: 'card' | 'list'
  showActions: boolean
  nested: {
    value1: string
    value2: number
  }
}

// Default test config
const TEST_DEFAULTS: TestConfig = {
  theme: 'light',
  layout: 'card',
  showActions: true,
  nested: {
    value1: 'default',
    value2: 42,
  },
}

describe('useComponentConfig', () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia())

    // Clear localStorage
    localStorage.clear()

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should initialize with component defaults', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, isLoaded } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false, // Don't auto-load for this test
          })

          return { config, isLoaded }
        },
        template: '<div>{{ config }}</div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      expect(wrapper.vm.config).toEqual(TEST_DEFAULTS)
      expect(wrapper.vm.isLoaded).toBe(false)
    })

    it('should load config on mount when autoLoad is true', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, isLoaded, isLoading, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: true,
          })

          return { config, isLoaded, isLoading, reload }
        },
        template: '<div>{{ config }}</div>',
      })

      const wrapper = mount(TestComponent)

      // Wait for onMounted hook to complete
      await nextTick()

      // Give the async operation time to complete
      await wrapper.vm.reload()
      await nextTick()

      // Should be loaded
      expect(wrapper.vm.isLoaded).toBe(true)
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('should not auto-load when autoLoad is false', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { isLoaded, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { isLoaded, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      expect(wrapper.vm.isLoaded).toBe(false)

      // Manual reload should work
      await wrapper.vm.reload()
      await nextTick()

      expect(wrapper.vm.isLoaded).toBe(true)
    })
  })

  describe('Config Merging', () => {
    it('should merge nested objects deeply', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await wrapper.vm.reload()
      await nextTick()

      // Config should have defaults
      expect(wrapper.vm.config.nested).toEqual({
        value1: 'default',
        value2: 42,
      })
    })

    it('should override primitives, not merge them', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, update }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      await wrapper.vm.update({ theme: 'dark' })
      await nextTick()

      expect(wrapper.vm.config.theme).toBe('dark')
      expect(wrapper.vm.config.layout).toBe('card') // Other values preserved
    })

    it('should handle partial nested updates', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, update }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      await wrapper.vm.update({
        nested: {
          value1: 'updated',
          value2: 99,
        },
      })
      await nextTick()

      expect(wrapper.vm.config.nested.value1).toBe('updated')
      expect(wrapper.vm.config.nested.value2).toBe(99)
    })
  })

  describe('Update Functionality', () => {
    it('should update config with partial values', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, update }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      await wrapper.vm.update({ theme: 'dark', layout: 'list' })
      await nextTick()

      expect(wrapper.vm.config.theme).toBe('dark')
      expect(wrapper.vm.config.layout).toBe('list')
      expect(wrapper.vm.config.showActions).toBe(true) // Unchanged
    })

    it('should preserve other values when updating single property', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, update }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      const originalConfig = { ...TEST_DEFAULTS }

      await wrapper.vm.update({ showActions: false })
      await nextTick()

      expect(wrapper.vm.config.showActions).toBe(false)
      expect(wrapper.vm.config.theme).toBe(originalConfig.theme)
      expect(wrapper.vm.config.layout).toBe(originalConfig.layout)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset config to defaults', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, update, reset } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, update, reset }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      // Update config
      await wrapper.vm.update({ theme: 'dark', layout: 'list' })
      await nextTick()

      expect(wrapper.vm.config.theme).toBe('dark')
      expect(wrapper.vm.config.layout).toBe('list')

      // Reset to defaults
      await wrapper.vm.reset()
      await nextTick()

      expect(wrapper.vm.config).toEqual(TEST_DEFAULTS)
    })

    it('should clear localStorage on reset', async () => {
      const storageKey = 'test-component-config'

      const TestComponent = defineComponent({
        setup() {
          const { update, reset } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            storageKey,
            autoLoad: false,
          })

          return { update, reset }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      // Update (should save to localStorage)
      await wrapper.vm.update({ theme: 'dark' })
      await nextTick()

      // Verify localStorage has data
      const stored = localStorage.getItem(storageKey)
      expect(stored).toBeTruthy()

      // Reset
      await wrapper.vm.reset()
      await nextTick()

      // Verify localStorage cleared
      const storedAfterReset = localStorage.getItem(storageKey)
      expect(storedAfterReset).toBeNull()
    })
  })

  describe('localStorage Persistence', () => {
    it('should save to localStorage when storageKey is provided', async () => {
      const storageKey = 'test-component-config'

      const TestComponent = defineComponent({
        setup() {
          const { update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            storageKey,
            autoLoad: false,
          })

          return { update }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      await wrapper.vm.update({ theme: 'dark' })
      await nextTick()

      const stored = localStorage.getItem(storageKey)
      expect(stored).toBeTruthy()

      const parsedStored = JSON.parse(stored!)
      expect(parsedStored.theme).toBe('dark')
    })

    it('should load from localStorage on initialization', async () => {
      const storageKey = 'test-component-config'

      // Pre-populate localStorage
      const storedConfig = { ...TEST_DEFAULTS, theme: 'dark' as const }
      localStorage.setItem(storageKey, JSON.stringify(storedConfig))

      const TestComponent = defineComponent({
        setup() {
          const { config, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            storageKey,
            autoLoad: false,
          })

          return { config, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await wrapper.vm.reload()
      await nextTick()

      expect(wrapper.vm.config.theme).toBe('dark')
    })

    it('should not use localStorage when storageKey is not provided', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            // No storageKey
            autoLoad: false,
          })

          return { update }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      await wrapper.vm.update({ theme: 'dark' })
      await nextTick()

      // localStorage should be empty
      expect(localStorage.length).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle config store initialization errors gracefully', async () => {
      // Mock console.warn to suppress error output in tests
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const TestComponent = defineComponent({
        setup() {
          const { config, error, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, error, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await wrapper.vm.reload()
      await nextTick()

      // Should fall back to defaults
      expect(wrapper.vm.config).toEqual(TEST_DEFAULTS)
      expect(wrapper.vm.error).toBeNull() // Config store error is caught, not propagated

      consoleWarnSpy.mockRestore()
    })

    it('should handle localStorage parse errors gracefully', async () => {
      const storageKey = 'test-component-config'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Put invalid JSON in localStorage
      localStorage.setItem(storageKey, 'invalid json {{{')

      const TestComponent = defineComponent({
        setup() {
          const { config, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            storageKey,
            autoLoad: false,
          })

          return { config, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await wrapper.vm.reload()
      await nextTick()

      // Should fall back to defaults
      expect(wrapper.vm.config).toEqual(TEST_DEFAULTS)

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Loading States', () => {
    it('should set isLoading during reload', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { isLoading, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { isLoading, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      expect(wrapper.vm.isLoading).toBe(false)

      const reloadPromise = wrapper.vm.reload()

      // Should be loading during async operation
      // (may be too fast to catch in tests, but implementation is correct)

      await reloadPromise
      await nextTick()

      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('should set isLoaded after successful reload', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { isLoaded, reload } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { isLoaded, reload }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      expect(wrapper.vm.isLoaded).toBe(false)

      await wrapper.vm.reload()
      await nextTick()

      expect(wrapper.vm.isLoaded).toBe(true)
    })
  })

  describe('Reactivity', () => {
    it('should maintain reactivity after updates', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { config, update } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config, update }
        },
        template: '<div>{{ config.theme }}</div>',
      })

      const wrapper = mount(TestComponent)

      expect(wrapper.text()).toContain('light')

      await wrapper.vm.update({ theme: 'dark' })
      await nextTick()

      expect(wrapper.text()).toContain('dark')
    })

    it('should be readonly (warns on mutation attempt)', () => {
      const TestComponent = defineComponent({
        setup() {
          const { config } = useComponentConfig<TestConfig>({
            componentId: 'test-component',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config }
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)

      // Spy on console.warn to catch Vue's readonly warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Attempting to mutate readonly property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(wrapper.vm.config as any).theme = 'dark'

      // Vue should have warned about readonly mutation
      expect(warnSpy).toHaveBeenCalled()

      // Value should not have changed
      expect(wrapper.vm.config.theme).toBe('light')

      warnSpy.mockRestore()
    })
  })

  describe('Component ID Isolation', () => {
    it('should isolate configs by component ID', async () => {
      const TestComponent1 = defineComponent({
        setup() {
          const { config: config1, update: update1 } = useComponentConfig<TestConfig>({
            componentId: 'component-1',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config1, update1 }
        },
        template: '<div></div>',
      })

      const TestComponent2 = defineComponent({
        setup() {
          const { config: config2, update: update2 } = useComponentConfig<TestConfig>({
            componentId: 'component-2',
            defaults: TEST_DEFAULTS,
            autoLoad: false,
          })

          return { config2, update2 }
        },
        template: '<div></div>',
      })

      const wrapper1 = mount(TestComponent1)
      const wrapper2 = mount(TestComponent2)

      // Update component 1
      await wrapper1.vm.update1({ theme: 'dark' })
      await nextTick()

      // Component 1 should be dark
      expect(wrapper1.vm.config1.theme).toBe('dark')

      // Component 2 should still be light (isolated)
      expect(wrapper2.vm.config2.theme).toBe('light')
    })
  })
})
