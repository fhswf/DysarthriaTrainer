export default {
  title: 'Exercise Categories',

  search: {
    placeholder: 'Search categories by name or description...',
  },

  columns: {
    order: 'Order',
    name: 'Name',
    slug: 'Slug',
    description: 'Description',
    icon: 'Icon',
    createdAt: 'Created',
  },

  emptyState: {
    title: 'No categories found',
    description: 'Get started by creating your first exercise category',
    descriptionFiltered: 'No categories match your search',
    clearFilters: 'Clear Search',
    action: 'Create Category',
  },

  confirmDelete: {
    title: 'Confirm Delete',
    message:
      'Are you sure you want to delete this category? All exercises in this category will be affected.',
  },

  confirmDeleteAll: {
    title: 'Confirm Delete All',
    message: 'Are you sure you want to delete {count} categories?',
  },

  form: {
    title: {
      create: 'Create Exercise Category',
      edit: 'Edit Exercise Category',
      view: 'View Exercise Category',
    },
    subtitle: {
      edit: 'Editing category: {name}',
    },
    sections: {
      basic: 'Basic Information',
      display: 'Display Settings',
    },
    labels: {
      name: 'Category Name',
      slug: 'URL Slug',
      description: 'Description',
      iconUrl: 'Icon',
      iconPreview: 'Icon Preview',
      displayOrder: 'Display Order',
    },
    hints: {
      name: 'A clear and descriptive name for the category',
      slug: 'URL-friendly identifier (lowercase, hyphens only)',
      slugAuto: 'Auto-generated from name, you can customize it',
      description: 'Optional description to explain the category purpose',
      iconUrl: 'PrimeIcon class name (e.g., "pi pi-book")',
      displayOrder: 'Lower numbers appear first (0 = top)',
    },
    validation: {
      nameRequired: 'Category name is required',
      nameMinLength: 'Category name must be at least {min} characters',
      nameMaxLength: 'Category name must not exceed {max} characters',
      slugRequired: 'URL slug is required',
      slugMinLength: 'URL slug must be at least {min} characters',
      slugMaxLength: 'URL slug must not exceed {max} characters',
      slugPattern: 'URL slug can only contain lowercase letters, numbers, and hyphens',
      descriptionMaxLength: 'Description must not exceed {max} characters',
      iconPattern: 'Icon must be a valid PrimeIcon class (e.g., "pi pi-book")',
      displayOrderRequired: 'Display order is required',
      displayOrderInteger: 'Display order must be a whole number',
      displayOrderMin: 'Display order must be at least {min}',
    },
    buttons: {
      create: 'Create Category',
      update: 'Update Category',
      cancel: 'Cancel',
      back: 'Back to List',
    },
  },

  messages: {
    deleteSuccess: 'Category deleted successfully',
    exportSuccess: 'Categories exported successfully',
    createSuccess: 'Category created successfully',
    updateSuccess: 'Category updated successfully',
  },

  errors: {
    deleteFailed: 'Failed to delete category',
    exportFailed: 'Failed to export categories',
    loadFailed: 'Failed to load categories',
    createFailed: 'Failed to create category',
    updateFailed: 'Failed to update category',
  },
}
