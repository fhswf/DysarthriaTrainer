/**
 * Role Management Access Rights
 * 
 * Permissions for role CRUD operations and role assignment.
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Role Management Access Rights
 */
export const ROLE_RIGHTS: AccessRightsCollection = {
  'roles:view': {
    id: 'roles:view',
    resource: ResourceType.ROLES,
    action: ActionType.VIEW,
    name: 'View Roles',
    description: 'View role definitions and permissions',
    tags: ['role-management', 'basic'],
  },
  
  'roles:create': {
    id: 'roles:create',
    resource: ResourceType.ROLES,
    action: ActionType.CREATE,
    name: 'Create Roles',
    description: 'Create new role definitions in the system',
    isCritical: true,
    tags: ['role-management', 'administrative'],
  },
  
  'roles:edit': {
    id: 'roles:edit',
    resource: ResourceType.ROLES,
    action: ActionType.EDIT,
    name: 'Edit Roles',
    description: 'Modify existing role definitions and permissions',
    isCritical: true,
    tags: ['role-management', 'critical', 'data-modification'],
  },
  
  'roles:delete': {
    id: 'roles:delete',
    resource: ResourceType.ROLES,
    action: ActionType.DELETE,
    name: 'Delete Roles',
    description: 'Remove role definitions from the system',
    isCritical: true,
    tags: ['role-management', 'critical', 'data-modification'],
  },
  
  'roles:assign': {
    id: 'roles:assign',
    resource: ResourceType.ROLES,
    action: 'assign' as ActionType,
    name: 'Assign Roles',
    description: 'Assign roles to users',
    isCritical: true,
    tags: ['role-management', 'user-management', 'critical'],
  },
};
