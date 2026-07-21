/**
 * Enhanced Permission Manager with RBAC Support
 * 
 * Features:
 * - Role inheritance (single and multiple)
 * - User-specific permission overrides
 * - Admin bypass
 * - Permission caching
 * - Integration with role/access definitions
 */

import type { User, AccessControlConfig } from '../auth.types';
import { ROLE_REGISTRY } from '@/auth/roles';
import { ACCESS_RIGHTS_REGISTRY } from '@/auth/access-rights';

interface PermissionCache {
  permissions: Set<string>;
  timestamp: number;
}

export class PermissionManager {
  private user: User | null = null;
  private config: AccessControlConfig = {
    enabled: true,
    adminBypass: true,
    enableCaching: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  };
  private cache: PermissionCache | null = null;

  /**
   * Update configuration
   */
  setConfig(config: Partial<AccessControlConfig>): void {
    this.config = { ...this.config, ...config };
    this.clearCache();
  }

  /**
   * Get current configuration
   */
  getConfig(): AccessControlConfig {
    return { ...this.config };
  }

  /**
   * Set current user
   */
  setUser(user: User): void {
    this.user = user;
    this.clearCache();
  }

  /**
   * Clear current user
   */
  clearUser(): void {
    this.user = null;
    this.clearCache();
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.user ? { ...this.user } : null;
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Check if RBAC is enabled
   */
  private isRbacEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if user is admin (bypass all checks)
   * Uses is_superuser from Django backend
   */
  private isAdminUser(): boolean {
    if (!this.user || !this.config.adminBypass) return false;
    return this.user.is_superuser === true;
  }

  /**
   * Resolve all permissions for current user
   * Including role inheritance and user overrides
   */
  private resolveUserPermissions(): Set<string> {
    if (!this.user) return new Set();

    // Check cache
    if (this.config.enableCaching && this.cache) {
      const age = Date.now() - this.cache.timestamp;
      if (age < this.config.cacheTTL) {
        return this.cache.permissions;
      }
    }

    const permissions = new Set<string>();

    // 1. Add permissions from roles (with inheritance)
    // Ensure roles is an array before iterating
    const roles = this.user.roles;
    if (roles && Array.isArray(roles)) {
      for (const roleId of roles) {
        const rolePermissions = this.resolveRolePermissions(roleId);
        rolePermissions.forEach(p => permissions.add(p));
      }
    } else {
      console.warn('[PermissionManager] User roles is not an array or is undefined:', roles);
    }

    // 2. Add direct user permissions
    this.user.permissions?.forEach(p => permissions.add(p));

    // 3. Apply user-specific overrides (backend returns as permission_overrides)
    const overrides = this.user.permission_overrides;
    if (overrides && typeof overrides === 'object') {
      // Add granted permissions
      if (Array.isArray(overrides.granted)) {
        overrides.granted.forEach(p => permissions.add(p));
      }
      
      // Remove revoked permissions
      if (Array.isArray(overrides.revoked)) {
        overrides.revoked.forEach(p => permissions.delete(p));
      }
    }

    // Cache the result
    if (this.config.enableCaching) {
      this.cache = {
        permissions,
        timestamp: Date.now(),
      };
    }

    return permissions;
  }

  /**
   * Resolve permissions for a role (with inheritance)
   */
  private resolveRolePermissions(roleId: string, visited = new Set<string>()): Set<string> {
    const permissions = new Set<string>();

    // Prevent circular inheritance
    if (visited.has(roleId)) {
      console.warn(`Circular role inheritance detected: ${roleId}`);
      return permissions;
    }
    visited.add(roleId);

    // Get role definition
    const role = ROLE_REGISTRY[roleId];
    if (!role) {
      console.warn(`Role not found in registry: ${roleId}`);
      return permissions;
    }

    // Add role's direct permissions
    role.permissions.forEach(p => permissions.add(p as string));

    // Recursively add inherited permissions
    if (role.inherits) {
      const parents = Array.isArray(role.inherits) ? role.inherits : [role.inherits];
      
      for (const parentId of parents) {
        const parentPermissions = this.resolveRolePermissions(parentId, visited);
        parentPermissions.forEach(p => permissions.add(p));
      }
    }

    return permissions;
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    // If RBAC disabled, allow all
    if (!this.isRbacEnabled()) return true;

    // If no user, deny
    if (!this.user) return false;

    // If admin bypass enabled and user is admin, allow
    if (this.isAdminUser()) return true;

    // Check permission
    const userPermissions = this.resolveUserPermissions();
    return userPermissions.has(permission);
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    if (!this.user || !Array.isArray(this.user.roles)) return false;
    return this.user.roles.includes(role);
  }

  /**
   * Check if user has ANY of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    if (!this.user?.roles || !Array.isArray(this.user.roles)) return false;
    return roles.some(role => this.user!.roles!.includes(role));
  }

  /**
   * Check if user has ALL of the specified roles
   */
  hasAllRoles(roles: string[]): boolean {
    if (!this.user?.roles || !Array.isArray(this.user.roles)) return false;
    return roles.every(role => this.user!.roles!.includes(role));
  }

  /**
   * Check if user can access a resource with specific action
   */
  canAccess(resource: string, action: string): boolean {
    // If RBAC disabled, allow all
    if (!this.isRbacEnabled()) return true;

    // If no user, deny
    if (!this.user) return false;

    // If admin bypass enabled and user is admin, allow
    if (this.isAdminUser()) return true;

    // Check for specific permission
    const permission = `${resource}:${action}`;
    if (this.hasPermission(permission)) {
      return true;
    }

    // Check for wildcard permissions
    const wildcardResource = `${resource}:*`;
    const wildcardAction = `*:${action}`;
    const wildcardAll = '*:*';

    return (
      this.hasPermission(wildcardResource) ||
      this.hasPermission(wildcardAction) ||
      this.hasPermission(wildcardAll)
    );
  }

  /**
   * Get all resolved permissions for current user
   */
  getAllPermissions(): string[] {
    if (!this.user) return [];
    if (this.isAdminUser()) return ['*:*']; // Admin has all permissions
    
    const permissions = this.resolveUserPermissions();
    return Array.from(permissions);
  }

  /**
   * Check if a permission exists in the registry
   */
  isValidPermission(permission: string): boolean {
    return permission in ACCESS_RIGHTS_REGISTRY;
  }

  /**
   * Check if a role exists in the registry
   */
  isValidRole(roleId: string): boolean {
    return roleId in ROLE_REGISTRY;
  }

  /**
   * Get role definition
   */
  getRoleDefinition(roleId: string) {
    return ROLE_REGISTRY[roleId];
  }

  /**
   * Get access right definition
   */
  getAccessRightDefinition(permission: string) {
    return ACCESS_RIGHTS_REGISTRY[permission];
  }
}
