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
  arrayRemove
} from 'firebase/firestore';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { RPGWorld, RPGWorldCreationParams, RPGWorldUpdateParams, RPGWorldPrivacy } from '../models/RPGWorld';

/**
 * Service for RPG World-related operations
 */
export class RPGWorldService extends FirestoreService<RPGWorld> {
  constructor() {
    super('rpgworlds');
  }

  /**
   * Get RPG Worlds created by a user
   * @param userId User ID
   * @returns Array of RPG Worlds
   */
  async getWorldsByUser(userId: string): Promise<RPGWorld[]> {
    const { data } = await this.query([
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
    ]);

    return data;
  }

  /**
   * Get public RPG Worlds
   * @returns Array of public RPG Worlds
   */
  async getPublicWorlds(): Promise<RPGWorld[]> {
    const { data } = await this.query([
      where('privacySetting', '==', RPGWorldPrivacy.PUBLIC),
      orderBy('updatedAt', 'desc')
    ]);

    return data;
  }

  /**
   * Get RPG Worlds accessible by a user (created by them or shared with them)
   * @param userId User ID
   * @returns Array of accessible RPG Worlds
   */
  async getAccessibleWorlds(userId: string): Promise<RPGWorld[]> {
    // Get worlds created by the user
    const ownedWorlds = await this.getWorldsByUser(userId);

    // Get worlds shared with the user
    const sharedWorldIds = await this.getSharedWorldsForUser(userId);

    // Optimize: Use batch query instead of individual getById calls
    const sharedWorlds: RPGWorld[] = [];
    if (sharedWorldIds.length > 0) {
      // Batch query for shared worlds (Firestore supports up to 10 documents per batch)
      const batchSize = 10;
      for (let i = 0; i < sharedWorldIds.length; i += batchSize) {
        const batch = sharedWorldIds.slice(i, i + batchSize);
        const { data } = await this.query([
          where('__name__', 'in', batch)
        ]);
        sharedWorlds.push(...data);
      }
    }

    // Combine and deduplicate
    const combinedWorlds = [...ownedWorlds];
    sharedWorlds.forEach(world => {
      if (!combinedWorlds.some(w => w.id === world.id)) {
        combinedWorlds.push(world);
      }
    });

    return combinedWorlds;
  }

  /**
   * Get worlds shared with a user
   * @param userId User ID
   * @returns Array of world IDs
   */
  async getSharedWorldsForUser(userId: string): Promise<string[]> {
    try {
      // Get worlds where the user has explicit access
      const accessSnapshot = await getDocs(
        query(collection(db, 'worldAccess'), where('userIds', 'array-contains', userId))
      );

      const worldIds: string[] = [];
      accessSnapshot.forEach(doc => {
        worldIds.push(doc.id);
      });

      // Get worlds where the user is a player in a campaign
      const campaignsSnapshot = await getDocs(
        query(collection(db, 'campaigns'), where('playerIds', 'array-contains', userId))
      );

      const campaignWorldIds: string[] = [];
      campaignsSnapshot.forEach(doc => {
        const worldId = doc.data().worldId;
        if (worldId && !worldIds.includes(worldId)) {
          campaignWorldIds.push(worldId);
        }
      });

      // For each campaign world, check if it has shared access
      for (const worldId of campaignWorldIds) {
        const world = await this.getById(worldId);
        if (world && world.privacySetting === RPGWorldPrivacy.SHARED) {
          worldIds.push(worldId);
        }
      }

      return [...new Set(worldIds)]; // Remove duplicates
    } catch (error) {
      console.error('Error getting shared worlds for user:', error);
      return [];
    }
  }

  /**
   * Get RPG Worlds by system
   * @param system Game system
   * @returns Array of RPG Worlds
   */
  async getWorldsBySystem(system: string): Promise<RPGWorld[]> {
    const { data } = await this.query([
      where('system', '==', system),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get RPG Worlds by setting
   * @param setting Game setting
   * @returns Array of RPG Worlds
   */
  async getWorldsBySetting(setting: string): Promise<RPGWorld[]> {
    const { data } = await this.query([
      where('setting', '==', setting),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get RPG Worlds by tag
   * @param tag Tag to search for
   * @returns Array of RPG Worlds
   */
  async getWorldsByTag(tag: string): Promise<RPGWorld[]> {
    const { data } = await this.query([
      where('tags', 'array-contains', tag),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Update RPG World campaign count
   * @param worldId RPG World ID
   * @returns True if successful
   */
  async updateWorldCampaignCount(worldId: string): Promise<boolean> {
    try {
      // Count campaigns in this world
      const campaignsQuery = query(
        collection(db, 'campaigns'),
        where('worldId', '==', worldId)
      );

      const snapshot = await getDocs(campaignsQuery);
      const campaignCount = snapshot.size;

      // Update world document with count
      await this.update(worldId, {
        campaignCount
      });

      return true;
    } catch (error) {
      console.error(`Error updating world campaign count for ${worldId}:`, error);
      return false;
    }
  }

  /**
   * Add user access to RPG World
   * @param worldId RPG World ID
   * @param userId User ID
   * @param role User role (GM or Player)
   * @returns True if successful
   */
  async addWorldAccess(worldId: string, userId: string, role: 'GM' | 'Player' = 'Player'): Promise<boolean> {
    try {
      const accessRef = doc(db, 'worldAccess', worldId);
      const accessDoc = await getDoc(accessRef);

      if (accessDoc.exists()) {
        // Update existing access document
        await updateDoc(accessRef, {
          userIds: arrayUnion(userId),
          [`userRoles.${userId}`]: role,
          updatedBy: auth.currentUser?.uid
        });
      } else {
        // Create new access document
        await setDoc(accessRef, {
          userIds: [userId],
          userRoles: { [userId]: role },
          createdBy: auth.currentUser?.uid
        });
      }

      // Add access record for audit
      const accessLogRef = doc(collection(db, `worldAccess/${worldId}/accessLog`));
      await setDoc(accessLogRef, {
        userId,
        role,
        action: 'granted',
        grantedBy: auth.currentUser?.uid
      });

      return true;
    } catch (error) {
      console.error(`Error adding world access for ${worldId}:`, error);
      return false;
    }
  }

  /**
   * Remove user access from RPG World
   * @param worldId RPG World ID
   * @param userId User ID
   * @returns True if successful
   */
  async removeWorldAccess(worldId: string, userId: string): Promise<boolean> {
    try {
      const accessRef = doc(db, 'worldAccess', worldId);
      const accessDoc = await getDoc(accessRef);

      if (accessDoc.exists()) {
        const data = accessDoc.data();
        const userIds = data.userIds || [];
        const userRoles = data.userRoles || {};

        // Remove user from userIds array
        const updatedUserIds = userIds.filter((id: string) => id !== userId);

        // Remove user from userRoles object
        const updatedUserRoles = { ...userRoles };
        delete updatedUserRoles[userId];

        // Update the document
        await updateDoc(accessRef, {
          userIds: updatedUserIds,
          userRoles: updatedUserRoles,
          updatedBy: auth.currentUser?.uid
        });

        // Add removal record for audit
        const accessLogRef = doc(collection(db, `worldAccess/${worldId}/accessLog`));
        await setDoc(accessLogRef, {
          userId,
          action: 'revoked',
          revokedBy: auth.currentUser?.uid
        });
      }

      return true;
    } catch (error) {
      console.error(`Error removing world access for ${worldId}:`, error);
      return false;
    }
  }

  /**
   * Get users with access to RPG World
   * @param worldId RPG World ID
   * @returns Object with user IDs and their roles
   */
  async getWorldAccessUsers(worldId: string): Promise<{ userIds: string[], userRoles: Record<string, string> }> {
    try {
      const accessRef = doc(db, 'worldAccess', worldId);
      const accessDoc = await getDoc(accessRef);

      if (accessDoc.exists()) {
        const data = accessDoc.data();
        return {
          userIds: data.userIds || [],
          userRoles: data.userRoles || {}
        };
      }

      return {
        userIds: [],
        userRoles: {}
      };
    } catch (error) {
      console.error(`Error getting world access users for ${worldId}:`, error);
      return {
        userIds: [],
        userRoles: {}
      };
    }
  }

  /**
   * Check if a user has access to a world
   * @param worldId World ID
   * @param userId User ID
   * @returns True if the user has access
   */
  async hasWorldAccess(worldId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is the creator
      const world = await this.getById(worldId);
      if (world && world.createdBy === userId) {
        return true;
      }

      // Check if user has explicit access
      const { userIds } = await this.getWorldAccessUsers(worldId);
      if (userIds.includes(userId)) {
        return true;
      }

      // Check if world is public
      if (world && world.privacySetting === RPGWorldPrivacy.PUBLIC) {
        return true;
      }

      // Check if user is a player in a campaign in this world with SHARED privacy
      if (world && world.privacySetting === RPGWorldPrivacy.SHARED) {
        const campaignsSnapshot = await getDocs(
          query(
            collection(db, 'campaigns'),
            where('worldId', '==', worldId),
            where('playerIds', 'array-contains', userId)
          )
        );

        return !campaignsSnapshot.empty;
      }

      return false;
    } catch (error) {
      console.error(`Error checking world access for ${worldId}:`, error);
      return false;
    }
  }

  /**
   * Create a new RPG World
   * @param params RPG World creation parameters
   * @param userId User ID of the creator
   * @returns Created RPG World
   * @throws Error if userId is undefined or empty
   */
  async createRPGWorld(params: RPGWorldCreationParams, userId?: string): Promise<RPGWorld> {
    try {
      // Validate user ID
      let creatorId: string;
      if (!userId) {
        // Try to get current user from auth
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.uid) {
          throw new Error('User ID is required to create an RPG World. User is not authenticated.');
        }
        creatorId = currentUser.uid;
      } else {
        creatorId = userId;
      }

      // Validate required parameters
      if (!params.name) {
        throw new Error('RPG World name is required');
      }

      if (!params.description) {
        throw new Error('RPG World description is required');
      }

      const newWorld: RPGWorld = {
        name: params.name,
        description: params.description,
        setting: params.setting || '', // Ensure setting is not undefined
        system: params.system || '',   // Ensure system is not undefined
        systemVersion: params.systemVersion || '',
        genre: params.genre || '',
        createdBy: creatorId,
        worldMapURL: params.worldMapURL || '',
        imageURL: params.imageURL || '',
        tags: params.tags || [],
        sharedLore: params.sharedLore ?? false,
        privacySetting: params.privacySetting ?? RPGWorldPrivacy.PRIVATE,
        campaignCount: 0,
        characterCount: 0,
        locationCount: 0,
        factionCount: 0,
        itemCount: 0,
        eventCount: 0,
        storyArcCount: 0
      };

      const worldId = await this.create(newWorld);

      // Create world access document for the creator
      await this.setupWorldAccess(worldId, creatorId);

      return {
        ...newWorld,
        id: worldId
      };
    } catch (error) {
      console.error('Error creating RPG World:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create RPG World: ${error.message}`);
      } else {
        throw new Error('Failed to create RPG World: Unknown error');
      }
    }
  }

  /**
   * Setup initial world access for creator
   * @param worldId World ID
   * @param creatorId Creator user ID
   */
  private async setupWorldAccess(worldId: string, creatorId: string): Promise<void> {
    try {
      const accessRef = doc(db, 'worldAccess', worldId);
      await setDoc(accessRef, {
        userIds: [creatorId]
      });
    } catch (error) {
      console.error(`Error setting up world access for ${worldId}:`, error);
      // Don't throw here, as the world was already created
    }
  }

  /**
   * Update an existing RPG World
   * @param worldId RPG World ID
   * @param params RPG World update parameters
   * @returns Updated RPG World
   */
  async updateRPGWorld(worldId: string, params: RPGWorldUpdateParams): Promise<RPGWorld> {
    try {
      await this.update(worldId, params);

      // Get the updated world
      const updatedWorld = await this.getById(worldId);
      if (!updatedWorld) {
        throw new Error(`RPG World with ID ${worldId} not found after update`);
      }

      return updatedWorld;
    } catch (error) {
      console.error(`Error updating RPG World ${worldId}:`, error);
      throw error;
    }
  }

  /**
   * Get RPG World with campaigns
   * @param worldId RPG World ID
   * @returns RPG World with campaigns
   */
  async getWorldWithCampaigns(worldId: string): Promise<RPGWorld & { campaigns: any[] }> {
    try {
      // Get the world
      const world = await this.getById(worldId);
      if (!world) {
        throw new Error(`RPG World with ID ${worldId} not found`);
      }

      // Get campaigns for this world
      const campaignsQuery = query(
        collection(db, 'campaigns'),
        where('worldId', '==', worldId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(campaignsQuery);
      const campaigns: any[] = [];

      snapshot.forEach(doc => {
        campaigns.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        ...world,
        campaigns
      };
    } catch (error) {
      console.error(`Error getting RPG World with campaigns ${worldId}:`, error);
      throw error;
    }
  }
}
