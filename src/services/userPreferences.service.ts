import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AISettings } from '../types/ai';

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
  livePlay?: {
    lastSelectedWorldId?: string;
    lastSelectedCampaignId?: string;
    autoSelectLastWorld?: boolean;
    autoSelectLastCampaign?: boolean;
  };
  ai?: AISettings;
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
   * Set last selected world for Live Play
   * @param userId User ID
   * @param worldId World ID
   * @returns True if successful
   */
  async setLastSelectedWorld(userId: string, worldId: string): Promise<boolean> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      return await this.updateUserPreferences(userId, {
        livePlay: {
          ...currentPrefs.livePlay,
          lastSelectedWorldId: worldId,
        }
      });
    } catch (error) {
      console.error('Error setting last selected world:', error);
      return false;
    }
  }

  /**
   * Set last selected campaign for Live Play
   * @param userId User ID
   * @param campaignId Campaign ID
   * @returns True if successful
   */
  async setLastSelectedCampaign(userId: string, campaignId: string): Promise<boolean> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      return await this.updateUserPreferences(userId, {
        livePlay: {
          ...currentPrefs.livePlay,
          lastSelectedCampaignId: campaignId,
        }
      });
    } catch (error) {
      console.error('Error setting last selected campaign:', error);
      return false;
    }
  }

  /**
   * Get last selected world ID for Live Play
   * @param userId User ID
   * @returns World ID or null if not found
   */
  async getLastSelectedWorldId(userId: string): Promise<string | null> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences.livePlay?.lastSelectedWorldId || null;
    } catch (error) {
      console.error('Error getting last selected world:', error);
      return null;
    }
  }

  /**
   * Get last selected campaign ID for Live Play
   * @param userId User ID
   * @returns Campaign ID or null if not found
   */
  async getLastSelectedCampaignId(userId: string): Promise<string | null> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences.livePlay?.lastSelectedCampaignId || null;
    } catch (error) {
      console.error('Error getting last selected campaign:', error);
      return null;
    }
  }

  /**
   * Check if auto-select last world is enabled
   * @param userId User ID
   * @returns True if auto-select is enabled
   */
  async shouldAutoSelectLastWorld(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences.livePlay?.autoSelectLastWorld ?? true; // Default to true
    } catch (error) {
      console.error('Error checking auto-select setting:', error);
      return true; // Default to true on error
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
      },
      livePlay: {
        autoSelectLastWorld: true,
        autoSelectLastCampaign: true,
      }
    };
  }
}
