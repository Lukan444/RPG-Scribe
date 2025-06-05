/**
 * TimelineFormAdapter Component
 * 
 * Adapter component that supports both Mantine useForm and React Hook Form integration patterns.
 * Resolves the critical form integration architecture mismatch identified in Context7 validation.
 */

import React from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { UseFormReturnType } from '@mantine/form';
import { TimelineFormSection, TimelineFormValues } from './TimelineFormSection';

// Mantine form integration props
interface MantineFormProps {
  form: UseFormReturnType<any>;
  entityType: 'character' | 'event' | 'location' | 'item' | 'session' | 'faction';
  fieldPrefix?: string;
}

// React Hook Form integration props
interface ReactHookFormProps {
  control: Control<any>;
  name: string;
  entityType: 'character' | 'event' | 'location' | 'item' | 'session' | 'faction';
}

// Standalone usage props
interface StandaloneProps {
  entityType: 'character' | 'event' | 'location' | 'item' | 'session' | 'faction';
  values?: TimelineFormValues;
  onChange?: (values: TimelineFormValues) => void;
  errors?: Partial<Record<keyof TimelineFormValues, string>>;
  disabled?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// Union type for all possible prop combinations
export type TimelineFormAdapterProps = 
  | MantineFormProps 
  | ReactHookFormProps 
  | StandaloneProps;

// Type guards to determine which props we're dealing with
const isMantineFormProps = (props: TimelineFormAdapterProps): props is MantineFormProps => {
  return 'form' in props;
};

const isReactHookFormProps = (props: TimelineFormAdapterProps): props is ReactHookFormProps => {
  return 'control' in props && 'name' in props;
};

/**
 * TimelineFormAdapter - Universal timeline form integration component
 * 
 * Supports three integration patterns:
 * 1. Mantine useForm integration
 * 2. React Hook Form integration  
 * 3. Standalone usage with custom state management
 */
export const TimelineFormAdapter: React.FC<TimelineFormAdapterProps> = (props) => {
  // Mantine form integration
  if (isMantineFormProps(props)) {
    const { form, entityType, fieldPrefix = '' } = props;
    
    // Extract timeline values from Mantine form
    const timelineValues: TimelineFormValues = {
      inGameTime: form.values[`${fieldPrefix}inGameTime`],
      timelinePosition: form.values[`${fieldPrefix}timelinePosition`],
      timelineImportance: form.values[`${fieldPrefix}timelineImportance`],
      timelineNotes: form.values[`${fieldPrefix}timelineNotes`]
    };

    // Extract timeline errors from Mantine form
    const timelineErrors: Partial<Record<keyof TimelineFormValues, string>> = {
      inGameTime: form.errors[`${fieldPrefix}inGameTime`] as string,
      timelinePosition: form.errors[`${fieldPrefix}timelinePosition`] as string,
      timelineImportance: form.errors[`${fieldPrefix}timelineImportance`] as string,
      timelineNotes: form.errors[`${fieldPrefix}timelineNotes`] as string
    };

    // Handle timeline value changes
    const handleTimelineChange = (newValues: TimelineFormValues) => {
      Object.entries(newValues).forEach(([key, value]) => {
        const fieldName = `${fieldPrefix}${key}`;
        form.setFieldValue(fieldName, value);
      });
    };

    return (
      <TimelineFormSection
        entityType={entityType}
        values={timelineValues}
        onChange={handleTimelineChange}
        errors={timelineErrors}
        disabled={false}
        showAdvanced={true}
      />
    );
  }

  // React Hook Form integration
  if (isReactHookFormProps(props)) {
    const { control, name, entityType } = props;

    return (
      <Controller
        control={control}
        name={name}
        defaultValue={{
          inGameTime: undefined,
          timelinePosition: 0,
          timelineImportance: 5,
          timelineNotes: ''
        }}
        render={({ field, fieldState }) => {
          // Convert React Hook Form error to our error format
          const convertError = (error: FieldError | undefined): Partial<Record<keyof TimelineFormValues, string>> => {
            if (!error) return {};
            
            // Handle nested field errors
            if (error.type === 'required') {
              return { inGameTime: 'Timeline date is required' };
            }
            
            // Handle validation errors for specific fields
            const errors: Partial<Record<keyof TimelineFormValues, string>> = {};
            if (error.message) {
              // Try to parse field-specific errors from message
              if (error.message.includes('inGameTime')) {
                errors.inGameTime = error.message;
              }
              if (error.message.includes('timelinePosition')) {
                errors.timelinePosition = error.message;
              }
              if (error.message.includes('timelineImportance')) {
                errors.timelineImportance = error.message;
              }
              if (error.message.includes('timelineNotes')) {
                errors.timelineNotes = error.message;
              }
            }
            
            return errors;
          };

          return (
            <TimelineFormSection
              entityType={entityType}
              values={field.value || {
                inGameTime: undefined,
                timelinePosition: 0,
                timelineImportance: 5,
                timelineNotes: ''
              }}
              onChange={(newValues) => {
                field.onChange(newValues);
              }}
              errors={convertError(fieldState.error)}
              disabled={false}
              showAdvanced={true}
            />
          );
        }}
      />
    );
  }

  // Standalone usage (fallback)
  const standaloneProps = props as StandaloneProps;
  return (
    <TimelineFormSection
      entityType={standaloneProps.entityType}
      values={standaloneProps.values || {
        inGameTime: undefined,
        timelinePosition: 0,
        timelineImportance: 5,
        timelineNotes: ''
      }}
      onChange={standaloneProps.onChange || (() => {})}
      errors={standaloneProps.errors || {}}
      disabled={standaloneProps.disabled || false}
      collapsed={standaloneProps.collapsed}
      onCollapsedChange={standaloneProps.onCollapsedChange}
      showAdvanced={true}
    />
  );
};

// Export helper functions for form integration
export const createMantineTimelineFields = (fieldPrefix: string = '') => ({
  [`${fieldPrefix}inGameTime`]: {
    type: 'date',
    label: 'In-Game Date',
    placeholder: 'Select in-game date',
  },
  [`${fieldPrefix}timelinePosition`]: {
    type: 'number',
    label: 'Timeline Position',
    placeholder: 'Enter position',
    min: 0,
  },
  [`${fieldPrefix}timelineImportance`]: {
    type: 'number',
    label: 'Timeline Importance',
    placeholder: 'Select importance (1-10)',
    min: 1,
    max: 10,
  },
  [`${fieldPrefix}timelineNotes`]: {
    type: 'textarea',
    label: 'Timeline Notes',
    placeholder: 'Add timeline notes...',
  },
});

// Export validation schemas for React Hook Form
export const timelineValidationSchema = {
  inGameTime: {
    required: false, // Timeline date is optional
  },
  timelinePosition: {
    required: false,
    min: { value: 0, message: 'Position must be 0 or greater' },
  },
  timelineImportance: {
    required: false,
    min: { value: 1, message: 'Importance must be between 1 and 10' },
    max: { value: 10, message: 'Importance must be between 1 and 10' },
  },
  timelineNotes: {
    required: false,
    maxLength: { value: 1000, message: 'Notes must be 1000 characters or less' },
  },
};

export default TimelineFormAdapter;
