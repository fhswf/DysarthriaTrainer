/**
 * Validation message translations (English)
 */

export default {
  required: '{field} is required',
  email: 'Invalid email address',
  minLength: '{field} must be at least {min} characters',
  maxLength: '{field} cannot exceed {max} characters',
  pattern: '{field} does not match the required format',
  min: '{field} must be at least {min}',
  max: '{field} cannot exceed {max}',
  custom: 'Validation error',
  unique: '{field} already exists',
  numeric: '{field} must be a number',
} as const
