import { useState } from 'react';
import {
  Box,
  TextInput,
  Textarea,
  Button,
  Group,
  Select,
  MultiSelect,
  FileInput,
  Stack,
  Paper,
  Title,
  Divider,
  Switch,
  NumberInput,
  Text
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconUpload, IconX, IconDeviceFloppy } from '@tabler/icons-react';
import { EntityType } from '../../models/Relationship';

/**
 * Form field interface
 */
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'file' | 'number' | 'switch' | string; // Accept string type for backward compatibility
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  section?: string;
  description?: string; // Optional description field
}

/**
 * Entity form props
 */
interface EntityFormProps {
  entityType: any; // Accept any EntityType to handle different enum implementations
  initialValues?: Record<string, any>;
  fields: FormField[];
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  sections?: string[];
}

/**
 * EntityForm component - Form for creating and editing entities
 */
export function EntityForm({
  entityType,
  initialValues = {},
  fields,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  title,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  sections = []
}: EntityFormProps) {
  const [activeSection, setActiveSection] = useState<string | null>(sections.length > 0 ? sections[0] : null);

  // Create default values for all fields to prevent uncontrolled to controlled warnings
  const defaultValues = fields.reduce((acc, field) => {
    // Set appropriate default values based on field type
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'select':
        acc[field.name] = initialValues[field.name] || '';
        break;
      case 'multiselect':
        acc[field.name] = initialValues[field.name] || [];
        break;
      case 'number':
        acc[field.name] = initialValues[field.name] || '';
        break;
      case 'switch':
        acc[field.name] = initialValues[field.name] || false;
        break;
      case 'date':
        acc[field.name] = initialValues[field.name] || null;
        break;
      case 'file':
        acc[field.name] = initialValues[field.name] || null;
        break;
      default:
        acc[field.name] = initialValues[field.name] || '';
    }
    return acc;
  }, {} as Record<string, any>);

  // Initialize form with initial values
  const form = useForm({
    initialValues: { ...defaultValues, ...initialValues },
    validate: {
      // Add validation based on required fields
      ...Object.fromEntries(
        fields
          .filter(field => field.required)
          .map(field => [
            field.name,
            (value: any) => {
              if (field.type === 'text' || field.type === 'textarea') {
                return !value || value.trim() === '' ? 'This field is required' : null;
              }
              return value === undefined || value === null ? 'This field is required' : null;
            }
          ])
      )
    }
  });

  // Handle form submission
  const handleSubmit = (values: Record<string, any>) => {
    onSubmit(values);
  };

  // Group fields by section
  const fieldsBySection = sections.length > 0
    ? sections.reduce((acc, section) => {
        acc[section] = fields.filter(field => field.section === section);
        return acc;
      }, {} as Record<string, FormField[]>)
    : { 'default': fields };

  // Render form fields based on type
  const renderField = (field: FormField) => {
    const { name, label, type, placeholder, required, options, min, max, description } = field;

    // Handle string type values by mapping them to appropriate components
    const normalizedType = typeof type === 'string' ?
      type.toLowerCase() : type;

    // Map common string type values to our supported types
    const mappedType = (() => {
      if (normalizedType === 'text' || normalizedType === 'string' || normalizedType === 'input') return 'text';
      if (normalizedType === 'textarea' || normalizedType === 'longtext') return 'textarea';
      if (normalizedType === 'select' || normalizedType === 'dropdown') return 'select';
      if (normalizedType === 'multiselect' || normalizedType === 'tags' || normalizedType === 'multi') return 'multiselect';
      if (normalizedType === 'date' || normalizedType === 'datetime') return 'date';
      if (normalizedType === 'file' || normalizedType === 'image' || normalizedType === 'upload') return 'file';
      if (normalizedType === 'number' || normalizedType === 'numeric' || normalizedType === 'int') return 'number';
      if (normalizedType === 'switch' || normalizedType === 'boolean' || normalizedType === 'checkbox' || normalizedType === 'toggle') return 'switch';
      return normalizedType; // Default to the original type
    })();

    // Render description if provided
    const renderDescription = description ? (
      <Text size="xs" c="dimmed" mt={4}>
        {description}
      </Text>
    ) : null;

    switch (mappedType) {
      case 'text':
        return (
          <Box key={name}>
            <TextInput
              label={label}
              placeholder={placeholder}
              required={required}
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'textarea':
        return (
          <Box key={name}>
            <Textarea
              label={label}
              placeholder={placeholder}
              required={required}
              minRows={3}
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'select':
        return (
          <Box key={name}>
            <Select
              label={label}
              placeholder={placeholder}
              required={required}
              data={options || []}
              clearable
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'multiselect':
        return (
          <Box key={name}>
            <MultiSelect
              label={label}
              placeholder={placeholder}
              required={required}
              data={options || []}
              clearable
              searchable
              comboboxProps={{
                onOptionSubmit: (val) => {
                  const currentValue = form.getInputProps(name).value || [];
                  if (!currentValue.includes(val)) {
                    form.setFieldValue(name, [...currentValue, val]);
                  }
                }
              }}
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'date':
        return (
          <Box key={name}>
            <DateInput
              label={label}
              placeholder={placeholder}
              required={required}
              clearable
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'file':
        return (
          <Box key={name}>
            <FileInput
              label={label}
              placeholder={placeholder}
              required={required}
              accept="image/*"
              leftSection={<IconUpload size={16} />}
              clearable
              valueComponent={(props) => (
                <div>
                  {props.value && (
                    <Text size="sm" ta="center">
                      {typeof props.value === 'string'
                        ? props.value
                        : props.value instanceof File
                          ? props.value.name
                          : 'File selected'}
                    </Text>
                  )}
                </div>
              )}
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'number':
        return (
          <Box key={name}>
            <NumberInput
              label={label}
              placeholder={placeholder}
              required={required}
              min={min}
              max={max}
              {...form.getInputProps(name)}
            />
            {renderDescription}
          </Box>
        );
      case 'switch':
        return (
          <Box key={name}>
            <Switch
              label={label}
              {...form.getInputProps(name, { type: 'checkbox' })}
            />
            {renderDescription}
          </Box>
        );
      default:
        // Default to text input for unknown types
        return (
          <Box key={name}>
            <TextInput
              label={label}
              placeholder={placeholder}
              required={required}
              {...form.getInputProps(name)}
            />
            {renderDescription}
            <Text size="xs" c="dimmed" mt={4}>
              (Unknown field type: {type})
            </Text>
          </Box>
        );
    }
  };

  return (
    <Box>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {title && <Title order={3} mb="md">{title}</Title>}

        {error && (
          <Text c="red" mb="md">
            {error}
          </Text>
        )}

        {sections.length > 0 ? (
          <>
            <Group mb="md">
              {sections.map(section => (
                <Button
                  key={section}
                  variant={activeSection === section ? 'filled' : 'light'}
                  onClick={() => setActiveSection(section)}
                >
                  {section}
                </Button>
              ))}
            </Group>

            {Object.entries(fieldsBySection).map(([section, sectionFields]) => (
              <Paper
                key={section}
                p="md"
                withBorder
                style={{ display: activeSection === section ? 'block' : 'none' }}
              >
                <Stack>
                  {sectionFields.map(field => renderField(field))}
                </Stack>
              </Paper>
            ))}
          </>
        ) : (
          <Stack>
            {fields.map(field => renderField(field))}
          </Stack>
        )}

        <Group justify="flex-end" mt="xl">
          {onCancel && (
            <Button
              variant="outline"
              color="red"
              onClick={onCancel}
              leftSection={<IconX size={16} />}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            {submitLabel}
          </Button>
        </Group>
      </form>
    </Box>
  );
}
