# AI Brain Implementation with Mantine

## Overview

This document outlines the implementation plan for the AI Brain module of the RPG Archivist application using Mantine. The AI Brain provides intelligent assistance for campaign management, including proposal review, storytelling, and generation tools.

## Component Architecture

The AI Brain consists of the following main components:

1. **AIBrainLayout**: The overall layout of the AI Brain module
2. **ReviewQueue**: A queue of AI-generated proposals for review
3. **StoryTellingMode**: A guided storytelling experience
4. **GenerationTools**: Tools for generating content
5. **VoiceInput**: Voice input component for the AI Brain

### Component Hierarchy

```
AIBrainLayout
├── Tabs
│   ├── ReviewQueue
│   │   └── ProposalCard
│   ├── StoryTellingMode
│   │   ├── SessionSummary
│   │   ├── FollowUpQuestions
│   │   └── VoiceInput
│   └── GenerationTools
│       └── ToolCard
└── AIBrainContext
```

## AI Brain Layout

The AI Brain layout uses Mantine's `Tabs` component to create a tabbed interface for the different AI Brain features.

### Implementation

```tsx
// src/pages/AIBrain/AIBrainLayout.tsx
import { useState } from 'react';
import { Tabs, Title, Box, useMantineTheme } from '@mantine/core';
import { IconInbox, IconMessageChatbot, IconTools } from '@tabler/icons-react';
import ReviewQueue from './ReviewQueue';
import StoryTellingMode from './StoryTellingMode';
import GenerationTools from './GenerationTools';
import { AIBrainProvider } from '../../contexts/AIBrainContext';

function AIBrainLayout() {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('review');

  return (
    <AIBrainProvider>
      <Box p="md">
        <Title order={2} mb="lg">AI Brain</Title>
        
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="review"
              leftSection={<IconInbox size="1rem" />}
              color="teal"
            >
              Review Queue
            </Tabs.Tab>
            <Tabs.Tab
              value="storytelling"
              leftSection={<IconMessageChatbot size="1rem" />}
              color="teal"
            >
              Story-Telling Mode
            </Tabs.Tab>
            <Tabs.Tab
              value="tools"
              leftSection={<IconTools size="1rem" />}
              color="teal"
            >
              Generation Tools
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="review" pt="xl">
            <ReviewQueue />
          </Tabs.Panel>

          <Tabs.Panel value="storytelling" pt="xl">
            <StoryTellingMode />
          </Tabs.Panel>

          <Tabs.Panel value="tools" pt="xl">
            <GenerationTools />
          </Tabs.Panel>
        </Tabs>
      </Box>
    </AIBrainProvider>
  );
}

export default AIBrainLayout;
```

## Review Queue

The Review Queue component displays a list of AI-generated proposals for review.

### Implementation

```tsx
// src/pages/AIBrain/ReviewQueue.tsx
import { useState } from 'react';
import { Stack, Text, Group, Button, Badge, Select } from '@mantine/core';
import ProposalCard from './ProposalCard';
import { useAIBrain } from '../../contexts/AIBrainContext';

function ReviewQueue() {
  const { proposals, approveProposal, rejectProposal, mergeProposal } = useAIBrain();
  const [filter, setFilter] = useState('all');

  // Filter proposals based on filter
  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;
    return proposal.type === filter;
  });

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Text size="lg" fw={700}>
          Pending Proposals ({filteredProposals.length})
        </Text>
        <Select
          placeholder="Filter by type"
          value={filter}
          onChange={(value) => setFilter(value || 'all')}
          data={[
            { value: 'all', label: 'All Types' },
            { value: 'character', label: 'Character' },
            { value: 'relationship', label: 'Relationship' },
            { value: 'event', label: 'Event' },
            { value: 'location', label: 'Location' },
            { value: 'item', label: 'Item' },
          ]}
          sx={{ width: 200 }}
        />
      </Group>

      {filteredProposals.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No pending proposals. The AI will generate proposals as you use the application.
        </Text>
      ) : (
        <Stack spacing="md">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onApprove={() => approveProposal(proposal.id)}
              onReject={() => rejectProposal(proposal.id)}
              onMerge={() => mergeProposal(proposal.id)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default ReviewQueue;
```

## Proposal Card

The Proposal Card component displays a single AI-generated proposal.

### Implementation

```tsx
// src/pages/AIBrain/ProposalCard.tsx
import { Card, Text, Group, Button, Badge, Stack, Collapse, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence: number;
  details: string;
  affectedEntities: {
    id: string;
    name: string;
    type: string;
  }[];
}

interface ProposalCardProps {
  proposal: Proposal;
  onApprove: () => void;
  onReject: () => void;
  onMerge: () => void;
}

function ProposalCard({ proposal, onApprove, onReject, onMerge }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'teal';
      case 'relationship':
        return 'violet';
      case 'event':
        return 'green';
      case 'location':
        return 'blue';
      case 'item':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.5) return 'yellow';
    return 'red';
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Stack spacing="sm">
        <Group position="apart">
          <Group>
            <Text fw={700}>{proposal.title}</Text>
            <Badge color={getTypeColor(proposal.type)}>
              {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)}
            </Badge>
            <Badge color={getConfidenceColor(proposal.confidence)}>
              {Math.round(proposal.confidence * 100)}% Confidence
            </Badge>
          </Group>
          <ActionIcon onClick={() => setExpanded(!expanded)}>
            {expanded ? <IconChevronDown size="1.125rem" /> : <IconChevronRight size="1.125rem" />}
          </ActionIcon>
        </Group>

        <Text size="sm">{proposal.description}</Text>

        <Collapse in={expanded}>
          <Stack spacing="sm" mt="md">
            <Text size="sm" fw={700}>Details:</Text>
            <Text size="sm">{proposal.details}</Text>

            {proposal.affectedEntities.length > 0 && (
              <>
                <Text size="sm" fw={700} mt="sm">Affected Entities:</Text>
                <Stack spacing="xs">
                  {proposal.affectedEntities.map((entity) => (
                    <Group key={entity.id} position="apart">
                      <Text size="sm">{entity.name}</Text>
                      <Badge size="sm" variant="outline" color={getTypeColor(entity.type)}>
                        {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </Collapse>

        <Group position="right" mt="md">
          <Button variant="outline" color="red" onClick={onReject}>
            Reject
          </Button>
          <Button variant="outline" color="yellow" onClick={onMerge}>
            Merge & Edit
          </Button>
          <Button color="teal" onClick={onApprove}>
            Approve
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

export default ProposalCard;
```

## Story-Telling Mode

The Story-Telling Mode component provides a guided storytelling experience.

### Implementation

```tsx
// src/pages/AIBrain/StoryTellingMode.tsx
import { useState, useEffect } from 'react';
import { Stack, Text, Paper, Button, Group, TextInput, Switch, Loader } from '@mantine/core';
import { IconMicrophone, IconSend } from '@tabler/icons-react';
import { useAIBrain } from '../../contexts/AIBrainContext';
import VoiceInput from './VoiceInput';

function StoryTellingMode() {
  const { generateSessionSummary, generateFollowUpQuestions, submitAnswer } = useAIBrain();
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual data from API
  useEffect(() => {
    // Simulate loading the most recent session
    setSession({
      id: '5',
      name: 'Session 3: Return to Town',
      date: '2023-02-07',
    });

    // Simulate generating a summary
    setLoading(true);
    setTimeout(() => {
      setSummary(
        'In the last session, the party returned to town after discovering an ancient artifact in the forest. ' +
        'They met with the town elder who revealed some information about the artifact\'s history. ' +
        'The party also encountered a mysterious merchant who seemed interested in the artifact. ' +
        'The session ended with the party deciding to investigate the merchant\'s background.'
      );
      
      setQuestions([
        'What did the town elder reveal about the artifact?',
        'How did the party react to the mysterious merchant?',
        'Did any party members have personal moments or character development?',
        'Were there any loose ends or unresolved plot points from this session?',
        'What are the party\'s plans for the next session?',
      ]);
      
      setLoading(false);
    }, 2000);
  }, []);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !currentAnswer.trim()) return;
    
    const newAnswers = { ...answers, [currentQuestion]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer('');
    
    // Find the next unanswered question
    const nextQuestion = questions.find(q => !newAnswers[q]) || null;
    setCurrentQuestion(nextQuestion);
  };

  const handleVoiceInput = (text: string) => {
    setCurrentAnswer(text);
  };

  useEffect(() => {
    // Set the first question as current when questions are loaded
    if (questions.length > 0 && !currentQuestion) {
      setCurrentQuestion(questions[0]);
    }
  }, [questions, currentQuestion]);

  if (!session) {
    return (
      <Stack align="center" justify="center" style={{ height: '300px' }}>
        <Text c="dimmed">No recent sessions found. Run a session first.</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Text size="lg" fw={700}>
          Story-Telling Mode: {session.name}
        </Text>
        <Switch
          label="Voice Mode"
          checked={isVoiceMode}
          onChange={(event) => setIsVoiceMode(event.currentTarget.checked)}
        />
      </Group>

      {loading ? (
        <Stack align="center" py="xl">
          <Loader size="md" />
          <Text>Generating session summary and follow-up questions...</Text>
        </Stack>
      ) : (
        <>
          <Paper withBorder p="md" radius="md">
            <Text fw={700} mb="sm">Session Summary</Text>
            <Text>{summary}</Text>
          </Paper>

          <Text fw={700}>Follow-up Questions</Text>

          <Stack spacing="md">
            {questions.map((question) => (
              <Paper
                key={question}
                withBorder
                p="md"
                radius="md"
                sx={(theme) => ({
                  backgroundColor: question === currentQuestion
                    ? theme.fn.rgba(theme.colors.teal[9], 0.1)
                    : answers[question]
                      ? theme.fn.rgba(theme.colors.green[9], 0.1)
                      : theme.colors.dark[7],
                  borderColor: question === currentQuestion
                    ? theme.colors.teal[6]
                    : answers[question]
                      ? theme.colors.green[6]
                      : theme.colors.dark[5],
                })}
              >
                <Text mb="sm">{question}</Text>
                
                {answers[question] ? (
                  <Text size="sm" c="dimmed">
                    <strong>Your answer:</strong> {answers[question]}
                  </Text>
                ) : question === currentQuestion ? (
                  <Group position="apart" align="flex-end">
                    <TextInput
                      placeholder="Type your answer..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.currentTarget.value)}
                      sx={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitAnswer();
                        }
                      }}
                    />
                    {isVoiceMode && (
                      <VoiceInput onTranscript={handleVoiceInput} />
                    )}
                    <Button
                      leftIcon={<IconSend size="1rem" />}
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer.trim()}
                    >
                      Submit
                    </Button>
                  </Group>
                ) : null}
              </Paper>
            ))}
          </Stack>

          {Object.keys(answers).length === questions.length && (
            <Button fullWidth color="teal" mt="md">
              Apply Answers to Data Hub
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}

export default StoryTellingMode;
```

## Voice Input

The Voice Input component provides voice input functionality for the AI Brain.

### Implementation

```tsx
// src/pages/AIBrain/VoiceInput.tsx
import { useState, useEffect } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        onTranscript(transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  if (!recognition) {
    return (
      <Tooltip label="Speech recognition not supported in this browser">
        <ActionIcon disabled>
          <IconMicrophoneOff size="1.5rem" />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <ActionIcon
      color={isRecording ? 'red' : 'teal'}
      variant={isRecording ? 'filled' : 'outline'}
      onClick={toggleRecording}
      size="lg"
    >
      <IconMicrophone size="1.5rem" />
    </ActionIcon>
  );
}

export default VoiceInput;
```

## Generation Tools

The Generation Tools component provides tools for generating content.

### Implementation

```tsx
// src/pages/AIBrain/GenerationTools.tsx
import { useState } from 'react';
import { SimpleGrid, Text } from '@mantine/core';
import ToolCard from './ToolCard';
import { useAIBrain } from '../../contexts/AIBrainContext';

function GenerationTools() {
  const { generateContent } = useAIBrain();
  const [loading, setLoading] = useState<string | null>(null);

  // Mock data - replace with actual data from API
  const tools = [
    {
      id: 'describe-node',
      title: 'Describe Selected Node',
      description: 'Generate a detailed description for the currently selected entity.',
      icon: 'info',
    },
    {
      id: 'create-npcs',
      title: 'Create NPCs',
      description: 'Generate a set of NPCs for a specific location or faction.',
      icon: 'users',
    },
    {
      id: 'rewrite-transcript',
      title: 'Rewrite Transcript Line',
      description: 'Rewrite a transcript line as a concise summary.',
      icon: 'edit',
    },
    {
      id: 'generate-plot',
      title: 'Generate Plot Hooks',
      description: 'Generate plot hooks based on the current campaign state.',
      icon: 'book',
    },
    {
      id: 'create-location',
      title: 'Create Location',
      description: 'Generate a detailed location with points of interest.',
      icon: 'map',
    },
    {
      id: 'create-item',
      title: 'Create Magical Item',
      description: 'Generate a unique magical item with powers and history.',
      icon: 'wand',
    },
  ];

  const handleToolClick = (toolId: string) => {
    setLoading(toolId);
    
    // Simulate API call
    setTimeout(() => {
      generateContent(toolId);
      setLoading(null);
    }, 2000);
  };

  return (
    <div>
      <Text size="lg" fw={700} mb="lg">
        Generation Tools
      </Text>
      
      <SimpleGrid cols={3} spacing="md" breakpoints={[
        { maxWidth: 'md', cols: 2 },
        { maxWidth: 'sm', cols: 1 },
      ]}>
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            loading={loading === tool.id}
            onClick={() => handleToolClick(tool.id)}
          />
        ))}
      </SimpleGrid>
    </div>
  );
}

export default GenerationTools;
```

## Tool Card

The Tool Card component displays a single generation tool.

### Implementation

```tsx
// src/pages/AIBrain/ToolCard.tsx
import { Card, Text, Button, Group, Loader } from '@mantine/core';
import {
  IconInfoCircle,
  IconUsers,
  IconEdit,
  IconBook,
  IconMap,
  IconWand,
} from '@tabler/icons-react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface ToolCardProps {
  tool: Tool;
  loading: boolean;
  onClick: () => void;
}

function ToolCard({ tool, loading, onClick }: ToolCardProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'info':
        return <IconInfoCircle size="1.5rem" />;
      case 'users':
        return <IconUsers size="1.5rem" />;
      case 'edit':
        return <IconEdit size="1.5rem" />;
      case 'book':
        return <IconBook size="1.5rem" />;
      case 'map':
        return <IconMap size="1.5rem" />;
      case 'wand':
        return <IconWand size="1.5rem" />;
      default:
        return <IconInfoCircle size="1.5rem" />;
    }
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Group position="apart" mb="md">
        {getIcon(tool.icon)}
        <Text fw={700}>{tool.title}</Text>
      </Group>
      
      <Text size="sm" mb="xl">
        {tool.description}
      </Text>
      
      <Button
        fullWidth
        onClick={onClick}
        loading={loading}
      >
        {loading ? 'Generating...' : 'Generate'}
      </Button>
    </Card>
  );
}

export default ToolCard;
```

## AI Brain Context

The AI Brain Context provides global access to the AI Brain state and functions.

### Implementation

```tsx
// src/contexts/AIBrainContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence: number;
  details: string;
  affectedEntities: {
    id: string;
    name: string;
    type: string;
  }[];
}

interface AIBrainContextType {
  proposals: Proposal[];
  approveProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  mergeProposal: (id: string) => void;
  generateSessionSummary: (sessionId: string) => Promise<string>;
  generateFollowUpQuestions: (sessionId: string) => Promise<string[]>;
  submitAnswer: (question: string, answer: string) => Promise<void>;
  generateContent: (toolId: string) => Promise<any>;
}

const AIBrainContext = createContext<AIBrainContextType | undefined>(undefined);

export function AIBrainProvider({ children }: { children: ReactNode }) {
  // Mock data - replace with actual data from API
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: '1',
      title: 'New Relationship: Elara and the Mysterious Druid',
      description: 'Based on the last session, Elara and the Mysterious Druid seem to have a connection. Consider adding a relationship between them.',
      type: 'relationship',
      confidence: 0.85,
      details: 'During the forest exploration, Elara and the Mysterious Druid had a private conversation about ancient magic. The druid seemed to recognize something about Elara\'s magical abilities.',
      affectedEntities: [
        { id: '1', name: 'Elara Moonwhisper', type: 'character' },
        { id: '3', name: 'Mysterious Druid', type: 'character' },
      ],
    },
    {
      id: '2',
      title: 'New Location: Hidden Temple',
      description: 'The map fragment found in the last session points to a hidden temple. Consider adding this location to your campaign.',
      type: 'location',
      confidence: 0.75,
      details: 'The map fragment suggests the temple is located deep in the Shadowvale Forest, near an ancient stone circle. It appears to be dedicated to a forgotten nature deity.',
      affectedEntities: [
        { id: '1', name: 'Shadowvale Forest', type: 'location' },
      ],
    },
    {
      id: '3',
      title: 'Character Development: Thorne\'s Fear of Magic',
      description: 'Thorne showed signs of fear when encountering magical phenomena in the forest. Consider adding this trait to his character.',
      type: 'character',
      confidence: 0.65,
      details: 'Throughout the session, Thorne displayed discomfort around magical effects, particularly when the ancient ritual site was discovered. This could be developed into a character trait or backstory element.',
      affectedEntities: [
        { id: '2', name: 'Thorne Blackwood', type: 'character' },
      ],
    },
  ]);

  const approveProposal = (id: string) => {
    // In a real app, this would send an API request to approve the proposal
    setProposals(proposals.filter(p => p.id !== id));
  };

  const rejectProposal = (id: string) => {
    // In a real app, this would send an API request to reject the proposal
    setProposals(proposals.filter(p => p.id !== id));
  };

  const mergeProposal = (id: string) => {
    // In a real app, this would open an editor to modify the proposal before approving
    setProposals(proposals.filter(p => p.id !== id));
  };

  const generateSessionSummary = async (sessionId: string): Promise<string> => {
    // In a real app, this would send an API request to generate a session summary
    return 'Generated session summary';
  };

  const generateFollowUpQuestions = async (sessionId: string): Promise<string[]> => {
    // In a real app, this would send an API request to generate follow-up questions
    return [
      'What happened during the session?',
      'How did the characters react?',
    ];
  };

  const submitAnswer = async (question: string, answer: string): Promise<void> => {
    // In a real app, this would send an API request to submit an answer
  };

  const generateContent = async (toolId: string): Promise<any> => {
    // In a real app, this would send an API request to generate content
    return {};
  };

  return (
    <AIBrainContext.Provider
      value={{
        proposals,
        approveProposal,
        rejectProposal,
        mergeProposal,
        generateSessionSummary,
        generateFollowUpQuestions,
        submitAnswer,
        generateContent,
      }}
    >
      {children}
    </AIBrainContext.Provider>
  );
}

export function useAIBrain() {
  const context = useContext(AIBrainContext);
  if (context === undefined) {
    throw new Error('useAIBrain must be used within an AIBrainProvider');
  }
  return context;
}
```

## Conclusion

This implementation plan provides a comprehensive guide for creating the AI Brain module of the RPG Archivist application using Mantine. By following this plan, developers can create an intelligent assistant that helps users manage their campaign with AI-generated proposals, storytelling assistance, and content generation tools.
