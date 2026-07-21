/**
 * Manager Role
 * 
 * Manager with team oversight and extended permissions
 */

import type { RoleDefinition } from './types';

/**
 * Manager Role
 * - Inherits all user permissions
 * - Additional user management
 * - Content deletion capabilities
 * - Report access
 */
export const MANAGER_ROLE: RoleDefinition = {
  id: 'manager',
  name: 'Manager',
  description: 'Manager with team oversight and extended permissions',
  level: 6,
  inherits: 'user',  // ← Inherits user permissions
  permissions: [
    // Content management (full CRUD)
    'content:delete',
    'content:export',
    
    // User management
    'users:create',
    'users:edit',
    
    // Reports
    'reports:view',
  ],
};
