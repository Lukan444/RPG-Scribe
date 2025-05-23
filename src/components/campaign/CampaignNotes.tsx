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
  IconNote,
  IconPlus,
  IconTable,
  IconLayoutGrid,
  IconArticle
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import { EntityCardGrid } from '../common/EntityCardGrid';
import { EntityTable } from '../common/EntityTable';

// Define the keyframes for the pulsing animation
const pulseAnimation = keyframes({
  '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
  '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' },
});

interface CampaignNotesProps {
  campaignId: string;
  worldId?: string;
}

export function CampaignNotes({ campaignId, worldId }: CampaignNotesProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('grid');

  // Fetch notes for the campaign
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, this would fetch notes from Firestore
        // For now, we'll just simulate loading and return an empty array
        setTimeout(() => {
          setNotes([]);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again.');
        setLoading(false);
      }
    };

    fetchNotes();
  }, [campaignId, worldId]);

  // Handle create note
  const handleCreateNote = () => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/notes/new`);
    } else {
      navigate(`/campaigns/${campaignId}/notes/new`);
    }
  };

  // Handle view note
  const handleViewNote = (noteId: string) => {
    if (worldId) {
      navigate(`/rpg-worlds/${worldId}/campaigns/${campaignId}/notes/${noteId}`);
    } else {
      navigate(`/campaigns/${campaignId}/notes/${noteId}`);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'title',
      title: 'Title',
      sortable: true
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      render: (note: any) => (
        <Badge color="blue">{note.category || 'General'}</Badge>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (note: any) => (
        <Text>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}</Text>
      )
    },
    {
      key: 'updatedAt',
      title: 'Updated',
      sortable: true,
      render: (note: any) => (
        <Text>{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'N/A'}</Text>
      )
    }
  ];

  // Render empty state
  const renderEmptyState = () => (
    <Center py={50}>
      <Stack align="center" gap="md">
        <ThemeIcon size={60} radius={30} color="gray.3">
          <IconNote style={{ width: '30px', height: '30px', color: 'var(--mantine-color-gray-6)' }} />
        </ThemeIcon>
        <Title order={3}>No Notes</Title>
        <Text c="dimmed">Create your first note to document your campaign</Text>
        <Button
          leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
          onClick={handleCreateNote}
          style={{
            animation: `${pulseAnimation} 2s infinite`,
            transition: 'all 0.3s ease',
            '&:hover': {
              animation: 'none',
              transform: 'scale(1.05)'
            }
          }}
        >
          Create Note
        </Button>
      </Stack>
    </Center>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Notes</Title>
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
            onClick={handleCreateNote}
          >
            Create Note
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading notes...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Center py={50}>
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius={30} color="red.3">
              <IconNote style={{ width: '30px', height: '30px', color: 'var(--mantine-color-red-6)' }} />
            </ThemeIcon>
            <Title order={3}>Error Loading Notes</Title>
            <Text c="dimmed">{error}</Text>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Stack>
        </Center>
      ) : notes.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {viewMode === 'grid' && (
            <EntityCardGrid
              data={notes}
              entityType={EntityType.NOTE}
              onView={handleViewNote}
              loading={loading}
              error={error}
            />
          )}

          {viewMode === 'table' && (
            <EntityTable
              data={notes}
              columns={columns}
              entityType={EntityType.NOTE}
              onView={handleViewNote}
              loading={loading}
              error={error}
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

export default CampaignNotes;
