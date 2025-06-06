/**
 * AI Proposal model for future AI Brain integration
 */

import { EntityType } from './Relationship';

/**
 * Proposal status enum
 */
export enum ProposalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MODIFIED = 'MODIFIED'
}

/**
 * Proposal type enum
 */
export enum ProposalType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RELATIONSHIP = 'RELATIONSHIP'
}

/**
 * Change field interface
 */
export interface ChangeField {
  fieldName: string;
  oldValue: any;
  newValue: any;
  confidence: number; // 0-1 scale
  reasoning: string;
}

/**
 * Relationship change interface
 */
export interface RelationshipChange {
  sourceEntityId: string;
  sourceEntityType: EntityType;
  targetEntityId: string;
  targetEntityType: EntityType;
  relationshipType: string;
  action: 'ADD' | 'REMOVE' | 'MODIFY';
  confidence: number; // 0-1 scale
  reasoning: string;
}

/**
 * AI Proposal interface
 */
export interface AIProposal {
  id: string;
  campaignId: string;
  entityId?: string;
  entityType?: EntityType;
  submittedBy: string;
  submittedAt: Date;
  proposalType: ProposalType;
  status: ProposalStatus;
  changes: ChangeField[];
  relationshipChanges?: RelationshipChange[];
  createdAt: Date;
  updatedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  aiConfidence: number; // 0-1 scale
  aiReasoning: string;
  userFeedback?: string;
}

/**
 * AI Proposal creation parameters
 */
export interface AIProposalCreationParams {
  campaignId: string;
  entityId?: string;
  entityType?: EntityType;
  submittedBy: string;
  proposalType: ProposalType;
  changes: ChangeField[];
  relationshipChanges?: RelationshipChange[];
  aiConfidence: number;
  aiReasoning: string;
  submittedAt?: Date;
}

/**
 * AI Proposal update parameters
 */
export interface AIProposalUpdateParams {
  status?: ProposalStatus;
  reviewedBy?: string;
  userFeedback?: string;
}

/**
 * AI Context source enum
 */
export enum AIContextSource {
  CAMPAIGN = 'CAMPAIGN',
  SESSION = 'SESSION',
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  ITEM = 'ITEM',
  EVENT = 'EVENT',
  NOTE = 'NOTE',
  USER_INPUT = 'USER_INPUT'
}

/**
 * AI Context interface
 */
export interface AIContext {
  id: string;
  sourceType: AIContextSource;
  sourceId: string;
  content: string;
  relevanceScore?: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * AI Conversation interface
 */
export interface AIConversation {
  id: string;
  campaignId: string;
  entityId?: string;
  entityType?: EntityType;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

/**
 * AI Message role enum
 */
export enum AIMessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

/**
 * AI Message interface
 */
export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  createdAt: Date;
  relatedProposalId?: string;
}
