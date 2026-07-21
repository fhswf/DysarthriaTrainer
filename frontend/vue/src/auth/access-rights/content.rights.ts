/**
 * Content Access Rights
 * 
 * Defines permissions for content management operations
 * Generic example - adapt to your specific content types
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Content Management Access Rights
 */
export const CONTENT_RIGHTS: AccessRightsCollection = {
  'content:view': {
    id: 'content:view',
    resource: ResourceType.CONTENT,
    action: ActionType.VIEW,
    name: 'View Content',
    description: 'View content items and their details',
    tags: ['content-management', 'basic'],
  },
  
  'content:create': {
    id: 'content:create',
    resource: ResourceType.CONTENT,
    action: ActionType.CREATE,
    name: 'Create Content',
    description: 'Create new content items',
    tags: ['content-management', 'basic'],
  },
  
  'content:edit': {
    id: 'content:edit',
    resource: ResourceType.CONTENT,
    action: ActionType.EDIT,
    name: 'Edit Content',
    description: 'Edit existing content items',
    tags: ['content-management', 'advanced'],
  },
  
  'content:delete': {
    id: 'content:delete',
    resource: ResourceType.CONTENT,
    action: ActionType.DELETE,
    name: 'Delete Content',
    description: 'Delete content items from the system',
    isCritical: true,
    tags: ['content-management', 'critical'],
  },
  
  'content:export': {
    id: 'content:export',
    resource: ResourceType.CONTENT,
    action: ActionType.EXPORT,
    name: 'Export Content',
    description: 'Export content data in various formats',
    tags: ['content-management', 'data'],
  },
};
