/**
 * Authentication translations (English)
 */

export default {
  appTitle: 'AKI Speech Training',
  login: 'Login',
  logout: 'Logout',
  username: 'Username',
  rememberMe: 'Remember me',
  loginSuccess: 'Login successful',
  loginFailed: 'Login failed',
  logoutSuccess: 'Logout successful',
  logoutFailed: 'Logout failed',
  sessionExpired: 'Session expired',
  unauthorized: 'Unauthorized',
  invalidCredentials: 'Invalid credentials',
  passwordRequired: 'Password required',
  usernameRequired: 'Username required',

  // Messages
  welcomeBack: 'Welcome back, {username}!',
  sessionExpiredMessage: 'Your session has expired. Please log in again.',
  authenticationRequired: 'Authentication Required',
  pleaseLogin: 'Please log in to continue',
  passwordChanged: 'Password Changed',
  passwordChangedSuccess: 'Your password has been updated successfully',

  // Fields
  fields: {
    email: 'Email',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
  },

  // Placeholders
  placeholders: {
    email: 'Enter your email',
    username: 'Choose a username',
    password: 'Enter your password',
    confirmPassword: 'Confirm your password',
    fullName: 'Enter your full name (optional)',
  },

  // Login page
  loginPage: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account',
    signIn: 'Sign In',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    quickTestLogin: 'Quick Test Login:',
    testUser: 'User',
    testTherapist: 'Therapist',
    testAdmin: 'Admin',
  },

  // Registration
  register: {
    title: 'Create Account',
    subtitle: 'Sign up to get started',
    submit: 'Create Account',
    haveAccount: 'Already have an account?',
    loginLink: 'Log in',
  },

  // Password strength
  password: {
    requirements: 'Password Requirements',
    minLength: 'At least 8 characters',
    uppercase: 'At least one uppercase letter',
    lowercase: 'At least one lowercase letter',
    number: 'At least one number',
    special: 'At least one special character (!@#$%^&*)',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  },

  // Email Verification
  verifyEmail: {
    verifying: 'Verifying Email',
    pleaseWait: 'Please wait while we verify your email address...',
    goToLogin: 'Go to Login',
    requestNew: 'Request New Verification Email',
    redirecting: 'Redirecting to login in {seconds} seconds...',
    success: {
      title: 'Email Verified!',
      message: 'Your email has been successfully verified. You can now log in to your account.',
      toast: 'Email verified successfully!',
    },
    error: {
      title: 'Verification Failed',
      message: "We couldn't verify your email. The link may have expired or is invalid.",
      invalidToken: 'The verification link is invalid.',
      expiredToken: 'The verification link has expired. Please request a new one.',
      alreadyVerified: 'This email address has already been verified.',
      notFound: 'Verification token not found.',
      network: 'Network error. Please check your connection and try again.',
    },
    invalid: {
      title: 'Invalid Verification Link',
      message:
        'The verification link is missing or invalid. Please check your email for the correct link.',
    },
  },

  // Forgot Password
  forgotPassword: {
    title: 'Forgot Password?',
    subtitle: "Enter your email and we'll send you a link to reset your password",
    submit: 'Send Reset Link',
    backToLogin: 'Back to Login',
    noAccount: "Don't have an account?",
    registerLink: 'Sign up',
    rememberPassword: 'Remember your password?',
    loginLink: 'Sign in',
    securityNote: "For security reasons, we don't reveal whether an account exists.",
    success: {
      title: 'Check Your Email',
      message: "If an account exists with that email, we've sent password reset instructions.",
      securityNote: "For security reasons, we don't reveal whether an account exists.",
      toast: 'Password reset email sent',
    },
    errors: {
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      network: 'Network error. Please try again.',
    },
  },

  // Reset Password
  resetPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your new password below',
    newPassword: 'New Password',
    submit: 'Reset Password',
    goToLogin: 'Go to Login',
    requestNew: 'Request New Reset Link',
    redirecting: 'Redirecting to login in {seconds} seconds...',
    sessionNote: 'For security, all active sessions will be invalidated after password reset.',
    success: {
      title: 'Password Reset Successfully!',
      message: 'Your password has been reset. You can now log in with your new password.',
      toast: 'Password reset successfully!',
    },
    invalid: {
      title: 'Invalid Reset Link',
      message: 'This password reset link is invalid or has expired. Please request a new one.',
    },
    errors: {
      passwordRequired: 'Password is required',
      confirmRequired: 'Please confirm your password',
      passwordMismatch: 'Passwords do not match',
      invalidToken: 'The reset link is invalid.',
      expiredToken: 'The reset link has expired. Please request a new one.',
      weakPassword: 'Password does not meet security requirements.',
      notFound: 'Reset token not found.',
      network: 'Network error. Please check your connection and try again.',
    },
  },
} as const
