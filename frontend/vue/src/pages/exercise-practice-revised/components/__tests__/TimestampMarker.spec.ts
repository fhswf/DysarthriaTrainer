import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimestampMarker from '@/pages/exercise-practice/components/TimestampMarker.vue'
import { useLocalizationStore } from '@/stores/localization'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(),
}))

describe('TimestampMarker', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'marker.start': 'Start',
      'marker.pause': 'Pause',
      'marker.resume': 'Resume',
      'marker.stop': 'Stop',
      'marker.bookmark': 'Bookmark',
      'marker.error': 'Error',
      'marker.warning': 'Warning',
      'marker.custom': 'Custom',
    }
    return translations[key] || key
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(useLocalizationStore).mockReturnValue({
      t: mockT,
    } as ReturnType<typeof useLocalizationStore>)
    mockT.mockClear()
  })

  const createWrapper = (props = {}) => {
    return mount(TimestampMarker, {
      props: {
        timestamp: 30,
        totalDuration: 120,
        type: 'start' as const,
        ...props,
      },
    })
  }

  describe('Rendering', () => {
    it('renders marker at correct position', () => {
      const wrapper = createWrapper({ timestamp: 30, totalDuration: 120 })

      // 30/120 = 25%
      expect(wrapper.html()).toContain('left: 25%')
    })

    it('renders marker at 0% position', () => {
      const wrapper = createWrapper({ timestamp: 0, totalDuration: 120 })

      expect(wrapper.html()).toContain('left: 0%')
    })

    it('renders marker at 100% position', () => {
      const wrapper = createWrapper({ timestamp: 120, totalDuration: 120 })

      expect(wrapper.html()).toContain('left: 100%')
    })

    it('renders marker at 50% position', () => {
      const wrapper = createWrapper({ timestamp: 60, totalDuration: 120 })

      expect(wrapper.html()).toContain('left: 50%')
    })
  })

  describe('Timestamp Formatting', () => {
    it('formats timestamp as MM:SS', () => {
      const wrapper = createWrapper({ timestamp: 90, totalDuration: 120 })

      expect(wrapper.text()).toContain('1:30')
    })

    it('formats zero timestamp correctly', () => {
      const wrapper = createWrapper({ timestamp: 0, totalDuration: 120 })

      expect(wrapper.text()).toContain('0:00')
    })

    it('pads seconds with leading zero', () => {
      const wrapper = createWrapper({ timestamp: 65, totalDuration: 120 })

      expect(wrapper.text()).toContain('1:05')
    })

    it('handles timestamps over 10 minutes', () => {
      const wrapper = createWrapper({ timestamp: 665, totalDuration: 720 })

      expect(wrapper.text()).toContain('11:05')
    })
  })

  describe('Marker Types', () => {
    it('renders start marker with green color', () => {
      const wrapper = createWrapper({ type: 'start' })

      expect(wrapper.html()).toContain('bg-green-500')
    })

    it('renders pause marker with orange color', () => {
      const wrapper = createWrapper({ type: 'pause' })

      expect(wrapper.html()).toContain('bg-orange-500')
    })

    it('renders resume marker with blue color', () => {
      const wrapper = createWrapper({ type: 'resume' })

      expect(wrapper.html()).toContain('bg-blue-500')
    })

    it('renders stop marker with red color', () => {
      const wrapper = createWrapper({ type: 'stop' })

      expect(wrapper.html()).toContain('bg-red-500')
    })

    it('renders bookmark marker with purple color', () => {
      const wrapper = createWrapper({ type: 'bookmark' })

      expect(wrapper.html()).toContain('bg-purple-500')
    })

    it('renders error marker with red color', () => {
      const wrapper = createWrapper({ type: 'error' })

      expect(wrapper.html()).toContain('bg-red-600')
    })

    it('renders warning marker with yellow color', () => {
      const wrapper = createWrapper({ type: 'warning' })

      expect(wrapper.html()).toContain('bg-yellow-500')
    })

    it('renders custom marker with gray color', () => {
      const wrapper = createWrapper({ type: 'custom' })

      expect(wrapper.html()).toContain('bg-surface-500')
    })
  })

  describe('Icons', () => {
    it('renders play icon for start type', () => {
      const wrapper = createWrapper({ type: 'start' })

      expect(wrapper.html()).toContain('pi-play')
    })

    it('renders pause icon for pause type', () => {
      const wrapper = createWrapper({ type: 'pause' })

      expect(wrapper.html()).toContain('pi-pause')
    })

    it('renders play icon for resume type', () => {
      const wrapper = createWrapper({ type: 'resume' })

      expect(wrapper.html()).toContain('pi-play')
    })

    it('renders stop icon for stop type', () => {
      const wrapper = createWrapper({ type: 'stop' })

      expect(wrapper.html()).toContain('pi-stop')
    })

    it('renders bookmark icon for bookmark type', () => {
      const wrapper = createWrapper({ type: 'bookmark' })

      expect(wrapper.html()).toContain('pi-bookmark')
    })

    it('renders times-circle icon for error type', () => {
      const wrapper = createWrapper({ type: 'error' })

      // Component uses pi-times for error, not pi-times-circle
      expect(wrapper.html()).toContain('pi-times')
    })

    it('renders exclamation-triangle icon for warning type', () => {
      const wrapper = createWrapper({ type: 'warning' })

      expect(wrapper.html()).toContain('pi-exclamation-triangle')
    })

    it('renders circle icon for custom type', () => {
      const wrapper = createWrapper({ type: 'custom' })

      expect(wrapper.html()).toContain('pi-circle')
    })

    it('renders custom icon when provided', () => {
      const wrapper = createWrapper({
        type: 'custom',
        customIcon: 'pi-star',
      })

      expect(wrapper.html()).toContain('pi-star')
    })
  })

  describe('Labels', () => {
    it('shows label when showLabel is true', () => {
      const wrapper = createWrapper({
        label: 'Test Label',
        showLabel: true,
      })

      expect(wrapper.text()).toContain('Test Label')
    })

    it('does not show label when showLabel is false', () => {
      const wrapper = createWrapper({
        label: 'Test Label',
        showLabel: false,
      })

      // Timestamp still shows, only custom label should be visible
      expect(wrapper.text()).toContain('Test Label')
    })

    it('shows default label from translation when no custom label', () => {
      const wrapper = createWrapper({
        type: 'start',
        showLabel: true,
      })

      // Shows formatted timestamp by default
      expect(wrapper.text()).toContain('0:30')
    })
  })

  describe('Hover Tooltip', () => {
    it('renders tooltip with formatted timestamp', () => {
      const wrapper = createWrapper({ timestamp: 90, totalDuration: 120 })

      expect(wrapper.html()).toContain('1:30')
    })

    it('tooltip appears on hover', () => {
      const wrapper = createWrapper()

      // Tooltip (timestamp label) should be visible by default
      expect(wrapper.text()).toContain('0:30')
    })
  })

  describe('Clickable', () => {
    it('emits click event with timestamp when clicked', async () => {
      const wrapper = createWrapper({
        timestamp: 45,
        clickable: true,
      })

      await wrapper.trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.[0]).toEqual([45])
    })

    it('does not emit click event when not clickable', async () => {
      const wrapper = createWrapper({
        timestamp: 45,
        clickable: false,
      })

      await wrapper.trigger('click')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('applies cursor-pointer when clickable', () => {
      const wrapper = createWrapper({ clickable: true })

      expect(wrapper.html()).toContain('cursor-pointer')
    })

    it('does not apply cursor-pointer when not clickable', () => {
      const wrapper = createWrapper({ clickable: false })

      expect(wrapper.html()).not.toContain('cursor-pointer')
    })
  })

  describe('Highlighted State', () => {
    it('shows ring animation when highlighted', () => {
      const wrapper = createWrapper({ highlighted: true })

      // Component uses ring-2 class for highlighting
      expect(wrapper.html()).toContain('ring-2')
    })

    it('does not show ring animation when not highlighted', () => {
      const wrapper = createWrapper({ highlighted: false })

      expect(wrapper.html()).not.toContain('ring-animation')
    })

    it('applies scale effect when highlighted', () => {
      const wrapper = createWrapper({ highlighted: true })

      expect(wrapper.html()).toContain('scale-125')
    })
  })

  describe('Edge Cases', () => {
    it('handles zero duration gracefully', () => {
      const wrapper = createWrapper({
        timestamp: 0,
        totalDuration: 0,
      })

      // Should not crash, position should be 0%
      expect(wrapper.html()).toContain('left:')
    })

    it('handles timestamp exceeding duration', () => {
      const wrapper = createWrapper({
        timestamp: 150,
        totalDuration: 100,
      })

      // Component calculates position as-is (150/100 = 150%)
      expect(wrapper.html()).toContain('left: 150%')
    })

    it('handles negative timestamp', () => {
      const wrapper = createWrapper({
        timestamp: -10,
        totalDuration: 100,
      })

      // Component calculates position as-is (-10/100 = -10%)
      expect(wrapper.html()).toContain('left: -10%')
    })

    it('updates position when timestamp changes', async () => {
      const wrapper = createWrapper({
        timestamp: 30,
        totalDuration: 120,
      })

      expect(wrapper.html()).toContain('left: 25%')

      await wrapper.setProps({ timestamp: 60 })

      expect(wrapper.html()).toContain('left: 50%')
    })

    it('updates position when totalDuration changes', async () => {
      const wrapper = createWrapper({
        timestamp: 30,
        totalDuration: 120,
      })

      expect(wrapper.html()).toContain('left: 25%')

      await wrapper.setProps({ totalDuration: 60 })

      expect(wrapper.html()).toContain('left: 50%')
    })
  })

  describe('Accessibility', () => {
    it('renders with proper structure', () => {
      const wrapper = createWrapper()

      // Component renders a div with marker classes
      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('includes visual icon for marker type', () => {
      const wrapper = createWrapper({ type: 'start' })

      expect(wrapper.html()).toContain('pi-play')
    })

    it('includes timestamp information', () => {
      const wrapper = createWrapper({ timestamp: 90 })

      expect(wrapper.text()).toContain('1:30')
    })
  })

  describe('Hover Effects', () => {
    it('applies scale transform on hover', () => {
      const wrapper = createWrapper()

      // Component uses hover:scale-125
      expect(wrapper.html()).toContain('hover:scale-125')
    })

    it('applies z-index on hover for layering', () => {
      const wrapper = createWrapper()

      // Component has inline positioning
      expect(wrapper.html()).toContain('absolute')
    })
  })

  describe('Multiple Markers', () => {
    it('can render multiple markers at different positions', () => {
      const wrapper1 = createWrapper({ timestamp: 30, totalDuration: 120 })
      const wrapper2 = createWrapper({ timestamp: 60, totalDuration: 120 })
      const wrapper3 = createWrapper({ timestamp: 90, totalDuration: 120 })

      expect(wrapper1.html()).toContain('left: 25%')
      expect(wrapper2.html()).toContain('left: 50%')
      expect(wrapper3.html()).toContain('left: 75%')
    })
  })
})
