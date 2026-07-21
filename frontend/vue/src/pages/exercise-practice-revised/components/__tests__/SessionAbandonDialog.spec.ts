import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionAbandonDialog from '@/pages/exercise-practice/components/SessionAbandonDialog.vue'
import { useLocalizationStore } from '@/stores/localization'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(),
}))

describe('SessionAbandonDialog', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'session.abandon.title': 'Abandon Session',
      'session.abandon.confirmTitle': 'Are you sure?',
      'session.abandon.confirmMessage': 'Really abandon?',
      'session.abandon.progressInfo': 'Progress',
      'session.abandon.completedItems': 'Completed',
      'session.abandon.unsavedWarning': 'Unsaved',
      'session.abandon.unsavedMessage': 'Unsaved message',
      'session.abandon.consequences': 'Consequences:',
      'session.abandon.loseProgress': 'Lose progress',
      'session.abandon.loseRecordings': 'Lose recordings',
      'session.abandon.noScore': 'No score',
      'session.abandon.saveAlternative': 'Save alternative',
      'session.abandon.keepWorking': 'Keep Working',
      'session.abandon.saveAndExit': 'Save & Exit',
      'session.abandon.abandonButton': 'Abandon',
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
    return mount(SessionAbandonDialog, {
      props: {
        visible: true,
        itemsCompleted: 3,
        totalItems: 10,
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

    it('renders warning icon', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('pi-exclamation-triangle')
    })

    it('renders warning message', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Are you sure?')
    })

    it('renders progress information', () => {
      const wrapper = createWrapper({
        itemsCompleted: 5,
        totalItems: 10,
      })

      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('10')
    })

    it('does not render progress info when no items completed', () => {
      const wrapper = createWrapper({
        itemsCompleted: 0,
        totalItems: 10,
      })

      // Progress section should not appear
      expect(wrapper.findAll('.bg-blue-50')).toHaveLength(0)
    })
  })

  describe('Progress Display', () => {
    it('displays completed items count', () => {
      const wrapper = createWrapper({
        itemsCompleted: 3,
        totalItems: 10,
      })

      expect(wrapper.text()).toContain('3 / 10')
    })

    it('displays progress bar', () => {
      const wrapper = createWrapper({
        itemsCompleted: 3,
        totalItems: 10,
      })

      expect(wrapper.html()).toContain('width: 30%')
    })

    it('calculates 0% progress correctly', () => {
      const wrapper = createWrapper({
        itemsCompleted: 0,
        totalItems: 10,
      })

      expect(wrapper.html()).not.toContain('width: 0%')
    })

    it('calculates 50% progress correctly', () => {
      const wrapper = createWrapper({
        itemsCompleted: 5,
        totalItems: 10,
      })

      expect(wrapper.html()).toContain('width: 50%')
    })

    it('calculates 100% progress correctly', () => {
      const wrapper = createWrapper({
        itemsCompleted: 10,
        totalItems: 10,
      })

      expect(wrapper.html()).toContain('width: 100%')
    })

    it('handles zero total items gracefully', () => {
      const wrapper = createWrapper({
        itemsCompleted: 0,
        totalItems: 0,
      })

      // Should not crash
      expect(wrapper.findComponent(Dialog).exists()).toBe(true)
    })
  })

  describe('Unsaved Recordings Warning', () => {
    it('shows unsaved warning when hasUnsavedRecordings is true', () => {
      const wrapper = createWrapper({
        hasUnsavedRecordings: true,
      })

      expect(wrapper.html()).toContain('bg-red-50')
      expect(wrapper.html()).toContain('pi-exclamation-circle')
    })

    it('does not show unsaved warning when false', () => {
      const wrapper = createWrapper({
        hasUnsavedRecordings: false,
      })

      expect(wrapper.findAll('.bg-red-50')).toHaveLength(0)
    })

    it('includes unsaved recordings in consequences', () => {
      const wrapper = createWrapper({
        hasUnsavedRecordings: true,
      })

      expect(wrapper.text()).toContain('Lose recordings')
    })

    it('does not show recording consequence when no unsaved', () => {
      const wrapper = createWrapper({
        hasUnsavedRecordings: false,
      })

      expect(wrapper.text()).not.toContain('Lose recordings')
    })
  })

  describe('Consequences List', () => {
    it('always shows lose progress consequence', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Lose progress')
    })

    it('always shows no score consequence', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('No score')
    })

    it('shows lose recordings when applicable', () => {
      const wrapper = createWrapper({
        hasUnsavedRecordings: true,
      })

      expect(wrapper.text()).toContain('Lose recordings')
    })

    it('renders consequences with X icons', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('pi-times-circle')
    })
  })

  describe('Save Alternative', () => {
    it('shows save alternative when enabled', () => {
      const wrapper = createWrapper({
        showSaveOption: true,
      })

      expect(wrapper.text()).toContain('Save alternative')
    })

    it('does not show save alternative when disabled', () => {
      const wrapper = createWrapper({
        showSaveOption: false,
      })

      expect(wrapper.text()).not.toContain('Save alternative')
    })
  })

  describe('Buttons', () => {
    it('renders keep working button', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)

      const keepButton = buttons.find((b) => b.props('icon') === 'pi pi-arrow-left')
      expect(keepButton).toBeTruthy()
    })

    it('renders abandon button', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)

      const abandonButton = buttons.find((b) => b.props('severity') === 'danger')
      expect(abandonButton).toBeTruthy()
    })

    it('renders save and exit button when enabled', () => {
      const wrapper = createWrapper({
        showSaveButton: true,
      })
      const buttons = wrapper.findAllComponents(Button)

      const saveButton = buttons.find((b) => b.props('icon') === 'pi pi-save')
      expect(saveButton).toBeTruthy()
    })

    it('does not render save button when disabled', () => {
      const wrapper = createWrapper({
        showSaveButton: false,
      })
      const buttons = wrapper.findAllComponents(Button)

      const saveButton = buttons.find((b) => b.props('icon') === 'pi pi-save')
      expect(saveButton).toBeFalsy()
    })

    it('sets danger severity on abandon button', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)

      const abandonButton = buttons.find((b) => b.props('severity') === 'danger')
      expect(abandonButton?.props('severity')).toBe('danger')
      expect(abandonButton?.props('outlined')).toBe(true)
    })
  })

  describe('Events', () => {
    it('emits cancel event when keep working clicked', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const keepButton = buttons.find((b) => b.props('icon') === 'pi pi-arrow-left')

      await keepButton?.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('emits confirm event when abandon clicked', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const abandonButton = buttons.find((b) => b.props('severity') === 'danger')

      await abandonButton?.trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
    })

    it('emits save-and-exit event when save clicked', async () => {
      const wrapper = createWrapper({
        showSaveButton: true,
      })
      const buttons = wrapper.findAllComponents(Button)
      const saveButton = buttons.find((b) => b.props('icon') === 'pi pi-save')

      await saveButton?.trigger('click')

      expect(wrapper.emitted('save-and-exit')).toBeTruthy()
    })

    it('emits update:visible when dialog is closed', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const keepButton = buttons.find((b) => b.props('icon') === 'pi pi-arrow-left')

      await keepButton?.trigger('click')

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })
  })

  describe('Dialog Properties', () => {
    it('sets modal to true', () => {
      const wrapper = createWrapper()
      const dialog = wrapper.findComponent(Dialog)

      expect(dialog.props('modal')).toBe(true)
    })

    it('disables close button', () => {
      const wrapper = createWrapper()
      const dialog = wrapper.findComponent(Dialog)

      expect(dialog.props('closable')).toBe(false)
    })

    it('disables dismissable mask', () => {
      const wrapper = createWrapper()
      const dialog = wrapper.findComponent(Dialog)

      expect(dialog.props('dismissableMask')).toBe(false)
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
    it('handles single completed item', () => {
      const wrapper = createWrapper({
        itemsCompleted: 1,
        totalItems: 1,
      })

      expect(wrapper.text()).toContain('1 / 1')
      expect(wrapper.html()).toContain('width: 100%')
    })

    it('handles no completed items', () => {
      const wrapper = createWrapper({
        itemsCompleted: 0,
        totalItems: 10,
      })

      // Progress info should not show
      expect(wrapper.findAll('.bg-blue-50')).toHaveLength(0)
    })

    it('handles large numbers', () => {
      const wrapper = createWrapper({
        itemsCompleted: 999,
        totalItems: 1000,
      })

      expect(wrapper.text()).toContain('999')
      expect(wrapper.text()).toContain('1000')
    })

    it('updates when props change', async () => {
      const wrapper = createWrapper({
        itemsCompleted: 3,
        totalItems: 10,
      })

      expect(wrapper.html()).toContain('width: 30%')

      await wrapper.setProps({
        itemsCompleted: 5,
        totalItems: 10,
      })

      expect(wrapper.html()).toContain('width: 50%')
    })
  })

  describe('Accessibility', () => {
    it('sets autofocus on keep working button', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAllComponents(Button)
      const keepButton = buttons.find((b) => b.props('icon') === 'pi pi-arrow-left')

      expect(keepButton?.attributes('autofocus')).toBeDefined()
    })

    it('uses distinct colors for different message types', () => {
      const wrapper = createWrapper({
        itemsCompleted: 3,
        hasUnsavedRecordings: true,
        showSaveOption: true,
      })

      // Info (blue), Danger (red), Tip (green)
      expect(wrapper.html()).toContain('bg-blue-50')
      expect(wrapper.html()).toContain('bg-red-50')
      expect(wrapper.html()).toContain('bg-green-50')
    })

    it('includes proper icon indicators', () => {
      const wrapper = createWrapper({
        hasUnsavedRecordings: true,
      })

      // Warning, info, danger icons
      expect(wrapper.html()).toContain('pi-exclamation-triangle')
      expect(wrapper.html()).toContain('pi-info-circle')
      expect(wrapper.html()).toContain('pi-exclamation-circle')
    })
  })

  describe('Button Layout', () => {
    it('renders buttons in correct layout', () => {
      const wrapper = createWrapper({
        showSaveButton: true,
      })
      const buttons = wrapper.findAllComponents(Button)

      // Should have 3 buttons: keep working, save & exit, abandon
      expect(buttons).toHaveLength(3)
    })

    it('uses flex layout for button groups', () => {
      const wrapper = createWrapper()

      expect(wrapper.html()).toContain('flex')
      expect(wrapper.html()).toContain('gap-3')
    })
  })
})
