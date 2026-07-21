import { describe, it, expect } from 'vitest';
import { ref, computed } from 'vue';
import { useFilterForm } from '../composables/useFilterForm';
import type { FilterFieldDefinition } from '../types';

interface TestFilters {
  name?: string;
  email?: string;
  age?: number;
  department?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

describe('useFilterForm', () => {
  const sampleFields: FilterFieldDefinition<TestFilters>[] = [
    {
      key: 'name',
      type: 'text',
      labelKey: 'Name',
    },
    {
      key: 'email',
      type: 'text',
      labelKey: 'Email',
    },
    {
      key: 'age',
      type: 'number',
      labelKey: 'Age',
      validation: { required: true, min: 18 },
    },
    {
      key: 'department',
      type: 'select',
      labelKey: 'Department',
      group: 'work',
      groupLabelKey: 'Work Info',
    },
    {
      key: 'isActive',
      type: 'boolean',
      labelKey: 'Active',
      group: 'work',
      groupLabelKey: 'Work Info',
    },
    {
      key: 'startDate',
      type: 'date',
      labelKey: 'Start Date',
      condition: (filters) => filters.isActive === true,
    },
    {
      key: 'endDate',
      type: 'date',
      labelKey: 'End Date',
      condition: (filters) => filters.isActive === false,
      colSpan: 12,
    },
  ];

  describe('visibleFields', () => {
    it('returns all fields when no conditions', () => {
      const filters = ref<Partial<TestFilters>>({});
      const fieldsWithoutConditions = sampleFields.slice(0, 5);
      
      const { visibleFields } = useFilterForm<TestFilters>(
        fieldsWithoutConditions,
        filters
      );
      
      expect(visibleFields.value).toHaveLength(5);
    });

    it('filters fields based on conditions', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { visibleFields } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const keys = visibleFields.value.map(f => f.key);
      expect(keys).toContain('startDate');
      expect(keys).not.toContain('endDate');
    });

    it('updates when filter values change', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { visibleFields } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(visibleFields.value.some(f => f.key === 'startDate')).toBe(true);
      
      filters.value = { isActive: false };
      
      expect(visibleFields.value.some(f => f.key === 'startDate')).toBe(false);
      expect(visibleFields.value.some(f => f.key === 'endDate')).toBe(true);
    });
  });

  describe('visibleFieldCount', () => {
    it('counts visible fields', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { visibleFieldCount } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(visibleFieldCount.value).toBe(6); // all except endDate
    });
  });

  describe('allFieldsVisible', () => {
    it('returns true when all fields are visible', () => {
      const filters = ref<Partial<TestFilters>>({});
      const fieldsWithoutConditions = sampleFields.slice(0, 5);
      
      const { allFieldsVisible } = useFilterForm<TestFilters>(
        fieldsWithoutConditions,
        filters
      );
      
      expect(allFieldsVisible.value).toBe(true);
    });

    it('returns false when some fields are hidden', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { allFieldsVisible } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(allFieldsVisible.value).toBe(false);
    });
  });

  describe('getFieldsByGroup', () => {
    it('returns fields in a specific group', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldsByGroup } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const workFields = getFieldsByGroup.value('work');
      expect(workFields).toHaveLength(2);
      expect(workFields.map(f => f.key)).toEqual(['department', 'isActive']);
    });

    it('returns empty array for non-existent group', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldsByGroup } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const fields = getFieldsByGroup.value('nonexistent');
      expect(fields).toEqual([]);
    });
  });

  describe('ungroupedFields', () => {
    it('returns fields without group property', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { ungroupedFields } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const keys = ungroupedFields.value.map(f => f.key);
      expect(keys).toContain('name');
      expect(keys).toContain('email');
      expect(keys).toContain('age');
      expect(keys).not.toContain('department');
      expect(keys).not.toContain('isActive');
    });
  });

  describe('groupedFields', () => {
    it('groups fields by group property', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { groupedFields } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(groupedFields.value).toHaveLength(1);
      expect(groupedFields.value[0].group).toBe('work');
      expect(groupedFields.value[0].groupLabelKey).toBe('Work Info');
      expect(groupedFields.value[0].fields).toHaveLength(2);
    });

    it('preserves field order within groups', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { groupedFields } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const workGroup = groupedFields.value[0];
      expect(workGroup.fields[0].key).toBe('department');
      expect(workGroup.fields[1].key).toBe('isActive');
    });
  });

  describe('hasGroups', () => {
    it('returns true when fields are grouped', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { hasGroups } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(hasGroups.value).toBe(true);
    });

    it('returns false when no grouped fields', () => {
      const filters = ref<Partial<TestFilters>>({});
      const ungrouped = sampleFields.slice(0, 3);
      
      const { hasGroups } = useFilterForm<TestFilters>(ungrouped, filters);
      
      expect(hasGroups.value).toBe(false);
    });
  });

  describe('hasUngroupedFields', () => {
    it('returns true when ungrouped fields exist', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { hasUngroupedFields } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(hasUngroupedFields.value).toBe(true);
    });

    it('returns false when all fields are grouped', () => {
      const filters = ref<Partial<TestFilters>>({});
      const allGrouped = sampleFields.slice(3, 5);
      
      const { hasUngroupedFields } = useFilterForm<TestFilters>(allGrouped, filters);
      
      expect(hasUngroupedFields.value).toBe(false);
    });
  });

  describe('groupNames', () => {
    it('returns unique group names in order', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { groupNames } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(groupNames.value).toEqual(['work']);
    });
  });

  describe('getFieldColSpan', () => {
    it('returns custom colSpan when defined', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldColSpan } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const endDateField = sampleFields.find(f => f.key === 'endDate')!;
      expect(getFieldColSpan(endDateField)).toBe(12);
    });

    it('returns default colSpan of 6 when not defined', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldColSpan } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const nameField = sampleFields.find(f => f.key === 'name')!;
      expect(getFieldColSpan(nameField)).toBe(6);
    });
  });

  describe('isFullWidth', () => {
    it('returns true when colSpan >= 12', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { isFullWidth } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const endDateField = sampleFields.find(f => f.key === 'endDate')!;
      expect(isFullWidth(endDateField)).toBe(true);
    });

    it('returns false when colSpan < 12', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { isFullWidth } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const nameField = sampleFields.find(f => f.key === 'name')!;
      expect(isFullWidth(nameField)).toBe(false);
    });
  });

  describe('getFieldByKey', () => {
    it('returns field when found', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldByKey } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const field = getFieldByKey('name');
      expect(field).toBeDefined();
      expect(field?.type).toBe('text');
    });

    it('returns undefined when not found', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldByKey } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const field = getFieldByKey('nonexistent' as keyof TestFilters);
      expect(field).toBeUndefined();
    });
  });

  describe('hasField', () => {
    it('returns true when field exists', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { hasField } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(hasField('name')).toBe(true);
    });

    it('returns false when field does not exist', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { hasField } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(hasField('nonexistent' as keyof TestFilters)).toBe(false);
    });
  });

  describe('getFieldKeys', () => {
    it('returns all field keys', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldKeys } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const keys = getFieldKeys();
      expect(keys).toEqual([
        'name',
        'email',
        'age',
        'department',
        'isActive',
        'startDate',
        'endDate',
      ]);
    });
  });

  describe('getVisibleFieldKeys', () => {
    it('returns only visible field keys', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { getVisibleFieldKeys } = useFilterForm<TestFilters>(sampleFields, filters);
      
      const keys = getVisibleFieldKeys();
      expect(keys).toContain('startDate');
      expect(keys).not.toContain('endDate');
    });
  });

  describe('isFieldRequired', () => {
    it('returns true for required field', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { isFieldRequired } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(isFieldRequired('age')).toBe(true);
    });

    it('returns false for non-required field', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { isFieldRequired } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(isFieldRequired('name')).toBe(false);
    });
  });

  describe('getFieldLabelKey', () => {
    it('returns label key for field', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldLabelKey } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(getFieldLabelKey('name')).toBe('Name');
    });

    it('returns empty string for non-existent field', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldLabelKey } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(getFieldLabelKey('nonexistent' as keyof TestFilters)).toBe('');
    });
  });

  describe('getFieldPlaceholderKey', () => {
    it('returns placeholder key when defined', () => {
      const filters = ref<Partial<TestFilters>>({});
      const fieldsWithPlaceholder: FilterFieldDefinition<TestFilters>[] = [
        {
          key: 'name',
          type: 'text',
          labelKey: 'Name',
          options: { placeholderKey: 'Enter name...' },
        },
      ];
      
      const { getFieldPlaceholderKey } = useFilterForm<TestFilters>(
        fieldsWithPlaceholder,
        filters
      );
      
      expect(getFieldPlaceholderKey('name')).toBe('Enter name...');
    });

    it('returns undefined when placeholder not defined', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { getFieldPlaceholderKey } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(getFieldPlaceholderKey('name')).toBeUndefined();
    });
  });

  describe('isFieldVisible', () => {
    it('returns true for visible field', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { isFieldVisible } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(isFieldVisible('startDate')).toBe(true);
    });

    it('returns false for hidden field', () => {
      const filters = ref<Partial<TestFilters>>({ isActive: true });
      
      const { isFieldVisible } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(isFieldVisible('endDate')).toBe(false);
    });
  });

  describe('totalColumns', () => {
    it('returns 12 for standard grid', () => {
      const filters = ref<Partial<TestFilters>>({});
      
      const { totalColumns } = useFilterForm<TestFilters>(sampleFields, filters);
      
      expect(totalColumns.value).toBe(12);
    });
  });

  describe('reactivity with computed filters', () => {
    it('works with computed ref', () => {
      const baseFilters = ref<Partial<TestFilters>>({ isActive: true });
      const computedFilters = computed(() => baseFilters.value);
      
      const { visibleFields } = useFilterForm<TestFilters>(
        sampleFields,
        computedFilters
      );
      
      expect(visibleFields.value.some(f => f.key === 'startDate')).toBe(true);
      
      baseFilters.value = { isActive: false };
      
      expect(visibleFields.value.some(f => f.key === 'endDate')).toBe(true);
    });
  });
});
