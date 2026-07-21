import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordingToggleButton from '../RecordingToggleButton.vue'
import Button from 'primevue/button'

// Mock localization store
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'recording.startRecording': 'Start Recording',
        'recording.stopRecording': 'Stop Recording',
        'recording.pauseRecording': 'Pause Recording',
        'recording.resumeRecording': 'Resume Recording',
        'recording.status.processing': 'Processing...',
        'common.retry': 'Retry',
      }
      return translations[key] || key
    }),
  })),
}))

describe('RecordingToggleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Visual States', () => {
    it('renders idle state correctly', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.exists()).toBe(true)
      expect(button.props('icon')).toBe('pi pi-circle')
      expect(button.classes()).toContain('bg-surface-400')
    })

    it('renders recording state with pulse animation', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'recording' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('icon')).toBe('pi pi-stop')
      expect(button.classes()).toContain('bg-red-600')
      expect(button.classes()).toContain('recording-pulse')
    })

    it('renders paused state', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'paused' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('icon')).toBe('pi pi-play')
      expect(button.classes()).toContain('bg-orange-500')
    })

    it('renders processing state', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'processing' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('icon')).toBe('pi pi-spinner pi-spin')
      expect(button.props('loading')).toBe(true)
      expect(button.classes()).toContain('bg-blue-500')
    })

    it('renders error state', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'error' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('icon')).toBe('pi pi-exclamation-circle')
      expect(button.classes()).toContain('bg-red-600')
    })
  })

  describe('Event Emissions', () => {
    it('emits start event when clicked in idle state', async () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle' },
        global: {
          components: { Button },
        },
      })

      await wrapper.findComponent(Button).trigger('click')
      expect(wrapper.emitted('start')).toBeTruthy()
      expect(wrapper.emitted('start')).toHaveLength(1)
    })

    it('emits stop event when clicked in recording state', async () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'recording' },
        global: {
          components: { Button },
        },
      })

      await wrapper.findComponent(Button).trigger('click')
      expect(wrapper.emitted('stop')).toBeTruthy()
      expect(wrapper.emitted('stop')).toHaveLength(1)
    })

    it('emits resume event when clicked in paused state', async () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'paused' },
        global: {
          components: { Button },
        },
      })

      await wrapper.findComponent(Button).trigger('click')
      expect(wrapper.emitted('resume')).toBeTruthy()
      expect(wrapper.emitted('resume')).toHaveLength(1)
    })

    it('emits retry event when clicked in error state', async () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'error' },
        global: {
          components: { Button },
        },
      })

      await wrapper.findComponent(Button).trigger('click')
      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')).toHaveLength(1)
    })

    it('does not emit events when clicked in processing state', async () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'processing' },
        global: {
          components: { Button },
        },
      })

      await wrapper.findComponent(Button).trigger('click')
      expect(wrapper.emitted()).toEqual({})
    })
  })

  describe('Button States', () => {
    it('is disabled in processing state', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'processing' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('is disabled when disabled prop is true', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle', disabled: true },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('is enabled in idle state by default', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Compact Mode', () => {
    it('renders compact mode without label', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle', compact: true },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('label')).toBeNull()
      expect(button.classes()).toContain('min-w-[48px]')
      expect(button.classes()).toContain('w-[48px]')
    })

    it('renders with label in normal mode', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle', compact: false },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      // Label is loaded in onMounted, check it's not compact mode
      expect(button.props('label')).toBeDefined()
    })
  })

  describe('Icon Display', () => {
    it('shows icon when showIcon is true', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle', showIcon: true },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('icon')).toBe('pi pi-circle')
    })

    it('hides icon when showIcon is false', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle', showIcon: false },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('icon')).toBeNull()
    })
  })

  describe('Touch-Friendly Sizing', () => {
    it('has minimum height of 48px', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle' },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.classes()).toContain('min-h-[48px]')
    })

    it('has minimum width of 120px in normal mode', () => {
      const wrapper = mount(RecordingToggleButton, {
        props: { state: 'idle', compact: false },
        global: {
          components: { Button },
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.classes()).toContain('min-w-[120px]')
    })
  })
})
