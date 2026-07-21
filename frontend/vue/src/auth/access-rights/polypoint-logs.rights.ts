/**
 * Polypoint Log Access Rights
 * 
 * Defines permissions for polypoint log (activity logs) operations
 * Note: Polypoint logs are READ-ONLY legacy data
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Polypoint Log Management Access Rights
 * READ-ONLY legacy database from Polypoint system
 */
export const POLYPOINT_LOG_RIGHTS: AccessRightsCollection = {
  'polypoint-logs:view': {
    id: 'polypoint-logs:view',
    resource: ResourceType.POLYPOINT_LOGS,
    action: ActionType.VIEW,
    name: 'View Polypoint Logs',
    description: 'View polypoint activity logs (read-only legacy data)',
    tags: ['polypoint', 'logs', 'basic', 'read-only'],
  },
  
  'polypoint-logs:export': {
    id: 'polypoint-logs:export',
    resource: ResourceType.POLYPOINT_LOGS,
    action: ActionType.EXPORT,
    name: 'Export Polypoint Logs',
    description: 'Export polypoint log data to CSV or other formats',
    tags: ['polypoint', 'logs', 'data', 'read-only'],
  },
  
  // Note: No CREATE, EDIT, DELETE permissions
  // Polypoint logs are read-only legacy data from external system
};
