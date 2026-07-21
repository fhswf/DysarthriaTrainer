/**
 * Employee Access Rights
 * 
 * Defines permissions for employee management operations
 */

import { ResourceType, ActionType, type AccessRightsCollection } from './types';

/**
 * Employee Management Access Rights
 */
export const EMPLOYEE_RIGHTS: AccessRightsCollection = {
  'employees:view': {
    id: 'employees:view',
    resource: ResourceType.EMPLOYEES,
    action: ActionType.VIEW,
    name: 'View Employees',
    description: 'View employee list and details',
    tags: ['employee-management', 'basic'],
  },
  
  'employees:create': {
    id: 'employees:create',
    resource: ResourceType.EMPLOYEES,
    action: ActionType.CREATE,
    name: 'Create Employees',
    description: 'Create new employee records',
    isCritical: true,
    tags: ['employee-management', 'critical'],
  },
  
  'employees:edit': {
    id: 'employees:edit',
    resource: ResourceType.EMPLOYEES,
    action: ActionType.EDIT,
    name: 'Edit Employees',
    description: 'Edit existing employee information',
    tags: ['employee-management', 'data-modification'],
  },
  
  'employees:delete': {
    id: 'employees:delete',
    resource: ResourceType.EMPLOYEES,
    action: ActionType.DELETE,
    name: 'Delete Employees',
    description: 'Delete employee records (soft delete)',
    isCritical: true,
    tags: ['employee-management', 'critical'],
  },
  
  'employees:export': {
    id: 'employees:export',
    resource: ResourceType.EMPLOYEES,
    action: ActionType.EXPORT,
    name: 'Export Employees',
    description: 'Export employee data to CSV or other formats',
    tags: ['employee-management', 'data'],
  },
  
  'employees:import': {
    id: 'employees:import',
    resource: ResourceType.EMPLOYEES,
    action: ActionType.IMPORT,
    name: 'Import Employees',
    description: 'Import employee data from CSV or other formats',
    isCritical: true,
    tags: ['employee-management', 'critical', 'data'],
  },
};
