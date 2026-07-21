/**
 * Role Type Definitions
 * 
 * Defines types and interfaces for role-based access control
 */

import type { AccessRightId } from '../access-rights';

/**
 * Role Definition
 */
export interface RoleDefinition {
  /** Role identifier (matches User.roles[]) */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of role */
  description: string;
  
  /** Permissions granted to this role */
  permissions: AccessRightId[];
  
  /** Roles this role inherits from (single or multiple) */
  inherits?: string | string[];
  
  /** Is this role for administrators? (bypasses checks if enabled) */
  isAdmin?: boolean;
  
  /** Role hierarchy level (higher = more privileges) */
  level?: number;
}

/**
 * Role Registry
 */
export interface RoleRegistry {
  [roleId: string]: RoleDefinition;
}
