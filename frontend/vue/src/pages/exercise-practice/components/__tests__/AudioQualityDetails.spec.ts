import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioQualityDetails from '../AudioQualityDetails.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import AudioQualityIndicator from '../AudioQualityIndicator.vue'

// Mock localization store
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'recording.quality.details.title': 'Audio Quality Details',
        'recording.quality.details.overall': 'Overall Quality',
        'recording.quality.details.snr': 'Signal-to-Noise Ratio',
        'recording.quality.details.volume': 'Volume Level',
        'recording.quality.details.clipping': 'Clipping',
        'recording.quality.details.noise': 'Background Noise',
        'recording.quality.details.recommendations': 'Recommendations',
        'recording.quality.details.clickToExpand': 'Click to view details',
        'recording.quality.recommendations.moveCloser': 'Move closer to the microphone',
        'recording.quality.recommendations.reduceBackground': 'Reduce background noise',
        'recording.quality.recommendations.lowerVolume': 'Reduce microphone volume or speak softer',
        'recording.quality.recommendations.raiseVolume':
          'Increase microphone volume or speak louder',
        'recording.quality.recommendations.checkMicrophone':
          'Check microphone placement and settings',
      }
      return translations[key] || key
    }),
  })),
}))

describe('AudioQualityDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders card with header', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
          volume: 0.5,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.findComponent(Card).exists()).toBe(true)
      expect(wrapper.text()).toContain('Audio Quality Details')
    })

    it('displays overall quality indicator', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
          volume: 0.5,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Overall Quality')
      expect(wrapper.findComponent(AudioQualityIndicator).exists()).toBe(true)
    })
  })

  describe('SNR Metric Display', () => {
    it('displays SNR metric when provided', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35.7,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Signal-to-Noise Ratio')
      expect(wrapper.text()).toContain('35.7 dB')
    })

    it('shows green color for excellent SNR', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 45,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-green-500').exists()).toBe(true)
      expect(wrapper.find('.bg-green-500').exists()).toBe(true)
    })

    it('shows blue color for good SNR', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-blue-500').exists()).toBe(true)
      expect(wrapper.find('.bg-blue-500').exists()).toBe(true)
    })

    it('shows orange color for fair SNR', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 25,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-orange-500').exists()).toBe(true)
      expect(wrapper.find('.bg-orange-500').exists()).toBe(true)
    })

    it('shows red color for poor SNR', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 15,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-red-500').exists()).toBe(true)
      expect(wrapper.find('.bg-red-500').exists()).toBe(true)
    })

    it('hides SNR metric when not provided', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.5,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).not.toContain('Signal-to-Noise Ratio')
    })
  })

  describe('Volume Metric Display', () => {
    it('displays volume metric when provided', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.75,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Volume Level')
      expect(wrapper.text()).toContain('75%')
    })

    it('shows green color for optimal volume', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.7,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-green-500').exists()).toBe(true)
    })

    it('shows blue color for acceptable volume', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.5,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-blue-500').exists()).toBe(true)
    })
  })

  describe('Clipping Metric Display', () => {
    it('displays clipping metric when present', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          clipping: 0.03,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Clipping')
      expect(wrapper.text()).toContain('3.00%')
    })

    it('hides clipping metric when zero', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.5,
          clipping: 0,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).not.toContain('Clipping')
    })

    it('shows warning icon for clipping', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          clipping: 0.03,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
    })
  })

  describe('Noise Metric Display', () => {
    it('displays noise metric when provided', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          noiseLevel: 0.15,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Background Noise')
      expect(wrapper.text()).toContain('15%')
    })

    it('shows appropriate color based on noise level', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          noiseLevel: 0.05,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.find('.text-green-500').exists()).toBe(true)
    })
  })

  describe('Collapsible Behavior', () => {
    it('shows collapse button when collapsible', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
          collapsible: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      const collapseButton = wrapper
        .findAllComponents(Button)
        .find((b) => b.props('icon')?.includes('chevron'))
      expect(collapseButton).toBeTruthy()
    })

    it('toggles expanded state when collapse button clicked', async () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
          collapsible: true,
          initiallyExpanded: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Signal-to-Noise Ratio')

      const collapseButton = wrapper
        .findAllComponents(Button)
        .find((b) => b.props('icon')?.includes('chevron'))
      await collapseButton?.trigger('click')

      expect(wrapper.text()).toContain('Click to view details')
      expect(wrapper.text()).not.toContain('Signal-to-Noise Ratio')
    })

    it('starts collapsed when initiallyExpanded is false', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
          collapsible: true,
          initiallyExpanded: false,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Click to view details')
      expect(wrapper.text()).not.toContain('Signal-to-Noise Ratio')
    })

    it('hides collapse button when not collapsible', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
          collapsible: false,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      const collapseButton = wrapper
        .findAllComponents(Button)
        .find((b) => b.props('icon')?.includes('chevron'))
      expect(collapseButton).toBeFalsy()
    })
  })

  describe('Recommendations', () => {
    it('shows recommendations for low SNR', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 15,
          showRecommendations: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Recommendations')
      expect(wrapper.text()).toContain('Reduce background noise')
    })

    it('shows recommendations for low volume', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.2,
          showRecommendations: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Move closer to the microphone')
      expect(wrapper.text()).toContain('Increase microphone volume')
    })

    it('shows recommendations for high volume', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.97,
          showRecommendations: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Reduce microphone volume')
    })

    it('shows recommendations for high clipping', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          clipping: 0.08,
          showRecommendations: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Reduce microphone volume')
    })

    it('shows recommendations for high noise', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          noiseLevel: 0.25,
          showRecommendations: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).toContain('Reduce background noise')
      expect(wrapper.text()).toContain('Check microphone placement')
    })

    it('hides recommendations when showRecommendations is false', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 15,
          showRecommendations: false,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).not.toContain('Recommendations')
    })

    it('hides recommendations section when no issues detected', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 45,
          volume: 0.7,
          clipping: 0,
          noiseLevel: 0.05,
          showRecommendations: true,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      expect(wrapper.text()).not.toContain('Recommendations')
    })
  })

  describe('Progress Bars', () => {
    it('renders progress bar for SNR', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          snr: 35,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      const progressBars = wrapper.findAll('.bg-surface-100')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it('calculates correct width for volume progress bar', () => {
      const wrapper = mount(AudioQualityDetails, {
        props: {
          volume: 0.75,
        },
        global: {
          components: { Card, Button, AudioQualityIndicator },
        },
      })

      const progressBar = wrapper.find('.bg-surface-100 > div')
      expect(progressBar.attributes('style')).toContain('width: 75%')
    })
  })
})
