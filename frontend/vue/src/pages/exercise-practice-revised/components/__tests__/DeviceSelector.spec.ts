import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DeviceSelector from '@/pages/exercise-practice/components/DeviceSelector.vue'
import Dropdown from 'primevue/dropdown'
import Badge from 'primevue/badge'

// Mock localization store
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'recording.device.select': 'Select Microphone',
        'recording.device.none': 'No microphone found',
        'recording.device.default': 'Default Microphone',
        'recording.device.connected': 'Connected',
        'recording.device.disconnected': 'Disconnected',
      }
      return translations[key] || key
    }),
  })),
}))

describe('DeviceSelector', () => {
  const mockDevices: MediaDeviceInfo[] = [
    {
      deviceId: 'device1',
      groupId: 'group1',
      kind: 'audioinput',
      label: 'Built-in Microphone',
      toJSON: () => ({}),
    },
    {
      deviceId: 'device2',
      groupId: 'group2',
      kind: 'audioinput',
      label: 'USB Microphone',
      toJSON: () => ({}),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Device Enumeration', () => {
    it('displays list of available devices', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.exists()).toBe(true)
      expect(dropdown.props('options')).toHaveLength(2)
      expect(dropdown.props('options')[0].label).toBe('Built-in Microphone')
      expect(dropdown.props('options')[1].label).toBe('USB Microphone')
    })

    it('shows placeholder when no device is selected', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.props('placeholder')).toBe('Select Microphone')
    })

    it('uses default label for devices without labels', () => {
      const devicesWithoutLabels: MediaDeviceInfo[] = [
        {
          deviceId: 'device1',
          groupId: 'group1',
          kind: 'audioinput',
          label: '',
          toJSON: () => ({}),
        },
      ]

      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: devicesWithoutLabels,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.props('options')[0].label).toBe('Default Microphone')
    })
  })

  describe('Auto-Selection', () => {
    it('auto-selects first device when none selected', async () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['device1'])
    })

    it('prefers default device when available', async () => {
      const devicesWithDefault: MediaDeviceInfo[] = [
        ...mockDevices,
        {
          deviceId: 'default',
          groupId: 'group3',
          kind: 'audioinput',
          label: 'Default',
          toJSON: () => ({}),
        },
      ]

      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: devicesWithDefault,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['default'])
    })

    it('does not auto-select when device already selected', async () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: 'device1',
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      await wrapper.vm.$nextTick()

      // Should not emit update when already has value
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('Event Emissions', () => {
    it('emits update:modelValue on device selection', async () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: 'device1',
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      await dropdown.vm.$emit('update:model-value', 'device2')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['device2'])
    })

    it('emits select event with device ID and device info', async () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: 'device1',
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      await dropdown.vm.$emit('update:model-value', 'device2')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')?.[0][0]).toBe('device2')
      expect(wrapper.emitted('select')?.[0][1]).toEqual(mockDevices[1])
    })

    it('emits change event', async () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: 'device1',
          devices: mockDevices,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      await dropdown.vm.$emit('update:model-value', 'device2')

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')?.[0]).toEqual(['device2'])
    })
  })

  describe('States', () => {
    it('shows loading state', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: [],
          loading: true,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.props('loading')).toBe(true)

      const badge = wrapper.findComponent(Badge)
      expect(badge.exists()).toBe(true)
      expect(badge.props('value')).toBe('Detecting...')
      expect(badge.props('severity')).toBe('info')
    })

    it('shows disabled state', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: mockDevices,
          disabled: true,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.props('disabled')).toBe(true)
    })

    it('disables when no devices available', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: [],
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.props('disabled')).toBe(true)
    })
  })

  describe('Status Badge', () => {
    it('shows connected badge when device selected', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: 'device1',
          devices: mockDevices,
          compact: false,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.exists()).toBe(true)
      expect(badge.props('value')).toBe('Connected')
      expect(badge.props('severity')).toBe('success')
    })

    it('shows disconnected badge when no devices', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: [],
          loading: false,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('value')).toBe('Disconnected')
      expect(badge.props('severity')).toBe('danger')
    })

    it('hides badge in compact mode', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: 'device1',
          devices: mockDevices,
          compact: true,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.exists()).toBe(false)
    })
  })

  describe('Compact Mode', () => {
    it('applies compact mode classes', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: mockDevices,
          compact: true,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.classes()).toContain('min-w-[48px]')
    })

    it('applies normal width in non-compact mode', () => {
      const wrapper = mount(DeviceSelector, {
        props: {
          modelValue: null,
          devices: mockDevices,
          compact: false,
        },
        global: {
          components: { Dropdown, Badge },
        },
      })

      const dropdown = wrapper.findComponent(Dropdown)
      expect(dropdown.classes()).toContain('min-w-[200px]')
    })
  })
})
