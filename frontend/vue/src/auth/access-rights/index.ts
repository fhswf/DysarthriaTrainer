/**
 * Central Access Rights Registry
 * 
 * Combines all access rights from all modules into a single registry
 */

import { CONTENT_RIGHTS } from './content.rights';
import { USER_RIGHTS } from './users.rights';
import { ROLE_RIGHTS } from './roles.rights';
import { SYSTEM_RIGHTS } from './system.rights';
import { EMPLOYEE_RIGHTS } from './employees.rights';
import { EMPLOYEE_ABSENCE_DEMAND_RIGHTS } from './employee-absence-demands.rights';
import { EMPLOYEE_ABSENCE_RIGHTS } from './employee-absences.rights';
import { POLYPOINT_ENTRY_RIGHTS } from './polypoint-entries.rights';
import { POLYPOINT_LOG_RIGHTS } from './polypoint-logs.rights';
import type { AccessRightsCollection, AccessRightDefinition, ResourceType, ActionType } from './types';

/**
 * CENTRAL ACCESS RIGHTS REGISTRY
 * Combines all access rights from all modules
 */
export const ACCESS_RIGHTS_REGISTRY: AccessRightsCollection = {
  ...CONTENT_RIGHTS,
  ...USER_RIGHTS,
  ...ROLE_RIGHTS,
  ...SYSTEM_RIGHTS,
  ...EMPLOYEE_RIGHTS,
  ...EMPLOYEE_ABSENCE_DEMAND_RIGHTS,
  ...EMPLOYEE_ABSENCE_RIGHTS,
  ...POLYPOINT_ENTRY_RIGHTS,
  ...POLYPOINT_LOG_RIGHTS,
} as const;

/**
 * Type-safe permission IDs
 */
export type AccessRightId = keyof typeof ACCESS_RIGHTS_REGISTRY;

/**
 * Get all defined access rights
 */
export function getAllAccessRights(): AccessRightDefinition[] {
  return Object.values(ACCESS_RIGHTS_REGISTRY);
}

/**
 * Get access rights by resource
 */
export function getAccessRightsByResource(resource: ResourceType): AccessRightDefinition[] {
  return getAllAccessRights().filter(right => right.resource === resource);
}

/**
 * Get access rights by action
 */
export function getAccessRightsByAction(action: ActionType): AccessRightDefinition[] {
  return getAllAccessRights().filter(right => right.action === action);
}

/**
 * Get critical access rights
 */
export function getCriticalAccessRights(): AccessRightDefinition[] {
  return getAllAccessRights().filter(right => right.isCritical);
}

/**
 * Get access rights by tag
 */
export function getAccessRightsByTag(tag: string): AccessRightDefinition[] {
  return getAllAccessRights().filter(right => right.tags?.includes(tag));
}

/**
 * Validate that a permission exists in the registry
 */
export function isValidAccessRight(permission: string): boolean {
  return permission in ACCESS_RIGHTS_REGISTRY;
}

/**
 * Get access right definition
 */
export function getAccessRight(permission: string): AccessRightDefinition | undefined {
  return ACCESS_RIGHTS_REGISTRY[permission];
}

// Re-export types and individual collections
export * from './types';
export {
  CONTENT_RIGHTS,
  USER_RIGHTS,
  ROLE_RIGHTS,
  SYSTEM_RIGHTS,
  EMPLOYEE_RIGHTS,
  EMPLOYEE_ABSENCE_DEMAND_RIGHTS,
  EMPLOYEE_ABSENCE_RIGHTS,
  POLYPOINT_ENTRY_RIGHTS,
  POLYPOINT_LOG_RIGHTS,
};
