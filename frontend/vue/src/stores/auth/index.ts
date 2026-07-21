/**
 * Auth Store
 * 
 * Pinia store for authentication and authorization
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AuthServiceInterface, LoginCredentials, SignupData } from './auth.types';

const loadImplementation = async (): Promise<AuthServiceInterface> => {
  if (import.meta.env.MODE === 'test') {
    const module = await import('./auth.mock');
    return module.createMockAuthService();
  } else {
    const module = await import('./auth.live');
    return module.createLiveAuthService();
  }
};

export const useAuthStore = defineStore('auth', () => {
  const impl = ref<AuthServiceInterface | null>(null);
  let initPromise: Promise<void> | null = null;

  const ensureInitialized = async () => {
    if (!impl.value) {
      if (!initPromise) {
        initPromise = loadImplementation().then(instance => {
          impl.value = instance;
        });
      }
      await initPromise;
    }
    return impl.value!;
  };

  // Authentication
  const login = async (credentials: LoginCredentials) => {
    const instance = await ensureInitialized();
    return instance.login(credentials);
  };

  const logout = async () => {
    const instance = await ensureInitialized();
    return instance.logout();
  };

  const forceLogout = async () => {
    const instance = await ensureInitialized();
    return instance.forceLogout();
  };

  const signup = async (data: SignupData) => {
    const instance = await ensureInitialized();
    return instance.signup(data);
  };

  const refreshToken = async () => {
    const instance = await ensureInitialized();
    return instance.refreshToken();
  };

  // Token management
  const getToken = async () => {
    const instance = await ensureInitialized();
    return instance.getToken();
  };

  const setToken = async (token: string) => {
    const instance = await ensureInitialized();
    return instance.setToken(token);
  };

  const clearToken = async () => {
    const instance = await ensureInitialized();
    return instance.clearToken();
  };

  const getRefreshToken = async () => {
    const instance = await ensureInitialized();
    return instance.getRefreshToken();
  };

  const setRefreshToken = async (token: string) => {
    const instance = await ensureInitialized();
    return instance.setRefreshToken(token);
  };

  const isTokenExpired = async () => {
    const instance = await ensureInitialized();
    return instance.isTokenExpired();
  };

  // User state
  const getCurrentUser = async () => {
    const instance = await ensureInitialized();
    return instance.getCurrentUser();
  };

  const setCurrentUser = async (user: any) => {
    const instance = await ensureInitialized();
    return instance.setCurrentUser(user);
  };

  const updateCurrentUser = async (updates: any) => {
    const instance = await ensureInitialized();
    return instance.updateCurrentUser(updates);
  };

  const isAuthenticated = async () => {
    const instance = await ensureInitialized();
    return instance.isAuthenticated();
  };

  // Authorization
  const hasPermission = async (permission: string) => {
    const instance = await ensureInitialized();
    return instance.hasPermission(permission);
  };

  const hasRole = async (role: string) => {
    const instance = await ensureInitialized();
    return instance.hasRole(role);
  };

  const hasAnyRole = async (roles: string[]) => {
    const instance = await ensureInitialized();
    return instance.hasAnyRole(roles);
  };

  const hasAllRoles = async (roles: string[]) => {
    const instance = await ensureInitialized();
    return instance.hasAllRoles(roles);
  };

  const canAccess = async (resource: string, action: string) => {
    const instance = await ensureInitialized();
    return instance.canAccess(resource, action);
  };

  // Session management
  const initializeSession = async () => {
    const instance = await ensureInitialized();
    return instance.initializeSession();
  };

  const terminateSession = async () => {
    const instance = await ensureInitialized();
    return instance.terminateSession();
  };

  const validateSession = async () => {
    const instance = await ensureInitialized();
    return instance.validateSession();
  };

  const getSessionInfo = async () => {
    const instance = await ensureInitialized();
    return instance.getSessionInfo();
  };

  // Password management
  const changePassword = async (oldPassword: string, newPassword: string) => {
    const instance = await ensureInitialized();
    return instance.changePassword(oldPassword, newPassword);
  };

  const requestPasswordReset = async (email: string) => {
    const instance = await ensureInitialized();
    return instance.requestPasswordReset(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const instance = await ensureInitialized();
    return instance.resetPassword(token, newPassword);
  };

  // Configuration
  const updateConfiguration = async (config: any) => {
    const instance = await ensureInitialized();
    return instance.updateConfiguration(config);
  };

  const getConfiguration = async () => {
    const instance = await ensureInitialized();
    return instance.getConfiguration();
  };
  
  // RBAC-specific methods
  const getAllPermissions = async () => {
    const instance = await ensureInitialized();
    return instance.getAllPermissions();
  };
  
  const isValidPermission = async (permission: string) => {
    const instance = await ensureInitialized();
    return instance.isValidPermission(permission);
  };
  
  const isValidRole = async (roleId: string) => {
    const instance = await ensureInitialized();
    return instance.isValidRole(roleId);
  };
  
  const getRoleDefinition = async (roleId: string) => {
    const instance = await ensureInitialized();
    return instance.getRoleDefinition(roleId);
  };
  
  const getAccessRightDefinition = async (permission: string) => {
    const instance = await ensureInitialized();
    return instance.getAccessRightDefinition(permission);
  };
  
  const enableAccessControl = async () => {
    const instance = await ensureInitialized();
    return instance.enableAccessControl();
  };
  
  const disableAccessControl = async () => {
    const instance = await ensureInitialized();
    return instance.disableAccessControl();
  };
  
  const isAccessControlEnabled = async () => {
    const instance = await ensureInitialized();
    return instance.isAccessControlEnabled();
  };
  
  // User switching
  const switchToUser = async (userId: number, reason?: string) => {
    const instance = await ensureInitialized();
    return instance.switchToUser(userId, reason);
  };

  const revertToOriginalUser = async () => {
    const instance = await ensureInitialized();
    return instance.revertToOriginalUser();
  };

  const canSwitchUsers = async () => {
    const instance = await ensureInitialized();
    return instance.canSwitchUsers();
  };

  const isUserSwitched = () => {
    // Synchronous check - can be called without await
    if (!impl.value) return false;
    return impl.value.isUserSwitched();
  };

  const getOriginalUser = async () => {
    const instance = await ensureInitialized();
    return instance.getOriginalUser();
  };

  const getActiveUser = async () => {
    const instance = await ensureInitialized();
    return instance.getActiveUser();
  };

  const getSwitchInfo = async () => {
    const instance = await ensureInitialized();
    return instance.getSwitchInfo();
  };

  return {
    login,
    logout,
    forceLogout,
    signup,
    refreshToken,
    getToken,
    setToken,
    clearToken,
    getRefreshToken,
    setRefreshToken,
    isTokenExpired,
    getCurrentUser,
    setCurrentUser,
    updateCurrentUser,
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    initializeSession,
    terminateSession,
    validateSession,
    getSessionInfo,
    changePassword,
    requestPasswordReset,
    resetPassword,
    updateConfiguration,
    getConfiguration,
    getAllPermissions,
    isValidPermission,
    isValidRole,
    getRoleDefinition,
    getAccessRightDefinition,
    enableAccessControl,
    disableAccessControl,
    isAccessControlEnabled,
    switchToUser,
    revertToOriginalUser,
    canSwitchUsers,
    isUserSwitched,
    getOriginalUser,
    getActiveUser,
    getSwitchInfo,
  };
});
