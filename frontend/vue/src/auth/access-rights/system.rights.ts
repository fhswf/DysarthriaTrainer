/**
 * System Administration Access Rights
 * 
 * Example implementation with system-level permissions
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * System Administration Access Rights
 */
export const SYSTEM_RIGHTS: AccessRightsCollection = {
  'settings:view': {
    id: 'settings:view',
    resource: ResourceType.SETTINGS,
    action: ActionType.VIEW,
    name: 'View Settings',
    description: 'View system settings and configuration',
    tags: ['system-administration', 'configuration'],
  },
  
  'settings:edit': {
    id: 'settings:edit',
    resource: ResourceType.SETTINGS,
    action: ActionType.EDIT,
    name: 'Edit Settings',
    description: 'Modify system settings and configuration',
    isCritical: true,
    tags: ['system-administration', 'configuration', 'critical'],
  },
  
  'audit-logs:view': {
    id: 'audit-logs:view',
    resource: ResourceType.AUDIT_LOGS,
    action: ActionType.VIEW,
    name: 'View Audit Logs',
    description: 'View system audit logs and activity history',
    isCritical: true,
    tags: ['system-administration', 'security'],
  },
  
  'audit-logs:export': {
    id: 'audit-logs:export',
    resource: ResourceType.AUDIT_LOGS,
    action: ActionType.EXPORT,
    name: 'Export Audit Logs',
    description: 'Export audit logs for compliance and analysis',
    isCritical: true,
    tags: ['system-administration', 'security', 'compliance'],
  },
  
  'reports:view': {
    id: 'reports:view',
    resource: ResourceType.REPORTS,
    action: ActionType.VIEW,
    name: 'View Reports',
    description: 'View system reports and analytics',
    tags: ['system-administration', 'analytics'],
  },
  
  'reports:export': {
    id: 'reports:export',
    resource: ResourceType.REPORTS,
    action: ActionType.EXPORT,
    name: 'Export Reports',
    description: 'Export reports in various formats',
    tags: ['system-administration', 'analytics', 'data'],
  },
};
