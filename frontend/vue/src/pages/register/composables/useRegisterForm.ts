/**
 * Register Form Composable
 * Handles registration form state, validation, and submission
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApiStore } from '@/stores/api'
import { useMessagingStore } from '@/stores/messaging'
import { createAuthApiService } from '@/api/auth'
import type { RegisterRequest } from '@/api/auth'
import * as yup from 'yup'

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  full_name?: string
}

export interface UseRegisterForm {
  // Form state
  formData: {
    email: string
    username: string
    password: string
    confirmPassword: string
    full_name: string
  }
  errors: Record<string, string>
  isSubmitting: boolean

  // Methods
  validateField: (field: keyof RegisterFormData) => Promise<void>
  handleSubmit: () => Promise<void>
  clearError: (field: string) => void
}

export function useRegisterForm() {
  // Initialize router at composable setup time (required by Vue Router)
  const router = useRouter()
  
  // Lazy initialization of stores
  let apiStore: ReturnType<typeof useApiStore>
  let messagingStore: ReturnType<typeof useMessagingStore>

  const getApiStore = () => {
    if (!apiStore) apiStore = useApiStore()
    return apiStore
  }

  const getMessagingStore = () => {
    if (!messagingStore) messagingStore = useMessagingStore()
    return messagingStore
  }

  // Form data
  const formData = ref({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  })

  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)

  // Password strength regex patterns
  const passwordPatterns = {
    minLength: /.{8,}/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
  }

  // Validation schema
  const schema = yup.object({
    email: yup.string().required('Email is required').email('Please enter a valid email address'),
    username: yup
      .string()
      .required('Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .matches(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, hyphens, and underscores'
      ),
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(passwordPatterns.uppercase, 'Password must contain at least one uppercase letter')
      .matches(passwordPatterns.lowercase, 'Password must contain at least one lowercase letter')
      .matches(passwordPatterns.number, 'Password must contain at least one number')
      .matches(passwordPatterns.special, 'Password must contain at least one special character'),
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .test('passwords-match', 'Passwords must match', function (value) {
        return value === this.parent.password
      }),
    full_name: yup.string().max(100, 'Full name must be at most 100 characters'),
  })

  // Validate single field
  const validateField = async (field: keyof RegisterFormData) => {
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

      // Get API service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiService: any = getApiStore()
      const authApi = createAuthApiService(apiService)

      // Prepare registration request (backend expects these exact field names)
      const registerData: RegisterRequest = {
        email: formData.value.email,
        username: formData.value.username,
        password: formData.value.password,
      }

      // Add optional full_name if provided
      if (formData.value.full_name) {
        registerData.full_name = formData.value.full_name
      }

      // Call register API
      await authApi.register(registerData)

      // Show success message
      await getMessagingStore().success(
        'Registration successful! Please check your email to verify your account.'
      )

      // Redirect to login page with email pre-filled
      // Don't await router.push as navigation failures can throw
      void router.push({
        path: '/login',
        query: { email: formData.value.email },
      })
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
        const detail = apiError.response?.data?.detail ?? 'Registration failed'

        switch (status) {
          case 409:
            // Check if error is about email or username
            if (detail.toLowerCase().includes('email')) {
              errors.value.email = 'This email is already registered'
            } else if (detail.toLowerCase().includes('username')) {
              errors.value.username = 'This username is already taken'
            } else {
              errors.value.general = 'Email or username already exists'
            }
            break
          case 400:
            errors.value.general = detail
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
