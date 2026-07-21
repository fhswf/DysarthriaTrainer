/**
 * Guest Role
 * 
 * Minimal permissions for unauthenticated or basic users
 */

import type { RoleDefinition } from './types';

/**
 * Guest Role
 * - Minimal read-only access
 * - No data modification
 */
export const GUEST_ROLE: RoleDefinition = {
  id: 'guest',
  name: 'Guest',
  description: 'Guest user with minimal read-only access',
  level: 1,
  permissions: [
    // Very limited permissions
    'content:view',
  ],
};
