export default {
  title: 'Exercises',

  search: {
    placeholder: 'Search exercises by title, code, or description...',
  },

  columns: {
    order: 'Order',
    code: 'Code',
    title: 'Title',
    category: 'Category',
    difficulty: 'Difficulty',
    duration: 'Duration',
    scope: 'Scope',
    version: 'Version',
    createdAt: 'Created',
  },

  emptyState: {
    title: 'No exercises found',
    description: 'Get started by creating your first exercise',
    descriptionFiltered: 'No exercises match your filters',
    clearFilters: 'Clear Filters',
    action: 'Create Exercise',
  },

  confirmDelete: {
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this exercise? This action cannot be undone.',
  },

  confirmDeleteAll: {
    title: 'Confirm Delete All',
    message: 'Are you sure you want to delete {count} exercises?',
  },

  messages: {
    deleteSuccess: 'Exercise deleted successfully',
    exportSuccess: 'Exercises exported successfully',
    createSuccess: 'Exercise created successfully',
    updateSuccess: 'Exercise updated successfully',
  },

  errors: {
    deleteFailed: 'Failed to delete exercise',
    exportFailed: 'Failed to export exercises',
    loadFailed: 'Failed to load exercises',
    createFailed: 'Failed to create exercise',
    updateFailed: 'Failed to update exercise',
  },

  difficulty: {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  },

  form: {
    title: {
      create: 'Create Exercise',
      edit: 'Edit Exercise',
    },
    subtitle: {
      edit: 'Editing exercise {id}',
    },
    sections: {
      basic: 'Basic Information',
      content: 'Content',
      settings: 'Settings',
    },
    labels: {
      category: 'Category',
      exerciseCode: 'Exercise Code',
      title: 'Title',
      subtitle: 'Subtitle',
      description: 'Description',
      instructions: 'Instructions',
      instruction: 'Instruction',
      items: 'Exercise Items',
      difficultyLevel: 'Difficulty Level',
      duration: 'Estimated Duration',
      isActive: 'Active',
    },
    hints: {
      exerciseCode: 'Format: XX000 (e.g., LS001)',
      instructions: 'No instructions added yet. Click the button above to add.',
    },
    buttons: {
      addInstruction: 'Add Instruction',
      addItem: 'Add Item',
    },
    validation: {
      category_required: 'Category is required',
      exerciseCode_required: 'Exercise code is required',
      exerciseCode_pattern: 'Exercise code must match format XX000 (e.g., LS001)',
      title_required: 'Title is required',
      title_minLength: 'Title must be at least 3 characters',
      title_maxLength: 'Title must not exceed 200 characters',
      subtitle_maxLength: 'Subtitle must not exceed 200 characters',
      description_maxLength: 'Description must not exceed 2000 characters',
      difficultyLevel_required: 'Difficulty level is required',
      difficultyLevel_invalid: 'Invalid difficulty level',
      duration_min: 'Duration must be at least 1 minute',
      duration_max: 'Duration must not exceed 180 minutes',
      instruction_language_required: 'Instruction language is required',
      item_type_required: 'Item type is required',
      item_type_invalid: 'Invalid item type',
      display_order_required: 'Display order is required',
      display_order_min: 'Display order must be at least 0',
      content_language_required: 'Content language is required',
      text_content_required: 'Text content is required',
    },
  },

  instructions: {
    dialog: {
      titleCreate: 'Add Instructions',
      titleEdit: 'Edit Instructions',
    },
    labels: {
      language: 'Language',
      hintText: 'Hint Text',
      explanationText: 'Explanation Text',
      safetyNotes: 'Safety Notes',
      preparationText: 'Preparation Text',
      audioInstruction: 'Audio Instruction',
      image: 'Instruction Image',
    },
    hints: {
      noInstructions: 'No instructions added yet. Click the button above to add.',
      hintText: 'Brief hint or tip for the user...',
      hintTextDescription: 'A short helpful tip to guide the user',
      explanationText: 'Detailed explanation of the exercise...',
      explanationTextDescription: 'Comprehensive instructions on how to perform the exercise',
      safetyNotes: 'Important safety warnings or precautions...',
      safetyNotesDescription: 'Safety information users should be aware of',
      preparationText: 'Preparation steps before starting the exercise...',
      preparationTextDescription: 'Instructions to prepare for the exercise',
      audioUrl: 'Enter audio file URL or upload',
      imageUrl: 'Enter image URL or upload',
      dialogInfo: 'Click the button above to add detailed instructions with media',
    },
    sections: {
      media: 'Media',
    },
    errors: {
      languageRequired: 'Language is required',
    },
  },

  items: {
    dialog: {
      titleCreate: 'Add Exercise Item',
      titleEdit: 'Edit Exercise Item',
    },
    sections: {
      generic: 'Item Properties',
      content: 'Type-Specific Content',
    },
    labels: {
      itemType: 'Item Type',
      displayOrder: 'Display Order',
      repetitions: 'Repetitions',
      durationSeconds: 'Duration (seconds)',
      targetPhoneme: 'Target Phoneme',
      language: 'Language',
      textContent: 'Text Content',
      phoneticTranscription: 'Phonetic Transcription',
      audioFileUrl: 'Audio File URL',
      demonstrationVideoUrl: 'Demonstration Video URL',
      visualCueImageUrl: 'Visual Cue Image URL',
      difficultyNotes: 'Difficulty Notes',
    },
    types: {
      minimalPair: 'Minimal Pair',
      word: 'Word',
      sentence: 'Sentence',
      breathing: 'Breathing Exercise',
      vocalization: 'Vocalization',
      articulation: 'Articulation',
      rhythm: 'Rhythm',
      intonation: 'Intonation',
      movement: 'Movement',
      speechPractice: 'Speech Practice',
      information: 'Information',
    },
    hints: {
      noItems: 'No items added yet. Click the button above to add exercise items.',
      confirmDelete: 'Are you sure you want to delete this item?',
      repetitions: 'Number of repetitions for this item (optional)',
      targetPhoneme: 'The specific sound or phoneme to practice (e.g., /s/, /r/)',
      language: 'Select the language for this content',
      textContent: 'The main text content for this item',
      phoneticTranscription: 'IPA phonetic transcription (e.g., /ˈhɛloʊ/)',
      audioFileUrl: 'URL or path to the audio file',
      demonstrationVideoUrl: 'URL or path to the demonstration video',
      visualCueImageUrl: 'URL or path to the visual cue image',
      difficultyNotes: 'Notes about the difficulty level or special considerations',
    },
    errors: {
      itemTypeRequired: 'Item type is required',
      displayOrderInvalid: 'Display order must be 0 or greater',
      textContentRequired: 'Content text is required',
    },
    movement: {
      labels: {
        instruction: 'Movement Instruction',
        demonstrationVideo: 'Demonstration Video',
        image: 'Reference Image',
      },
      hints: {
        instruction: 'Describe the movement to be performed...',
        instructionDescription: 'Clear instructions for the movement exercise',
        videoUrl: 'Enter video URL or upload',
        imageUrl: 'Enter image URL or upload',
      },
    },
    speechPractice: {
      labels: {
        practiceText: 'Practice Text',
        phoneticTranscription: 'Phonetic Transcription (IPA)',
        difficulty: 'Difficulty Level',
        audioExample: 'Audio Example',
      },
      hints: {
        practiceText: 'Text to be practiced (word, phrase, or sentence)...',
        practiceTextDescription: 'The text that the user should practice speaking',
        phoneticTranscription: 'e.g., /ˈhɛloʊ/ or [p]',
        phoneticTranscriptionDescription: 'IPA notation for pronunciation guidance',
        difficultyDescription: 'Scale from 1 (easy) to 10 (difficult)',
        audioUrl: 'Enter audio URL or upload',
      },
    },
    information: {
      labels: {
        informationText: 'Information Text',
        infoType: 'Information Type',
        image: 'Supporting Image',
      },
      hints: {
        informationText: 'Educational or contextual information...',
        informationTextDescription: 'Information to display to the user',
        infoTypeDescription: 'Category of information being provided',
        imageUrl: 'Enter image URL or upload',
      },
      infoTypes: {
        tip: 'Tip',
        warning: 'Warning',
        note: 'Note',
      },
    },
  },

  filters: {
    presets: {
      all: 'All Exercises',
      latest: 'Latest Versions',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      recent: 'Recent (30 days)',
    },
    fields: {
      category: 'Category',
      difficulty: 'Difficulty Level',
      duration: 'Duration (minutes)',
      createdDate: 'Created Date',
      latestVersionOnly: 'Latest version only',
    },
  },
}
