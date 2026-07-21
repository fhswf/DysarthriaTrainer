/**
 * User Management Access Rights
 * 
 * Example implementation with core user management permissions
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * User Management Access Rights
 */
export const USER_RIGHTS: AccessRightsCollection = {
  'users:view': {
    id: 'users:view',
    resource: ResourceType.USERS,
    action: ActionType.VIEW,
    name: 'View Users',
    description: 'View user profiles and information',
    tags: ['user-management', 'basic'],
  },
  
  'users:create': {
    id: 'users:create',
    resource: ResourceType.USERS,
    action: ActionType.CREATE,
    name: 'Create Users',
    description: 'Register new users in the system',
    isCritical: true,
    tags: ['user-management', 'administrative'],
  },
  
  'users:edit': {
    id: 'users:edit',
    resource: ResourceType.USERS,
    action: ActionType.EDIT,
    name: 'Edit Users',
    description: 'Update user profiles and settings',
    tags: ['user-management', 'data-modification'],
  },
  
  'users:delete': {
    id: 'users:delete',
    resource: ResourceType.USERS,
    action: ActionType.DELETE,
    name: 'Delete Users',
    description: 'Remove users from the system',
    isCritical: true,
    tags: ['user-management', 'critical', 'data-modification'],
  },
};
