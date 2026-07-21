/**
 * Auth Service - Mock Implementation
 * 
 * Mock implementation for testing and development
 */

import type { AuthServiceInterface } from './auth.types';

export const createMockAuthService = (): AuthServiceInterface => {
  console.log('🎭 Using MOCK Auth Service');

  const mockUser = {
    id: 1,
    username: 'mockuser',
    email: 'mock@example.com',
    first_name: 'Mock',
    last_name: 'User',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    groups: [],
    roles: ['user', 'admin'],
    permissions: ['read', 'write', 'delete'],
    permission_overrides: {},
  };

  let isLoggedIn = false;

  return {
    async login() {
      console.log('🎭 Mock login called');
      isLoggedIn = true;
      return {
        success: true,
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };
    },

    async logout() {
      console.log('🎭 Mock logout called');
      isLoggedIn = false;
    },

    async forceLogout() {
      console.log('🎭 Mock forceLogout called');
      isLoggedIn = false;
    },

    async signup() {
      console.log('🎭 Mock signup called');
      return {
        success: true,
        user: mockUser,
      };
    },

    async refreshToken() {
      console.log('🎭 Mock refreshToken called');
      return true;
    },

    getToken() {
      return isLoggedIn ? 'mock-token' : null;
    },

    setToken() {
      console.log('🎭 Mock setToken called');
    },

    clearToken() {
      console.log('🎭 Mock clearToken called');
    },

    getRefreshToken() {
      return 'mock-refresh-token';
    },

    setRefreshToken() {
      console.log('🎭 Mock setRefreshToken called');
    },

    isTokenExpired() {
      return !isLoggedIn;
    },

    getCurrentUser() {
      return isLoggedIn ? mockUser : null;
    },

    async setCurrentUser() {
      console.log('🎭 Mock setCurrentUser called');
    },

    async updateCurrentUser() {
      console.log('🎭 Mock updateCurrentUser called');
    },

    isAuthenticated() {
      return isLoggedIn;
    },

    hasPermission() {
      return true;
    },

    hasRole() {
      return true;
    },

    hasAnyRole() {
      return true;
    },

    hasAllRoles() {
      return true;
    },

    canAccess() {
      return true;
    },

    async initializeSession() {
      console.log('🎭 Mock initializeSession called');
    },

    async terminateSession() {
      console.log('🎭 Mock terminateSession called');
      isLoggedIn = false;
    },

    async validateSession() {
      return isLoggedIn;
    },

    getSessionInfo() {
      return {
        isActive: isLoggedIn,
        startTime: new Date(),
        lastActivity: new Date(),
      };
    },

    async changePassword() {
      console.log('🎭 Mock changePassword called');
      return true;
    },

    async requestPasswordReset() {
      console.log('🎭 Mock requestPasswordReset called');
      return true;
    },

    async resetPassword() {
      console.log('🎭 Mock resetPassword called');
      return true;
    },

    updateConfiguration() {
      console.log('🎭 Mock updateConfiguration called');
    },

    getConfiguration() {
      return {
        tokenKey: 'auth_token',
        refreshTokenKey: 'refresh_token',
        tokenExpirationMinutes: 60,
        enableAutoRefresh: false,
        enableRememberMe: false,
        loginEndpoint: '/mock/login',
        logoutEndpoint: '/mock/logout',
        refreshEndpoint: '/mock/refresh',
        userEndpoint: '/mock/user',
        accessControl: {
          enabled: false,
          adminBypass: true,
          enableCaching: false,
          cacheTTL: 0,
        },
      };
    },
    
    // RBAC-specific methods
    getAllPermissions() {
      console.log('🎭 Mock getAllPermissions called');
      return ['patients:view', 'patients:edit', 'users:view'];
    },
    
    isValidPermission() {
      console.log('🎭 Mock isValidPermission called');
      return true;
    },
    
    isValidRole() {
      console.log('🎭 Mock isValidRole called');
      return true;
    },
    
    getRoleDefinition() {
      console.log('🎭 Mock getRoleDefinition called');
      return { id: 'nurse', name: 'Nurse', permissions: [] };
    },
    
    getAccessRightDefinition() {
      console.log('🎭 Mock getAccessRightDefinition called');
      return { id: 'patients:view', name: 'View Patients' };
    },
    
    enableAccessControl() {
      console.log('🎭 Mock enableAccessControl called');
    },
    
    disableAccessControl() {
      console.log('🎭 Mock disableAccessControl called');
    },
    
    isAccessControlEnabled() {
      console.log('🎭 Mock isAccessControlEnabled called');
      return false;
    },
  };
};
