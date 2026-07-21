import { describe, it, expect } from 'vitest';
import {
  cleanFilters,
  isFiltersEmpty,
  mergeFilters,
  omitFilterKeys,
  pickFilterKeys,
  countActiveFilters,
  areFiltersEqual,
} from '../utils/filterCleaner';

/**
 * Unit tests for filterCleaner utility functions
 */
describe('filterCleaner', () => {
  describe('cleanFilters', () => {
    it('removes undefined values', () => {
      const input = { a: 'test', b: undefined, c: 'value' };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', c: 'value' });
    });

    it('removes null values', () => {
      const input = { a: 'test', b: null, c: 'value' };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', c: 'value' });
    });

    it('removes empty strings', () => {
      const input = { a: 'test', b: '', c: 'value' };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', c: 'value' });
    });

    it('preserves false boolean values', () => {
      const input = { a: 'test', b: false, c: true };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', b: false, c: true });
    });

    it('preserves zero number values', () => {
      const input = { a: 'test', b: 0, c: 100 };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', b: 0, c: 100 });
    });

    it('handles empty object', () => {
      const input = {};
      const result = cleanFilters(input);
      
      expect(result).toEqual({});
    });

    it('handles all empty values', () => {
      const input = { a: undefined, b: null, c: '' };
      const result = cleanFilters(input);
      
      expect(result).toEqual({});
    });

    it('preserves arrays (including empty arrays)', () => {
      const input = { a: 'test', b: [1, 2, 3], c: [] };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', b: [1, 2, 3], c: [] });
    });

    it('preserves empty arrays', () => {
      const input = { a: 'test', b: [], c: 'value' };
      const result = cleanFilters(input);
      
      expect(result).toEqual({ a: 'test', b: [], c: 'value' });
    });
  });

  describe('isFiltersEmpty', () => {
    it('returns true for empty object', () => {
      expect(isFiltersEmpty({})).toBe(true);
    });

    it('returns true for object with only empty values', () => {
      expect(isFiltersEmpty({ a: undefined, b: null, c: '' })).toBe(true);
    });

    it('returns false for object with valid values', () => {
      expect(isFiltersEmpty({ a: 'test' })).toBe(false);
    });

    it('returns false for object with false boolean', () => {
      expect(isFiltersEmpty({ a: false })).toBe(false);
    });

    it('returns false for object with zero', () => {
      expect(isFiltersEmpty({ a: 0 })).toBe(false);
    });
  });

  describe('mergeFilters', () => {
    it('merges two objects', () => {
      const obj1 = { a: 'test1', b: 'test2' };
      const obj2 = { b: 'updated', c: 'test3' };
      const result = mergeFilters<any>(obj1, obj2);
      
      expect(result).toEqual({ a: 'test1', b: 'updated', c: 'test3' });
    });

    it('merges multiple objects', () => {
      const obj1 = { a: 'test1' };
      const obj2 = { b: 'test2' };
      const obj3 = { c: 'test3' };
      const result = mergeFilters<any>(obj1, obj2, obj3);
      
      expect(result).toEqual({ a: 'test1', b: 'test2', c: 'test3' });
    });

    it('right-most values take precedence', () => {
      const obj1 = { a: 'first', b: 'first' };
      const obj2 = { a: 'second', c: 'second' };
      const obj3 = { a: 'third', d: 'third' };
      const result = mergeFilters<any>(obj1, obj2, obj3);
      
      expect(result).toEqual({ 
        a: 'third', 
        b: 'first', 
        c: 'second', 
        d: 'third' 
      });
    });

    it('handles empty objects', () => {
      const obj1 = {};
      const obj2 = { a: 'test' };
      const result = mergeFilters<any>(obj1, obj2);
      
      expect(result).toEqual({ a: 'test' });
    });

    it('handles single object', () => {
      const obj1 = { a: 'test' };
      const result = mergeFilters(obj1);
      
      expect(result).toEqual({ a: 'test' });
    });

    it('does not mutate original objects', () => {
      const obj1 = { a: 'test1' };
      const obj2 = { b: 'test2' };
      const result = mergeFilters<any>(obj1, obj2);
      
      expect(obj1).toEqual({ a: 'test1' });
      expect(obj2).toEqual({ b: 'test2' });
      expect(result).toEqual({ a: 'test1', b: 'test2' });
    });
  });

  describe('omitFilterKeys', () => {
    it('omits specified keys', () => {
      const input = { a: 'test1', b: 'test2', c: 'test3' };
      const result = omitFilterKeys(input, ['b']);
      
      expect(result).toEqual({ a: 'test1', c: 'test3' });
    });

    it('omits multiple keys', () => {
      const input = { a: 'test1', b: 'test2', c: 'test3', d: 'test4' };
      const result = omitFilterKeys(input, ['b', 'd']);
      
      expect(result).toEqual({ a: 'test1', c: 'test3' });
    });

    it('handles empty keys array', () => {
      const input = { a: 'test1', b: 'test2' };
      const result = omitFilterKeys(input, []);
      
      expect(result).toEqual({ a: 'test1', b: 'test2' });
    });

    it('handles non-existent keys', () => {
      const input = { a: 'test1', b: 'test2' };
      const result = omitFilterKeys(input, ['c', 'd'] as any);
      
      expect(result).toEqual({ a: 'test1', b: 'test2' });
    });

    it('does not mutate original object', () => {
      const input = { a: 'test1', b: 'test2' };
      const result = omitFilterKeys(input, ['b']);
      
      expect(input).toEqual({ a: 'test1', b: 'test2' });
      expect(result).toEqual({ a: 'test1' });
    });
  });

  describe('pickFilterKeys', () => {
    it('picks specified keys', () => {
      const input = { a: 'test1', b: 'test2', c: 'test3' };
      const result = pickFilterKeys(input, ['a', 'c']);
      
      expect(result).toEqual({ a: 'test1', c: 'test3' });
    });

    it('picks single key', () => {
      const input = { a: 'test1', b: 'test2', c: 'test3' };
      const result = pickFilterKeys(input, ['b']);
      
      expect(result).toEqual({ b: 'test2' });
    });

    it('handles empty keys array', () => {
      const input = { a: 'test1', b: 'test2' };
      const result = pickFilterKeys(input, []);
      
      expect(result).toEqual({});
    });

    it('handles non-existent keys', () => {
      const input = { a: 'test1', b: 'test2' };
      const result = pickFilterKeys(input, ['c', 'd'] as any);
      
      expect(result).toEqual({});
    });

    it('does not mutate original object', () => {
      const input = { a: 'test1', b: 'test2' };
      const result = pickFilterKeys(input, ['a']);
      
      expect(input).toEqual({ a: 'test1', b: 'test2' });
      expect(result).toEqual({ a: 'test1' });
    });
  });

  describe('countActiveFilters', () => {
    it('counts non-empty values', () => {
      const input = { a: 'test1', b: 'test2', c: 'test3' };
      const result = countActiveFilters(input);
      
      expect(result).toBe(3);
    });

    it('excludes undefined values', () => {
      const input = { a: 'test1', b: undefined, c: 'test3' };
      const result = countActiveFilters(input);
      
      expect(result).toBe(2);
    });

    it('excludes null values', () => {
      const input = { a: 'test1', b: null, c: 'test3' };
      const result = countActiveFilters(input);
      
      expect(result).toBe(2);
    });

    it('excludes empty strings', () => {
      const input = { a: 'test1', b: '', c: 'test3' };
      const result = countActiveFilters(input);
      
      expect(result).toBe(2);
    });

    it('counts false boolean values', () => {
      const input = { a: 'test1', b: false, c: true };
      const result = countActiveFilters(input);
      
      expect(result).toBe(3);
    });

    it('counts zero number values', () => {
      const input = { a: 'test1', b: 0, c: 100 };
      const result = countActiveFilters(input);
      
      expect(result).toBe(3);
    });

    it('returns zero for empty object', () => {
      const input = {};
      const result = countActiveFilters(input);
      
      expect(result).toBe(0);
    });

    it('returns zero for object with only empty values', () => {
      const input = { a: undefined, b: null, c: '' };
      const result = countActiveFilters(input);
      
      expect(result).toBe(0);
    });

    it('counts arrays as active (including empty arrays)', () => {
      const input = { a: 'test', b: [1, 2, 3], c: [] };
      const result = countActiveFilters(input);
      
      expect(result).toBe(3); // All three are counted
    });
  });

  describe('areFiltersEqual', () => {
    it('returns true for identical objects', () => {
      const obj1 = { a: 'test1', b: 'test2' };
      const obj2 = { a: 'test1', b: 'test2' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('returns true for empty objects', () => {
      expect(areFiltersEqual({}, {})).toBe(true);
    });

    it('returns false for different values', () => {
      const obj1 = { a: 'test1', b: 'test2' };
      const obj2 = { a: 'test1', b: 'different' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(false);
    });

    it('returns false for different keys', () => {
      const obj1 = { a: 'test1', b: 'test2' };
      const obj2 = { a: 'test1', c: 'test2' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(false);
    });

    it('returns false for different number of keys', () => {
      const obj1 = { a: 'test1', b: 'test2' };
      const obj2 = { a: 'test1' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(false);
    });

    it('ignores undefined values in comparison', () => {
      const obj1 = { a: 'test1', b: undefined };
      const obj2 = { a: 'test1' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('ignores null values in comparison', () => {
      const obj1 = { a: 'test1', b: null };
      const obj2 = { a: 'test1' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('ignores empty strings in comparison', () => {
      const obj1 = { a: 'test1', b: '' };
      const obj2 = { a: 'test1' };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('compares false boolean values correctly', () => {
      const obj1 = { a: 'test1', b: false };
      const obj2 = { a: 'test1', b: false };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('compares zero number values correctly', () => {
      const obj1 = { a: 'test1', b: 0 };
      const obj2 = { a: 'test1', b: 0 };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('compares arrays by reference (not deep equality)', () => {
      const arr = [1, 2, 3];
      const obj1 = { a: 'test1', b: arr };
      const obj2 = { a: 'test1', b: arr }; // Same reference
      
      expect(areFiltersEqual(obj1, obj2)).toBe(true);
    });

    it('returns false for different array instances (even with same values)', () => {
      const obj1 = { a: 'test1', b: [1, 2, 3] };
      const obj2 = { a: 'test1', b: [1, 2, 3] }; // Different reference
      
      expect(areFiltersEqual(obj1, obj2)).toBe(false);
    });

    it('returns false for different arrays', () => {
      const obj1 = { a: 'test1', b: [1, 2, 3] };
      const obj2 = { a: 'test1', b: [1, 2, 4] };
      
      expect(areFiltersEqual(obj1, obj2)).toBe(false);
    });
  });
});
