/**
 * Patients translations (English)
 */

export default {
  title: 'Patient Management',
  subtitle: 'Manage patient accounts and basic information',

  search: {
    placeholder: 'Search patients...',
  },

  filters: {
    status: 'Filter by status',
  },

  table: {
    empty: 'No patients found. Add your first patient to get started.',
    pageReport: 'Showing {first} to {last} of {totalRecords} patients',
    columns: {
      name: 'Name',
      email: 'Email',
      registeredAt: 'Registered',
      status: 'Status',
      actions: 'Actions',
    },
    noName: 'No name',
  },

  status: {
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
  },

  fields: {
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    email: 'Email',
    emailPlaceholder: 'patient@example.com',
    firstName: 'First Name',
    firstNamePlaceholder: 'Enter first name',
    lastName: 'Last Name',
    lastNamePlaceholder: 'Enter last name',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    passwordHint: 'Minimum 8 characters',
    isActive: 'Account is active',
    roles: 'Roles',
  },

  actions: {
    addPatient: 'Add Patient',
    view: 'View details',
    edit: 'Edit patient',
    delete: 'Delete patient',
    clearFilters: 'Clear Filters',
  },

  dialog: {
    createTitle: 'Add New Patient',
    editTitle: 'Edit Patient',
    viewTitle: 'Patient Details',
  },

  view: {
    futureFeatures: 'Additional Features Coming Soon',
    featuresDescription:
      'Training history, progress tracking, and therapy plan assignment will be available in future updates.',
  },

  validation: {
    usernameRequired: 'Username is required',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
  },

  success: {
    created: 'Patient created successfully',
    updated: 'Patient updated successfully',
  },

  errors: {
    loadFailed: 'Failed to load patients',
    submitFailed: 'Failed to save patient data',
  },

  delete: {
    confirmTitle: 'Delete Patient',
    confirmMessage: 'Are you sure you want to delete {name}? This action cannot be undone.',
    success: 'Patient deleted successfully',
    error: 'Failed to delete patient',
  },

  placeholder: {
    title: 'Preview Mode',
    description:
      'This page shows sample data. Real patient management functionality will be available once the backend API is implemented.',
  },
} as const
