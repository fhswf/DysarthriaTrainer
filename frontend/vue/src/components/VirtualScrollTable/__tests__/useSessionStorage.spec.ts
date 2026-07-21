import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useSessionStorage } from '../composables/useSessionStorage';

describe('useSessionStorage', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Configuration', () => {
    it('should require storageKey', () => {
      const searchQuery = ref('');
      
      const { loadState } = useSessionStorage(
        { storageKey: 'test-table' },
        { search: searchQuery }
      );

      expect(loadState).toBeDefined();
    });

    it('should use storageKey as prefix for all keys', () => {
      const searchQuery = ref('test');
      const sortField = ref('name');

      useSessionStorage(
        {
          storageKey: 'user-table',
          persistSearch: true,
          persistSort: true,
        },
        {
          search: searchQuery,
          sortField,
        }
      );

      // Wait for debounce
      vi.advanceTimersByTime(300);

      expect(sessionStorage.getItem('user-table:search')).toBeTruthy();
      expect(sessionStorage.getItem('user-table:sortField')).toBeTruthy();
    });

    it('should respect individual persistence flags', () => {
      const searchQuery = ref('test');
      const sortField = ref('name');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
          persistSort: false, // Disabled
        },
        {
          search: searchQuery,
          sortField,
        }
      );

      vi.advanceTimersByTime(300);

      expect(sessionStorage.getItem('test-table:search')).toBeTruthy();
      expect(sessionStorage.getItem('test-table:sortField')).toBeNull();
    });
  });

  describe('Immediate State Loading', () => {
    it('should load search state immediately (not in onMounted)', () => {
      // Pre-populate storage
      sessionStorage.setItem('test-table:search', JSON.stringify('saved search'));

      const searchQuery = ref('');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
        },
        { search: searchQuery }
      );

      // Should be loaded immediately, not after nextTick
      expect(searchQuery.value).toBe('saved search');
    });

    it('should load scroll position immediately', () => {
      sessionStorage.setItem('test-table:scroll', JSON.stringify(150));

      const scrollPosition = ref(0);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistScroll: true,
        },
        { scrollPosition }
      );

      expect(scrollPosition.value).toBe(150);
    });

    it('should load sort state immediately', () => {
      sessionStorage.setItem('test-table:sortField', JSON.stringify('username'));
      sessionStorage.setItem('test-table:sortOrder', JSON.stringify(-1));

      const sortField = ref('');
      const sortOrder = ref<1 | -1>(1);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSort: true,
        },
        {
          sortField,
          sortOrder,
        }
      );

      expect(sortField.value).toBe('username');
      expect(sortOrder.value).toBe(-1);
    });

    it('should load filters immediately', () => {
      const savedFilters = { status: 'active', role: 'admin' };
      sessionStorage.setItem('test-table:filters', JSON.stringify(savedFilters));

      const filters = ref({});

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistFilters: true,
        },
        { filters }
      );

      expect(filters.value).toEqual(savedFilters);
    });

    it('should not override state if nothing saved', () => {
      const searchQuery = ref('initial value');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
        },
        { search: searchQuery }
      );

      expect(searchQuery.value).toBe('initial value');
    });
  });

  describe('Auto-persistence with Watchers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should save search state when changed', async () => {
      const searchQuery = ref('');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
        },
        { search: searchQuery }
      );

      searchQuery.value = 'new search';
      await nextTick();

      // Wait for debounce
      vi.advanceTimersByTime(300);

      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify('new search'));
    });

    it('should save scroll position when changed', async () => {
      const scrollPosition = ref(0);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistScroll: true,
        },
        { scrollPosition }
      );

      scrollPosition.value = 250;
      await nextTick();

      vi.advanceTimersByTime(300);

      expect(sessionStorage.getItem('test-table:scroll')).toBe(JSON.stringify(250));
    });

    it('should save sort state when changed', async () => {
      const sortField = ref('name');
      const sortOrder = ref<1 | -1>(1);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSort: true,
        },
        {
          sortField,
          sortOrder,
        }
      );

      sortField.value = 'email';
      sortOrder.value = -1;
      await nextTick();

      vi.advanceTimersByTime(300);

      expect(sessionStorage.getItem('test-table:sortField')).toBe(JSON.stringify('email'));
      expect(sessionStorage.getItem('test-table:sortOrder')).toBe(JSON.stringify(-1));
    });

    it('should save filters when changed', async () => {
      const filters = ref<Record<string, any>>({ status: 'active' });

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistFilters: true,
        },
        { filters }
      );

      filters.value = { status: 'inactive', role: 'user' };
      await nextTick();

      vi.advanceTimersByTime(300);

      const saved = JSON.parse(sessionStorage.getItem('test-table:filters') || '{}');
      expect(saved).toEqual({ status: 'inactive', role: 'user' });
    });

    it('should use custom debounce delay', async () => {
      const searchQuery = ref('');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
          debounceDelay: 500, // Custom delay
        },
        { search: searchQuery }
      );

      searchQuery.value = 'test';
      await nextTick();

      // Too early
      vi.advanceTimersByTime(300);
      expect(sessionStorage.getItem('test-table:search')).toBeNull();

      // Now it should save
      vi.advanceTimersByTime(200);
      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify('test'));
    });

    it('should debounce multiple rapid changes', async () => {
      const searchQuery = ref('');
      const saveSpy = vi.spyOn(Storage.prototype, 'setItem');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
          debounceDelay: 300,
        },
        { search: searchQuery }
      );

      // Rapid changes
      searchQuery.value = 'a';
      await nextTick();
      searchQuery.value = 'ab';
      await nextTick();
      searchQuery.value = 'abc';
      await nextTick();

      // Should not have saved yet
      expect(saveSpy).not.toHaveBeenCalled();

      // Wait for debounce
      vi.advanceTimersByTime(300);

      // Should save only once with final value
      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify('abc'));
    });

    it('should watch deep changes in filters', async () => {
      const filters = ref({ status: 'active', nested: { value: 1 } });

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistFilters: true,
        },
        { filters }
      );

      // Deep change
      filters.value.nested.value = 2;
      await nextTick();

      vi.advanceTimersByTime(300);

      const saved = JSON.parse(sessionStorage.getItem('test-table:filters') || '{}');
      expect(saved.nested.value).toBe(2);
    });
  });

  describe('Manual State Management', () => {
    it('should provide loadState method', () => {
      sessionStorage.setItem('test-table:search', JSON.stringify('manual search'));

      const { loadState } = useSessionStorage({ storageKey: 'test-table' });

      const state = loadState();
      expect(state.search).toBe('manual search');
    });

    it('should provide saveState method', () => {
      const { saveState } = useSessionStorage({ storageKey: 'test-table' });

      saveState({
        search: 'manual save',
        scrollPosition: 100,
        sortField: 'name',
        sortOrder: -1,
        filters: { status: 'active' },
      });

      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify('manual save'));
      expect(sessionStorage.getItem('test-table:scroll')).toBe(JSON.stringify(100));
      expect(sessionStorage.getItem('test-table:sortField')).toBe(JSON.stringify('name'));
      expect(sessionStorage.getItem('test-table:sortOrder')).toBe(JSON.stringify(-1));
      expect(sessionStorage.getItem('test-table:filters')).toBe(
        JSON.stringify({ status: 'active' })
      );
    });

    it('should provide clearStorage method', () => {
      // Populate storage
      sessionStorage.setItem('test-table:search', JSON.stringify('test'));
      sessionStorage.setItem('test-table:scroll', JSON.stringify(100));
      sessionStorage.setItem('test-table:sortField', JSON.stringify('name'));
      sessionStorage.setItem('test-table:sortOrder', JSON.stringify(-1));
      sessionStorage.setItem('test-table:filters', JSON.stringify({ status: 'active' }));

      const { clearStorage } = useSessionStorage({ storageKey: 'test-table' });

      clearStorage();

      expect(sessionStorage.getItem('test-table:search')).toBeNull();
      expect(sessionStorage.getItem('test-table:scroll')).toBeNull();
      expect(sessionStorage.getItem('test-table:sortField')).toBeNull();
      expect(sessionStorage.getItem('test-table:sortOrder')).toBeNull();
      expect(sessionStorage.getItem('test-table:filters')).toBeNull();
    });

    it('should work without automatic persistence', () => {
      const { loadState, saveState } = useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: false,
        }
        // No state refs provided
      );

      saveState({ search: 'manual' });
      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify('manual'));

      const loaded = loadState();
      expect(loaded.search).toBe('manual');
    });
  });

  describe('SSR Safety', () => {
    it('should not crash when window is undefined', () => {
      const originalWindow = global.window;

      // Simulate SSR environment
      // @ts-ignore
      delete global.window;

      const searchQuery = ref('test');

      expect(() => {
        useSessionStorage(
          {
            storageKey: 'test-table',
            persistSearch: true,
          },
          { search: searchQuery }
        );
      }).not.toThrow();

      // Restore
      global.window = originalWindow;
    });

    it('should not crash when sessionStorage throws error', () => {
      const originalSessionStorage = sessionStorage;

      // @ts-ignore
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('Storage disabled');
        },
        configurable: true,
      });

      const searchQuery = ref('test');

      expect(() => {
        useSessionStorage(
          {
            storageKey: 'test-table',
            persistSearch: true,
          },
          { search: searchQuery }
        );
      }).not.toThrow();

      // Restore
      Object.defineProperty(window, 'sessionStorage', {
        value: originalSessionStorage,
        configurable: true,
      });
    });

    it('should gracefully degrade when storage is unavailable', () => {
      const mockSessionStorage = {
        getItem: vi.fn(() => {
          throw new Error('Storage quota exceeded');
        }),
        setItem: vi.fn(() => {
          throw new Error('Storage quota exceeded');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };

      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        configurable: true,
      });

      const searchQuery = ref('test');

      expect(() => {
        const { loadState, saveState } = useSessionStorage(
          {
            storageKey: 'test-table',
            persistSearch: true,
          },
          { search: searchQuery }
        );

        loadState();
        saveState({ search: 'test' });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const searchQuery = ref('initial');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
        },
        { search: searchQuery }
      );

      searchQuery.value = '';

      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify(''));
    });

    it('should handle null values', () => {
      const filters = ref<any>(null);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistFilters: true,
        },
        { filters }
      );

      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      expect(sessionStorage.getItem('test-table:filters')).toBe(JSON.stringify(null));
    });

    it('should handle undefined values', () => {
      const sortField = ref<string>('');

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSort: true,
        },
        { sortField }
      );

      sortField.value = undefined as any;

      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      expect(sessionStorage.getItem('test-table:sortField')).toBe(JSON.stringify(undefined));
    });

    it('should handle zero scroll position', () => {
      const scrollPosition = ref(0);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistScroll: true,
        },
        { scrollPosition }
      );

      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      expect(sessionStorage.getItem('test-table:scroll')).toBe(JSON.stringify(0));
    });

    it('should handle complex nested objects in filters', () => {
      const complexFilters = ref({
        status: ['active', 'pending'],
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
        nested: {
          deep: {
            value: true,
          },
        },
      });

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistFilters: true,
        },
        { filters: complexFilters }
      );

      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      const saved = JSON.parse(sessionStorage.getItem('test-table:filters') || '{}');
      expect(saved).toEqual(complexFilters.value);
    });

    it('should handle JSON parse errors gracefully', () => {
      // Corrupt JSON in storage
      sessionStorage.setItem('test-table:search', 'invalid json {');

      const searchQuery = ref('default');

      expect(() => {
        useSessionStorage(
          {
            storageKey: 'test-table',
            persistSearch: true,
          },
          { search: searchQuery }
        );
      }).not.toThrow();

      // Should keep default value
      expect(searchQuery.value).toBe('default');
    });
  });

  describe('Multiple Instances', () => {
    it('should support multiple table instances with different keys', () => {
      const userSearch = ref('user search');
      const patientSearch = ref('patient search');

      useSessionStorage(
        {
          storageKey: 'user-table',
          persistSearch: true,
        },
        { search: userSearch }
      );

      useSessionStorage(
        {
          storageKey: 'patient-table',
          persistSearch: true,
        },
        { search: patientSearch }
      );

      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      expect(sessionStorage.getItem('user-table:search')).toBe(JSON.stringify('user search'));
      expect(sessionStorage.getItem('patient-table:search')).toBe(
        JSON.stringify('patient search')
      );
    });

    it('should not conflict between different tables', () => {
      sessionStorage.setItem('user-table:search', JSON.stringify('user'));
      sessionStorage.setItem('patient-table:search', JSON.stringify('patient'));

      const userSearch = ref('');
      const patientSearch = ref('');

      useSessionStorage(
        { storageKey: 'user-table', persistSearch: true },
        { search: userSearch }
      );

      useSessionStorage(
        { storageKey: 'patient-table', persistSearch: true },
        { search: patientSearch }
      );

      expect(userSearch.value).toBe('user');
      expect(patientSearch.value).toBe('patient');
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle full table state lifecycle', async () => {
      const searchQuery = ref('');
      const scrollPosition = ref(0);
      const sortField = ref('username');
      const sortOrder = ref<1 | -1>(1);

      const { clearStorage } = useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
          persistScroll: true,
          persistSort: true,
        },
        {
          search: searchQuery,
          scrollPosition,
          sortField,
          sortOrder,
        }
      );

      // User interactions
      searchQuery.value = 'john';
      await nextTick();
      vi.advanceTimersByTime(300);

      scrollPosition.value = 150;
      await nextTick();
      vi.advanceTimersByTime(300);

      sortField.value = 'email';
      sortOrder.value = -1;
      await nextTick();
      vi.advanceTimersByTime(300);

      // Verify all saved
      expect(sessionStorage.getItem('test-table:search')).toBe(JSON.stringify('john'));
      expect(sessionStorage.getItem('test-table:scroll')).toBe(JSON.stringify(150));
      expect(sessionStorage.getItem('test-table:sortField')).toBe(JSON.stringify('email'));
      expect(sessionStorage.getItem('test-table:sortOrder')).toBe(JSON.stringify(-1));

      // Clear
      clearStorage();

      expect(sessionStorage.getItem('test-table:search')).toBeNull();
      expect(sessionStorage.getItem('test-table:scroll')).toBeNull();
      expect(sessionStorage.getItem('test-table:sortField')).toBeNull();
      expect(sessionStorage.getItem('test-table:sortOrder')).toBeNull();
    });

    it('should restore state after page navigation', () => {
      // Simulate first page visit
      const search1 = ref('');
      const scroll1 = ref(0);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
          persistScroll: true,
        },
        {
          search: search1,
          scrollPosition: scroll1,
        }
      );

      search1.value = 'saved search';
      scroll1.value = 200;

      vi.advanceTimersByTime(300);

      // Simulate navigation away and back (new component instance)
      const search2 = ref('');
      const scroll2 = ref(0);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistSearch: true,
          persistScroll: true,
        },
        {
          search: search2,
          scrollPosition: scroll2,
        }
      );

      // Should restore immediately
      expect(search2.value).toBe('saved search');
      expect(scroll2.value).toBe(200);
    });

    it('should handle delete operations with scroll preservation', async () => {
      const scrollPosition = ref(150);

      useSessionStorage(
        {
          storageKey: 'test-table',
          persistScroll: true,
        },
        { scrollPosition }
      );

      vi.advanceTimersByTime(300);

      // Simulate delete operation (adjust scroll)
      scrollPosition.value = Math.max(0, scrollPosition.value - 1);
      await nextTick();

      vi.advanceTimersByTime(300);

      expect(sessionStorage.getItem('test-table:scroll')).toBe(JSON.stringify(149));
    });
  });
});
