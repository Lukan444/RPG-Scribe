import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithMantine, flushPromises } from '../../tests/vitest-utils/test-utils';
import { TimelineProvider, useTimeline } from '../TimelineContext';
import { TimelineService } from '../../services/timeline.service';

function TestComponent({ action }: { action: any }) {
  const { actions, state } = useTimeline();
  React.useEffect(() => {
    action(actions, state);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <span data-testid="count">{state.events.length}</span>
      {state.events.map(e => (
        <span key={e.id} data-testid="title">{e.title}</span>
      ))}
    </div>
  );
}

function getWrapper(service: TimelineService) {
  return ({ children }: { children: React.ReactNode }) => (
    <TimelineProvider initialConfig={{ worldId: 'w1', campaignId: 'c1' }} timelineService={service}>
      {children}
    </TimelineProvider>
  );
}

describe('TimelineContext integration', () => {
  it('creates event and persists when service succeeds', async () => {
    const mockService = {
      createTimelineEntry: vi.fn().mockResolvedValue('id-1'),
      updateTimelineEntry: vi.fn().mockResolvedValue(true),
      deleteTimelineEntry: vi.fn().mockResolvedValue(true)
    } as unknown as TimelineService;

    const action = async (actions: any) => {
      await actions.createEvent({
        title: 'Test',
        startDate: new Date(),
        importance: 5,
        eventType: 'custom',
        worldId: 'w1',
        campaignId: 'c1',
        playerVisible: true
      });
    };

    const Wrapper = getWrapper(mockService);
    renderWithMantine(<Wrapper><TestComponent action={action} /></Wrapper>);
    await flushPromises();

    expect(mockService.createTimelineEntry).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="count"]')?.textContent).toBe('1');
  });

  it('rolls back create when service fails', async () => {
    const mockService = {
      createTimelineEntry: vi.fn().mockRejectedValue(new Error('fail')),
      updateTimelineEntry: vi.fn(),
      deleteTimelineEntry: vi.fn()
    } as unknown as TimelineService;

    const action = async (actions: any) => {
      try {
        await actions.createEvent({
          title: 'Fail',
          startDate: new Date(),
          importance: 5,
          eventType: 'custom',
          worldId: 'w1',
          campaignId: 'c1',
          playerVisible: true
        });
      } catch {}
    };

    const Wrapper = getWrapper(mockService);
    renderWithMantine(<Wrapper><TestComponent action={action} /></Wrapper>);
    await flushPromises();

    expect(document.querySelector('[data-testid="count"]')?.textContent).toBe('0');
  });

  it('rolls back update when service fails', async () => {
    const mockService = {
      createTimelineEntry: vi.fn().mockResolvedValue('id-1'),
      updateTimelineEntry: vi.fn().mockRejectedValue(new Error('fail')),
      deleteTimelineEntry: vi.fn()
    } as unknown as TimelineService;

    const action = async (actions: any, state: any) => {
      await actions.createEvent({
        title: 'Orig',
        startDate: new Date(),
        importance: 5,
        eventType: 'custom',
        worldId: 'w1',
        campaignId: 'c1',
        playerVisible: true
      });
      await flushPromises();
      // Get the actual event ID from the state (should be the temporary ID that gets updated)
      const eventId = state.events[0]?.id || 'id-1';
      try {
        await actions.updateEvent(eventId, { title: 'Updated' });
      } catch {}
    };

    const Wrapper = getWrapper(mockService);
    renderWithMantine(<Wrapper><TestComponent action={action} /></Wrapper>);
    await flushPromises();

    // Verify rollback behavior - title should remain 'Orig' after failed update
    expect(document.querySelector('[data-testid="title"]')?.textContent).toBe('Orig');
  });

  it('rolls back delete when service fails', async () => {
    const mockService = {
      createTimelineEntry: vi.fn().mockResolvedValue('id-1'),
      updateTimelineEntry: vi.fn(),
      deleteTimelineEntry: vi.fn().mockRejectedValue(new Error('fail'))
    } as unknown as TimelineService;

    const action = async (actions: any, state: any) => {
      await actions.createEvent({
        title: 'ToDelete',
        startDate: new Date(),
        importance: 5,
        eventType: 'custom',
        worldId: 'w1',
        campaignId: 'c1',
        playerVisible: true
      });
      await flushPromises();
      // Get the actual event ID from the state
      const eventId = state.events[0]?.id || 'id-1';
      try {
        await actions.deleteEvent(eventId);
      } catch {}
    };

    const Wrapper = getWrapper(mockService);
    renderWithMantine(<Wrapper><TestComponent action={action} /></Wrapper>);
    await flushPromises();

    // Verify rollback behavior - count should remain '1' after failed delete
    expect(document.querySelector('[data-testid="count"]')?.textContent).toBe('1');
  });
});
