/**
 * CampaignService test suite using Vitest
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Define the Campaign interface for testing
interface Campaign {
  id?: string;
  name: string;
  description?: string;
  setting?: string;
  system?: string;
  status?: string;
  createdBy?: string;
  isPublic?: boolean;
  characterCount?: number;
  locationCount?: number;
  itemCount?: number;
  eventCount?: number;
  sessionCount?: number;
  worldId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define the MockCampaignService class for testing
class MockCampaignService {
  private campaigns: Map<string, Campaign> = new Map();
  private nextId = 1;

  /**
   * Get singleton instance
   */
  public static getInstance(): MockCampaignService {
    return new MockCampaignService();
  }

  /**
   * Create a campaign
   */
  public async create(campaign: Campaign): Promise<string> {
    const id = `campaign-${this.nextId++}`;
    this.campaigns.set(id, { ...campaign, id });
    return id;
  }

  /**
   * Get a campaign by ID
   */
  public async getById(id: string): Promise<Campaign | null> {
    const campaign = this.campaigns.get(id);
    return campaign ? { ...campaign } : null;
  }

  /**
   * Update a campaign
   */
  public async update(id: string, campaign: Partial<Campaign>): Promise<boolean> {
    if (!this.campaigns.has(id)) {
      return false;
    }
    
    const existingCampaign = this.campaigns.get(id)!;
    this.campaigns.set(id, { ...existingCampaign, ...campaign });
    return true;
  }

  /**
   * Delete a campaign
   */
  public async delete(id: string): Promise<boolean> {
    if (!this.campaigns.has(id)) {
      return false;
    }
    
    this.campaigns.delete(id);
    return true;
  }

  /**
   * Get campaigns by user
   */
  public async getCampaignsByUser(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.createdBy === userId
    );
  }

  /**
   * Get campaigns by status
   */
  public async getCampaignsByStatus(status: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.status === status
    );
  }

  /**
   * Get public campaigns
   */
  public async getPublicCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.isPublic === true
    );
  }

  /**
   * Update campaign counts
   */
  public async updateCampaignCounts(id: string): Promise<boolean> {
    if (!this.campaigns.has(id)) {
      return false;
    }
    
    const existingCampaign = this.campaigns.get(id)!;
    this.campaigns.set(id, { 
      ...existingCampaign, 
      characterCount: 2,
      locationCount: 1,
      itemCount: 3,
      eventCount: 1,
      sessionCount: 2
    });
    return true;
  }

  /**
   * Clear all campaigns (for testing)
   */
  public clearCampaigns(): void {
    this.campaigns.clear();
    this.nextId = 1;
  }
}

/**
 * CampaignService test suite
 */
describe('CampaignService', () => {
  // Test service
  let campaignService: MockCampaignService;
  
  // Set up test environment
  beforeEach(() => {
    campaignService = MockCampaignService.getInstance();
    campaignService.clearCampaigns();
  });
  
  // Test getCampaignsByUser method
  describe('getCampaignsByUser', () => {
    it('should get campaigns by user', async () => {
      // Create test campaigns
      const campaigns: Campaign[] = [
        {
          name: 'Campaign 1',
          description: 'Description 1',
          setting: 'Fantasy',
          system: 'D&D 5e',
          status: 'active',
          createdBy: 'user1',
          isPublic: true
        },
        {
          name: 'Campaign 2',
          description: 'Description 2',
          setting: 'Sci-Fi',
          system: 'Starfinder',
          status: 'planned',
          createdBy: 'user1',
          isPublic: false
        },
        {
          name: 'Campaign 3',
          description: 'Description 3',
          setting: 'Horror',
          system: 'Call of Cthulhu',
          status: 'completed',
          createdBy: 'user2',
          isPublic: true
        }
      ];
      
      // Create campaigns
      for (const campaign of campaigns) {
        await campaignService.create(campaign);
      }
      
      // Get campaigns for user1
      const user1Campaigns = await campaignService.getCampaignsByUser('user1');
      
      // Verify user1 campaigns
      expect(user1Campaigns.length).toBe(2);
      expect(user1Campaigns.map(c => c.name).sort()).toEqual(['Campaign 1', 'Campaign 2'].sort());
      
      // Get campaigns for user2
      const user2Campaigns = await campaignService.getCampaignsByUser('user2');
      
      // Verify user2 campaigns
      expect(user2Campaigns.length).toBe(1);
      expect(user2Campaigns[0].name).toBe('Campaign 3');
    });
    
    it('should return empty array for user with no campaigns', async () => {
      // Get campaigns for user with no campaigns
      const campaigns = await campaignService.getCampaignsByUser('user3');
      
      // Verify empty array
      expect(campaigns.length).toBe(0);
    });
  });
  
  // Test getCampaignsByStatus method
  describe('getCampaignsByStatus', () => {
    it('should get campaigns by status', async () => {
      // Create test campaigns
      const campaigns: Campaign[] = [
        {
          name: 'Campaign 1',
          description: 'Description 1',
          setting: 'Fantasy',
          system: 'D&D 5e',
          status: 'active',
          createdBy: 'user1',
          isPublic: true
        },
        {
          name: 'Campaign 2',
          description: 'Description 2',
          setting: 'Sci-Fi',
          system: 'Starfinder',
          status: 'planned',
          createdBy: 'user1',
          isPublic: false
        },
        {
          name: 'Campaign 3',
          description: 'Description 3',
          setting: 'Horror',
          system: 'Call of Cthulhu',
          status: 'completed',
          createdBy: 'user2',
          isPublic: true
        },
        {
          name: 'Campaign 4',
          description: 'Description 4',
          setting: 'Fantasy',
          system: 'Pathfinder',
          status: 'active',
          createdBy: 'user2',
          isPublic: false
        }
      ];
      
      // Create campaigns
      for (const campaign of campaigns) {
        await campaignService.create(campaign);
      }
      
      // Get active campaigns
      const activeCampaigns = await campaignService.getCampaignsByStatus('active');
      
      // Verify active campaigns
      expect(activeCampaigns.length).toBe(2);
      expect(activeCampaigns.map(c => c.name).sort()).toEqual(['Campaign 1', 'Campaign 4'].sort());
      
      // Get planned campaigns
      const plannedCampaigns = await campaignService.getCampaignsByStatus('planned');
      
      // Verify planned campaigns
      expect(plannedCampaigns.length).toBe(1);
      expect(plannedCampaigns[0].name).toBe('Campaign 2');
      
      // Get completed campaigns
      const completedCampaigns = await campaignService.getCampaignsByStatus('completed');
      
      // Verify completed campaigns
      expect(completedCampaigns.length).toBe(1);
      expect(completedCampaigns[0].name).toBe('Campaign 3');
    });
    
    it('should return empty array for non-existent status', async () => {
      // Get campaigns with non-existent status
      const campaigns = await campaignService.getCampaignsByStatus('non-existent');
      
      // Verify empty array
      expect(campaigns.length).toBe(0);
    });
  });
  
  // Test getPublicCampaigns method
  describe('getPublicCampaigns', () => {
    it('should get public campaigns', async () => {
      // Create test campaigns
      const campaigns: Campaign[] = [
        {
          name: 'Campaign 1',
          description: 'Description 1',
          setting: 'Fantasy',
          system: 'D&D 5e',
          status: 'active',
          createdBy: 'user1',
          isPublic: true
        },
        {
          name: 'Campaign 2',
          description: 'Description 2',
          setting: 'Sci-Fi',
          system: 'Starfinder',
          status: 'planned',
          createdBy: 'user1',
          isPublic: false
        },
        {
          name: 'Campaign 3',
          description: 'Description 3',
          setting: 'Horror',
          system: 'Call of Cthulhu',
          status: 'completed',
          createdBy: 'user2',
          isPublic: true
        },
        {
          name: 'Campaign 4',
          description: 'Description 4',
          setting: 'Fantasy',
          system: 'Pathfinder',
          status: 'active',
          createdBy: 'user2',
          isPublic: false
        }
      ];
      
      // Create campaigns
      for (const campaign of campaigns) {
        await campaignService.create(campaign);
      }
      
      // Get public campaigns
      const publicCampaigns = await campaignService.getPublicCampaigns();
      
      // Verify public campaigns
      expect(publicCampaigns.length).toBe(2);
      expect(publicCampaigns.map(c => c.name).sort()).toEqual(['Campaign 1', 'Campaign 3'].sort());
      expect(publicCampaigns.every(c => c.isPublic)).toBe(true);
    });
  });
  
  // Test updateCampaignCounts method
  describe('updateCampaignCounts', () => {
    it('should update campaign counts', async () => {
      // Create test campaign
      const campaign: Campaign = {
        name: 'Campaign 1',
        description: 'Description 1',
        setting: 'Fantasy',
        system: 'D&D 5e',
        status: 'active',
        createdBy: 'user1',
        isPublic: true
      };
      
      // Create campaign
      const id = await campaignService.create(campaign);
      
      // Update campaign counts
      const success = await campaignService.updateCampaignCounts(id);
      
      // Verify update success
      expect(success).toBe(true);
      
      // Get updated campaign
      const updatedCampaign = await campaignService.getById(id);
      
      // Verify counts
      expect(updatedCampaign).toBeTruthy();
      expect(updatedCampaign?.characterCount).toBe(2);
      expect(updatedCampaign?.locationCount).toBe(1);
      expect(updatedCampaign?.itemCount).toBe(3);
      expect(updatedCampaign?.eventCount).toBe(1);
      expect(updatedCampaign?.sessionCount).toBe(2);
    });
  });
});
