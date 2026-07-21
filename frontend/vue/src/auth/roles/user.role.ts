/**
 * User Role
 * 
 * Standard authenticated user with basic permissions
 */

import type { RoleDefinition } from './types';

/**
 * User Role
 * - Basic content management
 * - Can view and create own content
 * - Limited data modification
 */
export const USER_ROLE: RoleDefinition = {
  id: 'user',
  name: 'User',
  description: 'Standard authenticated user with basic permissions',
  level: 3,
  permissions: [
    // Content management
    'content:view',
    'content:create',
    'content:edit',
    
    // User management (own profile)
    'users:view',
    
    // Absence management
    'employee-absences:view',
    'employee-absence-demands:view',
  ],
};
