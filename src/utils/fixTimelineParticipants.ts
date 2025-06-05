/**
 * Utility script to fix missing participant references in timeline events
 * This resolves the "Missing Participant Reference" conflicts in the timeline
 */

import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query, where, addDoc } from 'firebase/firestore';

export interface ParticipantFixResult {
  success: boolean;
  eventsFixed: number;
  participantsAdded: number;
  error?: string;
}

export class TimelineParticipantFixer {
  
  /**
   * Fix missing participant references in timeline events
   */
  async fixMissingParticipants(campaignId: string): Promise<ParticipantFixResult> {
    try {
      console.log('🔧 Starting timeline participant fix for campaign:', campaignId);
      
      let eventsFixed = 0;
      let participantsAdded = 0;

      // Get all characters in the campaign to use as participants
      const charactersRef = collection(db, 'characters');
      const charactersQuery = query(charactersRef, where('campaignId', '==', campaignId));
      const charactersSnapshot = await getDocs(charactersQuery);
      
      const characterIds: string[] = [];
      charactersSnapshot.forEach((doc) => {
        characterIds.push(doc.id);
      });

      console.log(`📋 Found ${characterIds.length} characters to use as participants`);

      // Get all events in the campaign
      const eventsRef = collection(db, 'events');
      const eventsQuery = query(eventsRef, where('campaignId', '==', campaignId));
      const eventsSnapshot = await getDocs(eventsQuery);

      // Events that need participant fixes
      const problematicEvents = [
        'Goblin Ambush',
        'Redbrand Confrontation', 
        'Discovery of Wave Echo Cave'
      ];

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventName = eventData.name || eventData.title || '';

        // Check if this event needs fixing
        if (problematicEvents.some(name => eventName.includes(name))) {
          console.log(`🎯 Fixing event: ${eventName}`);

          // Check if participantIds is missing or undefined
          if (!eventData.participantIds || eventData.participantIds.length === 0) {
            // Add all available characters as participants
            const updateData: any = {
              participantIds: characterIds,
              updatedAt: new Date()
            };

            await updateDoc(doc(db, 'events', eventDoc.id), updateData);
            
            eventsFixed++;
            participantsAdded += characterIds.length;
            
            console.log(`✅ Added ${characterIds.length} participants to "${eventName}"`);
          } else {
            console.log(`ℹ️ Event "${eventName}" already has participants`);
          }
        }
      }

      // Also fix any events with undefined participants
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventName = eventData.name || eventData.title || 'Unnamed Event';

        // Check if participantIds contains undefined values
        if (eventData.participantIds && eventData.participantIds.includes(undefined)) {
          console.log(`🔧 Fixing undefined participants in: ${eventName}`);

          // Filter out undefined values and add real character IDs if needed
          const validParticipants = eventData.participantIds.filter((id: any) => id !== undefined && id !== null);
          
          // If no valid participants, add all characters
          const finalParticipants = validParticipants.length > 0 ? validParticipants : characterIds;

          const updateData: any = {
            participantIds: finalParticipants,
            updatedAt: new Date()
          };

          await updateDoc(doc(db, 'events', eventDoc.id), updateData);
          
          eventsFixed++;
          participantsAdded += finalParticipants.length - validParticipants.length;
          
          console.log(`✅ Fixed undefined participants in "${eventName}"`);
        }
      }

      console.log(`🎉 Participant fix completed! Fixed ${eventsFixed} events, added ${participantsAdded} participant references`);

      return {
        success: true,
        eventsFixed,
        participantsAdded
      };

    } catch (error) {
      console.error('❌ Error fixing timeline participants:', error);
      return {
        success: false,
        eventsFixed: 0,
        participantsAdded: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create default characters if none exist
   */
  async createDefaultCharacters(campaignId: string, worldId: string): Promise<string[]> {
    try {
      const charactersRef = collection(db, 'characters');
      
      const defaultCharacters = [
        {
          name: 'Aria Moonwhisper',
          characterType: 'PC',
          race: 'Elf',
          class: 'Ranger',
          level: 3,
          campaignId,
          worldId,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['player-character', 'elf', 'ranger']
        },
        {
          name: 'Thorin Ironforge',
          characterType: 'PC', 
          race: 'Dwarf',
          class: 'Fighter',
          level: 3,
          campaignId,
          worldId,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['player-character', 'dwarf', 'fighter']
        },
        {
          name: 'Zara Shadowstep',
          characterType: 'PC',
          race: 'Human',
          class: 'Rogue',
          level: 3,
          campaignId,
          worldId,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['player-character', 'human', 'rogue']
        }
      ];

      const characterIds: string[] = [];
      
      for (const character of defaultCharacters) {
        const docRef = await addDoc(charactersRef, character);
        characterIds.push(docRef.id);
        console.log(`✅ Created default character: ${character.name}`);
      }

      return characterIds;

    } catch (error) {
      console.error('❌ Error creating default characters:', error);
      return [];
    }
  }
}

// Export singleton instance
export const timelineParticipantFixer = new TimelineParticipantFixer();
