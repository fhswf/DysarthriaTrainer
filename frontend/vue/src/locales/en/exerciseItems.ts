/**
 * English translations for Exercise Items
 */

export default {
  // Page title
  title: 'Exercise Items',

  // Column headers
  displayOrder: 'Order',
  itemType: 'Type',
  repetitions: 'Reps',
  duration: 'Duration',
  exerciseId: 'Exercise',
  createdAt: 'Created',
  updatedAt: 'Updated',

  // Item types
  itemTypes: {
    movement: 'Movement',
    speech_practice: 'Speech Practice',
    information: 'Information',
  },

  // Actions
  actions: {
    view: 'View Item',
    edit: 'Edit Item',
    delete: 'Delete Item',
    create: 'Create Item',
  },

  // Messages
  deleteConfirm: {
    title: 'Delete Exercise Item',
    message: 'Are you sure you want to delete this exercise item? This action cannot be undone.',
  },
  deleteSuccess: 'Exercise item deleted successfully',
  deleteError: 'Failed to delete exercise item',
  error: 'Error: {message}',

  // Empty states
  noItems: 'No exercise items found',
  noItemsDescription: 'Create your first exercise item to get started',
}
