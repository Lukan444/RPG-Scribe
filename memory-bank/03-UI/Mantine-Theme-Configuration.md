# Mantine Theme Configuration for RPG Archivist

## Overview

This document outlines the theme configuration for the RPG Archivist application using Mantine. It provides detailed information about colors, typography, spacing, and other theme variables to ensure a consistent visual design across the application.

## Theme Setup

The theme is configured using Mantine's `createTheme` function and applied to the application using the `MantineProvider` component.

```tsx
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { theme } from './theme/theme';
import App from './App';

// Import Mantine styles
import '@mantine/core/styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ColorSchemeScript />
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);
```

## Color Palette

The color palette is based on the design specifications from the UI Design Master Plan, with teal/turquoise as the primary accent color and gold/amber as the secondary accent.

```tsx
// src/theme/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

// Primary accent: Teal/turquoise
const teal: MantineColorsTuple = [
  '#e6fcfc', // 0
  '#d0f7f7', // 1
  '#a3efef', // 2
  '#71e7e7', // 3
  '#4ce0e0', // 4
  '#35dcdc', // 5
  '#1A9B9B', // 6 - Primary
  '#0e7a7a', // 7
  '#006666', // 8
  '#004d4d'  // 9
];

// Secondary accent: Gold/amber
const amber: MantineColorsTuple = [
  '#fff8e1', // 0
  '#ffecb3', // 1
  '#ffe082', // 2
  '#ffd54f', // 3
  '#ffca28', // 4
  '#ffc107', // 5
  '#F6AD55', // 6 - Secondary
  '#ff8f00', // 7
  '#ff6f00', // 8
  '#ff5722'  // 9
];

// Success, warning, error colors
const success: MantineColorsTuple = [
  '#e6f7ef', // 0
  '#c3ecd7', // 1
  '#9ddebf', // 2
  '#74d1a7', // 3
  '#48BB78', // 4 - Success
  '#38a169', // 5
  '#2f855a', // 6
  '#276749', // 7
  '#1e5438', // 8
  '#153e27'  // 9
];

const warning: MantineColorsTuple = [
  '#fff8e1', // 0
  '#ffecb3', // 1
  '#ffe082', // 2
  '#ffd54f', // 3
  '#F6AD55', // 4 - Warning
  '#ed8936', // 5
  '#dd6b20', // 6
  '#c05621', // 7
  '#9c4221', // 8
  '#7b341e'  // 9
];

const error: MantineColorsTuple = [
  '#fee2e2', // 0
  '#fecaca', // 1
  '#fca5a5', // 2
  '#f87171', // 3
  '#F56565', // 4 - Error
  '#ef4444', // 5
  '#dc2626', // 6
  '#b91c1c', // 7
  '#991b1b', // 8
  '#7f1d1d'  // 9
];

// Background colors
const dark: MantineColorsTuple = [
  '#C1C2C5', // 0
  '#A6A7AB', // 1
  '#909296', // 2
  '#5c5f66', // 3
  '#373A40', // 4
  '#2C2E33', // 5
  '#1A2233', // 6 - Secondary Background
  '#141517', // 7
  '#101113', // 8
  '#0D1117'  // 9 - Primary Background
];
```

## Theme Configuration

The theme configuration includes colors, typography, spacing, and component defaults.

```tsx
export const theme = createTheme({
  // Color configuration
  colors: {
    teal,
    amber,
    success,
    warning,
    error,
    dark,
  },
  
  // Primary color and shade
  primaryColor: 'teal',
  primaryShade: 6,
  
  // Typography
  fontFamily: 'Inter, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, monospace',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
  },
  
  // Border radius
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '32px',
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  
  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Component defaults
  components: {
    // Button component defaults
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    
    // Card component defaults
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
        p: 'md',
      },
    },
    
    // TextInput component defaults
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    
    // Select component defaults
    Select: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    
    // Tabs component defaults
    Tabs: {
      defaultProps: {
        radius: 'md',
      },
    },
    
    // Modal component defaults
    Modal: {
      defaultProps: {
        radius: 'md',
        shadow: 'xl',
        centered: true,
      },
    },
  },
  
  // Custom theme variables
  other: {
    surface: {
      DEFAULT: '#0D1117',
      light: '#1A2233'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0'
    },
  }
});
```

## Dark Mode Configuration

The application uses dark mode as the default and primary design, as specified in the UI Design Master Plan.

```tsx
// src/theme/theme.ts
export const theme = createTheme({
  // ... other theme configuration
  
  // Dark mode configuration
  colorScheme: 'dark',
  defaultRadius: 'md',
  
  // Dark mode colors
  colors: {
    // ... color definitions
    
    // Dark mode specific colors
    dark: [
      '#C1C2C5', // 0
      '#A6A7AB', // 1
      '#909296', // 2
      '#5c5f66', // 3
      '#373A40', // 4
      '#2C2E33', // 5
      '#1A2233', // 6 - Secondary Background
      '#141517', // 7
      '#101113', // 8
      '#0D1117'  // 9 - Primary Background
    ],
  },
});
```

## CSS Variables

The theme configuration generates CSS variables that can be used throughout the application.

```css
/* Example of generated CSS variables */
:root {
  --mantine-color-teal-0: #e6fcfc;
  --mantine-color-teal-1: #d0f7f7;
  --mantine-color-teal-2: #a3efef;
  --mantine-color-teal-3: #71e7e7;
  --mantine-color-teal-4: #4ce0e0;
  --mantine-color-teal-5: #35dcdc;
  --mantine-color-teal-6: #1A9B9B;
  --mantine-color-teal-7: #0e7a7a;
  --mantine-color-teal-8: #006666;
  --mantine-color-teal-9: #004d4d;
  
  --mantine-color-amber-6: #F6AD55;
  
  --mantine-color-dark-9: #0D1117;
  --mantine-color-dark-6: #1A2233;
  
  --mantine-primary-color-0: var(--mantine-color-teal-0);
  --mantine-primary-color-1: var(--mantine-color-teal-1);
  --mantine-primary-color-2: var(--mantine-color-teal-2);
  --mantine-primary-color-3: var(--mantine-color-teal-3);
  --mantine-primary-color-4: var(--mantine-color-teal-4);
  --mantine-primary-color-5: var(--mantine-color-teal-5);
  --mantine-primary-color-6: var(--mantine-color-teal-6);
  --mantine-primary-color-7: var(--mantine-color-teal-7);
  --mantine-primary-color-8: var(--mantine-color-teal-8);
  --mantine-primary-color-9: var(--mantine-color-teal-9);
  
  --mantine-radius-xs: 2px;
  --mantine-radius-sm: 4px;
  --mantine-radius-md: 8px;
  --mantine-radius-lg: 16px;
  --mantine-radius-xl: 32px;
  
  --mantine-spacing-xs: 0.5rem;
  --mantine-spacing-sm: 0.75rem;
  --mantine-spacing-md: 1rem;
  --mantine-spacing-lg: 1.5rem;
  --mantine-spacing-xl: 2rem;
}
```

## Using Theme Variables in Components

Theme variables can be accessed in components using the `useMantineTheme` hook or through CSS variables.

```tsx
// Using useMantineTheme hook
import { useMantineTheme } from '@mantine/core';

function MyComponent() {
  const theme = useMantineTheme();
  
  return (
    <div style={{ color: theme.colors.teal[6] }}>
      Themed component
    </div>
  );
}

// Using CSS variables
function MyComponent() {
  return (
    <div style={{ color: 'var(--mantine-color-teal-6)' }}>
      Themed component
    </div>
  );
}
```

## Visual Effects

The theme includes visual effects as specified in the UI Design Master Plan.

### Glow Effects

Glow effects are implemented using box-shadow with the teal accent color.

```tsx
// Example of a component with glow effect
function GlowingButton() {
  return (
    <Button
      sx={{
        '&:hover': {
          boxShadow: '0 0 15px rgba(26, 155, 155, 0.5)',
        },
      }}
    >
      Glowing Button
    </Button>
  );
}
```

### Card Design

Cards follow the design specifications with rounded corners, subtle borders, and clean layouts.

```tsx
// Example of a card component
function EntityCard() {
  return (
    <Card radius="md" withBorder p="md">
      <Card.Section p="md" bg="dark.6">
        <Title order={4}>Card Title</Title>
      </Card.Section>
      <Text mt="md">Card content with clean, information-dense layout.</Text>
    </Card>
  );
}
```

## Responsive Design

The theme includes responsive design considerations for different screen sizes.

```tsx
// Example of responsive layout
function ResponsiveLayout() {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <Card>Column 1</Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <Card>Column 2</Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <Card>Column 3</Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <Card>Column 4</Card>
      </Grid.Col>
    </Grid>
  );
}
```

## Conclusion

This theme configuration provides a comprehensive foundation for the RPG Archivist application using Mantine. By following these guidelines, developers can create a consistent and visually appealing user interface that aligns with the design specifications in the UI Design Master Plan.
