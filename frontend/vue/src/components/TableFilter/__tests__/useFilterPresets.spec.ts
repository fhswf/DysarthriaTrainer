import { describe, it, expect } from 'vitest';
import { useFilterPresets } from '../composables/useFilterPresets';
import type { FilterPreset, QuickPreset } from '../types';

interface TestFilters {
  name?: string;
  age?: number;
  isActive?: boolean;
  department?: string;
}

describe('useFilterPresets', () => {
  // Sample presets for testing
  const staticPresets: FilterPreset<TestFilters>[] = [
    {
      id: 'all',
      labelKey: 'All',
      icon: 'pi pi-list',
      filters: {},
    },
    {
      id: 'active',
      labelKey: 'Active',
      icon: 'pi pi-check',
      filters: { isActive: true },
    },
    {
      id: 'it-dept',
      labelKey: 'IT Department',
      icon: 'pi pi-users',
      filters: { department: 'IT', isActive: true },
    },
  ];

  const dynamicPresets: FilterPreset<TestFilters>[] = [
    {
      id: 'dynamic',
      labelKey: 'Dynamic',
      icon: 'pi pi-star',
      filters: () => ({ age: 25 }),
    },
  ];

  const sampleQuickPresets: QuickPreset<TestFilters>[] = [
    {
      id: 'john',
      labelKey: 'John',
      icon: 'pi pi-user',
      filters: { name: 'John' },
    },
    {
      id: 'seniors',
      labelKey: 'Seniors',
      icon: 'pi pi-users',
      filters: () => ({ age: 65 }),
    },
  ];

  describe('initialization', () => {
    it('initializes with no selected preset by default', () => {
      const { selectedPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(selectedPreset.value).toBeNull();
    });

    it('auto-selects default preset when defaultPresetId is provided', () => {
      const { selectedPreset } = useFilterPresets<TestFilters>(
        staticPresets,
        [],
        'active'
      );
      
      expect(selectedPreset.value).not.toBeNull();
      expect(selectedPreset.value?.id).toBe('active');
    });

    it('falls back to first preset if defaultPresetId not found', () => {
      const { selectedPreset } = useFilterPresets<TestFilters>(
        staticPresets,
        [],
        'nonexistent'
      );
      
      expect(selectedPreset.value).not.toBeNull();
      expect(selectedPreset.value?.id).toBe('all');
    });

    it('handles empty preset array', () => {
      const { selectedPreset, hasPresetSelected } = useFilterPresets<TestFilters>([]);
      
      expect(selectedPreset.value).toBeNull();
      expect(hasPresetSelected.value).toBe(false);
    });
  });

  describe('resolvedFilters', () => {
    it('returns empty object when no preset selected', () => {
      const { resolvedFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(resolvedFilters.value).toEqual({});
    });

    it('returns static filters from selected preset', () => {
      const { selectPreset, resolvedFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]); // active preset
      
      expect(resolvedFilters.value).toEqual({ isActive: true });
    });

    it('resolves dynamic filters from function', () => {
      const { selectPreset, resolvedFilters } = useFilterPresets<TestFilters>(dynamicPresets);
      
      selectPreset(dynamicPresets[0]); // dynamic preset
      
      expect(resolvedFilters.value).toEqual({ age: 25 });
    });

    it('handles complex static filters', () => {
      const { selectPreset, resolvedFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[2]); // IT department
      
      expect(resolvedFilters.value).toEqual({
        department: 'IT',
        isActive: true,
      });
    });
  });

  describe('selectedPresetId', () => {
    it('returns null when no preset selected', () => {
      const { selectedPresetId } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(selectedPresetId.value).toBeNull();
    });

    it('returns current preset ID', () => {
      const { selectPreset, selectedPresetId } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      
      expect(selectedPresetId.value).toBe('active');
    });
  });

  describe('isPresetSelected', () => {
    it('returns false when no preset selected', () => {
      const { isPresetSelected } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(isPresetSelected.value('active')).toBe(false);
    });

    it('returns true for selected preset', () => {
      const { selectPreset, isPresetSelected } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      
      expect(isPresetSelected.value('active')).toBe(true);
    });

    it('returns false for non-selected preset', () => {
      const { selectPreset, isPresetSelected } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      
      expect(isPresetSelected.value('all')).toBe(false);
    });
  });

  describe('hasPresetSelected', () => {
    it('returns false when no preset selected', () => {
      const { hasPresetSelected } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(hasPresetSelected.value).toBe(false);
    });

    it('returns true when preset is selected', () => {
      const { selectPreset, hasPresetSelected } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[0]);
      
      expect(hasPresetSelected.value).toBe(true);
    });
  });

  describe('getPresetById', () => {
    it('returns preset when found', () => {
      const { getPresetById } = useFilterPresets<TestFilters>(staticPresets);
      
      const preset = getPresetById('active');
      
      expect(preset).not.toBeNull();
      expect(preset?.id).toBe('active');
    });

    it('returns null when preset not found', () => {
      const { getPresetById } = useFilterPresets<TestFilters>(staticPresets);
      
      const preset = getPresetById('nonexistent');
      
      expect(preset).toBeNull();
    });
  });

  describe('getQuickPresetById', () => {
    it('returns quick preset when found', () => {
      const { getQuickPresetById } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      const quickPreset = getQuickPresetById('john');
      
      expect(quickPreset).not.toBeNull();
      expect(quickPreset?.id).toBe('john');
    });

    it('returns null when quick preset not found', () => {
      const { getQuickPresetById } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      const quickPreset = getQuickPresetById('nonexistent');
      
      expect(quickPreset).toBeNull();
    });
  });

  describe('getDefaultPreset', () => {
    it('returns specified default preset', () => {
      const { getDefaultPreset } = useFilterPresets<TestFilters>(
        staticPresets,
        [],
        'active'
      );
      
      const preset = getDefaultPreset();
      
      expect(preset?.id).toBe('active');
    });

    it('returns first preset when no default specified', () => {
      const { getDefaultPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      const preset = getDefaultPreset();
      
      expect(preset?.id).toBe('all');
    });

    it('returns null when no presets available', () => {
      const { getDefaultPreset } = useFilterPresets<TestFilters>([]);
      
      const preset = getDefaultPreset();
      
      expect(preset).toBeNull();
    });
  });

  describe('resolvePresetFilters', () => {
    it('returns empty object for null preset', () => {
      const { resolvePresetFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      const filters = resolvePresetFilters(null);
      
      expect(filters).toEqual({});
    });

    it('resolves static filters', () => {
      const { resolvePresetFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      const filters = resolvePresetFilters(staticPresets[1]);
      
      expect(filters).toEqual({ isActive: true });
    });

    it('resolves dynamic filters', () => {
      const { resolvePresetFilters } = useFilterPresets<TestFilters>(dynamicPresets);
      
      const filters = resolvePresetFilters(dynamicPresets[0]);
      
      expect(filters).toEqual({ age: 25 });
    });
  });

  describe('resolveQuickPresetFilters', () => {
    it('returns empty object for null quick preset', () => {
      const { resolveQuickPresetFilters } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      const filters = resolveQuickPresetFilters(null);
      
      expect(filters).toEqual({});
    });

    it('resolves static quick preset filters', () => {
      const { resolveQuickPresetFilters } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      const filters = resolveQuickPresetFilters(sampleQuickPresets[0]);
      
      expect(filters).toEqual({ name: 'John' });
    });

    it('resolves dynamic quick preset filters', () => {
      const { resolveQuickPresetFilters } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      const filters = resolveQuickPresetFilters(sampleQuickPresets[1]);
      
      expect(filters).toEqual({ age: 65 });
    });
  });

  describe('selectPreset', () => {
    it('selects a preset', () => {
      const { selectPreset, selectedPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      
      expect(selectedPreset.value?.id).toBe('active');
    });

    it('clears selection when null is passed', () => {
      const { selectPreset, selectedPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      selectPreset(null);
      
      expect(selectedPreset.value).toBeNull();
    });

    it('updates resolvedFilters when preset changes', () => {
      const { selectPreset, resolvedFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      expect(resolvedFilters.value).toEqual({ isActive: true });
      
      selectPreset(staticPresets[2]);
      expect(resolvedFilters.value).toEqual({ department: 'IT', isActive: true });
    });
  });

  describe('selectPresetById', () => {
    it('selects preset by ID and returns true', () => {
      const { selectPresetById, selectedPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      const result = selectPresetById('active');
      
      expect(result).toBe(true);
      expect(selectedPreset.value?.id).toBe('active');
    });

    it('returns false when preset not found', () => {
      const { selectPresetById, selectedPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      const result = selectPresetById('nonexistent');
      
      expect(result).toBe(false);
      expect(selectedPreset.value).toBeNull();
    });
  });

  describe('selectDefaultPreset', () => {
    it('selects default preset and returns true', () => {
      const composable = useFilterPresets<TestFilters>(
        staticPresets,
        [],
        'active'
      );
      
      // Clear first (it auto-selects on init)
      composable.clearPreset();
      
      const result = composable.selectDefaultPreset();
      
      expect(result).toBe(true);
      expect(composable.selectedPreset.value?.id).toBe('active');
    });

    it('returns false when no default available', () => {
      const { selectDefaultPreset } = useFilterPresets<TestFilters>([]);
      
      const result = selectDefaultPreset();
      
      expect(result).toBe(false);
    });
  });

  describe('clearPreset', () => {
    it('clears selected preset', () => {
      const { selectPreset, clearPreset, selectedPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      clearPreset();
      
      expect(selectedPreset.value).toBeNull();
    });

    it('clears resolvedFilters', () => {
      const { selectPreset, clearPreset, resolvedFilters } = useFilterPresets<TestFilters>(staticPresets);
      
      selectPreset(staticPresets[1]);
      clearPreset();
      
      expect(resolvedFilters.value).toEqual({});
    });
  });

  describe('hasPreset', () => {
    it('returns true when preset exists', () => {
      const { hasPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(hasPreset('active')).toBe(true);
    });

    it('returns false when preset does not exist', () => {
      const { hasPreset } = useFilterPresets<TestFilters>(staticPresets);
      
      expect(hasPreset('nonexistent')).toBe(false);
    });
  });

  describe('hasQuickPreset', () => {
    it('returns true when quick preset exists', () => {
      const { hasQuickPreset } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      expect(hasQuickPreset('john')).toBe(true);
    });

    it('returns false when quick preset does not exist', () => {
      const { hasQuickPreset } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      expect(hasQuickPreset('nonexistent')).toBe(false);
    });
  });

  describe('getPresetIds', () => {
    it('returns array of all preset IDs', () => {
      const { getPresetIds } = useFilterPresets<TestFilters>(staticPresets);
      
      const ids = getPresetIds();
      
      expect(ids).toEqual(['all', 'active', 'it-dept']);
    });

    it('returns empty array when no presets', () => {
      const { getPresetIds } = useFilterPresets<TestFilters>([]);
      
      const ids = getPresetIds();
      
      expect(ids).toEqual([]);
    });
  });

  describe('getQuickPresetIds', () => {
    it('returns array of all quick preset IDs', () => {
      const { getQuickPresetIds } = useFilterPresets<TestFilters>(
        staticPresets,
        sampleQuickPresets
      );
      
      const ids = getQuickPresetIds();
      
      expect(ids).toEqual(['john', 'seniors']);
    });

    it('returns empty array when no quick presets', () => {
      const { getQuickPresetIds } = useFilterPresets<TestFilters>(staticPresets, []);
      
      const ids = getQuickPresetIds();
      
      expect(ids).toEqual([]);
    });
  });
});
