/**
 * Timeline Conflict Detection Types
 * 
 * Comprehensive type definitions for advanced conflict detection,
 * AI-ready framework, and visual relationship mapping in RPG Scribe.
 */

import { RPGTimelineEvent, TimelineEventType } from './timeline.types';
import { EntityType } from '../models/EntityType';

/**
 * Conflict Severity Levels
 */
export enum ConflictSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Conflict Types
 */
export enum ConflictType {
  TIME_OVERLAP = 'time_overlap',
  RESOURCE_CONFLICT = 'resource_conflict',
  LOGICAL_INCONSISTENCY = 'logical_inconsistency',
  CHARACTER_AVAILABILITY = 'character_availability',
  LOCATION_CAPACITY = 'location_capacity',
  PREREQUISITE_MISSING = 'prerequisite_missing',
  TIMELINE_PARADOX = 'timeline_paradox',
  ENTITY_STATE_CONFLICT = 'entity_state_conflict'
}

/**
 * Relationship Types between Events
 */
export enum RelationshipType {
  CAUSES = 'causes',
  ENABLES = 'enables',
  BLOCKS = 'blocks',
  REQUIRES = 'requires',
  RELATED_TO = 'related_to',
  FOLLOWS = 'follows',
  PRECEDES = 'precedes',
  CONCURRENT = 'concurrent'
}

/**
 * Timeline Conflict Interface
 */
export interface TimelineConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  affectedEvents: string[]; // Event IDs
  affectedEntities: {
    entityType: EntityType;
    entityId: string;
    entityName?: string;
  }[];
  timelineContext: {
    realWorldTimeRange?: {
      start: Date;
      end: Date;
    };
    inGameTimeRange?: {
      start: Date;
      end: Date;
    };
    affectedRows: string[];
  };
  metadata: {
    detectedAt: Date;
    detectedBy: 'system' | 'user' | 'ai';
    autoResolvable: boolean;
    requiresGMApproval: boolean;
    tags: string[];
  };
  resolution?: ConflictResolution;
  aiProposal?: AIConflictProposal;
}

/**
 * Conflict Resolution Interface
 */
export interface ConflictResolution {
  id: string;
  conflictId: string;
  type: 'manual' | 'automatic' | 'ai_suggested';
  action: ConflictResolutionAction;
  appliedAt: Date;
  appliedBy: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

/**
 * Conflict Resolution Actions
 */
export enum ConflictResolutionAction {
  MOVE_EVENT = 'move_event',
  SPLIT_EVENT = 'split_event',
  MERGE_EVENTS = 'merge_events',
  CHANGE_PARTICIPANTS = 'change_participants',
  CHANGE_LOCATION = 'change_location',
  ADJUST_DURATION = 'adjust_duration',
  MARK_AS_EXCEPTION = 'mark_as_exception',
  DELETE_EVENT = 'delete_event',
  CREATE_DEPENDENCY = 'create_dependency',
  IGNORE_CONFLICT = 'ignore_conflict'
}

/**
 * AI Conflict Proposal Interface (Future Integration)
 */
export interface AIConflictProposal {
  id: string;
  conflictId: string;
  proposedSolutions: AIProposedSolution[];
  confidence: number; // 0-1
  reasoning: string;
  alternativeOptions: AIProposedSolution[];
  estimatedImpact: {
    affectedEvents: number;
    complexityScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  generatedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
}

/**
 * AI Proposed Solution Interface
 */
export interface AIProposedSolution {
  id: string;
  action: ConflictResolutionAction;
  targetEventIds: string[];
  parameters: Record<string, any>;
  description: string;
  pros: string[];
  cons: string[];
  confidence: number;
  estimatedEffort: 'low' | 'medium' | 'high';
}

/**
 * Event Relationship Interface
 */
export interface EventRelationship {
  id: string;
  sourceEventId: string;
  targetEventId: string;
  type: RelationshipType;
  strength: number; // 0-1, how strong the relationship is
  description?: string;
  metadata: {
    createdAt: Date;
    createdBy: 'system' | 'user' | 'ai';
    verified: boolean;
    tags: string[];
  };
}

/**
 * Conflict Detection Configuration
 */
export interface ConflictDetectionConfig {
  enabled: boolean;
  realTimeDetection: boolean;
  severityThreshold: ConflictSeverity;
  enabledConflictTypes: ConflictType[];
  autoResolveEnabled: boolean;
  autoResolvableTypes: ConflictType[];
  notificationSettings: {
    showCritical: boolean;
    showHigh: boolean;
    showMedium: boolean;
    showLow: boolean;
    soundEnabled: boolean;
    persistentAlerts: boolean;
  };
  performanceSettings: {
    maxEventsToAnalyze: number;
    detectionInterval: number; // milliseconds
    batchSize: number;
  };
}

/**
 * Conflict Detection Result
 */
export interface ConflictDetectionResult {
  conflicts: TimelineConflict[];
  relationships: EventRelationship[];
  performance: {
    detectionTime: number;
    eventsAnalyzed: number;
    conflictsFound: number;
    relationshipsFound: number;
  };
  metadata: {
    detectedAt: Date;
    configUsed: ConflictDetectionConfig;
    dataVersion: string;
  };
}

/**
 * Visual Conflict Indicator
 */
export interface VisualConflictIndicator {
  conflictId: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: {
    color: string;
    backgroundColor: string;
    borderColor: string;
    opacity: number;
    zIndex: number;
  };
  animation?: {
    type: 'pulse' | 'glow' | 'shake' | 'none';
    duration: number;
    intensity: number;
  };
}

/**
 * Conflict Management Interface State
 */
export interface ConflictManagementState {
  conflicts: TimelineConflict[];
  selectedConflict: TimelineConflict | null;
  filters: {
    severity: ConflictSeverity[];
    type: ConflictType[];
    resolved: boolean | null;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  sorting: {
    field: 'severity' | 'type' | 'detectedAt' | 'affectedEvents';
    direction: 'asc' | 'desc';
  };
  view: 'list' | 'grid' | 'timeline';
  loading: boolean;
  error: string | null;
}

/**
 * AI Brain Service Interface (Future Implementation)
 */
export interface AIBrainServiceInterface {
  analyzeConflict(conflict: TimelineConflict): Promise<AIConflictProposal>;
  generateSolutions(conflict: TimelineConflict, context: any): Promise<AIProposedSolution[]>;
  validateSolution(solution: AIProposedSolution, context: any): Promise<boolean>;
  learnFromResolution(resolution: ConflictResolution): Promise<void>;
  getRecommendations(events: RPGTimelineEvent[]): Promise<EventRelationship[]>;
}

/**
 * Conflict Notification Interface
 */
export interface ConflictNotification {
  id: string;
  conflictId: string;
  type: 'new_conflict' | 'conflict_resolved' | 'ai_proposal_ready';
  severity: ConflictSeverity;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
    primary?: boolean;
  }[];
}

/**
 * Performance Metrics for Conflict Detection
 */
export interface ConflictDetectionMetrics {
  totalConflicts: number;
  conflictsBySeverity: Record<ConflictSeverity, number>;
  conflictsByType: Record<ConflictType, number>;
  averageDetectionTime: number;
  resolutionRate: number;
  autoResolutionRate: number;
  userSatisfactionScore?: number;
  performanceScore: number;
}
