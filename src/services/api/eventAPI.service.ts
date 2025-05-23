import axios, { AxiosInstance } from 'axios';
import { Event } from '../event.service';
import { handleApiError } from '../../utils/error-handler';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';

/**
 * Event API Service
 * Handles communication with the backend API for event operations
 */
export class EventAPIService {
  private apiClient: AxiosInstance;
  
  /**
   * Create a new EventAPIService
   */
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EVENTS}`,
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
   * Get all events
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of events
   */
  async getAllEvents(worldId: string, campaignId: string): Promise<Event[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId 
        }
      });
      return this.transformEventsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch events');
    }
  }
  
  /**
   * Get event by ID
   * @param id Event ID
   * @returns Promise with event
   */
  async getEvent(id: string): Promise<Event> {
    try {
      const response = await this.apiClient.get(`/${id}`);
      return this.transformEventFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch event');
    }
  }
  
  /**
   * Create event
   * @param event Event data
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with created event
   */
  async createEvent(
    event: Omit<Event, 'id'>, 
    worldId: string, 
    campaignId: string
  ): Promise<Event> {
    try {
      const apiEvent = this.transformEventToAPI(event, worldId, campaignId);
      const response = await this.apiClient.post('/', apiEvent);
      return this.transformEventFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to create event');
    }
  }
  
  /**
   * Update event
   * @param id Event ID
   * @param event Event data
   * @returns Promise with updated event
   */
  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    try {
      const apiEvent = this.transformPartialEventToAPI(event);
      const response = await this.apiClient.put(`/${id}`, apiEvent);
      return this.transformEventFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to update event');
    }
  }
  
  /**
   * Delete event
   * @param id Event ID
   * @returns Promise with success status
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const response = await this.apiClient.delete(`/${id}`);
      return response.data.success;
    } catch (error) {
      throw handleApiError(error, 'Failed to delete event');
    }
  }

  /**
   * Get events by type
   * @param type Event type
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of events
   */
  async getEventsByType(type: string, worldId: string, campaignId: string): Promise<Event[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId,
          event_type: type
        }
      });
      return this.transformEventsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch events by type');
    }
  }

  /**
   * Get events by session
   * @param sessionId Session ID
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of events
   */
  async getEventsBySession(sessionId: string, worldId: string, campaignId: string): Promise<Event[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: { 
          world_id: worldId, 
          campaign_id: campaignId,
          session_id: sessionId
        }
      });
      return this.transformEventsFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch events by session');
    }
  }

  /**
   * Transform event from API format to application format
   * @param apiEvent Event in API format
   * @returns Event in application format
   */
  private transformEventFromAPI(apiEvent: any): Event {
    return {
      id: apiEvent.id,
      name: apiEvent.name,
      description: apiEvent.description || '',
      date: apiEvent.date ? new Date(apiEvent.date) : new Date(),
      importance: apiEvent.importance || 1,
      type: apiEvent.event_type || '',
      outcome: apiEvent.outcome || '',
      isSecret: apiEvent.is_secret || false,
      locationId: apiEvent.location_id || undefined,
      location: apiEvent.location ? {
        id: apiEvent.location.id,
        name: apiEvent.location.name,
        type: apiEvent.location.type
      } : undefined,
      sessionId: apiEvent.session_id || undefined,
      session: apiEvent.session ? {
        id: apiEvent.session.id,
        title: apiEvent.session.title,
        number: apiEvent.session.number
      } : undefined,
      participants: apiEvent.participants || [],
      createdAt: apiEvent.created_at ? new Date(apiEvent.created_at) : new Date(),
      updatedAt: apiEvent.updated_at ? new Date(apiEvent.updated_at) : new Date(),
      createdBy: apiEvent.created_by || '',
      worldId: apiEvent.world_id || '',
      campaignId: apiEvent.campaign_id || ''
    };
  }

  /**
   * Transform events from API format to application format
   * @param apiEvents Events in API format
   * @returns Events in application format
   */
  private transformEventsFromAPI(apiEvents: any[]): Event[] {
    return apiEvents.map(apiEvent => this.transformEventFromAPI(apiEvent));
  }

  /**
   * Transform event to API format
   * @param event Event in application format
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Event in API format
   */
  private transformEventToAPI(
    event: Omit<Event, 'id'>, 
    worldId: string, 
    campaignId: string
  ): any {
    return {
      name: event.name,
      description: event.description,
      date: event.date,
      importance: event.importance,
      event_type: event.type,
      outcome: event.outcome,
      is_secret: event.isSecret,
      location_id: event.locationId,
      session_id: event.sessionId,
      participants: event.participants,
      world_id: worldId,
      campaign_id: campaignId
    };
  }

  /**
   * Transform partial event to API format
   * @param event Partial event in application format
   * @returns Partial event in API format
   */
  private transformPartialEventToAPI(event: Partial<Event>): any {
    const apiEvent: any = {};
    
    if (event.name !== undefined) apiEvent.name = event.name;
    if (event.description !== undefined) apiEvent.description = event.description;
    if (event.date !== undefined) apiEvent.date = event.date;
    if (event.importance !== undefined) apiEvent.importance = event.importance;
    if (event.type !== undefined) apiEvent.event_type = event.type;
    if (event.outcome !== undefined) apiEvent.outcome = event.outcome;
    if (event.isSecret !== undefined) apiEvent.is_secret = event.isSecret;
    if (event.locationId !== undefined) apiEvent.location_id = event.locationId;
    if (event.sessionId !== undefined) apiEvent.session_id = event.sessionId;
    if (event.participants !== undefined) apiEvent.participants = event.participants;
    
    return apiEvent;
  }
}
