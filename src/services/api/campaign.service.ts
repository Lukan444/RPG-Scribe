import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Campaign, CampaignCreationParams, CampaignUpdateParams, CampaignStatus, CampaignPrivacy } from '../../models/Campaign';

/**
 * Campaign service for API operations
 */
export class CampaignService {
  /**
   * Get all campaigns
   * @returns Promise with array of campaigns
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const campaignsRef = collection(db, 'campaigns');
      const q = query(campaignsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatCampaign({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   * @param id Campaign ID
   * @returns Promise with campaign or null
   */
  async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      const campaignRef = doc(db, 'campaigns', id);
      const campaignSnap = await getDoc(campaignRef);

      if (campaignSnap.exists()) {
        const data = campaignSnap.data();
        return this.formatCampaign({ id: campaignSnap.id, ...data });
      }

      return null;
    } catch (error) {
      console.error('Error getting campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaigns by user ID
   * @param userId User ID
   * @returns Promise with array of campaigns
   */
  async getCampaignsByUserId(userId: string): Promise<Campaign[]> {
    try {
      const campaignsRef = collection(db, 'campaigns');
      const q = query(
        campaignsRef,
        where('createdBy', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatCampaign({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting user campaigns:', error);
      throw error;
    }
  }

  /**
   * Create a new campaign
   * @param campaign Campaign creation parameters
   * @returns Promise with created campaign
   */
  async createCampaign(campaign: CampaignCreationParams): Promise<Campaign> {
    try {
      const campaignsRef = collection(db, 'campaigns');

      // Ensure createdBy is set
      const createdBy = campaign.createdBy;

      if (!createdBy) {
        throw new Error('User ID is required to create a campaign');
      }

      const newCampaign = {
        ...campaign,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        characterCount: 0,
        locationCount: 0,
        itemCount: 0,
        eventCount: 0,
        sessionCount: 0,
        isPublic: campaign.isPublic ?? false
      };

      const docRef = await addDoc(campaignsRef, newCampaign);

      // Convert to Campaign object
      const newCampaignObj: Campaign = {
        id: docRef.id,
        name: campaign.name,
        description: campaign.description,
        setting: campaign.setting || '', // Ensure setting is not undefined
        system: campaign.system || '',   // Ensure system is not undefined
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: campaign.startDate || undefined,
        endDate: campaign.endDate || undefined,
        status: campaign.status || CampaignStatus.PLANNING,
        imageURL: campaign.imageURL,
        worldId: campaign.worldId,
        isPublic: campaign.isPublic ?? false,
        characterCount: 0,
        locationCount: 0,
        itemCount: 0,
        eventCount: 0,
        sessionCount: 0,
        // Add missing required properties
        privacySetting: CampaignPrivacy.PRIVATE,
        playerIds: campaign.playerIds || [],
        gmIds: campaign.gmIds || [createdBy]
      };

      return newCampaignObj;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update a campaign
   * @param id Campaign ID
   * @param updates Campaign update parameters
   * @returns Promise with updated campaign
   */
  async updateCampaign(id: string, updates: CampaignUpdateParams): Promise<Campaign> {
    try {
      const campaignRef = doc(db, 'campaigns', id);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(campaignRef, updateData);

      const updatedCampaign = await this.getCampaignById(id);
      if (!updatedCampaign) {
        throw new Error('Campaign not found after update');
      }

      return updatedCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Delete a campaign
   * @param id Campaign ID
   * @returns Promise<void>
   */
  async deleteCampaign(id: string): Promise<void> {
    try {
      const campaignRef = doc(db, 'campaigns', id);
      await deleteDoc(campaignRef);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * Format campaign data from Firestore
   * @param data Firestore data
   * @returns Formatted campaign
   */
  private formatCampaign(data: any): Campaign {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
      recentSessions: data.recentSessions?.map((session: any) => ({
        ...session,
        date: session.date instanceof Timestamp ? session.date.toDate() : session.date
      })),
      recentEvents: data.recentEvents?.map((event: any) => ({
        ...event,
        date: event.date instanceof Timestamp ? event.date.toDate() : event.date
      }))
    };
  }

  /**
   * Upload campaign image
   * @param file Image file to upload
   * @returns Promise with image URL
   */
  async uploadCampaignImage(file: File): Promise<string> {
    try {
      // For now, we'll just return a placeholder URL
      // In a real implementation, this would upload to Firebase Storage
      console.log('Uploading campaign image:', file.name);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return placeholder URL
      return 'https://via.placeholder.com/800x400?text=Campaign+Image';
    } catch (error) {
      console.error('Error uploading campaign image:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
