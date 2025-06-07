/**
 * Player Collaboration Interface
 * 
 * Enables real-time collaboration on transcription segments
 * Supports moment flagging, proposals, and review workflows
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Stack,
  Badge,
  Card,
  Tooltip,
  Modal,
  Textarea,
  Select,
  Switch,
  Avatar,
  Divider,
  ScrollArea,
  Alert,
  Loader,
  Center,
  Tabs,
  NumberInput,
  ColorPicker,
  Menu,
  TextInput
} from '@mantine/core';
import {
  IconUsers,
  IconFlag,
  IconMessage,
  IconThumbUp,
  IconThumbDown,
  IconEdit,
  IconTrash,
  IconShare,
  IconClock,
  IconCheck,
  IconX,
  IconPlus,
  IconEye,
  IconEyeOff,
  IconStar,
  IconStarFilled,
  IconBell,
  IconBellOff
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { TranscriptionSegment } from '../../models/Transcription';

/**
 * Collaboration proposal types
 */
export enum ProposalType {
  MOMENT_FLAG = 'moment_flag',
  SEGMENT_EDIT = 'segment_edit',
  BOOKMARK_ADD = 'bookmark_add',
  TIMELINE_EVENT = 'timeline_event',
  SPEAKER_CORRECTION = 'speaker_correction'
}

/**
 * Proposal status
 */
export enum ProposalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review'
}

/**
 * Collaboration proposal
 */
export interface CollaborationProposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  proposedBy: string;
  proposedAt: Date;
  status: ProposalStatus;
  segmentId?: string;
  segment?: TranscriptionSegment;
  originalData?: any;
  proposedData?: any;
  votes: ProposalVote[];
  comments: ProposalComment[];
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

/**
 * Proposal vote
 */
export interface ProposalVote {
  id: string;
  proposalId: string;
  userId: string;
  userName: string;
  vote: 'approve' | 'reject' | 'abstain';
  comment?: string;
  votedAt: Date;
}

/**
 * Proposal comment
 */
export interface ProposalComment {
  id: string;
  proposalId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  isReply?: boolean;
  replyToId?: string;
}

/**
 * Player info
 */
export interface PlayerInfo {
  id: string;
  name: string;
  avatar?: string;
  role: 'player' | 'dm' | 'observer';
  isOnline: boolean;
  lastSeen: Date;
  permissions: {
    canPropose: boolean;
    canVote: boolean;
    canReview: boolean;
    canEdit: boolean;
  };
}

/**
 * Player Collaboration Interface Props
 */
export interface PlayerCollaborationInterfaceProps {
  sessionId: string;
  transcriptionId: string;
  segments: TranscriptionSegment[];
  proposals?: CollaborationProposal[];
  players?: PlayerInfo[];
  currentUserId: string;
  enableVoting?: boolean;
  enableComments?: boolean;
  enableNotifications?: boolean;
  onProposalCreate?: (proposal: Omit<CollaborationProposal, 'id' | 'proposedAt' | 'votes' | 'comments'>) => void;
  onProposalVote?: (proposalId: string, vote: 'approve' | 'reject' | 'abstain', comment?: string) => void;
  onProposalReview?: (proposalId: string, status: ProposalStatus, notes?: string) => void;
  onCommentAdd?: (proposalId: string, comment: string, replyToId?: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Player Collaboration Interface Component
 */
export function PlayerCollaborationInterface({
  sessionId,
  transcriptionId,
  segments,
  proposals: initialProposals = [],
  players: initialPlayers = [],
  currentUserId,
  enableVoting = true,
  enableComments = true,
  enableNotifications = true,
  onProposalCreate,
  onProposalVote,
  onProposalReview,
  onCommentAdd,
  className,
  style
}: PlayerCollaborationInterfaceProps) {
  // State management
  const [proposals, setProposals] = useState<CollaborationProposal[]>(initialProposals);
  const [players, setPlayers] = useState<PlayerInfo[]>(initialPlayers);
  const [activeTab, setActiveTab] = useState<string>('proposals');
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | ''>('');
  const [filterType, setFilterType] = useState<ProposalType | ''>('');

  // Modal state
  const [isCreateModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [isReviewModalOpen, { open: openReviewModal, close: closeReviewModal }] = useDisclosure(false);
  const [selectedSegment, setSelectedSegment] = useState<TranscriptionSegment | null>(null);
  const [reviewingProposal, setReviewingProposal] = useState<CollaborationProposal | null>(null);

  // Form state
  const [proposalForm, setProposalForm] = useState({
    type: ProposalType.MOMENT_FLAG,
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[]
  });

  const [reviewForm, setReviewForm] = useState({
    status: ProposalStatus.APPROVED,
    notes: ''
  });

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Get current player info
  const currentPlayer = players.find(p => p.id === currentUserId);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    let filtered = [...proposals];

    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterType) {
      filtered = filtered.filter(p => p.type === filterType);
    }

    return filtered.sort((a, b) => b.proposedAt.getTime() - a.proposedAt.getTime());
  }, [proposals, filterStatus, filterType]);

  // Create proposal
  const createProposal = useCallback(async () => {
    if (!selectedSegment || !proposalForm.title.trim()) return;

    const newProposal: Omit<CollaborationProposal, 'id' | 'proposedAt' | 'votes' | 'comments'> = {
      type: proposalForm.type,
      title: proposalForm.title,
      description: proposalForm.description,
      proposedBy: currentUserId,
      status: ProposalStatus.PENDING,
      segmentId: selectedSegment.id,
      segment: selectedSegment,
      priority: proposalForm.priority,
      tags: proposalForm.tags
    };

    try {
      await onProposalCreate?.(newProposal);
      
      // Add to local state
      const proposal: CollaborationProposal = {
        ...newProposal,
        id: `proposal_${Date.now()}`,
        proposedAt: new Date(),
        votes: [],
        comments: []
      };
      
      setProposals(prev => [proposal, ...prev]);
      
      notifications.show({
        title: 'Success',
        message: 'Proposal created successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      closeCreateModal();
      resetProposalForm();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create proposal',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  }, [selectedSegment, proposalForm, currentUserId, onProposalCreate, closeCreateModal]);

  // Vote on proposal
  const voteOnProposal = useCallback(async (
    proposal: CollaborationProposal,
    vote: 'approve' | 'reject' | 'abstain',
    comment?: string
  ) => {
    try {
      await onProposalVote?.(proposal.id, vote, comment);
      
      // Update local state
      const newVote: ProposalVote = {
        id: `vote_${Date.now()}`,
        proposalId: proposal.id,
        userId: currentUserId,
        userName: currentPlayer?.name || 'Unknown',
        vote,
        comment,
        votedAt: new Date()
      };

      setProposals(prev => prev.map(p =>
        p.id === proposal.id
          ? { ...p, votes: [...p.votes.filter(v => v.userId !== currentUserId), newVote] }
          : p
      ));

      notifications.show({
        title: 'Vote Recorded',
        message: `Your ${vote} vote has been recorded`,
        color: 'blue',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to record vote',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  }, [onProposalVote, currentUserId, currentPlayer]);

  // Review proposal (DM only)
  const reviewProposal = useCallback(async () => {
    if (!reviewingProposal) return;

    try {
      await onProposalReview?.(reviewingProposal.id, reviewForm.status, reviewForm.notes);
      
      // Update local state
      setProposals(prev => prev.map(p =>
        p.id === reviewingProposal.id
          ? {
              ...p,
              status: reviewForm.status,
              reviewedBy: currentUserId,
              reviewedAt: new Date(),
              reviewNotes: reviewForm.notes
            }
          : p
      ));

      notifications.show({
        title: 'Review Complete',
        message: 'Proposal review has been saved',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      closeReviewModal();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save review',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  }, [reviewingProposal, reviewForm, currentUserId, onProposalReview, closeReviewModal]);

  // Add comment
  const addComment = useCallback(async (proposalId: string) => {
    if (!commentText.trim()) return;

    try {
      await onCommentAdd?.(proposalId, commentText.trim(), replyingTo || undefined);
      
      // Add to local state
      const comment: ProposalComment = {
        id: `comment_${Date.now()}`,
        proposalId,
        userId: currentUserId,
        userName: currentPlayer?.name || 'Unknown',
        text: commentText.trim(),
        createdAt: new Date(),
        isReply: !!replyingTo,
        replyToId: replyingTo || undefined
      };

      setProposals(prev => prev.map(p =>
        p.id === proposalId
          ? { ...p, comments: [...p.comments, comment] }
          : p
      ));

      setCommentText('');
      setReplyingTo(null);

      notifications.show({
        title: 'Comment Added',
        message: 'Your comment has been posted',
        color: 'blue',
        icon: <IconMessage size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add comment',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  }, [commentText, replyingTo, currentUserId, currentPlayer, onCommentAdd]);

  // Reset proposal form
  const resetProposalForm = () => {
    setProposalForm({
      type: ProposalType.MOMENT_FLAG,
      title: '',
      description: '',
      priority: 'medium',
      tags: []
    });
    setSelectedSegment(null);
  };

  // Get proposal type label
  const getProposalTypeLabel = (type: ProposalType): string => {
    switch (type) {
      case ProposalType.MOMENT_FLAG: return 'Moment Flag';
      case ProposalType.SEGMENT_EDIT: return 'Segment Edit';
      case ProposalType.BOOKMARK_ADD: return 'Add Bookmark';
      case ProposalType.TIMELINE_EVENT: return 'Timeline Event';
      case ProposalType.SPEAKER_CORRECTION: return 'Speaker Correction';
      default: return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = (status: ProposalStatus): string => {
    switch (status) {
      case ProposalStatus.APPROVED: return 'green';
      case ProposalStatus.REJECTED: return 'red';
      case ProposalStatus.UNDER_REVIEW: return 'blue';
      default: return 'gray';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      default: return 'gray';
    }
  };

  // Check if user can vote
  const canVote = (proposal: CollaborationProposal): boolean => {
    return !!(enableVoting &&
           currentPlayer?.permissions.canVote &&
           proposal.proposedBy !== currentUserId &&
           proposal.status === ProposalStatus.PENDING &&
           !proposal.votes.some(v => v.userId === currentUserId));
  };

  // Check if user can review
  const canReview = (proposal: CollaborationProposal): boolean => {
    return !!(currentPlayer?.permissions.canReview &&
           proposal.status === ProposalStatus.PENDING);
  };

  return (
    <Paper p="md" withBorder className={className} style={style}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconUsers size={20} />
            <Title order={4}>Player Collaboration</Title>
            <Badge variant="light">
              {proposals.filter(p => p.status === ProposalStatus.PENDING).length} pending
            </Badge>
          </Group>
          
          <Group gap="xs">
            {currentPlayer?.permissions.canPropose && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  if (segments.length > 0) {
                    setSelectedSegment(segments[0]);
                    openCreateModal();
                  }
                }}
                disabled={segments.length === 0}
              >
                New Proposal
              </Button>
            )}
          </Group>
        </Group>

        {/* Online Players */}
        <Card withBorder p="sm">
          <Group gap="sm">
            <Text size="sm" fw={500}>Online Players:</Text>
            {players.filter(p => p.isOnline).map(player => (
              <Tooltip key={player.id} label={`${player.name} (${player.role})`}>
                <Avatar size="sm" src={player.avatar} name={player.name}>
                  {player.name.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
            {players.filter(p => p.isOnline).length === 0 && (
              <Text size="sm" c="dimmed">No players online</Text>
            )}
          </Group>
        </Card>

        {/* Filters */}
        <Group gap="md">
          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All Statuses' },
              { value: ProposalStatus.PENDING, label: 'Pending' },
              { value: ProposalStatus.APPROVED, label: 'Approved' },
              { value: ProposalStatus.REJECTED, label: 'Rejected' },
              { value: ProposalStatus.UNDER_REVIEW, label: 'Under Review' }
            ]}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as ProposalStatus | '')}
            style={{ width: 150 }}
          />
          
          <Select
            placeholder="Filter by type"
            data={[
              { value: '', label: 'All Types' },
              { value: ProposalType.MOMENT_FLAG, label: 'Moment Flag' },
              { value: ProposalType.SEGMENT_EDIT, label: 'Segment Edit' },
              { value: ProposalType.BOOKMARK_ADD, label: 'Add Bookmark' },
              { value: ProposalType.TIMELINE_EVENT, label: 'Timeline Event' },
              { value: ProposalType.SPEAKER_CORRECTION, label: 'Speaker Correction' }
            ]}
            value={filterType}
            onChange={(value) => setFilterType(value as ProposalType | '')}
            style={{ width: 150 }}
          />
        </Group>

        {/* Proposals List */}
        <ScrollArea style={{ height: 500 }}>
          {filteredProposals.length === 0 ? (
            <Center style={{ height: 200 }}>
              <Stack align="center" gap="md">
                <IconUsers size={48} color="gray" />
                <Text c="dimmed">No proposals found</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="md">
              {filteredProposals.map((proposal) => {
                const userVote = proposal.votes.find(v => v.userId === currentUserId);
                const approveVotes = proposal.votes.filter(v => v.vote === 'approve').length;
                const rejectVotes = proposal.votes.filter(v => v.vote === 'reject').length;

                return (
                  <Card key={proposal.id} withBorder p="md">
                    <Stack gap="sm">
                      {/* Proposal Header */}
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Badge variant="light">{getProposalTypeLabel(proposal.type)}</Badge>
                          <Badge color={getStatusColor(proposal.status)} variant="filled">
                            {proposal.status.toUpperCase()}
                          </Badge>
                          <Badge color={getPriorityColor(proposal.priority)} size="xs">
                            {proposal.priority}
                          </Badge>
                        </Group>
                        
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            by {players.find(p => p.id === proposal.proposedBy)?.name || 'Unknown'}
                          </Text>
                          {canReview(proposal) && (
                            <ActionIcon
                              size="sm"
                              variant="light"
                              onClick={() => {
                                setReviewingProposal(proposal);
                                openReviewModal();
                              }}
                            >
                              <IconEye size={12} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Group>

                      {/* Proposal Content */}
                      <Stack gap="xs">
                        <Text fw={500}>{proposal.title}</Text>
                        {proposal.description && (
                          <Text size="sm" c="dimmed">{proposal.description}</Text>
                        )}
                      </Stack>

                      {/* Voting */}
                      {enableVoting && proposal.status === ProposalStatus.PENDING && (
                        <Group gap="md">
                          <Group gap="xs">
                            <IconThumbUp size={16} color="green" />
                            <Text size="sm">{approveVotes}</Text>
                          </Group>
                          <Group gap="xs">
                            <IconThumbDown size={16} color="red" />
                            <Text size="sm">{rejectVotes}</Text>
                          </Group>
                          
                          {canVote(proposal) && (
                            <Group gap="xs">
                              <Button
                                size="xs"
                                color="green"
                                variant="light"
                                onClick={() => voteOnProposal(proposal, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="xs"
                                color="red"
                                variant="light"
                                onClick={() => voteOnProposal(proposal, 'reject')}
                              >
                                Reject
                              </Button>
                            </Group>
                          )}
                          
                          {userVote && (
                            <Badge size="xs" color={userVote.vote === 'approve' ? 'green' : 'red'}>
                              You voted: {userVote.vote}
                            </Badge>
                          )}
                        </Group>
                      )}

                      {/* Comments */}
                      {enableComments && proposal.comments.length > 0 && (
                        <Stack gap="xs">
                          <Divider />
                          {proposal.comments.slice(0, 2).map((comment) => (
                            <Group key={comment.id} gap="sm" align="flex-start">
                              <Avatar size="xs" name={comment.userName}>
                                {comment.userName.charAt(0)}
                              </Avatar>
                              <Stack gap={0} style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text size="xs" fw={500}>{comment.userName}</Text>
                                  <Text size="xs" c="dimmed">
                                    {comment.createdAt.toLocaleTimeString()}
                                  </Text>
                                </Group>
                                <Text size="xs">{comment.text}</Text>
                              </Stack>
                            </Group>
                          ))}
                          
                          {proposal.comments.length > 2 && (
                            <Text size="xs" c="dimmed">
                              +{proposal.comments.length - 2} more comments
                            </Text>
                          )}
                          
                          {/* Add Comment */}
                          <Group gap="xs">
                            <TextInput
                              placeholder="Add a comment..."
                              value={commentText}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCommentText(event.currentTarget.value)}
                              style={{ flex: 1 }}
                              size="xs"
                            />
                            <ActionIcon
                              size="sm"
                              onClick={() => addComment(proposal.id)}
                              disabled={!commentText.trim()}
                            >
                              <IconMessage size={12} />
                            </ActionIcon>
                          </Group>
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </ScrollArea>
      </Stack>

      {/* Create Proposal Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create Proposal"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Proposal Type"
            value={proposalForm.type}
            onChange={(value) => setProposalForm(prev => ({
              ...prev,
              type: value as ProposalType
            }))}
            data={[
              { value: ProposalType.MOMENT_FLAG, label: 'Moment Flag' },
              { value: ProposalType.SEGMENT_EDIT, label: 'Segment Edit' },
              { value: ProposalType.BOOKMARK_ADD, label: 'Add Bookmark' },
              { value: ProposalType.TIMELINE_EVENT, label: 'Timeline Event' },
              { value: ProposalType.SPEAKER_CORRECTION, label: 'Speaker Correction' }
            ]}
          />
          
          <TextInput
            label="Title"
            value={proposalForm.title}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProposalForm(prev => ({
              ...prev,
              title: event.currentTarget.value
            }))}
            required
          />
          
          <Textarea
            label="Description"
            value={proposalForm.description}
            onChange={(event) => setProposalForm(prev => ({
              ...prev,
              description: event.currentTarget.value
            }))}
            minRows={3}
          />
          
          <Select
            label="Priority"
            value={proposalForm.priority}
            onChange={(value) => setProposalForm(prev => ({
              ...prev,
              priority: value as 'low' | 'medium' | 'high'
            }))}
            data={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button onClick={createProposal}>
              Create Proposal
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Review Proposal Modal */}
      <Modal
        opened={isReviewModalOpen}
        onClose={closeReviewModal}
        title="Review Proposal"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Decision"
            value={reviewForm.status}
            onChange={(value) => setReviewForm(prev => ({
              ...prev,
              status: value as ProposalStatus
            }))}
            data={[
              { value: ProposalStatus.APPROVED, label: 'Approve' },
              { value: ProposalStatus.REJECTED, label: 'Reject' },
              { value: ProposalStatus.UNDER_REVIEW, label: 'Under Review' }
            ]}
          />
          
          <Textarea
            label="Review Notes"
            value={reviewForm.notes}
            onChange={(event) => setReviewForm(prev => ({
              ...prev,
              notes: event.currentTarget.value
            }))}
            minRows={3}
            placeholder="Optional notes about your decision..."
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closeReviewModal}>
              Cancel
            </Button>
            <Button onClick={reviewProposal}>
              Save Review
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
