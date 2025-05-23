// Extended type definitions for Mantine components
import '@mantine/core';

declare module '@mantine/core' {
  interface ComboboxProps {
    /**
     * Function to get the label for the create option
     */
    getCreateLabel?: (query: string) => React.ReactNode;
    
    /**
     * Function to handle creating a new option
     */
    onCreate?: (query: string) => string | null | undefined;
  }
}
