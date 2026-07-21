import type { TableStorageState } from '../TableSetup.types';

/**
 * Session storage composable for table state
 * 
 * @param storageKey - Unique key for storage
 * @returns Storage methods
 */
export function useTableSetupStorage(storageKey: string) {
  /**
   * Load state from session storage
   */
  function loadState(): TableStorageState | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }

    try {
      const stored = window.sessionStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[useTableSetupStorage] Failed to load table state:', error);
      return null;
    }
  }

  /**
   * Save state to session storage
   */
  function saveState(state: TableStorageState): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    try {
      const serialized = JSON.stringify(state);
      window.sessionStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.error('[useTableSetupStorage] Failed to save table state:', error);
    }
  }

  /**
   * Clear state from session storage
   */
  function clearState(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    try {
      window.sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error('[useTableSetupStorage] Failed to clear table state:', error);
    }
  }

  /**
   * Update specific state property
   */
  function updateState(key: keyof TableStorageState, value: any): void {
    const currentState = loadState() || {};
    saveState({
      ...currentState,
      [key]: value,
    });
  }

  return {
    loadState,
    saveState,
    clearState,
    updateState,
  };
}
