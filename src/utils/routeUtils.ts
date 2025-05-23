/**
 * Route Utilities
 * Helper functions for working with routes and route parameters
 */

/**
 * Get the campaign ID from the route params or use a default value
 * @param params Route parameters object that might contain a campaignId
 * @param defaultCampaignId Default campaign ID to use if not found in params
 * @returns The campaign ID from params or the default value
 */
export const getCampaignIdFromParams = (
  params: { campaignId?: string } | undefined, 
  defaultCampaignId: string = 'default-campaign'
): string => {
  return params?.campaignId || defaultCampaignId;
};

/**
 * Get the world ID from the route params
 * @param params Route parameters object that might contain a worldId
 * @param defaultWorldId Default world ID to use if not found in params
 * @returns The world ID from params or the default value
 */
export const getWorldIdFromParams = (
  params: { worldId?: string } | undefined, 
  defaultWorldId: string = ''
): string => {
  return params?.worldId || defaultWorldId;
};

/**
 * Build a route path for an entity within an RPG world
 * @param worldId The RPG world ID
 * @param entityType The type of entity (e.g., 'characters', 'locations')
 * @param entityId Optional entity ID for specific entity routes
 * @param action Optional action (e.g., 'edit', 'new')
 * @returns The constructed route path
 */
export const buildEntityRoutePath = (
  worldId: string,
  entityType: string,
  entityId?: string,
  action?: string
): string => {
  let path = `/rpg-worlds/${worldId}/${entityType}`;
  
  if (entityId) {
    path += `/${entityId}`;
    
    if (action) {
      path += `/${action}`;
    }
  } else if (action === 'new') {
    path += '/new';
  }
  
  return path;
};
