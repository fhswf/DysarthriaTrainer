/**
 * Auth Service Communication Layer
 *
 * Handles cross-service communication for auth service
 */

import { getServiceAsync } from '@/services/serviceRegistry'

export interface AuthCommunicationInterface {
  getApiService(): Promise<any>
  getMessagingService(): Promise<any>
  getLocalizationService(): Promise<any>
  getConfigService(): Promise<any>
  getErrorService(): Promise<any>
  getAuthConfig(): Promise<any>

  notifyLoginSuccess(user: any): Promise<void>
  notifyLogout(): Promise<void>
  notifyAuthenticationRequired(): Promise<void>
  notifySessionExpired(): Promise<void>
  notifyLoginFailure(error: any): Promise<void>
  notifyPasswordChangeSuccess(): Promise<void>
  notifyPasswordChangeFailure(): Promise<void>
  updateApiToken(token: string): Promise<void>
  reportError(error: any, context?: Record<string, any>): Promise<void>
}

export const createAuthCommunication = (): AuthCommunicationInterface => {
  return {
    async getApiService() {
      return await getServiceAsync('api')
    },

    async getMessagingService() {
      return await getServiceAsync('messaging')
    },

    async getLocalizationService() {
      return await getServiceAsync('localization')
    },

    async getConfigService() {
      return await getServiceAsync('config')
    },

    async getErrorService() {
      return await getServiceAsync('error')
    },

    async getAuthConfig() {
      try {
        const config = await this.getConfigService()
        if (config) {
          const authConfig = await config.get('auth')
          if (authConfig) {
            return {
              loginEndpoint: authConfig.loginEndpoint || '/auth/login',
              logoutEndpoint: authConfig.logoutEndpoint || '/auth/logout',
              refreshEndpoint: authConfig.refreshEndpoint || '/auth/refresh',
              userEndpoint: authConfig.userEndpoint || '/auth/user',
              tokenKey: authConfig.tokenKey || 'auth_token',
              refreshTokenKey: authConfig.refreshTokenKey || 'refresh_token',
              autoRefresh: authConfig.autoRefresh ?? true,
              refreshBeforeExpiry: authConfig.refreshBeforeExpiry || 300,
            }
          }
        }
      } catch (err) {
        console.warn('[Auth] Failed to get auth config:', err)
      }

      // Fallback to environment variables
      return {
        loginEndpoint: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/auth/login',
        logoutEndpoint: import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/auth/logout',
        refreshEndpoint: import.meta.env.VITE_AUTH_REFRESH_ENDPOINT || '/auth/refresh',
        userEndpoint: import.meta.env.VITE_AUTH_USER_ENDPOINT || '/auth/user',
        tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token',
        refreshTokenKey: import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'refresh_token',
        autoRefresh: import.meta.env.VITE_AUTH_AUTO_REFRESH !== 'false',
        refreshBeforeExpiry: parseInt(import.meta.env.VITE_AUTH_REFRESH_BEFORE_EXPIRY || '300', 10),
      }
    },

    async notifyLoginSuccess(user: any) {
      try {
        const [messaging, loc] = await Promise.all([
          this.getMessagingService(),
          this.getLocalizationService(),
        ])
        if (messaging && loc) {
          // Ensure localization service is fully initialized
          if (!loc.initialized) {
            await loc.init()
          }
          await messaging.success(
            loc.t('auth.loginSuccess'),
            loc.t('auth.welcomeBack', { username: user.username })
          )
        }
      } catch (err) {
        console.warn('Failed to notify login success:', err)
      }
    },

    async notifyLogout() {
      try {
        const [messaging, loc] = await Promise.all([
          this.getMessagingService(),
          this.getLocalizationService(),
        ])
        if (messaging && loc) {
          if (!loc.initialized) {
            await loc.init()
          }
          await messaging.info(loc.t('auth.logout'), loc.t('auth.logoutSuccess'))
        }
      } catch (err) {
        console.warn('Failed to notify logout:', err)
      }
    },

    async notifyAuthenticationRequired() {
      try {
        const [messaging, loc] = await Promise.all([
          this.getMessagingService(),
          this.getLocalizationService(),
        ])
        if (messaging && loc) {
          if (!loc.initialized) {
            await loc.init()
          }
          await messaging.warn(loc.t('auth.authenticationRequired'), loc.t('auth.pleaseLogin'))
        }
      } catch (err) {
        console.warn('Failed to notify authentication required:', err)
      }
    },

    async notifySessionExpired() {
      try {
        const [messaging, loc] = await Promise.all([
          this.getMessagingService(),
          this.getLocalizationService(),
        ])
        if (messaging && loc) {
          if (!loc.initialized) {
            await loc.init()
          }
          await messaging.warn(loc.t('auth.sessionExpired'), loc.t('auth.sessionExpiredMessage'))
        }
      } catch (err) {
        console.warn('Failed to notify session expired:', err)
      }
    },

    async notifyLoginFailure(error: any) {
      try {
        const [messaging, loc] = await Promise.all([
          this.getMessagingService(),
          this.getLocalizationService(),
        ])
        if (messaging && loc) {
          if (!loc.initialized) {
            await loc.init()
          }
          const message = error?.message || loc.t('auth.invalidCredentials')
          await messaging.error(loc.t('auth.loginFailed'), message)
        }
      } catch (err) {
        console.warn('Failed to notify login failure:', err)
      }
    },

    async notifyPasswordChangeSuccess() {
      try {
        const [messaging, loc] = await Promise.all([
          this.getMessagingService(),
          this.getLocalizationService(),
        ])
        if (messaging && loc) {
          if (!loc.initialized) {
            await loc.init()
          }
          await messaging.success(
            loc.t('auth.passwordChanged'),
            loc.t('auth.passwordChangedSuccess')
          )
        }
      } catch (err) {
        console.warn('Failed to notify password change success:', err)
      }
    },

    async notifyPasswordChangeFailure() {
      try {
        const messaging = await this.getMessagingService()
        if (messaging) {
          await messaging.error(
            'Password Change Failed',
            'Failed to update your password. Please try again.'
          )
        }
      } catch (err) {
        console.warn('Failed to notify password change failure:', err)
      }
    },

    async updateApiToken(token: string) {
      try {
        const api = await this.getApiService()
        if (api) {
          await api.setAuthToken(token)
        }
      } catch (err) {
        console.warn('Failed to update API token:', err)
      }
    },

    async reportError(error: any, context?: Record<string, any>) {
      try {
        const errorService = await this.getErrorService()
        if (errorService) {
          await errorService.handleError(error, {
            source: 'auth',
            operation: context?.operation || 'authentication',
            component: 'AuthService',
            ...context,
          })
        }
      } catch (err) {
        console.error('Failed to report error:', err)
      }
    },
  }
}
