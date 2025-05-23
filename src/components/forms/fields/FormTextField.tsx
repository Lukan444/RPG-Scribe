import React, { useState, useCallback } from 'react';
import {
  TextInput,
  Textarea,
  Text,
  Stack,
  Group,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconAsterisk
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { FormFieldProps, FormFieldType } from '../../../types/forms';

// Extended props for text field specific options
interface FormTextFieldProps extends FormFieldProps {
  multiline?: boolean;
  password?: boolean;
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
}

// Character counter component
interface CharacterCounterProps {
  current: number;
  max: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = current > max;

  return (
    <Text
      size="xs"
      c={isOverLimit ? 'red' : isNearLimit ? 'orange' : 'dimmed'}
      ta="right"
    >
      {current}/{max}
    </Text>
  );
};

// Main FormTextField component
export const FormTextField: React.FC<FormTextFieldProps> = ({
  field,
  value = '',
  onChange,
  error,
  disabled = false,
  multiline = false,
  password = false,
  rows = 3,
  maxLength,
  showCharacterCount = false
}) => {
  const { t } = useTranslation(['ui', 'common']);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine if this should be a multiline field
  const isMultiline = multiline || field.type === FormFieldType.TEXTAREA || (field.rows && field.rows > 1);

  // Determine if this is a password field
  const isPassword = password || field.name.toLowerCase().includes('password');

  // Get character limit from field config or prop
  const characterLimit = maxLength || field.validation?.maxLength;

  // Show character count if enabled and there's a limit
  const shouldShowCharacterCount = showCharacterCount && characterLimit;

  // Handle value change with validation
  const handleChange = useCallback((newValue: string) => {
    // Apply character limit if set
    if (characterLimit && newValue.length > characterLimit) {
      return; // Don't update if over limit
    }

    onChange(newValue);
  }, [onChange, characterLimit]);

  // Generate input props common to both TextInput and Textarea
  const commonProps = {
    label: (
      <Group gap="xs">
        <Text size="sm" fw={500}>
          {field.label}
        </Text>
        {field.required && (
          <IconAsterisk size={8} color="red" />
        )}
        {field.description && (
          <Tooltip label={field.description} multiline w={300}>
            <ActionIcon variant="subtle" size="xs" color="gray">
              <IconInfoCircle size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    ),
    placeholder: field.placeholder || t('ui:forms.placeholders.enterName').replace('name', field.label.toLowerCase()),
    value: value || '',
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(event.currentTarget.value),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    error: error,
    disabled: disabled,
    required: field.required,
    'data-testid': `form-field-${field.name}`,
    style: { width: '100%' }
  };

  // Render multiline textarea
  if (isMultiline) {
    return (
      <Stack gap="xs">
        <Textarea
          {...commonProps}
          rows={rows || field.rows || 3}
          autosize={!field.rows}
          minRows={field.rows || 3}
          maxRows={field.rows ? field.rows + 2 : 8}
        />
        {shouldShowCharacterCount && (
          <CharacterCounter
            current={value?.length || 0}
            max={characterLimit}
          />
        )}
      </Stack>
    );
  }

  // Render password input with toggle
  if (isPassword) {
    return (
      <Stack gap="xs">
        <TextInput
          {...commonProps}
          type={showPassword ? 'text' : 'password'}
          rightSection={
            <ActionIcon
              variant="subtle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
              aria-label={showPassword ? t('common:actions.hide') : t('common:actions.show')}
            >
              {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </ActionIcon>
          }
        />
        {shouldShowCharacterCount && (
          <CharacterCounter
            current={value?.length || 0}
            max={characterLimit}
          />
        )}
      </Stack>
    );
  }

  // Render standard text input
  return (
    <Stack gap="xs">
      <TextInput
        {...commonProps}
        type="text"
      />
      {shouldShowCharacterCount && (
        <CharacterCounter
          current={value?.length || 0}
          max={characterLimit}
        />
      )}
    </Stack>
  );
};

// Wrapper component that determines the correct variant based on field type
export const FormTextFieldWrapper: React.FC<FormFieldProps> = (props) => {
  const { field } = props;

  // Determine field variant based on type and configuration
  const isMultiline = field.type === FormFieldType.TEXTAREA || !!(field.rows && field.rows > 1);
  const isPassword = field.name.toLowerCase().includes('password');
  const showCharacterCount = !!(field.validation?.maxLength);

  return (
    <FormTextField
      {...props}
      multiline={isMultiline}
      password={isPassword}
      rows={field.rows}
      maxLength={field.validation?.maxLength}
      showCharacterCount={showCharacterCount}
    />
  );
};

export default FormTextField;
