/**
 * Auth Service Type Definitions
 * 
 * Defines all interfaces and types for the authentication service
 */

/**
 * Access Control Configuration
 */
export interface AccessControlConfig {
  /** Enable/disable entire RBAC system */
  enabled: boolean;
  
  /** Allow admin bypass (users with isAdmin: true skip all checks) */
  adminBypass: boolean;
  
  /** Cache resolved permissions for performance */
  enableCaching: boolean;
  
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

export interface AuthServiceInterface {
  // Authentication
  login(credentials: LoginCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  forceLogout(): Promise<void>;  // Force logout without API calls (for blacklisted tokens)
  signup(data: SignupData): Promise<AuthResult>;
  refreshToken(): Promise<boolean>;
  
  // Token management
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string): void;
  isTokenExpired(): boolean;
  
  // User management
  getCurrentUser(): User | null;
  setCurrentUser(user: User): Promise<void>;
  updateCurrentUser(updates: Partial<User>): Promise<void>;
  isAuthenticated(): boolean;
  
  // Authorization
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  hasAllRoles(roles: string[]): boolean;
  canAccess(resource: string, action: string): boolean;
  
  // Session management
  initializeSession(): Promise<void>;
  terminateSession(): Promise<void>;
  validateSession(): Promise<boolean>;
  getSessionInfo(): SessionInfo;
  
  // Password management
  changePassword(oldPassword: string, newPassword: string): Promise<boolean>;
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Configuration
  updateConfiguration(config: Partial<AuthConfig>): void;
  getConfiguration(): AuthConfig;
  
  // RBAC-specific methods
  getAllPermissions(): string[];
  isValidPermission(permission: string): boolean;
  isValidRole(roleId: string): boolean;
  getRoleDefinition(roleId: string): any;
  getAccessRightDefinition(permission: string): any;
  enableAccessControl(): void;
  disableAccessControl(): void;
  isAccessControlEnabled(): boolean;
  
  // User switching methods
  switchToUser(userId: number, reason?: string): Promise<boolean>;
  revertToOriginalUser(): Promise<void>;
  canSwitchUsers(): Promise<boolean>;
  isUserSwitched(): boolean;
  getOriginalUser(): User | null;
  getActiveUser(): User | null;
  getSwitchInfo(): UserSwitchInfo | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * User interface matching Django backend API response
 * Backend: api/base/app_settings/serializers/user.py
 * 
 * Note: Backend returns snake_case field names
 * This matches the actual User interface from @/api/users/users.types.ts
 */
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string; // Backend field
  first_name?: string; // Computed from full_name
  last_name?: string; // Computed from full_name
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: number[]; // Array of group IDs
  permissions: string[];
  roles: string[];
  permission_overrides: Record<string, any>;
  
  // Optional UI fields (not from backend)
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface SessionInfo {
  isActive: boolean;
  startTime?: Date;
  lastActivity?: Date;
  expiresAt?: Date;
  userId?: string | number;
}

export interface AuthConfig {
  tokenKey: string;
  refreshTokenKey: string;
  tokenExpirationMinutes: number;
  enableAutoRefresh: boolean;
  enableRememberMe: boolean;
  loginEndpoint: string;
  logoutEndpoint: string;
  refreshEndpoint: string;
  userEndpoint: string;
  
  // RBAC configuration
  accessControl: AccessControlConfig;
}

export interface Permission {
  resource: string;
  actions: string[];
}

/**
 * User Switch Record for audit trail
 */
export interface UserSwitchRecord {
  timestamp: string;      // ISO 8601 datetime
  fromUserId: number;     // Original user ID
  toUserId: number;       // Target user ID
  toUsername: string;     // Target username (for display)
  reason?: string;        // Optional reason for switch
}

/**
 * User Switch Session data
 */
export interface UserSwitchSession {
  originalUser: User;           // The actual logged-in user
  activeUser: User;             // The current context user
  switchedAt: string;           // ISO 8601 datetime
  switchReason?: string;        // Optional reason
  history: UserSwitchRecord[];  // Audit trail for this session
}

/**
 * User Switch Info (public interface)
 */
export interface UserSwitchInfo {
  isUserSwitched: boolean;
  originalUser: User | null;
  activeUser: User | null;
  switchedAt: Date | null;
  switchReason: string | null;
}
