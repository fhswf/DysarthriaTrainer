/**
 * Employee Absence Access Rights
 * 
 * Defines permissions for employee absence (approved/actual absences) operations
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Employee Absence Management Access Rights
 */
export const EMPLOYEE_ABSENCE_RIGHTS: AccessRightsCollection = {
  'employee-absences:view': {
    id: 'employee-absences:view',
    resource: ResourceType.EMPLOYEE_ABSENCES,
    action: ActionType.VIEW,
    name: 'View Absences',
    description: 'View employee absence records',
    tags: ['absence-management', 'basic'],
  },
  
  'employee-absences:create': {
    id: 'employee-absences:create',
    resource: ResourceType.EMPLOYEE_ABSENCES,
    action: ActionType.CREATE,
    name: 'Create Absences',
    description: 'Create new absence records',
    isCritical: true,
    tags: ['absence-management', 'critical'],
  },
  
  'employee-absences:edit': {
    id: 'employee-absences:edit',
    resource: ResourceType.EMPLOYEE_ABSENCES,
    action: ActionType.EDIT,
    name: 'Edit Absences',
    description: 'Edit existing absence records',
    isCritical: true,
    tags: ['absence-management', 'critical', 'data-modification'],
  },
  
  'employee-absences:delete': {
    id: 'employee-absences:delete',
    resource: ResourceType.EMPLOYEE_ABSENCES,
    action: ActionType.DELETE,
    name: 'Delete Absences',
    description: 'Delete absence records',
    isCritical: true,
    tags: ['absence-management', 'critical'],
  },
  
  'employee-absences:export': {
    id: 'employee-absences:export',
    resource: ResourceType.EMPLOYEE_ABSENCES,
    action: ActionType.EXPORT,
    name: 'Export Absences',
    description: 'Export absence data to CSV or other formats',
    tags: ['absence-management', 'data'],
  },
  
  'employee-absences:import': {
    id: 'employee-absences:import',
    resource: ResourceType.EMPLOYEE_ABSENCES,
    action: ActionType.IMPORT,
    name: 'Import Absences',
    description: 'Import absence data from CSV or other formats',
    isCritical: true,
    tags: ['absence-management', 'critical', 'data'],
  },
};
