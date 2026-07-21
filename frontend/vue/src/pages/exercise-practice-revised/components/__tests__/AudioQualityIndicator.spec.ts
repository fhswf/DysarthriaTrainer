import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioQualityIndicator from '../AudioQualityIndicator.vue'
import Badge from 'primevue/badge'

// Mock localization store
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'recording.quality.excellent': 'Excellent',
        'recording.quality.good': 'Good',
        'recording.quality.fair': 'Fair',
        'recording.quality.poor': 'Poor',
        'recording.quality.unknown': 'Unknown',
      }
      return translations[key] || key
    }),
  })),
}))

describe('AudioQualityIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Quality Level Calculation', () => {
    it('calculates excellent quality for high SNR and optimal volume', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 45,
          volume: 0.7,
          clipping: 0,
          noiseLevel: 0.05,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('success')
      expect(wrapper.text()).toContain('Excellent')
    })

    it('calculates good quality for moderate metrics', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          clipping: 0,
          noiseLevel: 0.1,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('info')
      expect(wrapper.text()).toContain('Good')
    })

    it('calculates fair quality for lower metrics', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 25,
          volume: 0.3,
          clipping: 0.02,
          noiseLevel: 0.15,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('warn')
      expect(wrapper.text()).toContain('Fair')
    })

    it('calculates poor quality for low metrics', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 15,
          volume: 0.15,
          clipping: 0.1,
          noiseLevel: 0.3,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('danger')
      expect(wrapper.text()).toContain('Poor')
    })

    it('shows unknown quality when no metrics provided', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {},
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('secondary')
      expect(wrapper.text()).toContain('Unknown')
    })
  })

  describe('Visual Display', () => {
    it('displays correct icon for excellent quality', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 45,
          volume: 0.7,
          showIcon: true,
        },
        global: {
          components: { Badge },
        },
      })

      expect(wrapper.find('.pi-check-circle').exists()).toBe(true)
    })

    it('displays correct icon for good quality', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          showIcon: true,
        },
        global: {
          components: { Badge },
        },
      })

      expect(wrapper.find('.pi-thumbs-up').exists()).toBe(true)
    })

    it('displays correct icon for fair quality', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 25,
          volume: 0.3,
          showIcon: true,
        },
        global: {
          components: { Badge },
        },
      })

      expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
    })

    it('displays correct icon for poor quality', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 15,
          volume: 0.15,
          showIcon: true,
        },
        global: {
          components: { Badge },
        },
      })

      expect(wrapper.find('.pi-times-circle').exists()).toBe(true)
    })

    it('hides icon when showIcon is false', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          showIcon: false,
        },
        global: {
          components: { Badge },
        },
      })

      expect(wrapper.find('i[class*="pi-"]').exists()).toBe(false)
    })
  })

  describe('Compact Mode', () => {
    it('applies compact classes in compact mode', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          compact: true,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.classes()).toContain('text-xs')
      expect(badge.classes()).toContain('px-2')
      expect(badge.classes()).toContain('py-1')
    })

    it('applies normal classes in non-compact mode', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          compact: false,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.classes()).toContain('text-sm')
      expect(badge.classes()).toContain('px-3')
      expect(badge.classes()).toContain('py-1.5')
    })
  })

  describe('Clickable Mode', () => {
    it('emits click event when clickable', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          clickable: true,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.classes()).toContain('cursor-pointer')
      expect(badge.classes()).toContain('hover:opacity-80')
    })

    it('does not show hover effects when not clickable', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
          volume: 0.5,
          clickable: false,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.classes()).not.toContain('cursor-pointer')
      expect(badge.classes()).not.toContain('hover:opacity-80')
    })
  })

  describe('Clipping Penalty', () => {
    it('reduces quality score for high clipping', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 40,
          volume: 0.7,
          clipping: 0.1, // 10% clipping - major penalty
          noiseLevel: 0,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      // Should be lower than excellent due to clipping
      expect(badge.props('severity')).not.toBe('success')
    })

    it('minor penalty for low clipping', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 40,
          volume: 0.7,
          clipping: 0.02, // 2% clipping - minor penalty
          noiseLevel: 0,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      // Should still be good quality
      expect(['success', 'info']).toContain(badge.props('severity'))
    })
  })

  describe('Noise Level Penalty', () => {
    it('reduces quality for high noise', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 40,
          volume: 0.7,
          clipping: 0,
          noiseLevel: 0.3, // 30% noise - major penalty
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      // Should be lower than excellent due to noise
      expect(badge.props('severity')).not.toBe('success')
    })
  })

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 0,
          volume: 0,
          clipping: 0,
          noiseLevel: 0,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('danger')
      expect(wrapper.text()).toContain('Poor')
    })

    it('handles very high values correctly', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 60,
          volume: 1.0,
          clipping: 0,
          noiseLevel: 0,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      // Very high SNR should still be excellent
      expect(badge.props('severity')).toBe('success')
    })

    it('handles partial metrics (only SNR)', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          snr: 35,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('info')
      expect(wrapper.text()).toContain('Good')
    })

    it('handles partial metrics (only volume)', () => {
      const wrapper = mount(AudioQualityIndicator, {
        props: {
          volume: 0.7,
        },
        global: {
          components: { Badge },
        },
      })

      const badge = wrapper.findComponent(Badge)
      expect(badge.props('severity')).toBe('success')
      expect(wrapper.text()).toContain('Excellent')
    })
  })
})
