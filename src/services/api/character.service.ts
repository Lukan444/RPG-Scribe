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
import { Character, CharacterCreationParams, CharacterUpdateParams, CharacterType } from '../../models/Character';

/**
 * Character service for API operations
 */
export class CharacterService {
  private campaignId: string;

  /**
   * Create a new CharacterService
   * @param campaignId Campaign ID
   */
  constructor(campaignId: string) {
    this.campaignId = campaignId;
  }

  /**
   * Get all characters for a campaign
   * @returns Promise with array of characters
   */
  async getAllCharacters(): Promise<Character[]> {
    try {
      const charactersRef = collection(db, `campaigns/${this.campaignId}/characters`);
      const q = query(charactersRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatCharacter({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting characters:', error);
      throw error;
    }
  }

  /**
   * Get character by ID
   * @param id Character ID
   * @returns Promise with character or null
   */
  async getCharacterById(id: string): Promise<Character | null> {
    try {
      const characterRef = doc(db, `campaigns/${this.campaignId}/characters`, id);
      const characterSnap = await getDoc(characterRef);
      
      if (characterSnap.exists()) {
        const data = characterSnap.data();
        return this.formatCharacter({ id: characterSnap.id, ...data });
      }
      
      return null;
    } catch (error) {
      console.error('Error getting character:', error);
      throw error;
    }
  }

  /**
   * Get characters by type
   * @param type Character type
   * @returns Promise with array of characters
   */
  async getCharactersByType(type: CharacterType): Promise<Character[]> {
    try {
      const charactersRef = collection(db, `campaigns/${this.campaignId}/characters`);
      const q = query(
        charactersRef, 
        where('characterType', '==', type),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatCharacter({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting characters by type:', error);
      throw error;
    }
  }

  /**
   * Create a new character
   * @param character Character creation parameters
   * @returns Promise with created character
   */
  async createCharacter(character: CharacterCreationParams): Promise<Character> {
    try {
      const charactersRef = collection(db, `campaigns/${this.campaignId}/characters`);
      
      const newCharacter = {
        ...character,
        campaignId: this.campaignId,
        characterType: character.characterType || CharacterType.NPC,
        isPlayerCharacter: character.isPlayerCharacter || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(charactersRef, newCharacter);
      
      return {
        id: docRef.id,
        ...newCharacter,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Character;
    } catch (error) {
      console.error('Error creating character:', error);
      throw error;
    }
  }

  /**
   * Update a character
   * @param id Character ID
   * @param updates Character update parameters
   * @returns Promise with updated character
   */
  async updateCharacter(id: string, updates: CharacterUpdateParams): Promise<Character> {
    try {
      const characterRef = doc(db, `campaigns/${this.campaignId}/characters`, id);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(characterRef, updateData);
      
      const updatedCharacter = await this.getCharacterById(id);
      if (!updatedCharacter) {
        throw new Error('Character not found after update');
      }
      
      return updatedCharacter;
    } catch (error) {
      console.error('Error updating character:', error);
      throw error;
    }
  }

  /**
   * Delete a character
   * @param id Character ID
   * @returns Promise<void>
   */
  async deleteCharacter(id: string): Promise<void> {
    try {
      const characterRef = doc(db, `campaigns/${this.campaignId}/characters`, id);
      await deleteDoc(characterRef);
    } catch (error) {
      console.error('Error deleting character:', error);
      throw error;
    }
  }

  /**
   * Format character data from Firestore
   * @param data Firestore data
   * @returns Formatted character
   */
  private formatCharacter(data: any): Character {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
    };
  }
}
