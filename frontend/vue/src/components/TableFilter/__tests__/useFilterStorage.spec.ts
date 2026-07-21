import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import { useFilterStorage } from '../composables/useFilterStorage';

interface TestFilters {
  name?: string;
  age?: number;
  isActive?: boolean;
}

describe('useFilterStorage', () => {
  const storageId = 'test-table';
  const storageKey = `table-filter:${storageId}`;

  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear();
  });

  describe('initialization', () => {
    it('auto-loads filters when storage exists and ref is empty', () => {
      // Pre-populate storage
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John', age: 30 }));
      
      const filters = ref<Partial<TestFilters>>({});
      useFilterStorage<TestFilters>(storageId, filters, { enabled: true });
      
      expect(filters.value).toEqual({ name: 'John', age: 30 });
    });

    it('does not overwrite existing filters on init', () => {
      // Pre-populate storage
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({ age: 25 });
      useFilterStorage<TestFilters>(storageId, filters, { enabled: true });
      
      expect(filters.value).toEqual({ age: 25 });
    });

    it('does not load when storage is disabled', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({});
      useFilterStorage<TestFilters>(storageId, filters, { enabled: false });
      
      expect(filters.value).toEqual({});
    });
  });

  describe('saveFilters', () => {
    it('saves filters to session storage', () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John', age: 30 });
      const { saveFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      const result = saveFilters();
      
      expect(result).toBe(true);
      const stored = sessionStorage.getItem(storageKey);
      expect(stored).toBe(JSON.stringify({ name: 'John', age: 30 }));
    });

    it('saves provided filters instead of ref value', () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      const { saveFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      const result = saveFilters({ age: 25 });
      
      expect(result).toBe(true);
      const stored = sessionStorage.getItem(storageKey);
      expect(stored).toBe(JSON.stringify({ age: 25 }));
    });

    it('returns false when storage is disabled', () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      const { saveFilters } = useFilterStorage<TestFilters>(storageId, filters, {
        enabled: false,
      });
      
      const result = saveFilters();
      
      expect(result).toBe(false);
      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });

    it('handles save errors gracefully', () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      const { saveFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      // Mock setItem to throw error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });
      
      const result = saveFilters();
      
      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      
      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleError.mockRestore();
    });
  });

  describe('loadFilters', () => {
    it('loads filters from session storage', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John', age: 30 }));
      
      const filters = ref<Partial<TestFilters>>({});
      const { loadFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      const result = loadFilters();
      
      expect(result).toEqual({ name: 'John', age: 30 });
      expect(filters.value).toEqual({ name: 'John', age: 30 });
    });

    it('loads without applying to ref when applyToRef is false', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      // Start with non-empty filters to prevent auto-load
      const filters = ref<Partial<TestFilters>>({ age: 25 });
      const { loadFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      // Clear the filters after init
      filters.value = {};
      
      const result = loadFilters(false);
      
      expect(result).toEqual({ name: 'John' });
      expect(filters.value).toEqual({}); // Should remain empty
    });

    it('returns null when no stored filters exist', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { loadFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      const result = loadFilters();
      
      expect(result).toBeNull();
    });

    it('returns null when storage is disabled', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({});
      const { loadFilters } = useFilterStorage<TestFilters>(storageId, filters, {
        enabled: false,
      });
      
      const result = loadFilters();
      
      expect(result).toBeNull();
    });

    it('handles load errors gracefully', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { loadFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      // Mock getItem to throw error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      const result = loadFilters();
      
      expect(result).toBeNull();
      expect(consoleError).toHaveBeenCalled();
      
      // Restore
      Storage.prototype.getItem = originalGetItem;
      consoleError.mockRestore();
    });
  });

  describe('clearStorage', () => {
    it('clears filters from session storage', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      const { clearStorage } = useFilterStorage<TestFilters>(storageId, filters);
      
      const result = clearStorage();
      
      expect(result).toBe(true);
      expect(sessionStorage.getItem(storageKey)).toBeNull();
      expect(filters.value).toEqual({ name: 'John' }); // Ref not cleared
    });

    it('clears both storage and ref when clearRef is true', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      const { clearStorage } = useFilterStorage<TestFilters>(storageId, filters);
      
      const result = clearStorage(true);
      
      expect(result).toBe(true);
      expect(sessionStorage.getItem(storageKey)).toBeNull();
      expect(filters.value).toEqual({});
    });

    it('returns false when storage is disabled', () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      const { clearStorage } = useFilterStorage<TestFilters>(storageId, filters, {
        enabled: false,
      });
      
      const result = clearStorage();
      
      expect(result).toBe(false);
    });

    it('handles clear errors gracefully', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { clearStorage } = useFilterStorage<TestFilters>(storageId, filters);
      
      // Mock removeItem to throw error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      const result = clearStorage();
      
      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      
      // Restore
      Storage.prototype.removeItem = originalRemoveItem;
      consoleError.mockRestore();
    });
  });

  describe('hasStoredFilters', () => {
    it('returns true when filters exist in storage', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({});
      const { hasStoredFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      expect(hasStoredFilters()).toBe(true);
    });

    it('returns false when no filters in storage', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { hasStoredFilters } = useFilterStorage<TestFilters>(storageId, filters);
      
      expect(hasStoredFilters()).toBe(false);
    });

    it('returns false when storage is disabled', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({});
      const { hasStoredFilters } = useFilterStorage<TestFilters>(storageId, filters, {
        enabled: false,
      });
      
      expect(hasStoredFilters()).toBe(false);
    });
  });

  describe('getStorageSize', () => {
    it('returns size of stored filters in bytes', () => {
      const data = { name: 'John', age: 30 };
      sessionStorage.setItem(storageKey, JSON.stringify(data));
      
      const filters = ref<Partial<TestFilters>>({});
      const { getStorageSize } = useFilterStorage<TestFilters>(storageId, filters);
      
      const size = getStorageSize();
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBe(new Blob([JSON.stringify(data)]).size);
    });

    it('returns 0 when no stored filters', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { getStorageSize } = useFilterStorage<TestFilters>(storageId, filters);
      
      expect(getStorageSize()).toBe(0);
    });

    it('returns 0 when storage is disabled', () => {
      sessionStorage.setItem(storageKey, JSON.stringify({ name: 'John' }));
      
      const filters = ref<Partial<TestFilters>>({});
      const { getStorageSize } = useFilterStorage<TestFilters>(storageId, filters, {
        enabled: false,
      });
      
      expect(getStorageSize()).toBe(0);
    });
  });

  describe('autoSave', () => {
    it('auto-saves when filters change', async () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      useFilterStorage<TestFilters>(storageId, filters, {
        enabled: true,
        autoSave: true,
      });
      
      // Wait for initial save
      await new Promise(resolve => setTimeout(resolve, 10));
      
      filters.value = { name: 'Jane', age: 25 };
      
      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const stored = sessionStorage.getItem(storageKey);
      expect(stored).toBe(JSON.stringify({ name: 'Jane', age: 25 }));
    });

    it('does not auto-save when disabled', async () => {
      const filters = ref<Partial<TestFilters>>({ name: 'John' });
      useFilterStorage<TestFilters>(storageId, filters, {
        enabled: true,
        autoSave: false,
      });
      
      filters.value = { name: 'Jane' };
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe('configuration', () => {
    it('exposes storageKey', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { storageKey: key } = useFilterStorage<TestFilters>(storageId, filters);
      
      expect(key).toBe(`table-filter:${storageId}`);
    });

    it('exposes enabled flag', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { enabled } = useFilterStorage<TestFilters>(storageId, filters, {
        enabled: false,
      });
      
      expect(enabled).toBe(false);
    });

    it('exposes autoSave flag', () => {
      const filters = ref<Partial<TestFilters>>({});
      const { autoSave } = useFilterStorage<TestFilters>(storageId, filters, {
        autoSave: true,
      });
      
      expect(autoSave).toBe(true);
    });
  });
});
