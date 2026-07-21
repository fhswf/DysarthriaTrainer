/**
 * TableToolbar Component Types
 * 
 * Type definitions for the standardized table toolbar component.
 */

/**
 * Props for TableToolbar component
 */
export interface TableToolbarProps {
  // Title and Search
  /** Toolbar title (displayed in search input group) */
  title?: string;
  
  /** Search query (v-model) */
  searchQuery?: string;
  
  /** Search input placeholder text (i18n key or direct string) */
  searchPlaceholder?: string;
  
  // Visibility Toggles
  /** Show search input group (default: true) */
  showSearch?: boolean;
  
  /** Show refresh button (default: true) */
  showRefresh?: boolean;
  
  /** Show export button (default: true) */
  showExport?: boolean;
  
  /** Show create button (default: true) */
  showCreate?: boolean;
  
  /** Show delete all button (default: false) */
  showDeleteAll?: boolean;
  
  // Labels (i18n keys or direct strings)
  /** Refresh button label (optional, uses tooltip if not provided) */
  refreshLabel?: string;
  
  /** Export button label (optional, uses tooltip if not provided) */
  exportLabel?: string;
  
  /** Create button label (i18n key or direct string) */
  createLabel?: string;
  
  /** Delete all button label (i18n key or direct string) */
  deleteAllLabel?: string;
  
  // Tooltips (i18n keys or direct strings)
  /** Refresh button tooltip */
  refreshTooltip?: string;
  
  /** Export button tooltip */
  exportTooltip?: string;
  
  /** Create button tooltip */
  createTooltip?: string;
  
  /** Delete all button tooltip */
  deleteAllTooltip?: string;
  
  // State
  /** Loading state (shows spinner on refresh button, disables all actions) */
  loading?: boolean;
  
  /** Disable all toolbar actions */
  disabled?: boolean;
  
  /** Number of selected items (for delete all badge) */
  selectedCount?: number;
}

/**
 * Events emitted by TableToolbar component
 */
export interface TableToolbarEmits {
  /** Emitted when search query changes (v-model) */
  (e: 'update:searchQuery', value: string): void;
  
  /** Emitted when refresh button is clicked */
  (e: 'refresh'): void;
  
  /** Emitted when export button is clicked */
  (e: 'export'): void;
  
  /** Emitted when create button is clicked */
  (e: 'create'): void;
  
  /** Emitted when delete all button is clicked */
  (e: 'delete-all'): void;
}

/**
 * Slots available in TableToolbar component
 */
export interface TableToolbarSlots {
  /** Custom filter component (e.g., SplitButton, FilterDialog) */
  filter?: () => any;
  
  /** Additional actions before standard end buttons */
  'actions-prepend'?: () => any;
  
  /** Additional actions after standard end buttons */
  'actions-append'?: () => any;
}
