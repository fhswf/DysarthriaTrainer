import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordingStatusDisplay from '../RecordingStatusDisplay.vue'

// Mock localization store
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'recording.status.recording': 'Recording...',
        'recording.status.paused': 'Paused',
        'recording.status.stopped': 'Stopped',
        'recording.status.idle': 'Ready',
      }
      return translations[key] || key
    }),
  })),
}))

describe('RecordingStatusDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Duration Formatting', () => {
    it('formats duration correctly for seconds', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 45,
          fileSize: 1000,
          status: 'recording',
        },
      })

      expect(wrapper.text()).toContain('0:45')
    })

    it('formats duration correctly for minutes and seconds', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 125, // 2:05
          fileSize: 1000,
          status: 'recording',
        },
      })

      expect(wrapper.text()).toContain('2:05')
    })

    it('pads seconds with leading zero', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 63, // 1:03
          fileSize: 1000,
          status: 'recording',
        },
      })

      expect(wrapper.text()).toContain('1:03')
    })

    it('displays 0:00 for zero duration', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 0,
          fileSize: 0,
          status: 'idle',
        },
      })

      expect(wrapper.text()).toContain('0:00')
    })
  })

  describe('File Size Formatting', () => {
    it('formats file size in KB when less than 1024 KB', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 2560, // 2.5 KB
          status: 'recording',
          showFileSize: true,
        },
      })

      expect(wrapper.text()).toContain('2.5 KB')
    })

    it('formats file size in MB when >= 1024 KB', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 60,
          fileSize: 2621440, // 2.5 MB
          status: 'recording',
          showFileSize: true,
        },
      })

      expect(wrapper.text()).toContain('2.5 MB')
    })

    it('hides file size when showFileSize is false', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 2560,
          status: 'recording',
          showFileSize: false,
        },
      })

      expect(wrapper.text()).not.toContain('KB')
      expect(wrapper.text()).not.toContain('MB')
    })

    it('hides file size in compact mode', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 2560,
          status: 'recording',
          showFileSize: true,
          compact: true,
        },
      })

      expect(wrapper.text()).not.toContain('KB')
    })
  })

  describe('Status Indicators', () => {
    it('shows recording status with correct icon', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'recording',
        },
      })

      expect(wrapper.find('.pi-circle-fill').exists()).toBe(true)
      expect(wrapper.find('.text-red-500').exists()).toBe(true)
      expect(wrapper.text()).toContain('Recording...')
    })

    it('shows paused status with correct icon', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'paused',
        },
      })

      expect(wrapper.find('.pi-pause-circle').exists()).toBe(true)
      expect(wrapper.find('.text-orange-500').exists()).toBe(true)
      expect(wrapper.text()).toContain('Paused')
    })

    it('shows stopped status with correct icon', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'stopped',
        },
      })

      expect(wrapper.find('.pi-stop-circle').exists()).toBe(true)
      expect(wrapper.find('.text-gray-500').exists()).toBe(true)
      expect(wrapper.text()).toContain('Stopped')
    })

    it('shows idle status with correct icon', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 0,
          fileSize: 0,
          status: 'idle',
        },
      })

      expect(wrapper.find('.pi-circle').exists()).toBe(true)
      expect(wrapper.find('.text-surface-400').exists()).toBe(true)
      expect(wrapper.text()).toContain('Ready')
    })
  })

  describe('Animation', () => {
    it('applies pulse animation to recording status icon', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'recording',
        },
      })

      const icon = wrapper.find('.pi-circle-fill')
      expect(icon.classes()).toContain('animate-pulse')
    })

    it('does not apply pulse animation to paused status', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'paused',
        },
      })

      const icon = wrapper.find('.pi-pause-circle')
      expect(icon.classes()).not.toContain('animate-pulse')
    })
  })

  describe('Compact Mode', () => {
    it('applies compact layout classes', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'recording',
          compact: true,
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('flex-col')
      expect(container.classes()).toContain('gap-2')
    })

    it('applies normal layout in non-compact mode', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'recording',
          compact: false,
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('gap-3')
      expect(container.classes()).not.toContain('flex-col')
    })
  })

  describe('Visual Elements', () => {
    it('displays clock icon for duration', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'recording',
        },
      })

      expect(wrapper.find('.pi-clock').exists()).toBe(true)
    })

    it('displays save icon for file size when shown', () => {
      const wrapper = mount(RecordingStatusDisplay, {
        props: {
          duration: 10,
          fileSize: 1000,
          status: 'recording',
          showFileSize: true,
          compact: false,
        },
      })

      expect(wrapper.find('.pi-save').exists()).toBe(true)
    })
  })
})
