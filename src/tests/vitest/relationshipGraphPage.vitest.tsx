import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, flushPromises } from '../vitest-utils/test-utils';
import RelationshipGraphPage from '../../components/relationships/RelationshipGraphPage';
import { EntityType } from '../../models/EntityType';
import RelationshipCountBadge from '../../components/relationships/badges/RelationshipCountBadge';

// Mock useParams from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ campaignId: 'test-campaign' })
  };
});

// Mock CampaignService
vi.mock('../../services/campaign.service', () => {
  return {
    CampaignService: class {
      async getById() {
        return { id: 'test-campaign', name: 'Test Campaign' };
      }
    }
  };
});

// Helper to track zoom level used by ForceGraph2D
let zoomLevel = 1;
const zoomMock = vi.fn((value?: number) => {
  if (value !== undefined) {
    zoomLevel = value;
  }
  return zoomLevel;
});

// Mock react-force-graph-2d to expose imperative API
vi.mock('react-force-graph-2d', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: React.Ref<any>) => {
      React.useImperativeHandle(ref, () => ({
        zoom: zoomMock,
        centerAt: vi.fn(),
        zoomToFit: vi.fn()
      }));
      return (
        <div data-testid="force-graph">
          nodes:{props.graphData.nodes.length}-edges:{props.graphData.edges.length}
        </div>
      );
    })
  };
});

// Mock RelationshipVisualizationService
vi.mock('../../services/relationshipVisualization.service', () => {
  return {
    RelationshipVisualizationService: class {
      async getVisualizationData(_ids: string[], types: string[]) {
        if (types.includes('character')) {
          return {
            nodes: [
              { id: 'n1', label: 'Hero', type: 'character' },
              { id: 'n2', label: 'Town', type: 'location' }
            ],
            edges: [{ id: 'e1', source: 'n1', target: 'n2', type: 'character-location', subtype: '' }]
          };
        }
        return { nodes: [], edges: [] };
      }
    }
  };
});

describe('RelationshipGraphPage', () => {
  beforeEach(() => {
    zoomMock.mockClear();
    zoomLevel = 1;
  });

  it('loads graph data and displays nodes and edges', async () => {
    renderWithProviders(<RelationshipGraphPage />);
    await flushPromises();
    expect(screen.getByTestId('force-graph')).toHaveTextContent('nodes:2-edges:1');
  });

  it('updates graph when entity type filter toggled', async () => {
    renderWithProviders(<RelationshipGraphPage />);
    await flushPromises();
    const checkbox = screen.getByLabelText('Character');
    fireEvent.click(checkbox);
    await flushPromises();
    expect(screen.getByTestId('force-graph')).toHaveTextContent('nodes:0-edges:0');
  });

  it('zoom controls call graph zoom methods', async () => {
    renderWithProviders(<RelationshipGraphPage />);
    await flushPromises();
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(zoomMock).toHaveBeenCalledWith(1.5, 500);
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(zoomMock).toHaveBeenCalledWith(1, 500);
  });
});

describe('RelationshipCountBadge accessibility', () => {
  it('includes aria-label describing relationship count', async () => {
    renderWithProviders(
      <RelationshipCountBadge count={3} entityId="1" entityType={EntityType.CHARACTER} />
    );
    const badge = screen.getByRole('button');
    expect(badge).toHaveAttribute('aria-label', '3 relationships for this character');
  });
});
