/**
 * User Management Configuration
 * Configuration constants and settings for the user management feature
 */

export const USER_MANAGEMENT_CONFIG = {
  // Pagination settings
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Search settings
  SEARCH_DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 2,
  
  // Invitation settings
  MAX_BULK_INVITATIONS: 50,
  INVITATION_TIMEOUT_MS: 30000,
  
  // Role and group settings
  MAX_VISIBLE_BADGES: 3,
  MAX_ROLES_PER_USER: 100,
  MAX_GROUPS_PER_USER: 50,
  
  // UI settings
  CARD_HOVER_DELAY: 200,
  TOAST_DURATION: 5000,
  
  // Avatar settings
  AVATAR_SIZES: {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  },
  
  // Query stale times (in milliseconds)
  STALE_TIME: {
    USERS: 5 * 60 * 1000,          // 5 minutes
    USER_DETAILS: 2 * 60 * 1000,   // 2 minutes
    ROLES: 10 * 60 * 1000,         // 10 minutes
    GROUPS: 10 * 60 * 1000,        // 10 minutes
  },
  
  // Error messages
  ERROR_MESSAGES: {
    FETCH_USERS_FAILED: 'Failed to load organization users',
    FETCH_USER_DETAILS_FAILED: 'Failed to load user details',
    INVITE_USER_FAILED: 'Failed to send user invitation',
    ASSIGN_ROLES_FAILED: 'Failed to assign roles',
    ASSIGN_GROUPS_FAILED: 'Failed to assign groups',
    REMOVE_USER_FAILED: 'Failed to remove user from organization',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    USER_INVITED: 'User invitation sent successfully',
    ROLES_ASSIGNED: 'Roles assigned successfully',
    GROUPS_ASSIGNED: 'Groups assigned successfully',
    USER_REMOVED: 'User removed from organization',
  },
  
  // Validation rules
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 50,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
  },
  
  // Feature flags
  FEATURES: {
    BULK_OPERATIONS: true,
    CSV_IMPORT: false,
    AUDIT_LOGS: false,
    ADVANCED_FILTERS: false,
    REAL_TIME_UPDATES: false,
  },
} as const;

// Type for the configuration
export type UserManagementConfig = typeof USER_MANAGEMENT_CONFIG;
