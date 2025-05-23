import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Image,
  Button,
  Tabs,
  ActionIcon,
  Menu,
  Divider,
  Stack,
  Grid,
  Box,
  Skeleton
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconLink,
  IconDotsVertical,
  IconArrowLeft,
  IconDownload,
  IconShare,
  IconBrain
} from '@tabler/icons-react';
import { EntityType } from '../../models/Relationship';
import { AIEnhanceButton } from '../ai/AIEnhanceButton';

/**
 * Entity detail props
 */
interface EntityDetailProps {
  id: string;
  type: any; // Accept any EntityType to handle different enum implementations
  name: string;
  description?: string;
  imageUrl?: string;
  metadata?: { label: string; value: string | number | React.ReactNode }[];
  badges?: { label: string; color?: string }[];
  tabs?: {
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
  }[];
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
  showBackButton?: boolean;
}

/**
 * EntityDetail component - Detailed view of an entity
 */
export function EntityDetail({
  id,
  type,
  name,
  description,
  imageUrl,
  metadata = [],
  badges = [],
  tabs = [],
  actions = [],
  onEdit,
  onDelete,
  onBack,
  loading = false,
  error = null,
  showBackButton = true
}: EntityDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>(tabs.length > 0 ? '0' : null);

  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/${type.toLowerCase()}s/${id}/edit`);
    }
  };

  // Handle delete button click
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        console.log(`Delete ${name} (${id})`);
        // Implement delete logic
        navigate(`/${type.toLowerCase()}s`);
      }
    }
  };

  // Handle copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/${type.toLowerCase()}s/${id}`;
    navigator.clipboard.writeText(url);
    // Show notification (would use Mantine notifications in a real app)
    console.log(`Link copied to clipboard: ${url}`);
  };

  if (error) {
    return (
      <Paper p="md" withBorder>
        <Text c="red">{error}</Text>
      </Paper>
    );
  }

  return (
    <Stack>
      {showBackButton && (
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handleBack}
          style={{ alignSelf: 'flex-start' }}
        >
          Back
        </Button>
      )}

      <Paper p="md" withBorder>
        <Grid>
          {imageUrl && (
            <Grid.Col span={{ base: 12, sm: 4 }}>
              {loading ? (
                <Skeleton height={200} radius="md" />
              ) : (
                <Image
                  src={imageUrl}
                  alt={name}
                  radius="md"
                  fallbackSrc="https://placehold.co/600x400?text=No+Image"
                />
              )}
            </Grid.Col>
          )}

          <Grid.Col span={{ base: 12, sm: imageUrl ? 8 : 12 }}>
            <Group justify="space-between" align="flex-start">
              <Box>
                {loading ? (
                  <Skeleton height={30} width={200} mb="xs" />
                ) : (
                  <Title order={2}>{name}</Title>
                )}

                <Group gap={5} mb="md">
                  {loading ? (
                    <Skeleton height={20} width={80} />
                  ) : (
                    <Badge color="teal">{type}</Badge>
                  )}

                  {!loading && badges.map((badge, index) => (
                    <Badge key={index} color={badge.color || 'blue'}>
                      {badge.label}
                    </Badge>
                  ))}
                </Group>
              </Box>

              <Group>
                {!loading && (
                  <>
                    <Group>
                      <Button
                        variant="light"
                        leftSection={<IconEdit size={16} />}
                        onClick={handleEdit}
                      >
                        Edit
                      </Button>

                      <AIEnhanceButton
                        entityId={id}
                        entityType={type}
                        entityName={name}
                      />
                    </Group>

                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="light">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconLink size={16} />}
                          onClick={handleCopyLink}
                        >
                          Copy Link
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconDownload size={16} />}
                          onClick={() => console.log('Download')}
                        >
                          Export
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconShare size={16} />}
                          onClick={() => console.log('Share')}
                        >
                          Share
                        </Menu.Item>

                        <Menu.Item
                          leftSection={<IconBrain size={16} />}
                          onClick={() => console.log('View AI Proposals')}
                          color="violet"
                        >
                          View AI Proposals
                        </Menu.Item>

                        {actions.map((action, index) => (
                          <Menu.Item
                            key={index}
                            leftSection={action.icon}
                            onClick={action.onClick}
                            color={action.color}
                          >
                            {action.label}
                          </Menu.Item>
                        ))}

                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={handleDelete}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </>
                )}
              </Group>
            </Group>

            {description && (
              loading ? (
                <Skeleton height={60} mb="md" />
              ) : (
                <Text mb="md">{description}</Text>
              )
            )}

            {metadata.length > 0 && (
              <Grid mb="md">
                {metadata.map((item, index) => (
                  <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                    {loading ? (
                      <Skeleton height={20} mb="xs" />
                    ) : (
                      <Group>
                        <Text fw={500}>{item.label}:</Text>
                        <Text>{item.value}</Text>
                      </Group>
                    )}
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Grid.Col>
        </Grid>
      </Paper>

      {tabs.length > 0 && (
        <Paper p="md" withBorder>
          {loading ? (
            <Skeleton height={200} />
          ) : (
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                {tabs.map((tab, index) => (
                  <Tabs.Tab
                    key={index}
                    value={index.toString()}
                    leftSection={tab.icon}
                  >
                    {tab.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>

              {tabs.map((tab, index) => (
                <Tabs.Panel key={index} value={index.toString()} pt="md">
                  {tab.content}
                </Tabs.Panel>
              ))}
            </Tabs>
          )}
        </Paper>
      )}
    </Stack>
  );
}
