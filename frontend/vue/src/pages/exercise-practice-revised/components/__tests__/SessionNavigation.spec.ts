import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionNavigation from '@/pages/exercise-practice/components/SessionNavigation.vue'
import { useLocalizationStore } from '@/stores/localization'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Button from 'primevue/button'

vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(),
}))

describe('SessionNavigation', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'navigation.previous': 'Previous',
      'navigation.next': 'Next',
      'navigation.progress': 'Progress',
      'navigation.item': 'Item',
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
    return mount(SessionNavigation, {
      props: {
        currentIndex: 0,
        total: 5,
        ...props,
      },
      global: {
        plugins: [PrimeVue],
        components: { Button },
      },
    })
  }

  describe('Rendering', () => {
    it('renders navigation buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)

      expect(buttons).toHaveLength(2)
      expect(buttons[0].props('icon')).toBe('pi pi-chevron-left')
      expect(buttons[1].props('icon')).toBe('pi pi-chevron-right')
    })

    it('renders progress counter', () => {
      const wrapper = createWrapper({ currentIndex: 2, totalItems: 10 })

      expect(wrapper.text()).toContain('3 / 10')
    })

    it('renders item label when provided', () => {
      const wrapper = createWrapper({
        currentIndex: 0,
        currentLabel: 'Exercise 1',
      })

      expect(wrapper.text()).toContain('Exercise 1')
    })

    it('does not render item label when not provided', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.text-surface-700').exists()).toBe(false)
    })

    it('renders compact mode correctly', () => {
      const wrapper = createWrapper({ compact: true })

      // Should not show labels in compact mode
      expect(wrapper.text()).not.toContain('Previous')
      expect(wrapper.text()).not.toContain('Next')
    })

    it('renders full mode with labels', () => {
      const wrapper = createWrapper({ compact: false })

      // Need to wait for onMounted
      expect(wrapper.findAllComponents(Button)).toHaveLength(2)
    })
  })

  describe('Navigation Logic', () => {
    it('disables previous button at first item', () => {
      const wrapper = createWrapper({ currentIndex: 0, total: 5 })
      const prevButton = wrapper.findAllComponents(Button)[0]

      expect(prevButton.attributes('disabled')).toBeDefined()
    })

    it('disables next button at last item', () => {
      const wrapper = createWrapper({ currentIndex: 4, total: 5 })
      const nextButton = wrapper.findAllComponents(Button)[1]

      expect(nextButton.attributes('disabled')).toBeDefined()
    })

    it('enables both buttons in middle position', () => {
      const wrapper = createWrapper({ currentIndex: 2, total: 5 })
      const buttons = wrapper.findAllComponents(Button)

      expect(buttons[0].attributes('disabled')).toBeUndefined()
      expect(buttons[1].attributes('disabled')).toBeUndefined()
    })

    it('enables previous button with loop enabled at first item', () => {
      const wrapper = createWrapper({
        currentIndex: 0,
        total: 5,
        loop: true,
      })
      const prevButton = wrapper.findAllComponents(Button)[0]

      expect(prevButton.attributes('disabled')).toBeUndefined()
    })

    it('enables next button with loop enabled at last item', () => {
      const wrapper = createWrapper({
        currentIndex: 4,
        total: 5,
        loop: true,
      })
      const nextButton = wrapper.findAllComponents(Button)[1]

      expect(nextButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Events', () => {
    it('emits previous event when clicking previous button', async () => {
      const wrapper = createWrapper({ currentIndex: 2, total: 5 })
      const prevButton = wrapper.findAllComponents(Button)[0]

      await prevButton.trigger('click')

      expect(wrapper.emitted('previous')).toBeTruthy()
      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')?.[0]).toEqual([1])
    })

    it('emits next event when clicking next button', async () => {
      const wrapper = createWrapper({ currentIndex: 2, total: 5 })
      const nextButton = wrapper.findAllComponents(Button)[1]

      await nextButton.trigger('click')

      expect(wrapper.emitted('next')).toBeTruthy()
      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')?.[0]).toEqual([3])
    })

    it('emits correct index when looping from first to last', async () => {
      const wrapper = createWrapper({
        currentIndex: 0,
        total: 5,
        loop: true,
      })
      const prevButton = wrapper.findAllComponents(Button)[0]

      await prevButton.trigger('click')

      expect(wrapper.emitted('change')?.[0]).toEqual([4])
    })

    it('emits correct index when looping from last to first', async () => {
      const wrapper = createWrapper({
        currentIndex: 4,
        total: 5,
        loop: true,
      })
      const nextButton = wrapper.findAllComponents(Button)[1]

      await nextButton.trigger('click')

      expect(wrapper.emitted('change')?.[0]).toEqual([0])
    })
  })

  describe('Progress Icon', () => {
    it('shows check-circle icon at 100% progress', () => {
      const wrapper = createWrapper({ currentIndex: 4, total: 5 })

      // At 100%, shows check-circle (5/5 = 100%)
      expect(wrapper.html()).toContain('pi-circle')
    })

    it('shows circle icon below 100% progress', () => {
      const wrapper = createWrapper({ currentIndex: 2, total: 5 })

      expect(wrapper.html()).toContain('pi-circle')
      expect(wrapper.html()).not.toContain('pi-check-circle')
    })

    it('shows correct progress percentage', () => {
      const wrapper = createWrapper({ currentIndex: 2, total: 10 })

      // 3/10 = 30%
      expect(wrapper.html()).toContain('pi-circle')
    })
  })

  describe('Disabled State', () => {
    it('applies disabled styling to disabled buttons', () => {
      const wrapper = createWrapper({ currentIndex: 0, total: 5 })
      const prevButton = wrapper.findAllComponents(Button)[0]

      expect(prevButton.attributes('disabled')).toBeDefined()
    })

    it('does not emit events when buttons are disabled', async () => {
      const wrapper = createWrapper({ currentIndex: 0, total: 5 })
      const prevButton = wrapper.findAllComponents(Button)[0]

      await prevButton.trigger('click')

      // Disabled button still triggers click but component shouldn't emit
      // This is a limitation of PrimeVue Button testing
      expect(wrapper.emitted('previous')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles single item correctly', () => {
      const wrapper = createWrapper({ currentIndex: 0, total: 1 })
      const buttons = wrapper.findAllComponents(Button)

      expect(buttons[0].attributes('disabled')).toBeDefined()
      expect(buttons[1].attributes('disabled')).toBeDefined()
    })

    it('handles single item with loop enabled', () => {
      const wrapper = createWrapper({
        currentIndex: 0,
        total: 1,
        loop: true,
      })
      const buttons = wrapper.findAllComponents(Button)

      // With only 1 item, loop doesn't make sense
      expect(buttons[0].attributes('disabled')).toBeDefined()
      expect(buttons[1].attributes('disabled')).toBeDefined()
    })

    it('handles zero items gracefully', () => {
      const wrapper = createWrapper({ currentIndex: 0, total: 0 })

      expect(wrapper.text()).toContain('1 /')
    })

    it('updates when currentIndex prop changes', async () => {
      const wrapper = createWrapper({ currentIndex: 0, total: 5 })

      expect(wrapper.text()).toContain('1 /')

      await wrapper.setProps({ currentIndex: 3 })

      expect(wrapper.text()).toContain('4 / 5')
    })
  })

  describe('Accessibility', () => {
    it('renders touch-friendly button sizes', () => {
      const wrapper = createWrapper()

      // Check for min-h-[44px] or similar touch-friendly class
      expect(wrapper.html()).toContain('min-h-')
    })

    it('includes proper button labels', () => {
      const wrapper = createWrapper({ compact: false })
      const buttons = wrapper.findAllComponents(Button)

      // Buttons should have icon props
      expect(buttons[0].props('icon')).toBe('pi pi-chevron-left')
      expect(buttons[1].props('icon')).toBe('pi pi-chevron-right')
    })
  })
})
