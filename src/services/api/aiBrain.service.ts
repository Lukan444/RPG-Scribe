import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  AIProposal,
  AIProposalCreationParams,
  AIProposalUpdateParams,
  ProposalStatus,
  ProposalType,
  AIContext,
  AIContextSource,
  AIConversation,
  AIMessage,
  AIMessageRole
} from '../../models/AIProposal';
import { EntityType } from '../../models/Relationship';

/**
 * AI Brain service for API operations
 *
 * This is a placeholder service for future AI Brain integration.
 * It demonstrates the API structure but doesn't have actual functionality yet.
 */
export class AIBrainService {
  /**
   * Get AI proposals for a campaign
   * @param campaignId Campaign ID
   * @returns Promise with array of AI proposals
   */
  async getProposalsForCampaign(campaignId: string): Promise<AIProposal[]> {
    try {
      const proposalsRef = collection(db, 'proposals');
      const q = query(
        proposalsRef,
        where('campaignId', '==', campaignId),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.formatProposal({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting AI proposals:', error);
      throw error;
    }
  }

  /**
   * Get AI proposals for an entity
   * @param campaignId Campaign ID
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Promise with array of AI proposals
   */
  async getProposalsForEntity(
    campaignId: string,
    entityId: string,
    entityType: EntityType
  ): Promise<AIProposal[]> {
    try {
      const proposalsRef = collection(db, 'proposals');
      const q = query(
        proposalsRef,
        where('campaignId', '==', campaignId),
        where('entityId', '==', entityId),
        where('entityType', '==', entityType),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.formatProposal({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting AI proposals for entity:', error);
      throw error;
    }
  }

  /**
   * Create an AI proposal
   * @param proposal AI proposal creation parameters
   * @returns Promise with created AI proposal
   */
  async createProposal(proposal: AIProposalCreationParams): Promise<AIProposal> {
    try {
      const proposalsRef = collection(db, 'proposals');
      const newProposal = {
        ...proposal,
        status: ProposalStatus.PENDING,
        submittedBy: proposal.submittedBy,
        submittedAt: proposal.submittedAt ? proposal.submittedAt : serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(proposalsRef, newProposal);

      return this.formatProposal({ id: docRef.id, ...newProposal });
    } catch (error) {
      console.error('Error creating AI proposal:', error);
      throw error;
    }
  }

  /**
   * Update an AI proposal
   * @param id Proposal ID
   * @param updates Proposal update parameters
   * @returns Promise with updated AI proposal
   */
  async updateProposal(id: string, updates: AIProposalUpdateParams): Promise<AIProposal> {
    try {
      const proposalRef = doc(db, 'proposals', id);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.status && updates.status !== ProposalStatus.PENDING) {
        updateData.reviewedAt = serverTimestamp();
      }

      await updateDoc(proposalRef, updateData);

      const updatedSnap = await getDoc(proposalRef);
      if (!updatedSnap.exists()) {
        throw new Error('Proposal not found after update');
      }

      return this.formatProposal({ id: updatedSnap.id, ...updatedSnap.data() });
    } catch (error) {
      console.error('Error updating AI proposal:', error);
      throw error;
    }
  }

  /**
   * Get a proposal by ID
   * @param id Proposal ID
   */
  async getProposalById(id: string): Promise<AIProposal | null> {
    try {
      const proposalRef = doc(db, 'proposals', id);
      const snap = await getDoc(proposalRef);
      if (!snap.exists()) return null;
      return this.formatProposal({ id: snap.id, ...snap.data() });
    } catch (error) {
      console.error('Error getting proposal:', error);
      throw error;
    }
  }

  /**
   * Delete a proposal
   * @param id Proposal ID
   */
  async deleteProposal(id: string): Promise<void> {
    try {
      const proposalRef = doc(db, 'proposals', id);
      await deleteDoc(proposalRef);
    } catch (error) {
      console.error('Error deleting AI proposal:', error);
      throw error;
    }
  }

  /**
   * Generate AI analysis for an entity
   * @param campaignId Campaign ID
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Promise with array of AI proposals
   */
  async generateAnalysis(
    campaignId: string,
    entityId: string,
    entityType: EntityType
  ): Promise<AIProposal[]> {
    try {
      // In a real implementation, this would call an AI service to generate analysis
      // For now, we'll return mock data

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockProposals: AIProposal[] = [
        {
          id: Math.random().toString(36).substring(2, 9),
          campaignId,
          entityId,
          entityType,
          proposalType: ProposalType.UPDATE,
          status: ProposalStatus.PENDING,
          changes: [
            {
              fieldName: 'description',
              oldValue: 'A wizard',
              newValue: 'A powerful wizard with a long white beard and a staff. Known for his wisdom and magical abilities.',
              confidence: 0.85,
              reasoning: 'The current description is very brief. Adding more details about appearance and abilities provides more context for the character.'
            }
          ],
          createdAt: new Date(),
          aiConfidence: 0.85,
          aiReasoning: 'This character has minimal description. Adding these details will make the character more three-dimensional.'
        }
      ];

      return mockProposals;
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      throw error;
    }
  }

  /**
   * Get AI conversations for a campaign
   * @param campaignId Campaign ID
   * @returns Promise with array of AI conversations
   */
  async getConversationsForCampaign(campaignId: string): Promise<AIConversation[]> {
    try {
      // In a real implementation, this would fetch conversations from Firestore
      // For now, we'll return mock data

      const mockConversations: AIConversation[] = [
        {
          id: '1',
          campaignId,
          title: 'Campaign Planning',
          messages: [
            {
              id: '1',
              conversationId: '1',
              role: AIMessageRole.USER,
              content: 'Can you suggest some interesting plot hooks for my campaign?',
              createdAt: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
              id: '2',
              conversationId: '1',
              role: AIMessageRole.ASSISTANT,
              content: 'Based on your campaign setting and existing characters, here are some plot hooks:\n\n1. The ancient artifact that the party discovered in the ruins could be sought after by a powerful rival faction.\n2. One of the NPCs the party trusts could be revealed as a spy for the antagonist.\n3. A mysterious illness begins affecting magic users in the region, and the source seems connected to recent events.\n\nWould you like me to develop any of these ideas further?',
              createdAt: new Date(Date.now() - 3500000) // 58 minutes ago
            }
          ],
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          updatedAt: new Date(Date.now() - 3500000), // 58 minutes ago
          createdBy: 'user-1'
        }
      ];

      return mockConversations;
    } catch (error) {
      console.error('Error getting AI conversations:', error);
      throw error;
    }
  }

  /**
   * Create a new AI conversation
   * @param campaignId Campaign ID
   * @param title Conversation title
   * @param initialMessage Initial message
   * @param userId User ID
   * @returns Promise with created AI conversation
   */
  async createConversation(
    campaignId: string,
    title: string,
    initialMessage: string,
    userId: string
  ): Promise<AIConversation> {
    try {
      // In a real implementation, this would create a conversation in Firestore
      // For now, we'll return mock data

      const mockConversation: AIConversation = {
        id: Math.random().toString(36).substring(2, 9),
        campaignId,
        title,
        messages: [
          {
            id: '1',
            conversationId: '1',
            role: AIMessageRole.USER,
            content: initialMessage,
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      return mockConversation;
    } catch (error) {
      console.error('Error creating AI conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to an AI conversation
   * @param conversationId Conversation ID
   * @param role Message role
   * @param content Message content
   * @returns Promise with updated AI conversation
   */
  async addMessageToConversation(
    conversationId: string,
    role: AIMessageRole,
    content: string
  ): Promise<AIMessage> {
    try {
      // In a real implementation, this would add a message to a conversation in Firestore
      // For now, we'll return mock data

      const mockMessage: AIMessage = {
        id: Math.random().toString(36).substring(2, 9),
        conversationId,
        role,
        content,
        createdAt: new Date()
      };

      return mockMessage;
    } catch (error) {
      console.error('Error adding message to AI conversation:', error);
      throw error;
    }
  }

  /**
   * Format proposal data from Firestore
   * @param data Raw Firestore data
   */
  private formatProposal(data: any): AIProposal {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : data.reviewedAt,
      submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt
    } as AIProposal;
  }
}

// Export singleton instance
export const aiBrainService = new AIBrainService();
