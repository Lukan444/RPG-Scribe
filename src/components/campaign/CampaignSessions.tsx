import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Group,
  Text,
  Title,
  SimpleGrid,
  Badge,
  Center,
  Stack,
  ThemeIcon,
  Loader,
  SegmentedControl,
  Table,
  rem
} from '@mantine/core';
import { keyframes } from '@emotion/react';
import {
  IconCalendarEvent,
  IconPlus,
  IconTable,
  IconLayoutGrid,
  IconArticle
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import { SessionService } from '../../services/session.service';
import { orderBy } from 'firebase/firestore';
import { EntityCardGrid } from '../common/EntityCardGrid';
import { EntityTable } from '../common/EntityTable';

// Define the keyframes for the pulsing animation
const pulseAnimation = keyframes({
  '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
  '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' },
});

interface CampaignSessionsProps {
  campaignId: string;
  worldId?: string;
}

export function CampaignSessions({ campaignId, worldId }: CampaignSessionsProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('grid');

  // Fetch sessions for the campaign
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create a session service instance for this campaign
        const sessionService = SessionService.getInstance(worldId || '', campaignId);

        // Get all sessions for this campaign using query
        const { data: sessionsData } = await sessionService.query(
          [orderBy('number', 'desc')],
          100
        );

        // Process sessions to ensure dates are properly formatted
        const processedSessions = sessionsData.map(session => ({
          ...session,
          // Convert Firestore timestamp to JavaScript Date if it exists
          datePlayed: session.datePlayed && session.datePlayed.toDate ? session.datePlayed.toDate() : session.datePlayed,
          createdAt: session.createdAt && session.createdAt.toDate ? session.createdAt.toDate() : session.createdAt,
          updatedAt: session.updatedAt && session.updatedAt.toDate ? session.updatedAt.toDate() : session.updatedAt
        }));

        setSessions(processedSessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [campaignId, worldId]);

  // Handle create session
  const handleCreateSession = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/sessions/new`);
    } else {
      navigate(`/campaigns/${campaignId}/sessions/new`);
    }
  };

  // Handle view session
  const handleViewSession = (sessionId: string) => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/sessions/${sessionId}`);
    } else {
      navigate(`/campaigns/${campaignId}/sessions/${sessionId}`);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'number',
      title: '#',
      sortable: true,
      render: (session: any) => (
        <Text>{session.number || 'N/A'}</Text>
      )
    },
    {
      key: 'title',
      title: 'Name',
      sortable: true,
      render: (session: any) => (
        <Text>{session.title || 'Untitled Session'}</Text>
      )
    },
    {
      key: 'datePlayed',
      title: 'Date',
      sortable: true,
      render: (session: any) => (
        <Text>{session.datePlayed ? new Date(session.datePlayed).toLocaleDateString() : 'N/A'}</Text>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (session: any) => (
        <Badge color={session.status === 'completed' ? 'green' : session.status === 'planned' ? 'blue' : 'yellow'}>
          {session.status || 'planned'}
        </Badge>
      )
    },
    {
      key: 'relationshipCount',
      title: 'Relationships',
      sortable: true
    }
  ];

  // Render empty state
  const renderEmptyState = () => (
    <Center py={50}>
      <Stack align="center" gap="md">
        <ThemeIcon size={60} radius={30} color="gray.3">
          <IconCalendarEvent style={{ width: '30px', height: '30px', color: 'var(--mantine-color-gray-6)' }} />
        </ThemeIcon>
        <Title order={3}>No Sessions</Title>
        <Text c="dimmed">Create your first session to track your campaign's progress</Text>
        <Button
          leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
          onClick={handleCreateSession}
          style={{
            animation: `${pulseAnimation} 2s infinite`,
            transition: 'all 0.3s ease',
            '&:hover': {
              animation: 'none',
              transform: 'scale(1.05)'
            }
          }}
        >
          Create Session
        </Button>
      </Stack>
    </Center>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Sessions</Title>
        <Group>
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            data={[
              {
                value: 'grid',
                label: (
                  <Group gap={5}>
                    <IconLayoutGrid size={16} />
                    <Box>Grid</Box>
                  </Group>
                ),
              },
              {
                value: 'table',
                label: (
                  <Group gap={5}>
                    <IconTable size={16} />
                    <Box>Table</Box>
                  </Group>
                ),
              },
              {
                value: 'article',
                label: (
                  <Group gap={5}>
                    <IconArticle size={16} />
                    <Box>Article</Box>
                  </Group>
                ),
              },
            ]}
          />
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateSession}
          >
            Create Session
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading sessions...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius={30} color="red.3">
              <IconCalendarEvent style={{ width: '30px', height: '30px', color: 'var(--mantine-color-red-6)' }} />
            </ThemeIcon>
            <Title order={3}>Error Loading Sessions</Title>
            <Text c="dimmed">{error}</Text>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Stack>
        </Center>
      ) : sessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {viewMode === 'grid' && (
            <EntityCardGrid
              data={sessions}
              entityType={EntityType.SESSION}
              onView={handleViewSession}
              loading={loading}
              error={error}
              showRelationshipCounts={true}
              campaignId={campaignId}
              worldId={worldId}
            />
          )}

          {viewMode === 'table' && (
            <EntityTable
              data={sessions}
              columns={columns}
              entityType={EntityType.SESSION}
              onView={handleViewSession}
              loading={loading}
              error={error}
              showRelationshipCounts={true}
              campaignId={campaignId}
              worldId={worldId}
            />
          )}

          {viewMode === 'article' && (
            <Box>
              <Text c="dimmed">Article view will be implemented in the next phase.</Text>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}

export default CampaignSessions;
