import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithMantine, flushPromises } from '../../tests/vitest-utils/test-utils';
import { TimelineProvider, useTimeline } from '../TimelineContext';
import { TimelineService } from '../../services/timeline.service';

function TestComponent({ action }: { action: any }) {
  const { actions, state } = useTimeline();
  React.useEffect(() => {
    action(actions);
  }, [actions, action]);
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

    renderWithMantine(<TestComponent action={action} />, { wrapper: getWrapper(mockService) });
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

    renderWithMantine(<TestComponent action={action} />, { wrapper: getWrapper(mockService) });
    await flushPromises();

    expect(document.querySelector('[data-testid="count"]')?.textContent).toBe('0');
  });

  it('rolls back update when service fails', async () => {
    const mockService = {
      createTimelineEntry: vi.fn().mockResolvedValue('id-1'),
      updateTimelineEntry: vi.fn().mockRejectedValue(new Error('fail')),
      deleteTimelineEntry: vi.fn()
    } as unknown as TimelineService;

    const action = async (actions: any) => {
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
      const id = 'id-1';
      try {
        await actions.updateEvent(id, { title: 'Updated' });
      } catch {}
    };

    renderWithMantine(<TestComponent action={action} />, { wrapper: getWrapper(mockService) });
    await flushPromises();

    expect(mockService.updateTimelineEntry).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="title"]')?.textContent).toBe('Orig');
  });

  it('rolls back delete when service fails', async () => {
    const mockService = {
      createTimelineEntry: vi.fn().mockResolvedValue('id-1'),
      updateTimelineEntry: vi.fn(),
      deleteTimelineEntry: vi.fn().mockRejectedValue(new Error('fail'))
    } as unknown as TimelineService;

    const action = async (actions: any) => {
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
      try {
        await actions.deleteEvent('id-1');
      } catch {}
    };

    renderWithMantine(<TestComponent action={action} />, { wrapper: getWrapper(mockService) });
    await flushPromises();

    expect(mockService.deleteTimelineEntry).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="count"]')?.textContent).toBe('1');
  });
});
