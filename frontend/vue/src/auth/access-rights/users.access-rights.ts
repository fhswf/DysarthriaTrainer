import type { AccessRightDefinition } from './types';

/**
 * Access rights definitions for user management
 * These define the permissions required for various user operations
 */
export const USERS_ACCESS_RIGHTS: AccessRightDefinition[] = [
  {
    id: 'users.view',
    name: 'View Users',
    description: 'Can view user list and details',
    resource: 'users',
    action: 'view',
    category: 'users',
  },
  {
    id: 'users.create',
    name: 'Create Users',
    description: 'Can create new users',
    resource: 'users',
    action: 'create',
    category: 'users',
  },
  {
    id: 'users.edit',
    name: 'Edit Users',
    description: 'Can edit existing users',
    resource: 'users',
    action: 'edit',
    category: 'users',
  },
  {
    id: 'users.delete',
    name: 'Delete Users',
    description: 'Can delete users',
    resource: 'users',
    action: 'delete',
    category: 'users',
  },
];
