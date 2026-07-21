import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionCompleteDialog from '@/pages/exercise-practice/components/SessionCompleteDialog.vue'
import { useLocalizationStore } from '@/stores/localization'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(),
}))

describe('SessionCompleteDialog', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'session.complete.title': 'Complete',
      'session.complete.congratulations': 'Congratulations!',
      'session.complete.message': 'You did it!',
      'session.complete.completed': 'Completed',
      'session.complete.duration': 'Duration',
      'session.complete.averageScore': 'Avg Score',
      'session.complete.quality': 'Quality',
      'session.complete.details': 'Details',
      'session.complete.totalRecordings': 'Total',
      'session.complete.retries': 'Retries',
      'session.complete.skipped': 'Skipped',
      'session.complete.averageAttempts': 'Avg Attempts',
      'session.complete.achievements': 'Achievements',
      'session.complete.nextSteps': 'Next Steps',
      'session.complete.nextStepsMessage': 'Next message',
      'session.complete.share': 'Share',
      'session.complete.review': 'Review',
      'common.close': 'Close',
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
    return mount(SessionCompleteDialog, {
      props: {
        visible: true,
        stats: {
          completed: 10,
          durationSeconds: 180,
        },
        ...props,
      },
      global: {
        plugins: [PrimeVue],
        components: { Dialog, Button },
      },
    })
  }

  describe('Rendering', () => {
    it('renders dialog when visible', () => {
      const wrapper = createWrapper()

      expect(wrapper.findComponent(Dialog).exists()).toBe(true)
    })

    it('renders success icon', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('pi-check-circle')
    })

    it('renders congratulations message', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Congratulations!')
    })

    it('renders basic statistics', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
        },
      })

      expect(wrapper.text()).toContain('10')
      expect(wrapper.text()).toContain('3:00')
    })
  })

  describe('Statistics Display', () => {
    it('displays completed count', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 15,
          durationSeconds: 120,
        },
      })

      expect(wrapper.text()).toContain('15')
    })

    it('displays average score when provided', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
          averageScore: 85,
        },
      })

      expect(wrapper.text()).toContain('85%')
    })

    it('displays quality rating when provided', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
          qualityRating: 'Excellent',
        },
      })

      expect(wrapper.text()).toContain('Excellent')
    })

    it('does not display score when not provided', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
        },
      })

      expect(wrapper.text()).not.toContain('%')
    })

    it('does not display quality when not provided', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
        },
      })

      // Should have 2 stat boxes (completed + duration) without score/quality
      const statBoxes = wrapper.findAll('[class*="bg-"][class*="-50"]')
      expect(statBoxes.length).toBeLessThan(4)
    })
  })

  describe('Duration Formatting', () => {
    it('formats duration under 1 minute', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 5,
          durationSeconds: 45,
        },
      })

      expect(wrapper.text()).toContain('45s')
    })

    it('formats duration in minutes and seconds', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 5,
          durationSeconds: 135,
        },
      })

      expect(wrapper.text()).toContain('2:15')
    })

    it('pads seconds with leading zero', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 5,
          durationSeconds: 65,
        },
      })

      expect(wrapper.text()).toContain('1:05')
    })

    it('handles zero duration', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 5,
          durationSeconds: 0,
        },
      })

      expect(wrapper.text()).toContain('0s')
    })
  })

  describe('Detailed Statistics', () => {
    it('shows detailed stats when enabled and data provided', () => {
      const wrapper = createWrapper({
        showDetailedStats: true,
        stats: {
          completed: 10,
          durationSeconds: 180,
          totalRecordings: 15,
          retries: 5,
          skipped: 2,
          averageAttempts: 1.5,
        },
      })

      expect(wrapper.text()).toContain('15') // total recordings
      expect(wrapper.text()).toContain('5') // retries
      expect(wrapper.text()).toContain('2') // skipped
      expect(wrapper.text()).toContain('1.5') // average attempts
    })

    it('does not show detailed stats when disabled', () => {
      const wrapper = createWrapper({
        showDetailedStats: false,
        stats: {
          completed: 10,
          durationSeconds: 180,
          totalRecordings: 15,
        },
      })

      expect(wrapper.text()).not.toContain('Total')
    })

    it('shows only provided detailed stats', () => {
      const wrapper = createWrapper({
        showDetailedStats: true,
        stats: {
          completed: 10,
          durationSeconds: 180,
          totalRecordings: 15,
          // No retries, skipped, or averageAttempts
        },
      })

      expect(wrapper.text()).toContain('15')
      // Should not show undefined stats
      const detailedStatsSection = wrapper.findAll('.bg-surface-50')
      expect(detailedStatsSection.length).toBe(1) // Only totalRecordings
    })
  })

  describe('Achievements', () => {
    it('shows achievements when enabled and provided', () => {
      const wrapper = createWrapper({
        showAchievements: true,
        achievements: [
          {
            icon: 'pi pi-star',
            title: 'Perfect Score',
            description: 'Got 100% on all items',
          },
          {
            icon: 'pi pi-bolt',
            title: 'Speed Demon',
            description: 'Completed in record time',
          },
        ],
      })

      expect(wrapper.text()).toContain('Perfect Score')
      expect(wrapper.text()).toContain('Speed Demon')
      expect(wrapper.html()).toContain('pi-star')
      expect(wrapper.html()).toContain('pi-bolt')
    })

    it('does not show achievements when disabled', () => {
      const wrapper = createWrapper({
        showAchievements: false,
        achievements: [
          {
            icon: 'pi pi-star',
            title: 'Perfect Score',
            description: 'Got 100%',
          },
        ],
      })

      expect(wrapper.text()).not.toContain('Perfect Score')
    })

    it('does not show achievements section when empty', () => {
      const wrapper = createWrapper({
        showAchievements: true,
        achievements: [],
      })

      expect(wrapper.html()).not.toContain('pi-trophy')
    })
  })

  describe('Next Steps', () => {
    it('shows next steps when enabled', () => {
      const wrapper = createWrapper({ showNextSteps: true })

      expect(wrapper.text()).toContain('Next Steps')
    })

    it('does not show next steps when disabled', () => {
      const wrapper = createWrapper({ showNextSteps: false })

      expect(wrapper.text()).not.toContain('Next Steps')
    })
  })

  describe('Buttons', () => {
    it('renders close button', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)

      const closeButton = buttons.find((b) => b.props('icon') === 'pi pi-check')
      expect(closeButton).toBeTruthy()
    })

    it('renders review button when enabled', () => {
      const wrapper = createWrapper({ showReviewButton: true })
      const buttons = wrapper.findAllComponents(Button)

      const reviewButton = buttons.find((b) => b.props('icon') === 'pi pi-eye')
      expect(reviewButton).toBeTruthy()
    })

    it('does not render review button when disabled', () => {
      const wrapper = createWrapper({ showReviewButton: false })
      const buttons = wrapper.findAllComponents(Button)

      const reviewButton = buttons.find((b) => b.props('icon') === 'pi pi-eye')
      expect(reviewButton).toBeFalsy()
    })

    it('renders share button when enabled', () => {
      const wrapper = createWrapper({ showShareButton: true })
      const buttons = wrapper.findAllComponents(Button)

      const shareButton = buttons.find((b) => b.props('icon') === 'pi pi-share-alt')
      expect(shareButton).toBeTruthy()
    })

    it('does not render share button when disabled', () => {
      const wrapper = createWrapper({ showShareButton: false })
      const buttons = wrapper.findAllComponents(Button)

      const shareButton = buttons.find((b) => b.props('icon') === 'pi pi-share-alt')
      expect(shareButton).toBeFalsy()
    })
  })

  describe('Events', () => {
    it('emits close event when close button clicked', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const closeButton = buttons.find((b) => b.props('icon') === 'pi pi-check')

      await closeButton?.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits review event when review button clicked', async () => {
      const wrapper = createWrapper({ showReviewButton: true })
      const buttons = wrapper.findAllComponents(Button)
      const reviewButton = buttons.find((b) => b.props('icon') === 'pi pi-eye')

      await reviewButton?.trigger('click')

      expect(wrapper.emitted('review')).toBeTruthy()
    })

    it('emits share event when share button clicked', async () => {
      const wrapper = createWrapper({ showShareButton: true })
      const buttons = wrapper.findAllComponents(Button)
      const shareButton = buttons.find((b) => b.props('icon') === 'pi pi-share-alt')

      await shareButton?.trigger('click')

      expect(wrapper.emitted('share')).toBeTruthy()
    })

    it('emits update:visible when dialog is closed', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const closeButton = buttons.find((b) => b.props('icon') === 'pi pi-check')

      await closeButton?.trigger('click')

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })
  })

  describe('Visibility', () => {
    it('shows dialog when visible prop is true', () => {
      const wrapper = createWrapper({ visible: true })

      expect(wrapper.findComponent(Dialog).props('visible')).toBe(true)
    })

    it('hides dialog when visible prop is false', () => {
      const wrapper = createWrapper({ visible: false })

      expect(wrapper.findComponent(Dialog).props('visible')).toBe(false)
    })

    it('updates visibility when prop changes', async () => {
      const wrapper = createWrapper({ visible: true })

      await wrapper.setProps({ visible: false })

      expect(wrapper.findComponent(Dialog).props('visible')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles very large numbers in stats', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 999,
          durationSeconds: 3599, // 59:59
        },
      })

      expect(wrapper.text()).toContain('999')
      expect(wrapper.text()).toContain('59:59')
    })

    it('handles zero completed items', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 0,
          durationSeconds: 60,
        },
      })

      expect(wrapper.text()).toContain('0')
    })

    it('handles empty achievements array', () => {
      const wrapper = createWrapper({
        showAchievements: true,
        achievements: [],
      })

      // Should not show achievements section
      expect(wrapper.html()).not.toContain('pi-trophy')
    })

    it('updates when stats prop changes', async () => {
      const wrapper = createWrapper({
        stats: {
          completed: 5,
          durationSeconds: 60,
        },
      })

      expect(wrapper.text()).toContain('5')

      await wrapper.setProps({
        stats: {
          completed: 10,
          durationSeconds: 120,
        },
      })

      expect(wrapper.text()).toContain('10')
    })
  })

  describe('Accessibility', () => {
    it('sets autofocus on close button', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const closeButton = buttons.find((b) => b.props('icon') === 'pi pi-check')

      expect(closeButton?.attributes('autofocus')).toBeDefined()
    })

    it('includes proper visual hierarchy', () => {
      const wrapper = createWrapper()

      // Should have check icon
      expect(wrapper.html()).toContain('pi-check-circle')
      // Should have colored stat boxes
      expect(wrapper.html()).toContain('bg-green-')
      expect(wrapper.html()).toContain('bg-blue-')
    })
  })

  describe('Grid Layout', () => {
    it('renders stats in grid layout', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
          averageScore: 85,
          qualityRating: 'Good',
        },
      })

      expect(wrapper.html()).toContain('grid')
      expect(wrapper.html()).toContain('grid-cols-')
    })

    it('adapts grid for fewer stats', () => {
      const wrapper = createWrapper({
        stats: {
          completed: 10,
          durationSeconds: 180,
        },
      })

      // Should still use grid layout
      expect(wrapper.html()).toContain('grid')
    })
  })
})
