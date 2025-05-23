import axios, { AxiosInstance } from 'axios';
import { Item } from '../item.service';
import { handleApiError } from '../../utils/error-handler';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';

/**
 * Item API Service
 * Handles communication with the backend API for item operations
 */
export class ItemAPIService {
  private apiClient: AxiosInstance;
  
  /**
   * Create a new ItemAPIService
   */
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ITEMS}`,
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
   * Get all items
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of items
   */
  async getAllItems(worldId: string, campaignId: string): Promise<Item[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId 
        }
      });
      return this.transformItemsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch items');
    }
  }
  
  /**
   * Get item by ID
   * @param id Item ID
   * @returns Promise with item
   */
  async getItem(id: string): Promise<Item> {
    try {
      const response = await this.apiClient.get(`/${id}`);
      return this.transformItemFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch item');
    }
  }
  
  /**
   * Create item
   * @param item Item data
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with created item
   */
  async createItem(
    item: Omit<Item, 'id'>, 
    worldId: string, 
    campaignId: string
  ): Promise<Item> {
    try {
      const apiItem = this.transformItemToAPI(item, worldId, campaignId);
      const response = await this.apiClient.post('/', apiItem);
      return this.transformItemFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to create item');
    }
  }
  
  /**
   * Update item
   * @param id Item ID
   * @param item Item data
   * @returns Promise with updated item
   */
  async updateItem(id: string, item: Partial<Item>): Promise<Item> {
    try {
      const apiItem = this.transformPartialItemToAPI(item);
      const response = await this.apiClient.put(`/${id}`, apiItem);
      return this.transformItemFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to update item');
    }
  }
  
  /**
   * Delete item
   * @param id Item ID
   * @returns Promise with success status
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      const response = await this.apiClient.delete(`/${id}`);
      return response.data.success;
    } catch (error) {
      throw handleApiError(error, 'Failed to delete item');
    }
  }

  /**
   * Get items by type
   * @param type Item type
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of items
   */
  async getItemsByType(type: string, worldId: string, campaignId: string): Promise<Item[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId,
          item_type: type
        }
      });
      return this.transformItemsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch items by type');
    }
  }

  /**
   * Get items by rarity
   * @param rarity Item rarity
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of items
   */
  async getItemsByRarity(rarity: string, worldId: string, campaignId: string): Promise<Item[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId,
          rarity: rarity
        }
      });
      return this.transformItemsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch items by rarity');
    }
  }

  /**
   * Transform item from API format to application format
   * @param apiItem Item in API format
   * @returns Item in application format
   */
  private transformItemFromAPI(apiItem: any): Item {
    return {
      id: apiItem.id,
      name: apiItem.name,
      description: apiItem.description || '',
      type: apiItem.item_type || '',
      rarity: apiItem.rarity || 'common',
      attunement: apiItem.attunement || false,
      properties: apiItem.properties || {},
      imageURL: apiItem.image_url || '',
      currentOwnerId: apiItem.current_owner_id || '',
      ownerType: apiItem.owner_type || undefined,
      currentOwner: apiItem.current_owner ? {
        id: apiItem.current_owner.id,
        name: apiItem.current_owner.name,
        type: apiItem.current_owner.type
      } : undefined,
      createdAt: apiItem.created_at ? new Date(apiItem.created_at) : new Date(),
      updatedAt: apiItem.updated_at ? new Date(apiItem.updated_at) : new Date(),
      createdBy: apiItem.created_by || '',
      worldId: apiItem.world_id || '',
      campaignId: apiItem.campaign_id || ''
    };
  }

  /**
   * Transform items from API format to application format
   * @param apiItems Items in API format
   * @returns Items in application format
   */
  private transformItemsFromAPI(apiItems: any[]): Item[] {
    return apiItems.map(apiItem => this.transformItemFromAPI(apiItem));
  }

  /**
   * Transform item to API format
   * @param item Item in application format
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Item in API format
   */
  private transformItemToAPI(
    item: Omit<Item, 'id'>, 
    worldId: string, 
    campaignId: string
  ): any {
    return {
      name: item.name,
      description: item.description,
      item_type: item.type,
      rarity: item.rarity,
      attunement: item.attunement,
      properties: item.properties,
      image_url: item.imageURL,
      current_owner_id: item.currentOwnerId,
      owner_type: item.ownerType,
      world_id: worldId,
      campaign_id: campaignId
    };
  }

  /**
   * Transform partial item to API format
   * @param item Partial item in application format
   * @returns Partial item in API format
   */
  private transformPartialItemToAPI(item: Partial<Item>): any {
    const apiItem: any = {};
    
    if (item.name !== undefined) apiItem.name = item.name;
    if (item.description !== undefined) apiItem.description = item.description;
    if (item.type !== undefined) apiItem.item_type = item.type;
    if (item.rarity !== undefined) apiItem.rarity = item.rarity;
    if (item.attunement !== undefined) apiItem.attunement = item.attunement;
    if (item.properties !== undefined) apiItem.properties = item.properties;
    if (item.imageURL !== undefined) apiItem.image_url = item.imageURL;
    if (item.currentOwnerId !== undefined) apiItem.current_owner_id = item.currentOwnerId;
    if (item.ownerType !== undefined) apiItem.owner_type = item.ownerType;
    
    return apiItem;
  }
}
