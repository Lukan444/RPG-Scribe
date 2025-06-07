import React, { useState, useEffect } from 'react';
import { Container, Stack, Title, Text, Alert, Button, Group, Modal, Select, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertCircle, IconDeviceGamepad2, IconPlus } from '@tabler/icons-react';
import { LivePlayDashboard } from '../components/transcription/LivePlayDashboard';
import { TimelineProvider } from '../contexts/TimelineContext';
import { useRPGWorld } from '../contexts/RPGWorldContext';
import { CampaignService } from '../services/campaign.service';
import { SessionService, Session as ServiceSession } from '../services/session.service';
import { Campaign } from '../models/Campaign';
import { Session } from '../models/Session';
import { EntityType } from '../models/EntityType';
import { notifications } from '@mantine/notifications';

/**
 * Live Play Page Component
 * Wrapper for the LivePlayDashboard that handles session/campaign/world selection
 */
export default function LivePlayPage() {
  const { currentWorld } = useRPGWorld();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  // Load campaigns when world changes
  useEffect(() => {
    if (currentWorld?.id) {
      loadCampaigns();
    }
  }, [currentWorld?.id]);

  // Load sessions when campaign changes
  useEffect(() => {
    if (selectedCampaignId) {
      loadSessions();
    } else {
      setSessions([]);
      setSelectedSessionId('');
    }
  }, [selectedCampaignId]);

  const loadCampaigns = async () => {
    if (!currentWorld?.id) return;

    try {
      setLoading(true);
      const campaignService = new CampaignService();
      const campaignList = await campaignService.getCampaignsByWorld(currentWorld.id);
      setCampaigns(campaignList);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    if (!selectedCampaignId) return;

    try {
      setLoading(true);
      const sessionService = SessionService.getInstance(currentWorld?.id || '', selectedCampaignId);
      const sessionList = await sessionService.listEntities();
      setSessions(sessionList);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!newSessionName.trim() || !selectedCampaignId || !currentWorld?.id) return;

    try {
      setLoading(true);
      const sessionService = SessionService.getInstance(currentWorld.id, selectedCampaignId);

      // Get the next session number
      const existingSessions = await sessionService.listEntities();
      const nextNumber = Math.max(0, ...existingSessions.map(s => s.number || 0)) + 1;

      const newSession: ServiceSession = {
        title: newSessionName.trim(),
        number: nextNumber,
        datePlayed: new Date(),
        status: 'planned',
        summary: '',
        createdBy: currentWorld.id, // Use world ID as creator for now
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sessionId = await sessionService.createEntity(newSession);
      setSelectedSessionId(sessionId);
      setNewSessionName('');
      close();

      // Reload sessions to include the new one
      await loadSessions();

      notifications.show({
        title: 'Session Created',
        message: 'New session created successfully',
        color: 'green'
      });
    } catch (err) {
      console.error('Failed to create session:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to create session',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const startLiveSession = () => {
    if (!selectedSessionId || !selectedCampaignId || !currentWorld?.id) {
      setError('Please select a campaign and session to start live play');
      return;
    }
    setShowDashboard(true);
  };

  const handleSessionEnd = () => {
    setShowDashboard(false);
    notifications.show({
      title: 'Session Ended',
      message: 'Live session has been ended successfully',
      color: 'blue'
    });
  };

  const handleError = (error: Error) => {
    console.error('Live session error:', error);
    notifications.show({
      title: 'Session Error',
      message: error.message,
      color: 'red'
    });
  };

  // If no world is selected, show error
  if (!currentWorld) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="No RPG World Selected" color="yellow">
          Please select an RPG World from the dashboard to use Live Play features.
        </Alert>
      </Container>
    );
  }

  // If dashboard is active, show the LivePlayDashboard
  if (showDashboard && selectedSessionId && selectedCampaignId && currentWorld.id) {
    return (
      <TimelineProvider
        initialConfig={{
          worldId: currentWorld.id,
          campaignId: selectedCampaignId,
          enableEditing: false,
          showControls: false
        }}
      >
        <LivePlayDashboard
          sessionId={selectedSessionId}
          campaignId={selectedCampaignId}
          worldId={currentWorld.id}
          onSessionEnd={handleSessionEnd}
          onError={handleError}
        />
      </TimelineProvider>
    );
  }

  // Show session selection interface
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group gap="md">
          <IconDeviceGamepad2 size="2rem" />
          <div>
            <Title order={2}>Live Play</Title>
            <Text c="dimmed">Tools for running live game sessions with real-time transcription</Text>
          </div>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack gap="md">
          <Select
            label="Select Campaign"
            placeholder="Choose a campaign for your live session"
            data={campaigns.map(campaign => ({
              value: campaign.id || '',
              label: campaign.name || 'Unnamed Campaign'
            }))}
            value={selectedCampaignId}
            onChange={(value) => setSelectedCampaignId(value || '')}
            disabled={loading}
          />

          {selectedCampaignId && (
            <Group align="flex-end" gap="md">
              <Select
                label="Select Session"
                placeholder="Choose an existing session or create a new one"
                data={sessions.map(session => ({
                  value: session.id || '',
                  label: session.title || `Session #${session.number}` || 'Unnamed Session'
                }))}
                value={selectedSessionId}
                onChange={(value) => setSelectedSessionId(value || '')}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconPlus size="1rem" />}
                variant="light"
                onClick={open}
                disabled={loading}
              >
                New Session
              </Button>
            </Group>
          )}

          {selectedSessionId && selectedCampaignId && (
            <Button
              size="lg"
              onClick={startLiveSession}
              disabled={loading}
              leftSection={<IconDeviceGamepad2 size="1.2rem" />}
            >
              Start Live Session
            </Button>
          )}
        </Stack>

        {/* New Session Modal */}
        <Modal opened={opened} onClose={close} title="Create New Session">
          <Stack gap="md">
            <TextInput
              label="Session Name"
              placeholder="Enter session name"
              value={newSessionName}
              onChange={(event) => setNewSessionName(event.currentTarget.value)}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="light" onClick={close}>
                Cancel
              </Button>
              <Button
                onClick={createNewSession}
                disabled={!newSessionName.trim() || loading}
              >
                Create Session
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
