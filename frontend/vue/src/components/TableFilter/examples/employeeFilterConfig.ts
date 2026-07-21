/**
 * Employee Table Filter Configuration Example
 * 
 * This is a complete example demonstrating all features of the TableFilter component.
 * Based on the actual implementation in employee-table-v2.
 * 
 * Features demonstrated:
 * - Text, tristate, and date range filters
 * - Dropdown presets with static and dynamic filters
 * - Quick preset buttons in filter dialog
 * - Field grouping for better organization
 * - Localization with i18nPrefix
 * - Storage and persistence
 * - Default values
 */

import type { TableFilterConfig } from '../types';
import dayjs from 'dayjs';

/**
 * Filter parameter interface
 * Matches Django REST framework query parameters
 */
export interface EmployeeFilters {
  // Text search filters (case-insensitive contains)
  lastname__icontains?: string;
  firstname__icontains?: string;
  email__icontains?: string;
  employee_id?: string;
  city__icontains?: string;
  business_phone__icontains?: string;
  mobile_phone__icontains?: string;
  
  // Boolean filters
  is_active?: boolean;
  
  // Tristate filter (null = any, false = has user, true = no user)
  user__id__isnull?: boolean;
  
  // Date range filters (ISO format strings)
  created_at__gte?: string;
  created_at__lte?: string;
  modified_at__gte?: string;
  modified_at__lte?: string;
}

/**
 * Complete filter configuration
 */
export const employeeFilterConfig: TableFilterConfig<EmployeeFilters> = {
  // Unique identifier for this filter config (used for storage)
  id: 'employee-table-v2',
  
  // Translation prefix for all labels
  // Example: 'employees.filters.fields.name' will be translated
  i18nPrefix: 'employees.filters',
  
  // ============================================
  // DROPDOWN PRESETS
  // ============================================
  // Appear in dropdown menu in TableSetup toolbar
  presets: [
    {
      id: 'all',
      labelKey: 'employees.filters.presets.all',
      icon: 'pi pi-list',
      filters: {}, // Empty = show all
    },
    {
      id: 'with-user',
      labelKey: 'employees.filters.presets.withUser',
      icon: 'pi pi-user',
      filters: {
        user__id__isnull: false, // Has associated user account
      },
    },
    {
      id: 'without-user',
      labelKey: 'employees.filters.presets.withoutUser',
      icon: 'pi pi-user-minus',
      filters: {
        user__id__isnull: true, // No associated user account
      },
    },
    {
      id: 'active',
      labelKey: 'employees.filters.presets.active',
      icon: 'pi pi-check-circle',
      filters: {
        is_active: true,
      },
    },
    {
      id: 'recent',
      labelKey: 'employees.filters.presets.recent',
      icon: 'pi pi-clock',
      // Dynamic filters using function - recalculated each time
      filters: () => ({
        created_at__gte: dayjs().subtract(30, 'days').toISOString(),
      }),
    },
  ],
  
  // ============================================
  // QUICK PRESETS
  // ============================================
  // Appear as buttons at top of filter dialog
  // Useful for common time ranges or quick filters
  quickPresets: [
    {
      id: 'this-week',
      labelKey: 'employees.filters.quickPresets.thisWeek',
      icon: 'pi pi-calendar',
      severity: 'info',
      filters: () => ({
        created_at__gte: dayjs().subtract(7, 'days').toISOString(),
      }),
    },
    {
      id: 'this-month',
      labelKey: 'employees.filters.quickPresets.thisMonth',
      icon: 'pi pi-calendar',
      severity: 'info',
      filters: () => ({
        created_at__gte: dayjs().startOf('month').toISOString(),
      }),
    },
    {
      id: 'last-quarter',
      labelKey: 'employees.filters.quickPresets.lastQuarter',
      icon: 'pi pi-calendar',
      severity: 'info',
      filters: () => ({
        created_at__gte: dayjs().subtract(3, 'months').toISOString(),
      }),
    },
  ],
  
  // ============================================
  // FILTER FIELDS
  // ============================================
  // All available filter fields organized in groups
  fields: [
    // ========== BASIC INFO GROUP ==========
    {
      key: 'lastname__icontains',
      type: 'text',
      labelKey: 'employees.filters.fields.name',
      group: 'basic',
      groupLabelKey: 'employees.filters.groups.basic',
      colSpan: 6, // Half width (12 = full width)
      options: {
        placeholderKey: 'employees.filters.fields.namePlaceholder',
      },
    },
    {
      key: 'email__icontains',
      type: 'text',
      labelKey: 'employees.filters.fields.email',
      group: 'basic',
      groupLabelKey: 'employees.filters.groups.basic',
      colSpan: 6,
      options: {
        placeholderKey: 'employees.filters.fields.emailPlaceholder',
      },
    },
    {
      key: 'employee_id',
      type: 'text',
      labelKey: 'employees.filters.fields.employeeId',
      group: 'basic',
      groupLabelKey: 'employees.filters.groups.basic',
      colSpan: 6,
      options: {
        placeholderKey: 'employees.filters.fields.employeeIdPlaceholder',
      },
    },
    
    // ========== CONTACT INFO GROUP ==========
    {
      key: 'city__icontains',
      type: 'text',
      labelKey: 'employees.filters.fields.city',
      group: 'contact',
      groupLabelKey: 'employees.filters.groups.contact',
      colSpan: 6,
      options: {
        placeholderKey: 'employees.filters.fields.cityPlaceholder',
      },
    },
    {
      key: 'business_phone__icontains',
      type: 'text',
      labelKey: 'employees.filters.fields.phone',
      group: 'contact',
      groupLabelKey: 'employees.filters.groups.contact',
      colSpan: 6,
      options: {
        placeholderKey: 'employees.filters.fields.phonePlaceholder',
      },
    },
    {
      key: 'mobile_phone__icontains',
      type: 'text',
      labelKey: 'employees.filters.fields.mobile',
      group: 'contact',
      groupLabelKey: 'employees.filters.groups.contact',
      colSpan: 6,
      options: {
        placeholderKey: 'employees.filters.fields.mobilePlaceholder',
      },
    },
    
    // ========== ADVANCED FILTERS GROUP ==========
    {
      key: 'user__id__isnull',
      type: 'tristate',
      labelKey: 'employees.filters.fields.hasUser',
      group: 'advanced',
      groupLabelKey: 'employees.filters.groups.advanced',
      colSpan: 6,
      // Tristate options are handled automatically with localization
      // Values: null (Any), false (Yes/Has User), true (No/No User)
      options: {
        tristateOptionsKey: 'employees.filters.fields.hasUserOptions',
      },
    },
    {
      key: 'is_active',
      type: 'boolean',
      labelKey: 'employees.filters.fields.isActive',
      group: 'advanced',
      groupLabelKey: 'employees.filters.groups.advanced',
      colSpan: 6,
    },
    {
      key: 'created_at__gte',
      type: 'dateRange',
      labelKey: 'employees.filters.fields.createdDate',
      group: 'advanced',
      groupLabelKey: 'employees.filters.groups.advanced',
      colSpan: 12, // Full width for date range
      options: {
        showButtonBar: true, // Show Today/Clear buttons
      },
    },
    {
      key: 'modified_at__gte',
      type: 'dateRange',
      labelKey: 'employees.filters.fields.modifiedDate',
      group: 'advanced',
      groupLabelKey: 'employees.filters.groups.advanced',
      colSpan: 12,
      options: {
        showButtonBar: true,
      },
    },
  ],
  
  // ============================================
  // STORAGE CONFIGURATION
  // ============================================
  storage: {
    enabled: true,        // Enable localStorage persistence
    persistPreset: true,  // Remember selected preset
    persistCustom: true,  // Remember custom filter values
    autoSave: false,      // Don't auto-save (user clicks Apply)
  },
  
  // ============================================
  // DEFAULT VALUES
  // ============================================
  defaults: {
    preset: 'all',  // Default to "All" preset
    filters: {},    // No filters applied by default
  },
};

/**
 * TRANSLATION KEYS NEEDED
 * ========================
 * 
 * Add these to your locale files (e.g., en/employees.ts):
 * 
 * employees: {
 *   filters: {
 *     presets: {
 *       all: 'All Employees',
 *       withUser: 'With User Account',
 *       withoutUser: 'Without User Account',
 *       active: 'Active Only',
 *       recent: 'Recent (30 days)',
 *     },
 *     quickPresets: {
 *       thisWeek: 'This Week',
 *       thisMonth: 'This Month',
 *       lastQuarter: 'Last Quarter',
 *     },
 *     groups: {
 *       basic: 'Basic Information',
 *       contact: 'Contact Information',
 *       advanced: 'Advanced Filters',
 *     },
 *     fields: {
 *       name: 'Last Name',
 *       namePlaceholder: 'Search by last name...',
 *       email: 'Email',
 *       emailPlaceholder: 'Search by email...',
 *       employeeId: 'Employee ID',
 *       employeeIdPlaceholder: 'Enter ID...',
 *       city: 'City',
 *       cityPlaceholder: 'Search by city...',
 *       phone: 'Business Phone',
 *       phonePlaceholder: 'Search by phone...',
 *       mobile: 'Mobile Phone',
 *       mobilePlaceholder: 'Search by mobile...',
 *       hasUser: 'Has User Account',
 *       isActive: 'Active',
 *       createdDate: 'Created Date',
 *       modifiedDate: 'Modified Date',
 *     },
 *   },
 * }
 */
