/**
 * Central Role Registry
 * 
 * Combines all role definitions into a single registry
 */

import { GUEST_ROLE } from './guest.role';
import { USER_ROLE } from './user.role';
import { MANAGER_ROLE } from './manager.role';
import { ADMIN_ROLE } from './admin.role';
import type { RoleRegistry } from './types';

/**
 * CENTRAL ROLE REGISTRY
 * All role definitions combined
 */
export const ROLE_REGISTRY: RoleRegistry = {
  'guest': GUEST_ROLE,
  'user': USER_ROLE,
  'manager': MANAGER_ROLE,
  'admin': ADMIN_ROLE,
};

/**
 * Type-safe role IDs
 */
export type RoleId = keyof typeof ROLE_REGISTRY;

// Re-export types and individual roles
export * from './types';
export {
  GUEST_ROLE,
  USER_ROLE,
  MANAGER_ROLE,
  ADMIN_ROLE,
};
