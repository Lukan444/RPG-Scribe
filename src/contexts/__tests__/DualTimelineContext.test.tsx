import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DualTimelineProvider, useDualTimeline } from '../DualTimelineContext';
import { createDefaultTimeConversion } from '../../services/timeConversion.service';

// Mock TimelineService to return deterministic data
vi.mock('../../services/timeline.service', () => {
  return {
    TimelineService: class {
      constructor() {}
      async getTimelineEntries() {
        return [
          {
            id: 'e1',
            title: 'Event 1',
            summary: 'First',
            dualTimestamp: { realWorldTime: new Date('2024-01-01T00:00:00Z'), inGameTime: new Date('2024-01-01T00:00:00Z') },
            associatedEntityId: 'a1',
            associatedEntityType: 'event',
            tags: ['tag'],
            participants: []
          },
          {
            id: 'e2',
            title: 'Event 2',
            summary: 'Second',
            dualTimestamp: { realWorldTime: new Date('2024-01-01T00:10:00Z'), inGameTime: new Date('2024-01-01T00:05:00Z') },
            associatedEntityId: 'a1',
            associatedEntityType: 'event',
            tags: [],
            participants: []
          }
        ];
      }
    }
  };
});

const config = {
  worldId: 'w1',
  campaignId: 'c1',
  displayMode: 'dual',
  syncOptions: { syncScrolling: true, syncZoom: true, syncSelection: true, showConnections: true },
  realWorldAxis: { id: 'real', label: 'Real', timeSystem: 'real-world', visible: true, height: 200, color: '#fff', groups: [] },
  inGameAxis: { id: 'game', label: 'Game', timeSystem: 'in-game', visible: true, height: 200, color: '#fff', groups: [] },
  timeConversion: createDefaultTimeConversion(24).getConfig(),
  showMarkers: false,
  showConflicts: true,
  enableEditing: false,
  height: 300,
  connectionStyle: 'lines',
  connectionOpacity: 0.5
};

function Wrapper() {
  const { state, actions, utils } = useDualTimeline();
  React.useEffect(() => {
    actions.loadEvents();
  }, [actions]);
  return (
    <div>
      <span data-testid="events">{state.events.length}</span>
      <button data-testid="detect" onClick={() => actions.detectConflicts()} />
      <span data-testid="conflicts">{state.conflicts.length}</span>
      <span data-testid="filterCount">{utils.filterEvents(state.events, { eventTypes: ['event'] }).length}</span>
    </div>
  );
}

describe('DualTimelineContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads events and detects conflicts', async () => {
    render(
      <DualTimelineProvider config={config as any}>
        <Wrapper />
      </DualTimelineProvider>
    );

    // wait for events to load
    await screen.findByText('2');

    // initially no conflicts
    expect(screen.getByTestId('conflicts').textContent).toBe('0');

    await act(async () => {
      screen.getByTestId('detect').click();
    });

    expect(screen.getByTestId('conflicts').textContent).toBe('1');
    expect(screen.getByTestId('filterCount').textContent).toBe('2');
  });
});
