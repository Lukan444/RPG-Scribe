/**
 * User model
 */

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  providerId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    uiDensity?: 'comfortable' | 'compact' | 'standard';
    notificationsEnabled?: boolean;
    emailNotificationsEnabled?: boolean;
  };
}

/**
 * User creation parameters
 */
export interface UserCreationParams {
  email: string;
  name: string;
  photoURL?: string;
  role?: UserRole;
  providerId?: string;
  emailVerified?: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    uiDensity?: 'comfortable' | 'compact' | 'standard';
    notificationsEnabled?: boolean;
    emailNotificationsEnabled?: boolean;
  };
}

/**
 * User update parameters
 */
export interface UserUpdateParams {
  name?: string;
  photoURL?: string;
  role?: UserRole;
  emailVerified?: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    uiDensity?: 'comfortable' | 'compact' | 'standard';
    notificationsEnabled?: boolean;
    emailNotificationsEnabled?: boolean;
  };
}
