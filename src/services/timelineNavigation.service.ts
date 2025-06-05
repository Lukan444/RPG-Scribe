/**
 * Timeline Navigation Service
 * Centralized service for timeline navigation and context management
 */

import { NavigateFunction } from 'react-router-dom';

export interface TimelineNavigationContext {
  /** Current world ID */
  worldId?: string;
  /** Current campaign ID */
  campaignId?: string;
  /** Current entity ID (character, session, etc.) */
  entityId?: string;
  /** Entity type for context */
  entityType?: 'character' | 'campaign' | 'session' | 'event' | 'location' | 'npc';
  /** Specific timeline focus */
  timelineFocus?: 'real-world' | 'in-game' | 'dual';
  /** Event ID to highlight */
  highlightEventId?: string;
}

export interface TimelineNavigationOptions {
  /** Open in new tab */
  newTab?: boolean;
  /** Display mode preference */
  displayMode?: 'dual' | 'real-world' | 'in-game';
  /** Enable editing mode */
  enableEditing?: boolean;
  /** Return URL for breadcrumb navigation */
  returnUrl?: string;
  /** Specific timeline focus */
  timelineFocus?: 'real-world' | 'in-game' | 'dual';
  /** Event ID to highlight */
  highlightEventId?: string;
}

/**
 * Timeline Navigation Service
 * Provides centralized navigation to timeline views with proper context
 */
export class TimelineNavigationService {
  private static instance: TimelineNavigationService;
  private navigate?: NavigateFunction;

  private constructor() {}

  public static getInstance(): TimelineNavigationService {
    if (!TimelineNavigationService.instance) {
      TimelineNavigationService.instance = new TimelineNavigationService();
    }
    return TimelineNavigationService.instance;
  }

  /**
   * Initialize the service with navigation function
   */
  public initialize(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  /**
   * Navigate to main timeline page with context
   */
  public navigateToTimeline(
    context: TimelineNavigationContext = {},
    options: TimelineNavigationOptions = {}
  ) {
    if (!this.navigate) {
      console.error('TimelineNavigationService not initialized');
      return;
    }

    const params = new URLSearchParams();
    
    // Add context parameters
    if (context.worldId) params.set('world', context.worldId);
    if (context.campaignId) params.set('campaign', context.campaignId);
    if (context.entityId) params.set('entity', context.entityId);
    if (context.entityType) params.set('entityType', context.entityType);
    if (context.highlightEventId) params.set('highlight', context.highlightEventId);
    
    // Add option parameters
    if (options.displayMode) params.set('mode', options.displayMode);
    if (options.enableEditing) params.set('edit', 'true');
    if (options.returnUrl) params.set('return', encodeURIComponent(options.returnUrl));

    const url = `/visualizations/timeline${params.toString() ? `?${params.toString()}` : ''}`;
    
    if (options.newTab) {
      window.open(url, '_blank');
    } else {
      this.navigate(url);
    }
  }

  /**
   * Navigate to timeline from entity detail page
   */
  public navigateFromEntity(
    entityType: TimelineNavigationContext['entityType'],
    entityId: string,
    context: Omit<TimelineNavigationContext, 'entityId' | 'entityType'> = {},
    options: TimelineNavigationOptions = {}
  ) {
    this.navigateToTimeline(
      {
        ...context,
        entityId,
        entityType
      },
      {
        ...options,
        returnUrl: options.returnUrl || window.location.pathname
      }
    );
  }

  /**
   * Navigate to timeline from dashboard
   */
  public navigateFromDashboard(
    context: TimelineNavigationContext = {},
    options: TimelineNavigationOptions = {}
  ) {
    this.navigateToTimeline(
      context,
      {
        ...options,
        returnUrl: options.returnUrl || '/dashboard'
      }
    );
  }

  /**
   * Navigate to character timeline
   */
  public navigateToCharacterTimeline(
    characterId: string,
    context: Omit<TimelineNavigationContext, 'entityId' | 'entityType'> = {},
    options: TimelineNavigationOptions = {}
  ) {
    this.navigateFromEntity('character', characterId, context, {
      ...options,
      timelineFocus: 'dual' // Characters benefit from dual timeline view
    });
  }

  /**
   * Navigate to campaign timeline
   */
  public navigateToCampaignTimeline(
    campaignId: string,
    worldId?: string,
    options: TimelineNavigationOptions = {}
  ) {
    this.navigateToTimeline(
      {
        worldId,
        campaignId,
        entityType: 'campaign',
        entityId: campaignId
      },
      {
        ...options,
        displayMode: options.displayMode || 'dual'
      }
    );
  }

  /**
   * Navigate to session timeline
   */
  public navigateToSessionTimeline(
    sessionId: string,
    context: Omit<TimelineNavigationContext, 'entityId' | 'entityType'> = {},
    options: TimelineNavigationOptions = {}
  ) {
    this.navigateFromEntity('session', sessionId, context, {
      ...options,
      displayMode: options.displayMode || 'real-world' // Sessions are primarily real-world
    });
  }

  /**
   * Navigate to event timeline
   */
  public navigateToEventTimeline(
    eventId: string,
    context: Omit<TimelineNavigationContext, 'entityId' | 'entityType'> = {},
    options: TimelineNavigationOptions = {}
  ) {
    this.navigateFromEntity('event', eventId, context, {
      ...options,
      highlightEventId: eventId,
      displayMode: options.displayMode || 'in-game' // Events are primarily in-game
    });
  }

  /**
   * Get timeline URL for a given context
   */
  public getTimelineUrl(
    context: TimelineNavigationContext = {},
    options: TimelineNavigationOptions = {}
  ): string {
    const params = new URLSearchParams();
    
    if (context.worldId) params.set('world', context.worldId);
    if (context.campaignId) params.set('campaign', context.campaignId);
    if (context.entityId) params.set('entity', context.entityId);
    if (context.entityType) params.set('entityType', context.entityType);
    if (context.highlightEventId) params.set('highlight', context.highlightEventId);
    if (options.displayMode) params.set('mode', options.displayMode);
    if (options.enableEditing) params.set('edit', 'true');
    if (options.returnUrl) params.set('return', encodeURIComponent(options.returnUrl));

    return `/visualizations/timeline${params.toString() ? `?${params.toString()}` : ''}`;
  }

  /**
   * Parse timeline context from URL parameters
   */
  public parseTimelineContext(searchParams: URLSearchParams): {
    context: TimelineNavigationContext;
    options: TimelineNavigationOptions;
  } {
    const context: TimelineNavigationContext = {
      worldId: searchParams.get('world') || undefined,
      campaignId: searchParams.get('campaign') || undefined,
      entityId: searchParams.get('entity') || undefined,
      entityType: (searchParams.get('entityType') as TimelineNavigationContext['entityType']) || undefined,
      highlightEventId: searchParams.get('highlight') || undefined
    };

    const options: TimelineNavigationOptions = {
      displayMode: (searchParams.get('mode') as TimelineNavigationOptions['displayMode']) || undefined,
      enableEditing: searchParams.get('edit') === 'true',
      returnUrl: searchParams.get('return') ? decodeURIComponent(searchParams.get('return')!) : undefined
    };

    return { context, options };
  }
}

// Export singleton instance
export const timelineNavigation = TimelineNavigationService.getInstance();
