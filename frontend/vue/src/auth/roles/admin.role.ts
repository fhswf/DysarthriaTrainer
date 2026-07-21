/**
 * Admin Role
 * 
 * System administrator with full access
 */

import type { RoleDefinition } from './types';

/**
 * Admin Role
 * - Full system access
 * - Admin bypass enabled
 */
export const ADMIN_ROLE: RoleDefinition = {
  id: 'admin',
  name: 'Administrator',
  description: 'System administrator with full access',
  level: 10,
  isAdmin: true,  // ← Bypasses all permission checks
  permissions: [
    // System administration
    'settings:view',
    'settings:edit',
    'audit-logs:view',
    'audit-logs:export',
    'reports:view',
    'reports:export',
    
    // All user management
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    
    // All content management
    'content:view',
    'content:create',
    'content:edit',
    'content:delete',
    'content:export',
  ],
};
