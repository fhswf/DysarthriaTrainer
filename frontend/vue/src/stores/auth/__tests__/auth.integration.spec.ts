/**
 * Auth Service Integration Tests
 * 
 * Tests the integration between Auth service and:
 * - API service (via communication layer)
 * - Messaging service (for notifications)
 * - Error service (for error reporting)
 * - Config service (for endpoints)
 * - Service Registry (for service access)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLiveAuthService } from '../auth.live';
import type { LoginCredentials, SignupData } from '../auth.types';

// Create mock services
const mockApiService = {
  post: vi.fn(),
  get: vi.fn(),
};

const mockMessagingService = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

const mockErrorService = {
  handleError: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    const config: Record<string, string> = {
      'auth.loginEndpoint': '/api/auth/login',
      'auth.logoutEndpoint': '/api/auth/logout',
      'auth.refreshEndpoint': '/api/auth/refresh',
      'auth.userEndpoint': '/api/auth/user',
    };
    return config[key] || '';
  }),
};

const mockCommunication = {
  getApiService: vi.fn(async () => mockApiService),
  getMessagingService: vi.fn(async () => mockMessagingService),
  getErrorService: vi.fn(async () => mockErrorService),
  getConfigService: vi.fn(async () => mockConfigService),
  updateApiToken: vi.fn(),
  notifyLoginSuccess: vi.fn(),
  notifyLoginFailure: vi.fn(),
  notifyLogoutSuccess: vi.fn(),
  notifyPasswordChangeSuccess: vi.fn(),
  notifyPasswordChangeFailure: vi.fn(),
  reportError: vi.fn(),
};

// Mock the communication module
vi.mock('../communication', () => ({
  createAuthCommunication: () => mockCommunication,
}));

// Mock token manager
const mockTokenManagerInstance = {
  setToken: vi.fn(),
  getToken: vi.fn(),
  clearToken: vi.fn(),
  setRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
  isTokenExpired: vi.fn(() => false),
  clearAll: vi.fn(),
};

vi.mock('../core/tokenManager', () => ({
  TokenManager: vi.fn().mockImplementation(() => mockTokenManagerInstance),
}));

// Mock permission manager  
const mockPermissionManagerInstance = {
  setUser: vi.fn(),
  clearUser: vi.fn(),
  getUser: vi.fn(),
  hasPermission: vi.fn(),
  setConfig: vi.fn(), // Add RBAC method
  getConfig: vi.fn(() => ({
    enabled: true,
    adminBypass: true,
    enableCaching: true,
    cacheTTL: 300000,
  })),
  clearCache: vi.fn(),
};

vi.mock('../core/permissionManager', () => ({
  PermissionManager: vi.fn().mockImplementation(() => mockPermissionManagerInstance),
}));

// Mock session manager
const mockSessionManagerInstance = {
  initialize: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('../core/sessionManager', () => ({
  SessionManager: vi.fn().mockImplementation(() => mockSessionManagerInstance),
}));

describe('Auth Service Integration Tests', () => {
  let authService: ReturnType<typeof createLiveAuthService>;

  beforeEach(async () => {
    vi.clearAllMocks();
    authService = createLiveAuthService();
  });

  describe('Service Registry Integration', () => {
    it('should access API service via service registry', async () => {
      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user: { id: 1, username: 'test' } }
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      await authService.login(credentials);

      expect(mockCommunication.getApiService).toHaveBeenCalled();
    });

    it('should access Messaging service via service registry', async () => {
      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user: { id: 1, username: 'test' } }
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      await authService.login(credentials);

      expect(mockCommunication.notifyLoginSuccess).toHaveBeenCalled();
    });

    it('should access Error service via service registry', async () => {
      const error = new Error('Login failed');
      mockApiService.post.mockRejectedValue(error);

      const credentials: LoginCredentials = { username: 'test', password: 'wrong' };
      await authService.login(credentials);

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'login', username: 'test' })
      );
    });

    it('should access Config service via service registry', async () => {
      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user: { id: 1, username: 'test' } }
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      await authService.login(credentials);

      // The API call should use config endpoints
      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.any(Object)
      );
    });
  });

  describe('Login - Cross-Service Integration', () => {
    it('should report errors to Error service on login failure', async () => {
      const error = new Error('Network error');
      mockApiService.post.mockRejectedValue(error);

      const credentials: LoginCredentials = { username: 'test', password: 'wrong' };
      const result = await authService.login(credentials);

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ 
          operation: 'login',
          username: 'test'
        })
      );
      expect(result.success).toBe(false);
    });

    it('should notify user via Messaging service on login failure', async () => {
      const error = new Error('Invalid credentials');
      mockApiService.post.mockRejectedValue(error);

      const credentials: LoginCredentials = { username: 'test', password: 'wrong' };
      await authService.login(credentials);

      expect(mockCommunication.notifyLoginFailure).toHaveBeenCalledWith(error);
    });

    it('should notify user via Messaging service on successful login', async () => {
      const user = { id: 1, username: 'test', email: 'test@example.com' };
      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user }
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      const result = await authService.login(credentials);

      expect(mockCommunication.notifyLoginSuccess).toHaveBeenCalledWith(user);
      expect(result.success).toBe(true);
    });

    it('should update API service token after successful login', async () => {
      const token = 'new-auth-token';
      mockApiService.post.mockResolvedValue({
        data: { token, user: { id: 1, username: 'test' } }
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      await authService.login(credentials);

      expect(mockCommunication.updateApiToken).toHaveBeenCalledWith(token);
    });

    it('should handle login failure when no token received', async () => {
      mockApiService.post.mockResolvedValue({
        data: {} // No token
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(mockCommunication.reportError).toHaveBeenCalled();
      expect(mockCommunication.notifyLoginFailure).toHaveBeenCalled();
    });
  });

  describe('Password Management - Integration', () => {
    it('should notify success via Messaging service on password change', async () => {
      mockApiService.post.mockResolvedValue({ data: { success: true } });

      const result = await authService.changePassword('old-pass', 'new-pass');

      expect(mockCommunication.notifyPasswordChangeSuccess).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should notify failure via Messaging service on password change error', async () => {
      const error = new Error('Wrong old password');
      mockApiService.post.mockRejectedValue(error);

      const result = await authService.changePassword('wrong-old', 'new-pass');

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'change-password' })
      );
      expect(mockCommunication.notifyPasswordChangeFailure).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should show success message on password reset request', async () => {
      mockApiService.post.mockResolvedValue({ data: { success: true } });

      const result = await authService.requestPasswordReset('test@example.com');

      expect(mockMessagingService.success).toHaveBeenCalledWith(
        'Password Reset Requested',
        expect.stringContaining('email')
      );
      expect(result).toBe(true);
    });

    it('should report error on password reset request failure', async () => {
      const error = new Error('Email not found');
      mockApiService.post.mockRejectedValue(error);

      const result = await authService.requestPasswordReset('unknown@example.com');

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ 
          operation: 'request-password-reset',
          email: 'unknown@example.com'
        })
      );
      expect(result).toBe(false);
    });

    it('should show success message on password reset', async () => {
      mockApiService.post.mockResolvedValue({ data: { success: true } });

      const result = await authService.resetPassword('reset-token', 'new-password');

      expect(mockMessagingService.success).toHaveBeenCalledWith(
        'Password Reset',
        expect.stringContaining('successfully')
      );
      expect(result).toBe(true);
    });

    it('should report error on password reset failure', async () => {
      const error = new Error('Invalid token');
      mockApiService.post.mockRejectedValue(error);

      const result = await authService.resetPassword('bad-token', 'new-password');

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'reset-password' })
      );
      expect(result).toBe(false);
    });
  });

  describe('Signup - Integration', () => {
    it('should report errors to Error service on signup failure', async () => {
      const error = new Error('Email already exists');
      mockApiService.post.mockRejectedValue(error);

      const signupData: SignupData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };

      const result = await authService.signup(signupData);

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ 
          operation: 'signup',
          email: 'new@example.com'
        })
      );
      expect(result.success).toBe(false);
    });

    it('should update API token after successful signup', async () => {
      const token = 'signup-token';
      mockApiService.post.mockResolvedValue({
        data: { token, user: { id: 2, username: 'newuser' } }
      });

      const signupData: SignupData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };

      const result = await authService.signup(signupData);

      expect(mockCommunication.updateApiToken).toHaveBeenCalledWith(token);
      expect(result.success).toBe(true);
    });

    it('should handle signup failure when no token received', async () => {
      mockApiService.post.mockResolvedValue({
        data: {} // No token
      });

      const signupData: SignupData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };

      const result = await authService.signup(signupData);

      expect(result.success).toBe(false);
      expect(mockCommunication.reportError).toHaveBeenCalled();
    });
  });

  describe('Token Refresh - Integration', () => {
    it('should report errors to Error service on refresh failure', async () => {
      const error = new Error('Refresh token expired');
      mockApiService.post.mockRejectedValue(error);

      // Mock tokenManager to return a refresh token
      mockTokenManagerInstance.getRefreshToken.mockReturnValue('refresh-token');

      const result = await authService.refreshToken();

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'refresh-token' })
      );
      expect(result).toBe(false);
    });

    it('should update API token after successful refresh', async () => {
      const newToken = 'refreshed-token';
      mockApiService.post.mockResolvedValue({
        data: { token: newToken }
      });

      mockTokenManagerInstance.getRefreshToken.mockReturnValue('refresh-token');

      const result = await authService.refreshToken();

      expect(mockCommunication.updateApiToken).toHaveBeenCalledWith(newToken);
      expect(result).toBe(true);
    });
  });

  describe('Session Initialization - Integration', () => {
    it('should report errors to Error service on session init failure', async () => {
      const error = new Error('Failed to load user');
      mockApiService.get.mockRejectedValue(error);

      mockTokenManagerInstance.getToken.mockReturnValue('valid-token');
      mockTokenManagerInstance.isTokenExpired.mockReturnValue(false);

      await authService.initializeSession();

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'initialize-session' })
      );
    });

    it('should load user data on successful session initialization', async () => {
      const user = { id: 1, username: 'test', email: 'test@example.com' };
      mockApiService.get.mockResolvedValue({
        data: user
      });

      mockTokenManagerInstance.getToken.mockReturnValue('valid-token');
      mockTokenManagerInstance.isTokenExpired.mockReturnValue(false);

      await authService.initializeSession();

      expect(mockPermissionManagerInstance.setUser).toHaveBeenCalledWith(user);
      expect(mockSessionManagerInstance.initialize).toHaveBeenCalledWith(user.id);
    });
  });

  describe('Error Context Enrichment', () => {
    it('should include operation context in error reports', async () => {
      const error = new Error('Test error');
      mockApiService.post.mockRejectedValue(error);

      const credentials: LoginCredentials = { username: 'test', password: 'wrong' };
      await authService.login(credentials);

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'login'
        })
      );
    });

    it('should include user context in error reports', async () => {
      const error = new Error('Test error');
      mockApiService.post.mockRejectedValue(error);

      const credentials: LoginCredentials = { username: 'testuser', password: 'wrong' };
      await authService.login(credentials);

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          username: 'testuser'
        })
      );
    });

    it('should include email context in signup error reports', async () => {
      const error = new Error('Test error');
      mockApiService.post.mockRejectedValue(error);

      const signupData: SignupData = {
        username: 'newuser',
        email: 'test@example.com',
        password: 'password123'
      };

      await authService.signup(signupData);

      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          email: 'test@example.com'
        })
      );
    });
  });

  describe('Complete Flow Integration', () => {
    it('should handle complete login flow with all services', async () => {
      const user = { id: 1, username: 'test', email: 'test@example.com' };
      const token = 'auth-token';
      mockApiService.post.mockResolvedValue({
        data: { token, user }
      });

      const credentials: LoginCredentials = { username: 'test', password: 'password' };
      const result = await authService.login(credentials);

      // Verify API service called
      expect(mockCommunication.getApiService).toHaveBeenCalled();
      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/auth/login',
        { username: 'test', password: 'password' }
      );

      // Verify API token updated
      expect(mockCommunication.updateApiToken).toHaveBeenCalledWith(token);

      // Verify success notification
      expect(mockCommunication.notifyLoginSuccess).toHaveBeenCalledWith(user);

      // Verify no error reporting
      expect(mockCommunication.reportError).not.toHaveBeenCalled();

      // Verify result
      expect(result.success).toBe(true);
      expect(result.token).toBe(token);
      expect(result.user).toEqual(user);
    });

    it('should handle complete error flow with all services', async () => {
      const error = new Error('Network failure');
      mockApiService.post.mockRejectedValue(error);

      const credentials: LoginCredentials = { username: 'test', password: 'wrong' };
      const result = await authService.login(credentials);

      // Verify API service called
      expect(mockCommunication.getApiService).toHaveBeenCalled();

      // Verify error reported
      expect(mockCommunication.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ operation: 'login', username: 'test' })
      );

      // Verify user notified
      expect(mockCommunication.notifyLoginFailure).toHaveBeenCalledWith(error);

      // Verify no success notification
      expect(mockCommunication.notifyLoginSuccess).not.toHaveBeenCalled();

      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
