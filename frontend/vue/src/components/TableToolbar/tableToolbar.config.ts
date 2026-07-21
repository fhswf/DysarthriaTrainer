/**
 * Table Toolbar Component Configuration
 *
 * Configuration schema for the TableToolbar component.
 * Manages toolbar appearance, features, and text.
 */

import { registerComponent } from '@/stores/config/core/componentRegistry'
import type { BaseComponentConfig } from '@/stores/config/core/componentRegistry'

/**
 * TableToolbar configuration interface
 */
export interface TableToolbarConfig extends BaseComponentConfig {
  /** Display options */
  display: {
    showSearch: boolean
    showRefresh: boolean
    showCreate: boolean
    showExport: boolean
    showDeleteAll: boolean
  }

  /** Text and labels */
  labels: {
    searchPlaceholder: string
    createLabel: string
    deleteAllLabel: string
    refreshTooltip: string
    exportTooltip: string
    createTooltip: string
    deleteAllTooltip: string
  }

  /** Behavior */
  behavior: {
    debounceSearchMs: number
    confirmDelete: boolean
  }
}

/**
 * Default configuration for TableToolbar
 */
export const TABLE_TOOLBAR_DEFAULTS: TableToolbarConfig = {
  display: {
    showSearch: true,
    showRefresh: true,
    showCreate: true,
    showExport: false,
    showDeleteAll: false,
  },

  labels: {
    searchPlaceholder: 'Search...',
    createLabel: 'Create',
    deleteAllLabel: 'Delete',
    refreshTooltip: 'Refresh',
    exportTooltip: 'Export',
    createTooltip: 'Create new',
    deleteAllTooltip: 'Delete selected',
  },

  behavior: {
    debounceSearchMs: 300,
    confirmDelete: true,
  },
}

/**
 * Register TableToolbar configuration
 */
export const TableToolbarComponentConfig = registerComponent({
  componentId: 'table-toolbar',
  displayName: 'Table Toolbar',
  description: 'Toolbar for data tables with search, filter, and action buttons',
  category: 'ui',
  defaults: TABLE_TOOLBAR_DEFAULTS,
  persistable: true,
  version: '1.0.0',
})
