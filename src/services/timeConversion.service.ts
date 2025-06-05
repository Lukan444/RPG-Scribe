/**
 * Time Conversion Service
 * Handles conversion between real-world time and in-game time for dual timeline system
 */

import { addDays, addHours, addMinutes, differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore } from 'date-fns';

/**
 * Time mapping configuration for conversion between real-world and in-game time
 */
export interface TimeMapping {
  realWorldTime: Date;
  inGameTime: Date;
  conversionRatio: number; // e.g., 1 real day = 30 game days
  timeZone?: string;
  calendarSystem?: 'gregorian' | 'custom';
}

/**
 * Custom calendar system definition
 */
export interface CustomCalendarSystem {
  id: string;
  name: string;
  monthsPerYear: number;
  daysPerMonth: number;
  hoursPerDay: number;
  minutesPerHour: number;
  monthNames: string[];
  dayNames: string[];
  epochYear: number; // Starting year for the calendar
}

/**
 * Time jump event for non-linear progression
 */
export interface TimeJump {
  id: string;
  realWorldTime: Date;
  fromInGameTime: Date;
  toInGameTime: Date;
  description: string;
  type: 'flashback' | 'time_skip' | 'parallel_timeline';
}

/**
 * Time conversion configuration
 */
export interface TimeConversionConfig {
  baseMapping: TimeMapping;
  nonLinearEvents?: TimeJump[];
  customCalendar?: CustomCalendarSystem;
  allowNonLinear?: boolean;
}

/**
 * Time gap detection result
 */
export interface TimeGap {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  timeSystem: 'real' | 'game';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

/**
 * Time conversion validation result
 */
export interface TimeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  gaps: TimeGap[];
  inconsistencies: string[];
}

/**
 * Default Gregorian calendar system
 */
const DEFAULT_CALENDAR: CustomCalendarSystem = {
  id: 'gregorian',
  name: 'Gregorian Calendar',
  monthsPerYear: 12,
  daysPerMonth: 30, // Simplified for game purposes
  hoursPerDay: 24,
  minutesPerHour: 60,
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  epochYear: 1
};

/**
 * Time Conversion Service
 * Provides utilities for converting between real-world and in-game time
 */
export class TimeConversionService {
  private config: TimeConversionConfig;

  constructor(config: TimeConversionConfig) {
    this.config = {
      ...config,
      customCalendar: config.customCalendar || DEFAULT_CALENDAR,
      allowNonLinear: config.allowNonLinear ?? true
    };
  }

  /**
   * Convert real-world time to in-game time
   */
  realToInGame(realTime: Date): Date {
    const { baseMapping, nonLinearEvents } = this.config;
    
    // Check for non-linear events that affect this time
    if (nonLinearEvents && this.config.allowNonLinear) {
      const applicableJump = this.findApplicableTimeJump(realTime, nonLinearEvents);
      if (applicableJump) {
        return this.applyTimeJump(realTime, applicableJump);
      }
    }

    // Calculate linear conversion
    const realDiff = differenceInMinutes(realTime, baseMapping.realWorldTime);
    const gameDiff = realDiff * baseMapping.conversionRatio;
    
    return addMinutes(baseMapping.inGameTime, gameDiff);
  }

  /**
   * Convert in-game time to real-world time
   */
  inGameToReal(gameTime: Date): Date {
    const { baseMapping, nonLinearEvents } = this.config;
    
    // Check for non-linear events that affect this time
    if (nonLinearEvents && this.config.allowNonLinear) {
      const applicableJump = this.findApplicableTimeJumpReverse(gameTime, nonLinearEvents);
      if (applicableJump) {
        return this.applyTimeJumpReverse(gameTime, applicableJump);
      }
    }

    // Calculate linear conversion
    const gameDiff = differenceInMinutes(gameTime, baseMapping.inGameTime);
    const realDiff = gameDiff / baseMapping.conversionRatio;
    
    return addMinutes(baseMapping.realWorldTime, realDiff);
  }

  /**
   * Calculate duration in specified time system
   */
  calculateDuration(start: Date, end: Date, timeSystem: 'real' | 'game'): number {
    if (timeSystem === 'real') {
      return differenceInMinutes(end, start);
    } else {
      // Convert to game time and calculate duration
      const gameStart = this.realToInGame(start);
      const gameEnd = this.realToInGame(end);
      return differenceInMinutes(gameEnd, gameStart);
    }
  }

  /**
   * Detect time gaps in a series of events
   */
  detectTimeGaps(events: Array<{ startDate: Date; endDate?: Date }>, timeSystem: 'real' | 'game' = 'game'): TimeGap[] {
    if (events.length < 2) return [];

    const gaps: TimeGap[] = [];
    const sortedEvents = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      const currentEnd = currentEvent.endDate || currentEvent.startDate;
      const gapDuration = differenceInMinutes(nextEvent.startDate, currentEnd);
      
      // Consider gaps longer than 1 hour significant
      if (gapDuration > 60) {
        const severity = this.calculateGapSeverity(gapDuration);
        
        gaps.push({
          id: `gap-${i}`,
          startTime: currentEnd,
          endTime: nextEvent.startDate,
          duration: gapDuration * 60 * 1000, // Convert to milliseconds
          timeSystem,
          severity,
          description: `${Math.round(gapDuration / 60)} hour gap between events`
        });
      }
    }

    return gaps;
  }

  /**
   * Validate time consistency across events
   */
  validateTimeConsistency(events: Array<{ startDate: Date; endDate?: Date }>): TimeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const inconsistencies: string[] = [];

    // Check for overlapping events
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        if (this.eventsOverlap(event1, event2)) {
          inconsistencies.push(`Events ${i + 1} and ${j + 1} overlap in time`);
        }
      }
    }

    // Check for chronological order issues
    const sortedEvents = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      if (current.endDate && isAfter(current.endDate, next.startDate)) {
        errors.push(`Event ${i + 1} ends after event ${i + 2} starts`);
      }
    }

    // Detect time gaps
    const gaps = this.detectTimeGaps(events);
    if (gaps.length > 0) {
      warnings.push(`Found ${gaps.length} time gaps in timeline`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      gaps,
      inconsistencies
    };
  }

  /**
   * Update conversion configuration
   */
  updateConfig(newConfig: Partial<TimeConversionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TimeConversionConfig {
    return { ...this.config };
  }

  // Private helper methods

  private findApplicableTimeJump(realTime: Date, jumps: TimeJump[]): TimeJump | null {
    return jumps.find(jump => 
      isAfter(realTime, jump.realWorldTime) || realTime.getTime() === jump.realWorldTime.getTime()
    ) || null;
  }

  private findApplicableTimeJumpReverse(gameTime: Date, jumps: TimeJump[]): TimeJump | null {
    return jumps.find(jump => 
      (isAfter(gameTime, jump.fromInGameTime) && isBefore(gameTime, jump.toInGameTime)) ||
      gameTime.getTime() === jump.toInGameTime.getTime()
    ) || null;
  }

  private applyTimeJump(realTime: Date, jump: TimeJump): Date {
    const timeSinceJump = differenceInMinutes(realTime, jump.realWorldTime);
    return addMinutes(jump.toInGameTime, timeSinceJump * this.config.baseMapping.conversionRatio);
  }

  private applyTimeJumpReverse(gameTime: Date, jump: TimeJump): Date {
    const timeSinceJump = differenceInMinutes(gameTime, jump.toInGameTime);
    return addMinutes(jump.realWorldTime, timeSinceJump / this.config.baseMapping.conversionRatio);
  }

  private calculateGapSeverity(durationMinutes: number): 'minor' | 'moderate' | 'major' {
    if (durationMinutes < 180) return 'minor'; // Less than 3 hours
    if (durationMinutes < 1440) return 'moderate'; // Less than 1 day
    return 'major'; // 1 day or more
  }

  private eventsOverlap(event1: { startDate: Date; endDate?: Date }, event2: { startDate: Date; endDate?: Date }): boolean {
    const end1 = event1.endDate || event1.startDate;
    const end2 = event2.endDate || event2.startDate;
    
    return (
      (isAfter(event1.startDate, event2.startDate) && isBefore(event1.startDate, end2)) ||
      (isAfter(end1, event2.startDate) && isBefore(end1, end2)) ||
      (isBefore(event1.startDate, event2.startDate) && isAfter(end1, end2))
    );
  }
}

/**
 * Default time conversion service instance
 */
export const createDefaultTimeConversion = (conversionRatio: number = 24): TimeConversionService => {
  const now = new Date();
  
  return new TimeConversionService({
    baseMapping: {
      realWorldTime: now,
      inGameTime: now,
      conversionRatio, // 1 real hour = 24 game hours by default
      calendarSystem: 'gregorian'
    },
    allowNonLinear: true
  });
};
