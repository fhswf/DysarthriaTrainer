/**
 * Validation Service - Live Implementation
 *
 * Production implementation of the validation service.
 * Provides full validation logic with Yup integration.
 */

import type {
  ValidationServiceInterface,
  FormValidationState,
  ValidationError,
  CommonValidationRules,
} from './validation.types';
import { createValidationCommunication } from './communication';
import * as yup from 'yup';

export const createLiveValidationService = (): ValidationServiceInterface => {
  const communication = createValidationCommunication();

  // Internal state
  const schemas = new Map<string, yup.ObjectSchema<any>>();
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
      console.log('✅ Validation Service (Live) initialized');
    },

    createSchema<T extends Record<string, any>>(
      schemaDefinition: yup.ObjectSchema<T>
    ): yup.ObjectSchema<T> {
      return schemaDefinition;
    },

    updateSchema<T extends Record<string, any>>(
      formId: string,
      schema: yup.ObjectSchema<T>
    ): void {
      schemas.set(formId, schema);
    },

    getSchema<T extends Record<string, any>>(formId: string): yup.ObjectSchema<T> | null {
      return (schemas.get(formId) as yup.ObjectSchema<T>) ?? null;
    },

    async validateField<T extends Record<string, any>>(
      schema: yup.ObjectSchema<T>,
      field: string,
      value: unknown
    ): Promise<ValidationError[]> {
      try {
        const fieldSchema = yup.reach(schema, field) as yup.Schema;
        if (fieldSchema) {
          await fieldSchema.validate(value);
          return [];
        }
        return [];
      } catch (error: unknown) {
        if (error instanceof yup.ValidationError) {
          return [
            {
              field,
              message: error.message,
              type: error.type ?? 'validation',
            },
          ];
        }
        return [];
      }
    },

    async validateForm<T extends Record<string, any>>(
      schema: yup.ObjectSchema<T>,
      data: Partial<T>
    ): Promise<{ isValid: boolean; errors: ValidationError[] }> {
      const errors: ValidationError[] = [];

      try {
        await schema.validate(data, { abortEarly: false });
        return { isValid: true, errors: [] };
      } catch (error: unknown) {
        if (error instanceof yup.ValidationError) {
          if (error.inner && error.inner.length > 0) {
            // Multiple field errors
            error.inner.forEach((err: yup.ValidationError) => {
              if (err.path) {
                errors.push({
                  field: err.path,
                  message: err.message,
                  type: err.type ?? 'validation',
                });
              }
            });
          } else if (error.path) {
            // Single field error
            errors.push({
              field: error.path,
              message: error.message,
              type: error.type ?? 'validation',
            });
          }
        }
        return { isValid: false, errors };
      }
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
      return {
        required: (message = 'This field is required') =>
          yup.string().required(message),

        email: (message = 'Invalid email address') =>
          yup.string().email(message).required(),

        password: (minLength = 8, message) =>
          yup
            .string()
            .required('Password is required')
            .min(
              minLength,
              message ?? `Password must be at least ${minLength} characters`
            )
            .matches(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
              message ??
                'Password must contain uppercase, lowercase, number, and special character'
            ),

        confirmPassword: (passwordField = 'password', message) =>
          yup
            .string()
            .required('Please confirm your password')
            .oneOf(
              [yup.ref(passwordField)],
              message ?? 'Passwords must match'
            ),

        phone: (message = 'Invalid phone number') =>
          yup.string().matches(/^\+?[\d\s\-\(\)]{10,}$/, message),

        url: (message = 'Invalid URL') => yup.string().url(message),

        minLength: (min: number, message) =>
          yup
            .string()
            .min(min, message ?? `Must be at least ${min} characters`),

        maxLength: (max: number, message) =>
          yup
            .string()
            .max(max, message ?? `Must be at most ${max} characters`),

        pattern: (regex: RegExp, message = 'Invalid format') =>
          yup.string().matches(regex, message),

        fileSize: (maxMB: number, message) =>
          yup.mixed().test(
            'fileSize',
            message ?? `File must be less than ${maxMB}MB`,
            (value: unknown) => {
              if (!value) return true;
              const file = value as File;
              return file.size <= maxMB * 1024 * 1024;
            }
          ),

        fileType: (types: string[], message) =>
          yup.mixed().test(
            'fileType',
            message ?? `File must be one of: ${types.join(', ')}`,
            (value: unknown) => {
              if (!value) return true;
              const file = value as File;
              return types.includes(file.type);
            }
          ),
      };
    },

    async validateAsync<T extends Record<string, any>>(
      field: string,
      value: unknown,
      validator: (value: unknown) => Promise<boolean>
    ): Promise<boolean> {
      try {
        return await validator(value);
      } catch (error) {
        console.error(`Async validation failed for ${field}:`, error);
        return true; // Don't block on async errors
      }
    },

    createReactiveSchema<T extends Record<string, any>>(
      createSchemaFn: () => yup.ObjectSchema<T>
    ): () => yup.ObjectSchema<T> {
      return createSchemaFn;
    },
  };
};
