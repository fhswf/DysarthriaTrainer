/**
 * Login Form Composable
 * Handles login form state, validation, and submission
 */

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApiStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { useMessagingStore } from '@/stores/messaging'
import { useLocalizationStore } from '@/stores/localization'
import { createAuthApiService } from '@/api/auth'
import type { LoginFormData } from '@/api/auth'
import * as yup from 'yup'

export interface UseLoginForm {
  // Form state
  formData: {
    email: string
    password: string
    rememberMe: boolean
  }
  errors: Record<string, string>
  isSubmitting: boolean

  // Methods
  validateField: (field: keyof LoginFormData) => Promise<void>
  handleSubmit: () => Promise<void>
  clearError: (field: string) => void
}

export function useLoginForm() {
  const router = useRouter()
  const route = useRoute()
  const apiStore = useApiStore()
  const authStore = useAuthStore()
  const messagingStore = useMessagingStore()
  const loc = useLocalizationStore()

  // Form data
  const formData = ref({
    email: (route.query.email as string) || '',
    password: '',
    rememberMe: false,
  })

  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)

  // Validation schema
  const schema = yup.object({
    email: yup.string().required('Email is required').email('Please enter a valid email address'),
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters'),
  })

  // Validate single field
  const validateField = async (field: keyof LoginFormData) => {
    try {
      await schema.validateAt(field, formData.value)
      delete errors.value[field]
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        errors.value[field] = error.message
      }
    }
  }

  // Clear error for field
  const clearError = (field: string) => {
    delete errors.value[field]
  }

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Reset errors
      errors.value = {}

      // Validate entire form
      await schema.validate(formData.value, { abortEarly: false })

      isSubmitting.value = true

      // Get API service directly from store (type assertion needed for compatibility)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiService: any = apiStore
      const authApi = createAuthApiService(apiService)

      // Prepare login request
      const loginData = {
        email: formData.value.email,
        password: formData.value.password,
        device_info: navigator.userAgent,
      }

      // Call login API
      const response = await authApi.login(loginData)

      // Store tokens in localStorage (TokenManager always checks localStorage)
      // The Remember Me flag affects token lifetime, not storage location
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      localStorage.setItem('auth_remember_me', String(formData.value.rememberMe))

      // Calculate and store expiration
      const expiresAt = Date.now() + response.data.expires_in * 1000
      localStorage.setItem('auth_expires_at', String(expiresAt))

      // Update auth store with user data (wait for it to complete)
      await authStore.setCurrentUser(response.data.user)

      // Verify authentication is ready
      const isReady = await authStore.isAuthenticated()
      if (!isReady) {
        throw new Error('Authentication setup failed')
      }

      // Show success message
      await messagingStore.success(
        loc.t('auth.loginSuccess'),
        loc.t('auth.welcomeBack', {
          username: response.data.user.full_name ?? response.data.user.username,
        })
      )

      // Small delay to ensure all state is updated
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Redirect to return URL or dashboard
      const returnUrl = (route.query.redirect as string) || '/dashboard'
      await router.push(returnUrl)
    } catch (error) {
      // Handle validation errors
      if (error instanceof yup.ValidationError) {
        error.inner.forEach((err) => {
          if (err.path) {
            errors.value[err.path] = err.message
          }
        })
        return
      }

      // Handle API errors
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status: number; data?: { detail?: string } } }
        const status = apiError.response?.status
        const detail = apiError.response?.data?.detail ?? 'Login failed'

        switch (status) {
          case 401:
            errors.value.general = 'Invalid email or password'
            break
          case 403:
            errors.value.general = 'Please verify your email first'
            break
          case 423:
            errors.value.general = 'Account locked. Please try again later.'
            break
          default:
            errors.value.general = detail
        }
      } else {
        errors.value.general = 'Network error. Please check your connection.'
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    formData,
    errors,
    isSubmitting,
    validateField,
    handleSubmit,
    clearError,
  }
}
