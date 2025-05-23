import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * User preferences interface
 */
export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  sidebar: {
    expanded: boolean;
    favorites: string[];
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  [key: string]: any; // Allow additional properties
}

/**
 * Service for user preferences
 */
export class UserPreferencesService {
  private collectionPath: string = 'userPreferences';

  /**
   * Get user preferences
   * @param userId User ID
   * @returns User preferences or default preferences if not found
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const docRef = doc(db, this.collectionPath, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserPreferences;
      }

      // Return default preferences
      return this.getDefaultPreferences(userId);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update user preferences
   * @param userId User ID
   * @param preferences Partial user preferences to update
   * @returns True if successful
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const docRef = doc(db, this.collectionPath, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Update existing preferences
        await updateDoc(docRef, {
          ...preferences,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new preferences
        const defaultPrefs = this.getDefaultPreferences(userId);
        await setDoc(docRef, {
          ...defaultPrefs,
          ...preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Get default user preferences
   * @param userId User ID
   * @returns Default user preferences
   */
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      theme: 'system',
      notifications: true,
      sidebar: {
        expanded: true,
        favorites: []
      },
      dashboard: {
        layout: 'grid',
        widgets: ['recentCampaigns', 'recentCharacters', 'upcomingSessions']
      }
    };
  }
}
