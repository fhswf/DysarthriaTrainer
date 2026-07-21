/**
 * Profile translations (English)
 */

export default {
  title: 'Profile',
  subtitle: 'Manage your account settings and preferences',
  personalInfo: 'Personal Information',
  security: 'Security',

  // Fields
  firstName: 'First Name',
  lastName: 'Last Name',
  enterFirstName: 'Enter your first name',
  enterLastName: 'Enter your last name',
  emailNote: 'Email cannot be changed',
  usernameNote: 'Username cannot be changed',
  accountStatus: 'Account Status',
  active: 'Active',
  inactive: 'Inactive',

  // Actions
  saveChanges: 'Save Changes',
  changePassword: 'Change Password',
  updatePassword: 'Update Password',

  // Password Dialog
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmNewPassword: 'Confirm New Password',
  enterCurrentPassword: 'Enter your current password',
  enterNewPassword: 'Enter your new password',

  // Success Messages
  updateSuccess: 'Profile updated successfully',
  passwordChanged: 'Password changed successfully',

  // Error Messages
  updateError: 'Failed to update profile',
  passwordChangeError: 'Failed to change password',

  errors: {
    currentPasswordRequired: 'Current password is required',
    currentPasswordIncorrect: 'Current password is incorrect',
    newPasswordRequired: 'New password is required',
    confirmPasswordRequired: 'Please confirm your password',
    passwordMismatch: 'Passwords do not match',
  },
} as const
