import { RPGWorld, RPGWorldPrivacy, RPGWorldCreationParams } from '../models/RPGWorld';
import { RPGWorldService } from './rpgWorld.service'; // Import RPGWorldService
import { auth } from '../firebase/config'; // Import auth for current user

/**
 * Service for generating mock data for development and testing
 */
export class MockDataService {
  /**
   * Generate mock RPG Worlds
   * @param userId User ID to use as creator
   * @param count Number of worlds to generate
   * @returns Array of mock RPG Worlds
   */
  static generateMockWorlds(userId: string, count: number = 5): RPGWorld[] {
    const worlds: RPGWorld[] = [];

    const systems = ['D&D 5e', 'Pathfinder 2e', 'Call of Cthulhu', 'Cyberpunk RED', 'Vampire: The Masquerade'];
    const genres = ['Fantasy', 'Sci-Fi', 'Horror', 'Cyberpunk', 'Post-Apocalyptic', 'Urban Fantasy', 'Steampunk'];
    const settings = ['High Fantasy', 'Space Opera', 'Cosmic Horror', 'Dystopian Future', 'Modern Day', 'Victorian Era'];
    
    // Sample world names and descriptions
    const worldTemplates = [
      {
        name: 'Forgotten Realms',
        description: 'A high fantasy campaign setting for Dungeons & Dragons with diverse regions, rich lore, and iconic characters.',
        system: 'D&D 5e',
        genre: 'Fantasy',
        setting: 'High Fantasy'
      },
      {
        name: 'Cyberpunk Night City',
        description: 'A dystopian future where corporations rule and technology has transformed humanity in both wonderful and terrible ways.',
        system: 'Cyberpunk RED',
        genre: 'Cyberpunk',
        setting: 'Dystopian Future'
      },
      {
        name: 'Arkham Chronicles',
        description: 'A world of cosmic horror where investigators uncover eldritch mysteries and confront ancient beings beyond human comprehension.',
        system: 'Call of Cthulhu',
        genre: 'Horror',
        setting: 'Cosmic Horror'
      },
      {
        name: 'Starfinder Galaxy',
        description: 'A vast science fantasy setting where magic and technology coexist, with countless planets to explore and alien species to encounter.',
        system: 'Pathfinder 2e',
        genre: 'Sci-Fi',
        setting: 'Space Opera'
      },
      {
        name: 'World of Darkness',
        description: 'A gothic-punk setting where vampires, werewolves, and other supernatural creatures hide in the shadows of modern society.',
        system: 'Vampire: The Masquerade',
        genre: 'Urban Fantasy',
        setting: 'Modern Day'
      }
    ];

    // Generate the requested number of worlds
    for (let i = 0; i < count; i++) {
      // Use template if available, otherwise generate random data
      const template = worldTemplates[i % worldTemplates.length];
      
      // Generate random counts for statistics
      const campaignCount = Math.floor(Math.random() * 5) + 1;
      const characterCount = Math.floor(Math.random() * 20) + 5;
      const locationCount = Math.floor(Math.random() * 15) + 3;
      const factionCount = Math.floor(Math.random() * 8) + 2;
      const itemCount = Math.floor(Math.random() * 25) + 5;
      const eventCount = Math.floor(Math.random() * 12) + 3;
      
      // Generate random dates within the last year
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365));
      
      const updatedAt = new Date(createdAt);
      updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * (new Date().getDate() - createdAt.getDate())));
      
      // Determine privacy setting
      const privacyValues = Object.values(RPGWorldPrivacy);
      const privacySetting = privacyValues[Math.floor(Math.random() * privacyValues.length)];
      
      // Create the world object
      const world: RPGWorld = {
        id: `mock-world-${i + 1}`,
        name: `${template.name} ${i + 1}`,
        description: template.description,
        setting: template.setting,
        system: template.system,
        genre: template.genre,
        createdBy: userId,
        privacySetting: privacySetting as RPGWorldPrivacy,
        sharedLore: Math.random() > 0.5,
        campaignCount,
        characterCount,
        locationCount,
        factionCount,
        itemCount,
        eventCount,
        createdAt,
        updatedAt,
        // Add image URLs for some worlds
        imageURL: i % 3 === 0 ? `https://placehold.co/600x400?text=${encodeURIComponent(template.name)}` : undefined,
        worldMapURL: i % 4 === 0 ? `https://placehold.co/800x600?text=Map+of+${encodeURIComponent(template.name)}` : undefined,
        tags: [template.genre, template.setting, template.system]
      };
      
      worlds.push(world);
    }
    
    return worlds;
  }
  
  /**
   * Generate mock campaigns for a world
   * @param worldId World ID
   * @param userId User ID to use as creator
   * @param count Number of campaigns to generate
   * @returns Array of mock campaigns
   */
  static generateMockCampaigns(worldId: string, userId: string, count: number = 3): any[] {
    const campaigns = [];
    
    const campaignNames = [
      'Rise of the Dragon Queen',
      'Curse of Strahd',
      'Storm King\'s Thunder',
      'Descent into Avernus',
      'Rime of the Frostmaiden',
      'Lost Mine of Phandelver',
      'Tomb of Annihilation',
      'Waterdeep: Dragon Heist',
      'Out of the Abyss',
      'Ghosts of Saltmarsh'
    ];
    
    for (let i = 0; i < count; i++) {
      const name = campaignNames[Math.floor(Math.random() * campaignNames.length)];
      
      campaigns.push({
        id: `mock-campaign-${worldId}-${i + 1}`,
        name: `${name} ${i + 1}`,
        description: `A thrilling adventure in the world of wonder and danger.`,
        worldId,
        createdBy: userId,
        status: ['Active', 'Completed', 'Planned'][Math.floor(Math.random() * 3)],
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionCount: Math.floor(Math.random() * 20) + 1,
        playerCount: Math.floor(Math.random() * 6) + 2
      });
    }
    
    return campaigns;
  }

  /**
   * Seed Firestore with mock RPG Worlds and their campaigns
   * @param userId User ID for the creator of the mock data
   * @param numberOfWorlds Number of worlds to generate and seed
   */
  static async seedFirestoreWithMockData(userId: string, numberOfWorlds: number = 5): Promise<{ createdWorlds: RPGWorld[], errors: any[] }> {
    const rpgWorldService = new RPGWorldService();
    const createdWorlds: RPGWorld[] = [];
    const errors: any[] = [];

    console.log(`Starting Firestore seeding for user: ${userId}, worlds: ${numberOfWorlds}`);

    const mockWorldsData = this.generateMockWorlds(userId, numberOfWorlds);

    for (const mockWorld of mockWorldsData) {
      // Prepare data for creation (without the mock ID)
      const worldCreationParams: RPGWorldCreationParams = {
        name: mockWorld.name,
        description: mockWorld.description,
        setting: mockWorld.setting,
        system: mockWorld.system,
        genre: mockWorld.genre,
        // createdBy will be handled by createRPGWorld if userId is passed, or from auth.currentUser
        worldMapURL: mockWorld.worldMapURL,
        imageURL: mockWorld.imageURL,
        tags: mockWorld.tags,
        sharedLore: mockWorld.sharedLore,
        privacySetting: mockWorld.privacySetting,
        // Counts will be initialized by createRPGWorld or updated later
      };

      try {
        console.log(`Attempting to create world: ${worldCreationParams.name}`);
        const newWorld = await rpgWorldService.createRPGWorld(worldCreationParams, userId);
        createdWorlds.push(newWorld);
        console.log(`Successfully created world: ${newWorld.name} (ID: ${newWorld.id})`);

        // TODO: Optionally seed campaigns for this newWorld.id
        // const mockCampaigns = this.generateMockCampaigns(newWorld.id!, userId, 3);
        // const campaignService = new CampaignService(); // Assuming CampaignService exists
        // for (const campaign of mockCampaigns) {
        //   await campaignService.createCampaign(campaign); // Assuming createCampaign exists
        // }

      } catch (error) {
        console.error(`Error creating world ${worldCreationParams.name}:`, error);
        errors.push({ worldName: worldCreationParams.name, error });
      }
    }

    if (errors.length > 0) {
      console.warn('Firestore seeding completed with some errors.');
    } else {
      console.log('Firestore seeding completed successfully.');
    }
    return { createdWorlds, errors };
  }
}
