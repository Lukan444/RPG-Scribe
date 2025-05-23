import {
  where,
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { User } from '../types/user';

/**
 * Service for user-related operations
 */
export class UserService extends FirestoreService<User> {
  constructor() {
    super('users');
  }

  /**
   * Create or update a user in Firestore
   * @param user User data from Firebase Auth
   * @returns User object
   */
  async createOrUpdateUser(user: User): Promise<User> {
    try {
      const userRef = doc(db, this.collectionPath, user.id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Update existing user
        const userData = userDoc.data() as User;

        // Only update fields that have changed
        const updates: Partial<User> = {};

        if (user.name !== userData.name) updates.name = user.name;
        if (user.email !== userData.email) updates.email = user.email;
        if (user.photoURL !== userData.photoURL) updates.photoURL = user.photoURL;
        if (user.emailVerified !== userData.emailVerified) updates.emailVerified = user.emailVerified;

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = serverTimestamp();
          await updateDoc(userRef, updates);
        }

        return {
          ...userData,
          ...updates,
          id: user.id
        };
      } else {
        // Create new user
        const newUser = {
          ...user,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Default role for new users
          role: user.role || 'user'
        };

        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param role User role
   * @returns Array of users with the specified role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    const { data } = await this.query([
      where('role', '==', role),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Update user role
   * @param userId User ID
   * @param role New role
   * @returns True if successful
   */
  async updateUserRole(userId: string, role: 'user' | 'admin' | 'gamemaster' | 'player'): Promise<boolean> {
    return this.update(userId, { role });
  }

  /**
   * Get user activity
   * @param userId User ID
   * @param limit Number of activities to return
   * @returns Array of user activities
   */
  async getUserActivity(userId: string, limit = 10): Promise<any[]> {
    // This would query a separate activities collection
    // For now, we'll return a mock implementation
    return [];
  }
}
