/**
 * Utility to populate Firebase with sample timeline data for testing
 */

import { collection, doc, setDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sampleTimelineEntries, sampleCampaignInfo, sampleWorldInfo } from '../data/sampleTimelineData';
import { TimelineService } from '../services/timeline.service';

export class SampleDataPopulator {
  private timelineService: TimelineService;

  constructor() {
    this.timelineService = new TimelineService();
  }

  /**
   * Populate the database with sample timeline data
   */
  async populateTimelineData(userId: string): Promise<void> {
    try {
      console.log('Starting sample data population...');

      // Create batch for atomic operations
      const batch = writeBatch(db);

      // 1. Create sample world
      const worldRef = doc(db, 'rpgWorlds', sampleWorldInfo.id);
      batch.set(worldRef, {
        ...sampleWorldInfo,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 2. Create sample campaign
      const campaignRef = doc(db, 'campaigns', sampleCampaignInfo.id);
      batch.set(campaignRef, {
        ...sampleCampaignInfo,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Commit world and campaign first
      await batch.commit();
      console.log('Created sample world and campaign');

      // 3. Create timeline entries one by one to ensure proper IDs
      for (const entryData of sampleTimelineEntries) {
        const timelineEntryParams = {
          title: entryData.title,
          description: entryData.description,
          entryType: entryData.entryType,
          importance: entryData.importance,
          associatedEntityId: entryData.associatedEntityId,
          associatedEntityType: entryData.associatedEntityType,
          tags: entryData.tags,
          position: entryData.position,
          // timeGapBefore and hasConflicts are not directly part of TimelineEntryCreationParams.
          // They are part of TimelineEntry, which is the result of creation/retrieval.
          // Removing them to resolve TypeScript errors.
        };

        await this.timelineService.createTimelineEntry(timelineEntryParams);
        console.log(`Created timeline entry: ${entryData.title}`);
      }

      console.log('Sample timeline data population completed successfully!');
    } catch (error) {
      console.error('Error populating sample data:', error);
      throw error;
    }
  }

  /**
   * Check if sample data already exists
   *
   * Performs a comprehensive check for all sample data types created by this service:
   * - Sample RPG World (Forgotten Realms)
   * - Sample Campaign (Forgotten Realms Campaign)
   * - Timeline entries
   *
   * @param userId - The user ID to check sample data for
   * @returns Promise<boolean> - True if any sample data exists, false otherwise
   */
  async sampleDataExists(userId: string): Promise<boolean> {
    try {
      console.log('Checking for existing sample data...');

      // Check 1: Sample RPG World exists
      const worldRef = doc(db, 'rpgWorlds', sampleWorldInfo.id);
      const worldDoc = await getDoc(worldRef);

      if (worldDoc.exists()) {
        console.log('Sample RPG World found');
        return true;
      }

      // Check 2: Sample Campaign exists
      const campaignRef = doc(db, 'campaigns', sampleCampaignInfo.id);
      const campaignDoc = await getDoc(campaignRef);

      if (campaignDoc.exists()) {
        console.log('Sample Campaign found');
        return true;
      }

      // Check 3: Timeline entries exist
      const entries = await this.timelineService.getTimelineEntries();

      if (entries.length > 0) {
        console.log(`Found ${entries.length} timeline entries`);
        return true;
      }

      console.log('No sample data found');
      return false;
    } catch (error) {
      console.error('Error checking sample data existence:', error);
      // Return false on error to allow sample data creation attempt
      return false;
    }
  }

  /**
   * Clear all sample data
   */
  async clearSampleData(userId: string): Promise<void> {
    try {
      console.log('Clearing sample data...');

      // Get all timeline entries for the sample campaign
      const entries = await this.timelineService.getTimelineEntries();

      // Delete timeline entries
      for (const entry of entries) {
        if (entry.id) {
          await this.timelineService.deleteTimelineEntry(entry.id);
        }
      }

      // Delete campaign and world
      const batch = writeBatch(db);

      const campaignRef = doc(db, 'campaigns', sampleCampaignInfo.id);
      batch.delete(campaignRef);

      const worldRef = doc(db, 'rpgWorlds', sampleWorldInfo.id);
      batch.delete(worldRef);

      await batch.commit();

      console.log('Sample data cleared successfully!');
    } catch (error) {
      console.error('Error clearing sample data:', error);
      throw error;
    }
  }

  /**
   * Get sample data statistics
   *
   * Provides detailed statistics about the current state of sample data
   */
  async getSampleDataStats(userId: string): Promise<{
    worldExists: boolean;
    campaignExists: boolean;
    timelineEntryCount: number;
    totalExpectedEntries: number;
  }> {
    try {
      // Check for sample RPG World
      const worldRef = doc(db, 'rpgWorlds', sampleWorldInfo.id);
      const worldDoc = await getDoc(worldRef);
      const worldExists = worldDoc.exists();

      // Check for sample Campaign
      const campaignRef = doc(db, 'campaigns', sampleCampaignInfo.id);
      const campaignDoc = await getDoc(campaignRef);
      const campaignExists = campaignDoc.exists();

      // Get timeline entries count
      const entries = await this.timelineService.getTimelineEntries();

      return {
        worldExists,
        campaignExists,
        timelineEntryCount: entries.length,
        totalExpectedEntries: sampleTimelineEntries.length
      };
    } catch (error) {
      console.error('Error getting sample data stats:', error);
      return {
        worldExists: false,
        campaignExists: false,
        timelineEntryCount: 0,
        totalExpectedEntries: sampleTimelineEntries.length
      };
    }
  }
}

// Export singleton instance
export const sampleDataPopulator = new SampleDataPopulator();

// Export sample data info for reference
export { sampleCampaignInfo, sampleWorldInfo } from '../data/sampleTimelineData';
