export default {
  title: 'Media Files',

  // Column headers
  fileType: 'Type',
  filename: 'Filename',
  mimeType: 'Format',
  fileSize: 'Size',
  duration: 'Duration',
  dimensions: 'Dimensions',
  createdAt: 'Created',

  // File type labels
  fileTypes: {
    image: 'Image',
    audio: 'Audio',
    video: 'Video',
  },

  // Actions
  actions: {
    view: 'View Details',
    edit: 'Edit',
    delete: 'Delete',
    upload: 'Upload File',
    download: 'Download',
  },

  // Delete confirmation
  deleteConfirm: {
    title: 'Delete Media File',
    message: 'Are you sure you want to delete this file? This action cannot be undone.',
    confirm: 'Delete',
    cancel: 'Cancel',
  },

  // Success messages
  success: {
    uploaded: 'File uploaded successfully',
    deleted: 'File deleted successfully',
    updated: 'File updated successfully',
  },

  // Error messages
  error: 'Error: {message}',
  errors: {
    uploadFailed: 'Failed to upload file',
    deleteFailed: 'Failed to delete file',
    loadFailed: 'Failed to load media files',
    invalidFileType: 'Invalid file type',
    fileTooLarge: 'File is too large',
  },

  // Empty states
  empty: {
    title: 'No media files',
    message: 'Upload your first media file to get started',
  },
} as const
