import { User } from '../types/user';
import { UserService } from './user.service';
import { auth } from '../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

/**
 * Service for synchronizing user data between Firebase Auth and Firestore
 */
export class UserSyncService {
  private userService: UserService;
  private unsubscribe: (() => void) | null = null;

  /**
   * Create a new UserSyncService
   */
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Start listening for auth state changes and sync with Firestore
   * @returns Unsubscribe function
   */
  startSync(): () => void {
    if (this.unsubscribe) {
      // Already syncing
      return this.unsubscribe;
    }

    // Listen for auth state changes
    this.unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, sync with Firestore
        await this.syncUser(firebaseUser);
      }
    });

    return this.unsubscribe;
  }

  /**
   * Stop listening for auth state changes
   */
  stopSync(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Sync a Firebase user with Firestore
   * @param firebaseUser Firebase user
   * @returns User object
   */
  async syncUser(firebaseUser: FirebaseUser): Promise<User> {
    // List of admin email addresses
    const adminEmails = ['lukan444@gmail.com'];

    // Determine role based on email
    const role = adminEmails.includes(firebaseUser.email || '') ? 'admin' : 'user';

    // Create user object
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL,
      role,
      providerId: firebaseUser.providerData[0]?.providerId || 'unknown',
      emailVerified: firebaseUser.emailVerified
    };

    // Sync with Firestore
    return this.userService.createOrUpdateUser(user);
  }

  /**
   * Get user preferences
   * @param userId User ID
   * @returns User preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    // This would query a separate userPreferences collection
    // For now, we'll return default preferences
    return {
      theme: 'light',
      notifications: true
    };
  }

  /**
   * Update user preferences
   * @param userId User ID
   * @param preferences User preferences
   * @returns True if successful
   */
  async updateUserPreferences(userId: string, preferences: any): Promise<boolean> {
    // This would update a separate userPreferences collection
    // For now, we'll return true
    return true;
  }
}
