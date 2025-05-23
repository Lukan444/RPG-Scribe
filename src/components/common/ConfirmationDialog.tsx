import React from 'react';
import {
  Modal,
  Text,
  Button,
  Group,
  ThemeIcon,
  Stack
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconTrash,
  IconX
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ConfirmationDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'delete' | 'warning' | 'success' | 'info';
  loading?: boolean;
  centered?: boolean;
  size?: string | number;
}

export function ConfirmationDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  type = 'warning',
  loading = false,
  centered = true,
  size = 'md'
}: ConfirmationDialogProps) {
  const { t } = useTranslation(['ui', 'common']);

  // Use translation keys for default values
  const defaultTitle = title || t('ui:modals.titles.confirm');
  const defaultMessage = message || t('common:messages.confirmAction', 'Are you sure you want to proceed with this action?');
  const defaultConfirmLabel = confirmLabel || t('ui:modals.buttons.confirm');
  const defaultCancelLabel = cancelLabel || t('ui:modals.buttons.cancel');
  // Get icon and color based on type
  const getIconAndColor = () => {
    switch (type) {
      case 'delete':
        return { icon: <IconTrash size={20} />, color: 'red' };
      case 'warning':
        return { icon: <IconAlertCircle size={20} />, color: 'yellow' };
      case 'success':
        return { icon: <IconCheck size={20} />, color: 'green' };
      case 'info':
        return { icon: <IconAlertCircle size={20} />, color: 'blue' };
      default:
        return { icon: <IconAlertCircle size={20} />, color: 'yellow' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <ThemeIcon color={color} variant="light">
            {icon}
          </ThemeIcon>
          <Text fw={500}>{defaultTitle}</Text>
        </Group>
      }
      centered={centered}
      size={size}
    >
      <Stack>
        <Text size="sm">{defaultMessage}</Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onClose}
            leftSection={<IconX size={16} />}
            disabled={loading}
          >
            {defaultCancelLabel}
          </Button>
          <Button
            color={color}
            onClick={onConfirm}
            loading={loading}
            leftSection={type === 'delete' ? <IconTrash size={16} /> : <IconCheck size={16} />}
          >
            {defaultConfirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default ConfirmationDialog;