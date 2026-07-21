import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DevicePermissionPrompt from '../DevicePermissionPrompt.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

// Mock localization store
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'recording.permissions.title': 'Microphone Access Required',
        'recording.permissions.denied': 'Microphone access denied',
        'recording.permissions.prompt': 'Please grant microphone permission',
        'recording.permissions.deniedMessage': 'Enable microphone in browser settings',
        'recording.permissions.instructions': 'How to enable microphone:',
        'recording.permissions.step1': 'Step 1',
        'recording.permissions.step2': 'Step 2',
        'recording.permissions.step3': 'Step 3',
        'recording.permissions.privacyNotice': 'Your recordings are private',
        'recording.permissions.allow': 'Allow Microphone',
        'common.cancel': 'Cancel',
      }
      return translations[key] || key
    }),
  })),
}))

describe('DevicePermissionPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Permission States', () => {
    it('renders prompt state correctly', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.find('.pi-microphone').exists()).toBe(true)
      expect(wrapper.text()).toContain('Microphone Access Required')
      expect(wrapper.text()).toContain('Please grant microphone permission')
    })

    it('renders denied state with error styling', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'denied',
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.find('.pi-times-circle').exists()).toBe(true)
      expect(wrapper.find('.text-red-500').exists()).toBe(true)
      expect(wrapper.text()).toContain('Microphone access denied')
    })

    it('renders granted state with success styling', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'granted',
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.find('.pi-check-circle').exists()).toBe(true)
      expect(wrapper.find('.text-green-500').exists()).toBe(true)
    })

    it('renders checking state with spinner', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'checking',
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.find('.pi-spinner').exists()).toBe(true)
      expect(wrapper.find('.pi-spin').exists()).toBe(true)
      expect(wrapper.find('.text-blue-500').exists()).toBe(true)
    })
  })

  describe('Instructions Display', () => {
    it('shows instructions when showInstructions is true and denied', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'denied',
          showInstructions: true,
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.text()).toContain('How to enable microphone:')
      expect(wrapper.text()).toContain('Step 1')
      expect(wrapper.text()).toContain('Step 2')
      expect(wrapper.text()).toContain('Step 3')
    })

    it('hides instructions when showInstructions is false', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'denied',
          showInstructions: false,
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.text()).not.toContain('How to enable microphone:')
      expect(wrapper.text()).not.toContain('Step 1')
    })

    it('does not show instructions for non-denied states', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
          showInstructions: true,
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.text()).not.toContain('How to enable microphone:')
    })
  })

  describe('Custom Message', () => {
    it('displays custom message when provided', () => {
      const customMessage = 'Custom message for testing'
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
          customMessage,
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.text()).toContain(customMessage)
    })

    it('falls back to default message when no custom message', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
        },
        global: {
          components: { Card, Button },
        },
      })

      expect(wrapper.text()).toContain('Please grant microphone permission')
    })
  })

  describe('Privacy Notice', () => {
    it('always displays privacy notice', () => {
      const states: Array<'prompt' | 'denied' | 'granted' | 'checking'> = [
        'prompt',
        'denied',
        'granted',
        'checking',
      ]

      states.forEach((state) => {
        const wrapper = mount(DevicePermissionPrompt, {
          props: {
            permissionState: state,
          },
          global: {
            components: { Card, Button },
          },
        })

        expect(wrapper.text()).toContain('Your recordings are private')
        expect(wrapper.find('.pi-info-circle').exists()).toBe(true)
      })
    })
  })

  describe('Button Actions', () => {
    it('shows allow button in prompt state', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
        },
        global: {
          components: { Card, Button },
        },
      })

      const buttons = wrapper.findAllComponents(Button)
      const allowButton = buttons.find((b) => b.text() === 'Allow Microphone')
      expect(allowButton).toBeTruthy()
      expect(allowButton?.props('icon')).toBe('pi pi-microphone')
    })

    it('emits request-permission when allow button clicked', async () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
        },
        global: {
          components: { Card, Button },
        },
      })

      const buttons = wrapper.findAllComponents(Button)
      const allowButton = buttons.find((b) => b.text() === 'Allow Microphone')
      await allowButton?.trigger('click')

      expect(wrapper.emitted('request-permission')).toBeTruthy()
      expect(wrapper.emitted('request-permission')).toHaveLength(1)
    })

    it('shows dismiss button in non-granted states', () => {
      const states: Array<'prompt' | 'denied' | 'checking'> = ['prompt', 'denied', 'checking']

      states.forEach((state) => {
        const wrapper = mount(DevicePermissionPrompt, {
          props: {
            permissionState: state,
          },
          global: {
            components: { Card, Button },
          },
        })

        const buttons = wrapper.findAllComponents(Button)
        const dismissButton = buttons.find((b) => b.text() === 'Cancel')
        expect(dismissButton).toBeTruthy()
      })
    })

    it('emits dismiss when dismiss button clicked', async () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
        },
        global: {
          components: { Card, Button },
        },
      })

      const buttons = wrapper.findAllComponents(Button)
      const dismissButton = buttons.find((b) => b.text() === 'Cancel')
      await dismissButton?.trigger('click')

      expect(wrapper.emitted('dismiss')).toBeTruthy()
      expect(wrapper.emitted('dismiss')).toHaveLength(1)
    })

    it('hides action buttons in granted state', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'granted',
        },
        global: {
          components: { Card, Button },
        },
      })

      const buttons = wrapper.findAllComponents(Button)
      expect(buttons.length).toBe(0)
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator on allow button when checking', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'checking',
        },
        global: {
          components: { Card, Button },
        },
      })

      const buttons = wrapper.findAllComponents(Button)
      const allowButton = buttons.find((b) => b.props('loading'))
      expect(allowButton).toBeTruthy()
      expect(allowButton?.props('loading')).toBe(true)
    })

    it('disables allow button when checking', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'checking',
        },
        global: {
          components: { Card, Button },
        },
      })

      const buttons = wrapper.findAllComponents(Button)
      const allowButton = buttons.find((b) => b.props('disabled'))
      expect(allowButton).toBeTruthy()
      expect(allowButton?.props('disabled')).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('applies max-width constraint', () => {
      const wrapper = mount(DevicePermissionPrompt, {
        props: {
          permissionState: 'prompt',
        },
        global: {
          components: { Card, Button },
        },
      })

      const card = wrapper.findComponent(Card)
      expect(card.classes()).toContain('max-w-md')
      expect(card.classes()).toContain('mx-auto')
    })
  })
})
