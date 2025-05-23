import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  Title,
  Text,
  Tabs,
  LoadingOverlay,
  Alert,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import {
  IconX,
  IconDeviceFloppy,
  IconPlus,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import {
  ModalEntityFormProps,
  EntityFormConfig,
  FormMode,
  FormAction,
  FormActionResult,
  BaseEntity,
  DEFAULT_MODAL_SIZES,
  FormTab,
  FormContext
} from '../../types/forms';
import { getEntityFormConfig } from '../../config/entityFormConfigs';
import { SafeModal } from '../common/SafeModal';

// Form content component to handle tab rendering
interface FormContentProps {
  config: EntityFormConfig;
  form: any;
  context: FormContext;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FormContent: React.FC<FormContentProps> = ({
  config,
  form,
  context,
  activeTab,
  onTabChange
}) => {
  // Filter tabs based on conditional logic
  const visibleTabs = useMemo(() => {
    return config.tabs
      .filter(tab => !tab.conditional || tab.conditional(form.values, context))
      .sort((a, b) => a.order - b.order);
  }, [config.tabs, form.values, context]);

  if (visibleTabs.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="yellow">
        No form tabs are available for the current configuration.
      </Alert>
    );
  }

  return (
    <Tabs value={activeTab} onChange={(value) => onTabChange(value || '')}>
      <Tabs.List>
        {visibleTabs.map((tab) => (
          <Tabs.Tab
            key={tab.id}
            value={tab.id}
            leftSection={tab.icon}
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {visibleTabs.map((tab) => (
        <Tabs.Panel key={tab.id} value={tab.id} pt="md">
          <Stack gap="md">
            {tab.description && (
              <Text size="sm" c="dimmed">
                {tab.description}
              </Text>
            )}

            {/* Tab fields will be rendered here */}
            {tab.fields.map((field) => (
              <div key={field.id}>
                {/* Field components will be implemented in next steps */}
                <Text size="sm" c="dimmed">
                  Field: {field.label} ({field.type})
                </Text>
              </div>
            ))}
          </Stack>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};

// Main modal entity form component
export const ModalEntityForm = <T extends BaseEntity = BaseEntity>({
  entityType,
  entityId,
  worldId,
  campaignId,
  opened,
  onClose,
  onSuccess,
  onError,
  initialValues = {},
  mode = entityId ? FormMode.EDIT : FormMode.CREATE,
  config: customConfig
}: ModalEntityFormProps<T>) => {
  // Translation hook
  const { t } = useTranslation(['ui', 'entities', 'common']);

  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  // Get form configuration
  const config = useMemo(() => {
    const baseConfig = getEntityFormConfig(entityType);
    return customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
  }, [entityType, customConfig]);

  // Initialize form with Mantine form hook
  const form = useForm({
    initialValues: {
      ...config.initialValues,
      ...initialValues
    },
    validate: (values) => {
      const errors: Record<string, string> = {};

      // Validate required fields
      config.tabs.forEach(tab => {
        tab.fields.forEach(field => {
          if (field.required && (!values[field.name] || values[field.name] === '')) {
            errors[field.name] = t('common:validation.required');
          }

          // Apply custom validation if present
          if (field.validation?.custom && values[field.name]) {
            const customError = field.validation.custom(values[field.name], values);
            if (customError) {
              errors[field.name] = customError;
            }
          }
        });
      });

      return errors;
    }
  });

  // Set initial active tab
  useEffect(() => {
    if (config.tabs.length > 0 && !activeTab) {
      const firstVisibleTab = config.tabs
        .filter(tab => !tab.conditional || tab.conditional(form.values))
        .sort((a, b) => a.order - b.order)[0];

      if (firstVisibleTab) {
        setActiveTab(firstVisibleTab.id);
      }
    }
  }, [config.tabs, activeTab, form.values]);

  // Track form dirty state
  useEffect(() => {
    const hasChanges = Object.keys(form.values).some(
      key => form.values[key] !== (initialValues as any)[key]
    );
    setIsDirty(hasChanges);
  }, [form.values, initialValues]);

  // Form context for child components
  const formContext: FormContext = useMemo(() => ({
    entityType,
    mode,
    worldId,
    campaignId,
    values: form.values,
    errors: Object.fromEntries(
      Object.entries(form.errors).map(([key, value]) => [key, String(value)])
    ),
    isSubmitting: loading,
    isDirty
  }), [entityType, mode, worldId, campaignId, form.values, form.errors, loading, isDirty]);

  // Handle form submission
  const handleSubmit = async (action: FormAction) => {
    if (!form.isValid()) {
      notifications.show({
        title: t('common:status.error'),
        message: t('common:messages.saveError'),
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual entity save logic
      // This will be connected to the existing services
      const result: FormActionResult = {
        success: true,
        action,
        entity: { id: entityId || 'new-id', ...form.values } as T
      };

      notifications.show({
        title: t('common:status.success'),
        message: t(`entities:messages.${mode === FormMode.CREATE ? 'created' : 'updated'}`, {
          entityType: t(`entities:types.${entityType}`)
        }),
        color: 'green',
        icon: <IconCheck size={16} />
      });

      if (onSuccess) {
        onSuccess(result.entity as T);
      }

      // Handle different actions
      switch (action) {
        case FormAction.SAVE_AND_CLOSE:
          onClose();
          break;
        case FormAction.SAVE_AND_NEW:
          form.reset();
          setIsDirty(false);
          break;
        default:
          // Just save, keep form open
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';

      notifications.show({
        title: t('common:status.error'),
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close with unsaved changes check
  const handleClose = () => {
    if (isDirty) {
      // TODO: Add confirmation dialog for unsaved changes
      // For now, just close
    }
    onClose();
  };

  // Generate modal title
  const modalTitle = t(`ui:modals.titles.${mode}`, {
    entityType: t(`entities:types.${entityType}`)
  });

  return (
    <SafeModal
      opened={opened}
      onClose={handleClose}
      title={
        <Group justify="space-between" w="100%">
          <Title order={3}>{modalTitle}</Title>
          {isDirty && (
            <Tooltip label={t('ui:notifications.warning.unsavedChanges')}>
              <IconDeviceFloppy size={16} color="orange" />
            </Tooltip>
          )}
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={!isDirty}
      closeOnEscape={!isDirty}
      withCloseButton={true}
    >
      <LoadingOverlay visible={loading} />

      <form onSubmit={form.onSubmit(() => handleSubmit(FormAction.SAVE))}>
        <Stack gap="md">
          {/* Form content with tabs */}
          <FormContent
            config={config}
            form={form}
            context={formContext}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Action buttons */}
          <Group justify="flex-end" mt="xl">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              {t('ui:modals.buttons.cancel')}
            </Button>

            {config.allowDraft && (
              <Button
                variant="light"
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={() => handleSubmit(FormAction.SAVE_DRAFT)}
                disabled={loading}
              >
                {t('common:actions.save')} {t('common:status.draft')}
              </Button>
            )}

            <Button
              variant="light"
              onClick={() => handleSubmit(FormAction.SAVE)}
              disabled={loading}
            >
              {t('ui:modals.buttons.save')}
            </Button>

            <Button
              type="submit"
              leftSection={<IconCheck size={16} />}
              disabled={loading}
            >
              {t('ui:modals.buttons.saveAndClose')}
            </Button>

            {config.allowSaveAndNew && mode === FormMode.CREATE && (
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => handleSubmit(FormAction.SAVE_AND_NEW)}
                disabled={loading}
              >
                {t('ui:modals.buttons.saveAndNew')}
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </SafeModal>
  );
};

export default ModalEntityForm;
