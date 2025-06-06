import React from 'react';
import {
  IconInfoCircle,
  IconUsers,
  IconMapPin,
  IconCoins,
  IconEyeOff,
  IconSettings
} from '@tabler/icons-react';
import {
  EntityType,
  EntityFormConfig,
  FormTab,
  FormField,
  FormFieldType,
  FormFieldValidation,
  FormContext
} from '../types/forms';

// Validation rules commonly used across forms
const commonValidations: Record<string, FormFieldValidation> = {
  required: { required: true },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  description: {
    maxLength: 2000
  },
  shortText: {
    maxLength: 255
  },
  email: {
    required: true,
    email: true
  },
  url: {
    url: true
  }
};

// Common field definitions that can be reused
const commonFields: Record<string, Omit<FormField, 'id'>> = {
  name: {
    name: 'name',
    label: 'Name',
    type: FormFieldType.TEXT,
    required: true,
    placeholder: 'Enter name',
    validation: commonValidations.name
  },
  title: {
    name: 'title',
    label: 'Title',
    type: FormFieldType.TEXT,
    required: true,
    placeholder: 'Enter title',
    validation: commonValidations.name
  },
  description: {
    name: 'description',
    label: 'Description',
    type: FormFieldType.TEXTAREA,
    placeholder: 'Enter description',
    rows: 4,
    validation: commonValidations.description
  },
  imageURL: {
    name: 'imageURL',
    label: 'Image',
    type: FormFieldType.IMAGE_UPLOADER,
    description: 'Upload an image or provide a URL'
  },
  secretNotes: {
    name: 'secretNotes',
    label: 'Secret Notes (GM Only)',
    type: FormFieldType.TEXTAREA,
    placeholder: 'Enter secret information visible only to GMs',
    rows: 3,
    validation: commonValidations.description,
    conditional: (_values: any, context?: FormContext) => {
      return context?.userRole === 'gamemaster' || context?.userRole === 'admin';
    }
  }
};

// Faction form configuration based on FactionFormPage.tsx analysis
const factionFormConfig: EntityFormConfig = {
  entityType: EntityType.FACTION,
  title: 'Faction',
  description: 'Manage faction information, leadership, territory, and assets',
  tabs: [
    {
      id: 'basic',
      label: 'Basic Info',
      icon: React.createElement(IconInfoCircle, { size: 16 }),
      description: 'Basic faction information and overview',
      order: 1,
      fields: [
        {
          id: 'faction-name',
          ...commonFields.name
        },
        {
          id: 'faction-description',
          ...commonFields.description
        },
        {
          id: 'faction-type',
          name: 'factionType',
          label: 'Faction Type',
          type: FormFieldType.SELECT,
          required: true,
          placeholder: 'Select faction type',
          options: [
            { value: 'guild', label: 'Guild' },
            { value: 'organization', label: 'Organization' },
            { value: 'government', label: 'Government' },
            { value: 'military', label: 'Military' },
            { value: 'religious', label: 'Religious Order' },
            { value: 'criminal', label: 'Criminal Organization' },
            { value: 'merchant', label: 'Merchant Company' },
            { value: 'academic', label: 'Academic Institution' },
            { value: 'secret', label: 'Secret Society' },
            { value: 'cult', label: 'Cult' }
          ]
        },
        {
          id: 'faction-motto',
          name: 'motto',
          label: 'Motto',
          type: FormFieldType.TEXT,
          placeholder: 'Enter faction motto or slogan',
          validation: commonValidations.shortText
        },
        {
          id: 'faction-scope',
          name: 'scope',
          label: 'Scope',
          type: FormFieldType.SELECT,
          placeholder: 'Select faction scope',
          options: [
            { value: 'local', label: 'Local' },
            { value: 'regional', label: 'Regional' },
            { value: 'national', label: 'National' },
            { value: 'international', label: 'International' },
            { value: 'planar', label: 'Planar' }
          ]
        },
        {
          id: 'faction-image',
          ...commonFields.imageURL
        }
      ]
    },
    {
      id: 'leadership',
      label: 'Leadership & Membership',
      icon: React.createElement(IconUsers, { size: 16 }),
      description: 'Faction leadership structure and membership',
      order: 2,
      fields: [
        {
          id: 'faction-leader',
          name: 'leaderId',
          label: 'Leader',
          type: FormFieldType.ENTITY_SELECTOR,
          entityType: EntityType.CHARACTER,
          placeholder: 'Select faction leader',
          description: 'Primary leader or head of the faction'
        },
        {
          id: 'faction-leader-title',
          name: 'leaderTitle',
          label: 'Leader Title',
          type: FormFieldType.TEXT,
          placeholder: 'e.g., Guildmaster, President, High Priest',
          validation: commonValidations.shortText
        },
        {
          id: 'faction-members',
          name: 'memberIds',
          label: 'Members',
          type: FormFieldType.MULTI_ENTITY_SELECTOR,
          entityType: EntityType.CHARACTER,
          placeholder: 'Select faction members',
          description: 'Key members and notable figures in the faction'
        }
      ]
    },
    {
      id: 'territory',
      label: 'Territory & Location',
      icon: React.createElement(IconMapPin, { size: 16 }),
      description: 'Faction territory, headquarters, and areas of influence',
      order: 3,
      fields: [
        {
          id: 'faction-headquarters',
          name: 'headquartersId',
          label: 'Headquarters',
          type: FormFieldType.ENTITY_SELECTOR,
          entityType: EntityType.LOCATION,
          placeholder: 'Select headquarters location',
          description: 'Primary base of operations'
        },
        {
          id: 'faction-territories',
          name: 'territoryIds',
          label: 'Territories',
          type: FormFieldType.MULTI_ENTITY_SELECTOR,
          entityType: EntityType.LOCATION,
          placeholder: 'Select controlled territories',
          description: 'Areas under faction control or influence'
        }
      ]
    },
    {
      id: 'assets',
      label: 'Assets & Goals',
      icon: React.createElement(IconCoins, { size: 16 }),
      description: 'Faction resources, assets, and objectives',
      order: 4,
      fields: [
        {
          id: 'faction-resources',
          name: 'resources',
          label: 'Resources',
          type: FormFieldType.TEXTAREA,
          placeholder: 'Describe faction resources (wealth, military, magical, etc.)',
          rows: 3,
          validation: commonValidations.description
        },
        {
          id: 'faction-items',
          name: 'itemIds',
          label: 'Notable Items',
          type: FormFieldType.MULTI_ENTITY_SELECTOR,
          entityType: EntityType.ITEM,
          placeholder: 'Select faction assets and items',
          description: 'Important items, artifacts, or equipment owned by the faction'
        },
        {
          id: 'faction-goals',
          name: 'goals',
          label: 'Goals',
          type: FormFieldType.TEXTAREA,
          placeholder: 'Describe faction goals and objectives',
          rows: 3,
          validation: commonValidations.description
        }
      ]
    },
    {
      id: 'secrets',
      label: 'GM Secrets',
      icon: React.createElement(IconEyeOff, { size: 16 }),
      description: 'Secret information visible only to Game Masters',
      order: 5,
      conditional: (_values: any, context?: FormContext) => {
        return context?.userRole === 'gamemaster' || context?.userRole === 'admin';
      },
      fields: [
        {
          id: 'faction-secret-notes',
          ...commonFields.secretNotes
        },
        {
          id: 'faction-hidden-goals',
          name: 'hiddenGoals',
          label: 'Hidden Goals',
          type: FormFieldType.TEXTAREA,
          placeholder: 'Secret objectives unknown to players',
          rows: 3,
          validation: commonValidations.description
        },
        {
          id: 'faction-secret-resources',
          name: 'secretResources',
          label: 'Secret Resources',
          type: FormFieldType.TEXTAREA,
          placeholder: 'Hidden assets, connections, or capabilities',
          rows: 3,
          validation: commonValidations.description
        }
      ]
    }
  ],
  initialValues: {
    name: '',
    description: '',
    factionType: '',
    motto: '',
    scope: 'local',
    leaderId: null,
    leaderTitle: '',
    memberIds: [],
    headquartersId: null,
    territoryIds: [],
    resources: '',
    itemIds: [],
    goals: '',
    secretNotes: '',
    hiddenGoals: '',
    secretResources: '',
    imageURL: ''
  },
  submitLabel: 'Save Faction',
  cancelLabel: 'Cancel',
  allowDraft: true,
  allowSaveAndNew: true
};

// Registry of all entity form configurations
const entityFormConfigs: Record<EntityType, EntityFormConfig> = {
  [EntityType.FACTION]: factionFormConfig,
  // TODO: Add other entity configurations
  [EntityType.CHARACTER]: {
    entityType: EntityType.CHARACTER,
    title: 'Character',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'char-name', ...commonFields.name },
        { id: 'char-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.LOCATION]: {
    entityType: EntityType.LOCATION,
    title: 'Location',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'loc-name', ...commonFields.name },
        { id: 'loc-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.ITEM]: {
    entityType: EntityType.ITEM,
    title: 'Item',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'item-name', ...commonFields.name },
        { id: 'item-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.EVENT]: {
    entityType: EntityType.EVENT,
    title: 'Event',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'event-name', ...commonFields.name },
        { id: 'event-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.STORY_ARC]: {
    entityType: EntityType.STORY_ARC,
    title: 'Story Arc',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'arc-name', ...commonFields.name },
        { id: 'arc-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.NOTE]: {
    entityType: EntityType.NOTE,
    title: 'Note',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'note-title', ...commonFields.title },
        { id: 'note-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.SESSION]: {
    entityType: EntityType.SESSION,
    title: 'Session',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'session-name', ...commonFields.name },
        { id: 'session-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.CAMPAIGN]: {
    entityType: EntityType.CAMPAIGN,
    title: 'Campaign',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'campaign-name', ...commonFields.name },
        { id: 'campaign-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  },
  [EntityType.WORLD]: {
    entityType: EntityType.WORLD,
    title: 'World',
    tabs: [{
      id: 'basic',
      label: 'Basic Info',
      order: 1,
      fields: [
        { id: 'world-name', ...commonFields.name },
        { id: 'world-desc', ...commonFields.description }
      ]
    }],
    initialValues: {}
  }
};

// Main function to get entity form configuration
export const getEntityFormConfig = (entityType: EntityType): EntityFormConfig => {
  const config = entityFormConfigs[entityType];

  if (!config) {
    throw new Error(`No form configuration found for entity type: ${entityType}`);
  }

  return config;
};

// Helper function to get all available entity types
export const getAvailableEntityTypes = (): EntityType[] => {
  return Object.keys(entityFormConfigs) as EntityType[];
};

// Helper function to validate form configuration
export const validateFormConfig = (config: EntityFormConfig): boolean => {
  // Basic validation
  if (!config.entityType || !config.title || !config.tabs || config.tabs.length === 0) {
    return false;
  }

  // Validate tabs
  for (const tab of config.tabs) {
    if (!tab.id || !tab.label || !tab.fields || tab.fields.length === 0) {
      return false;
    }

    // Validate fields
    for (const field of tab.fields) {
      if (!field.id || !field.name || !field.label || !field.type) {
        return false;
      }
    }
  }

  return true;
};

export default entityFormConfigs;
