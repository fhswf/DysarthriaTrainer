/**
 * Employee Absence Demand Access Rights
 * 
 * Defines permissions for employee absence demand (vacation requests) operations
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Employee Absence Demand Management Access Rights
 */
export const EMPLOYEE_ABSENCE_DEMAND_RIGHTS: AccessRightsCollection = {
  'employee-absence-demands:view': {
    id: 'employee-absence-demands:view',
    resource: ResourceType.EMPLOYEE_ABSENCE_DEMANDS,
    action: ActionType.VIEW,
    name: 'View Absence Demands',
    description: 'View employee absence demands/vacation requests',
    tags: ['absence-management', 'basic'],
  },
  
  'employee-absence-demands:create': {
    id: 'employee-absence-demands:create',
    resource: ResourceType.EMPLOYEE_ABSENCE_DEMANDS,
    action: ActionType.CREATE,
    name: 'Create Absence Demands',
    description: 'Create new absence demands/vacation requests',
    tags: ['absence-management', 'requests'],
  },
  
  'employee-absence-demands:edit': {
    id: 'employee-absence-demands:edit',
    resource: ResourceType.EMPLOYEE_ABSENCE_DEMANDS,
    action: ActionType.EDIT,
    name: 'Edit Absence Demands',
    description: 'Edit existing absence demands/vacation requests',
    tags: ['absence-management', 'data-modification'],
  },
  
  'employee-absence-demands:delete': {
    id: 'employee-absence-demands:delete',
    resource: ResourceType.EMPLOYEE_ABSENCE_DEMANDS,
    action: ActionType.DELETE,
    name: 'Delete Absence Demands',
    description: 'Delete absence demands/vacation requests',
    tags: ['absence-management', 'data-modification'],
  },
  
  'employee-absence-demands:approve': {
    id: 'employee-absence-demands:approve',
    resource: ResourceType.EMPLOYEE_ABSENCE_DEMANDS,
    action: ActionType.APPROVE,
    name: 'Approve Absence Demands',
    description: 'Approve or reject absence demands/vacation requests',
    isCritical: true,
    tags: ['absence-management', 'critical', 'workflow'],
  },
  
  'employee-absence-demands:export': {
    id: 'employee-absence-demands:export',
    resource: ResourceType.EMPLOYEE_ABSENCE_DEMANDS,
    action: ActionType.EXPORT,
    name: 'Export Absence Demands',
    description: 'Export absence demand data to CSV or other formats',
    tags: ['absence-management', 'data'],
  },
};
