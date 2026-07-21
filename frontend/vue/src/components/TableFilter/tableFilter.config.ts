/**
 * Table Filter Component Configuration
 *
 * Configuration schema for the TableFilter component.
 * Manages filter dialog appearance and behavior.
 */

import { registerComponent } from '@/stores/config/core/componentRegistry'
import type { BaseComponentConfig } from '@/stores/config/core/componentRegistry'

/**
 * TableFilter configuration interface
 */
export interface TableFilterConfig extends BaseComponentConfig {
  /** Display options */
  display: {
    showPresets: boolean
    showQuickPresets: boolean
    groupFields: boolean
    showClearButton: boolean
    showApplyButton: boolean
  }

  /** Dialog behavior */
  dialog: {
    modal: boolean
    closeOnApply: boolean
    closeOnEscape: boolean
    width: string
    maxHeight: string
  }

  /** Validation */
  validation: {
    validateOnChange: boolean
    showInlineErrors: boolean
  }

  /** i18n */
  i18n: {
    prefix: string
  }
}

/**
 * Default configuration for TableFilter
 */
export const TABLE_FILTER_DEFAULTS: TableFilterConfig = {
  display: {
    showPresets: true,
    showQuickPresets: true,
    groupFields: true,
    showClearButton: true,
    showApplyButton: true,
  },

  dialog: {
    modal: true,
    closeOnApply: true,
    closeOnEscape: true,
    width: '600px',
    maxHeight: '80vh',
  },

  validation: {
    validateOnChange: true,
    showInlineErrors: true,
  },

  i18n: {
    prefix: 'filter',
  },
}

/**
 * Register TableFilter configuration
 */
export const TableFilterComponentConfig = registerComponent({
  componentId: 'table-filter',
  displayName: 'Table Filter',
  description: 'Advanced filtering component with presets and validation',
  category: 'form',
  defaults: TABLE_FILTER_DEFAULTS,
  persistable: true,
  version: '1.0.0',
})
