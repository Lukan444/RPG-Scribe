/**
 * API Configuration
 * 
 * This file contains configuration for API connections.
 * It defines endpoints, timeouts, and other API-related settings.
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  /**
   * Base URL for API requests
   */
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  
  /**
   * Request timeout in milliseconds
   */
  TIMEOUT: 30000, // 30 seconds
  
  /**
   * Whether to use the API (true) or Firestore directly (false)
   */
  USE_API: process.env.REACT_APP_USE_API === 'true' || false,
  
  /**
   * Whether to enable API request caching
   */
  ENABLE_CACHE: true,
  
  /**
   * Cache TTL in milliseconds
   */
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  /**
   * Maximum number of retries for failed requests
   */
  MAX_RETRIES: 3,
  
  /**
   * Retry delay in milliseconds
   */
  RETRY_DELAY: 1000, // 1 second
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  /**
   * Authentication endpoints
   */
  AUTH: {
    /**
     * Login endpoint
     */
    LOGIN: '/auth/login',
    
    /**
     * Register endpoint
     */
    REGISTER: '/auth/register',
    
    /**
     * Logout endpoint
     */
    LOGOUT: '/auth/logout',
    
    /**
     * Refresh token endpoint
     */
    REFRESH_TOKEN: '/auth/refresh-token',
    
    /**
     * Reset password endpoint
     */
    RESET_PASSWORD: '/auth/reset-password',
    
    /**
     * Verify email endpoint
     */
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  /**
   * User endpoints
   */
  USERS: '/users',
  
  /**
   * World endpoints
   */
  WORLDS: '/worlds',
  
  /**
   * Campaign endpoints
   */
  CAMPAIGNS: '/campaigns',
  
  /**
   * Character endpoints
   */
  CHARACTERS: '/characters',
  
  /**
   * Location endpoints
   */
  LOCATIONS: '/locations',
  
  /**
   * Item endpoints
   */
  ITEMS: '/items',
  
  /**
   * Event endpoints
   */
  EVENTS: '/events',
  
  /**
   * Relationship endpoints
   */
  RELATIONSHIPS: '/relationships',
  
  /**
   * Note endpoints
   */
  NOTES: '/notes',
  
  /**
   * File upload endpoint
   */
  UPLOAD: '/upload',
};

export default { API_CONFIG, API_ENDPOINTS };
