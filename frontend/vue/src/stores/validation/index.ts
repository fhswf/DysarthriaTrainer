/**
 * Validation Store
 *
 * Pinia store for validation service.
 * Provides lazy loading and automatic initialization.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ValidationServiceInterface } from './validation.types';

/**
 * Load the appropriate implementation based on environment
 */
const loadImplementation = async (): Promise<ValidationServiceInterface> => {
  if (import.meta.env.MODE === 'test' || import.meta.env.VITE_MOCK_VALIDATION === 'true') {
    const module = await import('./validation.mock');
    return module.createMockValidationService();
  } else {
    const module = await import('./validation.live');
    return module.createLiveValidationService();
  }
};

export const useValidationStore = defineStore('validation', () => {
  const impl = ref<ValidationServiceInterface | null>(null);
  let initPromise: Promise<void> | null = null;

  /**
   * Ensure the service is initialized before use
   * Note: Service registration happens in serviceBootstrap.ts during Phase 2
   */
  const ensureInitialized = async () => {
    if (!impl.value) {
      if (!initPromise) {
        initPromise = loadImplementation().then(async (instance) => {
          impl.value = instance;
          await instance.initialize();
          // Service already registered during bootstrap - no need to register again
        });
      }
      await initPromise;
    }
    return impl.value!;
  };

  // Schema Management
  const createSchema = async <T extends Record<string, any>>(schemaDefinition: any) => {
    const instance = await ensureInitialized();
    return instance.createSchema<T>(schemaDefinition);
  };

  const updateSchema = async <T extends Record<string, any>>(formId: string, schema: any) => {
    const instance = await ensureInitialized();
    return instance.updateSchema<T>(formId, schema);
  };

  const getSchema = async <T extends Record<string, any>>(formId: string) => {
    const instance = await ensureInitialized();
    return instance.getSchema<T>(formId);
  };

  // Field Validation
  const validateField = async <T extends Record<string, any>>(
    schema: any,
    field: string,
    value: unknown
  ) => {
    const instance = await ensureInitialized();
    return instance.validateField<T>(schema, field, value);
  };

  // Form Validation
  const validateForm = async <T extends Record<string, any>>(schema: any, data: Partial<T>) => {
    const instance = await ensureInitialized();
    return instance.validateForm<T>(schema, data);
  };

  // Error Management
  const setError = async (formId: string, field: string, message: string) => {
    const instance = await ensureInitialized();
    return instance.setError(formId, field, message);
  };

  const clearError = async (formId: string, field: string) => {
    const instance = await ensureInitialized();
    return instance.clearError(formId, field);
  };

  const clearAllErrors = async (formId: string) => {
    const instance = await ensureInitialized();
    return instance.clearAllErrors(formId);
  };

  const getErrors = async (formId: string) => {
    const instance = await ensureInitialized();
    return instance.getErrors(formId);
  };

  // State Management
  const getFormState = async (formId: string) => {
    const instance = await ensureInitialized();
    return instance.getFormState(formId);
  };

  const setFieldTouched = async (formId: string, field: string, touched: boolean) => {
    const instance = await ensureInitialized();
    return instance.setFieldTouched(formId, field, touched);
  };

  const setFormDirty = async (formId: string, dirty: boolean) => {
    const instance = await ensureInitialized();
    return instance.setFormDirty(formId, dirty);
  };

  // Common Rules
  const getCommonRules = async () => {
    const instance = await ensureInitialized();
    return instance.getCommonRules();
  };

  // Async Validation
  const validateAsync = async <T extends Record<string, any>>(
    field: string,
    value: unknown,
    validator: (value: unknown) => Promise<boolean>
  ) => {
    const instance = await ensureInitialized();
    return instance.validateAsync<T>(field, value, validator);
  };

  // Reactive Schemas
  const createReactiveSchema = async <T extends Record<string, any>>(
    createSchemaFn: () => any
  ) => {
    const instance = await ensureInitialized();
    return instance.createReactiveSchema<T>(createSchemaFn);
  };

  return {
    // Schema Management
    createSchema,
    updateSchema,
    getSchema,

    // Field Validation
    validateField,

    // Form Validation
    validateForm,

    // Error Management
    setError,
    clearError,
    clearAllErrors,
    getErrors,

    // State Management
    getFormState,
    setFieldTouched,
    setFormDirty,

    // Common Rules
    getCommonRules,

    // Async Validation
    validateAsync,

    // Reactive Schemas
    createReactiveSchema,
  };
});
