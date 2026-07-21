/**
 * Polypoint Entry Access Rights
 * 
 * Defines permissions for polypoint entry (time tracking) operations
 * Note: Polypoint entries are READ-ONLY legacy data
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Polypoint Entry Management Access Rights
 * READ-ONLY legacy database from Polypoint time tracking system
 */
export const POLYPOINT_ENTRY_RIGHTS: AccessRightsCollection = {
  'polypoint-entries:view': {
    id: 'polypoint-entries:view',
    resource: ResourceType.POLYPOINT_ENTRIES,
    action: ActionType.VIEW,
    name: 'View Polypoint Entries',
    description: 'View polypoint time tracking entries (read-only legacy data)',
    tags: ['polypoint', 'time-tracking', 'basic', 'read-only'],
  },
  
  'polypoint-entries:export': {
    id: 'polypoint-entries:export',
    resource: ResourceType.POLYPOINT_ENTRIES,
    action: ActionType.EXPORT,
    name: 'Export Polypoint Entries',
    description: 'Export polypoint entry data to CSV or other formats',
    tags: ['polypoint', 'time-tracking', 'data', 'read-only'],
  },
  
  // Note: No CREATE, EDIT, DELETE permissions
  // Polypoint entries are read-only legacy data from external system
};
