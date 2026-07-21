/**
 * Validation Service - Mock Implementation
 *
 * Mock implementation for testing and development.
 * Provides simplified validation logic.
 */

import type {
  ValidationServiceInterface,
  FormValidationState,
  ValidationError,
  CommonValidationRules,
} from './validation.types';
import * as yup from 'yup';

export const createMockValidationService = (): ValidationServiceInterface => {
  console.log('🎭 Using MOCK Validation Service');

  const formStates = new Map<string, FormValidationState>();

  /**
   * Get or create form state for a given form ID
   */
  const getOrCreateFormState = (formId: string): FormValidationState => {
    if (!formStates.has(formId)) {
      formStates.set(formId, {
        isValidating: false,
        errors: {},
        fieldErrors: {},
        touchedFields: new Set(),
        isDirty: false,
      });
    }
    return formStates.get(formId)!;
  };

  return {
    async initialize() {
      console.log('✅ Mock Validation Service initialized');
    },

    createSchema<T extends Record<string, any>>(
      schemaDefinition: yup.ObjectSchema<T>
    ): yup.ObjectSchema<T> {
      return schemaDefinition;
    },

    updateSchema<T extends Record<string, any>>(
      _formId: string,
      _schema: yup.ObjectSchema<T>
    ): void {
      console.log('🎭 Mock: Schema updated');
    },

    getSchema<T extends Record<string, any>>(_formId: string): yup.ObjectSchema<T> | null {
      return null;
    },

    async validateField<T extends Record<string, any>>(
      _schema: yup.ObjectSchema<T>,
      field: string,
      value: unknown
    ): Promise<ValidationError[]> {
      // Mock always validates successfully unless value is empty
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return [
          {
            field,
            message: 'This field is required',
            type: 'required',
          },
        ];
      }
      return [];
    },

    async validateForm<T extends Record<string, any>>(
      _schema: yup.ObjectSchema<T>,
      _data: Partial<T>
    ): Promise<{ isValid: boolean; errors: ValidationError[] }> {
      // Mock always validates successfully
      console.log('🎭 Mock: Form validation passed');
      return { isValid: true, errors: [] };
    },

    setError(formId: string, field: string, message: string): void {
      const state = getOrCreateFormState(formId);
      state.errors[field] = message;
      state.fieldErrors[field] = [message];
    },

    clearError(formId: string, field: string): void {
      const state = getOrCreateFormState(formId);
      delete state.errors[field];
      delete state.fieldErrors[field];
    },

    clearAllErrors(formId: string): void {
      const state = getOrCreateFormState(formId);
      state.errors = {};
      state.fieldErrors = {};
    },

    getErrors(formId: string): Record<string, string> {
      const state = getOrCreateFormState(formId);
      return state.errors;
    },

    getFormState(formId: string): FormValidationState {
      return getOrCreateFormState(formId);
    },

    setFieldTouched(formId: string, field: string, touched: boolean): void {
      const state = getOrCreateFormState(formId);
      if (touched) {
        state.touchedFields.add(field);
      } else {
        state.touchedFields.delete(field);
      }
    },

    setFormDirty(formId: string, dirty: boolean): void {
      const state = getOrCreateFormState(formId);
      state.isDirty = dirty;
    },

    getCommonRules(): CommonValidationRules {
      // Return basic mock rules that always pass
      return {
        required: (message = 'Required') => yup.string().required(message),
        email: (message = 'Invalid email') =>
          yup.string().email(message).required(),
        password: () => yup.string().required(),
        confirmPassword: () => yup.string().required(),
        phone: () => yup.string(),
        url: () => yup.string().url(),
        minLength: (min: number) => yup.string().min(min),
        maxLength: (max: number) => yup.string().max(max),
        pattern: (regex: RegExp, message = 'Invalid') =>
          yup.string().matches(regex, message),
        fileSize: () => yup.mixed(),
        fileType: () => yup.mixed(),
      };
    },

    async validateAsync<T extends Record<string, any>>(
      _field: string,
      _value: unknown,
      _validator: (value: unknown) => Promise<boolean>
    ): Promise<boolean> {
      // Mock async validation always passes
      console.log('🎭 Mock: Async validation passed');
      return true;
    },

    createReactiveSchema<T extends Record<string, any>>(
      createSchemaFn: () => yup.ObjectSchema<T>
    ): () => yup.ObjectSchema<T> {
      return createSchemaFn;
    },
  };
};
