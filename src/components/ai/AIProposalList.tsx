import { useState, useEffect } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Select, 
  Stack, 
  Loader, 
  Center, 
  Tabs, 
  Badge, 
  Button 
} from '@mantine/core';
import { IconFilter, IconRefresh, IconBrain } from '@tabler/icons-react';
import { AIProposalCard } from './AIProposalCard';
import { AIProposal, ProposalStatus, ProposalType, ChangeField, RelationshipChange } from '../../models/AIProposal';
import { EntityType } from '../../models/Relationship';

/**
 * AI Proposal List props
 */
interface AIProposalListProps {
  campaignId?: string;
  entityId?: string;
  entityType?: EntityType;
  title?: string;
  description?: string;
}

/**
 * AIProposalList component - List of AI proposals
 * 
 * This is a placeholder component for future AI Brain integration.
 * It demonstrates the UI for listing AI proposals but doesn't have actual functionality yet.
 */
export function AIProposalList({
  campaignId,
  entityId,
  entityType,
  title = 'AI Proposals',
  description
}: AIProposalListProps) {
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  // Load proposals
  useEffect(() => {
    const loadProposals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, this would call an API to fetch proposals
        // For now, we'll create mock data
        
        // Mock proposals
        const mockProposals: AIProposal[] = [
          {
            id: '1',
            campaignId: campaignId || '1',
            entityId: entityId || 'character-1',
            entityType: entityType || EntityType.CHARACTER,
            proposalType: ProposalType.UPDATE,
            status: ProposalStatus.PENDING,
            changes: [
              {
                fieldName: 'description',
                oldValue: 'A wizard',
                newValue: 'A powerful wizard with a long white beard and a staff. Known for his wisdom and magical abilities.',
                confidence: 0.85,
                reasoning: 'The current description is very brief. Adding more details about appearance and abilities provides more context for the character.'
              },
              {
                fieldName: 'background',
                oldValue: '',
                newValue: 'Studied magic from a young age under the tutelage of Saruman. Traveled extensively throughout Middle-earth.',
                confidence: 0.75,
                reasoning: 'Adding background information helps establish the character\'s history and connections to the world.'
              }
            ],
            createdAt: new Date(),
            aiConfidence: 0.8,
            aiReasoning: 'This character has minimal description and background information. Adding these details will make the character more three-dimensional and provide hooks for storytelling.'
          },
          {
            id: '2',
            campaignId: campaignId || '1',
            entityId: entityId || 'location-1',
            entityType: EntityType.LOCATION,
            proposalType: ProposalType.UPDATE,
            status: ProposalStatus.APPROVED,
            changes: [
              {
                fieldName: 'description',
                oldValue: 'A dark land',
                newValue: 'A dark, volcanic land surrounded by mountains. The air is thick with ash and the ground is barren.',
                confidence: 0.9,
                reasoning: 'The current description is very brief. Adding more sensory details creates a more vivid picture of the location.'
              }
            ],
            relationshipChanges: [
              {
                sourceEntityId: 'location-1',
                sourceEntityType: EntityType.LOCATION,
                targetEntityId: 'character-3',
                targetEntityType: EntityType.CHARACTER,
                relationshipType: 'CONTAINS',
                action: 'ADD',
                confidence: 0.7,
                reasoning: 'Based on the campaign narrative, this character is currently located in this area.'
              }
            ],
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            reviewedAt: new Date(),
            reviewedBy: 'user-1',
            aiConfidence: 0.85,
            aiReasoning: 'This location lacks descriptive details and established relationships with characters who are known to be there.'
          },
          {
            id: '3',
            campaignId: campaignId || '1',
            entityId: entityId || 'item-1',
            entityType: EntityType.ITEM,
            proposalType: ProposalType.UPDATE,
            status: ProposalStatus.REJECTED,
            changes: [
              {
                fieldName: 'description',
                oldValue: 'A powerful ring',
                newValue: 'A simple gold ring that grants invisibility to the wearer but corrupts their soul over time.',
                confidence: 0.95,
                reasoning: 'The current description doesn\'t mention the ring\'s powers or drawbacks, which are essential to its role in the story.'
              }
            ],
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
            reviewedAt: new Date(Date.now() - 86400000), // 1 day ago
            reviewedBy: 'user-1',
            aiConfidence: 0.9,
            aiReasoning: 'This item lacks information about its magical properties and effects on the user, which are crucial for gameplay and storytelling.',
            userFeedback: 'I prefer to keep the description vague for now as players haven\'t discovered its properties yet.'
          }
        ];
        
        setProposals(mockProposals);
      } catch (err) {
        console.error('Error loading proposals:', err);
        setError('Failed to load AI proposals');
      } finally {
        setLoading(false);
      }
    };
    
    loadProposals();
  }, [campaignId, entityId, entityType]);
  
  // Handle approve proposal
  const handleApproveProposal = (proposalId: string, feedback?: string) => {
    // In a real implementation, this would call an API to approve the proposal
    console.log(`Approve proposal ${proposalId}`, feedback);
    
    // Update local state
    setProposals(prev => 
      prev.map(proposal => 
        proposal.id === proposalId
          ? {
              ...proposal,
              status: ProposalStatus.APPROVED,
              reviewedAt: new Date(),
              reviewedBy: 'user-1',
              userFeedback: feedback
            }
          : proposal
      )
    );
  };
  
  // Handle reject proposal
  const handleRejectProposal = (proposalId: string, feedback?: string) => {
    // In a real implementation, this would call an API to reject the proposal
    console.log(`Reject proposal ${proposalId}`, feedback);
    
    // Update local state
    setProposals(prev => 
      prev.map(proposal => 
        proposal.id === proposalId
          ? {
              ...proposal,
              status: ProposalStatus.REJECTED,
              reviewedAt: new Date(),
              reviewedBy: 'user-1',
              userFeedback: feedback
            }
          : proposal
      )
    );
  };
  
  // Handle modify proposal
  const handleModifyProposal = (
    proposalId: string, 
    changes: ChangeField[], 
    relationshipChanges?: RelationshipChange[]
  ) => {
    // In a real implementation, this would call an API to modify the proposal
    console.log(`Modify proposal ${proposalId}`, changes, relationshipChanges);
    
    // Update local state
    setProposals(prev => 
      prev.map(proposal => 
        proposal.id === proposalId
          ? {
              ...proposal,
              status: ProposalStatus.MODIFIED,
              changes,
              relationshipChanges: relationshipChanges || proposal.relationshipChanges,
              reviewedAt: new Date(),
              reviewedBy: 'user-1'
            }
          : proposal
      )
    );
  };
  
  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (statusFilter && proposal.status !== statusFilter) {
      return false;
    }
    
    if (typeFilter && proposal.proposalType !== typeFilter) {
      return false;
    }
    
    return true;
  });
  
  // Status filter options
  const statusOptions = Object.values(ProposalStatus).map(status => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase()
  }));
  
  // Type filter options
  const typeOptions = Object.values(ProposalType).map(type => ({
    value: type,
    label: type.charAt(0) + type.slice(1).toLowerCase()
  }));
  
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <div>
            <Title order={3}>{title}</Title>
            {description && <Text c="dimmed">{description}</Text>}
          </div>
          
          <Group>
            <Select
              placeholder="Status"
              data={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
              value={statusFilter}
              onChange={setStatusFilter}
              leftSection={<IconFilter size={16} />}
              w={150}
            />
            
            <Select
              placeholder="Type"
              data={[{ value: '', label: 'All Types' }, ...typeOptions]}
              value={typeFilter}
              onChange={setTypeFilter}
              leftSection={<IconFilter size={16} />}
              w={150}
            />
            
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setLoading(true);
                // In a real implementation, this would refresh the data
                setTimeout(() => setLoading(false), 500);
              }}
            >
              Refresh
            </Button>
          </Group>
        </Group>
        
        {loading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : error ? (
          <Center h={200}>
            <Text c="red">{error}</Text>
          </Center>
        ) : filteredProposals.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <IconBrain size={48} opacity={0.3} />
              <Text c="dimmed">No AI proposals found matching the current filters.</Text>
            </Stack>
          </Center>
        ) : (
          <Tabs defaultValue="list">
            <Tabs.List>
              <Tabs.Tab
                value="list"
                leftSection={<IconBrain size={16} />}
                rightSection={
                  <Badge size="sm" variant="filled" color="blue">
                    {filteredProposals.length}
                  </Badge>
                }
              >
                Proposals
              </Tabs.Tab>
            </Tabs.List>
            
            <Tabs.Panel value="list" pt="md">
              <Stack>
                {filteredProposals.map(proposal => (
                  <AIProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onApprove={handleApproveProposal}
                    onReject={handleRejectProposal}
                    onModify={handleModifyProposal}
                  />
                ))}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
    </Paper>
  );
}
