/**
 * Unit tests for Filter Processor Utility
 * 
 * Tests Django REST Framework filter conversion for virtual scroll table.
 * Covers simple filters, advanced filters, combined filters, and DRF operator coverage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isCombinedFilters,
  buildFilterParam,
  formatFilterValue,
  processSimpleFilters,
  processAdvancedFilters,
  buildParams
} from '../utils/filter-processor';
import type { AdvancedFilter, CombinedFilters, SimpleFilters } from '../types/virtual-scroll-table.types';

describe('Filter Processor Utility', () => {
  
  // =====================================================
  // Type Checking Tests
  // =====================================================

  describe('isCombinedFilters', () => {
    it('should identify combined filters with simple key', () => {
      const filters: CombinedFilters = { simple: { search: 'john' } };
      expect(isCombinedFilters(filters)).toBe(true);
    });

    it('should identify combined filters with advanced key', () => {
      const filters: CombinedFilters = { 
        advanced: [{ field: 'username', value: 'john', operator: 'icontains' }] 
      };
      expect(isCombinedFilters(filters)).toBe(true);
    });

    it('should identify combined filters with both keys', () => {
      const filters: CombinedFilters = {
        simple: { is_active: true },
        advanced: [{ field: 'role', value: 'admin', operator: 'exact' }]
      };
      expect(isCombinedFilters(filters)).toBe(true);
    });

    it('should reject simple filters', () => {
      const filters: SimpleFilters = { search: 'john', is_active: true };
      expect(isCombinedFilters(filters)).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(isCombinedFilters(null)).toBeFalsy(); // null && ... returns null
      expect(isCombinedFilters(undefined)).toBeFalsy(); // undefined && ... returns undefined
    });
  });

  // =====================================================
  // Parameter Name Building Tests
  // =====================================================

  describe('buildFilterParam', () => {
    it('should build param for exact match (no suffix)', () => {
      expect(buildFilterParam('username', 'exact')).toBe('username');
    });

    it('should build param without operator (no suffix)', () => {
      expect(buildFilterParam('status')).toBe('status');
    });

    it('should build param for icontains', () => {
      expect(buildFilterParam('username', 'icontains')).toBe('username__icontains');
    });

    it('should build param for contains', () => {
      expect(buildFilterParam('email', 'contains')).toBe('email__contains');
    });

    it('should build param for startswith', () => {
      expect(buildFilterParam('name', 'startswith')).toBe('name__startswith');
    });

    it('should build param for endswith', () => {
      expect(buildFilterParam('domain', 'endswith')).toBe('domain__endswith');
    });

    it('should build param for gt', () => {
      expect(buildFilterParam('age', 'gt')).toBe('age__gt');
    });

    it('should build param for gte', () => {
      expect(buildFilterParam('score', 'gte')).toBe('score__gte');
    });

    it('should build param for lt', () => {
      expect(buildFilterParam('age', 'lt')).toBe('age__lt');
    });

    it('should build param for lte', () => {
      expect(buildFilterParam('score', 'lte')).toBe('score__lte');
    });

    it('should build param for range', () => {
      expect(buildFilterParam('created_at', 'range')).toBe('created_at__range');
    });

    it('should build param for in', () => {
      expect(buildFilterParam('status', 'in')).toBe('status__in');
    });

    it('should build param for isnull', () => {
      expect(buildFilterParam('deleted_at', 'isnull')).toBe('deleted_at__isnull');
    });
  });

  // =====================================================
  // Value Formatting Tests
  // =====================================================

  describe('formatFilterValue', () => {
    it('should format string value', () => {
      expect(formatFilterValue('john')).toBe('john');
    });

    it('should format number value', () => {
      expect(formatFilterValue(123)).toBe('123');
    });

    it('should format boolean true', () => {
      expect(formatFilterValue(true)).toBe('true');
    });

    it('should format boolean false', () => {
      expect(formatFilterValue(false)).toBe('false');
    });

    it('should format array with strings', () => {
      expect(formatFilterValue(['admin', 'staff', 'user'])).toBe('admin,staff,user');
    });

    it('should format array with numbers', () => {
      expect(formatFilterValue([1, 2, 3])).toBe('1,2,3');
    });

    it('should format array with mixed types', () => {
      expect(formatFilterValue(['admin', 123, 'staff'])).toBe('admin,123,staff');
    });

    it('should format null as string', () => {
      expect(formatFilterValue(null)).toBe('null');
    });

    it('should format empty array', () => {
      expect(formatFilterValue([])).toBe('');
    });
  });

  // =====================================================
  // Simple Filters Processing Tests
  // =====================================================

  describe('processSimpleFilters', () => {
    let params: Record<string, any>;

    beforeEach(() => {
      params = {};
    });

    it('should process simple string filter', () => {
      const filters: SimpleFilters = { username: 'john' };
      processSimpleFilters(filters, params);
      
      expect(params.username).toBe('john');
    });

    it('should process boolean filter', () => {
      const filters: SimpleFilters = { is_active: true };
      processSimpleFilters(filters, params);
      
      expect(params.is_active).toBe(true);
    });

    it('should process number filter', () => {
      const filters: SimpleFilters = { age: 25 };
      processSimpleFilters(filters, params);
      
      expect(params.age).toBe(25);
    });

    it('should process multiple simple filters', () => {
      const filters: SimpleFilters = {
        username: 'john',
        is_active: true,
        role: 'admin'
      };
      processSimpleFilters(filters, params);
      
      expect(params.username).toBe('john');
      expect(params.is_active).toBe(true);
      expect(params.role).toBe('admin');
    });

    it('should filter out undefined values', () => {
      const filters: SimpleFilters = {
        username: 'john',
        email: undefined,
        role: 'admin'
      };
      processSimpleFilters(filters, params);
      
      expect(params.username).toBe('john');
      expect(params.email).toBeUndefined();
      expect(params.role).toBe('admin');
    });

    it('should filter out null values', () => {
      const filters: SimpleFilters = {
        username: 'john',
        email: null,
        role: 'admin'
      };
      processSimpleFilters(filters, params);
      
      expect(params.username).toBe('john');
      expect(params.email).toBeUndefined();
      expect(params.role).toBe('admin');
    });

    it('should filter out empty string values', () => {
      const filters: SimpleFilters = {
        username: 'john',
        email: '',
        role: 'admin'
      };
      processSimpleFilters(filters, params);
      
      expect(params.username).toBe('john');
      expect(params.email).toBeUndefined();
      expect(params.role).toBe('admin');
    });

    it('should handle empty filters object', () => {
      processSimpleFilters({}, params);
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  // =====================================================
  // Advanced Filters Processing Tests
  // =====================================================

  describe('processAdvancedFilters', () => {
    let params: Record<string, any>;

    beforeEach(() => {
      params = {};
    });

    it('should process icontains filter', () => {
      const filters: AdvancedFilter[] = [
        { field: 'username', value: 'john', operator: 'icontains' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.username__icontains).toBe('john');
    });

    it('should process exact filter (no operator suffix)', () => {
      const filters: AdvancedFilter[] = [
        { field: 'status', value: 'active', operator: 'exact' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.status).toBe('active');
    });

    it('should process gt filter', () => {
      const filters: AdvancedFilter[] = [
        { field: 'age', value: 18, operator: 'gt' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.age__gt).toBe('18');
    });

    it('should process gte filter', () => {
      const filters: AdvancedFilter[] = [
        { field: 'age', value: 18, operator: 'gte' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.age__gte).toBe('18');
    });

    it('should process range filter with array', () => {
      const filters: AdvancedFilter[] = [
        { field: 'created_at', value: ['2024-01-01', '2024-12-31'], operator: 'range' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.created_at__range).toBe('2024-01-01,2024-12-31');
    });

    it('should process in filter with array', () => {
      const filters: AdvancedFilter[] = [
        { field: 'status', value: ['active', 'pending', 'review'], operator: 'in' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.status__in).toBe('active,pending,review');
    });

    it('should process isnull filter with boolean', () => {
      const filters: AdvancedFilter[] = [
        { field: 'deleted_at', value: false, operator: 'isnull' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.deleted_at__isnull).toBe('false');
    });

    it('should process multiple advanced filters', () => {
      const filters: AdvancedFilter[] = [
        { field: 'username', value: 'john', operator: 'icontains' },
        { field: 'age', value: 18, operator: 'gte' },
        { field: 'status', value: 'active', operator: 'exact' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.username__icontains).toBe('john');
      expect(params.age__gte).toBe('18');
      expect(params.status).toBe('active');
    });

    it('should skip disabled filters', () => {
      const filters: AdvancedFilter[] = [
        { field: 'username', value: 'john', operator: 'icontains', enabled: true },
        { field: 'email', value: 'test@example.com', operator: 'exact', enabled: false },
        { field: 'role', value: 'admin', operator: 'exact', enabled: true }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.username__icontains).toBe('john');
      expect(params.email).toBeUndefined();
      expect(params.role).toBe('admin');
    });

    it('should skip undefined value filters', () => {
      const filters: AdvancedFilter[] = [
        { field: 'username', value: 'john', operator: 'icontains' },
        { field: 'email', value: undefined as any, operator: 'exact' },
        { field: 'role', value: 'admin', operator: 'exact' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.username__icontains).toBe('john');
      expect(params.email).toBeUndefined();
      expect(params.role).toBe('admin');
    });

    it('should skip null value filters (except isnull)', () => {
      const filters: AdvancedFilter[] = [
        { field: 'username', value: null as any, operator: 'exact' },
        { field: 'deleted_at', value: true, operator: 'isnull' }
      ];
      processAdvancedFilters(filters, params);
      
      expect(params.username).toBeUndefined();
      expect(params.deleted_at__isnull).toBe('true');
    });

    it('should handle empty filters array', () => {
      processAdvancedFilters([], params);
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  // =====================================================
  // buildParams Integration Tests
  // =====================================================

  describe('buildParams', () => {
    it('should build params with offset and limit only', () => {
      const result = buildParams(0, 50);
      
      expect(result).toEqual({
        offset: 0,
        limit: 50
      });
    });

    it('should build params with simple filters', () => {
      const filters: SimpleFilters = {
        username: 'john',
        is_active: true
      };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      expect(result).toEqual({
        offset: 0,
        limit: 50,
        username: 'john',
        is_active: true
      });
    });

    it('should build params with advanced filters', () => {
      const filters: CombinedFilters = {
        advanced: [
          { field: 'username', value: 'john', operator: 'icontains' },
          { field: 'age', value: 18, operator: 'gte' }
        ]
      };
      const result = buildParams(100, 50, undefined, undefined, filters);
      
      expect(result).toEqual({
        offset: 100,
        limit: 50,
        username__icontains: 'john',
        age__gte: '18'
      });
    });

    it('should build params with sorting ascending', () => {
      const result = buildParams(0, 50, 'username', 1);
      
      expect(result).toEqual({
        offset: 0,
        limit: 50,
        ordering: 'username'
      });
    });

    it('should build params with sorting descending', () => {
      const result = buildParams(0, 50, 'created_at', -1);
      
      expect(result).toEqual({
        offset: 0,
        limit: 50,
        ordering: '-created_at'
      });
    });

    it('should build params with combined filters', () => {
      const filters: CombinedFilters = {
        simple: { is_active: true, role: 'admin' },
        advanced: [
          { field: 'username', value: 'john', operator: 'icontains' }
        ]
      };
      const result = buildParams(10, 50, 'username', -1, filters);
      
      expect(result).toEqual({
        offset: 10,
        limit: 50,
        ordering: '-username',
        is_active: true,
        role: 'admin',
        username__icontains: 'john'
      });
    });

    it('should handle empty simple and advanced filters', () => {
      const filters: CombinedFilters = {
        simple: {},
        advanced: []
      };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      expect(result).toEqual({
        offset: 0,
        limit: 50
      });
    });

    it('should omit ordering when sortField is undefined', () => {
      const filters: SimpleFilters = { search: 'john' };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      expect(result.ordering).toBeUndefined();
      expect(result).toEqual({
        offset: 0,
        limit: 50,
        search: 'john'
      });
    });

    it('should omit ordering when sortOrder is undefined', () => {
      const result = buildParams(0, 50, 'username', undefined);
      
      expect(result.ordering).toBeUndefined();
      expect(result).toEqual({
        offset: 0,
        limit: 50
      });
    });
  });

  // =====================================================
  // DRF Operator Coverage Tests
  // =====================================================

  describe('DRF Operators Coverage', () => {
    it('should support all string operators', () => {
      expect(buildFilterParam('field', 'exact')).toBe('field');
      expect(buildFilterParam('field', 'iexact')).toBe('field__iexact');
      expect(buildFilterParam('field', 'contains')).toBe('field__contains');
      expect(buildFilterParam('field', 'icontains')).toBe('field__icontains');
      expect(buildFilterParam('field', 'startswith')).toBe('field__startswith');
      expect(buildFilterParam('field', 'istartswith')).toBe('field__istartswith');
      expect(buildFilterParam('field', 'endswith')).toBe('field__endswith');
      expect(buildFilterParam('field', 'iendswith')).toBe('field__iendswith');
      expect(buildFilterParam('field', 'regex')).toBe('field__regex');
      expect(buildFilterParam('field', 'iregex')).toBe('field__iregex');
    });

    it('should support all numeric operators', () => {
      expect(buildFilterParam('field', 'gt')).toBe('field__gt');
      expect(buildFilterParam('field', 'gte')).toBe('field__gte');
      expect(buildFilterParam('field', 'lt')).toBe('field__lt');
      expect(buildFilterParam('field', 'lte')).toBe('field__lte');
      expect(buildFilterParam('field', 'range')).toBe('field__range');
    });

    it('should support list operator', () => {
      expect(buildFilterParam('field', 'in')).toBe('field__in');
    });

    it('should support boolean operator', () => {
      expect(buildFilterParam('field', 'isnull')).toBe('field__isnull');
    });

    it('should support date/time operators', () => {
      expect(buildFilterParam('created_at', 'date')).toBe('created_at__date');
      expect(buildFilterParam('created_at', 'year')).toBe('created_at__year');
      expect(buildFilterParam('created_at', 'month')).toBe('created_at__month');
      expect(buildFilterParam('created_at', 'day')).toBe('created_at__day');
      expect(buildFilterParam('created_at', 'week_day')).toBe('created_at__week_day');
      expect(buildFilterParam('created_at', 'time')).toBe('created_at__time');
      expect(buildFilterParam('created_at', 'hour')).toBe('created_at__hour');
      expect(buildFilterParam('created_at', 'minute')).toBe('created_at__minute');
      expect(buildFilterParam('created_at', 'second')).toBe('created_at__second');
    });
  });

  // =====================================================
  // Edge Cases and Integration Scenarios
  // =====================================================

  describe('Edge Cases', () => {
    it('should handle filters with special characters', () => {
      const filters: SimpleFilters = {
        'search': 'john@example.com',
        'description': 'Line 1\nLine 2\nLine 3'
      };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      expect(result.search).toBe('john@example.com');
      expect(result.description).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle numeric zero values', () => {
      const filters: SimpleFilters = { count: 0, score: 0 };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      expect(result.count).toBe(0);
      expect(result.score).toBe(0);
    });

    it('should handle false boolean values', () => {
      const filters: SimpleFilters = { is_active: false, is_deleted: false };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      expect(result.is_active).toBe(false);
      expect(result.is_deleted).toBe(false);
    });

    it('should handle mixed simple and advanced filters with overlapping fields', () => {
      const filters: CombinedFilters = {
        simple: { username: 'john' },  // Exact match
        advanced: [
          { field: 'username', value: 'doe', operator: 'icontains' }  // Case-insensitive search
        ]
      };
      const result = buildParams(0, 50, undefined, undefined, filters);
      
      // Both should be present with different keys
      expect(result.username).toBe('john');
      expect(result.username__icontains).toBe('doe');
    });
  });
});
