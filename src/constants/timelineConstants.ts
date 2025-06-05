/**
 * Timeline Constants
 *
 * This file contains constants and enums for the Dual Timeline System
 * in RPG Scribe, providing standardized time units, conflict types,
 * and validation rules.
 */

/**
 * Time unit enum for flexible time gap management
 */
export enum TimeUnit {
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years'
}

/**
 * Timeline conflict type enum
 */
export enum TimelineConflictType {
  OVERLAPPING_EVENTS = 'overlapping_events',
  IMPOSSIBLE_TRAVEL_TIME = 'impossible_travel_time',
  CHARACTER_IN_MULTIPLE_LOCATIONS = 'character_in_multiple_locations',
  CHRONOLOGICAL_INCONSISTENCY = 'chronological_inconsistency',
  MISSING_TIME_GAP = 'missing_time_gap',
  NEGATIVE_TIME_DURATION = 'negative_time_duration'
}

/**
 * Timeline validation severity levels
 */
export enum TimelineValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Timeline entry type enum
 */
export enum TimelineEntryType {
  EVENT = 'event',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  COMBAT = 'combat',
  TRAVEL = 'travel',
  DISCOVERY = 'discovery',
  CHARACTER_EVENT = 'character_event',
  STORY_EVENT = 'story_event',
  MILESTONE = 'milestone',
  TIME_GAP = 'time_gap',
  DOWNTIME = 'downtime'
}

/**
 * Default time durations for common activities (in minutes)
 */
export const DEFAULT_ACTIVITY_DURATIONS = {
  // Combat and encounters
  COMBAT_ROUND: 6, // 6 seconds per round, but stored as fraction of minute
  SHORT_COMBAT: 5,
  MEDIUM_COMBAT: 15,
  LONG_COMBAT: 30,
  EPIC_COMBAT: 60,

  // Social interactions
  BRIEF_CONVERSATION: 5,
  NORMAL_CONVERSATION: 15,
  LONG_CONVERSATION: 30,
  NEGOTIATION: 45,
  INTERROGATION: 60,

  // Exploration and investigation
  ROOM_SEARCH: 10,
  AREA_EXPLORATION: 30,
  THOROUGH_INVESTIGATION: 60,
  DUNGEON_EXPLORATION: 120,

  // Rest and recovery
  SHORT_REST: 60, // 1 hour
  LONG_REST: 480, // 8 hours
  EXTENDED_REST: 1440, // 24 hours

  // Travel (per mile/km - adjust based on terrain and method)
  WALKING_PER_MILE: 20,
  RIDING_PER_MILE: 10,
  FLYING_PER_MILE: 5,

  // Crafting and activities
  SIMPLE_CRAFT: 60,
  COMPLEX_CRAFT: 240,
  RESEARCH: 120,
  SHOPPING: 30
} as const;

/**
 * Time conversion factors to minutes
 */
export const TIME_CONVERSION_TO_MINUTES = {
  [TimeUnit.MINUTES]: 1,
  [TimeUnit.HOURS]: 60,
  [TimeUnit.DAYS]: 1440, // 24 * 60
  [TimeUnit.WEEKS]: 10080, // 7 * 24 * 60
  [TimeUnit.MONTHS]: 43200, // 30 * 24 * 60 (approximate)
  [TimeUnit.YEARS]: 525600 // 365 * 24 * 60 (approximate)
} as const;

/**
 * Maximum allowed time gaps for validation
 */
export const MAX_TIME_GAPS = {
  [TimeUnit.MINUTES]: 1440, // Max 24 hours in minutes
  [TimeUnit.HOURS]: 168, // Max 1 week in hours
  [TimeUnit.DAYS]: 365, // Max 1 year in days
  [TimeUnit.WEEKS]: 52, // Max 1 year in weeks
  [TimeUnit.MONTHS]: 120, // Max 10 years in months
  [TimeUnit.YEARS]: 100 // Max 100 years
} as const;

/**
 * Timeline display formats
 */
export const TIMELINE_DISPLAY_FORMATS = {
  SHORT_DATE: 'MMM dd, yyyy',
  LONG_DATE: 'MMMM dd, yyyy',
  DATE_TIME: 'MMM dd, yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  RELATIVE: 'relative' // e.g., "2 hours ago", "in 3 days"
} as const;

/**
 * Timeline zoom levels for visualization
 */
export const TIMELINE_ZOOM_LEVELS = {
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months',
  YEARS: 'years'
} as const;

/**
 * Default timeline settings
 */
export const DEFAULT_TIMELINE_SETTINGS = {
  defaultTimeUnit: TimeUnit.HOURS,
  defaultZoomLevel: TIMELINE_ZOOM_LEVELS.DAYS,
  autoCalculateTimeGaps: true,
  showRealWorldTime: true,
  showInGameTime: true,
  enableConflictDetection: true,
  enableAISuggestions: true
} as const;
