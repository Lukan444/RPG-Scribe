/**
 * MSW Server Setup for Vitest
 *
 * This file provides a setup for the Mock Service Worker (MSW) server for Vitest tests.
 * It includes common handlers for API requests and utilities for setting up the server.
 */
import { setupServer } from 'msw/node';
import { http } from 'msw'; // Updated from 'rest' to 'http' for MSW v2
import { beforeAll, afterAll, afterEach } from 'vitest';

// Define a mock API_CONFIG for testing
const API_CONFIG = {
  BASE_URL: 'http://localhost:4000/api',
  TIMEOUT: 30000,
  USE_API: false,
  ENABLE_CACHE: true,
  CACHE_TTL: 300000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// Mock character data
export const mockCharacters = [
  {
    id: 'char-1',
    name: 'Gandalf',
    description: 'A wise wizard',
    race: 'Maiar',
    class: 'Wizard',
    type: 'NPC',
    status: 'alive',
    created_by: 'user-1',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    world_id: 'world-1',
    campaign_id: 'campaign-1'
  },
  {
    id: 'char-2',
    name: 'Frodo',
    description: 'A brave hobbit',
    race: 'Hobbit',
    class: 'Rogue',
    type: 'PC',
    status: 'alive',
    created_by: 'user-1',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    world_id: 'world-1',
    campaign_id: 'campaign-1'
  }
];

// Default handlers for common API requests
export const defaultHandlers = [
  // Characters
  http.get(`${API_CONFIG.BASE_URL}/characters`, () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: mockCharacters
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),

  http.get(`${API_CONFIG.BASE_URL}/characters/:id`, ({ params }) => {
    const id = params.id;

    const character = mockCharacters.find(char => char.id === id);

    if (character) {
      return new Response(
        JSON.stringify({
          success: true,
          data: character
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Character not found'
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),

  http.post(`${API_CONFIG.BASE_URL}/characters`, async ({ request }) => {
    const requestBody = await request.json() as Record<string, any>;
    const newCharacter = {
      id: 'char-3',
      ...requestBody,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: newCharacter
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),

  http.put(`${API_CONFIG.BASE_URL}/characters/:id`, async ({ params, request }) => {
    const id = params.id;
    const requestBody = await request.json() as Record<string, any>;

    const characterIndex = mockCharacters.findIndex(char => char.id === id);

    if (characterIndex !== -1) {
      const updatedCharacter = {
        ...mockCharacters[characterIndex],
        ...requestBody,
        updated_at: new Date().toISOString()
      };

      mockCharacters[characterIndex] = updatedCharacter;

      return new Response(
        JSON.stringify({
          success: true,
          data: updatedCharacter
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Character not found'
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),

  http.delete(`${API_CONFIG.BASE_URL}/characters/:id`, ({ params }) => {
    const id = params.id;

    const characterIndex = mockCharacters.findIndex(char => char.id === id);

    if (characterIndex !== -1) {
      mockCharacters.splice(characterIndex, 1);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Character deleted successfully'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Character not found'
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  })
];

// Create server with default handlers
export const server = setupServer(...defaultHandlers);

// Setup function for tests
export function setupMockServer() {
  // Start server before all tests
  beforeAll(() => server.listen());

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Close server after all tests
  afterAll(() => server.close());

  return server;
}

export default { server, setupMockServer, defaultHandlers, mockCharacters };
