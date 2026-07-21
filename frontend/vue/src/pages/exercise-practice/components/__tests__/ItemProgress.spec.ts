import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemProgress from '@/pages/exercise-practice/components/ItemProgress.vue'

describe('ItemProgress', () => {
  const createWrapper = (props = {}) => {
    return mount(ItemProgress, {
      props: {
        items: [
          { completed: true },
          { completed: true },
          { completed: false },
          { completed: false },
          { completed: false },
        ],
        currentIndex: 2,
        ...props,
      },
    })
  }

  describe('Rendering', () => {
    it('renders all progress items', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items).toHaveLength(5)
    })

    it('renders completed items with checkmark', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('pi-check')
    })

    it('renders current item with pulse animation', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('ring-animation')
    })

    it('renders item labels when showLabels is true', () => {
      const wrapper = createWrapper({
        items: [
          { completed: true, label: 'Item 1' },
          { completed: false, label: 'Item 2' },
        ],
        currentIndex: 1,
        showLabels: true,
      })

      expect(wrapper.text()).toContain('Item 1')
      expect(wrapper.text()).toContain('Item 2')
    })

    it('does not render labels when showLabels is false', () => {
      const wrapper = createWrapper({
        items: [
          { completed: true, label: 'Item 1' },
          { completed: false, label: 'Item 2' },
        ],
        currentIndex: 1,
        showLabels: false,
      })

      expect(wrapper.text()).not.toContain('Item 1')
      expect(wrapper.text()).not.toContain('Item 2')
    })

    it('renders summary when showSummary is true', () => {
      const wrapper = createWrapper({ showSummary: true })

      expect(wrapper.text()).toContain('2 / 5')
    })

    it('does not render summary when showSummary is false', () => {
      const wrapper = createWrapper({ showSummary: false })

      expect(wrapper.text()).not.toContain('2 / 5')
    })
  })

  describe('Item States', () => {
    it('applies green styling to completed items', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      // First two items are completed
      expect(items[0].html()).toContain('bg-green-500')
    })

    it('applies primary styling to current item', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      // Third item (index 2) is current
      expect(items[2].html()).toContain('bg-primary-500')
    })

    it('applies gray styling to incomplete items', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      // Last two items are incomplete
      expect(items[4].html()).toContain('bg-surface-300')
    })

    it('applies orange styling to skipped items', () => {
      const wrapper = createWrapper({
        items: [{ completed: false, skipped: true }, { completed: false }],
        currentIndex: 1,
      })
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[0].html()).toContain('bg-orange-500')
    })

    it('shows checkmark icon for completed items', () => {
      const wrapper = createWrapper({
        items: [{ completed: true }, { completed: false }],
        currentIndex: 1,
      })
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[0].html()).toContain('pi-check')
    })

    it('shows white dot for current item', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[2].html()).toContain('bg-white')
    })
  })

  describe('Connector Lines', () => {
    it('colors connector green when previous item is completed', () => {
      const wrapper = createWrapper()
      const connectors = wrapper.findAll('[data-test="connector"]')

      // Second connector (between item 1 and 2) should be green
      expect(connectors[1].html()).toContain('bg-green-500')
    })

    it('keeps connector gray when previous item is not completed', () => {
      const wrapper = createWrapper()
      const connectors = wrapper.findAll('[data-test="connector"]')

      // Third connector (between item 2 and 3) should be gray
      expect(connectors[2].html()).toContain('bg-surface-200')
    })

    it('renders correct number of connectors', () => {
      const wrapper = createWrapper()
      const connectors = wrapper.findAll('[data-test="connector"]')

      // Should have one less connector than items
      expect(connectors).toHaveLength(4)
    })
  })

  describe('Completed Count', () => {
    it('calculates completed count correctly', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('2 / 5')
    })

    it('handles all completed', () => {
      const wrapper = createWrapper({
        items: [{ completed: true }, { completed: true }, { completed: true }],
        currentIndex: 2,
        showSummary: true,
      })

      expect(wrapper.text()).toContain('3 / 3')
    })

    it('handles none completed', () => {
      const wrapper = createWrapper({
        items: [{ completed: false }, { completed: false }, { completed: false }],
        currentIndex: 0,
        showSummary: true,
      })

      expect(wrapper.text()).toContain('0 / 3')
    })
  })

  describe('Compact Mode', () => {
    it('renders smaller circles in compact mode', () => {
      const wrapper = createWrapper({ compact: true })
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[0].html()).toContain('w-3')
      expect(items[0].html()).toContain('h-3')
    })

    it('renders normal sized circles when not compact', () => {
      const wrapper = createWrapper({ compact: false })
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[0].html()).toContain('w-8')
      expect(items[0].html()).toContain('h-8')
    })
  })

  describe('Clickable Items', () => {
    it('emits item-click event when item is clicked', async () => {
      const wrapper = createWrapper({ clickable: true })
      const items = wrapper.findAll('[data-test="progress-item"]')

      await items[3].trigger('click')

      expect(wrapper.emitted('item-click')).toBeTruthy()
      expect(wrapper.emitted('item-click')?.[0]).toEqual([3])
    })

    it('does not emit event when clickable is false', async () => {
      const wrapper = createWrapper({ clickable: false })
      const items = wrapper.findAll('[data-test="progress-item"]')

      await items[3].trigger('click')

      expect(wrapper.emitted('item-click')).toBeFalsy()
    })

    it('applies hover effect when clickable', () => {
      const wrapper = createWrapper({ clickable: true })
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[0].html()).toContain('cursor-pointer')
    })

    it('does not apply hover effect when not clickable', () => {
      const wrapper = createWrapper({ clickable: false })
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items[0].html()).not.toContain('cursor-pointer')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      const wrapper = createWrapper({
        items: [],
        currentIndex: 0,
      })

      expect(wrapper.findAll('[data-test="progress-item"]')).toHaveLength(0)
    })

    it('handles single item', () => {
      const wrapper = createWrapper({
        items: [{ completed: false }],
        currentIndex: 0,
      })

      expect(wrapper.findAll('[data-test="progress-item"]')).toHaveLength(1)
      expect(wrapper.findAll('[data-test="connector"]')).toHaveLength(0)
    })

    it('handles currentIndex out of bounds gracefully', () => {
      const wrapper = createWrapper({
        items: [{ completed: true }, { completed: false }],
        currentIndex: 10,
      })

      // Should not crash
      expect(wrapper.findAll('[data-test="progress-item"]')).toHaveLength(2)
    })

    it('updates when items prop changes', async () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('2 / 5')

      await wrapper.setProps({
        items: [{ completed: true }, { completed: true }, { completed: true }],
      })

      expect(wrapper.text()).toContain('3 / 3')
    })
  })

  describe('Accessibility', () => {
    it('renders items with proper structure', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      expect(items.length).toBeGreaterThan(0)
    })

    it('includes visual indicators for different states', () => {
      const wrapper = createWrapper()

      // Completed: green with check
      expect(wrapper.html()).toContain('bg-green-500')
      // Current: primary with pulse
      expect(wrapper.html()).toContain('bg-primary-500')
      // Incomplete: gray
      expect(wrapper.html()).toContain('bg-surface-300')
    })
  })

  describe('Pulse Animation', () => {
    it('applies pulse animation to current item', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('ring-animation')
    })

    it('does not apply pulse animation to other items', () => {
      const wrapper = createWrapper()
      const items = wrapper.findAll('[data-test="progress-item"]')

      // Only the current item should have pulse
      const itemsWithPulse = items.filter((item) => item.html().includes('ring-animation'))

      expect(itemsWithPulse).toHaveLength(1)
    })
  })
})
