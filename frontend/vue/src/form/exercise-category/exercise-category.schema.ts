/**
 * Exercise Category Form Validation Schema
 *
 * Yup validation schema for exercise category forms.
 * Uses ValidationStore for common rules and LocalizationStore for error messages.
 *
 * @module form/exercise-category
 */

import * as yup from 'yup'
import { useValidationStore } from '@/stores/validation'
import { useLocalizationStore } from '@/stores/localization'

/**
 * Create validation schema for exercise category form
 *
 * CRITICAL: ValidationStore.getCommonRules() is async
 *
 * @returns Promise resolving to Yup object schema
 */
export const createExerciseCategorySchema = async () => {
  const validation = useValidationStore()
  const loc = useLocalizationStore()
  const rules = await validation.getCommonRules()

  return yup.object({
    // Name: Required, 2-255 characters
    name: rules
      .required(loc.t('exerciseCategories.form.validation.name_required'))
      .concat(rules.minLength(2, loc.t('exerciseCategories.form.validation.name_minLength')))
      .concat(rules.maxLength(255, loc.t('exerciseCategories.form.validation.name_maxLength'))),

    // Slug: Required, 2-255 chars, lowercase alphanumeric with hyphens only
    slug: rules
      .required(loc.t('exerciseCategories.form.validation.slug_required'))
      .concat(rules.minLength(2, loc.t('exerciseCategories.form.validation.slug_minLength')))
      .concat(rules.maxLength(255, loc.t('exerciseCategories.form.validation.slug_maxLength')))
      .concat(
        rules.pattern(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          loc.t('exerciseCategories.form.validation.slug_pattern')
        )
      ),

    // Description: Optional, max 2000 characters
    description: rules
      .maxLength(2000, loc.t('exerciseCategories.form.validation.description_maxLength'))
      .nullable(),

    // Icon URL: Optional, must be valid PrimeIcon class format
    icon_url: yup
      .string()
      .nullable()
      .test('icon-format', loc.t('exerciseCategories.form.validation.icon_pattern'), (value) => {
        if (!value) return true
        return /^pi pi-[\w-]+$/.test(value)
      }),

    // Display Order: Required, non-negative integer
    display_order: yup
      .number()
      .required(loc.t('exerciseCategories.form.validation.displayOrder_required'))
      .integer(loc.t('exerciseCategories.form.validation.displayOrder_integer'))
      .min(0, loc.t('exerciseCategories.form.validation.displayOrder_min')),
  })
}
