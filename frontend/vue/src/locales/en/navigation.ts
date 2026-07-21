/**
 * Navigation translations (English)
 */

export default {
  home: 'Home',
  dashboard: 'Dashboard',
  exercises: 'Exercises',
  settings: 'Settings',
  profile: 'Profile',
  users: 'Users',
  reports: 'Reports',
  help: 'Help',
  about: 'About',
  admin: 'Administration',

  // Empty state
  noNavigation: 'No Navigation Available',
  noNavigationDescription:
    'There are no navigation items available for your role. Please contact your administrator if you believe this is an error.',

  // Navbar-specific translations
  navbar: {
    appName: 'AKI Speech Training',
    menu: {
      home: 'Home',
      exerciseCategories: 'Exercise Categories',
      exercises: 'Exercises',
      exerciseSelection: 'Exercise Selection',
      exerciseItems: 'Exercise Items',
      mediaFiles: 'Media Files',
      recordings: 'Recordings',
      practiceSessions: 'Practice Sessions',
    },
    userMenu: {
      profile: 'User Details',
      logout: 'Logout',
    },
  },
} as const
