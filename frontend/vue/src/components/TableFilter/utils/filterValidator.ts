/**
 * Filter Validator Utility
 * 
 * Validates filter values against field definitions.
 * Provides validation for required fields, min/max values, patterns, and custom rules.
 */

import type { FilterFieldDefinition, FilterFieldValidation } from '../types';

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether all validations passed
   */
  valid: boolean;

  /**
   * Error messages keyed by field key
   * Empty object if valid
   */
  errors: Record<string, string>;
}

/**
 * Validate filter values against field definitions
 * 
 * @param filters - Current filter values
 * @param fields - Field definitions with validation rules
 * @returns Validation result with errors
 * 
 * @example
 * ```typescript
 * const result = validateFilters(
 *   { lastname__icontains: 'ab', age: 5 },
 *   [
 *     { key: 'lastname__icontains', validation: { minLength: 3 } },
 *     { key: 'age', validation: { min: 18, max: 100 } },
 *   ]
 * );
 * 
 * console.log(result.valid); // false
 * console.log(result.errors); // { lastname__icontains: 'Too short', age: 'Minimum value is 18' }
 * ```
 */
export function validateFilters<TParams>(
  filters: Partial<TParams>,
  fields: FilterFieldDefinition<TParams>[]
): ValidationResult {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const value = filters[field.key];
    const validation = field.validation;

    if (!validation) return;

    // Required check
    if (validation.required && (value === undefined || value === null || value === '')) {
      errors[String(field.key)] = 'This field is required';
      return; // Skip other validations if required fails
    }

    // Skip remaining validations if field is empty (not required)
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Min/max for numbers
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors[String(field.key)] = `Minimum value is ${validation.min}`;
        return;
      }
      if (validation.max !== undefined && value > validation.max) {
        errors[String(field.key)] = `Maximum value is ${validation.max}`;
        return;
      }
    }

    // Pattern for strings
    if (typeof value === 'string' && validation.pattern) {
      if (!validation.pattern.test(value)) {
        errors[String(field.key)] = 'Invalid format';
        return;
      }
    }

    // Custom validation
    if (validation.custom) {
      const result = validation.custom(value, filters as Record<string, any>);
      if (typeof result === 'string') {
        // Error message provided
        errors[String(field.key)] = result;
      } else if (result === false) {
        // Validation failed without specific message
        errors[String(field.key)] = 'Invalid value';
      }
      // If result === true, validation passed
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate date range (from <= to)
 * 
 * @param from - Start date
 * @param to - End date
 * @returns true if valid range, false otherwise
 * 
 * @example
 * ```typescript
 * validateDateRange('2025-01-01', '2025-12-31') // true
 * validateDateRange('2025-12-31', '2025-01-01') // false
 * validateDateRange(new Date('2025-01-01'), new Date('2025-12-31')) // true
 * validateDateRange('', '') // true (empty is valid)
 * ```
 */
export function validateDateRange(from: Date | string, to: Date | string): boolean {
  // Empty dates are valid (not required)
  if (!from || !to) return true;

  const fromDate = typeof from === 'string' ? new Date(from) : from;
  const toDate = typeof to === 'string' ? new Date(to) : to;

  // Check for invalid dates
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return false;
  }

  return fromDate <= toDate;
}

/**
 * Validate number range (min <= max)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns true if valid range, false otherwise
 * 
 * @example
 * ```typescript
 * validateNumberRange(10, 100) // true
 * validateNumberRange(100, 10) // false
 * validateNumberRange(null, 100) // true (empty min is valid)
 * ```
 */
export function validateNumberRange(
  min: number | null | undefined,
  max: number | null | undefined
): boolean {
  // Empty values are valid
  if (min === null || min === undefined || max === null || max === undefined) {
    return true;
  }

  return min <= max;
}

/**
 * Validate email format
 * Simple email validation regex
 * 
 * @param email - Email address to validate
 * @returns true if valid email format
 * 
 * @example
 * ```typescript
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 * validateEmail('') // true (empty is valid)
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Empty is valid (use required rule for mandatory)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
