import axios, { AxiosInstance } from 'axios';
import { Location } from '../location.service';
import { handleApiError } from '../../utils/error-handler';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';

/**
 * Location API Service
 * Handles communication with the backend API for location operations
 */
export class LocationAPIService {
  private apiClient: AxiosInstance;
  
  /**
   * Create a new LocationAPIService
   */
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.LOCATIONS}`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: API_CONFIG.TIMEOUT
    });
    
    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  /**
   * Get all locations
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of locations
   */
  async getAllLocations(worldId: string, campaignId: string): Promise<Location[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId 
        }
      });
      return this.transformLocationsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch locations');
    }
  }
  
  /**
   * Get location by ID
   * @param id Location ID
   * @returns Promise with location
   */
  async getLocation(id: string): Promise<Location> {
    try {
      const response = await this.apiClient.get(`/${id}`);
      return this.transformLocationFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch location');
    }
  }
  
  /**
   * Create location
   * @param location Location data
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with created location
   */
  async createLocation(
    location: Omit<Location, 'id'>, 
    worldId: string, 
    campaignId: string
  ): Promise<Location> {
    try {
      const apiLocation = this.transformLocationToAPI(location, worldId, campaignId);
      const response = await this.apiClient.post('/', apiLocation);
      return this.transformLocationFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to create location');
    }
  }
  
  /**
   * Update location
   * @param id Location ID
   * @param location Location data
   * @returns Promise with updated location
   */
  async updateLocation(id: string, location: Partial<Location>): Promise<Location> {
    try {
      const apiLocation = this.transformPartialLocationToAPI(location);
      const response = await this.apiClient.put(`/${id}`, apiLocation);
      return this.transformLocationFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to update location');
    }
  }
  
  /**
   * Delete location
   * @param id Location ID
   * @returns Promise with success status
   */
  async deleteLocation(id: string): Promise<boolean> {
    try {
      const response = await this.apiClient.delete(`/${id}`);
      return response.data.success;
    } catch (error) {
      throw handleApiError(error, 'Failed to delete location');
    }
  }

  /**
   * Get locations by parent
   * @param parentId Parent location ID
   * @returns Promise with array of locations
   */
  async getLocationsByParent(parentId: string): Promise<Location[]> {
    try {
      const response = await this.apiClient.get(`/parent/${parentId}`);
      return this.transformLocationsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch locations by parent');
    }
  }

  /**
   * Transform location from API format to application format
   * @param apiLocation Location in API format
   * @returns Location in application format
   */
  private transformLocationFromAPI(apiLocation: any): Location {
    return {
      id: apiLocation.id,
      name: apiLocation.name,
      description: apiLocation.description || '',
      locationType: apiLocation.location_type || '',
      parentLocationId: apiLocation.parent_location_id || null,
      parentLocation: apiLocation.parent_location ? {
        id: apiLocation.parent_location.id,
        name: apiLocation.parent_location.name,
        type: apiLocation.parent_location.location_type
      } : undefined,
      coordinates: apiLocation.coordinates || null,
      mapURL: apiLocation.map_url || '',
      imageURL: apiLocation.image_url || '',
      population: apiLocation.population || null,
      climate: apiLocation.climate || '',
      government: apiLocation.government || '',
      economy: apiLocation.economy || '',
      culture: apiLocation.culture || '',
      history: apiLocation.history || '',
      pointsOfInterest: apiLocation.points_of_interest || [],
      notableNPCs: apiLocation.notable_npcs || [],
      status: apiLocation.status || 'active',
      createdAt: apiLocation.created_at ? new Date(apiLocation.created_at) : new Date(),
      updatedAt: apiLocation.updated_at ? new Date(apiLocation.updated_at) : new Date(),
      createdBy: apiLocation.created_by || '',
      worldId: apiLocation.world_id || '',
      campaignId: apiLocation.campaign_id || ''
    };
  }

  /**
   * Transform locations from API format to application format
   * @param apiLocations Locations in API format
   * @returns Locations in application format
   */
  private transformLocationsFromAPI(apiLocations: any[]): Location[] {
    return apiLocations.map(apiLocation => this.transformLocationFromAPI(apiLocation));
  }

  /**
   * Transform location to API format
   * @param location Location in application format
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Location in API format
   */
  private transformLocationToAPI(
    location: Omit<Location, 'id'>, 
    worldId: string, 
    campaignId: string
  ): any {
    return {
      name: location.name,
      description: location.description,
      location_type: location.locationType,
      parent_location_id: location.parentLocationId,
      coordinates: location.coordinates,
      map_url: location.mapURL,
      image_url: location.imageURL,
      population: location.population,
      climate: location.climate,
      government: location.government,
      economy: location.economy,
      culture: location.culture,
      history: location.history,
      points_of_interest: location.pointsOfInterest,
      notable_npcs: location.notableNPCs,
      status: location.status,
      world_id: worldId,
      campaign_id: campaignId
    };
  }

  /**
   * Transform partial location to API format
   * @param location Partial location in application format
   * @returns Partial location in API format
   */
  private transformPartialLocationToAPI(location: Partial<Location>): any {
    const apiLocation: any = {};
    
    if (location.name !== undefined) apiLocation.name = location.name;
    if (location.description !== undefined) apiLocation.description = location.description;
    if (location.locationType !== undefined) apiLocation.location_type = location.locationType;
    if (location.parentLocationId !== undefined) apiLocation.parent_location_id = location.parentLocationId;
    if (location.coordinates !== undefined) apiLocation.coordinates = location.coordinates;
    if (location.mapURL !== undefined) apiLocation.map_url = location.mapURL;
    if (location.imageURL !== undefined) apiLocation.image_url = location.imageURL;
    if (location.population !== undefined) apiLocation.population = location.population;
    if (location.climate !== undefined) apiLocation.climate = location.climate;
    if (location.government !== undefined) apiLocation.government = location.government;
    if (location.economy !== undefined) apiLocation.economy = location.economy;
    if (location.culture !== undefined) apiLocation.culture = location.culture;
    if (location.history !== undefined) apiLocation.history = location.history;
    if (location.pointsOfInterest !== undefined) apiLocation.points_of_interest = location.pointsOfInterest;
    if (location.notableNPCs !== undefined) apiLocation.notable_npcs = location.notableNPCs;
    if (location.status !== undefined) apiLocation.status = location.status;
    
    return apiLocation;
  }
}
