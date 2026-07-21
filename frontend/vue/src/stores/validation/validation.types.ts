/**
 * Validation Service Type Definitions
 *
 * Provides TypeScript interfaces for the validation service.
 */

import type * as yup from 'yup';

/**
 * Individual validation rule definition
 */
export interface ValidationRule {
  name: string;
  validator: yup.Schema;
  message?: string;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

/**
 * Form validation state tracking
 */
export interface FormValidationState {
  isValidating: boolean;
  errors: Record<string, string>;
  fieldErrors: Record<string, string[]>;
  touchedFields: Set<string>;
  isDirty: boolean;
}

/**
 * Common validation rules interface
 */
export interface CommonValidationRules {
  required(message?: string): yup.StringSchema;
  email(message?: string): yup.StringSchema;
  password(minLength?: number, message?: string): yup.StringSchema;
  confirmPassword(passwordField: string, message?: string): yup.StringSchema;
  phone(message?: string): yup.StringSchema;
  url(message?: string): yup.StringSchema;
  minLength(min: number, message?: string): yup.StringSchema;
  maxLength(max: number, message?: string): yup.StringSchema;
  pattern(regex: RegExp, message?: string): yup.StringSchema;
  fileSize(maxMB: number, message?: string): yup.MixedSchema;
  fileType(types: string[], message?: string): yup.MixedSchema;
}

/**
 * Main validation service interface
 */
export interface ValidationServiceInterface {
  // Initialization
  initialize(): Promise<void>;

  // Schema Management
  createSchema<T extends Record<string, any>>(schemaDefinition: yup.ObjectSchema<T>): yup.ObjectSchema<T>;
  updateSchema<T extends Record<string, any>>(formId: string, schema: yup.ObjectSchema<T>): void;
  getSchema<T extends Record<string, any>>(formId: string): yup.ObjectSchema<T> | null;

  // Field Validation
  validateField<T extends Record<string, any>>(
    schema: yup.ObjectSchema<T>,
    field: string,
    value: unknown
  ): Promise<ValidationError[]>;

  // Form Validation
  validateForm<T extends Record<string, any>>(
    schema: yup.ObjectSchema<T>,
    data: Partial<T>
  ): Promise<{ isValid: boolean; errors: ValidationError[] }>;

  // Error Management
  setError(formId: string, field: string, message: string): void;
  clearError(formId: string, field: string): void;
  clearAllErrors(formId: string): void;
  getErrors(formId: string): Record<string, string>;

  // State Management
  getFormState(formId: string): FormValidationState;
  setFieldTouched(formId: string, field: string, touched: boolean): void;
  setFormDirty(formId: string, dirty: boolean): void;

  // Common Rules
  getCommonRules(): CommonValidationRules;

  // Async Validation
  validateAsync<T extends Record<string, any>>(
    field: string,
    value: unknown,
    validator: (value: unknown) => Promise<boolean>
  ): Promise<boolean>;

  // Reactive Schemas
  createReactiveSchema<T extends Record<string, any>>(
    createSchemaFn: () => yup.ObjectSchema<T>
  ): () => yup.ObjectSchema<T>;
}

/**
 * Validation patterns for common use cases
 */
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  postalCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{13,19}$/,
};
