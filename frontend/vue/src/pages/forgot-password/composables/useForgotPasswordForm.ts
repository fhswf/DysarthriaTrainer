/**
 * Forgot Password Form Composable
 *
 * Manages forgot password form state, validation, and submission logic.
 * Uses lazy initialization to prevent premature store/router access.
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApiStore } from '@/stores/api'
import { useMessagingStore } from '@/stores/messaging'
import { useLocalizationStore } from '@/stores/localization'
import * as yup from 'yup'
import { createAuthApiService } from '@/api/auth'

/**
 * Forgot Password Form Composable
 */
export function useForgotPasswordForm() {
  // Lazy initialization of services
  let router: ReturnType<typeof useRouter>
  let apiStore: ReturnType<typeof useApiStore>
  let messagingStore: ReturnType<typeof useMessagingStore>
  let localizationStore: ReturnType<typeof useLocalizationStore>

  const getRouter = () => {
    if (!router) router = useRouter()
    return router
  }

  const getApiStore = () => {
    if (!apiStore) apiStore = useApiStore()
    return apiStore
  }

  const getMessagingStore = () => {
    if (!messagingStore) messagingStore = useMessagingStore()
    return messagingStore
  }

  const getLocalizationStore = () => {
    if (!localizationStore) localizationStore = useLocalizationStore()
    return localizationStore
  }

  // Form state
  const email = ref('')
  const emailError = ref('')
  const formError = ref('')
  const isSubmitting = ref(false)
  const showSuccess = ref(false)

  /**
   * Email validation schema
   */
  const emailSchema = yup
    .string()
    .required('auth.forgotPassword.errors.emailRequired')
    .email('auth.forgotPassword.errors.invalidEmail')

  /**
   * Validate email field
   */
  const validateEmail = async (): Promise<boolean> => {
    emailError.value = ''

    try {
      await emailSchema.validate(email.value)
      return true
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const loc = getLocalizationStore()
        emailError.value = loc.t(error.message)
      }
      return false
    }
  }

  /**
   * Clear email error
   */
  const clearEmailError = () => {
    emailError.value = ''
    formError.value = ''
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (): Promise<void> => {
    // Validate email
    const isValid = await validateEmail()
    if (!isValid) {
      return
    }

    try {
      isSubmitting.value = true
      formError.value = ''

      // Get services
      const api = getApiStore()
      const messaging = getMessagingStore()
      const loc = getLocalizationStore()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authApi = createAuthApiService(api as any)

      // Call password reset request API
      await authApi.requestPasswordReset(email.value)

      // Success - show success state (generic message for security)
      showSuccess.value = true
      await messaging.success(loc.t('auth.forgotPassword.success.toast'))
    } catch {
      const loc = getLocalizationStore()

      // Always show generic success message (security: don't reveal if email exists)
      // Show success state regardless of backend response
      showSuccess.value = true
      await getMessagingStore().success(loc.t('auth.forgotPassword.success.toast'))
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Navigate to login page
   */
  const goToLogin = (): void => {
    void getRouter().push('/login')
  }

  /**
   * Navigate to register page
   */
  const goToRegister = (): void => {
    void getRouter().push('/register')
  }

  /**
   * Reset form to initial state
   */
  const resetForm = (): void => {
    email.value = ''
    emailError.value = ''
    formError.value = ''
    showSuccess.value = false
  }

  return {
    // State
    email,
    emailError,
    formError,
    isSubmitting,
    showSuccess,

    // Methods
    validateEmail,
    clearEmailError,
    handleSubmit,
    goToLogin,
    goToRegister,
    resetForm,
  }
}
