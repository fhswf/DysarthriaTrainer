/**
 * Access Rights Type Definitions
 * 
 * Defines types and enums for the access control system
 */

/**
 * Resource types in the system
 * Generic example resources - adapt to your application needs
 */
export enum ResourceType {
  // Core entities (example: content management)
  CONTENT = 'content',
  USERS = 'users',
  ROLES = 'roles',
  FILES = 'files',
  EMPLOYEES = 'employees',
  EMPLOYEE_ABSENCES = 'employee-absences',
  EMPLOYEE_ABSENCE_DEMANDS = 'employee-absence-demands',
  POLYPOINT_ENTRIES = 'polypoint-entries',
  POLYPOINT_LOGS = 'polypoint-logs',
  
  // Administrative
  REPORTS = 'reports',
  SETTINGS = 'settings',
  AUDIT_LOGS = 'audit-logs',
}

/**
 * Action types
 */
export enum ActionType {
  VIEW = 'view',           // Read access
  CREATE = 'create',       // Create new
  EDIT = 'edit',           // Update existing
  DELETE = 'delete',       // Remove
  EXPORT = 'export',       // Export data
  IMPORT = 'import',       // Import data
  APPROVE = 'approve',     // Approval workflow
  ASSIGN = 'assign',       // Assign to others
  OVERRIDE = 'override',   // Override restrictions
}

/**
 * Access Right Definition
 */
export interface AccessRightDefinition {
  /** Unique identifier in format "resource:action" */
  id: string;
  
  /** Resource being accessed */
  resource: ResourceType;
  
  /** Action being performed */
  action: ActionType;
  
  /** Human-readable name */
  name: string;
  
  /** Detailed description */
  description: string;
  
  /** Is this a critical/sensitive permission? */
  isCritical?: boolean;
  
  /** Tags for grouping/filtering */
  tags?: string[];
}

/**
 * Access Rights Collection
 */
export interface AccessRightsCollection {
  [key: string]: AccessRightDefinition;
}
