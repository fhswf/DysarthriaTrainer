import { describe, it, expect } from 'vitest';
import {
  getComponentForFieldType,
  isRangeField,
  getRangeFieldKeys,
  supportsTime,
  getDefaultDateFormat,
} from '../utils/fieldRenderer';
import type { FilterFieldType } from '../types';

/**
 * Unit tests for fieldRenderer utility functions
 */
describe('fieldRenderer', () => {
  describe('getComponentForFieldType', () => {
    it('returns InputText for text type', () => {
      const result = getComponentForFieldType('text');
      expect(result).toBe('InputText');
    });

    it('returns InputNumber for number type', () => {
      const result = getComponentForFieldType('number');
      expect(result).toBe('InputNumber');
    });

    it('returns DatePicker for date type', () => {
      const result = getComponentForFieldType('date');
      expect(result).toBe('DatePicker');
    });

    it('returns DatePicker for dateRange type', () => {
      const result = getComponentForFieldType('dateRange');
      expect(result).toBe('DatePicker');
    });

    it('returns DatePicker for datetime type', () => {
      const result = getComponentForFieldType('datetime');
      expect(result).toBe('DatePicker');
    });

    it('returns DatePicker for datetimeRange type', () => {
      const result = getComponentForFieldType('datetimeRange');
      expect(result).toBe('DatePicker');
    });

    it('returns Select for select type', () => {
      const result = getComponentForFieldType('select');
      expect(result).toBe('Select');
    });

    it('returns MultiSelect for multiselect type', () => {
      const result = getComponentForFieldType('multiselect');
      expect(result).toBe('MultiSelect');
    });

    it('returns Checkbox for boolean type', () => {
      const result = getComponentForFieldType('boolean');
      expect(result).toBe('Checkbox');
    });

    it('returns TriStateCheckbox for tristate type', () => {
      const result = getComponentForFieldType('tristate');
      expect(result).toBe('TriStateCheckbox');
    });

    it('returns Slider for slider type', () => {
      const result = getComponentForFieldType('slider');
      expect(result).toBe('Slider');
    });

    it('returns Rating for rating type', () => {
      const result = getComponentForFieldType('rating');
      expect(result).toBe('Rating');
    });

    it('returns custom for custom type', () => {
      const result = getComponentForFieldType('custom');
      expect(result).toBe('custom');
    });

    it('returns InputText for unknown type', () => {
      const result = getComponentForFieldType('unknown' as FilterFieldType);
      expect(result).toBe('InputText');
    });
  });

  describe('isRangeField', () => {
    it('returns true for dateRange type', () => {
      const result = isRangeField('dateRange');
      expect(result).toBe(true);
    });

    it('returns true for datetimeRange type', () => {
      const result = isRangeField('datetimeRange');
      expect(result).toBe(true);
    });

    it('returns false for date type', () => {
      const result = isRangeField('date');
      expect(result).toBe(false);
    });

    it('returns false for datetime type', () => {
      const result = isRangeField('datetime');
      expect(result).toBe(false);
    });

    it('returns false for text type', () => {
      const result = isRangeField('text');
      expect(result).toBe(false);
    });

    it('returns false for number type', () => {
      const result = isRangeField('number');
      expect(result).toBe(false);
    });

    it('returns false for select type', () => {
      const result = isRangeField('select');
      expect(result).toBe(false);
    });

    it('returns false for multiselect type', () => {
      const result = isRangeField('multiselect');
      expect(result).toBe(false);
    });

    it('returns false for boolean type', () => {
      const result = isRangeField('boolean');
      expect(result).toBe(false);
    });

    it('returns false for tristate type', () => {
      const result = isRangeField('tristate');
      expect(result).toBe(false);
    });

    it('returns false for slider type', () => {
      const result = isRangeField('slider');
      expect(result).toBe(false);
    });

    it('returns false for rating type', () => {
      const result = isRangeField('rating');
      expect(result).toBe(false);
    });

    it('returns false for custom type', () => {
      const result = isRangeField('custom');
      expect(result).toBe(false);
    });
  });

  describe('getRangeFieldKeys', () => {
    describe('dateRange type', () => {
      it('generates __gte and __lte keys for dateRange', () => {
        const result = getRangeFieldKeys('created_at', 'dateRange');
        
        expect(result).toEqual({
          from: 'created_at__gte',
          to: 'created_at__lte',
        });
      });

      it('removes existing __gte suffix before generating keys', () => {
        const result = getRangeFieldKeys('created_at__gte', 'dateRange');
        
        expect(result).toEqual({
          from: 'created_at__gte',
          to: 'created_at__lte',
        });
      });

      it('removes existing __lte suffix before generating keys', () => {
        const result = getRangeFieldKeys('created_at__lte', 'dateRange');
        
        expect(result).toEqual({
          from: 'created_at__gte',
          to: 'created_at__lte',
        });
      });

      it('handles keys with existing Django filters', () => {
        const result = getRangeFieldKeys('timestamp__date', 'dateRange');
        
        expect(result).toEqual({
          from: 'timestamp__date__gte',
          to: 'timestamp__date__lte',
        });
      });
    });

    describe('datetimeRange type', () => {
      it('generates __gte and __lte keys for datetimeRange', () => {
        const result = getRangeFieldKeys('timestamp', 'datetimeRange');
        
        expect(result).toEqual({
          from: 'timestamp__gte',
          to: 'timestamp__lte',
        });
      });

      it('removes existing __gte suffix for datetimeRange', () => {
        const result = getRangeFieldKeys('timestamp__gte', 'datetimeRange');
        
        expect(result).toEqual({
          from: 'timestamp__gte',
          to: 'timestamp__lte',
        });
      });

      it('removes existing __lte suffix for datetimeRange', () => {
        const result = getRangeFieldKeys('timestamp__lte', 'datetimeRange');
        
        expect(result).toEqual({
          from: 'timestamp__gte',
          to: 'timestamp__lte',
        });
      });
    });

    describe('non-range types', () => {
      it('returns same key for both from/to for text type', () => {
        const result = getRangeFieldKeys('lastname__icontains', 'text');
        
        expect(result).toEqual({
          from: 'lastname__icontains',
          to: 'lastname__icontains',
        });
      });

      it('returns same key for both from/to for number type', () => {
        const result = getRangeFieldKeys('age', 'number');
        
        expect(result).toEqual({
          from: 'age',
          to: 'age',
        });
      });

      it('returns same key for both from/to for date type', () => {
        const result = getRangeFieldKeys('birth_date', 'date');
        
        expect(result).toEqual({
          from: 'birth_date',
          to: 'birth_date',
        });
      });

      it('returns same key for both from/to for datetime type', () => {
        const result = getRangeFieldKeys('created_at', 'datetime');
        
        expect(result).toEqual({
          from: 'created_at',
          to: 'created_at',
        });
      });

      it('returns same key for both from/to for select type', () => {
        const result = getRangeFieldKeys('status', 'select');
        
        expect(result).toEqual({
          from: 'status',
          to: 'status',
        });
      });

      it('preserves Django filters for non-range fields', () => {
        const result = getRangeFieldKeys('name__icontains', 'text');
        
        expect(result).toEqual({
          from: 'name__icontains',
          to: 'name__icontains',
        });
      });
    });
  });

  describe('supportsTime', () => {
    it('returns true for datetime type', () => {
      const result = supportsTime('datetime');
      expect(result).toBe(true);
    });

    it('returns true for datetimeRange type', () => {
      const result = supportsTime('datetimeRange');
      expect(result).toBe(true);
    });

    it('returns false for date type', () => {
      const result = supportsTime('date');
      expect(result).toBe(false);
    });

    it('returns false for dateRange type', () => {
      const result = supportsTime('dateRange');
      expect(result).toBe(false);
    });

    it('returns false for text type', () => {
      const result = supportsTime('text');
      expect(result).toBe(false);
    });

    it('returns false for number type', () => {
      const result = supportsTime('number');
      expect(result).toBe(false);
    });

    it('returns false for select type', () => {
      const result = supportsTime('select');
      expect(result).toBe(false);
    });

    it('returns false for boolean type', () => {
      const result = supportsTime('boolean');
      expect(result).toBe(false);
    });
  });

  describe('getDefaultDateFormat', () => {
    it('returns default format for date type', () => {
      const result = getDefaultDateFormat('date');
      expect(result).toBe('yy-mm-dd');
    });

    it('returns default format for dateRange type', () => {
      const result = getDefaultDateFormat('dateRange');
      expect(result).toBe('yy-mm-dd');
    });

    it('returns default format for datetime type', () => {
      const result = getDefaultDateFormat('datetime');
      expect(result).toBe('yy-mm-dd');
    });

    it('returns default format for datetimeRange type', () => {
      const result = getDefaultDateFormat('datetimeRange');
      expect(result).toBe('yy-mm-dd');
    });

    it('returns default format for text type', () => {
      const result = getDefaultDateFormat('text');
      expect(result).toBe('yy-mm-dd');
    });
  });
});
