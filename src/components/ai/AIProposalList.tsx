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
import { aiBrainService } from '../../services/api/aiBrain.service';

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
        let data: AIProposal[] = [];
        if (entityId && entityType) {
          data = await aiBrainService.getProposalsForEntity(
            campaignId || '',
            entityId,
            entityType
          );
        } else if (campaignId) {
          data = await aiBrainService.getProposalsForCampaign(campaignId);
        }

        setProposals(data);
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
  const handleApproveProposal = async (proposalId: string, feedback?: string) => {
    try {
      const updated = await aiBrainService.updateProposal(proposalId, {
        status: ProposalStatus.APPROVED,
        reviewedBy: 'gm-1',
        userFeedback: feedback
      });
      setProposals(prev => prev.map(p => (p.id === proposalId ? updated : p)));
    } catch (err) {
      console.error('Error approving proposal:', err);
    }
  };
  
  // Handle reject proposal
  const handleRejectProposal = async (proposalId: string, feedback?: string) => {
    try {
      const updated = await aiBrainService.updateProposal(proposalId, {
        status: ProposalStatus.REJECTED,
        reviewedBy: 'gm-1',
        userFeedback: feedback
      });
      setProposals(prev => prev.map(p => (p.id === proposalId ? updated : p)));
    } catch (err) {
      console.error('Error rejecting proposal:', err);
    }
  };
  
  // Handle modify proposal
  const handleModifyProposal = (
    proposalId: string,
    changes: ChangeField[],
    relationshipChanges?: RelationshipChange[]
  ) => {
    console.log(`Modify proposal ${proposalId}`, changes, relationshipChanges);
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
