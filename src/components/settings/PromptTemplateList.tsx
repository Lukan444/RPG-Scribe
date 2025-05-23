import React, { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Card,
  Badge,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Switch,
  Alert,
  Modal,
  Divider,
  Chip,
  Box,
  Tooltip
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconCopy,
  IconPlay,
  IconTemplate,
  IconInfoCircle,
  IconFilter
} from '@tabler/icons-react';
import { PromptTemplate, PromptCategory } from '../../types/ai';
import { PromptTemplateEditor } from './PromptTemplateEditor';

interface PromptTemplateListProps {
  templates: PromptTemplate[];
  onCreateTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  onUpdateTemplate: (templateId: string, updates: Partial<PromptTemplate>) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onExecuteTemplate: (templateId: string, variables: Record<string, any>) => Promise<void>;
  loading?: boolean;
}

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  'character-generation': 'blue',
  'world-building': 'green',
  'story-development': 'purple',
  'session-planning': 'orange',
  'npc-creation': 'cyan',
  'location-description': 'teal',
  'item-creation': 'yellow',
  'dialogue-generation': 'pink',
  'custom': 'gray'
};

export const PromptTemplateList: React.FC<PromptTemplateListProps> = ({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onExecuteTemplate,
  loading = false
}) => {
  const [editorOpened, setEditorOpened] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PromptTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'all'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesActive = !showActiveOnly || template.isActive;

    return matchesSearch && matchesCategory && matchesActive;
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setEditorOpened(true);
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setEditorOpened(true);
  };

  const handleDeleteTemplate = (template: PromptTemplate) => {
    setTemplateToDelete(template);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await onDeleteTemplate(templateToDelete.id);
      setDeleteModalOpened(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicateTemplate = async (template: PromptTemplate) => {
    const duplicatedTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      template: template.template,
      variables: template.variables,
      isDefault: false,
      isActive: template.isActive,
      tags: [...template.tags, 'copy']
    };

    await onCreateTemplate(duplicatedTemplate);
  };

  const handleToggleActive = async (template: PromptTemplate) => {
    await onUpdateTemplate(template.id, { isActive: !template.isActive });
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'character-generation', label: 'Character Generation' },
    { value: 'world-building', label: 'World Building' },
    { value: 'story-development', label: 'Story Development' },
    { value: 'session-planning', label: 'Session Planning' },
    { value: 'npc-creation', label: 'NPC Creation' },
    { value: 'location-description', label: 'Location Description' },
    { value: 'item-creation', label: 'Item Creation' },
    { value: 'dialogue-generation', label: 'Dialogue Generation' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="lg" fw={600}>Prompt Templates</Text>
            <Text size="sm" c="dimmed">
              Manage your custom AI prompt templates
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateTemplate}
            loading={loading}
          >
            Create Template
          </Button>
        </Group>

        {/* Filters */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Group align="center" gap="md">
              <IconFilter size={16} />
              <Text size="sm" fw={500}>Filters</Text>
            </Group>
            
            <Group grow>
              <TextInput
                placeholder="Search templates..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                placeholder="Category"
                data={categoryOptions}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value as PromptCategory | 'all')}
              />
              <Switch
                label="Active only"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
            </Group>
          </Stack>
        </Card>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            {templates.length === 0 
              ? "No prompt templates found. Create your first template to get started!"
              : "No templates match your current filters."
            }
          </Alert>
        ) : (
          <Stack gap="md">
            {filteredTemplates.map((template) => (
              <Card key={template.id} withBorder p="md">
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group align="center" gap="sm" mb="xs">
                        <Text fw={600}>{template.name}</Text>
                        <Badge
                          color={CATEGORY_COLORS[template.category]}
                          variant="light"
                          size="sm"
                        >
                          {template.category.replace('-', ' ')}
                        </Badge>
                        {template.isDefault && (
                          <Badge color="gray" variant="outline" size="sm">
                            Default
                          </Badge>
                        )}
                        {!template.isActive && (
                          <Badge color="red" variant="light" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed" mb="sm">
                        {template.description}
                      </Text>
                    </div>

                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="light">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconPlay size={14} />}
                          onClick={() => onExecuteTemplate(template.id, {})}
                        >
                          Execute
                        </Menu.Item>
                        {!template.isDefault && (
                          <>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEditTemplate(template)}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconCopy size={14} />}
                              onClick={() => handleDuplicateTemplate(template)}
                            >
                              Duplicate
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDeleteTemplate(template)}
                            >
                              Delete
                            </Menu.Item>
                          </>
                        )}
                        {template.isDefault && (
                          <Menu.Item
                            leftSection={<IconCopy size={14} />}
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            Duplicate
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <Group gap="xs">
                      {template.tags.map((tag) => (
                        <Chip key={tag} size="xs" variant="light">
                          {tag}
                        </Chip>
                      ))}
                    </Group>
                  )}

                  {/* Variables */}
                  {template.variables.length > 0 && (
                    <Box>
                      <Text size="xs" c="dimmed" mb="xs">
                        Variables ({template.variables.length}):
                      </Text>
                      <Group gap="xs">
                        {template.variables.slice(0, 5).map((variable) => (
                          <Tooltip key={variable.name} label={variable.description}>
                            <Badge
                              size="xs"
                              variant="outline"
                              color={variable.required ? 'red' : 'gray'}
                            >
                              {variable.name}
                            </Badge>
                          </Tooltip>
                        ))}
                        {template.variables.length > 5 && (
                          <Text size="xs" c="dimmed">
                            +{template.variables.length - 5} more
                          </Text>
                        )}
                      </Group>
                    </Box>
                  )}

                  {/* Actions */}
                  <Group justify="space-between" align="center" mt="sm">
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        Updated: {template.updatedAt.toLocaleDateString()}
                      </Text>
                    </Group>
                    
                    <Group gap="xs">
                      {!template.isDefault && (
                        <Switch
                          size="sm"
                          checked={template.isActive}
                          onChange={() => handleToggleActive(template)}
                          label="Active"
                        />
                      )}
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlay size={12} />}
                        onClick={() => onExecuteTemplate(template.id, {})}
                      >
                        Execute
                      </Button>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Template Editor Modal */}
      <PromptTemplateEditor
        opened={editorOpened}
        onClose={() => setEditorOpened(false)}
        onSave={editingTemplate ? 
          (template) => onUpdateTemplate(editingTemplate.id, template) :
          onCreateTemplate
        }
        template={editingTemplate}
        mode={editingTemplate ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Delete Template"
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete the template "{templateToDelete?.name}"? 
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteModalOpened(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
