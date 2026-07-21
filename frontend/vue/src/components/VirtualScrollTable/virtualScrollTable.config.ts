/**
 * Virtual Scroll Table Component Configuration
 *
 * Configuration schema for the VirtualScrollTable component.
 * Manages table appearance, performance, and features.
 */

import { registerComponent } from '@/stores/config/core/componentRegistry'
import type { BaseComponentConfig } from '@/stores/config/core/componentRegistry'

/**
 * VirtualScrollTable configuration interface
 */
export interface VirtualScrollTableConfig extends BaseComponentConfig {
  /** Display options */
  display: {
    showHeader: boolean
    showPagination: boolean
    showSelection: boolean
    showActions: boolean
    stripedRows: boolean
    hoverRows: boolean
    compactMode: boolean
  }

  /** Virtual scrolling */
  virtualScroll: {
    enabled: boolean
    itemHeight: number
    bufferSize: number
    threshold: number
  }

  /** Performance */
  performance: {
    lazy: boolean
    loadingDelay: number
    debounceMs: number
  }

  /** Selection */
  selection: {
    mode: 'single' | 'multiple' | 'none'
    highlightSelected: boolean
    preserveSelection: boolean
  }

  /** Sorting */
  sorting: {
    enabled: boolean
    mode: 'single' | 'multiple'
    removableSort: boolean
  }
}

/**
 * Default configuration for VirtualScrollTable
 */
export const VIRTUAL_SCROLL_TABLE_DEFAULTS: VirtualScrollTableConfig = {
  display: {
    showHeader: true,
    showPagination: false,
    showSelection: false,
    showActions: true,
    stripedRows: false,
    hoverRows: true,
    compactMode: false,
  },

  virtualScroll: {
    enabled: true,
    itemHeight: 50,
    bufferSize: 10,
    threshold: 500,
  },

  performance: {
    lazy: true,
    loadingDelay: 200,
    debounceMs: 150,
  },

  selection: {
    mode: 'none',
    highlightSelected: true,
    preserveSelection: true,
  },

  sorting: {
    enabled: true,
    mode: 'single',
    removableSort: true,
  },
}

/**
 * Register VirtualScrollTable configuration
 */
export const VirtualScrollTableComponentConfig = registerComponent({
  componentId: 'virtual-scroll-table',
  displayName: 'Virtual Scroll Table',
  description: 'High-performance data table with virtual scrolling',
  category: 'visualization',
  defaults: VIRTUAL_SCROLL_TABLE_DEFAULTS,
  persistable: true,
  version: '1.0.0',
})
