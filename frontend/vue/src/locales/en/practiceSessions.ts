export default {
  title: 'Practice Sessions',

  search: {
    placeholder: 'Search sessions...',
  },

  actions: {
    analyze: 'Analyze Session',
    download: 'Download Results',
  },

  columns: {
    startedAt: 'Started',
    status: 'Status',
    exercise: 'Exercise',
    totalItems: 'Items',
    completedItems: 'Progress',
    resultsCount: 'Results',
    duration: 'Duration',
    completedAt: 'Completed',
  },

  status: {
    in_progress: 'In Progress',
    completed: 'Completed',
    abandoned: 'Abandoned',
  },

  emptyState: {
    title: 'No practice sessions found',
    description: 'Start practicing to see your sessions here',
    descriptionFiltered: 'No sessions match your filters',
    clearFilters: 'Clear Filters',
    action: 'Start Practice',
  },

  confirmDelete: {
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this practice session? This action cannot be undone.',
  },

  confirmDeleteAll: {
    title: 'Confirm Delete All',
    message: 'Are you sure you want to delete {count} practice sessions?',
  },

  messages: {
    deleteSuccess: 'Practice session deleted successfully',
    exportSuccess: 'Sessions exported successfully',
    downloadSuccess: 'Session results downloaded successfully',
  },

  errors: {
    deleteFailed: 'Failed to delete practice session',
    deleteNotImplemented: 'Delete functionality not yet implemented',
    exportFailed: 'Failed to export sessions',
    loadFailed: 'Failed to load practice sessions',
  },

  filters: {
    dialogTitle: 'Filter Sessions',
    customFilters: 'Custom Filters',
    quickFilters: 'Quick Filters',
    apply: 'Apply',
    cancel: 'Cancel',
    clear: 'Clear All',
    presets: {
      all: 'All Sessions',
      completed: 'Completed',
      inProgress: 'In Progress',
      abandoned: 'Abandoned',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
    },
    quickPresets: {
      completedToday: 'Completed Today',
      completedThisWeek: 'Completed This Week',
    },
    fields: {
      status: 'Status',
      createdAt: 'Created At',
      completedAt: 'Completed At',
    },
    groups: {
      basic: 'Basic Information',
      dates: 'Date Filters',
      ungrouped: 'Other Filters',
    },
  },
}
