import { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Button,
  Stack,
  Accordion,
  Divider,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Box,
  Textarea
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconEdit,
  IconInfoCircle,
  IconArrowUp,
  IconArrowDown,
  IconBrain,
  IconArrowRight
} from '@tabler/icons-react';
import {
  AIProposal,
  ProposalStatus,
  ProposalType,
  ChangeField,
  RelationshipChange
} from '../../models/AIProposal';
import { EntityType } from '../../models/Relationship';

/**
 * AI Proposal Card props
 */
interface AIProposalCardProps {
  proposal: AIProposal;
  onApprove: (proposalId: string, feedback?: string) => void;
  onReject: (proposalId: string, feedback?: string) => void;
  onModify: (proposalId: string, changes: ChangeField[], relationshipChanges?: RelationshipChange[]) => void;
}

/**
 * AIProposalCard component - Card for displaying AI proposals
 *
 * This is a placeholder component for future AI Brain integration.
 * It demonstrates the UI for reviewing AI proposals but doesn't have actual functionality yet.
 */
export function AIProposalCard({
  proposal,
  onApprove,
  onReject,
  onModify
}: AIProposalCardProps) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Get status color
  const getStatusColor = (status: ProposalStatus): string => {
    switch (status) {
      case ProposalStatus.APPROVED:
        return 'green';
      case ProposalStatus.REJECTED:
        return 'red';
      case ProposalStatus.MODIFIED:
        return 'orange';
      default:
        return 'blue';
    }
  };

  // Get proposal type label
  const getProposalTypeLabel = (type: ProposalType): string => {
    switch (type) {
      case ProposalType.CREATE:
        return 'Create';
      case ProposalType.UPDATE:
        return 'Update';
      case ProposalType.DELETE:
        return 'Delete';
      case ProposalType.RELATIONSHIP:
        return 'Relationship';
      default:
        return 'Unknown';
    }
  };

  // Get entity type label
  const getEntityTypeLabel = (type?: EntityType): string => {
    if (!type) return 'Unknown';
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  // Handle approve button click
  const handleApprove = () => {
    onApprove(proposal.id, feedback);
  };

  // Handle reject button click
  const handleReject = () => {
    onReject(proposal.id, feedback);
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Group>
          <ThemeIcon color="violet" size="lg" radius="xl">
            <IconBrain size={20} />
          </ThemeIcon>
          <Text fw={500}>
            {getProposalTypeLabel(proposal.proposalType)} {getEntityTypeLabel(proposal.entityType)}
          </Text>
        </Group>

        <Badge color={getStatusColor(proposal.status)}>
          {proposal.status}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        AI Confidence: {formatConfidence(proposal.aiConfidence)}
      </Text>

      <Accordion>
        <Accordion.Item value="reasoning">
          <Accordion.Control>
            <Group gap="xs">
              <IconInfoCircle size={16} />
              <Text>AI Reasoning</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">{proposal.aiReasoning}</Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="changes">
          <Accordion.Control>
            <Group gap="xs">
              <IconEdit size={16} />
              <Text>Proposed Changes</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {proposal.changes.map((change, index) => (
                <Card key={index} withBorder p="xs">
                  <Group justify="space-between">
                    <Text fw={500}>{change.fieldName}</Text>
                    <Badge color="blue">
                      {formatConfidence(change.confidence)}
                    </Badge>
                  </Group>

                  <Group mt="xs">
                    <Box style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed">Current Value:</Text>
                      <Text size="sm">{String(change.oldValue)}</Text>
                    </Box>

                    <ThemeIcon variant="light" color="gray">
                      <IconArrowUp size={16} />
                    </ThemeIcon>

                    <Box style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed">Suggested Value:</Text>
                      <Text size="sm">{String(change.newValue)}</Text>
                    </Box>
                  </Group>

                  <Text size="xs" mt="xs">
                    Reasoning: {change.reasoning}
                  </Text>
                </Card>
              ))}

              {proposal.relationshipChanges && proposal.relationshipChanges.length > 0 && (
                <>
                  <Divider label="Relationship Changes" />

                  {proposal.relationshipChanges.map((change, index) => (
                    <Card key={index} withBorder p="xs">
                      <Group justify="space-between">
                        <Text fw={500}>{change.action} Relationship</Text>
                        <Badge color="blue">
                          {formatConfidence(change.confidence)}
                        </Badge>
                      </Group>

                      <Group mt="xs">
                        <Text size="sm">
                          {getEntityTypeLabel(change.sourceEntityType)}
                          {' → '}
                          {change.relationshipType.replace('_', ' ')}
                          {' → '}
                          {getEntityTypeLabel(change.targetEntityType)}
                        </Text>
                      </Group>

                      <Text size="xs" mt="xs">
                        Reasoning: {change.reasoning}
                      </Text>
                    </Card>
                  ))}
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {proposal.status === ProposalStatus.PENDING && (
        <>
          <Divider my="md" />

          <Group>
            <Button
              leftSection={<IconCheck size={16} />}
              color="green"
              onClick={handleApprove}
            >
              Approve
            </Button>

            <Button
              leftSection={<IconX size={16} />}
              color="red"
              variant="outline"
              onClick={handleReject}
            >
              Reject
            </Button>

            <Button
              leftSection={<IconEdit size={16} />}
              variant="subtle"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              Add Feedback
            </Button>
          </Group>

          {showFeedback && (
            <Textarea
              placeholder="Add feedback for the AI..."
              value={feedback}
              onChange={(e) => setFeedback(e.currentTarget.value)}
              minRows={3}
              mt="md"
            />
          )}
        </>
      )}

      {proposal.userFeedback && (
        <>
          <Divider my="md" label="User Feedback" />
          <Text size="sm" style={{ fontStyle: 'italic' }}>{proposal.userFeedback}</Text>
        </>
      )}
    </Card>
  );
}
