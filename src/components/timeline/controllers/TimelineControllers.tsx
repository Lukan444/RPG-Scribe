/**
 * Timeline React Hook Form Controllers
 * 
 * Controller wrappers for timeline components to integrate with React Hook Form
 */

import React from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { TimelineDatePicker, TimelineDatePickerProps } from '../TimelineDatePicker';
import { TimelinePositionControl, TimelinePositionControlProps } from '../TimelinePositionControl';
import { TimelineImportanceSlider, TimelineImportanceSliderProps } from '../TimelineImportanceSlider';
import { TimelineNotesField, TimelineNotesFieldProps } from '../TimelineNotesField';
import { TimelineFormAdapter, TimelineFormAdapterProps } from '../TimelineFormAdapter';

// Base controller props
interface BaseControllerProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

// Timeline Date Picker Controller
interface TimelineDatePickerControllerProps<T extends FieldValues> 
  extends BaseControllerProps<T>, 
  Omit<TimelineDatePickerProps, 'value' | 'onChange' | 'defaultValue'> {}

const TimelineDatePickerControllerComponent = <T extends FieldValues>({
  control,
  name,
  ...props
}: TimelineDatePickerControllerProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimelineDatePicker
          {...props}
          value={field.value}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};

export { TimelineDatePickerControllerComponent as TimelineDatePickerController };

// Timeline Position Control Controller
interface TimelinePositionControllerProps<T extends FieldValues> 
  extends BaseControllerProps<T>, 
  Omit<TimelinePositionControlProps, 'value' | 'onChange' | 'defaultValue'> {}

const TimelinePositionControllerComponent = <T extends FieldValues>({
  control,
  name,
  ...props
}: TimelinePositionControllerProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimelinePositionControl
          {...props}
          value={field.value}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};

export { TimelinePositionControllerComponent as TimelinePositionController };

// Timeline Importance Slider Controller
interface TimelineImportanceControllerProps<T extends FieldValues> 
  extends BaseControllerProps<T>, 
  Omit<TimelineImportanceSliderProps, 'value' | 'onChange' | 'defaultValue'> {}

const TimelineImportanceControllerComponent = <T extends FieldValues>({
  control,
  name,
  ...props
}: TimelineImportanceControllerProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimelineImportanceSlider
          {...props}
          value={field.value}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};

export { TimelineImportanceControllerComponent as TimelineImportanceController };

// Timeline Notes Field Controller
interface TimelineNotesControllerProps<T extends FieldValues> 
  extends BaseControllerProps<T>, 
  Omit<TimelineNotesFieldProps, 'value' | 'onChange' | 'defaultValue'> {}

const TimelineNotesControllerComponent = <T extends FieldValues>({
  control,
  name,
  ...props
}: TimelineNotesControllerProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimelineNotesField
          {...props}
          value={field.value}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};

export { TimelineNotesControllerComponent as TimelineNotesController };

// Complete Timeline Form Controller
interface TimelineFormControllerProps<T extends FieldValues> 
  extends BaseControllerProps<T> {
  entityType: 'character' | 'event' | 'location' | 'item' | 'session' | 'faction';
  disabled?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const TimelineFormControllerComponent = <T extends FieldValues>({
  control,
  name,
  entityType,
  disabled,
  collapsed,
  onCollapsedChange
}: TimelineFormControllerProps<T>) => {
  return (
    <TimelineFormAdapter
      control={control}
      name={name}
      entityType={entityType}
    />
  );
};

export { TimelineFormControllerComponent as TimelineFormController };

// Export controller prop types
export type {
  TimelineDatePickerControllerProps,
  TimelinePositionControllerProps,
  TimelineImportanceControllerProps,
  TimelineNotesControllerProps,
  TimelineFormControllerProps
};
