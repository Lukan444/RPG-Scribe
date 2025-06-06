import { ReactNode } from 'react';

// Entity types supported by the form system
export enum EntityType {
  CHARACTER = 'character',
  LOCATION = 'location',
  ITEM = 'item',
  EVENT = 'event',
  FACTION = 'faction',
  STORY_ARC = 'storyArc',
  NOTE = 'note',
  SESSION = 'session',
  CAMPAIGN = 'campaign',
  WORLD = 'world'
}

// Form modes
export enum FormMode {
  CREATE = 'create',
  EDIT = 'edit',
  VIEW = 'view'
}

// Form field types
export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTI_SELECT = 'multiSelect',
  ENTITY_SELECTOR = 'entitySelector',
  MULTI_ENTITY_SELECTOR = 'multiEntitySelector',
  IMAGE_UPLOADER = 'imageUploader',
  RICH_TEXT = 'richText',
  NUMBER = 'number',
  DATE = 'date',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

// Base entity interface
export interface BaseEntity {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  imageURL?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  worldId?: string;
  campaignId?: string;
}

// Form field configuration
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  validation?: FormFieldValidation;
  conditional?: (values: any, context?: FormContext) => boolean;
  options?: FormFieldOption[];
  entityType?: EntityType;
  multiple?: boolean;
  accept?: string; // For file uploads
  rows?: number; // For textarea
  min?: number; // For number inputs
  max?: number; // For number inputs
  step?: number; // For number inputs
}

// Form field validation rules
export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any, values: any) => string | null;
}

// Form field options for select/radio fields
export interface FormFieldOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

// Form tab configuration
export interface FormTab {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  fields: FormField[];
  conditional?: (values: any, context?: FormContext) => boolean;
  order: number;
}

// Complete form configuration for an entity type
export interface EntityFormConfig {
  entityType: EntityType;
  title: string;
  description?: string;
  tabs: FormTab[];
  validation?: Record<string, FormFieldValidation>;
  initialValues?: Record<string, any>;
  submitLabel?: string;
  cancelLabel?: string;
  allowDraft?: boolean;
  allowSaveAndNew?: boolean;
}

// Modal entity form props
export interface ModalEntityFormProps<T extends BaseEntity = BaseEntity> {
  entityType: EntityType;
  entityId?: string;
  worldId: string;
  campaignId?: string;
  opened: boolean;
  onClose: () => void;
  onSuccess?: (entity: T) => void;
  onError?: (error: Error) => void;
  initialValues?: Partial<T>;
  mode?: FormMode;
  config?: Partial<EntityFormConfig>;
  userRole?: 'admin' | 'gamemaster' | 'player' | 'user';
}

// Form submission data
export interface FormSubmissionData {
  values: Record<string, any>;
  mode: FormMode;
  entityType: EntityType;
  entityId?: string;
  worldId: string;
  campaignId?: string;
}

// Form validation result
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Form field component props
export interface FormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  worldId: string;
  campaignId?: string;
}

// Entity selector options
export interface EntitySelectorOption {
  value: string;
  label: string;
  description?: string;
  imageURL?: string;
  entityType: EntityType;
}

// Form context for sharing data between components
export interface FormContext {
  entityType: EntityType;
  mode: FormMode;
  worldId: string;
  campaignId?: string;
  values: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  userRole?: 'admin' | 'gamemaster' | 'player' | 'user';
}

// User role for conditional field rendering
export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  isGM?: boolean;
  isPlayer?: boolean;
}

// Form action types
export enum FormAction {
  SAVE = 'save',
  SAVE_AND_CLOSE = 'saveAndClose',
  SAVE_AND_NEW = 'saveAndNew',
  SAVE_DRAFT = 'saveDraft',
  CANCEL = 'cancel',
  DELETE = 'delete'
}

// Form action result
export interface FormActionResult {
  success: boolean;
  action: FormAction;
  entity?: BaseEntity;
  error?: Error;
  message?: string;
}

// Modal sizing configuration
export interface ModalSizeConfig {
  xs: string;  // Mobile
  sm: string;  // Small tablets
  md: string;  // Tablets
  lg: string;  // Desktop
  xl: string;  // Large desktop
}

// Default modal sizes as specified in design
export const DEFAULT_MODAL_SIZES: ModalSizeConfig = {
  xs: '95%',
  sm: '80%',
  md: '70%',
  lg: '60%',
  xl: '50%'
};

// Form field component registry type
export type FormFieldComponentRegistry = Record<FormFieldType, React.ComponentType<FormFieldProps>>;

// Export utility type for entity-specific form props
export type EntityFormProps<T extends BaseEntity> = Omit<ModalEntityFormProps<T>, 'entityType'> & {
  entityType: EntityType;
};
