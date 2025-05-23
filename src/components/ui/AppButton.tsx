import React from 'react';
import { Button, ButtonProps } from '@mantine/core';

/**
 * AppButton component - A wrapper around Mantine's Button component with custom styling
 * 
 * This component uses Mantine 8's new props like leftSection and rightSection
 * instead of the deprecated leftIcon and rightIcon props
 */
export interface AppButtonProps extends ButtonProps {
  /** Optional left section content (icon or element) */
  leftSection?: React.ReactNode;
  
  /** Optional right section content (icon or element) */
  rightSection?: React.ReactNode;
  
  /** Button variant */
  variant?: 'filled' | 'outline' | 'light' | 'subtle' | 'transparent' | 'default' | 'white';
}

/**
 * AppButton component
 */
export const AppButton: React.FC<AppButtonProps> = ({
  children,
  leftSection,
  rightSection,
  variant = 'filled',
  color = 'blue',
  ...props
}) => {
  return (
    <Button
      leftSection={leftSection}
      rightSection={rightSection}
      variant={variant}
      color={color}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AppButton;