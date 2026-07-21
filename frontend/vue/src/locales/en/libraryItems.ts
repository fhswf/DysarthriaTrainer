/**
 * Library Items Translations (English)
 *
 * Translation keys for library items UI.
 *
 * @module locales/en
 */

export default {
  title: 'Library Items',
  subtitle: 'Manage reusable exercise content',

  columns: {
    id: 'ID',
    itemType: 'Type',
    textPreview: 'Content Preview',
    languages: 'Languages',
    repetitions: 'Repetitions',
    duration: 'Duration',
    displayOrder: 'Order',
    createdAt: 'Created',
    updatedAt: 'Updated',
  },

  itemTypes: {
    movement: 'Movement',
    speech_practice: 'Speech Practice',
    information: 'Information',
    minimal_pair: 'Minimal Pair',
    word: 'Word',
    sentence: 'Sentence',
    breathing: 'Breathing',
    vocalization: 'Vocalization',
    articulation: 'Articulation',
    rhythm: 'Rhythm',
    intonation: 'Intonation',
  },

  languages: {
    de: 'German',
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
  },

  form: {
    title: {
      create: 'Create Library Item',
      edit: 'Edit Library Item',
      view: 'View Library Item',
    },
    subtitle: {
      edit: 'Editing item: {id}',
      view: 'Viewing item: {id}',
    },
    fields: {
      itemType: 'Item Type',
      instructionId: 'Instruction ID',
      displayOrder: 'Display Order',
      repetitions: 'Repetitions',
      duration: 'Duration',
      language: 'Language',
      textContent: 'Text Content',
      audioUrl: 'Audio URL',
      videoUrl: 'Video URL',
      imageUrl: 'Image URL',
      phoneticTranscription: 'Phonetic Transcription',
      difficultyNotes: 'Difficulty Notes',
    },
    labels: {
      itemType: 'Item Type',
      instruction: 'Instruction',
      displayOrder: 'Display Order',
      repetitions: 'Repetitions',
      duration: 'Duration (seconds)',
      metadata: 'Metadata',
      contents: 'Contents',
      language: 'Language',
      textContent: 'Text Content',
      audioFile: 'Audio File',
      videoFile: 'Video File',
      imageFile: 'Image File',
      phoneticTranscription: 'Phonetic Transcription',
      difficultyNotes: 'Difficulty Notes',
    },
    placeholders: {
      itemType: 'Select an item type',
      instruction: 'Select an instruction (optional)',
      displayOrder: 'e.g. 0, 1, 2...',
      repetitions: 'e.g. 3, 5, 10',
      duration: 'e.g. 30, 60',
      textContent: 'Enter text content',
      audioFile: 'Select an audio file',
      phoneticTranscription: 'e.g. [mʊnt ˈœfnən]',
      difficultyNotes: 'Difficulty notes for this language',
      search: 'Search library items...',
    },
    hints: {
      itemType: 'The type of exercise content',
      instruction: 'Link to an instruction',
      instructionId: 'Optional UUID reference to an existing exercise instruction (advanced)',
      displayOrder: 'Determines display order',
      repetitions: 'How many times this should be repeated',
      duration: 'Duration in seconds for timing',
      metadata: 'Additional metadata as JSON',
      contents: 'Contents for different languages',
      multiLanguage: 'You can add contents for multiple languages',
    },
    sections: {
      basic: 'Basic Information',
      execution: 'Execution Settings',
      content: 'Multi-Language Content',
      metadata: 'Metadata',
    },
  },

  validation: {
    itemTypeRequired: 'Item type is required',
    textContentRequired: 'Text content is required',
    languageRequired: 'Language is required',
    languageDuplicate: 'Language already exists',
    displayOrderMin: 'Display order must be at least 0',
    repetitionsMin: 'Repetitions must be at least 1',
    durationMin: 'Duration must be at least 1 second',
    atLeastOneContent: 'At least one content is required',
    metadataInvalid: 'Metadata must be valid JSON',
    uuidFormat: 'Must be a valid UUID format',
  },

  actions: {
    create: 'Create',
    edit: 'Edit',
    view: 'View',
    delete: 'Delete',
    duplicate: 'Duplicate',
    attach: 'Attach',
    cancel: 'Cancel',
    save: 'Save',
    refresh: 'Refresh',
    export: 'Export',
    addContent: 'Add Content',
    removeContent: 'Remove Content',
    addLanguage: 'Add Language',
  },

  messages: {
    createSuccess: 'Library item created successfully',
    updateSuccess: 'Library item updated successfully',
    deleteSuccess: 'Library item deleted successfully',
    duplicateSuccess: 'Library item duplicated successfully',
    attachSuccess: 'Library item attached successfully',
    loadFailed: 'Failed to load library item',
    createFailed: 'Failed to create library item',
    updateFailed: 'Failed to update library item',
    deleteFailed: 'Failed to delete library item',
    duplicateFailed: 'Failed to duplicate library item',
    attachFailed: 'Failed to attach library item',
    deleteConfirm: 'Are you sure you want to delete this library item?',
    deleteConfirmTitle: 'Delete Item',
    duplicateConfirm: 'Do you want to duplicate this library item?',
    unsavedChanges: 'You have unsaved changes',
  },

  filters: {
    title: 'Filters',
    itemType: 'Filter by type',
    language: 'Filter by language',
    hasAudio: 'With Audio',
    hasVideo: 'With Video',
    reset: 'Reset filters',
  },

  table: {
    noData: 'No library items found',
    loading: 'Loading library items...',
    rowsPerPage: 'Rows per page',
    of: 'of',
    emptyMessage: 'No data available',
  },

  empty: {
    title: 'No Library Items',
    description: 'Create your first library item to get started',
    action: 'Create Library Item',
  },

  misc: {
    times: 'times',
    seconds: 'seconds',
    second: 'second',
    optional: 'optional',
    required: 'required',
  },
}
