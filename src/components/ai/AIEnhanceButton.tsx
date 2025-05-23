import { useState } from 'react';
import { Button, Tooltip, Modal, Text, Group, Stack, Loader } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { EntityType } from '../../models/Relationship';

/**
 * AI Enhance Button props
 */
interface AIEnhanceButtonProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  disabled?: boolean;
  onEnhanceComplete?: () => void;
}

/**
 * AIEnhanceButton component - Button to trigger AI analysis and suggestions
 * 
 * This is a placeholder component for future AI Brain integration.
 * It demonstrates the UI for triggering AI analysis but doesn't have actual functionality yet.
 */
export function AIEnhanceButton({
  entityId,
  entityType,
  entityName,
  disabled = false,
  onEnhanceComplete
}: AIEnhanceButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhanceComplete, setEnhanceComplete] = useState(false);
  
  // Handle enhance button click
  const handleEnhance = () => {
    setModalOpen(true);
    setLoading(true);
    setError(null);
    setEnhanceComplete(false);
    
    // Simulate AI analysis
    setTimeout(() => {
      setLoading(false);
      setEnhanceComplete(true);
      
      // In a real implementation, this would call an API to trigger AI analysis
      console.log(`AI analysis triggered for ${entityType} ${entityId} (${entityName})`);
    }, 2000);
  };
  
  // Handle modal close
  const handleClose = () => {
    setModalOpen(false);
    
    if (enhanceComplete && onEnhanceComplete) {
      onEnhanceComplete();
    }
  };
  
  return (
    <>
      <Tooltip label="Analyze with AI and suggest improvements">
        <Button
          leftSection={<IconBrain size={16} />}
          variant="light"
          color="violet"
          onClick={handleEnhance}
          disabled={disabled}
        >
          AI Enhance
        </Button>
      </Tooltip>
      
      <Modal
        opened={modalOpen}
        onClose={handleClose}
        title="AI Enhancement"
        size="md"
      >
        <Stack>
          {loading ? (
            <Group justify="center" p="xl">
              <Stack align="center">
                <Loader size="lg" />
                <Text>Analyzing {entityType.toLowerCase()} "{entityName}"...</Text>
                <Text size="sm" c="dimmed">
                  The AI is analyzing this {entityType.toLowerCase()} and generating suggestions.
                  This may take a few moments.
                </Text>
              </Stack>
            </Group>
          ) : error ? (
            <Text c="red">{error}</Text>
          ) : enhanceComplete ? (
            <Stack>
              <Text>
                Analysis complete! The AI has generated suggestions for "{entityName}".
              </Text>
              <Text size="sm" c="dimmed">
                You can review and approve these suggestions in the AI Proposals section.
              </Text>
              <Button onClick={handleClose} mt="md">
                View Proposals
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </Modal>
    </>
  );
}
