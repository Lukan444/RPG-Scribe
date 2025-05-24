/**
 * Utility to populate Firebase with sample timeline data for testing
 */

import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
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
          timeGapBefore: entryData.timeGapBefore,
          validationStatus: entryData.validationStatus,
          hasConflicts: entryData.hasConflicts
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
   */
  async sampleDataExists(userId: string): Promise<boolean> {
    try {
      const entries = await this.timelineService.getTimelineEntries();

      return entries.length > 0;
    } catch (error) {
      console.error('Error checking sample data existence:', error);
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
   */
  async getSampleDataStats(userId: string): Promise<{
    worldExists: boolean;
    campaignExists: boolean;
    timelineEntryCount: number;
    totalExpectedEntries: number;
  }> {
    try {
      const entries = await this.timelineService.getTimelineEntries();

      return {
        worldExists: true, // We'll assume it exists if entries exist
        campaignExists: true,
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
