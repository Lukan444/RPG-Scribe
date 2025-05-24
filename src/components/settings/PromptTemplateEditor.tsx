import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Divider,
  Alert,
  Chip,
  Box
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconInfoCircle, IconCode } from '@tabler/icons-react';
import { PromptTemplate, PromptVariable, PromptCategory } from '../../types/ai';

interface PromptTemplateEditorProps {
  opened: boolean;
  onClose: () => void;
  onSave: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  template?: PromptTemplate;
  mode: 'create' | 'edit';
}

const PROMPT_CATEGORIES: { value: PromptCategory; label: string }[] = [
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

const VARIABLE_TYPES: { value: PromptVariable['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
  { value: 'entity', label: 'Entity' }
];

export const PromptTemplateEditor: React.FC<PromptTemplateEditorProps> = ({
  opened,
  onClose,
  onSave,
  template,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      name: template?.name || '',
      description: template?.description || '',
      category: template?.category || 'custom' as PromptCategory,
      template: template?.template || '',
      variables: template?.variables || [] as PromptVariable[],
      isActive: template?.isActive ?? true,
      tags: template?.tags?.join(', ') || ''
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must have at least 10 characters' : null),
      template: (value) => (value.length < 20 ? 'Template must have at least 20 characters' : null)
    }
  });

  // Extract variables from template text
  useEffect(() => {
    const templateText = form.values.template;
    const variableMatches = templateText.match(/\{\{(\w+)\}\}/g);
    const extractedVariables = variableMatches 
      ? [...new Set(variableMatches.map(match => match.slice(2, -2)))]
      : [];
    setPreviewVariables(extractedVariables);
  }, [form.values.template]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const templateData = {
        name: values.name,
        description: values.description,
        category: values.category,
        template: values.template,
        variables: values.variables,
        isDefault: false,
        isActive: values.isActive,
        tags: values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      await onSave(templateData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => {
    const newVariable: PromptVariable = {
      name: '',
      description: '',
      type: 'text',
      required: false
    };
    form.setFieldValue('variables', [...form.values.variables, newVariable]);
  };

  const removeVariable = (index: number) => {
    const variables = form.values.variables.filter((_, i) => i !== index);
    form.setFieldValue('variables', variables);
  };

  const updateVariable = (index: number, field: keyof PromptVariable, value: any) => {
    const variables = [...form.values.variables];
    variables[index] = { ...variables[index], [field]: value };
    form.setFieldValue('variables', variables);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create Prompt Template' : 'Edit Prompt Template'}
      size="xl"
      scrollAreaComponent={Modal.NativeScrollArea}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <TextInput
            label="Template Name"
            placeholder="Enter template name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Describe what this template does"
            required
            minRows={2}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <Select
              label="Category"
              data={PROMPT_CATEGORIES}
              required
              {...form.getInputProps('category')}
            />
            <Switch
              label="Active"
              description="Enable this template for use"
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
          </Group>

          <TextInput
            label="Tags"
            placeholder="Enter tags separated by commas"
            description="Tags help organize and find templates"
            {...form.getInputProps('tags')}
          />

          {/* Template Content */}
          <Divider label="Template Content" labelPosition="center" />

          <Textarea
            label="Prompt Template"
            placeholder="Enter your prompt template. Use {{variableName}} for variables."
            required
            minRows={8}
            {...form.getInputProps('template')}
          />

          {/* Variable Preview */}
          {previewVariables.length > 0 && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              <Text size="sm" fw={500} mb="xs">Variables found in template:</Text>
              <Group gap="xs">
                {previewVariables.map((variable) => (
                  <Badge key={variable} variant="light" leftSection={<IconCode size={12} />}>
                    {variable}
                  </Badge>
                ))}
              </Group>
            </Alert>
          )}

          {/* Variables Configuration */}
          <Divider label="Variable Configuration" labelPosition="center" />

          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              Configure the variables used in your template
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              variant="light"
              size="sm"
              onClick={addVariable}
            >
              Add Variable
            </Button>
          </Group>

          {form.values.variables.map((variable, index) => (
            <Box key={index} p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
              <Group justify="space-between" align="flex-start" mb="md">
                <Text size="sm" fw={500}>Variable {index + 1}</Text>
                <ActionIcon
                  color="red"
                  variant="light"
                  size="sm"
                  onClick={() => removeVariable(index)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>

              <Stack gap="sm">
                <Group grow>
                  <TextInput
                    label="Variable Name"
                    placeholder="variableName"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                    required
                  />
                  <Select
                    label="Type"
                    data={VARIABLE_TYPES}
                    value={variable.type}
                    onChange={(value) => updateVariable(index, 'type', value)}
                    required
                  />
                </Group>

                <TextInput
                  label="Description"
                  placeholder="Describe this variable"
                  value={variable.description}
                  onChange={(e) => updateVariable(index, 'description', e.target.value)}
                />

                <Group>
                  <Switch
                    label="Required"
                    checked={variable.required}
                    onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                  />
                  {variable.type !== 'boolean' && (
                    <TextInput
                      label="Default Value"
                      placeholder="Default value"
                      value={variable.defaultValue || ''}
                      onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                    />
                  )}
                </Group>

                {variable.type === 'select' && (
                  <Textarea
                    label="Options"
                    placeholder="Enter options separated by commas"
                    value={variable.options?.join(', ') || ''}
                    onChange={(e) => updateVariable(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    minRows={2}
                  />
                )}

                {variable.type === 'entity' && (
                  <TextInput
                    label="Entity Type"
                    placeholder="character, location, item, etc."
                    value={variable.entityType || ''}
                    onChange={(e) => updateVariable(index, 'entityType', e.target.value)}
                  />
                )}
              </Stack>
            </Box>
          ))}

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {mode === 'create' ? 'Create Template' : 'Save Changes'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
