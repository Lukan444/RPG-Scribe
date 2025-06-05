/**
 * Basic Sample Data Service
 * 
 * Creates simple sample data for testing the timeline system
 * without complex type dependencies
 */

import { FirestoreService } from './firestore.service';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface BasicSampleDataResult {
  success: boolean;
  worldId?: string;
  campaignId?: string;
  entitiesCreated: number;
  error?: string;
}

export class BasicSampleDataService {
  
  /**
   * Create basic sample data for timeline testing
   */
  async createBasicSampleData(userId: string): Promise<BasicSampleDataResult> {
    try {
      console.log('🚀 Creating basic sample data for user:', userId);

      // Create a simple RPG World
      const worldData = {
        name: 'The Forgotten Realms of Aethermoor',
        description: 'A mystical realm where ancient magic intertwines with political intrigue.',
        setting: 'High Fantasy',
        genre: 'Fantasy Adventure',
        isPublic: false,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['fantasy', 'magic', 'adventure']
      };

      const worldRef = await addDoc(collection(db, 'rpgworlds'), worldData);
      const worldId = worldRef.id;
      console.log('✅ Created world:', worldId);

      // Create a simple Campaign
      const campaignData = {
        name: 'The Shattered Crown Chronicles',
        description: 'A tale of heroes who must unite the fractured kingdoms before an ancient evil awakens.',
        setting: 'The Forgotten Realms of Aethermoor',
        system: 'D&D 5e',
        status: 'active',
        isPublic: false,
        privacySetting: 'private', // CampaignPrivacy.PRIVATE
        worldId: worldId,
        gameSystem: 'D&D 5e',
        createdBy: userId,
        userId: userId, // For backward compatibility with existing queries
        gmIds: [userId], // Array of GM user IDs for CampaignService.getCampaignsByUser()
        playerIds: [], // Array of player user IDs
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['epic', 'quest', 'political']
      };

      const campaignRef = await addDoc(collection(db, 'campaigns'), campaignData);
      const campaignId = campaignRef.id;
      console.log('✅ Created campaign:', campaignId);

      // Create sample Characters
      const characters = [
        {
          name: 'Lyra Moonwhisper',
          description: 'A half-elf ranger with a mysterious past.',
          race: 'Half-Elf',
          class: 'Ranger',
          level: 5,
          isPlayerCharacter: true,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['ranger', 'half-elf', 'nature']
        },
        {
          name: 'Thorin Ironforge',
          description: 'A dwarven cleric of the forge domain.',
          race: 'Mountain Dwarf',
          class: 'Cleric',
          level: 5,
          isPlayerCharacter: true,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['cleric', 'dwarf', 'forge']
        }
      ];

      let entitiesCreated = 2; // world + campaign

      for (const character of characters) {
        await addDoc(collection(db, 'characters'), character);
        entitiesCreated++;
        console.log('✅ Created character:', character.name);
      }

      // Create sample Locations
      const locations = [
        {
          name: 'Silverbrook Village',
          description: 'A peaceful farming village nestled in the Whispering Valley.',
          locationType: 'village',
          region: 'Whispering Valley',
          isPublic: false,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['village', 'peaceful', 'farming']
        },
        {
          name: 'The Sundered Peaks',
          description: 'A treacherous mountain range split by ancient magical forces.',
          locationType: 'mountain',
          region: 'Northern Aethermoor',
          isPublic: false,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['mountains', 'dangerous', 'magical']
        }
      ];

      for (const location of locations) {
        await addDoc(collection(db, 'locations'), location);
        entitiesCreated++;
        console.log('✅ Created location:', location.name);
      }

      // Create sample Events
      const events = [
        {
          name: 'The Heroes Meet',
          description: 'The party members first encounter each other in Silverbrook Village.',
          date: new Date('2024-01-15'),
          eventType: 'meeting',
          importance: 8,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['meeting', 'introduction', 'party-formation']
        },
        {
          name: 'Discovery of the Crown Fragment',
          description: 'The party discovers the first fragment of the Shattered Crown.',
          date: new Date('2024-02-12'),
          eventType: 'discovery',
          importance: 10,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['discovery', 'crown-fragment', 'major-event']
        },
        {
          name: 'Battle with the Shadow Dragon',
          description: 'An epic battle against the guardian of the crown fragment.',
          date: new Date('2024-02-19'),
          eventType: 'combat',
          importance: 9,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['combat', 'dragon', 'epic-battle']
        },
        {
          name: 'Alliance with the Silver Dawn',
          description: 'The party forms an alliance with the Order of the Silver Dawn.',
          date: new Date('2024-03-05'),
          eventType: 'social',
          importance: 7,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['alliance', 'faction', 'political']
        }
      ];

      for (const event of events) {
        await addDoc(collection(db, 'events'), event);
        entitiesCreated++;
        console.log('✅ Created event:', event.name);
      }

      // Create sample Sessions
      const sessions = [
        {
          name: 'Session 1: The Call to Adventure',
          description: 'The heroes meet in Silverbrook Village and learn about the Shattered Crown.',
          sessionNumber: 1,
          date: new Date('2024-01-15'),
          duration: 240, // 4 hours in minutes
          status: 'completed',
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['introduction', 'quest-start']
        },
        {
          name: 'Session 2: Journey to the Peaks',
          description: 'The party travels toward the Sundered Peaks.',
          sessionNumber: 2,
          date: new Date('2024-01-22'),
          duration: 270, // 4.5 hours in minutes
          status: 'completed',
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['travel', 'exploration']
        }
      ];

      for (const session of sessions) {
        await addDoc(collection(db, 'sessions'), session);
        entitiesCreated++;
        console.log('✅ Created session:', session.name);
      }

      // Create sample Items
      const items = [
        {
          name: 'Crown Fragment of Aethermoor',
          description: 'A mystical fragment of the ancient crown, pulsing with magical energy.',
          itemType: 'artifact',
          rarity: 'legendary',
          value: 50000,
          weight: 2,
          isEquippable: false,
          isMagical: true,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['artifact', 'crown', 'magical', 'quest-item']
        },
        {
          name: 'Silverleaf Bow',
          description: 'An elegant elven bow crafted from silverleaf wood.',
          itemType: 'weapon',
          rarity: 'rare',
          value: 2500,
          weight: 3,
          isEquippable: true,
          isMagical: true,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['weapon', 'bow', 'elven', 'magical']
        },
        {
          name: 'Dwarven Forge Hammer',
          description: 'A masterwork hammer blessed by the forge gods.',
          itemType: 'weapon',
          rarity: 'uncommon',
          value: 1200,
          weight: 8,
          isEquippable: true,
          isMagical: true,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['weapon', 'hammer', 'dwarven', 'blessed']
        },
        {
          name: 'Healing Potion',
          description: 'A standard healing potion that restores vitality.',
          itemType: 'consumable',
          rarity: 'common',
          value: 50,
          weight: 0.5,
          isEquippable: false,
          isMagical: true,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['consumable', 'healing', 'potion']
        }
      ];

      for (const item of items) {
        await addDoc(collection(db, 'items'), item);
        entitiesCreated++;
        console.log('✅ Created item:', item.name);
      }

      // Create sample Factions
      const factions = [
        {
          name: 'Order of the Silver Dawn',
          description: 'A noble order of paladins dedicated to protecting the realm.',
          factionType: 'religious',
          alignment: 'lawful good',
          influence: 8,
          isPublic: false,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['paladins', 'noble', 'religious', 'good']
        },
        {
          name: 'Shadow Cult of Malachar',
          description: 'A secretive cult seeking to awaken an ancient evil.',
          factionType: 'cult',
          alignment: 'chaotic evil',
          influence: 6,
          isPublic: false,
          worldId,
          campaignId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: ['cult', 'evil', 'secretive', 'ancient']
        }
      ];

      for (const faction of factions) {
        await addDoc(collection(db, 'factions'), faction);
        entitiesCreated++;
        console.log('✅ Created faction:', faction.name);
      }

      console.log(`🎉 Successfully created ${entitiesCreated} entities`);

      return {
        success: true,
        worldId,
        campaignId,
        entitiesCreated
      };

    } catch (error) {
      console.error('❌ Error creating basic sample data:', error);
      return {
        success: false,
        entitiesCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user already has sample data
   */
  async checkExistingData(userId: string): Promise<{ hasData: boolean; campaignCount: number }> {
    try {
      const campaignService = new FirestoreService('campaigns');
      const result = await campaignService.query([]);

      // Filter by userId in the results since we can't use where clauses without proper indexes
      const userCampaigns = result.data.filter((campaign: any) =>
        campaign.userId === userId || campaign.createdBy === userId
      );

      return {
        hasData: userCampaigns.length > 0,
        campaignCount: userCampaigns.length
      };
    } catch (error) {
      console.error('Error checking existing data:', error);
      return { hasData: false, campaignCount: 0 };
    }
  }

  /**
   * Clean duplicate entities from the database
   */
  async cleanDuplicates(userId: string): Promise<{ success: boolean; duplicatesRemoved: number; error?: string }> {
    try {
      console.log('🧹 Starting duplicate cleanup for user:', userId);
      let duplicatesRemoved = 0;

      // Define collections to clean
      const collections = ['characters', 'locations', 'items', 'events', 'sessions', 'factions'];

      for (const collectionName of collections) {
        console.log(`📊 Cleaning duplicates in ${collectionName}...`);

        const service = new FirestoreService(collectionName);
        const result = await service.query([]);

        // Filter by user's entities
        const userEntities = result.data.filter((entity: any) =>
          entity.userId === userId || entity.createdBy === userId
        );

        // Group by name to find duplicates
        const entityGroups = new Map<string, any[]>();

        for (const entity of userEntities) {
          const name = entity.name?.toLowerCase().trim() || 'unnamed';
          if (!entityGroups.has(name)) {
            entityGroups.set(name, []);
          }
          entityGroups.get(name)!.push(entity);
        }

        // Remove duplicates (keep the first, delete the rest)
        for (const [name, entities] of entityGroups) {
          if (entities.length > 1) {
            console.log(`🚨 Found ${entities.length} duplicates of "${name}" in ${collectionName}`);

            // Sort by creation date (keep the oldest/first)
            entities.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateA.getTime() - dateB.getTime();
            });

            // Delete all but the first one
            for (let i = 1; i < entities.length; i++) {
              try {
                await service.delete(entities[i].id);
                duplicatesRemoved++;
                console.log(`🗑️ Deleted duplicate: ${name} (${entities[i].id})`);
              } catch (error) {
                console.error(`❌ Failed to delete ${name}:`, error);
              }
            }
          }
        }
      }

      console.log(`✅ Cleanup completed! Removed ${duplicatesRemoved} duplicates`);

      return {
        success: true,
        duplicatesRemoved
      };

    } catch (error) {
      console.error('❌ Error during duplicate cleanup:', error);
      return {
        success: false,
        duplicatesRemoved: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
