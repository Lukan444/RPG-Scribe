import { describe, it, expect, vi } from 'vitest';
import { RelationshipVisualizationService } from '../../services/relationshipVisualization.service';

vi.mock('../../services/relationshipQuery.service', () => {
  return {
    RelationshipQueryService: class {
      constructor(_campaignId: string) {}
      async getRelationshipGraphData() {
        return {
          nodes: [
            { id: 'char1', type: 'CHARACTER', label: 'char1' },
            { id: 'loc1', type: 'LOCATION', label: 'loc1' }
          ],
          edges: [
            { source: 'char1', target: 'loc1', type: 'character-location', subtype: 'visited' }
          ]
        };
      }
      async getRelatedEntities() { return []; }
    }
  };
});

vi.mock('../../services/character.service', () => {
  return {
    CharacterService: {
      getInstance: vi.fn(() => ({
        getById: vi.fn(async (id: string) => ({ id, name: 'Alice' }))
      }))
    }
  };
});

vi.mock('../../services/location.service', () => {
  return {
    LocationService: {
      getInstance: vi.fn(() => ({
        getById: vi.fn(async (id: string) => ({ id, name: 'Town' }))
      }))
    }
  };
});

describe('RelationshipVisualizationService', () => {
  it('should include display names for nodes', async () => {
    const service = new RelationshipVisualizationService('camp1');
    const data = await service.getVisualizationData();
    const charNode = data.nodes.find(n => n.id === 'char1');
    const locNode = data.nodes.find(n => n.id === 'loc1');
    expect(charNode?.label).toBe('Alice');
    expect(locNode?.label).toBe('Town');
  });
});
