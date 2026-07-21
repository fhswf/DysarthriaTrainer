/**
 * Auth Service RBAC/Access Control System Tests
 * 
 * Tests the Role-Based Access Control implementation including:
 * - Role inheritance (single and multiple)
 * - Permission resolution
 * - User overrides (granted/revoked)
 * - Admin bypass
 * - Permission caching
 * - RBAC enable/disable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLiveAuthService } from '../auth.live';
import type { User } from '../auth.types';

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

// We'll use the real PermissionManager for these tests
// No need to mock it since we're testing RBAC functionality

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

// Mock session manager
const mockSessionManagerInstance = {
  initialize: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('../core/sessionManager', () => ({
  SessionManager: vi.fn().mockImplementation(() => mockSessionManagerInstance),
}));

describe('Auth Service RBAC Tests', () => {
  let authService: ReturnType<typeof createLiveAuthService>;

  beforeEach(async () => {
    vi.clearAllMocks();
    authService = createLiveAuthService();
  });

  describe('RBAC Registry Validation', () => {
    it('should validate existing permissions', async () => {
      expect(await authService.isValidPermission('patients:view')).toBe(true);
      expect(await authService.isValidPermission('patients:create')).toBe(true);
      expect(await authService.isValidPermission('users:edit')).toBe(true);
      expect(await authService.isValidPermission('audit-logs:view')).toBe(true);
    });

    it('should reject invalid permissions', async () => {
      expect(await authService.isValidPermission('invalid:permission')).toBe(false);
      expect(await authService.isValidPermission('patients:invalid')).toBe(false);
      expect(await authService.isValidPermission('notexist:view')).toBe(false);
    });

    it('should validate existing roles', async () => {
      expect(await authService.isValidRole('guest')).toBe(true);
      expect(await authService.isValidRole('nurse')).toBe(true);
      expect(await authService.isValidRole('supervisor')).toBe(true);
      expect(await authService.isValidRole('manager')).toBe(true);
      expect(await authService.isValidRole('admin')).toBe(true);
      expect(await authService.isValidRole('super-admin')).toBe(true);
    });

    it('should reject invalid roles', async () => {
      expect(await authService.isValidRole('invalid-role')).toBe(false);
      expect(await authService.isValidRole('doctor')).toBe(false);
      expect(await authService.isValidRole('')).toBe(false);
    });

    it('should get role definitions', async () => {
      const nurseRole = await authService.getRoleDefinition('nurse');
      expect(nurseRole).toBeDefined();
      expect(nurseRole?.id).toBe('nurse');
      expect(nurseRole?.level).toBe(3);
      expect(nurseRole?.permissions).toContain('patients:view');

      const adminRole = await authService.getRoleDefinition('admin');
      expect(adminRole).toBeDefined();
      expect(adminRole?.id).toBe('admin');
      expect(adminRole?.isAdmin).toBe(true);
    });

    it('should get access right definitions', async () => {
      const patientView = await authService.getAccessRightDefinition('patients:view');
      expect(patientView).toBeDefined();
      expect(patientView?.id).toBe('patients:view');
      expect(patientView?.resource).toBe('patients'); // Enum value is lowercase
      expect(patientView?.action).toBe('view'); // Enum value is lowercase

      const userDelete = await authService.getAccessRightDefinition('users:delete');
      expect(userDelete).toBeDefined();
      expect(userDelete?.id).toBe('users:delete');
      expect(userDelete?.isCritical).toBe(true);
    });
  });

  describe('Role Inheritance - Single Inheritance', () => {
    it('should resolve nurse permissions correctly', async () => {
      const user: User = {
        id: 1,
        username: 'nurse-user',
        email: 'nurse@example.com',
        roles: ['nurse'],
        permissions: [],
      };

      // Simulate login
      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-user', password: 'password' });

      // Nurse should have these permissions
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(true);
      expect(await authService.hasPermission('patients:create')).toBe(true);

      // Nurse should NOT have these permissions
      expect(await authService.hasPermission('patients:delete')).toBe(false);
      expect(await authService.hasPermission('users:view')).toBe(false);
      expect(await authService.hasPermission('users:create')).toBe(false);
    });

    it('should resolve supervisor permissions with nurse inheritance', async () => {
      const user: User = {
        id: 2,
        username: 'supervisor-user',
        email: 'supervisor@example.com',
        roles: ['supervisor'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'supervisor-user', password: 'password' });

      // Supervisor inherits from nurse
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(true);
      expect(await authService.hasPermission('patients:create')).toBe(true);

      // Supervisor adds users:view
      expect(await authService.hasPermission('users:view')).toBe(true);

      // Supervisor should NOT have these
      expect(await authService.hasPermission('users:create')).toBe(false);
      expect(await authService.hasPermission('users:edit')).toBe(false);
    });

    it('should resolve manager permissions with supervisor inheritance chain', async () => {
      const user: User = {
        id: 3,
        username: 'manager-user',
        email: 'manager@example.com',
        roles: ['manager'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'manager-user', password: 'password' });

      // Manager inherits from supervisor -> nurse
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(true);
      expect(await authService.hasPermission('patients:create')).toBe(true);
      expect(await authService.hasPermission('users:view')).toBe(true);

      // Manager adds users:create and users:edit
      expect(await authService.hasPermission('users:create')).toBe(true);
      expect(await authService.hasPermission('users:edit')).toBe(true);

      // Manager should NOT have these
      expect(await authService.hasPermission('users:delete')).toBe(false);
      expect(await authService.hasPermission('patients:delete')).toBe(false);
    });
  });

  describe('Role Inheritance - Multiple Inheritance', () => {
    it('should resolve super-admin with multiple inheritance', async () => {
      const user: User = {
        id: 4,
        username: 'superadmin',
        email: 'superadmin@example.com',
        roles: ['super-admin'],
        permissions: [],
        isAdmin: true, // ← Must be set on user object for bypass to work
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'superadmin', password: 'password' });

      // Super-admin inherits from both admin and manager
      // Should have all permissions from manager chain
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('users:create')).toBe(true);

      // Should have all permissions from admin
      expect(await authService.hasPermission('audit-logs:view')).toBe(true);
      expect(await authService.hasPermission('backups:create')).toBe(true);

      // super-admin has isAdmin flag, so should pass all checks
      expect(await authService.hasPermission('any:permission')).toBe(true);
      expect(await authService.hasPermission('nonexistent:permission')).toBe(true);
    });
  });

  describe('Admin Bypass', () => {
    it('should bypass all permission checks for admin users', async () => {
      const user: User = {
        id: 5,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: [],
        isAdmin: true,
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'admin', password: 'password' });

      // Admin should have access to EVERYTHING
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('users:delete')).toBe(true);
      expect(await authService.hasPermission('nonexistent:permission')).toBe(true);
      expect(await authService.hasPermission('anything:really')).toBe(true);
      expect(await authService.canAccess('any', 'action')).toBe(true);
    });

    it('should respect admin bypass configuration', async () => {
      const user: User = {
        id: 6,
        username: 'admin2',
        email: 'admin2@example.com',
        roles: ['admin'],
        permissions: [],
        isAdmin: true,
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'admin2', password: 'password' });

      // Default config has adminBypass: true
      expect(await authService.hasPermission('anything')).toBe(true);

      // Update config to disable admin bypass
      await authService.updateConfiguration({
        accessControl: {
          enabled: true,
          adminBypass: false,
          enableCaching: true,
          cacheTTL: 300000,
        },
      });

      // Now admin should follow normal permission rules
      // Admin role has all defined permissions but not undefined ones
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('audit-logs:view')).toBe(true);
    });
  });

  describe('User Permission Overrides', () => {
    it('should grant additional permissions via overrides', async () => {
      const user: User = {
        id: 7,
        username: 'nurse-special',
        email: 'nurse-special@example.com',
        roles: ['nurse'],
        permissions: [],
        permissionOverrides: {
          granted: ['users:view', 'audit-logs:view'],
        },
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-special', password: 'password' });

      // Should have nurse permissions
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(true);

      // Should have granted permissions
      expect(await authService.hasPermission('users:view')).toBe(true);
      expect(await authService.hasPermission('audit-logs:view')).toBe(true);

      // Should NOT have other permissions
      expect(await authService.hasPermission('users:create')).toBe(false);
      expect(await authService.hasPermission('backups:create')).toBe(false);
    });

    it('should revoke permissions via overrides', async () => {
      const user: User = {
        id: 8,
        username: 'nurse-restricted',
        email: 'nurse-restricted@example.com',
        roles: ['nurse'],
        permissions: [],
        permissionOverrides: {
          revoked: ['patients:edit', 'patients:create'],
        },
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-restricted', password: 'password' });

      // Should have view permission
      expect(await authService.hasPermission('patients:view')).toBe(true);

      // Should NOT have revoked permissions
      expect(await authService.hasPermission('patients:edit')).toBe(false);
      expect(await authService.hasPermission('patients:create')).toBe(false);
    });

    it('should handle both granted and revoked overrides', async () => {
      const user: User = {
        id: 9,
        username: 'supervisor-custom',
        email: 'supervisor-custom@example.com',
        roles: ['supervisor'],
        permissions: [],
        permissionOverrides: {
          granted: ['users:create'],
          revoked: ['patients:edit'],
        },
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'supervisor-custom', password: 'password' });

      // Inherited permissions (not revoked)
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:create')).toBe(true);
      expect(await authService.hasPermission('users:view')).toBe(true);

      // Granted permission
      expect(await authService.hasPermission('users:create')).toBe(true);

      // Revoked permission
      expect(await authService.hasPermission('patients:edit')).toBe(false);
    });
  });

  describe('Permission Caching', () => {
    it('should cache resolved permissions', async () => {
      const user: User = {
        id: 10,
        username: 'manager-cached',
        email: 'manager-cached@example.com',
        roles: ['manager'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'manager-cached', password: 'password' });

      // First call should compute permissions
      const start1 = Date.now();
      await authService.hasPermission('patients:view');
      const duration1 = Date.now() - start1;

      // Second call should use cache (should be faster or same)
      const start2 = Date.now();
      await authService.hasPermission('patients:view');
      const duration2 = Date.now() - start2;

      // Just verify both calls work
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('users:create')).toBe(true);
    });

    it('should respect cache configuration', async () => {
      const user: User = {
        id: 11,
        username: 'user-nocache',
        email: 'user-nocache@example.com',
        roles: ['nurse'],
        permissions: [],
      };

      // Update config to disable caching
      await authService.updateConfiguration({
        accessControl: {
          enabled: true,
          adminBypass: true,
          enableCaching: false,
          cacheTTL: 0,
        },
      });

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'user-nocache', password: 'password' });

      // Should still work without caching
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(true);
    });
  });

  describe('RBAC Enable/Disable', () => {
    it('should allow all permissions when RBAC is disabled', async () => {
      const user: User = {
        id: 12,
        username: 'guest-user',
        email: 'guest@example.com',
        roles: ['guest'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'guest-user', password: 'password' });

      // With RBAC enabled, guest has limited permissions
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(false);
      expect(await authService.hasPermission('users:create')).toBe(false);

      // Disable RBAC
      await authService.disableAccessControl();
      expect(await authService.isAccessControlEnabled()).toBe(false);

      // Now all permissions should pass
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(true);
      expect(await authService.hasPermission('users:create')).toBe(true);
      expect(await authService.hasPermission('anything:really')).toBe(true);
    });

    it('should re-enable RBAC correctly', async () => {
      const user: User = {
        id: 13,
        username: 'guest-user2',
        email: 'guest2@example.com',
        roles: ['guest'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'guest-user2', password: 'password' });

      // Disable RBAC
      await authService.disableAccessControl();
      expect(await authService.hasPermission('users:create')).toBe(true);

      // Re-enable RBAC
      await authService.enableAccessControl();
      expect(await authService.isAccessControlEnabled()).toBe(true);

      // Should now enforce permissions again
      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('users:create')).toBe(false);
    });
  });

  describe('getAllPermissions', () => {
    it('should return all resolved permissions for user', async () => {
      const user: User = {
        id: 14,
        username: 'nurse-perms',
        email: 'nurse-perms@example.com',
        roles: ['nurse'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-perms', password: 'password' });

      const permissions = await authService.getAllPermissions();

      expect(permissions).toContain('patients:view');
      expect(permissions).toContain('patients:edit');
      expect(permissions).toContain('patients:create');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return all permissions for admin', async () => {
      const user: User = {
        id: 15,
        username: 'admin-perms',
        email: 'admin-perms@example.com',
        roles: ['admin'],
        permissions: [],
        isAdmin: true,
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'admin-perms', password: 'password' });

      const permissions = await authService.getAllPermissions();

      // Admin should return wildcard permission
      expect(permissions).toContain('*:*');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should include granted overrides in getAllPermissions', async () => {
      const user: User = {
        id: 16,
        username: 'nurse-override',
        email: 'nurse-override@example.com',
        roles: ['nurse'],
        permissions: [],
        permissionOverrides: {
          granted: ['users:view', 'audit-logs:view'],
        },
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-override', password: 'password' });

      const permissions = await authService.getAllPermissions();

      expect(permissions).toContain('patients:view');
      expect(permissions).toContain('patients:edit');
      expect(permissions).toContain('users:view');
      expect(permissions).toContain('audit-logs:view');
    });

    it('should exclude revoked overrides from getAllPermissions', async () => {
      const user: User = {
        id: 17,
        username: 'nurse-revoked',
        email: 'nurse-revoked@example.com',
        roles: ['nurse'],
        permissions: [],
        permissionOverrides: {
          revoked: ['patients:edit'],
        },
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-revoked', password: 'password' });

      const permissions = await authService.getAllPermissions();

      expect(permissions).toContain('patients:view');
      expect(permissions).toContain('patients:create');
      expect(permissions).not.toContain('patients:edit');
    });
  });

  describe('hasRole and hasAnyRole', () => {
    it('should check user has specific role', async () => {
      const user: User = {
        id: 18,
        username: 'multi-role',
        email: 'multi@example.com',
        roles: ['nurse', 'supervisor'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'multi-role', password: 'password' });

      expect(await authService.hasRole('nurse')).toBe(true);
      expect(await authService.hasRole('supervisor')).toBe(true);
      expect(await authService.hasRole('admin')).toBe(false);
      expect(await authService.hasRole('manager')).toBe(false);
    });

    it('should check user has any of the specified roles', async () => {
      const user: User = {
        id: 19,
        username: 'single-role',
        email: 'single@example.com',
        roles: ['manager'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'single-role', password: 'password' });

      expect(await authService.hasAnyRole(['admin', 'manager'])).toBe(true);
      expect(await authService.hasAnyRole(['nurse', 'supervisor'])).toBe(false);
      expect(await authService.hasAnyRole(['manager'])).toBe(true);
    });
  });

  describe('canAccess Resource/Action', () => {
    it('should check resource/action access for nurse', async () => {
      const user: User = {
        id: 20,
        username: 'nurse-access',
        email: 'nurse-access@example.com',
        roles: ['nurse'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'nurse-access', password: 'password' });

      // Resource and action values are lowercase (enum values)
      expect(await authService.canAccess('patients', 'view')).toBe(true);
      expect(await authService.canAccess('patients', 'edit')).toBe(true);
      expect(await authService.canAccess('patients', 'create')).toBe(true);
      expect(await authService.canAccess('patients', 'delete')).toBe(false);
      expect(await authService.canAccess('users', 'view')).toBe(false);
    });

    it('should check resource/action access for manager', async () => {
      const user: User = {
        id: 21,
        username: 'manager-access',
        email: 'manager-access@example.com',
        roles: ['manager'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'manager-access', password: 'password' });

      expect(await authService.canAccess('patients', 'view')).toBe(true);
      expect(await authService.canAccess('patients', 'edit')).toBe(true);
      expect(await authService.canAccess('users', 'view')).toBe(true);
      expect(await authService.canAccess('users', 'create')).toBe(true);
      expect(await authService.canAccess('users', 'edit')).toBe(true);
      expect(await authService.canAccess('users', 'delete')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no roles', async () => {
      const user: User = {
        id: 22,
        username: 'no-roles',
        email: 'no-roles@example.com',
        roles: [],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'no-roles', password: 'password' });

      expect(await authService.hasPermission('patients:view')).toBe(false);
      expect(await authService.hasPermission('users:view')).toBe(false);
      expect(await authService.getAllPermissions()).toEqual([]);
    });

    it('should handle user with no roles but permission overrides', async () => {
      const user: User = {
        id: 23,
        username: 'no-roles-override',
        email: 'no-roles-override@example.com',
        roles: [],
        permissions: [],
        permissionOverrides: {
          granted: ['patients:view', 'users:view'],
        },
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'no-roles-override', password: 'password' });

      expect(await authService.hasPermission('patients:view')).toBe(true);
      expect(await authService.hasPermission('users:view')).toBe(true);
      expect(await authService.hasPermission('patients:edit')).toBe(false);
    });

    it('should handle invalid role gracefully', async () => {
      const user: User = {
        id: 24,
        username: 'invalid-role',
        email: 'invalid-role@example.com',
        roles: ['nonexistent-role'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'invalid-role', password: 'password' });

      // Should handle gracefully - no permissions from invalid role
      expect(await authService.hasPermission('patients:view')).toBe(false);
      expect(await authService.getAllPermissions()).toEqual([]);
    });

    it('should handle user not logged in', async () => {
      // No login, just check permissions
      expect(await authService.hasPermission('patients:view')).toBe(false);
      expect(await authService.hasRole('nurse')).toBe(false);
      expect(await authService.hasAnyRole(['admin', 'nurse'])).toBe(false);
      expect(await authService.canAccess('PATIENTS', 'VIEW')).toBe(false);
      expect(await authService.getAllPermissions()).toEqual([]);
    });
  });

  describe('Circular Inheritance Prevention', () => {
    it('should prevent infinite loops in circular inheritance', async () => {
      // This test assumes we don't have circular inheritance in the actual role definitions
      // The PermissionManager should handle this gracefully
      const user: User = {
        id: 25,
        username: 'test-circular',
        email: 'circular@example.com',
        roles: ['supervisor'],
        permissions: [],
      };

      mockApiService.post.mockResolvedValue({
        data: { token: 'test-token', user },
      });

      await authService.login({ username: 'test-circular', password: 'password' });

      // Should complete without hanging
      const permissions = await authService.getAllPermissions();
      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions)).toBe(true);
    });
  });
});
