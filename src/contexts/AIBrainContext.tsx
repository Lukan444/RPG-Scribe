import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiBrainService } from '../services/api/aiBrain.service';
import { 
  AIProposal, 
  AIProposalCreationParams, 
  AIProposalUpdateParams, 
  ProposalStatus, 
  AIConversation, 
  AIMessage, 
  AIMessageRole 
} from '../models/AIProposal';
import { EntityType } from '../models/Relationship';

/**
 * AI Brain Context Type
 */
interface AIBrainContextType {
  proposals: AIProposal[];
  conversations: AIConversation[];
  isLoading: boolean;
  error: Error | null;
  getProposalsForEntity: (entityId: string, entityType: EntityType) => Promise<AIProposal[]>;
  updateProposal: (id: string, updates: AIProposalUpdateParams) => Promise<AIProposal>;
  generateAnalysis: (entityId: string, entityType: EntityType) => Promise<AIProposal[]>;
  createConversation: (title: string, initialMessage: string) => Promise<AIConversation>;
  addMessageToConversation: (conversationId: string, content: string) => Promise<AIMessage>;
  getAIResponse: (conversationId: string, userMessage: string) => Promise<AIMessage>;
}

// Create context with default values
const AIBrainContext = createContext<AIBrainContextType>({
  proposals: [],
  conversations: [],
  isLoading: false,
  error: null,
  getProposalsForEntity: async () => [],
  updateProposal: async () => ({} as AIProposal),
  generateAnalysis: async () => [],
  createConversation: async () => ({} as AIConversation),
  addMessageToConversation: async () => ({} as AIMessage),
  getAIResponse: async () => ({} as AIMessage)
});

// Props for the AIBrainProvider component
interface AIBrainProviderProps {
  children: ReactNode;
  campaignId: string;
  userId: string;
}

/**
 * AI Brain Provider Component
 * 
 * This is a placeholder provider for future AI Brain integration.
 * It demonstrates the context structure but doesn't have actual functionality yet.
 */
export const AIBrainProvider = ({ children, campaignId, userId }: AIBrainProviderProps) => {
  // State for proposals and conversations
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load proposals and conversations
        const [proposalsData, conversationsData] = await Promise.all([
          aiBrainService.getProposalsForCampaign(campaignId),
          aiBrainService.getConversationsForCampaign(campaignId)
        ]);
        
        setProposals(proposalsData);
        setConversations(conversationsData);
      } catch (err) {
        console.error('Error loading AI Brain data:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (campaignId) {
      loadInitialData();
    }
  }, [campaignId]);
  
  // Get proposals for an entity
  const getProposalsForEntity = async (entityId: string, entityType: EntityType): Promise<AIProposal[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const entityProposals = await aiBrainService.getProposalsForEntity(
        campaignId,
        entityId,
        entityType
      );
      
      // Update state with new proposals
      const existingProposalIds = new Set(proposals.map(p => p.id));
      const newProposals = entityProposals.filter(p => !existingProposalIds.has(p.id));
      
      if (newProposals.length > 0) {
        setProposals(prev => [...prev, ...newProposals]);
      }
      
      return entityProposals;
    } catch (err) {
      console.error('Error getting proposals for entity:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a proposal
  const updateProposal = async (id: string, updates: AIProposalUpdateParams): Promise<AIProposal> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedProposal = await aiBrainService.updateProposal(id, updates);
      
      // Update state with updated proposal
      setProposals(prev => 
        prev.map(proposal => 
          proposal.id === id ? updatedProposal : proposal
        )
      );
      
      return updatedProposal;
    } catch (err) {
      console.error('Error updating proposal:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate analysis for an entity
  const generateAnalysis = async (entityId: string, entityType: EntityType): Promise<AIProposal[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const generatedProposals = await aiBrainService.generateAnalysis(
        campaignId,
        entityId,
        entityType
      );
      
      // Update state with new proposals
      setProposals(prev => [...prev, ...generatedProposals]);
      
      return generatedProposals;
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new conversation
  const createConversation = async (title: string, initialMessage: string): Promise<AIConversation> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newConversation = await aiBrainService.createConversation(
        campaignId,
        title,
        initialMessage,
        userId
      );
      
      // Update state with new conversation
      setConversations(prev => [...prev, newConversation]);
      
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a message to a conversation
  const addMessageToConversation = async (conversationId: string, content: string): Promise<AIMessage> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newMessage = await aiBrainService.addMessageToConversation(
        conversationId,
        AIMessageRole.USER,
        content
      );
      
      // Update state with new message
      setConversations(prev => 
        prev.map(conversation => 
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, newMessage],
                updatedAt: new Date()
              }
            : conversation
        )
      );
      
      return newMessage;
    } catch (err) {
      console.error('Error adding message to conversation:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get AI response
  const getAIResponse = async (conversationId: string, userMessage: string): Promise<AIMessage> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First add the user message
      const userMessageObj = await addMessageToConversation(conversationId, userMessage);
      
      // In a real implementation, this would call an AI service to generate a response
      // For now, we'll simulate a response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = await aiBrainService.addMessageToConversation(
        conversationId,
        AIMessageRole.ASSISTANT,
        'This is a simulated AI response. In a real implementation, this would be generated by an AI service.'
      );
      
      // Update state with AI response
      setConversations(prev => 
        prev.map(conversation => 
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, aiResponse],
                updatedAt: new Date()
              }
            : conversation
        )
      );
      
      return aiResponse;
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const value: AIBrainContextType = {
    proposals,
    conversations,
    isLoading,
    error,
    getProposalsForEntity,
    updateProposal,
    generateAnalysis,
    createConversation,
    addMessageToConversation,
    getAIResponse
  };
  
  return <AIBrainContext.Provider value={value}>{children}</AIBrainContext.Provider>;
};

/**
 * Custom hook to use the AI Brain context
 */
export const useAIBrain = (): AIBrainContextType => {
  const context = useContext(AIBrainContext);
  
  if (context === undefined) {
    throw new Error('useAIBrain must be used within an AIBrainProvider');
  }
  
  return context;
};
