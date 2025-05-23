/**
 * Entity List Empty State
 * 
 * This component provides a standardized empty state for entity lists.
 * It displays a message and an action button.
 */

import React from 'react';
import { Paper, Text, Button, Center, Stack, ThemeIcon, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { EntityType } from '../../../models/EntityType';
import { ENTITY_ICONS, getEntityColor } from '../../../constants/iconConfig';
import { motion } from 'framer-motion';

/**
 * Entity list empty state props
 */
interface EntityListEmptyStateProps {
  entityType: EntityType;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  showIcon?: boolean;
  showAnimation?: boolean;
}

/**
 * Entity list empty state component
 */
export function EntityListEmptyState({
  entityType,
  message,
  actionText,
  onAction,
  showIcon = true,
  showAnimation = true
}: EntityListEmptyStateProps) {
  const IconComponent = ENTITY_ICONS[entityType];
  const color = getEntityColor(entityType);
  
  // Default message and action text
  const defaultMessage = `No ${entityType.toString().toLowerCase()}s found.`;
  const defaultActionText = `Create New ${entityType.toString()}`;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };
  
  // Button animation
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  
  // Render with or without animation
  if (showAnimation) {
    return (
      <Paper withBorder p="xl" radius="md">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Center py="xl">
            <Stack align="center" gap="md">
              {showIcon && (
                <motion.div variants={itemVariants}>
                  <ThemeIcon size={80} radius="md" color={color} variant="light">
                    <IconComponent size={40} />
                  </ThemeIcon>
                </motion.div>
              )}
              
              <motion.div variants={itemVariants}>
                <Text size="xl" fw={500} ta="center">
                  {message || defaultMessage}
                </Text>
              </motion.div>
              
              {onAction && (
                <motion.div
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    size="lg"
                    leftSection={<IconPlus size={20} />}
                    onClick={onAction}
                    color={color}
                    variant="filled"
                    style={{
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {actionText || defaultActionText}
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        border: `2px solid ${color}`,
                        borderRadius: 'inherit',
                        opacity: 0.5
                      }}
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.2, 0.5, 0.2]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </Button>
                </motion.div>
              )}
            </Stack>
          </Center>
        </motion.div>
      </Paper>
    );
  }
  
  // Render without animation
  return (
    <Paper withBorder p="xl" radius="md">
      <Center py="xl">
        <Stack align="center" gap="md">
          {showIcon && (
            <ThemeIcon size={80} radius="md" color={color} variant="light">
              <IconComponent size={40} />
            </ThemeIcon>
          )}
          
          <Text size="xl" fw={500} ta="center">
            {message || defaultMessage}
          </Text>
          
          {onAction && (
            <Button
              size="lg"
              leftSection={<IconPlus size={20} />}
              onClick={onAction}
              color={color}
              variant="filled"
              style={{
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {actionText || defaultActionText}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: `2px solid ${color}`,
                  borderRadius: 'inherit',
                  opacity: 0.5
                }}
              />
            </Button>
          )}
        </Stack>
      </Center>
    </Paper>
  );
}
