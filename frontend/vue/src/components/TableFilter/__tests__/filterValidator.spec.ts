import { describe, it, expect } from 'vitest';
import { validateFilters, type ValidationResult } from '../utils/filterValidator';
import type { FilterFieldDefinition } from '../types';

/**
 * Unit tests for filterValidator utility functions
 */
describe('filterValidator', () => {
  describe('validateFilters', () => {
    it('returns valid for empty filters with no validation rules', () => {
      const filters = {};
      const fields: FilterFieldDefinition<any>[] = [
        { key: 'name', type: 'text', labelKey: 'name' },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates required fields', () => {
      const filters = { name: '', email: 'test@example.com' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'name', 
          type: 'text', 
          labelKey: 'name',
          validation: { required: true },
        },
        { key: 'email', type: 'text', labelKey: 'email' },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('name');
      expect(result.errors.name).toContain('required');
    });

    it('passes when required field has value', () => {
      const filters = { name: 'John' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'name', 
          type: 'text', 
          labelKey: 'name',
          validation: { required: true },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates minimum number value', () => {
      const filters = { age: 15 };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'age', 
          type: 'number', 
          labelKey: 'age',
          validation: { min: 18 },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('age');
      expect(result.errors.age).toContain('18');
    });

    it('validates maximum number value', () => {
      const filters = { age: 150 };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'age', 
          type: 'number', 
          labelKey: 'age',
          validation: { max: 120 },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('age');
      expect(result.errors.age).toContain('120');
    });

    it('passes when number is within range', () => {
      const filters = { age: 25 };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'age', 
          type: 'number', 
          labelKey: 'age',
          validation: { min: 18, max: 120 },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates with custom function for minimum length', () => {
      const filters = { name: 'Jo' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'name', 
          type: 'text', 
          labelKey: 'name',
          validation: { 
            custom: (value: any) => !value || value.length >= 3
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('name');
    });

    it('validates with custom function for maximum length', () => {
      const filters = { name: 'JohnDoeVerylongName' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'name', 
          type: 'text', 
          labelKey: 'name',
          validation: { 
            custom: (value: any) => !value || value.length <= 10
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('name');
    });

    it('validates regex pattern', () => {
      const filters = { email: 'invalid-email' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'email', 
          type: 'text', 
          labelKey: 'email',
          validation: { 
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('email');
    });

    it('passes valid email pattern', () => {
      const filters = { email: 'test@example.com' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'email', 
          type: 'text', 
          labelKey: 'email',
          validation: { 
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates custom validation function', () => {
      const filters = { age: 17 };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'age', 
          type: 'number', 
          labelKey: 'age',
          validation: { 
            custom: (value: any) => value >= 18 
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('age');
    });

    it('passes custom validation function', () => {
      const filters = { age: 25 };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'age', 
          type: 'number', 
          labelKey: 'age',
          validation: { 
            custom: (value: any) => value >= 18 
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('skips validation for empty optional fields', () => {
      const filters = { name: '' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'name', 
          type: 'text', 
          labelKey: 'name',
          validation: { 
            custom: (value: any) => !value || value.length >= 3
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates multiple fields', () => {
      const filters = { 
        name: 'Jo', 
        age: 15,
        email: 'invalid-email'
      };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'name', 
          type: 'text', 
          labelKey: 'name',
          validation: { 
            custom: (value: any) => !value || value.length >= 3
          },
        },
        { 
          key: 'age', 
          type: 'number', 
          labelKey: 'age',
          validation: { min: 18 },
        },
        { 
          key: 'email', 
          type: 'text', 
          labelKey: 'email',
          validation: { 
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('name');
      expect(result.errors).toHaveProperty('age');
      expect(result.errors).toHaveProperty('email');
      expect(Object.keys(result.errors).length).toBe(3);
    });

    it('handles fields without validation rules', () => {
      const filters = { name: 'John', age: 25 };
      const fields: FilterFieldDefinition<any>[] = [
        { key: 'name', type: 'text', labelKey: 'name' },
        { key: 'age', type: 'number', labelKey: 'age' },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates zero as a valid number value', () => {
      const filters = { count: 0 };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'count', 
          type: 'number', 
          labelKey: 'count',
          validation: { min: 0, max: 100 },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates false as a valid boolean value', () => {
      const filters = { isActive: false };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'isActive', 
          type: 'boolean', 
          labelKey: 'isActive',
          validation: { required: true },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('stops validating after required check fails', () => {
      const filters = { email: '' };
      const fields: FilterFieldDefinition<any>[] = [
        { 
          key: 'email', 
          type: 'text', 
          labelKey: 'email',
          validation: { 
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
          },
        },
      ];
      
      const result = validateFilters(filters, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('required');
      expect(result.errors.email).not.toContain('pattern');
    });
  });
});
