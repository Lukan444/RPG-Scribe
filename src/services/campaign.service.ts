import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { Campaign, CampaignCreationParams, CampaignUpdateParams, CampaignStatus, CampaignPrivacy } from '../models/Campaign';
import { RPGWorldService } from './rpgWorld.service';

/**
 * Service for Campaign-related operations
 */
export class CampaignService extends FirestoreService<Campaign> {
  private rpgWorldService: RPGWorldService;

  constructor() {
    super('campaigns');
    this.rpgWorldService = new RPGWorldService();
  }

  /**
   * Get campaigns by world ID
   * @param worldId RPG World ID
   * @returns Array of campaigns
   */
  async getCampaignsByWorld(worldId: string): Promise<Campaign[]> {
    const { data } = await this.query([
      where('worldId', '==', worldId),
      orderBy('updatedAt', 'desc')
    ]);

    return data;
  }

  /**
   * Get campaigns by user (as GM)
   * @param userId User ID
   * @returns Array of campaigns
   */
  async getCampaignsByGM(userId: string): Promise<Campaign[]> {
    try {
      // Check if userId is valid
      if (!userId || userId === undefined) {
        console.error('getCampaignsByGM: userId is undefined or empty');
        return [];
      }

      // Use simpler query without orderBy to avoid composite index requirement
      const { data } = await this.query([
        where('gmIds', 'array-contains', userId)
      ]);

      // Sort in memory instead of in the query
      return data.sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      });
    } catch (error) {
      console.error('Error getting campaigns by GM:', error);
      return [];
    }
  }

  /**
   * Get campaigns by user (as player)
   * @param userId User ID
   * @returns Array of campaigns
   */
  async getCampaignsByPlayer(userId: string): Promise<Campaign[]> {
    try {
      // Check if userId is valid
      if (!userId || userId === undefined) {
        console.error('getCampaignsByPlayer: userId is undefined or empty');
        return [];
      }

      // Use simpler query without orderBy to avoid composite index requirement
      const { data } = await this.query([
        where('playerIds', 'array-contains', userId)
      ]);

      // Sort in memory instead of in the query
      return data.sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      });
    } catch (error) {
      console.error('Error getting campaigns by player:', error);
      return [];
    }
  }

  /**
   * Get all campaigns accessible by a user (as GM or player)
   * @param userId User ID
   * @returns Array of campaigns
   */
  async getCampaignsByUser(userId: string): Promise<Campaign[]> {
    // Get campaigns where user is GM
    const gmCampaigns = await this.getCampaignsByGM(userId);

    // Get campaigns where user is player
    const playerCampaigns = await this.getCampaignsByPlayer(userId);

    // Combine and deduplicate
    const combinedCampaigns = [...gmCampaigns];
    playerCampaigns.forEach(campaign => {
      if (!combinedCampaigns.some(c => c.id === campaign.id)) {
        combinedCampaigns.push(campaign);
      }
    });

    return combinedCampaigns;
  }

  /**
   * Get public campaigns
   * @returns Array of public campaigns
   */
  async getPublicCampaigns(): Promise<Campaign[]> {
    try {
      // Use string value directly to avoid enum issues
      const { data } = await this.query([
        where('privacySetting', '==', 'public')
      ]);

      // Sort in memory to avoid composite index requirement
      return data.sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      });
    } catch (error) {
      console.error('Error getting public campaigns:', error);
      // Fallback: return empty array if query fails
      return [];
    }
  }

  /**
   * Get campaigns by status
   * @param status Campaign status
   * @returns Array of campaigns
   */
  async getCampaignsByStatus(status: CampaignStatus): Promise<Campaign[]> {
    const { data } = await this.query([
      where('status', '==', status),
      orderBy('updatedAt', 'desc')
    ]);

    return data;
  }

  /**
   * Get campaigns by system
   * @param system Game system
   * @returns Array of campaigns
   */
  async getCampaignsBySystem(system: string): Promise<Campaign[]> {
    const { data } = await this.query([
      where('system', '==', system),
      orderBy('updatedAt', 'desc')
    ]);

    return data;
  }

  /**
   * Check if a user has access to a campaign
   * @param campaignId Campaign ID
   * @param userId User ID
   * @returns True if the user has access
   */
  async hasCampaignAccess(campaignId: string, userId: string): Promise<boolean> {
    try {
      // Get the campaign
      const campaign = await this.getById(campaignId);
      if (!campaign) {
        return false;
      }

      // Check if user is GM
      if (campaign.gmIds.includes(userId)) {
        return true;
      }

      // Check if user is player
      if (campaign.playerIds.includes(userId)) {
        return true;
      }

      // Check if campaign is public
      if (campaign.privacySetting === CampaignPrivacy.PUBLIC) {
        return true;
      }

      // Check if user has access to the world
      const hasWorldAccess = await this.rpgWorldService.hasWorldAccess(campaign.worldId, userId);
      return hasWorldAccess;
    } catch (error) {
      console.error(`Error checking campaign access for ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Create a new campaign
   * @param params Campaign creation parameters
   * @param userId User ID of the creator
   * @returns Created campaign
   */
  async createCampaign(params: CampaignCreationParams): Promise<Campaign> {
    try {
      // Get the world to inherit settings if needed
      const world = await this.rpgWorldService.getById(params.worldId);
      if (!world) {
        throw new Error(`RPG World with ID ${params.worldId} not found`);
      }

      const newCampaign: Campaign = {
        worldId: params.worldId,
        name: params.name,
        description: params.description,
        setting: params.setting || world.setting || '', // Ensure setting is not undefined
        system: params.system || world.system || '',    // Ensure system is not undefined
        systemVersion: params.systemVersion || world.systemVersion,
        status: params.status || CampaignStatus.PLANNING,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        imageURL: params.imageURL,
        bannerURL: params.bannerURL,
        tags: params.tags || [],
        privacySetting: params.privacySetting || CampaignPrivacy.PRIVATE,
        playerIds: params.playerIds || [],
        gmIds: params.gmIds || [params.createdBy],
        createdBy: params.createdBy,
        sessionCount: 0,
        characterCount: 0,
        locationCount: 0,
        factionCount: 0,
        itemCount: 0,
        eventCount: 0,
        storyArcCount: 0
      };

      // Create the campaign
      const campaignId = await this.create(newCampaign);

      // Update the world's campaign count
      const worldData = await this.rpgWorldService.getById(params.worldId);
      if (worldData) {
        await this.rpgWorldService.update(params.worldId, {
          campaignCount: (worldData.campaignCount || 0) + 1
        });
      }

      return {
        ...newCampaign,
        id: campaignId
      };
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update an existing campaign
   * @param campaignId Campaign ID
   * @param params Campaign update parameters
   * @returns Updated campaign
   */
  async updateCampaign(campaignId: string, params: CampaignUpdateParams): Promise<Campaign> {
    try {
      // Convert null dates to undefined to satisfy the type system
      const updatedParams: Partial<Campaign> = {
        ...params,
        startDate: params.startDate === null ? undefined : params.startDate,
        endDate: params.endDate === null ? undefined : params.endDate,
        nextSessionAt: params.nextSessionAt === null ? undefined : params.nextSessionAt
      };

      await this.update(campaignId, updatedParams);

      // Get the updated campaign
      const updatedCampaign = await this.getById(campaignId);
      if (!updatedCampaign) {
        throw new Error(`Campaign with ID ${campaignId} not found after update`);
      }

      return updatedCampaign;
    } catch (error) {
      console.error(`Error updating campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a campaign
   * @param campaignId Campaign ID
   * @returns True if successful
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      // Get the campaign to get the world ID
      const campaign = await this.getById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }

      // Delete the campaign
      await this.delete(campaignId);

      // Update the world's campaign count
      const world = await this.rpgWorldService.getById(campaign.worldId);
      if (world && world.campaignCount && world.campaignCount > 0) {
        await this.rpgWorldService.update(campaign.worldId, {
          campaignCount: world.campaignCount - 1
        });
      }

      return true;
    } catch (error) {
      console.error(`Error deleting campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Add a player to a campaign
   * @param campaignId Campaign ID
   * @param userId User ID to add
   * @returns True if successful
   */
  async addPlayer(campaignId: string, userId: string): Promise<boolean> {
    try {
      const campaign = await this.getById(campaignId);
      if (campaign) {
        const updatedPlayerIds = [...(campaign.playerIds || [])];
        if (!updatedPlayerIds.includes(userId)) {
          updatedPlayerIds.push(userId);
        }
        await this.update(campaignId, {
          playerIds: updatedPlayerIds
        });
      }

      return true;
    } catch (error) {
      console.error(`Error adding player to campaign ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Remove a player from a campaign
   * @param campaignId Campaign ID
   * @param userId User ID to remove
   * @returns True if successful
   */
  async removePlayer(campaignId: string, userId: string): Promise<boolean> {
    try {
      const campaign = await this.getById(campaignId);
      if (campaign) {
        const updatedPlayerIds = (campaign.playerIds || []).filter(id => id !== userId);
        await this.update(campaignId, {
          playerIds: updatedPlayerIds
        });
      }

      return true;
    } catch (error) {
      console.error(`Error removing player from campaign ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Add a GM to a campaign
   * @param campaignId Campaign ID
   * @param userId User ID to add
   * @returns True if successful
   */
  async addGM(campaignId: string, userId: string): Promise<boolean> {
    try {
      const campaign = await this.getById(campaignId);
      if (campaign) {
        const updatedGmIds = [...(campaign.gmIds || [])];
        if (!updatedGmIds.includes(userId)) {
          updatedGmIds.push(userId);
        }
        await this.update(campaignId, {
          gmIds: updatedGmIds
        });
      }

      return true;
    } catch (error) {
      console.error(`Error adding GM to campaign ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Remove a GM from a campaign
   * @param campaignId Campaign ID
   * @param userId User ID to remove
   * @returns True if successful
   */
  async removeGM(campaignId: string, userId: string): Promise<boolean> {
    try {
      // Get the campaign to check if this is the last GM
      const campaign = await this.getById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }

      // Don't allow removing the last GM
      if (campaign.gmIds.length <= 1) {
        throw new Error('Cannot remove the last GM from a campaign');
      }

      const updatedGmIds = campaign.gmIds.filter(id => id !== userId);
      await this.update(campaignId, {
        gmIds: updatedGmIds
      });

      return true;
    } catch (error) {
      console.error(`Error removing GM from campaign ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Get campaign with related entities
   * @param campaignId Campaign ID
   * @returns Campaign with related entities
   */
  async getCampaignWithRelatedEntities(campaignId: string): Promise<Campaign & {
    sessions?: any[],
    characters?: any[],
    locations?: any[],
    items?: any[],
    events?: any[]
  }> {
    try {
      // Get the campaign
      const campaign = await this.getById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }

      // Get sessions for this campaign
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('campaignId', '==', campaignId),
        orderBy('number', 'desc')
      );

      // Get characters for this campaign
      const charactersQuery = query(
        collection(db, 'characters'),
        where('campaignId', '==', campaignId),
        orderBy('name', 'asc')
      );

      // Get locations for this campaign
      const locationsQuery = query(
        collection(db, 'locations'),
        where('campaignId', '==', campaignId),
        orderBy('name', 'asc')
      );

      // Get items for this campaign
      const itemsQuery = query(
        collection(db, 'items'),
        where('campaignId', '==', campaignId),
        orderBy('name', 'asc')
      );

      // Get events for this campaign
      const eventsQuery = query(
        collection(db, 'events'),
        where('campaignId', '==', campaignId),
        orderBy('timelinePosition', 'asc')
      );

      // Execute all queries in parallel
      const [
        sessionsSnapshot,
        charactersSnapshot,
        locationsSnapshot,
        itemsSnapshot,
        eventsSnapshot
      ] = await Promise.all([
        getDocs(sessionsQuery),
        getDocs(charactersQuery),
        getDocs(locationsQuery),
        getDocs(itemsQuery),
        getDocs(eventsQuery)
      ]);

      // Process results
      const sessions: any[] = [];
      sessionsSnapshot.forEach(doc => {
        sessions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      const characters: any[] = [];
      charactersSnapshot.forEach(doc => {
        characters.push({
          id: doc.id,
          ...doc.data()
        });
      });

      const locations: any[] = [];
      locationsSnapshot.forEach(doc => {
        locations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      const items: any[] = [];
      itemsSnapshot.forEach(doc => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });

      const events: any[] = [];
      eventsSnapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        ...campaign,
        sessions,
        characters,
        locations,
        items,
        events
      };
    } catch (error) {
      console.error(`Error getting campaign with related entities ${campaignId}:`, error);
      throw error;
    }
  }
}