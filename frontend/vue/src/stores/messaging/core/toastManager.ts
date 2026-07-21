import type { ToastMessage } from '@/stores/messaging/messaging.types'
import type { ToastServiceMethods } from 'primevue/toastservice'

/**
 * ToastManager - PrimeVue Toast Integration
 *
 * Manages toast notifications using PrimeVue's ToastService.
 * This class acts as a wrapper around PrimeVue's toast functionality
 * with additional features like auto-removal tracking.
 */
export class ToastManager {
  private toasts: ToastMessage[] = []
  private nextId = 1
  private defaultLife: number
  private primeVueToast: ToastServiceMethods | null = null

  constructor(defaultLife: number = 5000) {
    this.defaultLife = defaultLife
  }

  /**
   * Set PrimeVue toast instance (injected from Vue app)
   */
  setPrimeVueToast(toast: ToastServiceMethods): void {
    this.primeVueToast = toast
  }

  /**
   * Show a toast notification
   */
  show(toast: Omit<ToastMessage, 'id'>): ToastMessage {
    const fullToast: ToastMessage = {
      id: this.nextId++,
      life: toast.sticky ? undefined : (toast.life ?? this.defaultLife),
      closable: toast.closable ?? true,
      ...toast,
    }

    this.toasts.push(fullToast)

    // Use PrimeVue toast if available
    if (this.primeVueToast) {
      this.primeVueToast.add({
        severity: fullToast.severity,
        summary: fullToast.summary,
        detail: fullToast.detail,
        life: fullToast.life,
        closable: fullToast.closable,
        group: fullToast.group,
      })
    }

    // Auto-remove after life expires (if not sticky)
    if (fullToast.life) {
      setTimeout(() => {
        this.remove(fullToast.id!)
      }, fullToast.life)
    }

    return fullToast
  }

  /**
   * Remove a specific toast
   */
  remove(id: number): boolean {
    const index = this.toasts.findIndex((t) => t.id === id)
    if (index !== -1) {
      this.toasts.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts = []
    if (this.primeVueToast) {
      this.primeVueToast.removeAllGroups()
    }
  }

  /**
   * Get all toasts
   */
  getAll(): ToastMessage[] {
    return [...this.toasts]
  }

  /**
   * Get toasts by severity
   */
  getBySeverity(severity: 'success' | 'info' | 'warn' | 'error'): ToastMessage[] {
    return this.toasts.filter((t) => t.severity === severity)
  }
}
