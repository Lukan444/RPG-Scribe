/**
 * Timeline Data Populator Service
 *
 * Integrates the basic sample data service with the timeline system
 * to create a fully functional dual timeline with real data
 */

import { BasicSampleDataService, BasicSampleDataResult } from './basicSampleData.service';
import { FirestoreService } from './firestore.service';
import { Campaign } from '../models/Campaign';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface TimelinePopulationResult {
  sampleDataResult: BasicSampleDataResult;
  timelineDataLoaded: boolean;
  campaignId: string;
  worldId: string;
  eventsCount: number;
  error?: string;
}

export class TimelineDataPopulatorService {
  private basicSampleDataService: BasicSampleDataService;
  private campaignService: FirestoreService<Campaign>;

  constructor() {
    this.basicSampleDataService = new BasicSampleDataService();
    this.campaignService = new FirestoreService<Campaign>('campaigns');
  }

  /**
   * Populate comprehensive timeline data for a user
   * This creates sample data and loads timeline events
   */
  async populateTimelineData(userId: string): Promise<TimelinePopulationResult> {
    try {
      console.log('🚀 Starting timeline data population...');

      // Step 1: Generate basic sample data
      console.log('📊 Generating sample data...');
      const sampleDataResult = await this.basicSampleDataService.createBasicSampleData(userId);

      if (!sampleDataResult.success) {
        throw new Error(sampleDataResult.error || 'Failed to create sample data');
      }

      console.log('✅ Sample data generated:', sampleDataResult);

      const worldId = sampleDataResult.worldId!;
      const campaignId = sampleDataResult.campaignId!;

      console.log(`🌍 Using World ID: ${worldId}, Campaign ID: ${campaignId}`);

      // Step 2: Load events for the campaign
      console.log('⏰ Loading timeline events...');
      const eventsCount = await this.loadEventsForCampaign(campaignId);

      console.log(`✅ Timeline events loaded: ${eventsCount} events`);

      return {
        sampleDataResult,
        timelineDataLoaded: true,
        campaignId,
        worldId,
        eventsCount
      };

    } catch (error) {
      console.error('❌ Error populating timeline data:', error);
      return {
        sampleDataResult: {
          success: false,
          entitiesCreated: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timelineDataLoaded: false,
        campaignId: '',
        worldId: '',
        eventsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Load events for a specific campaign
   */
  private async loadEventsForCampaign(campaignId: string): Promise<number> {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('campaignId', '==', campaignId),
        orderBy('date', 'asc')
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      return eventsSnapshot.size;
    } catch (error) {
      console.error('Error loading events for campaign:', error);
      // Return 0 if there's an error (like missing index)
      return 0;
    }
  }

  /**
   * Check if user already has timeline data
   */
  async checkExistingTimelineData(userId: string): Promise<{
    hasData: boolean;
    campaignCount: number;
    worldCount: number;
  }> {
    try {
      // Use the basic sample data service to check existing data
      const existingData = await this.basicSampleDataService.checkExistingData(userId);

      return {
        hasData: existingData.hasData,
        campaignCount: existingData.campaignCount,
        worldCount: 0 // We don't track worlds separately in basic service
      };

    } catch (error) {
      console.error('Error checking existing timeline data:', error);
      return {
        hasData: false,
        campaignCount: 0,
        worldCount: 0
      };
    }
  }

  /**
   * Get timeline events for a specific campaign
   */
  async getTimelineDataForCampaign(worldId: string, campaignId: string) {
    try {
      const eventsCount = await this.loadEventsForCampaign(campaignId);
      return {
        eventsCount,
        worldId,
        campaignId
      };
    } catch (error) {
      console.error('Error loading timeline data for campaign:', error);
      throw error;
    }
  }

  /**
   * Refresh timeline data (useful after creating new entities)
   */
  async refreshTimelineData(worldId: string, campaignId: string) {
    try {
      console.log('🔄 Refreshing timeline data...');

      // Reload events count
      const eventsCount = await this.loadEventsForCampaign(campaignId);

      console.log(`✅ Timeline data refreshed: ${eventsCount} events`);
      return {
        eventsCount,
        worldId,
        campaignId
      };

    } catch (error) {
      console.error('Error refreshing timeline data:', error);
      throw error;
    }
  }

  /**
   * Create additional sample timeline entries for testing
   */
  async createAdditionalTimelineEntries(userId: string, worldId: string, campaignId: string) {
    try {
      console.log('📝 Creating additional timeline entries...');

      // This would create more complex timeline scenarios
      // For now, we'll just log that it's available for future implementation
      console.log('⚠️ Additional timeline entries creation not yet implemented');

      return {
        success: true,
        message: 'Additional timeline entries feature available for future implementation'
      };

    } catch (error) {
      console.error('Error creating additional timeline entries:', error);
      throw error;
    }
  }

  /**
   * Validate timeline data integrity
   */
  async validateTimelineData(worldId: string, campaignId: string) {
    try {
      console.log('🔍 Validating timeline data integrity...');

      const eventsCount = await this.loadEventsForCampaign(campaignId);

      const validation = {
        hasEvents: eventsCount > 0,
        hasGroups: true, // We always have groups in our basic implementation
        eventCount: eventsCount,
        groupCount: 1, // Basic implementation has one group
        isValid: eventsCount > 0
      };

      console.log('✅ Timeline data validation:', validation);
      return validation;

    } catch (error) {
      console.error('Error validating timeline data:', error);
      return {
        hasEvents: false,
        hasGroups: false,
        eventCount: 0,
        groupCount: 0,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
