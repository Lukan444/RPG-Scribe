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
import { Location, LocationCreationParams, LocationUpdateParams, LocationType } from '../../models/Location';

/**
 * Location service for API operations
 */
export class LocationService {
  private campaignId: string;

  /**
   * Create a new LocationService
   * @param campaignId Campaign ID
   */
  constructor(campaignId: string) {
    this.campaignId = campaignId;
  }

  /**
   * Get all locations for a campaign
   * @returns Promise with array of locations
   */
  async getAllLocations(): Promise<Location[]> {
    try {
      const locationsRef = collection(db, `campaigns/${this.campaignId}/locations`);
      const q = query(locationsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatLocation({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  /**
   * Get location by ID
   * @param id Location ID
   * @returns Promise with location or null
   */
  async getLocationById(id: string): Promise<Location | null> {
    try {
      const locationRef = doc(db, `campaigns/${this.campaignId}/locations`, id);
      const locationSnap = await getDoc(locationRef);
      
      if (locationSnap.exists()) {
        const data = locationSnap.data();
        return this.formatLocation({ id: locationSnap.id, ...data });
      }
      
      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  /**
   * Get locations by type
   * @param type Location type
   * @returns Promise with array of locations
   */
  async getLocationsByType(type: LocationType): Promise<Location[]> {
    try {
      const locationsRef = collection(db, `campaigns/${this.campaignId}/locations`);
      const q = query(
        locationsRef, 
        where('locationType', '==', type),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatLocation({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting locations by type:', error);
      throw error;
    }
  }

  /**
   * Get child locations
   * @param parentId Parent location ID
   * @returns Promise with array of locations
   */
  async getChildLocations(parentId: string): Promise<Location[]> {
    try {
      const locationsRef = collection(db, `campaigns/${this.campaignId}/locations`);
      const q = query(
        locationsRef, 
        where('parentLocationId', '==', parentId),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.formatLocation({ id: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error getting child locations:', error);
      throw error;
    }
  }

  /**
   * Create a new location
   * @param location Location creation parameters
   * @returns Promise with created location
   */
  async createLocation(location: LocationCreationParams): Promise<Location> {
    try {
      const locationsRef = collection(db, `campaigns/${this.campaignId}/locations`);
      
      const newLocation = {
        ...location,
        campaignId: this.campaignId,
        locationType: location.locationType || LocationType.OTHER,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(locationsRef, newLocation);
      
      return {
        id: docRef.id,
        ...newLocation,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Location;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  /**
   * Update a location
   * @param id Location ID
   * @param updates Location update parameters
   * @returns Promise with updated location
   */
  async updateLocation(id: string, updates: LocationUpdateParams): Promise<Location> {
    try {
      const locationRef = doc(db, `campaigns/${this.campaignId}/locations`, id);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(locationRef, updateData);
      
      const updatedLocation = await this.getLocationById(id);
      if (!updatedLocation) {
        throw new Error('Location not found after update');
      }
      
      return updatedLocation;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location
   * @param id Location ID
   * @returns Promise<void>
   */
  async deleteLocation(id: string): Promise<void> {
    try {
      const locationRef = doc(db, `campaigns/${this.campaignId}/locations`, id);
      await deleteDoc(locationRef);
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Format location data from Firestore
   * @param data Firestore data
   * @returns Formatted location
   */
  private formatLocation(data: any): Location {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
    };
  }
}
