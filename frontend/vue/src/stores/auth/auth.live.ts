/**
 * Auth Service - Live Implementation
 *
 * Production implementation with real API calls
 */

import type {
  AuthServiceInterface,
  AuthConfig,
  LoginCredentials,
  SignupData,
  User,
  UserSwitchRecord,
  UserSwitchSession,
  UserSwitchInfo,
} from './auth.types'
import { createAuthCommunication } from './communication'
import { TokenManager } from './core/tokenManager'
import { SessionManager } from './core/sessionManager'
import { PermissionManager } from './core/permissionManager'

export const createLiveAuthService = (): AuthServiceInterface => {
  console.log('✅ Using LIVE Auth Service')

  const communication = createAuthCommunication()

  // Default configuration (fallback if Config Service not available)
  // These defaults match the FastAPI backend structure
  const config: AuthConfig = {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenExpirationMinutes: 15,
    enableAutoRefresh: true,
    enableRememberMe: true,
    loginEndpoint: '/api/v1/auth/login',
    logoutEndpoint: '/api/v1/auth/logout',
    refreshEndpoint: '/api/v1/auth/refresh',
    userEndpoint: '/api/v1/users/me',

    // RBAC Configuration
    accessControl: {
      enabled: true,
      adminBypass: true,
      enableCaching: true,
      cacheTTL: 5 * 60 * 1000,
    },
  }

  // Initialize managers with default config
  // TokenManager will use these keys for localStorage
  const tokenManager = new TokenManager(config.tokenKey, config.refreshTokenKey)
  const sessionManager = new SessionManager()
  const permissionManager = new PermissionManager()

  // Initialize PermissionManager with config
  permissionManager.setConfig(config.accessControl)

  // User switching state
  let originalUser: User | null = null
  let activeUser: User | null = null
  let switchedAt: Date | null = null
  let switchReason: string | null = null
  let switchHistory: UserSwitchRecord[] = []

  // Session storage key for user switching
  const SWITCH_SESSION_KEY = 'v2_user_switch_session'

  // Load configuration from Config Service and merge with defaults (async)
  // This allows centralized configuration to override defaults
  const initializeFromConfigService = async () => {
    try {
      const authConfig = await communication.getAuthConfig()
      if (authConfig) {
        // Merge Config Service values (they take precedence over defaults)
        if (authConfig.loginEndpoint) config.loginEndpoint = authConfig.loginEndpoint
        if (authConfig.logoutEndpoint) config.logoutEndpoint = authConfig.logoutEndpoint
        if (authConfig.refreshEndpoint) config.refreshEndpoint = authConfig.refreshEndpoint
        if (authConfig.userEndpoint) config.userEndpoint = authConfig.userEndpoint
        if (authConfig.autoRefresh !== undefined) config.enableAutoRefresh = authConfig.autoRefresh

        // Note: tokenKey and refreshTokenKey from config are not applied dynamically
        // as TokenManager is already initialized and changing keys would orphan existing tokens
        // They should be set via .env before app initialization

        console.log('✅ Auth config loaded from Config Service', {
          loginEndpoint: config.loginEndpoint,
          userEndpoint: config.userEndpoint,
          autoRefresh: config.enableAutoRefresh,
        })
      }
    } catch (err) {
      console.warn('⚠️  Failed to load auth config from Config Service, using defaults:', err)
    }
  }

  // Initialize config immediately (non-blocking)
  // This ensures config is loaded ASAP but doesn't block service creation
  initializeFromConfigService()

  let autoRefreshInterval: any = null

  // User switching helper functions
  const initializeUserSwitching = (): void => {
    const stored = sessionStorage.getItem(SWITCH_SESSION_KEY)
    if (stored) {
      try {
        const session: UserSwitchSession = JSON.parse(stored)
        originalUser = session.originalUser
        activeUser = session.activeUser
        switchedAt = new Date(session.switchedAt)
        switchReason = session.switchReason ?? null
        switchHistory = session.history

        // Update permission manager to use active user's permissions
        // This ensures UI reflects the switched user's access level
        if (activeUser) {
          permissionManager.setUser(activeUser)
        }
      } catch (error) {
        console.error('Failed to restore user switch session:', error)
        clearUserSwitchSession()
      }
    }
  }

  const saveUserSwitchSession = (): void => {
    if (!originalUser || !activeUser) {
      clearUserSwitchSession()
      return
    }

    const session: UserSwitchSession = {
      originalUser,
      activeUser,
      switchedAt: switchedAt?.toISOString() ?? new Date().toISOString(),
      switchReason: switchReason ?? undefined,
      history: switchHistory,
    }

    sessionStorage.setItem(SWITCH_SESSION_KEY, JSON.stringify(session))

    // Dispatch storage event for multi-tab sync
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SWITCH_SESSION_KEY,
        newValue: JSON.stringify(session),
        storageArea: sessionStorage,
      })
    )
  }

  const clearUserSwitchSession = (): void => {
    sessionStorage.removeItem(SWITCH_SESSION_KEY)
    originalUser = null
    activeUser = null
    switchedAt = null
    switchReason = null
    switchHistory = []
  }

  const isUserSwitchedInternal = (): boolean => {
    return !!(originalUser && activeUser && originalUser.id !== activeUser.id)
  }

  // Listen for storage changes from other tabs (multi-tab sync)
  window.addEventListener('storage', (event) => {
    if (event.key === SWITCH_SESSION_KEY) {
      if (event.newValue) {
        // Another tab switched users
        try {
          const session: UserSwitchSession = JSON.parse(event.newValue)
          originalUser = session.originalUser
          activeUser = session.activeUser
          switchedAt = new Date(session.switchedAt)
          switchReason = session.switchReason ?? null
          switchHistory = session.history

          console.log('[User Switch] Synced from another tab')
        } catch (error) {
          console.error('Failed to sync user switch from other tab:', error)
        }
      } else {
        // Another tab reverted
        clearUserSwitchSession()
        console.log('[User Switch] Reverted by another tab')
      }
    }
  })

  const setupAutoRefresh = () => {
    if (!config.enableAutoRefresh) return

    // Clear existing interval
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval)
    }

    // Refresh token every 5 minutes if enabled
    autoRefreshInterval = setInterval(
      async () => {
        if (!tokenManager.isTokenExpired()) {
          await service.refreshToken()
        }
      },
      5 * 60 * 1000
    )
  }

  const service: AuthServiceInterface = {
    async login(credentials: LoginCredentials) {
      try {
        const api = await communication.getApiService()

        const response = await api.post(config.loginEndpoint, {
          username: credentials.username,
          password: credentials.password,
        })

        // Django JWT returns 'access' and 'refresh' by default
        // Our custom serializer renames them to 'token' and 'refreshToken'
        const token = response.data.token || response.data.access
        const refreshToken = response.data.refreshToken || response.data.refresh

        if (token) {
          tokenManager.setToken(token)

          if (refreshToken) {
            tokenManager.setRefreshToken(refreshToken)
          }

          // User data might be in response or need to be fetched separately
          let userData = response.data.user

          if (!userData && config.userEndpoint) {
            // Fetch user data from dedicated endpoint
            // Set token in API interceptor first
            await communication.updateApiToken(token)
            try {
              const userResponse = await api.get(config.userEndpoint)
              userData = userResponse.data
            } catch (err) {
              console.warn('Failed to fetch user data:', err)
            }
          } else if (userData) {
            // User data was embedded in login response
            // Still need to set token for future requests
            await communication.updateApiToken(token)
          }

          if (userData) {
            permissionManager.setUser(userData)
            sessionManager.initialize(userData.id || userData.user_id)
          }

          // Setup auto refresh
          setupAutoRefresh()

          // Initialize user switching state from session storage
          initializeUserSwitching()

          // Notify success
          if (userData) {
            await communication.notifyLoginSuccess(userData)
          }

          return {
            success: true,
            user: userData,
            token,
            refreshToken,
          }
        }

        // Login failed - no token received despite 200 response
        console.error('[Auth] Login returned 200 but no token found in response:', response.data)
        const error = new Error('Invalid credentials - no token received')
        await communication.reportError(error, {
          operation: 'login',
          username: credentials.username,
          responseData: response.data,
        })
        await communication.notifyLoginFailure(error)

        return {
          success: false,
          error: 'Invalid credentials',
        }
      } catch (error: any) {
        // Report error and notify user
        console.error('[Auth] Login failed with error:', error)
        await communication.reportError(error, {
          operation: 'login',
          username: credentials.username,
        })
        await communication.notifyLoginFailure(error)

        return {
          success: false,
          error: error.message || 'Login failed',
        }
      }
    },

    async logout() {
      // Revert to original user before logout
      if (isUserSwitchedInternal()) {
        clearUserSwitchSession()
      }

      try {
        const api = await communication.getApiService()

        // Get refresh token before clearing
        const refreshToken = tokenManager.getRefreshToken()

        // Call logout endpoint with refresh token (only if we have one)
        if (refreshToken) {
          try {
            await api.post(config.logoutEndpoint, { refresh_token: refreshToken })
          } catch (logoutErr) {
            // If logout API fails (e.g., blacklisted token), continue with local cleanup
            console.warn('Logout API call failed, continuing with local cleanup:', logoutErr)
          }
        }
      } catch (err) {
        console.warn('Logout error (continuing with cleanup):', err)
      }

      // Always clear local state regardless of API call success
      tokenManager.clearAll()
      permissionManager.clearUser()
      sessionManager.terminate()

      // Clear auth token from API interceptor
      await communication.updateApiToken('')

      // Clear auto refresh
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        autoRefreshInterval = null
      }

      // Notify logout
      await communication.notifyLogout()
    },

    async forceLogout() {
      console.log('🚨 Force logout - clearing all auth data without API calls')

      // Immediately clear all local state without trying to contact the API
      // This is used when tokens are blacklisted or expired and API calls fail
      tokenManager.clearAll()
      permissionManager.clearUser()
      sessionManager.terminate()

      // Clear auth token from API interceptor
      await communication.updateApiToken('')

      // Clear auto refresh
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        autoRefreshInterval = null
      }

      console.log('✅ Force logout complete - all local data cleared')
    },

    async signup(data: SignupData) {
      try {
        const api = await communication.getApiService()

        const response = await api.post('/api/auth/signup', data)

        if (response.data.token) {
          tokenManager.setToken(response.data.token)

          if (response.data.refreshToken) {
            tokenManager.setRefreshToken(response.data.refreshToken)
          }

          if (response.data.user) {
            permissionManager.setUser(response.data.user)
            sessionManager.initialize(response.data.user.id)
          }

          await communication.updateApiToken(response.data.token)
          setupAutoRefresh()

          return {
            success: true,
            user: response.data.user,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          }
        }

        // Signup failed - no token received
        const error = new Error('Signup failed')
        await communication.reportError(error, { operation: 'signup', email: data.email })

        return {
          success: false,
          error: 'Signup failed',
        }
      } catch (error: any) {
        // Report error
        await communication.reportError(error, { operation: 'signup', email: data.email })

        return {
          success: false,
          error: error.message || 'Signup failed',
        }
      }
    },

    async refreshToken() {
      try {
        const refreshToken = tokenManager.getRefreshToken()
        if (!refreshToken) {
          return false
        }

        const api = await communication.getApiService()
        // FastAPI expects 'refresh_token' (snake_case)
        const response = await api.post(config.refreshEndpoint, {
          refresh_token: refreshToken,
        })

        // FastAPI backend returns 'access_token' and optionally 'refresh_token'
        const newAccessToken = response.data.access_token || response.data.token
        const newRefreshToken = response.data.refresh_token || response.data.refreshToken

        if (newAccessToken) {
          // Update access token
          tokenManager.setToken(newAccessToken)
          await communication.updateApiToken(newAccessToken)

          // CRITICAL: Update refresh token if rotation is enabled
          // Django blacklists the old refresh token when ROTATE_REFRESH_TOKENS=True
          if (newRefreshToken) {
            tokenManager.setRefreshToken(newRefreshToken)
          }

          return true
        }

        return false
      } catch (error: any) {
        await communication.reportError(error, { operation: 'refresh-token' })
        console.error('Token refresh failed:', error)
        return false
      }
    },

    getToken() {
      return tokenManager.getToken()
    },

    setToken(token: string) {
      tokenManager.setToken(token)
    },

    clearToken() {
      tokenManager.clearToken()
    },

    getRefreshToken() {
      return tokenManager.getRefreshToken()
    },

    setRefreshToken(token: string) {
      tokenManager.setRefreshToken(token)
    },

    isTokenExpired() {
      return tokenManager.isTokenExpired()
    },

    getCurrentUser() {
      // If user switching is active, return active user
      if (isUserSwitchedInternal()) {
        return activeUser
      }

      // Otherwise return the base user
      return permissionManager.getUser()
    },

    async setCurrentUser(user: any) {
      // Split full_name into first_name/last_name for frontend use
      const fullName = user.full_name ?? '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') ?? '';
      
      const userData = {
        ...user,
        first_name: firstName,
        last_name: lastName,
      };
      
      permissionManager.setUser(userData);
      
      // Ensure session is initialized
      sessionManager.initialize(user.id || user.user_id);
      
      // CRITICAL: Update API token in interceptor
      // After login, tokens are in localStorage but not yet in axios interceptor
      const token = tokenManager.getToken();
      if (token) {
        await communication.updateApiToken(token);
      }
    },

    async updateCurrentUser(updates: any) {
      // Fetch fresh user data from backend to get updated full_name
      try {
        const api = await communication.getApiService()
        const response = await api.get('/api/v1/users/me')
        if (response.data) {
          // Split full_name into first_name and last_name for frontend
          const fullName = response.data.full_name || ''
          const nameParts = fullName.trim().split(/\s+/)
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          const userData = {
            ...response.data,
            first_name: firstName,
            last_name: lastName,
          }
          permissionManager.setUser(userData)
        }
      } catch (error) {
        console.error('[Auth] Failed to fetch updated user data:', error)
        // Fallback to local update if API fails
        const currentUser = permissionManager.getUser()
        if (currentUser) {
          permissionManager.setUser({ ...currentUser, ...updates })
        }
      }
    },

    isAuthenticated() {
      return !!(tokenManager.getToken() && !tokenManager.isTokenExpired())
    },

    hasPermission(permission: string) {
      return permissionManager.hasPermission(permission)
    },

    hasRole(role: string) {
      return permissionManager.hasRole(role)
    },

    hasAnyRole(roles: string[]) {
      return permissionManager.hasAnyRole(roles)
    },

    hasAllRoles(roles: string[]) {
      return permissionManager.hasAllRoles(roles)
    },

    canAccess(resource: string, action: string) {
      return permissionManager.canAccess(resource, action)
    },

    async initializeSession() {
      const token = tokenManager.getToken()

      if (token && !tokenManager.isTokenExpired()) {
        // Load user info
        try {
          // CRITICAL: Set token in API interceptor before making request
          await communication.updateApiToken(token)

          const api = await communication.getApiService()
          const response = await api.get(config.userEndpoint)

          if (response.data) {
            permissionManager.setUser(response.data)
            sessionManager.initialize(response.data.id)
            setupAutoRefresh()

            // Initialize user switching state from session storage
            initializeUserSwitching()
          }
        } catch (err: any) {
          console.error('Failed to initialize session:', err)
          await communication.reportError(err, { operation: 'initialize-session' })

          // CRITICAL: Clear tokens on ANY error during initialization
          // This handles: 401 (expired), 403 (blacklisted), network errors, CORS issues
          // Better to force re-login than hang the app
          console.warn('Clearing tokens due to session initialization failure')
          tokenManager.clearAll()
          permissionManager.clearUser()
          await communication.updateApiToken('')

          // Don't throw - allow app to continue to login page
        }
      }
    },

    async terminateSession() {
      await this.logout()
    },

    async validateSession() {
      return sessionManager.validate() && this.isAuthenticated()
    },

    getSessionInfo() {
      return sessionManager.getInfo()
    },

    async changePassword(oldPassword: string, newPassword: string) {
      try {
        const api = await communication.getApiService()
        await api.post('/api/auth/change-password', {
          oldPassword,
          newPassword,
        })

        await communication.notifyPasswordChangeSuccess()
        return true
      } catch (err: any) {
        await communication.reportError(err, { operation: 'change-password' })
        await communication.notifyPasswordChangeFailure()
        return false
      }
    },

    async requestPasswordReset(email: string) {
      try {
        const api = await communication.getApiService()
        await api.post('/api/auth/request-password-reset', { email })

        const messaging = await communication.getMessagingService()
        if (messaging) {
          await messaging.success(
            'Password Reset Requested',
            'Check your email for reset instructions'
          )
        }
        return true
      } catch (err: any) {
        await communication.reportError(err, { operation: 'request-password-reset', email })
        return false
      }
    },

    async resetPassword(token: string, newPassword: string) {
      try {
        const api = await communication.getApiService()
        await api.post('/api/auth/reset-password', {
          token,
          newPassword,
        })

        const messaging = await communication.getMessagingService()
        if (messaging) {
          await messaging.success('Password Reset', 'Your password has been reset successfully')
        }
        return true
      } catch (err: any) {
        await communication.reportError(err, { operation: 'reset-password' })
        return false
      }
    },

    updateConfiguration(newConfig: any) {
      Object.assign(config, newConfig)

      // Update PermissionManager if accessControl config changed
      if (newConfig.accessControl) {
        permissionManager.setConfig(newConfig.accessControl)
      }
    },

    getConfiguration() {
      return { ...config }
    },

    // RBAC-specific methods
    getAllPermissions() {
      return permissionManager.getAllPermissions()
    },

    isValidPermission(permission: string) {
      return permissionManager.isValidPermission(permission)
    },

    isValidRole(roleId: string) {
      return permissionManager.isValidRole(roleId)
    },

    getRoleDefinition(roleId: string) {
      return permissionManager.getRoleDefinition(roleId)
    },

    getAccessRightDefinition(permission: string) {
      return permissionManager.getAccessRightDefinition(permission)
    },

    enableAccessControl() {
      config.accessControl.enabled = true
      permissionManager.setConfig(config.accessControl)
    },

    disableAccessControl() {
      config.accessControl.enabled = false
      permissionManager.setConfig(config.accessControl)
    },

    isAccessControlEnabled() {
      return config.accessControl.enabled
    },

    // User switching methods
    async switchToUser(userId: number, reason?: string): Promise<boolean> {
      try {
        // 1. Check permission
        const currentUser = originalUser ?? permissionManager.getUser()

        if (!currentUser) {
          console.error('No current user to switch from')
          return false
        }

        // Superusers and staff can switch
        const canSwitch =
          currentUser.is_superuser ||
          currentUser.is_staff ||
          currentUser.permissions?.includes('users:impersonate')

        if (!canSwitch) {
          console.error('Insufficient permissions to switch users')
          return false
        }

        // 2. Prevent switching to self
        if (currentUser.id === userId) {
          console.warn('Cannot switch to yourself')
          return false
        }

        // 3. Fetch target user data from API
        const api = await communication.getApiService()
        const response = await api.get(`/api/settings/user/${userId}/`)
        const targetUser = response.data as User

        // 4. Validate target user
        if (!targetUser.is_active) {
          console.error('Cannot switch to inactive user')
          return false
        }

        // 5. Check switching restrictions
        if (!currentUser.is_superuser) {
          // Non-superusers cannot switch to superusers or staff
          if (targetUser.is_superuser || targetUser.is_staff) {
            console.error('Insufficient permissions to switch to admin/staff user')
            return false
          }
        }

        // 6. Set up user switch
        if (!isUserSwitchedInternal()) {
          // First switch - save current user as original
          originalUser = currentUser
        }
        // else: keep existing originalUser (don't allow nested switches)

        activeUser = targetUser
        switchedAt = new Date()
        switchReason = reason ?? null

        // 7. Add to audit history
        switchHistory.push({
          timestamp: new Date().toISOString(),
          fromUserId: currentUser.id,
          toUserId: targetUser.id,
          toUsername: targetUser.username,
          reason,
        })

        // 8. Save to session storage
        saveUserSwitchSession()

        // 9. Update permission manager to use the active user's permissions
        // This ensures menu items and UI elements reflect the switched user's access
        permissionManager.setUser(targetUser)

        // 10. Log audit event
        console.log('[User Switch]', {
          from: currentUser.username,
          to: targetUser.username,
          reason,
          timestamp: switchedAt,
        })

        // 11. Optional: Send to backend audit endpoint
        try {
          await api.post('/api/audit/user-switch/', {
            from_user_id: currentUser.id,
            to_user_id: targetUser.id,
            reason,
            timestamp: switchedAt.toISOString(),
          })
        } catch (error) {
          // Don't fail the switch if audit logging fails
          console.warn('Failed to log user switch to backend:', error)
        }

        return true
      } catch (error) {
        console.error('Failed to switch user:', error)
        return false
      }
    },

    async revertToOriginalUser(): Promise<void> {
      if (!isUserSwitchedInternal()) {
        console.warn('Not currently switched to another user')
        return
      }

      console.log('[User Switch] Reverting to original user:', originalUser?.username)

      // Restore permission manager to use original user
      if (originalUser) {
        permissionManager.setUser(originalUser)
      }

      // Clear switch state
      activeUser = null
      switchedAt = null
      switchReason = null
      originalUser = null

      // Clear session storage
      clearUserSwitchSession()
    },

    async canSwitchUsers(): Promise<boolean> {
      const currentUser = originalUser ?? permissionManager.getUser()

      if (!currentUser) {
        return false
      }

      // Superusers and staff can switch
      if (currentUser.is_superuser || currentUser.is_staff) {
        return true
      }

      // Check for explicit permission
      if (currentUser.permissions?.includes('users:impersonate')) {
        return true
      }

      return false
    },

    isUserSwitched(): boolean {
      return isUserSwitchedInternal()
    },

    getOriginalUser(): User | null {
      if (isUserSwitchedInternal()) {
        return originalUser
      }
      return permissionManager.getUser()
    },

    getActiveUser(): User | null {
      if (isUserSwitchedInternal()) {
        return activeUser
      }
      return permissionManager.getUser()
    },

    getSwitchInfo(): UserSwitchInfo | null {
      if (!isUserSwitchedInternal()) {
        return null
      }

      return {
        isUserSwitched: true,
        originalUser,
        activeUser,
        switchedAt,
        switchReason,
      }
    },
  }

  return service
}
